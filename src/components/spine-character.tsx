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
  /** Tên animation mặc định (vd: "idle", "run", "attack") — kept for backwards compat */
  animation?: string;
  /** Danh sách animations để loop tuần tự — ưu tiên hơn animation */
  animations?: string[];
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
  /**
   * Thời gian crossfade giữa các animations trong sequence (giây).
   * 0 = hard cut (không mix). 0.2 = blend mượt 200ms. Default: 0.
   */
  mixDuration?: number;
  /** Callback khi load thành công */
  onSuccess?: () => void;
  /** Callback khi load lỗi */
  onError?: (msg: string) => void;
};

export function SpineCharacter({
  jsonUrl,
  binaryUrl,
  atlasUrl,
  animation,
  animations,
  skin,
  premultipliedAlpha = true,
  mixDuration = 0,
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

        // Skin — animation controlled via success callback
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
        success: (_player) => {
          const anims =
            animations && animations.length > 0
              ? animations
              : animation
              ? [animation]
              : ["idle"];

          const state = (_player as any).animationState;
          if (!state) {
            onSuccess?.();
            return;
          }

          // Set crossfade duration between animations
          if (mixDuration > 0 && state.data) {
            state.data.defaultMix = mixDuration;
            // Cùng tên nối tiếp chính nó (breathe → breathe) thì hard cut:
            // crossfade một animation với bản lệch pha của nó trông rất kỳ.
            for (const name of new Set(anims)) state.data.setMix(name, name, 0);
          }

          if (anims.length === 1) {
            state.setAnimation(0, anims[0], true);
          } else {
            state.setAnimation(0, anims[0], false);
            for (let i = 1; i < anims.length; i++) {
              state.addAnimation(0, anims[i], false, 0);
            }
            state.addListener({
              complete: (entry: any) => {
                // Dùng entry.next === null thay vì so tên animation,
                // để hỗ trợ duplicate animations trong sequence.
                // entry.next === null nghĩa là không còn animation nào
                // được queue phía sau → đây thực sự là animation cuối.
                if (entry.trackIndex === 0 && entry.next === null) {
                  state.setAnimation(0, anims[0], false);
                  for (let i = 1; i < anims.length; i++) {
                    state.addAnimation(0, anims[i], false, 0);
                  }
                }
              },
            });
          }
          // Camera: mình gọi state.setAnimation() thẳng nên player.setViewport()
          // không bao giờ chạy → khung hình khoá theo animation đầu (breathe), các
          // animation vươn xa hơn (attack: kiếm + lửa) bị cắt mất phần thò ra.
          // Khung dưới đây ôm bounds của TẤT CẢ animation trong sequence: không cắt,
          // và camera đứng yên thay vì zoom giật mỗi lần đổi animation.
          // ponytail: chạm internal của spine-player (currentViewport,
          // calculateAnimationViewport). Lib đổi tên field → catch, rơi về khung mặc định.
          try {
            const p = _player as any;
            let box: { x: number; y: number; width: number; height: number } | null = null;
            for (const name of new Set(anims)) {
              const anim = p.skeleton?.data?.findAnimation?.(name);
              if (!anim) continue;
              const v = { x: 0, y: 0, width: 0, height: 0 };
              p.calculateAnimationViewport(anim, v);
              if (!(v.width > 0 && v.height > 0)) continue;
              if (!box) {
                box = v;
                continue;
              }
              const right = Math.max(box.x + box.width, v.x + v.width);
              const top = Math.max(box.y + box.height, v.y + v.height);
              box.x = Math.min(box.x, v.x);
              box.y = Math.min(box.y, v.y);
              box.width = right - box.x;
              box.height = top - box.y;
            }
            if (box) {
              p.currentViewport = {
                ...box,
                padLeft: box.width * 0.04,
                padRight: box.width * 0.04,
                padTop: box.height * 0.04,
                padBottom: box.height * 0.04,
              };
              p.previousViewport = null; // khỏi lerp từ khung cũ
            }
          } catch {
            // giữ nguyên khung mặc định của player
          }

          onSuccess?.();
        },
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
  }, [jsonUrl, binaryUrl, atlasUrl, animation, animations, skin, premultipliedAlpha]);

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
