import { after, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { escapeTelegramHtml, sanitizeApplicationInput } from "@/lib/application-input";
import { autoAssigneeFor, canonicalRefCode, DEFAULT_ASSIGNEE_KEY, normalizeRefCode, resolveRefOwner } from "@/lib/hr-ref-codes";
import { HR_ROLES, type HrRole } from "@/lib/hr-permissions";
import { notifyCandidate } from "@/lib/hr-notify";
import { clientIp, createLimiter } from "@/lib/hr-rate-limit";
import { candidatePushPayload } from "@/lib/hr-push-payload";
import { sendApplicationAck, sendDuplicateRejection } from "@/lib/hr-auto-ack-send";
import {
  classifyDuplicate,
  duplicateNoticeLine,
  firstReferral,
  formatDateVnShort,
  referralDecision,
} from "@/lib/hr-duplicates";
import { loadPriorApps, loadReferrers, notifyDuplicate, ownerKeyFor } from "@/lib/hr-duplicate-io";
import { loadNotifyStaff } from "@/lib/hr-notify";

// CV hợp lệ = file đã upload qua /api/applications/upload-cv (R2 public base).
function cvHost() {
  try {
    return new URL(process.env.R2_PUBLIC_BASE_URL ?? "").hostname;
  } catch {
    return "cdn.tdgamestudio.com";
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tối đa 5 đơn / IP / giờ (in-memory) — form công khai không được thành máy phát mail. */
const applyLimiter = createLimiter(5, 3600_000);

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Chỉ nhận đúng các trường của form — không insert nguyên body (người ngoài tự đặt status, ai_score…).
  const parsed = sanitizeApplicationInput(body, cvHost());
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.data;
  const { job_id, full_name, email, work_type } = input;

  const ip = clientIp(request.headers);
  if (!applyLimiter.tryHit(ip)) {
    return NextResponse.json({ error: "Bạn đã gửi quá nhiều đơn, vui lòng thử lại sau" }, { status: 429 });
  }

  const [{ data: staff, error: staffErr }, job, st, def, priors, referrers] = await Promise.all([
    supabase.from("hr_users").select("id, role, ref_codes, display_name").eq("disabled", false),
    supabase.from("jobs").select("leader_user_id, title").eq("id", job_id).maybeSingle(),
    supabase.from("application_statuses").select("key, position, kind, label"),
    supabase.from("app_settings").select("value").eq("key", DEFAULT_ASSIGNEE_KEY).maybeSingle(),
    loadPriorApps(String(email), input.phone ? String(input.phone) : null),
    loadReferrers(),
  ]);
  const activeStaff = staffErr
    ? []
    : ((staff ?? []) as { id: string; role: HrRole; ref_codes: string[] | null; display_name: string | null }[]);

  // Ứng viên trùng (spec 2026-11-03): phân loại so với hồ sơ cũ + quyền giới thiệu 6 tháng cho người đầu tiên.
  // `priors` null (lỗi đọc / migration chưa áp) → nhận đơn như cũ.
  const now = new Date().toISOString();
  const jobTitleNow = (job.data as { title?: string | null } | null)?.title ?? null;
  const who = { email: String(email), phone: input.phone ? String(input.phone) : null, now };
  const dup = priors ? classifyDuplicate({ ...who, job_id: String(job_id), job_title: jobTitleNow }, priors) : null;
  const first = priors ? firstReferral(who, priors) : null;
  const submittedCode = normalizeRefCode(input.referred_by);
  const submittedOwnerKey = ownerKeyFor(submittedCode, activeStaff, referrers);
  const refDecision = referralDecision({
    dupKind: dup?.kind ?? null,
    submittedOwnerKey,
    firstOwnerKey: first ? ownerKeyFor(first.referred_by, activeStaff, referrers) : null,
  });
  if (refDecision.overwrite) input.referred_by = first!.referred_by;
  // B có tài khoản /hr còn hoạt động → được tag trực tiếp, không cần HR báo tay.
  const bHasAccount =
    !!submittedOwnerKey?.startsWith("u:") && activeStaff.some((u) => `u:${u.id}` === submittedOwnerKey);
  const needsManualNotice = !!refDecision.notify && !bHasAccount;

  // Mã ref: chuẩn hoá; khớp mã của tài khoản /hr (chưa khoá) → lưu mã chính + giao người đó support.
  // Không khớp (ref của người chưa có tài khoản / không có ref) → giao "người support mặc định" (cài đặt),
  // mã ref GIỮ NGUYÊN để tính hoa hồng người giới thiệu.
  // Lỗi đọc (vd. migration chưa áp) → coi như không khớp, vẫn nhận hồ sơ.
  const ref = normalizeRefCode(input.referred_by);
  let assigneeId: string | null = null;
  input.referred_by = ref;
  const canCheckScope = !job.error && !st.error;
  const statuses = (st.data ?? []).map((r) => ({
    key: String(r.key),
    position: Number(r.position),
    kind: r.kind as "open" | "won" | "lost",
  }));
  const leaderId = (job.data as { leader_user_id: string | null } | null)?.leader_user_id ?? null;
  // Chỉ giao khi người đó xem được hồ sơ mới (status "new" của job này).
  const assignable = (u: { id: string; role: HrRole } | null) =>
    u && canCheckScope && (HR_ROLES as readonly string[]).includes(u.role)
      ? autoAssigneeFor(u, { job_id: String(job_id), status: "new" }, statuses, leaderId)
      : null;
  if (ref) {
    const owner = resolveRefOwner(ref, activeStaff);
    if (owner) {
      input.referred_by = canonicalRefCode(owner) ?? ref;
      assigneeId = assignable(owner);
    }
  }
  if (!assigneeId && !def.error && def.data?.value) {
    assigneeId = assignable(activeStaff.find((u) => u.id === def.data!.value) ?? null);
  }
  // Người nộp lại → ưu tiên người phụ trách hồ sơ cũ (nắm lịch sử), nếu còn hoạt động và xem được đơn mới.
  const priorAssignee = dup?.prior.assignee_user_id ? activeStaff.find((u) => u.id === dup.prior.assignee_user_id) ?? null : null;
  assigneeId = assignable(priorAssignee) ?? assigneeId;

  const autoRejected = dup?.kind === "auto_rejected";
  // Chỉ gửi cột tuỳ chọn khi có giá trị (không vỡ insert nếu cột chưa có).
  const extra: Record<string, unknown> = {};
  if (assigneeId) extra.assignee_user_id = assigneeId;
  if (dup) {
    extra.duplicate_of = dup.prior.id;
    extra.duplicate_kind = dup.kind;
  }
  if (refDecision.notify && submittedCode) {
    extra.referred_by_submitted = submittedCode;
    if (!needsManualNotice) {
      extra.referrer_notified_at = now;
      extra.referrer_notified_by = "Hệ thống (đã tag trên Discord)";
    }
  }
  if (autoRejected) {
    extra.status = "rejected";
    extra.status_changed_at = now;
    extra.rejection_reason = `Tự động: nộp lại trong 6 tháng sau khi trượt (hồ sơ cũ ngày ${formatDateVnShort(dup!.prior.created_at)})`;
  }

  const { data, error } = await supabase
    .from("applications")
    .insert([{ ...input, ...extra }])
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const statusLabel = (key: string) =>
    String((st.data ?? []).find((r) => String(r.key) === key)?.label ?? key);
  const refName = (code: string | null) => {
    const c = normalizeRefCode(code);
    if (!c) return null;
    const u = resolveRefOwner(c, activeStaff);
    if (u?.display_name?.trim()) return u.display_name.trim();
    return referrers.find((r) => (r.ref_codes ?? []).some((x) => normalizeRefCode(x) === c))?.name ?? null;
  };

  // Đơn tự động từ chối: không mail "Cảm ơn ứng tuyển", không Telegram, không tin "đơn mới" — chỉ mail từ chối lịch sự.
  // Gửi mail trước để tin team nói đúng mail đã đi hay chưa. Lỗi chỉ log.
  const sendRejectMail = async (): Promise<boolean> => {
    try {
      const res = await sendDuplicateRejection({
        applicationId: String(data.id),
        jobId: String(job_id),
        email: String(email),
        fullName: String(full_name),
        supportUserId: dup!.prior.assignee_user_id,
        ip,
        prevAppliedAt: formatDateVnShort(dup!.prior.created_at),
        reapplyFrom: formatDateVnShort(dup!.reapplyFrom!),
        referrerName: refName(dup!.prior.referred_by),
      });
      if (!res.sent) console.log(`[duplicates] mail từ chối bỏ qua (${res.reason}) application ${data.id}`);
      return res.sent;
    } catch (e) {
      console.error("[duplicates] mail từ chối lỗi:", e);
      return false;
    }
  };

  // Báo người giới thiệu mới / team cho đơn trùng (nền) — lỗi chỉ log.
  if (dup && (autoRejected || refDecision.notify)) {
    after(async () => {
      const mailSent = autoRejected ? await sendRejectMail() : false;
      try {
        await notifyDuplicate({
          kind: refDecision.notify ?? "auto_rejected",
          app: { id: String(data.id), full_name: String(full_name), job_id: String(job_id), status: autoRejected ? "rejected" : "new", assignee_user_id: assigneeId },
          jobTitle: jobTitleNow ?? "",
          jobLeaderId: leaderId,
          submittedOwnerKey: refDecision.notify ? submittedOwnerKey : null,
          bHasAccount,
          submittedCode,
          referrers,
          staffCtx: await loadNotifyStaff(),
          prevAppliedAt: formatDateVnShort(dup.prior.created_at),
          reapplyFrom: dup.reapplyFrom ? formatDateVnShort(dup.reapplyFrom) : undefined,
          rejectedAt: dup.rejectedAt ? formatDateVnShort(dup.rejectedAt) : undefined,
          mailSent,
        });
      } catch (e) {
        console.error("[duplicates] báo tin lỗi:", e);
      }
    });
  }

  if (autoRejected) return NextResponse.json({ ok: true, id: data.id });

  const dupLine = dup
    ? duplicateNoticeLine({
        kind: dup.kind,
        jobTitle: dup.prior.job_title ?? "",
        statusLabel: statusLabel(dup.prior.status),
        date: formatDateVnShort(dup.prior.created_at),
      })
    : null;

  // Mail "Cảm ơn ứng tuyển" tự động (nền, sau khi trả lời) — mọi lỗi chỉ log, không ảnh hưởng việc nộp đơn.
  after(async () => {
    try {
      const res = await sendApplicationAck({
        applicationId: String(data.id),
        jobId: String(job_id),
        email: String(email),
        fullName: String(full_name),
        assigneeId,
        ip,
      });
      if (!res.sent) console.log(`[auto-ack] bỏ qua (${res.reason}) application ${data.id}`);
    } catch (e) {
      console.error("[auto-ack] lỗi:", e);
    }
  });

  // Fire-and-forget notifications (Telegram + Discord)
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  (async () => {
    try {
      // Fetch job title once, used by both notifiers
      const { data: job } = await supabase
        .from("jobs")
        .select("title")
        .eq("id", job_id)
        .single();

      const jobTitle = job?.title ?? String(job_id);
      const portfolioUrl = input.portfolio_url ? String(input.portfolio_url) : null;
      const cvUrl = input.cv_url ? String(input.cv_url) : null;
      const phone = input.phone ? String(input.phone) : null;
      const yearsExp = input.years_experience != null ? String(input.years_experience) : null;
      const salary = input.expected_salary ? String(input.expected_salary) : null;
      const rate = input.rate_per_hour ? String(input.rate_per_hour) : null;
      const referredBy = input.referred_by ? String(input.referred_by) : null;
      const h = (v: unknown) => escapeTelegramHtml(String(v));

      // ── Telegram ──────────────────────────────────────────────────
      if (telegramToken && telegramChatId) {
        const lines = [
          `🎯 <b>New Application!</b>`,
          ``,
          `📌 <b>Job:</b> ${h(jobTitle)}`,
          `👤 <b>Name:</b> ${h(full_name)}`,
          `📧 <b>Email:</b> ${h(email)}`,
          phone ? `📞 <b>Phone:</b> ${h(phone)}` : null,
          `🏷 <b>Type:</b> ${h(work_type)}`,
          yearsExp ? `📅 <b>Experience:</b> ${h(yearsExp)} yr(s)` : null,
          salary ? `💰 <b>Expected salary:</b> ${h(salary)}` : null,
          rate ? `💰 <b>Rate/hr:</b> ${h(rate)}` : null,
          portfolioUrl ? `🎨 <b>Portfolio:</b> ${h(portfolioUrl)}` : null,
          cvUrl ? `📎 <b>CV:</b> ${h(cvUrl)}` : null,
          referredBy ? `👥 <b>Referred by:</b> ${h(referredBy)}` : null,
          dupLine ? `\n${h(dupLine)}` : null,
        ].filter(Boolean).join("\n");

        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: telegramChatId, text: lines, parse_mode: "HTML" }),
        });
      }

      // ── Discord (channel: hr) ──────────────────────────────────
      const fields: { name: string; value: string; inline?: boolean }[] = [
        { name: "Position", value: jobTitle, inline: true },
        { name: "Type", value: String(work_type), inline: true },
        { name: "Email", value: String(email), inline: false },
      ];
      if (phone) fields.push({ name: "Phone", value: phone, inline: true });
      if (yearsExp) fields.push({ name: "Experience", value: `${yearsExp} yr(s)`, inline: true });
      if (salary) fields.push({ name: "Expected salary", value: salary, inline: true });
      if (rate) fields.push({ name: "Rate / hr", value: rate, inline: true });
      if (portfolioUrl) fields.push({ name: "Portfolio", value: portfolioUrl, inline: false });
      if (cvUrl) fields.push({ name: "CV", value: `[Download CV](${cvUrl})`, inline: false });
      if (referredBy) fields.push({ name: "🔗 Referred by", value: referredBy, inline: true });

      // Người nhận: Sếp, người phụ trách (chủ mã ref), Leader của job; chưa giao → @everyone + mọi HR.
      await notifyCandidate(String(data.id), { event: "new_application" }, ({ staff }) => {
        const assigneeName = assigneeId ? staff?.staff.find((u) => u.id === assigneeId)?.display_name : null;
        const embedFields = assigneeName
          ? [...fields, { name: "👤 Người phụ trách", value: assigneeName, inline: true }]
          : fields;
        return {
          content: `🎯 **New application for ${jobTitle}** from **${String(full_name)}**${dupLine ? `\n${dupLine}` : ""}`,
          embeds: [
            {
              title: `Application — ${jobTitle}`,
              color: 0xf59e0b,
              fields: embedFields,
              timestamp: new Date().toISOString(),
            },
          ],
          push: candidatePushPayload({
            event: "new_application",
            appId: String(data.id),
            candidateName: String(full_name),
            jobTitle,
            text: referredBy ? `via ${referredBy}` : null,
          }),
          // Người giới thiệu thuộc nhóm apps.view_notes → người thiếu quyền nhận bản không có "via …".
          ...(referredBy
            ? {
                pushPerm: "apps.view_notes" as const,
                pushRestricted: candidatePushPayload({
                  event: "new_application",
                  appId: String(data.id),
                  candidateName: String(full_name),
                  jobTitle,
                }),
              }
            : {}),
        };
      });
    } catch {
      // Silently ignore notification errors — application is already saved
    }
  })();

  return NextResponse.json({ ok: true, id: data.id });
}
