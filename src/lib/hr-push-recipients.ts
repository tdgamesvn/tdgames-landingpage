import type { HrRole, PermissionKey } from "./hr-permissions.ts";

/**
 * Ai nhận nhắc lịch PV của 1 ứng viên: có quyền `push.receive`, chưa bị khoá;
 * vai leader chỉ khi là Leader của job ứng viên đó.
 */
export function pushRecipientUserIds(
  users: { id: string; role: HrRole; disabled: boolean }[],
  perms: Map<HrRole, Set<PermissionKey>>,
  jobLeaderId: string | null,
): string[] {
  return users
    .filter((u) => {
      if (u.disabled) return false;
      if (!perms.get(u.role)?.has("push.receive")) return false;
      if (u.role === "leader") return jobLeaderId !== null && u.id === jobLeaderId;
      return true;
    })
    .map((u) => u.id);
}
