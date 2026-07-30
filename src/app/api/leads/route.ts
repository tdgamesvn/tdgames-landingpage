import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { discordNotify } from "@/lib/discord-notify";
import { LEAD_BUDGETS, LEAD_SERVICES } from "@/lib/leads";

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
  const source = clean(body.source, 60) || "contact-form";

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!EMAIL_RE.test(email))
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  if (!LEAD_SERVICES.includes(service as (typeof LEAD_SERVICES)[number]))
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  if (budget && !LEAD_BUDGETS.includes(budget as (typeof LEAD_BUDGETS)[number]))
    return NextResponse.json({ error: "Invalid budget" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("leads")
    .insert([{ name, email, service, budget: budget || null, message, source }])
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget: lead đã lưu rồi, notify lỗi cũng không được fail request.
  (async () => {
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
              { name: "Budget", value: budget || "—", inline: true },
              { name: "Source", value: source, inline: true },
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
