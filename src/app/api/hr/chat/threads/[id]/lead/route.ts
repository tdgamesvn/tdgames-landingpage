import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { loadVisibleThread, notFound, requireChatUser } from "@/lib/chat-staff";

export const dynamic = "force-dynamic";

/** Tạo lead CRM từ luồng khách (cần email). Bảng leads giữ nguyên; liên kết ở chat_threads.lead_id. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireChatUser(req);
  if ("response" in auth) return auth.response;
  const thread = await loadVisibleThread(auth.ctx, (await params).id);
  if (!thread) return notFound();
  if (thread.audience !== "client") return NextResponse.json({ error: "Chỉ tạo lead cho chat của khách" }, { status: 400 });
  if (!thread.email) return NextResponse.json({ error: "Xin email khách trước" }, { status: 400 });
  if (thread.lead_id) return NextResponse.json({ error: "Đã tạo lead", leadId: thread.lead_id }, { status: 409 });
  const db = getSupabaseAdmin();
  const { data: msgs } = await db
    .from("chat_messages")
    .select("body")
    .eq("thread_id", thread.id)
    .eq("sender", "visitor")
    .eq("kind", "text")
    .order("created_at", { ascending: true });
  const message = (msgs ?? []).map((m) => m.body).join("\n\n").slice(0, 5000) || "(Chat website)";
  const { data: lead, error } = await db
    .from("leads")
    .insert({ name: thread.name || thread.email.split("@")[0], email: thread.email, service: "Chat inquiry", message, source: "chat" })
    .select("id")
    .single();
  if (error || !lead) return NextResponse.json({ error: error?.message ?? "Không tạo được lead" }, { status: 500 });
  // Bấm đúp / 2 người cùng bấm: chỉ request gắn được lead_id đầu tiên thắng; lead thừa xoá ngay.
  const { data: won } = await db
    .from("chat_threads")
    .update({ lead_id: lead.id })
    .eq("id", thread.id)
    .is("lead_id", null)
    .select("lead_id");
  if (!won?.length) {
    await db.from("leads").delete().eq("id", lead.id);
    return NextResponse.json({ error: "Đã tạo lead" }, { status: 409 });
  }
  return NextResponse.json({ leadId: lead.id });
}
