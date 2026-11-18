/**
 * Ứng viên rút lại sau khi đã nhận offer (sếp hỏi 2026-11-18) — phần thuần:
 * câu hỏi lại khi đổi Kết quả offer khỏi "Đã nhận", và danh sách ứng viên dự phòng cùng job.
 */

export type BackupApp = { id: string; job_id: string; full_name: string; status: string; work_type: string | null };

const TALENT_POOL = "talent_pool";

/** Ứng viên cùng job (bỏ chính hồ sơ + freelancer): `pool` = cột Lưu hồ sơ, `open` = đang trong pipeline. */
export function backupCandidates<T extends BackupApp>(
  apps: readonly T[],
  current: { id: string; job_id: string },
  openKeys: ReadonlySet<string>,
): { pool: T[]; open: T[] } {
  const same = apps.filter((a) => a.job_id === current.job_id && a.id !== current.id && a.work_type !== "freelancer");
  return {
    pool: same.filter((a) => a.status === TALENT_POOL),
    open: same.filter((a) => openKeys.has(a.status)),
  };
}

const RESULT_LABEL: Record<string, string> = { pending: "Chờ trả lời", accepted: "Đã nhận", declined: "Từ chối" };

/** Câu hỏi lại khi rời "Đã nhận"; null = không cần hỏi. */
export function leaveAcceptedWarning(from: string | null, to: string): string | null {
  if (from !== "accepted" || to === "accepted") return null;
  return [
    `Đổi kết quả offer từ "Đã nhận" sang "${RESULT_LABEL[to] ?? to}"?`,
    "",
    "• Khối Onboard ẩn đi và ngừng nhắc việc (checklist đã tích vẫn giữ — đổi lại Đã nhận sẽ hiện lại).",
    "• Các khoản hoa hồng giới thiệu chưa duyệt sẽ bị huỷ.",
    "• Khoản đã duyệt / đã trả KHÔNG tự huỷ — Kế toán xử lý tay.",
  ].join("\n");
}
