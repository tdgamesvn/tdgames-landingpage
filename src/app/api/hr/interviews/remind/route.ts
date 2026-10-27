import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireCronOrHr } from "@/lib/hr-session";
import { discordNotify, getDiscordUrl } from "@/lib/discord-notify";
import { formatInterviewTime, modeLabel } from "@/lib/interview-schedule";
import { sendHrPush } from "@/lib/hr-push";
import { interviewReminderPayload } from "@/lib/hr-push-payload";
import { pushRecipientUserIds } from "@/lib/hr-push-recipients";
import { buildMentions } from "@/lib/hr-discord-mentions";
import { effectivePermissions, HR_ROLES, type HrRole, type PermissionKey } from "@/lib/hr-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cron (.github/workflows/hr-interview-remind.yml) gọi mỗi 15 phút → mỗi vòng PV
// được nhắc 1 lần, khoảng 45–60 phút trước giờ hẹn. Đổi lịch thì reminded_at bị
// reset (PATCH /api/hr/interviews/[id]) nên sẽ nhắc lại theo giờ mới.
const LEAD_MINUTES = 60;

export async function GET(request: Request) {
  const authError = await requireCronOrHr(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const until = new Date(now.getTime() + LEAD_MINUTES * 60_000);

  const { data, error } = await supabase
    .from("interview_sessions")
    .select("id, application_id, round, title, scheduled_at, mode, meet_url, applications(full_name, status, jobs(title, leader_user_id))")
    .is("reminded_at", null)
    .gt("scheduled_at", now.toISOString())
    .lte("scheduled_at", until.toISOString())
    .order("scheduled_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ứng viên đã chốt (offer/reject…) thì thôi nhắc.
  const { data: closed } = await supabase.from("application_statuses").select("key").neq("kind", "open");
  const closedKeys = new Set((closed ?? []).map((s) => s.key));

  type Row = NonNullable<typeof data>[number];
  const one = <T,>(v: T | T[] | null | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  const due = (data ?? []).filter((s: Row) => {
    const app = one(s.applications);
    return app && !closedKeys.has(app.status);
  });

  if (due.length === 0) return NextResponse.json({ sent: 0 });
  const hasDiscord = Boolean(getDiscordUrl("hr"));

  // Người nhận push: tài khoản chưa khoá có quyền push.receive; Leader chỉ nhận PV job mình phụ trách.
  // Lỗi đọc DB → không đẩy ai (fail closed), Discord vẫn chạy.
  const [{ data: userRows, error: usersErr }, { data: permRows, error: permsErr }] = await Promise.all([
    supabase.from("hr_users").select("id, role, disabled, discord_user_id"),
    supabase.from("hr_role_permissions").select("role, permission, allowed"),
  ]);
  const recipientsOk = !usersErr && !permsErr;
  const pushUsers = (userRows ?? []).flatMap((u) =>
    (HR_ROLES as readonly string[]).includes(u.role) ? [{ id: String(u.id), role: u.role as HrRole, disabled: !!u.disabled }] : [],
  );
  const mentionStaff = (userRows ?? []).flatMap((u) =>
    (HR_ROLES as readonly string[]).includes(u.role)
      ? [{ id: String(u.id), role: u.role as HrRole, disabled: !!u.disabled, discord_user_id: u.discord_user_id ?? null }]
      : [],
  );
  const overrides = (permRows ?? []).map((r) => ({ role: String(r.role), permission: String(r.permission), allowed: !!r.allowed }));
  const permsByRole = new Map<HrRole, Set<PermissionKey>>(HR_ROLES.map((r) => [r, effectivePermissions(r, overrides)]));
  let pushed = 0;

  for (const s of due) {
    const app = one(s.applications)!;
    const job = one(app.jobs as { title: string; leader_user_id: string | null } | { title: string; leader_user_id: string | null }[] | null);
    const mins = Math.max(0, Math.round((new Date(s.scheduled_at!).getTime() - now.getTime()) / 60_000));

    // Thông báo đẩy tới điện thoại đã cài app PWA /hr (song song với Discord).
    const userIds = recipientsOk ? pushRecipientUserIds(pushUsers, permsByRole, job?.leader_user_id ?? null) : [];
    const push = await sendHrPush(
      interviewReminderPayload({
        candidateName: app.full_name,
        jobTitle: job?.title ?? null,
        roundTitle: s.title ?? `Vòng ${s.round}`,
        scheduledAt: s.scheduled_at!,
        mode: s.mode,
        meetUrl: s.meet_url,
        minutes: mins,
        interviewId: s.id,
        applicationId: s.application_id,
      }),
      { userIds },
    );
    pushed += push.sent;

    if (!hasDiscord) continue;
    const tag = recipientsOk ? buildMentions(mentionStaff, ["hr", "leader"], job?.leader_user_id ?? null) : "@everyone";
    await discordNotify("hr", {
      content: `${tag} ⏰ **Sắp PV** — ${app.full_name} sau ~${mins} phút`,
      embeds: [
        {
          title: `${app.full_name} — ${job?.title ?? "?"} · ${s.title ?? `Vòng ${s.round}`}`,
          color: s.mode === "online" ? 0x3b82f6 : 0xf59e0b,
          fields: [
            { name: "Thời gian", value: formatInterviewTime(s.scheduled_at!), inline: true },
            { name: "Hình thức", value: modeLabel(s.mode, s.meet_url) },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "tdgamestudio.com/hr" },
        },
      ],
    });
  }

  await supabase
    .from("interview_sessions")
    .update({ reminded_at: now.toISOString() })
    .in("id", due.map((s) => s.id));

  return NextResponse.json({ sent: due.length, pushed, discord: hasDiscord });
}
