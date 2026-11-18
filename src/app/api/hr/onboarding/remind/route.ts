import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireCronOrHr } from "@/lib/hr-session";
import { getDiscordUrl } from "@/lib/discord-notify";
import { formatDateVi, vnDateString } from "@/lib/offer-letter";
import { dueReminders, isOnboardingEligible, reminderDates, STAGE_LABEL } from "@/lib/hr-onboarding";
import { ensureOnboarding, markReminded } from "@/lib/hr-onboarding-store";
import { effectiveStartDate } from "@/lib/referral-store";
import { onboardingReminderPayload } from "@/lib/hr-push-payload";
import { dispatchCandidateNotify, loadNotifyStaff, toNotifyApp } from "@/lib/hr-notify";

// Discord: field value ≤ 1024, embed title ≤ 256 — vượt thì webhook bị từ chối.
function clipField(s: string, max = 1024): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cron (.github/workflows/hr-interview-remind.yml) gọi mỗi 15 phút, từ 07:00 VN.
// Mỗi mốc (trước 1 ngày làm việc / ngày đầu / hết tuần đầu) nhắc 1 lần cho mỗi ngày đi làm,
// từ 08:00 VN; markReminded ghi dấu nên không lặp. Đổi ngày đi làm → nhắc lại theo ngày mới.
export async function GET(request: Request) {
  const authError = await requireCronOrHr(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const todayVn = vnDateString(now);
  const minutesVn = ((now.getUTCHours() + 7) % 24) * 60 + now.getUTCMinutes();

  const { data, error } = await supabase
    .from("applications")
    // * thay vì liệt kê cột: vẫn chạy khi migration assignee_user_id chưa áp.
    .select("*, jobs(title, leader_user_id)")
    .eq("offer_status", "accepted");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = ((data ?? []) as unknown as Record<string, unknown>[]).filter((r) =>
    isOnboardingEligible({
      offer_status: (r.offer_status as string | null) ?? null,
      work_type: (r.work_type as string | null) ?? null,
    }),
  );

  const hasDiscord = Boolean(getDiscordUrl("hr"));
  const staffCtx = await loadNotifyStaff();
  let sent = 0;
  let pushed = 0;
  let errors = 0;

  for (const row of rows) {
    const app = toNotifyApp(row);
    try {
      const start = await effectiveStartDate(app.id);
      if (!start.date) continue;
      const rd = reminderDates(start.date);
      if (todayVn !== rd.before && todayVn !== rd.day1 && todayVn !== rd.week1) continue;
      const ob = await ensureOnboarding(app.id);
      const stages = dueReminders({
        startDate: start.date,
        items: ob.items,
        reminded: ob.reminded,
        todayVn,
        minutesVn,
      });

      for (const stage of stages) {
        // Hết tuần đầu: liệt kê mọi mục còn thiếu ở mọi giai đoạn; các mốc khác chỉ giai đoạn đó.
        const pendingAll = ob.items
          .filter((x) => (stage === "week1" || x.stage === stage) && x.done_at === null)
          .map((x) => x.label);
        const lines = pendingAll.slice(0, 10).map((l) => `• ${l}`);
        if (pendingAll.length > 10) lines.push("…");
        const fields = [
          { name: "Ngày đi làm", value: `${formatDateVi(start.date)}${start.confirmed ? "" : " (dự kiến)"}`, inline: true },
        ];
        if (lines.length > 0) fields.push({ name: "Còn chưa xong", value: clipField(lines.join("\n")), inline: false });

        const r = await dispatchCandidateNotify({ event: "onboard_remind" }, app, staffCtx, {
          content: `🗓 **Onboard** — ${app.full_name} · ${STAGE_LABEL[stage]}`,
          embeds: [
            {
              title: clipField(`${app.full_name} — ${app.jobTitle ?? "?"}`, 256),
              color: 0x10b981,
              fields,
              timestamp: new Date().toISOString(),
              footer: { text: "tdgamestudio.com/hr" },
            },
          ],
          push: onboardingReminderPayload({
            stage,
            appId: app.id,
            candidateName: app.full_name,
            startDate: start.date,
            pending: pendingAll,
          }),
          pushPerm: "onboard.view",
        });
        pushed += r.pushed;
        sent += 1;
        await markReminded(app.id, stage, start.date);
      }
    } catch (e) {
      errors += 1;
      console.error("[onboarding/remind]", app.id, e);
    }
  }

  return NextResponse.json({ checked: rows.length, sent, pushed, errors, discord: hasDiscord });
}
