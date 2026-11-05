import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { parseQuickReply } from "@/lib/chat";

export const dynamic = "force-dynamic";

const COLS = "id, label, audience, answer, link_label, link_url, sort_order, active";

/** Danh sách câu hỏi có sẵn (cả câu đang tắt) — cần chat.manage. */
export async function GET(req: Request) {
  const auth = await requireHrUser(req, "chat.manage");
  if ("response" in auth) return auth.response;
  const { data, error } = await getSupabaseAdmin().from("chat_quick_replies").select(COLS).order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quickReplies: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireHrUser(req, "chat.manage");
  if ("response" in auth) return auth.response;
  const parsed = parseQuickReply(await req.json().catch(() => ({})), true);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("chat_quick_replies").insert(parsed.row).select(COLS).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quickReply: data });
}
