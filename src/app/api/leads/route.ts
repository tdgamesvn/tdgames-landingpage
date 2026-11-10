import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { discordNotify } from "@/lib/discord-notify";
import { LEAD_BUDGETS, LEAD_CONTACT_CHANNELS, LEAD_SERVICES, WAITLIST_SOURCE } from "@/lib/leads";
import { leadAckLabel, sendLeadAck } from "@/lib/lead-ack-send";
import { clientIp } from "@/lib/hr-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Trust boundary: form public → cắt độ dài, whitelist select, check email. */
function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const service = clean(body.service, 40);
  const budget = clean(body.budget, 40);
  const message = clean(body.message, 4000);
  // Nguồn nội bộ (chat, waitlist) không cho form công khai tự đặt.
  const rawSource = clean(body.source, 60);
  const source = !rawSource || rawSource === "chat" || rawSource === WAITLIST_SOURCE ? "contact-form" : rawSource;
  const contactChannel = clean(body.contactChannel, 40);
  const contactHandle = clean(body.contactHandle, 200);

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!EMAIL_RE.test(email))
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  if (!LEAD_SERVICES.includes(service as (typeof LEAD_SERVICES)[number]))
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  if (budget && !LEAD_BUDGETS.includes(budget as (typeof LEAD_BUDGETS)[number]))
    return NextResponse.json({ error: "Invalid budget" }, { status: 400 });
  if (
    contactChannel &&
    !LEAD_CONTACT_CHANNELS.includes(contactChannel as (typeof LEAD_CONTACT_CHANNELS)[number])
  )
    return NextResponse.json({ error: "Invalid contact channel" }, { status: 400 });
  if (contactChannel && !contactHandle)
    return NextResponse.json(
      { error: `Please enter your ${contactChannel} username or number` },
      { status: 400 },
    );

  const ip = clientIp(request.headers);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("leads")
    .insert([
      {
        name,
        email,
        service,
        budget: budget || null,
        contact_channel: contactChannel || null,
        contact_handle: contactHandle || null,
        message,
        source,
      },
    ])
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget: lead đã lưu rồi, mail/notify lỗi cũng không được fail request.
  // Mail xác nhận gửi trước để Discord báo luôn kết quả.
  (async () => {
    let ack = "—";
    try {
      ack = leadAckLabel(await sendLeadAck({ id: data.id, name, email, service, message }, ip));
    } catch (e) {
      ack = `❌ lỗi: ${e instanceof Error ? e.message : "?"}`;
    }
    try {
      await discordNotify("sales", {
        content: "💰 **New quote request**",
        embeds: [
          {
            title: `${name} — ${service}`,
            description: message || "_(no message)_",
            color: 0xf59e0b,
            fields: [
              { name: "Email", value: email, inline: true },
              {
                name: "Chat",
                value: contactChannel ? `${contactChannel}: ${contactHandle}` : "—",
                inline: true,
              },
              { name: "Budget", value: budget || "—", inline: true },
              { name: "Source", value: source, inline: true },
              { name: "Mail xác nhận", value: ack, inline: true },
            ],
            footer: { text: `Lead ${data.id} · /crm` },
          },
        ],
      });
    } catch {
      // ignore
    }
  })();

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
