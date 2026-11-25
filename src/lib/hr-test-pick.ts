// Chọn đề test gửi cho từng ứng viên (sếp 2026-11-25) — hàm thuần, dùng ở API /hr, /test/<token> và test.
/**
 * Đề gửi cho 1 ứng viên. `testIds` null/rỗng hoặc toàn id đã bị xoá → tất cả đề của job (như trước khi
 * có tính năng chọn đề). Giữ thứ tự của `tests` (sort_order).
 */
export function pickTestsForApplication<T extends { id: string }>(tests: readonly T[], testIds: readonly string[] | null | undefined): T[] {
  if (!testIds?.length) return [...tests];
  const chosen = tests.filter((t) => testIds.includes(t.id));
  return chosen.length ? chosen : [...tests];
}

/** Job có ≥ 2 đề mà hồ sơ chưa chọn đề nào còn tồn tại → phải chọn trước khi gửi link/mail. */
export function needsTestChoice(tests: readonly { id: string }[], testIds: readonly string[] | null | undefined): boolean {
  if (tests.length < 2) return false;
  return !testIds?.some((id) => tests.some((t) => t.id === id));
}
