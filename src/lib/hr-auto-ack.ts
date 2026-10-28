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

export type AckDecision = { send: true } | { send: false; reason: "disabled" | "invalid_email" | "duplicate" };

/** Quyết định có gửi mail ack không. `recentCount` = số mail ack cùng email + job trong 24 giờ qua. */
export function shouldSendAck(input: { enabled: boolean; email: string | null | undefined; recentCount: number }): AckDecision {
  if (!input.enabled) return { send: false, reason: "disabled" };
  if (!isValidEmail(input.email)) return { send: false, reason: "invalid_email" };
  if (input.recentCount > 0) return { send: false, reason: "duplicate" };
  return { send: true };
}
