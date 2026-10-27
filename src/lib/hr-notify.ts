/**
 * HR Discord notifications for application status changes and comments.
 *
 * Used by both `/api/hr/applications/[id]` and `/api/admin/applications/[id]`
 * PATCH handlers. Always fire-and-forget — caller should not await.
 */

import { discordNotify } from "@/lib/discord-notify";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { buildMentions, type MentionStaff } from "@/lib/hr-discord-mentions";
import { HR_ROLES, type HrRole } from "@/lib/hr-permissions";

/**
 * Tag đúng người (Discord ID trong tài khoản /hr) thay cho @everyone.
 * Lỗi đọc DB hoặc không ai có ID → "@everyone" như cũ (không được làm mất thông báo).
 */
export async function hrMentions(roles: HrRole[], jobId: string | null | undefined): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const [{ data: users, error }, job] = await Promise.all([
      supabase.from("hr_users").select("id, role, disabled, discord_user_id").not("discord_user_id", "is", null),
      jobId
        ? supabase.from("jobs").select("leader_user_id").eq("id", jobId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (error) return "@everyone";
    const staff = (users ?? []).filter((u) => (HR_ROLES as readonly string[]).includes(u.role)) as MentionStaff[];
    const leaderId = (job.data as { leader_user_id: string | null } | null)?.leader_user_id ?? null;
    return buildMentions(staff, roles, leaderId);
  } catch {
    return "@everyone";
  }
}

interface OldApp {
  full_name: string | null;
  status: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  job_id: string | null;
}

/**
 * Send Discord notification when a new comment is posted on an application.
 * Call fire-and-forget — caller should not await.
 */
export async function notifyNewComment(
  applicantName: string,
  authorName: string,
  content: string,
  jobTitle?: string,
  jobId?: string | null,
  mentionedUserIds: string[] = [],
): Promise<void> {
  const truncated =
    content.length > 500 ? content.slice(0, 497) + "..." : content;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "Author", value: authorName, inline: true },
  ];
  if (jobTitle) fields.push({ name: "Position", value: jobTitle, inline: true });
  fields.push({ name: "Comment", value: truncated, inline: false });

  let tag = await hrMentions(["hr", "leader"], jobId);
  // Người được @tag trong comment: thêm <@discord_id>, không trùng với tag sẵn có.
  if (mentionedUserIds.length) {
    try {
      const { data } = await getSupabaseAdmin()
        .from("hr_users")
        .select("discord_user_id")
        .in("id", mentionedUserIds)
        .eq("disabled", false)
        .not("discord_user_id", "is", null);
      const extra = (data ?? [])
        .map((u) => `<@${u.discord_user_id}>`)
        .filter((t, i, a) => a.indexOf(t) === i && !tag.includes(t));
      if (extra.length) tag = `${tag} ${extra.join(" ")}`;
    } catch {
      // bỏ qua — vẫn gửi thông báo với tag cũ
    }
  }
  await discordNotify("hr", {
    content: `${tag} 💬 **${applicantName}** — new comment by ${authorName}`,
    embeds: [
      {
        title: `💬 Comment — ${applicantName}`,
        color: 0x8b5cf6, // purple to distinguish from note (amber)
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: "HR Dashboard" },
      },
    ],
  });
}

/**
 * Send Discord notification when an application is updated.
 * Call this AFTER the DB update succeeds, in a fire-and-forget block.
 */
