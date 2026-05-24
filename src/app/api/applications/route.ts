import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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

  const { job_id, full_name, email, work_type } = body;

  if (!job_id || !full_name || !email || !work_type) {
    return NextResponse.json(
      { error: "Missing required fields: job_id, full_name, email, work_type" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("applications")
    .insert([body])
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send Telegram notification (fire-and-forget)
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (token && chatId) {
    (async () => {
      try {
        // Fetch job title
        const { data: job } = await supabase
          .from("jobs")
          .select("title")
          .eq("id", job_id)
          .single();

        const jobTitle = job?.title ?? String(job_id);
        const portfolioUrl = body.portfolio_url ? String(body.portfolio_url) : "N/A";

        const text =
          `🎯 New Application!\n\n` +
          `Job: ${jobTitle}\n` +
          `Applicant: ${String(full_name)}\n` +
          `Email: ${String(email)}\n` +
          `Type: ${String(work_type)}\n` +
          `Portfolio: ${portfolioUrl}`;

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
        });
      } catch {
        // Silently ignore Telegram errors
      }
    })();
  }

  return NextResponse.json({ ok: true, id: data.id });
}
