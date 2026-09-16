import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import {
  AiError,
  JOB_SELECT,
  STUDIO_CONTEXT,
  asStringArray,
  callAiJson,
  candidateFacts,
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
Toàn bộ nội dung viết bằng tiếng Việt.`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 1. Có transcript rồi thì dùng luôn; chưa có thì gỡ băng từ file ghi âm.
  let transcript: string | null = session.transcript?.trim() || null;
  let transcriptSource: string = session.transcript_source ?? "manual";

  if (!transcript) {
    if (!session.audio_url) {
      return NextResponse.json(
        { error: "Chưa có ghi âm và cũng chưa có transcript — upload mp3 hoặc dán transcript trước." },
        { status: 400 },
      );
    }
    try {
      const out = await transcribeFromUrl(session.audio_url);
      transcript = out.text;
      transcriptSource = out.source;
    } catch (e) {
      const err = e instanceof TranscribeError ? e : new TranscribeError("Gỡ băng thất bại");
      return NextResponse.json({ error: err.message }, { status: err.status });
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
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const { jobs: job, ...a } = app;

  const userPrompt = JSON.stringify({
    today: new Date().toISOString().slice(0, 10),
    job,
    cv_text: await extractCvText(a.cv_url),
    candidate: candidateFacts(a),
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
    return NextResponse.json({ error: err.message, raw: err.raw }, { status: err.status });
  }

  const p = result.data;
  let score: number;
  try {
    score = clampScore(p.score);
  } catch {
    return NextResponse.json({ error: "AI trả điểm không hợp lệ" }, { status: 502 });
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

  const { data: updated, error } = await supabase
    .from("interview_sessions")
    .update({ evaluation, score, transcript, transcript_source: transcriptSource })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: updated });
}
