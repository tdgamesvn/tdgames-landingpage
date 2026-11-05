import { NextResponse } from "next/server";
import { classifyAudience, cleanText, MAX_MESSAGE } from "@/lib/chat";
import { activeQuickReplies, addVisitorMessage, chatOnline, threadForToken } from "@/lib/chat-server";
import { cleanPage, err, guardEnabled, ipOf, messageLimiter, readToken, toPublicMessage, toPublicThread } from "@/lib/chat-public";

export const dynamic = "force-dynamic";

const TALK_TO_PERSON_TEXT = "I'd like to talk to a person.";

/** Khách gửi tin: text / gọi người thật / bấm nút câu hỏi có sẵn. */
export async function POST(req: Request) {
  const off = await guardEnabled();
  if (off) return off;
  if (!messageLimiter.tryHit(ipOf(req))) return err(429, "rate_limited");
  const thread = await threadForToken(readToken(req));
  if (!thread) return err(404, "not_found");

  const b = (await req.json().catch(() => ({}))) as { kind?: unknown; body?: unknown; quickReplyId?: unknown; page?: unknown };
  const page = cleanPage(b.page);

  if (b.kind === "quick_reply") {
    const qr = (await activeQuickReplies()).find((q) => q.id === b.quickReplyId);
    if (!qr) return err(400, "invalid_quick_reply");
    const audience = classifyAudience({ page, quickReplyAudience: qr.audience, current: thread.audience });
    const messages = await addVisitorMessage(thread, { event: "quick_reply", body: qr.label, quickReply: qr, audience, page });
    return NextResponse.json({ messages: messages.map(toPublicMessage), thread: toPublicThread({ ...thread, audience }) });
  }

  if (b.kind !== "text" && b.kind !== "talk_to_person") return err(400, "invalid_kind");
  const text = b.kind === "talk_to_person" ? cleanText(b.body, MAX_MESSAGE) ?? TALK_TO_PERSON_TEXT : cleanText(b.body, MAX_MESSAGE);
  if (!text) return err(400, "empty");
  // Ngoài giờ trực: phải có email mới gửi được cho người thật (sếp chốt).
  // (= requiresEmail, nhưng giờ trực đọc từ app_settings + cờ ép giờ khi dev — xem chatOnline.)
  if (!thread.email && !(await chatOnline())) return err(400, "email_required");
  const messages = await addVisitorMessage(thread, {
    event: b.kind === "talk_to_person" ? "talk_to_person" : "visitor_text",
    body: text,
    page,
  });
  return NextResponse.json({ messages: messages.map(toPublicMessage), thread: toPublicThread({ ...thread, needs_human: true, status: "open" }) });
}
