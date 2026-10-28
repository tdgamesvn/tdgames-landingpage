import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireCronOrHr } from "@/lib/hr-session";
import { getDiscordUrl } from "@/lib/discord-notify";
import { formatInterviewTime, modeLabel } from "@/lib/interview-schedule";
import { interviewReminderPayload } from "@/lib/hr-push-payload";
import { dispatchCandidateNotify, loadNotifyStaff, toNotifyApp } from "@/lib/hr-notify";

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
    // applications(*) thay vì liệt kê cột: vẫn chạy khi migration assignee_user_id chưa áp.
    .select("id, application_id, round, title, scheduled_at, mode, meet_url, applications(*, jobs(title, leader_user_id))")
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

  // Người nhận theo luật chung (Sếp, người phụ trách, Leader của job; chưa giao → @everyone + HR),
  // push lọc thêm push.receive + phạm vi. Lỗi đọc DB → Discord @everyone, không đẩy ai (fail closed).
  const staffCtx = await loadNotifyStaff();
  let pushed = 0;

  for (const s of due) {
    const row = one(s.applications) as unknown as Record<string, unknown>;
    const app = toNotifyApp(row);
    const mins = Math.max(0, Math.round((new Date(s.scheduled_at!).getTime() - now.getTime()) / 60_000));
    const roundTitle = s.title ?? `Vòng ${s.round}`;

    const r = await dispatchCandidateNotify({ event: "interview_remind" }, app, staffCtx, {
      content: `⏰ **Sắp PV** — ${app.full_name} sau ~${mins} phút`,
      embeds: [
        {
          title: `${app.full_name} — ${app.jobTitle ?? "?"} · ${roundTitle}`,
          color: s.mode === "online" ? 0x3b82f6 : 0xf59e0b,
          fields: [
            { name: "Thời gian", value: formatInterviewTime(s.scheduled_at!), inline: true },
            { name: "Hình thức", value: modeLabel(s.mode, s.meet_url) },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "tdgamestudio.com/hr" },
        },
      ],
      // Thông báo đẩy tới điện thoại đã cài app PWA /hr (song song với Discord).
      push: interviewReminderPayload({
        candidateName: app.full_name,
        jobTitle: app.jobTitle,
        roundTitle,
        scheduledAt: s.scheduled_at!,
        mode: s.mode,
        meetUrl: s.meet_url,
        minutes: mins,
        interviewId: s.id,
        applicationId: s.application_id,
      }),
    });
    pushed += r.pushed;
  }

  await supabase
    .from("interview_sessions")
    .update({ reminded_at: now.toISOString() })
    .in("id", due.map((s) => s.id));

  return NextResponse.json({ sent: due.length, pushed, discord: hasDiscord });
}
