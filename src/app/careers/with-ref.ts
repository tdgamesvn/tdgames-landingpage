/**
 * Gắn ?ref= (mã người giới thiệu) của URL hiện tại vào path để giữ attribution khi đi
 * /careers?job=x&ref=A → /careers/x?ref=A → /apply/x?ref=A. Chỉ gọi ở client
 * (lúc render sau khi đã có window, hoặc lúc click).
 */
export function withRef(path: string): string {
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (!ref) return path;
  return `${path}${path.includes("?") ? "&" : "?"}ref=${encodeURIComponent(ref)}`;
}
