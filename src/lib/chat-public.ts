import "server-only";

// Phần dùng chung của API công khai /api/chat/* (ô chat trên website).
import { NextResponse } from "next/server";
import { createLimiter, clientIp } from "./hr-rate-limit";
import { chatWidgetEnabled, type ChatMessageRow, type ChatThreadRow } from "./chat-server";

// Văn phòng nhiều người chung 1 IP (NAT) → hạn mức theo IP rộng; hạn chặt đặt theo mã khách.
export const createLimiterThread = createLimiter(40, 3600_000); // tạo luồng / dùng link: 40/giờ/IP
export const messageLimiter = createLimiter(120, 600_000); // tin: 120/10 phút/IP
export const messageTokenLimiter = createLimiter(30, 600_000); // tin: 30/10 phút/luồng
export const pollLimiter = createLimiter(3000, 600_000); // đọc tin: 3000/10 phút/IP
export const pollTokenLimiter = createLimiter(400, 600_000); // đọc tin: ~1 lần/1.5s/luồng

export type PublicThread = {
  status: ChatThreadRow["status"];
  audience: ChatThreadRow["audience"];
  hasEmail: boolean;
  name: string | null;
  needsHuman: boolean;
};
export type PublicMessage = {
  id: string;
  sender: ChatMessageRow["sender"];
  kind: ChatMessageRow["kind"];
  body: string;
  staffName: string | null;
  linkLabel: string | null;
  linkUrl: string | null;
  createdAt: string;
};

export const toPublicThread = (t: ChatThreadRow): PublicThread => ({
  status: t.status,
  audience: t.audience,
  hasEmail: !!t.email,
  name: t.name,
  needsHuman: t.needs_human,
});

export const toPublicMessage = (m: ChatMessageRow): PublicMessage => ({
  id: m.id,
  sender: m.sender,
  kind: m.kind,
  body: m.body,
  staffName: m.sender === "staff" ? m.staff_name || "TD Games" : null,
  linkLabel: m.link_label,
  linkUrl: m.link_url,
  createdAt: m.created_at,
});

export const readToken = (req: Request) => req.headers.get("x-chat-token")?.trim() || null;
export const ipOf = (req: Request) => clientIp(req.headers);

/** Đường dẫn trang khách đang xem: chỉ nhận "/…", cắt 200 ký tự. */
export function cleanPage(p: unknown): string | null {
  if (typeof p !== "string" || !p.startsWith("/") || p.startsWith("//")) return null;
  return p.split("#")[0].slice(0, 200);
}

export const countryOf = (req: Request) => {
  const c = req.headers.get("cf-ipcountry")?.toUpperCase() ?? null;
  return c && /^[A-Z]{2}$/.test(c) ? c : null;
};

export const err = (status: number, error: string) => NextResponse.json({ error }, { status });

/** Widget bị tắt toàn site → 503. */
export async function guardEnabled(): Promise<NextResponse | null> {
  return (await chatWidgetEnabled()) ? null : err(503, "chat_disabled");
}
