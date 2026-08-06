import Image from "next/image";

import { AutoLoopMedia } from "@/components/portfolio/auto-loop-media";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

/**
 * Media cho các slot admin (page_slots) — sếp upload được cả ảnh lẫn video nên
 * chỗ render phải chịu được cả hai. Video → <video> autoplay/loop (AutoLoopMedia,
 * lazy theo viewport), ảnh → next/image `fill` như cũ.
 * Dùng trong container `relative overflow-hidden`.
 */
export default function SlotMedia({
  src,
  poster,
  className = "",
  sizes = "(max-width:768px) 100vw, 380px",
}: {
  src: string;
  /** Ảnh đứng thay video khi WebView trong app (Zalo/Messenger) chặn autoplay. */
  poster?: string;
  className?: string;
  sizes?: string;
}) {
  if (VIDEO_EXT.test(src)) {
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
