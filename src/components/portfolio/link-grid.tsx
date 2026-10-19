import Image from "next/image";
import Link from "next/link";

import { hexToRgba } from "./portfolio-color-utils";

/** Lưới thẻ ảnh dẫn sang trang khác — trang tổng Monster Legends + dải "các hệ khác". */
export function LinkGrid({
  items,
}: {
  items: readonly { title: string; subtitle?: string; href: string; image: string; accent: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 px-3 pb-8 pt-4 sm:gap-3 md:px-6 lg:grid-cols-3">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="group relative block aspect-video overflow-hidden rounded-2xl border border-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Image
            src={it.image}
            alt={it.title}
            fill
            sizes="(max-width: 1024px) 50vw, 400px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.82) 100%)" }}
          />
          <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-4">
            <div
              className="text-[15px] font-black leading-none text-white sm:text-[22px] md:text-[26px]"
              style={{ fontFamily: "var(--font-rajdhani)", textShadow: `0 0 18px ${hexToRgba(it.accent, 0.6)}` }}
            >
              {it.title}
            </div>
            {it.subtitle && (
              <div className="mt-1 text-[13px] font-semibold" style={{ color: it.accent }}>
                {it.subtitle}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
