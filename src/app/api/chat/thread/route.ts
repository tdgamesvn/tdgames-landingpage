import { NextResponse } from "next/server";
import { classifyAudience } from "@/lib/chat";
import { chatOnline, createThread, listMessages, threadForToken, touchVisitor } from "@/lib/chat-server";
import {
  cleanPage,
  countryOf,
  createLimiterThread,
  err,
  guardEnabled,
  ipOf,
  pollLimiter,
  pollTokenLimiter,
  readToken,
  toPublicMessage,
  toPublicThread,
} from "@/lib/chat-public";

export const dynamic = "force-dynamic";

/** Mở ô chat: token đúng → luồng cũ + lịch sử; không có/sai → tạo luồng mới. */
export async function POST(req: Request) {
  const off = await guardEnabled();
  if (off) return off;
  const body = (await req.json().catch(() => ({}))) as { page?: unknown };
  const page = cleanPage(body.page);
  const existing = await threadForToken(readToken(req));
  if (existing) {
    await touchVisitor(existing.id, page, existing.pages);
    const messages = await listMessages(existing.id);
    return NextResponse.json({ thread: toPublicThread(existing), messages: messages.map(toPublicMessage), online: await chatOnline() });
  }
  if (!createLimiterThread.tryHit(ipOf(req))) return err(429, "rate_limited");
  const { thread, token } = await createThread({
    page,
    userAgent: req.headers.get("user-agent"),
    country: countryOf(req),
    audience: classifyAudience({ page }),
  });
  return NextResponse.json({ token, thread: toPublicThread(thread), messages: [], online: await chatOnline() });
}

/** Lấy tin mới (polling). `?after=<iso>` chỉ trả tin sau mốc đó. */
export async function GET(req: Request) {
  if (!pollLimiter.tryHit(ipOf(req))) return err(429, "rate_limited");
  const thread = await threadForToken(readToken(req));
  if (!thread) return err(404, "not_found");
  if (!pollTokenLimiter.tryHit(thread.id)) return err(429, "rate_limited");
  const sp = new URL(req.url).searchParams;
  const [messages, online] = await Promise.all([listMessages(thread.id, sp.get("after")), chatOnline()]);
  // Chỉ khi khung chat đang mở + tab đang xem mới tính "khách đã thấy" (nút nổi kiểm chấm đỏ thì không),
  // nếu không mail trả lời sẽ bị bỏ vì tưởng khách đã đọc.
  if (sp.get("seen") === "1") await touchVisitor(thread.id);
  return NextResponse.json({ thread: toPublicThread(thread), messages: messages.map(toPublicMessage), online });
}
