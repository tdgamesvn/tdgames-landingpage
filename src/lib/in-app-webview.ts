/**
 * WebView nhúng trong app chat (Zalo, Messenger, Instagram…) không bật
 * allowsInlineMediaPlayback → video nền chạm vào là bung fullscreen player, khách
 * tưởng web lỗi. Ở những app này site bỏ video, chỉ hiện ảnh tĩnh.
 *
 * Dấu hiệu trong UA:
 *   Zalo          → "Zalo"
 *   Messenger/FB  → "FBAN" / "FBAV" / "FB_IAB" / "FBIOS"
 *   Instagram     → "Instagram"
 *   TikTok        → "BytedanceWebview" / "musical_ly"
 *   LINE          → "Line/"
 *
 * ponytail: UA sniffing là heuristic, không phải chân lý — app đổi UA thì tệ nhất là
 * quay lại hành vi cũ (video), không vỡ trang. Không có API nào hỏi được "WebView này
 * cho phát inline không", nên đây là cách duy nhất.
 */
const IN_APP_UA =
  // \b trước Line/ để "Streamline/2.0", "Airline/…" không bị bắt nhầm.
  /(Zalo|FBAN|FBAV|FB_IAB|FBIOS|Instagram|BytedanceWebview|musical_ly|\bLine\/)/i;

export function isInAppWebView(ua: string | undefined | null): boolean {
  return !!ua && IN_APP_UA.test(ua);
}
