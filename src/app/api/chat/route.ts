import { NextResponse } from "next/server";
import { chatAiSettings } from "@/lib/chat-ai";
import { activeQuickReplies, chatOnline, chatWidgetEnabled } from "@/lib/chat-server";

export const dynamic = "force-dynamic";

/** Cấu hình ô chat: bật/tắt, giờ trực, các nút câu hỏi có sẵn. */
export async function GET() {
  const [enabled, online, qrs, ai] = await Promise.all([chatWidgetEnabled(), chatOnline(), activeQuickReplies(), chatAiSettings()]);
  return NextResponse.json(
    {
      enabled,
      online,
      aiAuto: ai.mode === "auto",
      quickReplies: enabled
        ? qrs.map((q) => ({ id: q.id, label: q.label, audience: q.audience, answer: q.answer, linkLabel: q.link_label, linkUrl: q.link_url }))
        : [],
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
