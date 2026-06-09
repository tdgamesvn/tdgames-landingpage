import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { discordNotify } from "@/lib/discord-notify";

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
      const portfolioUrl = body.portfolio_url ? String(body.portfolio_url) : null;
      const cvUrl = body.cv_url ? String(body.cv_url) : null;
      const phone = body.phone ? String(body.phone) : null;
      const yearsExp = body.years_experience != null ? String(body.years_experience) : null;
      const salary = body.expected_salary ? String(body.expected_salary) : null;
      const rate = body.rate_per_hour ? String(body.rate_per_hour) : null;
      const referredBy = body.referred_by ? String(body.referred_by) : null;

      // ── Telegram ──────────────────────────────────────────────────
      if (telegramToken && telegramChatId) {
        const lines = [
          `🎯 <b>New Application!</b>`,
          ``,
          `📌 <b>Job:</b> ${jobTitle}`,
          `👤 <b>Name:</b> ${String(full_name)}`,
          `📧 <b>Email:</b> ${String(email)}`,
          phone ? `📞 <b>Phone:</b> ${phone}` : null,
          `🏷 <b>Type:</b> ${String(work_type)}`,
          yearsExp ? `📅 <b>Experience:</b> ${yearsExp} yr(s)` : null,
          salary ? `💰 <b>Expected salary:</b> ${salary}` : null,
          rate ? `💰 <b>Rate/hr:</b> ${rate}` : null,
          portfolioUrl ? `🎨 <b>Portfolio:</b> ${portfolioUrl}` : null,
          cvUrl ? `📎 <b>CV:</b> ${cvUrl}` : null,
          referredBy ? `👥 <b>Referred by:</b> ${referredBy}` : null,
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

      await discordNotify("hr", {
        content: `@everyone 🎯 **New application for ${jobTitle}** from **${String(full_name)}**`,
        embeds: [
          {
            title: `Application — ${jobTitle}`,
            color: 0xf59e0b,
            fields,
            timestamp: new Date().toISOString(),
          },
        ],
      });
    } catch {
      // Silently ignore notification errors — application is already saved
    }
  })();

  return NextResponse.json({ ok: true, id: data.id });
}
