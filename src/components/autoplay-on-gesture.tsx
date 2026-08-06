"use client";

import { useEffect } from "react";

/**
 * WebView trong app (Zalo, Messenger, Facebook…) bật mediaPlaybackRequiresUserGesture
 * mặc định → mọi video tự phát đều bị chặn, khách chỉ thấy poster đứng im. Trang không
 * tắt được cờ đó, nhưng cú chạm/cuộn đầu tiên là "user gesture" hợp lệ → lúc đó gọi
 * play() thì WebView cho chạy.
 *
 * Quét `video:not([controls])` chứ KHÔNG phải `video[autoplay]`: nửa số video trên site
 * (AutoLoopMedia/SlotMedia) không có thuộc tính autoplay, chúng play() bằng
 * IntersectionObserver — cũng bị WebView chặn y hệt. Lọc `controls` để chừa video có
 * player thật, khách bấm play chứ mình đừng tự chạy.
 *
 * ponytail: chỉ kick video đang lọt viewport — AutoLoopMedia cố ý pause() video ngoài
 * màn hình để đỡ decoder, ép chạy hết sẽ phá đúng cái tối ưu đó. rAF throttle vì trang
 * case study có 30+ video.
 */
export default function AutoplayOnGesture() {
  useEffect(() => {
    let queued = false;

    const kick = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        document
          .querySelectorAll<HTMLVideoElement>("video:not([controls])")
          .forEach((v) => {
            if (!v.paused || !v.muted) return;
            const r = v.getBoundingClientRect();
            if (r.width === 0 || r.bottom < 0 || r.top > window.innerHeight) return;
            v.play().catch(() => {});
          });
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
