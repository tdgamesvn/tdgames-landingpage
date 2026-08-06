"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";

import { AutoLoopMedia } from "@/components/portfolio/auto-loop-media";
import { isInAppWebView } from "@/lib/in-app-webview";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;
const NO_SUBSCRIBE = () => () => {};

/**
 * Media cho các slot admin (page_slots) — sếp upload được cả ảnh lẫn video nên
 * chỗ render phải chịu được cả hai. Video → <video> autoplay/loop (AutoLoopMedia,
 * lazy theo viewport), ảnh → next/image `fill` như cũ.
 * Dùng trong container `relative overflow-hidden`.
 *
 * Trong WebView của app chat (Zalo/Messenger…) video bị đổi thành ảnh `poster`:
 * ở đó chạm vào video là bung fullscreen player, khách tưởng web lỗi. Bỏ luôn cả
 * thẻ <video> nên mp4 cũng không tải — đỡ data cho khách.
 */
export default function SlotMedia({
  src,
  poster,
  className = "",
  sizes = "(max-width:768px) 100vw, 380px",
}: {
  src: string;
  /** Ảnh tĩnh thay video trong WebView app chat; cũng dùng làm poster ở browser thường. */
  poster?: string;
  className?: string;
  sizes?: string;
}) {
  // ponytail: useSyncExternalStore chứ không phải useState+useEffect — đây đúng là
  // "đọc giá trị từ hệ thống ngoài React, server và client khác nhau": server
  // snapshot false, client đọc navigator. Không hydration mismatch, không cascading
  // render. UA không đổi giữa chừng nên subscribe là hàm rỗng.
  const inApp = useSyncExternalStore(
    NO_SUBSCRIBE,
    () => isInAppWebView(navigator.userAgent),
    () => false,
  );

  if (VIDEO_EXT.test(src)) {
    if (inApp && poster) {
      return <Image src={poster} alt="" fill className={className} sizes={sizes} />;
    }
    return (
      <AutoLoopMedia
        src={src}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
        videoProps={poster ? { poster } : undefined}
      />
    );
  }
  return <Image src={src} alt="" fill className={className} sizes={sizes} />;
}
