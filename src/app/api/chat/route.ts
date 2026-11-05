import { NextResponse } from "next/server";
import { activeQuickReplies, chatOnline, chatWidgetEnabled } from "@/lib/chat-server";

export const dynamic = "force-dynamic";

/** Cấu hình ô chat: bật/tắt, giờ trực, các nút câu hỏi có sẵn. */
export async function GET() {
  const [enabled, online, qrs] = await Promise.all([chatWidgetEnabled(), chatOnline(), activeQuickReplies()]);
  return NextResponse.json(
    {
      enabled,
      online,
      quickReplies: enabled
        ? qrs.map((q) => ({ id: q.id, label: q.label, audience: q.audience, answer: q.answer, linkLabel: q.link_label, linkUrl: q.link_url }))
        : [],
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
