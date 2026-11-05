import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { parseQuickReply } from "@/lib/chat";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireHrUser(req, "chat.manage");
  if ("response" in auth) return auth.response;
  const parsed = parseQuickReply(await req.json().catch(() => ({})), false);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { data, error } = await getSupabaseAdmin()
    .from("chat_quick_replies")
    .update({ ...parsed.row, updated_at: new Date().toISOString() })
    .eq("id", (await params).id)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const auth = await requireHrUser(req, "chat.manage");
  if ("response" in auth) return auth.response;
  const { error } = await getSupabaseAdmin().from("chat_quick_replies").delete().eq("id", (await params).id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
