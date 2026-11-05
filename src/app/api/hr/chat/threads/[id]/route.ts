import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { canSeeAudience, nextThreadState } from "@/lib/chat";
import { listMessages } from "@/lib/chat-server";
import { latestDraft } from "@/lib/chat-ai";
import { loadVisibleThread, notFound, requireChatUser, visibleAudiences } from "@/lib/chat-staff";
import { loadScopedApplication } from "@/lib/hr-session";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Chi tiết 1 luồng + lịch sử các cuộc chat trước cùng email (chỉ đọc) + hồ sơ ứng viên trùng email. */
export async function GET(req: Request, { params }: Ctx) {
  const auth = await requireChatUser(req);
  if ("response" in auth) return auth.response;
  const thread = await loadVisibleThread(auth.ctx, (await params).id);
  if (!thread) return notFound();
  const db = getSupabaseAdmin();
  const messages = await listMessages(thread.id);

  let previous: { id: string; createdAt: string; messages: Awaited<ReturnType<typeof listMessages>> }[] = [];
  let applicationId: string | null = null;
  if (thread.email) {
    const { data: others } = await db
      .from("chat_threads")
      .select("id, created_at")
      .eq("email", thread.email)
      .in("audience", visibleAudiences(auth.ctx))
      .neq("id", thread.id)
      .order("created_at", { ascending: true })
      .limit(5);
    previous = await Promise.all(
      (others ?? []).map(async (o) => ({ id: o.id, createdAt: o.created_at, messages: await listMessages(o.id) })),
    );
    if (thread.audience === "candidate") {
      const { data: app } = await db
        .from("applications")
        .select("id")
        .ilike("email", thread.email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      // Chỉ trả link khi người xem được hồ sơ đó theo phạm vi /hr.
      if (app && (await loadScopedApplication(auth.ctx, String(app.id)))) applicationId = String(app.id);
    }
  }
  return NextResponse.json({ thread, messages, previous, applicationId, aiDraft: await latestDraft(thread.id) });
}

/** close | reopen | set_audience | delete */
export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireChatUser(req);
  if ("response" in auth) return auth.response;
  const thread = await loadVisibleThread(auth.ctx, (await params).id);
  if (!thread) return notFound();
  const b = (await req.json().catch(() => ({}))) as { action?: unknown; audience?: unknown };
  const db = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (b.action === "close") {
    const s = nextThreadState({ status: thread.status, needsHuman: thread.needs_human }, "close");
    await db.from("chat_threads").update({ status: s.status, needs_human: s.needsHuman, updated_at: now }).eq("id", thread.id);
  } else if (b.action === "reopen") {
    // Mở lại = đưa về hàng "Cần người" (nếu không sẽ không nằm trong bộ lọc nào).
    await db.from("chat_threads").update({ status: "open", needs_human: true, updated_at: now }).eq("id", thread.id);
  } else if (b.action === "set_audience") {
    if (b.audience !== "client" && b.audience !== "candidate") return NextResponse.json({ error: "audience sai" }, { status: 400 });
    if (!canSeeAudience(auth.ctx.perms, b.audience)) {
      return NextResponse.json({ error: "Bạn không có quyền với loại chat này" }, { status: 403 });
    }
    await db.from("chat_threads").update({ audience: b.audience, updated_at: now }).eq("id", thread.id);
  } else if (b.action === "delete") {
    // Xoá vĩnh viễn (khách xin xoá dữ liệu) → chỉ người có chat.manage.
    if (!auth.ctx.perms.has("chat.manage")) {
      return NextResponse.json({ error: "Bạn không có quyền xoá chat" }, { status: 403 });
    }
    const { error } = await db.from("chat_threads").delete().eq("id", thread.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deleted: true });
  } else {
    return NextResponse.json({ error: "action sai" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
