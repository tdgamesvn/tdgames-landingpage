/**
 * URL để nhúng CV ứng viên vào popup hồ sơ /hr (iframe), hoặc null nếu không nhúng được
 * (khi đó UI chỉ có nút mở tab mới). Chỉ nhúng file trên CDN của mình.
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
  if (u.hostname !== "tdgamestudio.com" && !u.hostname.endsWith(".tdgamestudio.com")) return null;
  const path = u.pathname.toLowerCase();
  if (path.endsWith(".pdf")) return `${url.split("#")[0]}#navpanes=0&view=FitH`;
  if (path.endsWith(".docx") || path.endsWith(".doc")) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return null;
}
