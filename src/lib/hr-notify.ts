/**
 * HR Discord notifications for application status changes and comments.
 *
 * Used by both `/api/hr/applications/[id]` and `/api/admin/applications/[id]`
 * PATCH handlers. Always fire-and-forget — caller should not await.
 */

import { discordNotify } from "@/lib/discord-notify";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

interface OldApp {
  full_name: string | null;
  status: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  job_id: string | null;
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
      content: `@everyone ${emoji} **${name}** — status updated`,
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

      await discordNotify("hr", {
        content: `@everyone 💬 **${name}** — note updated`,
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
}
