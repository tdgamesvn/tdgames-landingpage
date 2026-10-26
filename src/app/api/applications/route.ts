import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { discordNotify } from "@/lib/discord-notify";
import { escapeTelegramHtml, sanitizeApplicationInput } from "@/lib/application-input";

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

  const { data, error } = await supabase
    .from("applications")
    .insert([input])
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
