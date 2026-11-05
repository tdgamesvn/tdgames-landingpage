import { NextResponse } from "next/server";
import { cleanText, MAX_MESSAGE } from "@/lib/chat";
import { addStaffReply } from "@/lib/chat-server";
import { loadVisibleThread, notFound, requireChatUser } from "@/lib/chat-staff";

export const dynamic = "force-dynamic";

/** Trả lời khách. Khách đã rời + có email → mail (gộp, tối đa 1 mail/10 phút). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireChatUser(req);
  if ("response" in auth) return auth.response;
  const thread = await loadVisibleThread(auth.ctx, (await params).id);
  if (!thread) return notFound();
  const b = (await req.json().catch(() => ({}))) as { body?: unknown; aiDraftId?: unknown };
  const body = cleanText(b.body, MAX_MESSAGE);
  if (!body) return NextResponse.json({ error: "Tin nhắn trống" }, { status: 400 });
  const message = await addStaffReply(thread, { id: auth.ctx.user.id, displayName: auth.ctx.user.displayName }, body, typeof b.aiDraftId === "string" ? b.aiDraftId : null);
  return NextResponse.json({ message });
}
