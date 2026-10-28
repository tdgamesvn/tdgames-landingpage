import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { getHrEmailConfig, isCandidateEmailKind, isValidEmail, resolveRecipient, textToHtml } from "@/lib/hr-email";
import { sendViaResend, resolveCcForApplication } from "@/lib/hr-email-send";
import { redactEmailRow } from "@/lib/hr-scope";
import { NO_OFFER_LETTER, offerFileName, validateOfferLetter, type OfferLetterData } from "@/lib/offer-letter";
import { PdfBusyError, renderOfferLetterPdf } from "@/lib/offer-letter-pdf";
import { loadOfferLetterRow, pdfUserKey } from "@/lib/offer-letter-store";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Lịch sử mail đã gửi cho ứng viên, mới nhất trước. */
export async function GET(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "apps.view_emails");
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const app = await loadScopedApplication(auth.ctx, id).catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data, error } = await getSupabaseAdmin()
    .from("candidate_emails")
    .select("id, application_id, interview_id, kind, to_email, sent_to, cc_emails, test_mode, subject, body_text, body_html, resend_id, sent_by, created_at, attachments")
    .eq("application_id", id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Gỡ liên hệ / token test khỏi từng dòng theo quyền (xem redactEmailRow).
  const emails = (data ?? []).map((r) => redactEmailRow(r, auth.ctx.perms));
  return NextResponse.json({ emails });
}

/**
 * Gửi mail HR đã xác nhận trong hộp thoại: `{ kind, interview_id?, subject, text, sent_by? }`.
 * Người nhận lấy từ DB, chế độ test do env quyết — client không chọn được địa chỉ.
 */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request);
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  const { id } = await params;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !isCandidateEmailKind(body.kind)) {
    return NextResponse.json({ error: "kind không hợp lệ" }, { status: 400 });
  }
  const kind = body.kind;
  if (!ctx.perms.has(kind === "offer" ? "emails.send_offer" : "emails.send")) {
    return NextResponse.json({ error: "Bạn không có quyền làm việc này" }, { status: 403 });
  }
  // Mail bài test chứa link test → cần cả quyền xem test (khớp với draft).
  if (kind === "test_assignment" && !ctx.perms.has("apps.view_tests")) {
    return NextResponse.json({ error: "Bạn không có quyền làm việc này" }, { status: 403 });
  }
  const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 200) : "";
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 10_000) : "";
  if (!subject || !text) return NextResponse.json({ error: "Thiếu tiêu đề hoặc nội dung" }, { status: 400 });
  const interviewId = typeof body.interview_id === "string" && body.interview_id ? body.interview_id : null;

  const app = await loadScopedApplication(ctx, id, "id, email, job_id").catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const appEmail = typeof app.email === "string" ? app.email : null;
  if (!isValidEmail(appEmail)) return NextResponse.json({ error: "Ứng viên chưa có email hợp lệ" }, { status: 400 });

  const cfg = getHrEmailConfig(process.env);
  if (!cfg.apiKey) return NextResponse.json({ error: "RESEND_API_KEY chưa cấu hình" }, { status: 500 });

  // Mail offer: PDF thư mời sinh từ dữ liệu ĐÃ LƯU (không nhận từ client), đính kèm qua Resend.
  let offerAttachment: { filename: string; content: string; snapshot: OfferLetterData } | null = null;
  if (kind === "offer") {
    let letter;
    try {
      letter = await loadOfferLetterRow(id);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Không đọc được thư mời" }, { status: 500 });
    }
    if (!letter) return NextResponse.json({ error: NO_OFFER_LETTER }, { status: 400 });
    const invalid = validateOfferLetter(letter.data);
    if (invalid) return NextResponse.json({ error: `Thư mời nhận việc chưa đủ: ${invalid}` }, { status: 400 });
    try {
      const pdf = await renderOfferLetterPdf(letter.data, pdfUserKey(ctx));
      offerAttachment = { filename: offerFileName(letter.data.candidateName), content: pdf.toString("base64"), snapshot: letter.data };
    } catch (e) {
      if (e instanceof PdfBusyError) return NextResponse.json({ error: e.message }, { status: 429 });
      console.error("[offer-letter] render PDF khi gửi lỗi:", e);
      return NextResponse.json({ error: "Không tạo được PDF thư mời" }, { status: 500 });
    }
  }

  // CC: server tính; client chỉ được bớt người (tập con của ccPreview), địa chỉ lạ bị bỏ im lặng.
  let resolved: { cc: string[]; ccPreview: string[] };
  try {
    resolved = await resolveCcForApplication(cfg, kind, ctx, (app.job_id as string | null) ?? null);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không đọc được danh sách CC" }, { status: 500 });
  }
  const wanted = Array.isArray(body.cc)
    ? new Set(body.cc.filter((x): x is string => typeof x === "string").map((x) => x.trim().toLowerCase()))
    : null;
  const keep = (list: string[]) => (wanted ? list.filter((e) => wanted.has(e)) : list);
  const cc = keep(resolved.cc);

  const candidateEmail = (appEmail as string).trim();
  const r = resolveRecipient(cfg, candidateEmail, subject);
  const html = textToHtml(text);
  const sent = await sendViaResend(cfg, {
    to: r.to,
    subject: r.subject,
    html,
    text,
    cc,
    ...(offerAttachment ? { attachments: [{ filename: offerAttachment.filename, content: offerAttachment.content }] } : {}),
  });
  if ("error" in sent) return NextResponse.json({ error: `Gửi thất bại: ${sent.error}` }, { status: 502 });

  const { data, error } = await getSupabaseAdmin()
    .from("candidate_emails")
    .insert({
      application_id: id,
      interview_id: interviewId,
      kind,
      to_email: candidateEmail,
      sent_to: r.to,
      cc_emails: cc,
      test_mode: r.testMode,
      subject: r.subject,
      body_text: text,
      body_html: html,
      resend_id: sent.id,
      sent_by: ctx.user.displayName,
      sent_by_user_id: ctx.user.id,
      // Chỉ ghi cột khi có file (mail loại khác không phụ thuộc cột mới).
      ...(offerAttachment
        ? { attachments: [{ filename: offerAttachment.filename, kind: "offer_letter", snapshot: offerAttachment.snapshot }] }
        : {}),
    })
    .select()
    .single();
  // Mail đã đi rồi — lỗi ghi log không được báo "gửi thất bại" (HR sẽ gửi lại → trùng).
  if (error) return NextResponse.json({ email: null, cc_preview: resolved.ccPreview, warning: `Đã gửi nhưng không lưu được lịch sử: ${error.message}` });
  return NextResponse.json({ email: redactEmailRow(data, ctx.perms), cc_preview: resolved.ccPreview });
}
