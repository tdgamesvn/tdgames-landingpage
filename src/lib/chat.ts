// Chat trên website — luật thuần (không import server) để dùng cả server lẫn test.
// Spec: docs/superpowers/specs/2026-11-05-website-chat-design.md
import { createHash, randomBytes } from "node:crypto";

export type ChatAudience = "client" | "candidate";
export type ChatStatus = "open" | "answered" | "closed";
export type ChatSender = "visitor" | "staff" | "system" | "ai";
export type ChatKind = "text" | "quick_reply" | "canned_answer" | "contact_form";
export type ChatEvent = "visitor_text" | "talk_to_person" | "quick_reply" | "staff_reply" | "close";
export type QuickReplyAudience = ChatAudience | "any";

export type ChatHours = { tz: string; start: string; end: string };
/** Giờ trực sếp chốt 2026-11-05: 8:00–22:00 giờ VN, mọi ngày. */
export const CHAT_HOURS_DEFAULT: ChatHours = { tz: "Asia/Ho_Chi_Minh", start: "08:00", end: "22:00" };

export const MAX_MESSAGE = 2000;
export const MAX_NAME = 80;
const PUSH_GAP_MS = 5 * 60_000;
const EMAIL_GAP_MS = 10 * 60_000;
const AWAY_MS = 2 * 60_000;

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Phút trong ngày theo múi giờ `tz`. */
function localMinutes(now: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

export function isWithinHours(now: Date, hours: ChatHours = CHAT_HOURS_DEFAULT): boolean {
  const t = localMinutes(now, hours.tz);
  return t >= minutesOf(hours.start) && t < minutesOf(hours.end);
}

/** Ngoài giờ trực mà chưa có email → phải để lại email mới gửi được tin cho người thật. */
export function requiresEmail(now: Date, hasEmail: boolean, hours: ChatHours = CHAT_HOURS_DEFAULT): boolean {
  return !hasEmail && !isWithinHours(now, hours);
}

export function classifyAudience(input: {
  page: string | null;
  quickReplyAudience?: QuickReplyAudience | null;
  current?: ChatAudience | null;
}): ChatAudience {
  if (input.quickReplyAudience === "candidate") return "candidate";
  if (input.current) return input.current;
  return input.page?.startsWith("/careers") ? "candidate" : "client";
}

export function nextThreadState(
  prev: { status: ChatStatus; needsHuman: boolean },
  event: ChatEvent,
): { status: ChatStatus; needsHuman: boolean } {
  switch (event) {
    case "visitor_text":
    case "talk_to_person":
      return { status: "open", needsHuman: true };
    case "quick_reply":
      return { status: prev.status === "closed" ? "open" : prev.status, needsHuman: prev.needsHuman };
    case "staff_reply":
      return { status: "answered", needsHuman: false };
    case "close":
      return { status: "closed", needsHuman: false };
  }
}

/** Gọi khi khách gửi tin cho người thật. Vừa chuyển sang cần người → báo; đang cần người → tối đa 1 lần / 5 phút. */
export function shouldPush(args: { wasNeedsHuman: boolean; isNeedsHuman: boolean; lastPushAt: Date | null; now: Date }): boolean {
  if (!args.isNeedsHuman) return false;
  if (!args.wasNeedsHuman) return true;
  return !args.lastPushAt || args.now.getTime() - args.lastPushAt.getTime() >= PUSH_GAP_MS;
}

/** Mail câu trả lời cho khách: có email, khách đã rời ≥ 2 phút, mail trước cách ≥ 10 phút. */
export function shouldEmail(args: {
  hasEmail: boolean;
  lastVisitorSeenAt: Date | null;
  lastEmailAt: Date | null;
  now: Date;
}): boolean {
  if (!args.hasEmail) return false;
  const now = args.now.getTime();
  if (args.lastVisitorSeenAt && now - args.lastVisitorSeenAt.getTime() < AWAY_MS) return false;
  return !args.lastEmailAt || now - args.lastEmailAt.getTime() >= EMAIL_GAP_MS;
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function canSeeAudience(perms: ReadonlySet<string>, audience: ChatAudience): boolean {
  return perms.has(audience === "client" ? "chat.clients" : "chat.candidates");
}

/** Trim, bỏ ký tự điều khiển (giữ xuống dòng), rỗng → null, cắt `max`. */
export function cleanText(s: unknown, max: number): string | null {
  if (typeof s !== "string") return null;
  // eslint-disable-next-line no-control-regex
  const out = s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "").trim();
  return out ? out.slice(0, max) : null;
}

/** Link nút câu trả lời có sẵn: đường dẫn nội bộ "/…" (không "//") hoặc https. */
export function isSafeLink(url: string): boolean {
  if (/^\/(?!\/)/.test(url)) return true;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
