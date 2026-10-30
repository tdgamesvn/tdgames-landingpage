import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { newTestToken } from "@/lib/hr-tests";
import { resolveCcForApplication } from "@/lib/hr-email-send";
import { buildDraft, getHrEmailConfig, isCandidateEmailKind, isSystemOnlyKind, isValidEmail, type DraftInput } from "@/lib/hr-email";
import { holdReplyBy } from "@/lib/hr-email-base";
import { NO_OFFER_LETTER, offerDraftFields, offerFileName, validateOfferLetter } from "@/lib/offer-letter";
import { loadOfferContact, loadOfferLetterRow, approvalForClient } from "@/lib/offer-letter-store";
import { canSendOffer, OFFER_NOT_APPROVED } from "@/lib/offer-letter-approval";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const SITE = "https://tdgamestudio.com";

/**
 * Bản nháp mail cho hộp thoại xác nhận. Không gửi gì.
 * Lỗi nghiệp vụ trả 200 `{ error, message }` để UI quyết định (vd. no_test → chỉ báo nhỏ).
 */
export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  // Xác thực một lần, rồi kiểm quyền GỬI theo kind (nháp không cần apps.view_emails — đó là quyền xem lịch sử).
  const auth = await requireHrUser(request);
  if ("response" in auth) return auth.response;
  if (!isCandidateEmailKind(kind)) return NextResponse.json({ error: "kind không hợp lệ" }, { status: 400 });
  if (isSystemOnlyKind(kind)) return NextResponse.json({ error: "Loại mail này chỉ hệ thống tự động gửi" }, { status: 400 });
  const forbidden = () => NextResponse.json({ error: "Bạn không có quyền làm việc này" }, { status: 403 });
  if (!auth.ctx.perms.has(kind === "offer" ? "emails.send_offer" : "emails.send")) return forbidden();
  // Nháp bài test tạo token + lộ link test → cần thêm quyền xem test, kiểm TRƯỚC khi tạo token.
  if (kind === "test_assignment" && !auth.ctx.perms.has("apps.view_tests")) return forbidden();
  const scoped = await loadScopedApplication(auth.ctx, id).catch(() => undefined);
  if (scoped === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!scoped) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const interviewId = url.searchParams.get("interview_id");
  const prevScheduledAt = url.searchParams.get("prev_scheduled_at");

  const supabase = getSupabaseAdmin();
  const { data: app } = await supabase
    .from("applications")
    .select("id, email, full_name, job_id, assignee_user_id, test_token, mbti_type, mbti_url, jobs(title)")
    .eq("id", id)
    .maybeSingle();
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cfg = getHrEmailConfig(process.env);
  const meta = { mode: cfg.mode, test_to: cfg.testTo };
  const fail = (error: string, message: string) => NextResponse.json({ ...meta, error, message });

  if (!isValidEmail(app.email)) return fail("no_email", "Ứng viên chưa có email hợp lệ.");

  let interview = null;
  if (kind === "interview_invite" || kind === "interview_reschedule" || kind === "interview_cancel") {
    if (interviewId) {
      const { data: s } = await supabase
        .from("interview_sessions")
        .select("id, round, scheduled_at, mode, meet_url")
        .eq("id", interviewId)
        .eq("application_id", id)
        .maybeSingle();
      if (s?.scheduled_at) {
        interview = { scheduledAt: s.scheduled_at, mode: s.mode, meetUrl: s.meet_url, round: s.round ?? 1 };
      }
    }
    if (kind !== "interview_cancel" && !interview) return fail("no_schedule", "Vòng PV này chưa có lịch.");
  }

  let testUrl: string | null = null;
  if (kind === "test_assignment") {
    const { count } = await supabase
      .from("job_tests")
      .select("id", { count: "exact", head: true })
      .eq("job_id", app.job_id);
    if (!count) return fail("no_test", "Job chưa có đề test — chưa gửi mail.");
    let token = app.test_token as string | null;
    if (!token) {
      token = newTestToken();
      const { error } = await supabase.from("applications").update({ test_token: token }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    testUrl = `${SITE}/test/${token}`;
  }

  // Mail offer: bắt buộc đã lưu thư mời nhận việc (PDF đính kèm sinh từ dữ liệu này khi gửi).
  let offer: DraftInput["offer"] = null;
  let attachment: { filename: string } | null = null;
  let approval: ReturnType<typeof approvalForClient> | null = null;
  // Thông báo nhỏ cho hộp thoại mail (vd. hạn xác nhận đã qua nên đã tự đổi).
  let notice: string | null = null;
  if (kind === "offer") {
    let letter;
    let contact: string;
    try {
      [letter, contact] = await Promise.all([loadOfferLetterRow(id), loadOfferContact(auth.ctx)]);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Không đọc được thư mời" }, { status: 500 });
    }
    if (!letter) return NextResponse.json({ ...meta, error: NO_OFFER_LETTER, code: "no_offer_letter" }, { status: 400 });
    const invalid = validateOfferLetter(letter.data);
    if (invalid) {
      return NextResponse.json({ ...meta, error: `Thư mời nhận việc chưa đủ: ${invalid}`, code: "offer_letter_invalid" }, { status: 400 });
    }
    // Sếp phải duyệt thư trước khi soạn/gửi mail offer.
    if (!canSendOffer(letter.approval.status)) {
      return NextResponse.json(
        { ...meta, error: OFFER_NOT_APPROVED, code: "offer_not_approved", approval: approvalForClient(letter.approval) },
        { status: 400 },
      );
    }
    approval = approvalForClient(letter.approval);
    const f = offerDraftFields(letter.data, contact, new Date());
    offer = f.fields;
    notice = f.notice;
    attachment = { filename: offerFileName(letter.data.candidateName) };
  }

  const job = (Array.isArray(app.jobs) ? app.jobs[0] : app.jobs) as { title?: string } | null;
  // Mẫu HR đã sửa (nếu có). Lỗi đọc → dùng mẫu mặc định, không chặn việc soạn mail.
  let template: { subject: string; body: string } | null = null;
  {
    const { data: t, error: tErr } = await supabase
      .from("hr_email_templates")
      .select("subject, body")
      .eq("kind", kind)
      .maybeSingle();
    if (tErr) console.error("draft: đọc hr_email_templates lỗi, dùng mẫu mặc định:", tErr.message);
    else if (t) template = { subject: String(t.subject), body: String(t.body) };
  }
  let ccPreview: string[];
  let ccFixed: string[];
  let replyTo: string[];
  let support: DraftInput["support"];
  try {
    const r = await resolveCcForApplication(cfg, kind, auth.ctx, {
      jobId: (app.job_id as string | null) ?? null,
      assigneeId: (app.assignee_user_id as string | null) ?? null,
    });
    ccPreview = r.ccPreview;
    ccFixed = r.fixed;
    replyTo = r.replyTo;
    support = r.support;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không đọc được danh sách CC" }, { status: 500 });
  }
  // Chữ ký cuối mail = người support (tên + SĐT) + hiring@.
  const draft = buildDraft({
    kind,
    candidateName: app.full_name ?? "",
    jobTitle: job?.title ?? "",
    support,
    interview,
    prevScheduledAt,
    testUrl,
    hasMbti: Boolean(app.mbti_type || app.mbti_url),
    offer,
    // Mail "Hồ sơ đang được xem xét": hẹn phản hồi = hôm nay (giờ VN) + 14 ngày.
    replyBy: kind === "on_hold" ? holdReplyBy(new Date()) : null,
  }, template);

  const { data: last } = await supabase
    .from("candidate_emails")
    .select("created_at")
    .eq("application_id", id)
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    ...meta,
    ...(auth.ctx.perms.has("apps.view_contact") ? { to: app.email } : {}),
    subject: draft.subject,
    text: draft.text,
    cc_preview: ccPreview,
    cc_fixed: ccFixed,
    reply_to: replyTo,
    last_sent_at: last?.created_at ?? null,
    ...(attachment ? { attachment } : {}),
    ...(approval ? { approval } : {}),
    ...(notice ? { notice } : {}),
  });
}
