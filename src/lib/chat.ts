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
      // Chỉ xem câu trả lời có sẵn — không mở lại luồng đã đóng, không gọi người.
      return { status: prev.status, needsHuman: prev.needsHuman };
    case "staff_reply":
      return { status: "answered", needsHuman: false };
    case "close":
      return { status: "closed", needsHuman: false };
  }
}

/** Gọi khi khách gửi tin cho người thật. Luồng cần người → báo, tối đa 1 lần / 5 phút / luồng (spec §7). */
export function shouldPush(args: { wasNeedsHuman: boolean; isNeedsHuman: boolean; lastPushAt: Date | null; now: Date }): boolean {
  if (!args.isNeedsHuman) return false;
  return !args.lastPushAt || args.now.getTime() - args.lastPushAt.getTime() >= PUSH_GAP_MS;
}

export const PUSH_GAP_MINUTES = PUSH_GAP_MS / 60_000;
export const EMAIL_GAP_MINUTES = EMAIL_GAP_MS / 60_000;

/** Luồng rỗng để dọn: chỉ id có đếm tin = 0. Thiếu/lạ dữ liệu đếm ở BẤT KỲ dòng nào → [] (không xoá nhầm). */
export function emptyThreadIds(rows: { id: string; chat_messages?: { count: number }[] | null }[] | null): string[] {
  if (!rows) return [];
  const out: string[] = [];
  for (const r of rows) {
    const c = r.chat_messages?.[0]?.count;
    if (typeof c !== "number") return [];
    if (c === 0) out.push(r.id);
  }
  return out;
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

export type QuickReplyInput = {
  label?: unknown;
  answer?: unknown;
  audience?: unknown;
  linkLabel?: unknown;
  linkUrl?: unknown;
  sortOrder?: unknown;
  active?: unknown;
};
export type QuickReplyPatch = Partial<{
  label: string;
  answer: string;
  audience: QuickReplyAudience;
  link_label: string | null;
  link_url: string | null;
  sort_order: number;
  active: boolean;
}>;

/** Kiểm dữ liệu nút câu hỏi có sẵn. `creating` = tạo mới (bắt buộc nhãn + câu trả lời). */
export function parseQuickReply(input: QuickReplyInput, creating: boolean): { row: QuickReplyPatch } | { error: string } {
  const row: QuickReplyPatch = {};
  const has = (k: keyof QuickReplyInput) => input[k] !== undefined;
  if (creating || has("label")) {
    const v = cleanText(input.label, 61);
    if (!v || v.length > 60) return { error: "Nhãn nút 1–60 ký tự" };
    row.label = v;
  }
  if (creating || has("answer")) {
    const v = cleanText(input.answer, 1501);
    if (!v || v.length > 1500) return { error: "Câu trả lời 1–1500 ký tự" };
    row.answer = v;
  }
  if (creating || has("audience")) {
    const a = input.audience ?? "any";
    if (a !== "client" && a !== "candidate" && a !== "any") return { error: "Nhóm không hợp lệ" };
    row.audience = a;
  }
  if (creating || has("linkUrl") || has("linkLabel")) {
    const url = cleanText(input.linkUrl, 300);
    const label = cleanText(input.linkLabel, 41);
    if (url && !isSafeLink(url)) return { error: "Link phải là đường dẫn /… hoặc https://" };
    if (url && !label) return { error: "Cần nhãn cho nút link" };
    if (label && label.length > 40) return { error: "Nhãn link tối đa 40 ký tự" };
    row.link_url = url;
    row.link_label = url ? label : null;
  }
  if (has("sortOrder")) {
    const n = Number(input.sortOrder);
    if (!Number.isInteger(n) || n < 0 || n > 100000) return { error: "Thứ tự không hợp lệ" };
    row.sort_order = n;
  }
  if (has("active")) {
    if (typeof input.active !== "boolean") return { error: "active phải là true/false" };
    row.active = input.active;
  }
  if (!Object.keys(row).length) return { error: "Không có gì để lưu" };
  return { row };
}
