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
