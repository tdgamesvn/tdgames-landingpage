"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, VideoHTMLAttributes } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: "lazy" | "eager";
  draggable?: boolean;
  videoProps?: VideoHTMLAttributes<HTMLVideoElement>;
};

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

/**
 * Smart media element used across portfolio case studies.
 *
 * - When `src` is a video URL, renders `<video>` and uses an IntersectionObserver
 *   to *only* load + play when the element is near the viewport. This avoids
 *   the worst-case where 30+ MP4s on a long case study page all autoplay/
 *   decode simultaneously and tank scroll performance.
 * - When `src` is a still image, falls back to a regular `<img loading="lazy">`.
 *
 * Heuristics:
 *   - `preload="none"` until within 25% viewport — then we set `src` and call
 *     `load()` + `play()`.
 *   - When the element scrolls fully out of view we `pause()` to release
 *     decoder resources; we do NOT unset `src` (re-fetching would jank).
 */
export function AutoLoopMedia({
  src,
  alt,
  className,
  style,
  loading = "lazy",
  draggable = false,
  videoProps,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isVideo = VIDEO_EXT.test(src);

  useEffect(() => {
    if (!isVideo) return;
    const el = videoRef.current;
    if (!el) return;

    let loaded = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!loaded) {
              loaded = true;
              // ponytail: #t=0.001 buộc browser seek + decode frame đầu, nên khi
              // WebView trong app (Zalo/Messenger) chặn play() thì khách vẫn thấy
              // hình thay vì ô đen. Video này không có poster.
              if (!el.src) el.src = src.includes("#") ? src : `${src}#t=0.001`;
              try {
                el.load();
              } catch {
                /* ignore */
              }
            }
            const p = el.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
          } else {
            try {
              el.pause();
            } catch {
              /* ignore */
            }
          }
        }
      },
      { rootMargin: "300px 0px", threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src, isVideo]);

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        className={className}
        style={style}
        loop
        muted
        playsInline
        preload="none"
        aria-label={alt}
        // Note: src is intentionally NOT set here — IntersectionObserver assigns
        // it lazily so off-screen videos do not even hit the network.
        {...videoProps}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      draggable={draggable}
    />
  );
}
