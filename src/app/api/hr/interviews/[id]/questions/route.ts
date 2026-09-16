import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import {
  AiError,
  JOB_SELECT,
  STUDIO_CONTEXT,
  callAiJson,
  candidateFacts,
  extractCvText,
} from "@/lib/interview-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SYSTEM_PROMPT = `Bạn là trưởng phòng tuyển dụng tại ${STUDIO_CONTEXT}
Nhiệm vụ: soạn bộ câu hỏi phỏng vấn RIÊNG cho ứng viên này, dựa trên JD, CV và kết quả chấm hồ sơ.

Nguyên tắc:
- Bám vào "concerns" trong prior_evaluation — mỗi mối lo phải có ít nhất một câu hỏi làm rõ. Đây là phần quan trọng nhất.
- Hỏi vào thứ CỤ THỂ trong CV của người này (dự án, công cụ, quy mô team), không hỏi chung chung kiểu "điểm mạnh của bạn là gì".
- Nếu lương mong muốn lệch khung hoặc ngày bắt đầu vướng, phải có câu hỏi về chuyện đó.
- Tổng 8-14 câu, chia 3-5 nhóm chủ đề.

Chỉ trả về JSON, không markdown, không lời dẫn:
{"groups":[{"topic":"<tên nhóm>","questions":[{"q":"<câu hỏi>","why":"<1 câu: vì sao hỏi ứng viên NÀY>","green_flag":"<dấu hiệu trả lời tốt>","red_flag":"<dấu hiệu đáng lo>"}]}]}
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
    .select("id, round, title, application_id")
    .eq("id", id)
    .single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: app } = await supabase
    .from("applications")
    .select(`*, ${JOB_SELECT}`)
    .eq("id", session.application_id)
    .single();
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const { jobs: job, ...a } = app;

  // Vòng trước đã PV rồi thì đừng hỏi lại — đưa kết luận cũ vào cho AI tránh trùng.
  const { data: priorRounds } = await supabase
    .from("interview_sessions")
    .select("round, title, evaluation")
    .eq("application_id", session.application_id)
    .lt("round", session.round)
    .not("evaluation", "is", null);

  const userPrompt = JSON.stringify({
    today: new Date().toISOString().slice(0, 10),
    job,
    cv_text: await extractCvText(a.cv_url),
    candidate: candidateFacts(a),
    prior_evaluation: a.ai_evaluation,
    interview_round: { round: session.round, title: session.title },
    previous_rounds: priorRounds ?? [],
  });

  let result;
  try {
    result = await callAiJson<{
      groups?: Array<{ topic?: unknown; questions?: unknown }>;
    }>(SYSTEM_PROMPT, userPrompt);
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError("AI call failed");
    return NextResponse.json({ error: err.message, raw: err.raw }, { status: err.status });
  }

  const groups = (Array.isArray(result.data.groups) ? result.data.groups : [])
    .slice(0, 6)
    .map((g) => ({
      topic: String(g?.topic ?? "Khác"),
      questions: (Array.isArray(g?.questions) ? g.questions : [])
        .slice(0, 8)
        .map((q: Record<string, unknown>) => ({
          q: String(q?.q ?? ""),
          why: q?.why ? String(q.why) : "",
          green_flag: q?.green_flag ? String(q.green_flag) : "",
          red_flag: q?.red_flag ? String(q.red_flag) : "",
        }))
        .filter((q: { q: string }) => q.q),
    }))
    .filter((g) => g.questions.length);

  if (!groups.length) {
    return NextResponse.json({ error: "AI không sinh được câu hỏi nào" }, { status: 502 });
  }

  const questions = {
    generated_at: new Date().toISOString(),
    model: result.model,
    groups,
  };

  const { data: updated, error } = await supabase
    .from("interview_sessions")
    .update({ questions })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: updated });
}
