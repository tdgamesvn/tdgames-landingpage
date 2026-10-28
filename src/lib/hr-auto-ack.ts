/**
 * Mail "Cảm ơn ứng tuyển" tự động — phần thuần (không I/O). Gửi thật ở `hr-auto-ack-send.ts`.
 */

import { isValidEmail } from "./hr-email.ts";

/** app_settings key bật/tắt. Giá trị "off" = tắt; không có dòng / giá trị khác = BẬT. */
export const AUTO_ACK_KEY = "hr_auto_ack";

/** Cột sent_by của mail do hệ thống gửi. */
export const AUTO_ACK_SENT_BY = "Hệ thống (tự động)";

/** Cửa sổ chống gửi trùng (cùng email + cùng job). */
export const AUTO_ACK_DEDUPE_HOURS = 24;

export function isAutoAckEnabled(value: unknown): boolean {
  return !(typeof value === "string" && value.trim().toLowerCase() === "off");
}

/** Trần toàn hệ thống: số mail ack tối đa mỗi giờ (chống dùng form làm relay). */
export const AUTO_ACK_HOURLY_CAP = 30;
/** Trần theo IP: số mail ack tối đa / IP / 24 giờ (in-memory). */
export const AUTO_ACK_IP_MAX = 3;

/** Chặt hơn isValidEmail, chỉ cho mail ack: đúng 1 địa chỉ, không ký tự phân tách / ngoặc / dấu nháy / khoảng trắng, ≤ 254. */
export function isStrictAckEmail(email: string | null | undefined): boolean {
  if (typeof email !== "string") return false;
  const e = email.trim();
  if (e.length === 0 || e.length > 254) return false;
  if (/[\s,;<>"']/.test(e)) return false;
  return isValidEmail(e);
}

const DOMAIN_LIKE = /\w+\.(com|net|org|vn|io|xyz|ru|cn|info|link|top)\b/i;

/** Tên ứng viên đưa vào mail ack: có URL / email / tên miền → "bạn"; bỏ ký tự điều khiển; ≤ 60 ký tự. */
export function sanitizeAckName(name: string | null | undefined): string {
  const clean = String(name ?? "")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "bạn";
  if (/:\/\/|www\.|@/i.test(clean) || DOMAIN_LIKE.test(clean)) return "bạn";
  return clean.slice(0, 60).trim() || "bạn";
}

export type AckDecision =
  | { send: true }
  | { send: false; reason: "disabled" | "invalid_email" | "job_inactive" | "duplicate" | "hourly_cap" };

/**
 * Quyết định có gửi mail ack không. `recentCount` = số mail ack cùng email trong 24 giờ qua (MỌI job);
 * `hourlyCount` = số mail ack toàn hệ thống trong 1 giờ qua.
 */
export function shouldSendAck(input: {
  enabled: boolean;
  email: string | null | undefined;
  recentCount: number;
  jobActive?: boolean;
  hourlyCount?: number;
}): AckDecision {
  if (!input.enabled) return { send: false, reason: "disabled" };
  if (input.jobActive === false) return { send: false, reason: "job_inactive" };
  if (!isStrictAckEmail(input.email)) return { send: false, reason: "invalid_email" };
  if (input.recentCount > 0) return { send: false, reason: "duplicate" };
  if ((input.hourlyCount ?? 0) >= AUTO_ACK_HOURLY_CAP) return { send: false, reason: "hourly_cap" };
  return { send: true };
}
