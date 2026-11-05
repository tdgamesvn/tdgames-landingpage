import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { loadVisibleThread, notFound, requireChatUser } from "@/lib/chat-staff";

export const dynamic = "force-dynamic";

/** Nháp AI của luồng: { draftId, action: "discard" } | { draftId, action: "rate", rating: 1|-1|null } */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireChatUser(req);
  if ("response" in auth) return auth.response;
  const thread = await loadVisibleThread(auth.ctx, (await params).id);
  if (!thread) return notFound();
  const b = (await req.json().catch(() => ({}))) as { draftId?: unknown; action?: unknown; rating?: unknown };
  if (typeof b.draftId !== "string") return NextResponse.json({ error: "Thiếu draftId" }, { status: 400 });
  let patch: Record<string, unknown>;
  if (b.action === "discard") {
    patch = { status: "discarded", decided_by: auth.ctx.user.id, decided_at: new Date().toISOString() };
  } else if (b.action === "rate") {
    if (b.rating !== 1 && b.rating !== -1 && b.rating !== null) return NextResponse.json({ error: "rating sai" }, { status: 400 });
    patch = { rating: b.rating };
  } else {
    return NextResponse.json({ error: "action sai" }, { status: 400 });
  }
  const { data, error } = await getSupabaseAdmin()
    .from("chat_ai_drafts")
    .update(patch)
    .eq("id", b.draftId)
    .eq("thread_id", thread.id)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return notFound();
  return NextResponse.json({ ok: true });
}
