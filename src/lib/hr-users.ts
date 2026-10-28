// Luật đổi tài khoản /hr — thuần, không import server.
import type { HrRole } from "./hr-permissions.ts";

/** null = hợp lệ; chuỗi = lỗi tiếng Việt. activeBossCount = số boss chưa bị khoá (trước thay đổi). */
export function validateUserChange(
  actor: { id: string | null },
  target: { id: string; role: HrRole; disabled: boolean },
  change: { role?: HrRole; disabled?: boolean },
  activeBossCount: number,
): string | null {
  const self = actor.id !== null && actor.id === target.id;
  if (self && change.disabled === true) return "Không thể tự khoá tài khoản của mình";
  if (self && change.role !== undefined && change.role !== "boss") return "Không thể tự đổi vai của mình";
  const losesBoss =
    target.role === "boss" &&
    !target.disabled &&
    (change.disabled === true || (change.role !== undefined && change.role !== "boss"));
  if (losesBoss && activeBossCount <= 1) return "Phải còn ít nhất 1 tài khoản Sếp";
  return null;
}

/**
 * ID Discord (snowflake 17–20 chữ số) để tag `<@id>`. Nhận cả dạng dán mention `<@id>` / `<@!id>`.
 * Rỗng / null → null (xoá ID); sai định dạng → "invalid".
 */
export function parseDiscordId(v: unknown): string | null | "invalid" {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return "invalid";
  const s = v.trim();
  if (!s) return null;
  const m = /^(?:<@!?)?(\d{17,20})>?$/.exec(s);
  return m ? m[1] : "invalid";
}

/**
 * Số điện thoại tài khoản (hiện trong mail ứng viên, vd. người liên hệ ở mail offer).
 * Bỏ dấu cách / chấm / gạch / ngoặc; giữ "+" đầu. 9–13 chữ số. Rỗng / null → null (xoá); sai → "invalid".
 */
export function parsePhone(v: unknown): string | null | "invalid" {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return "invalid";
  const s = v.trim().replace(/[\s.\-()]/g, "");
  if (!s) return null;
  return /^\+?\d{9,13}$/.test(s) ? s : "invalid";
}
