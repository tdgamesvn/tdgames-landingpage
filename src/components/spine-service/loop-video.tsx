"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Video lặp, tắt tiếng — chỉ gắn `src` khi gần vào màn hình và dừng khi ra xa, để trang có
 * ~10 clip không tải hết một lúc. Người dùng bật giảm chuyển động → chỉ hiện poster.
 */
export default function LoopVideo({
  src,
  poster,
  className = "",
  style,
  label,
}: {
  src: string;
  poster: string;
  className?: string;
  style?: React.CSSProperties;
  /** Mô tả cho trình đọc màn hình. */
  label?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setNear(e.isIntersecting);
        if (e.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={near ? src : undefined}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay={near}
      preload="none"
      aria-label={label}
      className={className}
      style={style}
    />
  );
}
