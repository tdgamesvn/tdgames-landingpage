/**
 * URL để nhúng CV ứng viên vào popup hồ sơ /hr (iframe), hoặc null nếu không nhúng được
 * (khi đó UI chỉ có nút mở tab mới). Chỉ nhúng file trên cdn.tdgamestudio.com.
 * - PDF: trình xem PDF của trình duyệt.
 * - Word: trình xem Office Online (Microsoft tải file từ link CDN để hiển thị).
 */
export function cvViewerUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  // Chỉ CDN (khác origin với /hr) — nhúng tdgamestudio.com sẽ cùng origin, đọc được HR key.
  if (u.hostname !== "cdn.tdgamestudio.com") return null;
  const path = u.pathname.toLowerCase();
  if (path.endsWith(".pdf")) return `${url.split("#")[0]}#navpanes=0&view=FitH`;
  if (path.endsWith(".docx") || path.endsWith(".doc")) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return null;
}

/**
 * Link ứng viên tự điền (CV/portfolio) → chỉ trả về nếu là http(s), để `window.open`
 * không chạy được `javascript:`/`data:` (React chỉ chặn trong href, không chặn window.open).
 */
export function safeExternalUrl(url: string | null | undefined): string | null {
  const raw = url?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? raw : null;
  } catch {
    return null;
  }
}
