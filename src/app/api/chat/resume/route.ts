import { NextResponse } from "next/server";
import { chatOnline, listMessages, resumeFromEmailToken } from "@/lib/chat-server";
import { createLimiterThread, err, guardEnabled, ipOf, toPublicMessage, toPublicThread } from "@/lib/chat-public";

export const dynamic = "force-dynamic";

/** Link "Continue the conversation" trong email → gắn luồng vào trình duyệt này (mã khách mới). */
export async function POST(req: Request) {
  const off = await guardEnabled();
  if (off) return off;
  if (!createLimiterThread.tryHit(ipOf(req))) return err(429, "rate_limited");
  const b = (await req.json().catch(() => ({}))) as { t?: unknown };
  const r = await resumeFromEmailToken(typeof b.t === "string" ? b.t : "");
  if (!r) return err(404, "not_found");
  const messages = await listMessages(r.thread.id);
  return NextResponse.json({
    token: r.token,
    thread: toPublicThread(r.thread),
    messages: messages.map(toPublicMessage),
    online: await chatOnline(),
  });
}
