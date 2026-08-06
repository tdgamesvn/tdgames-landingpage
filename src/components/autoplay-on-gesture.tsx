"use client";

import { useEffect } from "react";

/**
 * WebView trong app (Zalo, Messenger, Facebook…) bật mediaPlaybackRequiresUserGesture
 * mặc định → mọi <video autoplay muted> đều bị chặn, khách chỉ thấy poster đứng im.
 * Trang không tắt được cờ đó, nhưng cú chạm/cuộn đầu tiên là "user gesture" hợp lệ →
 * lúc đó gọi play() thì WebView cho chạy.
 *
 * ponytail: không remove listener sau lần đầu — video nằm cuối trang (preload="none")
 * mount muộn, cần gesture sau đó kick tiếp. querySelectorAll trên gesture là rẻ.
 */
export default function AutoplayOnGesture() {
  useEffect(() => {
    const kick = () => {
      document.querySelectorAll<HTMLVideoElement>("video[autoplay]").forEach((v) => {
        if (v.paused) v.play().catch(() => {});
      });
    };
    const opts = { passive: true } as const;
    document.addEventListener("touchstart", kick, opts);
    document.addEventListener("pointerdown", kick, opts);
    document.addEventListener("scroll", kick, opts);
    return () => {
      document.removeEventListener("touchstart", kick);
      document.removeEventListener("pointerdown", kick);
      document.removeEventListener("scroll", kick);
    };
  }, []);

  return null;
}
