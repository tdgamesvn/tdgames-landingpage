import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireChatUser, visibleAudiences } from "@/lib/chat-staff";

export const dynamic = "force-dynamic";

/** Danh sách luồng theo quyền. `filter=needs|answered|closed`, `audience=all|client|candidate`. */
export async function GET(req: Request) {
  const auth = await requireChatUser(req);
  if ("response" in auth) return auth.response;
  const sp = new URL(req.url).searchParams;
  const filter = sp.get("filter") ?? "needs";
  const want = sp.get("audience");
  const allowed = visibleAudiences(auth.ctx);
  const audiences = want === "client" || want === "candidate" ? allowed.filter((a) => a === want) : allowed;
  const db = getSupabaseAdmin();

  const base = () => db.from("chat_threads").select("id", { count: "exact", head: true }).in("audience", allowed);
  const needsCount = base().eq("needs_human", true).neq("status", "closed");

  let q = db
    .from("chat_threads")
    .select("id, audience, status, needs_human, name, email, country, last_page, last_message_at, lead_id, last_preview, last_sender")
    .in("audience", audiences.length ? audiences : ["__none__"])
    .order("last_message_at", { ascending: false })
    .limit(100);
  if (filter === "needs") q = q.eq("needs_human", true).neq("status", "closed");
  else if (filter === "answered") q = q.eq("status", "answered");
  else if (filter === "closed") q = q.eq("status", "closed");

  const [{ data: threads, error }, { count }] = await Promise.all([q, needsCount]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = threads ?? [];
  // Số cuộc chat khác cùng email (app hiện lịch sử cũ khi mở luồng).
  const emails = [...new Set(rows.map((t) => t.email).filter(Boolean) as string[])];
  const byEmail = new Map<string, string[]>();
  if (emails.length) {
    const { data: same } = await db
      .from("chat_threads")
      .select("id, email")
      .in("email", emails)
      .in("audience", allowed);
    for (const s of same ?? []) byEmail.set(s.email, [...(byEmail.get(s.email) ?? []), s.id]);
  }
  return NextResponse.json({
    threads: rows.map((t) => ({
      id: t.id,
      audience: t.audience,
      status: t.status,
      needsHuman: t.needs_human,
      name: t.name,
      email: t.email,
      country: t.country,
      lastPage: t.last_page,
      lastMessageAt: t.last_message_at,
      leadId: t.lead_id,
      lastMessage: t.last_preview ? { body: t.last_preview, sender: t.last_sender ?? "visitor", created_at: t.last_message_at } : null,
      otherThreadCount: t.email ? (byEmail.get(t.email) ?? []).filter((id) => id !== t.id).length : 0,
    })),
    counts: { needs: count ?? 0 },
  });
}
