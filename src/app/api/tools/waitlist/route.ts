import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { discordNotify } from "@/lib/discord-notify";
import { WAITLIST_SOURCE } from "@/lib/leads";
import { TOOLS } from "@/app/tools/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Trust boundary: form public → chỉ nhận email + slug tool có thật. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
  const slug = typeof body.tool === "string" ? body.tool.trim().slice(0, 60) : "";
  const tool = TOOLS.find((t) => t.slug === slug);

  if (!EMAIL_RE.test(email))
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  if (!tool) return NextResponse.json({ error: "Unknown tool" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Bấm hai lần / quay lại đăng ký lại → không đẻ thêm row rác trong /crm.
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("source", WAITLIST_SOURCE)
    .eq("email", email)
    .eq("service", tool.name)
    .maybeSingle();

  if (existing) return NextResponse.json({ ok: true, id: existing.id });

  const { data, error } = await supabase
    .from("leads")
    .insert([
      {
        name: email.split("@")[0],
        email,
        service: tool.name,
        message: "",
        source: WAITLIST_SOURCE,
      },
    ])
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget: email đã lưu, notify hỏng không được fail request.
  (async () => {
    try {
      await discordNotify("sales", {
        content: "🔔 **Tool waitlist**",
        embeds: [
          {
            title: tool.name,
            color: 0xf59e0b,
            fields: [{ name: "Email", value: email, inline: true }],
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