export async function notifyApplicationUpdate(
  oldApp: OldApp,
  updates: Record<string, unknown>,
  body: Record<string, unknown>,
): Promise<void> {
  const name = oldApp.full_name ?? "Unknown";
  const supabase = getSupabaseAdmin();

  // Fetch job title for context
  let jobTitle = "";
  if (oldApp.job_id) {
    const { data: job } = await supabase
      .from("jobs")
      .select("title")
      .eq("id", oldApp.job_id)
      .single();
    jobTitle = job?.title ?? "";
  }

  const statusChanged =
    "status" in updates && updates.status !== oldApp.status;
  const notesChanged =
    "admin_notes" in updates && updates.admin_notes !== oldApp.admin_notes;

  // ── Status change notification ──────────────────────────────
  if (statusChanged) {
    const oldStatus = oldApp.status ?? "unknown";
    const newStatus = String(updates.status);
    // Chuyển sang Offer → báo thêm Kế toán (người soạn + gửi mail offer).
    const statusTag = await hrMentions(newStatus === "offer" ? ["hr", "leader", "accountant"] : ["hr", "leader"], oldApp.job_id);
    const isRejected = newStatus === "rejected";
    const reason = isRejected
      ? String(updates.rejection_reason ?? body.rejection_reason ?? "")
      : "";

    const emoji = isRejected
      ? "❌"
      : newStatus === "offer"
        ? "🎉"
        : "📋";
    const color = isRejected
      ? 0xef4444
      : newStatus === "offer"
        ? 0x22c55e
        : 0x3b82f6;

    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: "Status", value: `\`${oldStatus}\` → \`${newStatus}\``, inline: true },
    ];
    if (jobTitle)
      fields.push({ name: "Position", value: jobTitle, inline: true });
    if (isRejected && reason)
      fields.push({ name: "Reason", value: reason, inline: false });

    await discordNotify("hr", {
      content: `${statusTag} ${emoji} **${name}** — status updated`,
      embeds: [
        {
          title: `${emoji} ${isRejected ? "Rejected" : newStatus === "offer" ? "Offer!" : "Status Update"} — ${name}`,
          color,
          fields,
          timestamp: new Date().toISOString(),
          footer: { text: "HR Dashboard" },
        },
      ],
    });
  }

  // ── Comment / admin note notification ──────────────────────
  if (notesChanged && updates.admin_notes) {
    const noteText = String(updates.admin_notes);
    if (noteText.trim()) {
      const fields: { name: string; value: string; inline?: boolean }[] = [
        {
          name: "Note",
          value:
            noteText.length > 500
              ? noteText.slice(0, 497) + "..."
              : noteText,
          inline: false,
        },
      ];
      if (jobTitle)
        fields.push({ name: "Position", value: jobTitle, inline: true });

      const noteTag = await hrMentions(["hr", "leader"], oldApp.job_id);
      await discordNotify("hr", {
        content: `${noteTag} 💬 **${name}** — note updated`,
        embeds: [
          {
            title: `💬 Note — ${name}`,
            color: 0xf59e0b,
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: "HR Dashboard" },
          },
        ],
      });
    }
  }

  // ── Leader chấm bài test ───────────────────────────────────
  const review = updates.test_review as
    | { verdict: string; score: number; comment: string; reviewer: string }
    | null
    | undefined;
  if (review) {
    const verdicts: Record<string, { label: string; emoji: string; color: number }> = {
      pass: { label: "Đạt", emoji: "✅", color: 0x22c55e },
      consider: { label: "Cân nhắc", emoji: "🤔", color: 0xf59e0b },
      fail: { label: "Không đạt", emoji: "❌", color: 0xef4444 },
    };
    const v = verdicts[review.verdict] ?? verdicts.consider;

    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: "Kết luận", value: `${v.emoji} ${v.label}`, inline: true },
      { name: "Điểm", value: `${review.score}/10`, inline: true },
      { name: "Người chấm", value: review.reviewer, inline: true },
    ];
    if (jobTitle)
      fields.push({ name: "Position", value: jobTitle, inline: true });
    if (review.comment)
      fields.push({
        name: "Nhận xét",
        value:
          review.comment.length > 1000
            ? review.comment.slice(0, 997) + "..."
            : review.comment,
        inline: false,
      });

    const reviewTag = await hrMentions(["hr"], oldApp.job_id);
    await discordNotify("hr", {
      content: `${reviewTag} 📝 **${name}** — ${review.reviewer} đã chấm bài test: ${v.emoji} ${v.label} (${review.score}/10)`,
      embeds: [
        {
          title: `📝 Chấm bài test — ${name}`,
          color: v.color,
          fields,
          timestamp: new Date().toISOString(),
          footer: { text: "HR Dashboard" },
        },
      ],
    });
  }
}
