import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedInterview } from "@/lib/hr-session";
import { redactInterview } from "@/lib/hr-scope";
import {
  AiError,
  JOB_SELECT,
  STUDIO_CONTEXT,
  asStringArray,
  callAiJson,
  candidateFacts,
  HR_SIGNALS_RULES,
  hrSignals,
  clampScore,
  extractCvText,
} from "@/lib/interview-ai";
import { TranscribeError, transcribeFromUrl } from "@/lib/transcribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 800; // gỡ băng file dài rất lâu

const SYSTEM_PROMPT = `Bạn là trưởng phòng tuyển dụng tại ${STUDIO_CONTEXT}
Bạn nhận được: JD, CV, kết quả chấm hồ sơ TRƯỚC phỏng vấn (prior_evaluation), và transcript cuộc phỏng vấn.
Nhiệm vụ: chấm lại ứng viên DỰA TRÊN NHỮNG GÌ THỰC SỰ NÓI trong buổi PV.

Nguyên tắc:
- prior_evaluation chỉ dựa trên giấy tờ. Việc của bạn là xác nhận hoặc bác bỏ nó bằng bằng chứng từ transcript.
- Mỗi ý trong "evidence" và "red_flags" PHẢI trích dẫn hoặc dẫn lại ý ứng viên đã nói. Không có trong transcript thì không được bịa.
- Nếu một mối lo ở prior_evaluation đã được giải toả trong buổi PV, nói rõ. Nếu nó nặng thêm, cũng nói rõ.
- Nếu transcript quá ngắn/thiếu để kết luận, hạ "confidence" xuống "low" và nêu rõ ở summary.
- "fit_confirmed" = true chỉ khi buổi PV củng cố rằng ứng viên hợp vị trí này.

Chỉ trả về JSON, không markdown:
{"score":<0-100>,"verdict":"strong_yes"|"yes"|"maybe"|"no","fit_confirmed":<bool>,"confidence":"high"|"medium"|"low",
"summary":"<2-3 câu kết luận>","score_delta_reason":"<vì sao điểm lệch so với chấm hồ sơ>",
"evidence":["..."],"red_flags":["..."],"follow_ups":["<việc cần làm/hỏi tiếp>"]}
Toàn bộ nội dung viết bằng tiếng Việt.

${HR_SIGNALS_RULES}`;

type RunResult = { ok: true } | { error: string };

