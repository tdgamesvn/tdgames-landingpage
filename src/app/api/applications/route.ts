import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { escapeTelegramHtml, sanitizeApplicationInput } from "@/lib/application-input";
import { autoAssigneeFor, canonicalRefCode, DEFAULT_ASSIGNEE_KEY, normalizeRefCode, resolveRefOwner } from "@/lib/hr-ref-codes";
import { HR_ROLES, type HrRole } from "@/lib/hr-permissions";
import { notifyCandidate } from "@/lib/hr-notify";
import { candidatePushPayload } from "@/lib/hr-push-payload";

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

  // Mã ref: chuẩn hoá; khớp mã của tài khoản /hr (chưa khoá) → lưu mã chính + giao người đó support.
  // Không khớp (ref của người chưa có tài khoản / không có ref) → giao "người support mặc định" (cài đặt),
  // mã ref GIỮ NGUYÊN để tính hoa hồng người giới thiệu.
  // Lỗi đọc (vd. migration chưa áp) → coi như không khớp, vẫn nhận hồ sơ.
  const ref = normalizeRefCode(input.referred_by);
  let assigneeId: string | null = null;
  input.referred_by = ref;
  const [{ data: staff, error: staffErr }, job, st, def] = await Promise.all([
    supabase.from("hr_users").select("id, role, ref_codes").eq("disabled", false),
    supabase.from("jobs").select("leader_user_id").eq("id", job_id).maybeSingle(),
    supabase.from("application_statuses").select("key, position, kind"),
    supabase.from("app_settings").select("value").eq("key", DEFAULT_ASSIGNEE_KEY).maybeSingle(),
  ]);
  const activeStaff = staffErr ? [] : ((staff ?? []) as { id: string; role: HrRole; ref_codes: string[] | null }[]);
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

  const { data, error } = await supabase
    .from("applications")
    // Chỉ gửi assignee_user_id khi có (không vỡ insert nếu cột chưa có và không ai khớp).
    .insert([assigneeId ? { ...input, assignee_user_id: assigneeId } : input])
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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
          content: `🎯 **New application for ${jobTitle}** from **${String(full_name)}**`,
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
