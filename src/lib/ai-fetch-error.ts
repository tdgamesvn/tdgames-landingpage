/**
 * Câu báo lỗi khi fetch tới cliproxyapi ném lỗi (không có response).
 * Tách riêng timeout ra: model chậm (vd. gpt-6.1-sol ~70s cho bộ câu hỏi PV)
 * bị AbortSignal.timeout cắt — trước đây báo nhầm "Mac tắt" (LOG 2026-11-16).
 */
export function aiFetchErrorMessage(err: unknown, timeoutMs: number): string {
  const name = (err as { name?: string } | null)?.name;
  if (name === "TimeoutError" || name === "AbortError") {
    return `AI trả lời quá lâu (quá ${Math.round(timeoutMs / 1000)} giây) — bấm lại thử, nếu vẫn lỗi báo dev`;
  }
  return "AI backend unreachable (Mac tắt / cliproxyapi không chạy?)";
}