/** Gỡ băng (nếu cần) + chấm lại. Chạy nền — kết quả/ lỗi ghi vào interview_sessions. */
async function runAnalysis(id: string): Promise<RunResult> {
  const supabase = getSupabaseAdmin();

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (!session) return { error: "Không tìm thấy vòng PV" };

  // 1. Có transcript rồi thì dùng luôn; chưa có thì gỡ băng từ file ghi âm.
  let transcript: string | null = session.transcript?.trim() || null;
  let transcriptSource: string = session.transcript_source ?? "manual";

  if (!transcript) {
    if (!session.audio_url) {
      return { error: "Chưa có ghi âm và cũng chưa có transcript — upload mp3 hoặc dán transcript trước." };
    }
    try {
      const out = await transcribeFromUrl(session.audio_url);
      transcript = out.text;
      transcriptSource = out.source;
    } catch (e) {
      // Ghi kèm nguyên nhân thật (timeout, lỗi mạng…) — câu chung chung từng che mất lỗi headersTimeout.
      const cause = e instanceof Error ? `${e.message}${(e.cause as { code?: string } | undefined)?.code ? ` (${(e.cause as { code?: string }).code})` : ""}` : String(e);
      if (!(e instanceof TranscribeError)) console.error("[analyze] transcribe failed:", e);
      const err = e instanceof TranscribeError ? e : new TranscribeError(`Gỡ băng thất bại: ${cause}`);
      return { error: err.message };
    }
    // Lưu transcript ngay — gỡ băng đắt, đừng để mất nếu bước chấm điểm lỗi.
    await supabase
      .from("interview_sessions")
      .update({ transcript, transcript_source: transcriptSource })
      .eq("id", id);
  }

  // 2. Chấm lại dựa trên transcript.
  const { data: app } = await supabase
    .from("applications")
    .select(`*, ${JOB_SELECT}`)
    .eq("id", session.application_id)
    .single();
  if (!app) return { error: "Không tìm thấy hồ sơ ứng viên" };

  const { jobs: job, ...a } = app;

  const userPrompt = JSON.stringify({
    today: new Date().toISOString().slice(0, 10),
    job,
    cv_text: await extractCvText(a.cv_url),
    candidate: candidateFacts(a),
    hr_signals: await hrSignals(supabase, a),
    prior_evaluation: a.ai_evaluation,
    interview_round: { round: session.round, title: session.title },
    planned_questions: session.questions?.groups ?? null,
    transcript: transcript.slice(0, 120_000),
  });

  let result;
  try {
    result = await callAiJson<Record<string, unknown>>(SYSTEM_PROMPT, userPrompt, {
      timeoutMs: 180_000,
    });
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError("AI call failed");
    return { error: `AI chấm điểm lỗi: ${err.message}` };
  }

  const p = result.data;
  let score: number;
  try {
    score = clampScore(p.score);
  } catch {
    return { error: "AI trả điểm không hợp lệ" };
  }

  const evaluation = {
    analyzed_at: new Date().toISOString(),
    model: result.model,
    score,
    verdict: ["strong_yes", "yes", "maybe", "no"].includes(String(p.verdict))
      ? String(p.verdict)
      : "maybe",
    fit_confirmed: p.fit_confirmed === true,
    confidence: ["high", "medium", "low"].includes(String(p.confidence))
      ? String(p.confidence)
      : "medium",
    summary: p.summary ? String(p.summary) : "",
    score_delta_reason: p.score_delta_reason ? String(p.score_delta_reason) : "",
    evidence: asStringArray(p.evidence),
    red_flags: asStringArray(p.red_flags),
    follow_ups: asStringArray(p.follow_ups),
    transcript_source: transcriptSource,
    prior_score: a.ai_score ?? null,
  };

  const { error } = await supabase
    .from("interview_sessions")
    .update({
      evaluation,
      score,
      transcript,
      transcript_source: transcriptSource,
      analysis_status: null,
      analysis_error: null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  return { ok: true };
}

/** Quá mốc này mà vẫn "running" thì coi như tiến trình đã chết (restart/deploy) — cho chạy lại. */
const STALE_MS = 20 * 60_000;

/**
 * Bắt đầu phân tích nền, trả 202 ngay. Gỡ băng 40–50 phút + chấm mất vài phút,
 * vượt trần ~100s của Cloudflare (2026-10-26: 502/HTML). Client hỏi lại
 * GET /api/hr/interviews/[id] tới khi analysis_status hết "running".
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireHrUser(request, "interviews.manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const owned = await loadScopedInterview(auth.ctx, id).catch(() => undefined);
  if (owned === undefined) return NextResponse.json({ error: "Không đọc được phiên PV" }, { status: 500 });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = getSupabaseAdmin();

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!session.audio_url && !session.transcript?.trim()) {
    return NextResponse.json(
      { error: "Chưa có ghi âm và cũng chưa có transcript — upload mp3 hoặc dán transcript trước." },
      { status: 400 },
    );
  }

  const startedAt = session.analysis_started_at ? new Date(session.analysis_started_at).getTime() : 0;
  if (session.analysis_status === "running" && Date.now() - startedAt < STALE_MS) {
    return NextResponse.json({ session: redactInterview(session, auth.ctx.perms) }, { status: 202 });
  }

  const { data: running, error } = await supabase
    .from("interview_sessions")
    .update({ analysis_status: "running", analysis_error: null, analysis_started_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Chạy nền trong tiến trình Node (PM2, không phải serverless) — không await.
  void runAnalysis(id)
    .then(async (r) => {
      if ("error" in r) {
        await supabase.from("interview_sessions").update({ analysis_status: "failed", analysis_error: r.error }).eq("id", id);
      }
    })
    .catch(async (e) => {
      console.error("[analyze] background failed:", e);
      await supabase
        .from("interview_sessions")
        .update({ analysis_status: "failed", analysis_error: e instanceof Error ? e.message : "Phân tích thất bại" })
        .eq("id", id);
    });

  return NextResponse.json({ session: redactInterview(running, auth.ctx.perms) }, { status: 202 });
}
