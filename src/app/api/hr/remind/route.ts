import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THRESHOLDS = {
  new: 2,        // days before nudging to review
  reviewing: 7,  // days before nudging to schedule interview
  interview: 14, // days before nudging to make offer/close
};

function requireHR(req: Request) {
  const secret = process.env.HR_SECRET ?? process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "HR_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-hr-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

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
  const authError = requireHR(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("applications")
    .select("id, full_name, status, created_at, referred_by, jobs(title)")
    .in("status", ["new", "reviewing", "interview"])
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const apps = data ?? [];

  const needsReview = apps.filter(
    (a) => a.status === "new" && daysAgo(a.created_at) >= THRESHOLDS.new
  );
  const stuckReview = apps.filter(
    (a) => a.status === "reviewing" && daysAgo(a.created_at) >= THRESHOLDS.reviewing
  );
  const postInterview = apps.filter(
    (a) => a.status === "interview" && daysAgo(a.created_at) >= THRESHOLDS.interview
  );

  const total = apps.length;
  const staleCount = needsReview.length + stuckReview.length + postInterview.length;

  // Skip Discord if nothing is stale
  if (staleCount === 0) {
    return NextResponse.json({ sent: false, reason: "No stale applications", total });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ sent: false, reason: "DISCORD_WEBHOOK_URL not set", staleCount });
  }

  // Build Discord embed fields
  const fields: { name: string; value: string; inline?: boolean }[] = [];

  if (needsReview.length > 0) {
    fields.push({
      name: `📋 Needs Review — new > ${THRESHOLDS.new}d (${needsReview.length})`,
      value: needsReview.map(formatApp).join("\n"),
    });
  }
  if (stuckReview.length > 0) {
    fields.push({
      name: `🔍 Stuck in Review — reviewing > ${THRESHOLDS.reviewing}d (${stuckReview.length})`,
      value: stuckReview.map(formatApp).join("\n"),
    });
  }
  if (postInterview.length > 0) {
    fields.push({
      name: `💬 Post-Interview — interview > ${THRESHOLDS.interview}d (${postInterview.length})`,
      value: postInterview.map(formatApp).join("\n"),
    });
  }

  fields.push({
    name: "📊 Pipeline total",
    value: `${total} active application${total !== 1 ? "s" : ""}`,
    inline: true,
  });

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
    }),
  });

  return NextResponse.json({ sent: true, staleCount, needsReview: needsReview.length, stuckReview: stuckReview.length, postInterview: postInterview.length });
}
