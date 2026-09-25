import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import { discordNotify, getDiscordUrl } from "@/lib/discord-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ngưỡng nhắc lấy từ application_statuses.remind_days (null = không nhắc cột đó).

function daysAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function formatApp(app: { full_name: string; jobs: { title: string }[] | null; referred_by?: string | null; created_at: string }) {
  const days = daysAgo(app.created_at);
  const ref = app.referred_by ? ` [via ${app.referred_by}]` : "";
  const jobTitle = Array.isArray(app.jobs) ? app.jobs[0]?.title : (app.jobs as { title: string } | null)?.title;
  return `• ${app.full_name} → ${jobTitle ?? "Unknown"}  (${days}d)${ref}`;
}

export async function GET(request: Request) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const { data: statuses, error: stErr } = await supabase
    .from("application_statuses")
    .select("key, label, remind_days, kind")
    .not("remind_days", "is", null)
    .order("position", { ascending: true });
  if (stErr) return NextResponse.json({ error: stErr.message }, { status: 500 });

  const watched = (statuses ?? []).filter((s) => s.kind === "open" && s.remind_days);
  if (watched.length === 0) {
    return NextResponse.json({ sent: false, reason: "No status has remind_days", total: 0 });
  }

  const { data, error } = await supabase
    .from("applications")
    .select("id, full_name, status, created_at, referred_by, jobs(title)")
    .in("status", watched.map((s) => s.key))
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const apps = data ?? [];
  const groups = watched
    .map((s) => ({
      status: s,
      stale: apps.filter((a) => a.status === s.key && daysAgo(a.created_at) >= (s.remind_days as number)),
    }))
    .filter((g) => g.stale.length > 0);

  const total = apps.length;
  const staleCount = groups.reduce((n, g) => n + g.stale.length, 0);

  // Skip Discord if nothing is stale
  if (staleCount === 0) {
    return NextResponse.json({ sent: false, reason: "No stale applications", total });
  }

  if (!getDiscordUrl("hr")) {
    return NextResponse.json({ sent: false, reason: "No Discord webhook configured for HR channel", staleCount });
  }

  const fields: { name: string; value: string; inline?: boolean }[] = groups.map((g) => ({
    name: `⏳ ${g.status.label} > ${g.status.remind_days}d (${g.stale.length})`,
    value: g.stale.map(formatApp).join("\n").slice(0, 1024),
  }));

  fields.push({
    name: "📊 Pipeline total",
    value: `${total} active application${total !== 1 ? "s" : ""}`,
    inline: true,
  });

  await discordNotify("hr", {
    content: `@everyone ⏰ **Daily HR Reminder** — ${staleCount} application${staleCount !== 1 ? "s" : ""} need attention`,
    embeds: [
      {
        title: "Recruitment Pipeline — Follow-up",
        color: 0xf59e0b,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: "tdgamestudio.com/hr" },
      },
    ],
  });

  return NextResponse.json({
    sent: true,
    staleCount,
    byStatus: Object.fromEntries(groups.map((g) => [g.status.key, g.stale.length])),
  });
}
