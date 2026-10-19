import Image from "next/image";
import Link from "next/link";

import { hexToRgba } from "./portfolio-color-utils";

type Item = { title: string; subtitle?: string; href: string; image: string; accent: string };

/**
 * Lưới thẻ ảnh dẫn sang trang khác — trang tổng Monster Legends (size "large") + dải "các hệ
 * khác" cuối trang hệ ("compact"). Large: điện thoại 1 cột full ngang + nút CTA rõ, viền/quầng
 * theo màu hệ (sếp 2026-10-19: card 2 cột trên mobile bé, không gợi bấm).
 */
export function LinkGrid({ items, size = "compact" }: { items: readonly Item[]; size?: "large" | "compact" }) {
  const large = size === "large";
  return (
    <div
      className={
        large
          ? "grid grid-cols-1 gap-4 px-3 pb-8 pt-4 sm:grid-cols-2 md:px-6 lg:grid-cols-3"
          : "grid grid-cols-2 gap-2 px-3 pb-8 pt-4 sm:gap-3 md:px-6 lg:grid-cols-3"
      }
    >
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="group relative block aspect-video overflow-hidden rounded-2xl border-2 outline-none transition-transform duration-300 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white md:hover:-translate-y-1"
          style={{
            borderColor: hexToRgba(it.accent, large ? 0.7 : 0.45),
            boxShadow: large ? `0 10px 30px -8px ${hexToRgba(it.accent, 0.55)}` : undefined,
          }}
        >
          <Image
            src={it.image}
            alt={it.title}
            fill
            sizes={large ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px" : "(max-width: 1024px) 50vw, 400px"}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: large ? "linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.9) 100%)" : "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)" }}
          />
          <div
            className={
              large
                ? "absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-4 sm:flex-row sm:items-end sm:justify-between sm:gap-3"
                : "absolute inset-x-0 bottom-0 p-2.5 sm:p-4"
            }
          >
            <div
              className={
                large
                  ? "text-[26px] font-black leading-none text-white md:text-[28px]"
                  : "text-[15px] font-black leading-none text-white sm:text-[22px] md:text-[26px]"
              }
              style={{ fontFamily: "var(--font-rajdhani)", textShadow: `0 0 18px ${hexToRgba(it.accent, 0.7)}` }}
            >
              {it.title}
            </div>
            {large && (
              <span
                className="shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold text-black transition-transform group-hover:translate-x-0.5"
                style={{ backgroundColor: it.accent }}
              >
                Watch animations →
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
