"use client";

/**
 * SpineCharacter — Spine 4.2 Web Player wrapper cho Next.js App Router
 *
 * - Transparent background (alpha: true + backgroundColor #00000000)
 * - Physics constraints được xử lý tự động bởi runtime 4.2
 * - SpinePlayer khởi tạo lazy trong useEffect → không crash SSR
 * - Mỗi instance dùng 1 WebGL context → giới hạn khoảng 8-12 instance/page
 *
 * Usage:
 *   <SpineCharacter
 *     jsonUrl="https://cdn.tdgamestudio.com/landing/spine/hero/hero.json"
 *     atlasUrl="https://cdn.tdgamestudio.com/landing/spine/hero/hero.atlas"
 *     animation="idle"
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
  /** Premultiplied alpha — bật nếu texture export với premultiply */
  premultipliedAlpha?: boolean;
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
  premultipliedAlpha = false,
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

        // Render transparent
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

  return <div ref={containerRef} className={className} style={style} />;
}
