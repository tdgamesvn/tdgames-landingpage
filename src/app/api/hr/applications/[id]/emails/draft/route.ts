import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { newTestToken } from "@/lib/hr-tests";
import { resolveCcForApplication } from "@/lib/hr-email-send";
import { buildDraft, getHrEmailConfig, isCandidateEmailKind, isValidEmail } from "@/lib/hr-email";

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
    .select("id, email, full_name, job_id, test_token, mbti_type, mbti_url, jobs(title)")
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
  const draft = buildDraft({
    kind,
    candidateName: app.full_name ?? "",
    jobTitle: job?.title ?? "",
    interview,
    prevScheduledAt,
    testUrl,
    hasMbti: Boolean(app.mbti_type || app.mbti_url),
    offer: kind === "offer" ? { salary: url.searchParams.get("salary")?.slice(0, 100) ?? "", startDate: url.searchParams.get("start_date")?.slice(0, 100) ?? "" } : null,
  }, template);
  let ccPreview: string[];
  try {
    ccPreview = (await resolveCcForApplication(cfg, kind, auth.ctx, (app.job_id as string | null) ?? null)).ccPreview;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không đọc được danh sách CC" }, { status: 500 });
  }

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
    last_sent_at: last?.created_at ?? null,
  });
}
