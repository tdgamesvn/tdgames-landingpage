import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import { getHrEmailConfig, isCandidateEmailKind, isValidEmail, resolveRecipient, textToHtml } from "@/lib/hr-email";
import { sendViaResend } from "@/lib/hr-email-send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Lịch sử mail đã gửi cho ứng viên, mới nhất trước. */
export async function GET(request: Request, { params }: Ctx) {
  const authError = await requireHR(request);
  if (authError) return authError;
  const { id } = await params;
  const { data, error } = await getSupabaseAdmin()
    .from("candidate_emails")
    .select("*")
    .eq("application_id", id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ emails: data ?? [] });
}

/**
 * Gửi mail HR đã xác nhận trong hộp thoại: `{ kind, interview_id?, subject, text, sent_by? }`.
 * Người nhận lấy từ DB, chế độ test do env quyết — client không chọn được địa chỉ.
 */
export async function POST(request: Request, { params }: Ctx) {
  const authError = await requireHR(request);
  if (authError) return authError;
  const { id } = await params;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !isCandidateEmailKind(body.kind)) {
    return NextResponse.json({ error: "kind không hợp lệ" }, { status: 400 });
  }
  const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 200) : "";
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 10_000) : "";
  if (!subject || !text) return NextResponse.json({ error: "Thiếu tiêu đề hoặc nội dung" }, { status: 400 });
  const interviewId = typeof body.interview_id === "string" && body.interview_id ? body.interview_id : null;
  const sentBy = typeof body.sent_by === "string" && body.sent_by.trim() ? body.sent_by.trim().slice(0, 80) : null;

  const supabase = getSupabaseAdmin();
  const { data: app } = await supabase.from("applications").select("id, email").eq("id", id).maybeSingle();
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isValidEmail(app.email)) return NextResponse.json({ error: "Ứng viên chưa có email hợp lệ" }, { status: 400 });

  const cfg = getHrEmailConfig(process.env);
  if (!cfg.apiKey) return NextResponse.json({ error: "RESEND_API_KEY chưa cấu hình" }, { status: 500 });

  const candidateEmail = app.email.trim();
  const r = resolveRecipient(cfg, candidateEmail, subject);
  const html = textToHtml(text);
  const sent = await sendViaResend(cfg, { to: r.to, subject: r.subject, html, text });
  if ("error" in sent) return NextResponse.json({ error: `Gửi thất bại: ${sent.error}` }, { status: 502 });

  const { data, error } = await supabase
    .from("candidate_emails")
    .insert({
      application_id: id,
      interview_id: interviewId,
      kind: body.kind,
      to_email: candidateEmail,
      sent_to: r.to,
      test_mode: r.testMode,
      subject: r.subject,
      body_text: text,
      body_html: html,
      resend_id: sent.id,
      sent_by: sentBy,
    })
    .select()
    .single();
  // Mail đã đi rồi — lỗi ghi log không được báo "gửi thất bại" (HR sẽ gửi lại → trùng).
  if (error) return NextResponse.json({ email: null, warning: `Đã gửi nhưng không lưu được lịch sử: ${error.message}` });
  return NextResponse.json({ email: data });
}
