"use client";

/**
 * SpineCharacter — Spine 4.2 Web Player wrapper cho Next.js App Router
 *
 * - Transparent background (alpha: true + backgroundColor #00000000)
 * - Physics constraints được xử lý tự động bởi runtime 4.2
 * - SpinePlayer khởi tạo lazy trong useEffect → không crash SSR
 * - Mỗi instance dùng 1 WebGL context → giới hạn khoảng 8-12 instance/page
 *
 * Scale / position:
 *   scale    — CSS scale transform (default 1.0). >1 phóng to, <1 thu nhỏ.
 *   offsetX  — dịch ngang (px hoặc "10%"), dương = phải, âm = trái
 *   offsetY  — dịch dọc (px hoặc "10%"), dương = xuống, âm = lên
 *
 * Premultiplied alpha:
 *   premultipliedAlpha — set true nếu texture export với premultiply alpha
 *   (fix viền đen bao quanh sprite). Default: true (phù hợp với hầu hết game assets)
 *
 * Usage:
 *   <SpineCharacter
 *     jsonUrl="/cdn-proxy/landing/spine/hero/hero.json"
 *     atlasUrl="/cdn-proxy/landing/spine/hero/hero.atlas"
 *     animation="idle"
 *     scale={1.2}
 *     offsetX={-20}
 *     offsetY={30}
 *     className="h-[500px] w-full"
 *   />
 */

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

// Import CSS ở module level — Next.js bundler xử lý tại build time
import "@esotericsoftware/spine-player/dist/spine-player.css";

export type SpineCharacterProps = {
  /** URL tới file .json (Spine JSON export) */
  jsonUrl?: string;
  /** URL tới file .skel (Spine binary export) — dùng thay jsonUrl nếu có */
  binaryUrl?: string;
  /** URL tới file .atlas */
  atlasUrl: string;
  /** Tên animation mặc định (vd: "idle", "run", "attack") */
  animation?: string;
  /** Tên skin (nếu skeleton có nhiều skin) */
  skin?: string;
  /**
   * Premultiplied alpha — set true nếu texture export với premultiply alpha.
   * Fix viền đen bao quanh sprite. Default true (phù hợp hầu hết game assets).
   */
  premultipliedAlpha?: boolean;
  /**
   * CSS scale transform — phóng to/thu nhỏ nhân vật.
   * Default 1. Ví dụ: 1.3 = to hơn 30%, 0.8 = nhỏ hơn 20%.
   */
  scale?: number;
  /**
   * Dịch ngang tính từ center (px).
   * Dương = phải, âm = trái. Ví dụ: offsetX={-40} dịch sang trái 40px.
   */
  offsetX?: number;
  /**
   * Dịch dọc tính từ center (px).
   * Dương = xuống, âm = lên. Ví dụ: offsetY={20} dịch xuống 20px.
   */
  offsetY?: number;
  className?: string;
  style?: CSSProperties;
  /** Callback khi load thành công */
  onSuccess?: () => void;
  /** Callback khi load lỗi */
  onError?: (msg: string) => void;
};

export function SpineCharacter({
  jsonUrl,
  binaryUrl,
  atlasUrl,
  animation = "idle",
  skin,
  premultipliedAlpha = true,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  className,
  style,
  onSuccess,
  onError,
}: SpineCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Giữ ref để dispose đúng cách khi unmount
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!jsonUrl && !binaryUrl) {
      console.warn("[SpineCharacter] Cần truyền jsonUrl hoặc binaryUrl");
      return;
    }

    let cancelled = false;

    import("@esotericsoftware/spine-player").then(({ SpinePlayer }) => {
      if (cancelled || !containerRef.current) return;

      playerRef.current = new SpinePlayer(container, {
        // Nguồn skeleton
        jsonUrl,
        binaryUrl,
        atlasUrl,

        // Animation & skin
        animation,
        skin,

        // Render transparent — premultipliedAlpha:true fix viền đen
        alpha: true,
        backgroundColor: "#00000000",
        premultipliedAlpha,
        preserveDrawingBuffer: false,

        // Ẩn toàn bộ UI controls
        showControls: false,
        showLoading: false,

        // Callbacks
        success: onSuccess ? () => onSuccess() : undefined,
        error: onError ? (_player: unknown, msg: string) => onError(msg) : undefined,
      });
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.dispose?.();
      } catch {
        // ignore errors during cleanup
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonUrl, binaryUrl, atlasUrl, animation, skin, premultipliedAlpha]);

  // Tính transform string từ scale + offset
  const transformParts: string[] = [];
  if (offsetX !== 0 || offsetY !== 0) transformParts.push(`translate(${offsetX}px, ${offsetY}px)`);
  if (scale !== 1) transformParts.push(`scale(${scale})`);
  const transform = transformParts.length > 0 ? transformParts.join(" ") : undefined;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...style,
        ...(transform ? { transform, transformOrigin: "center center" } : {}),
      }}
    />
  );
}
