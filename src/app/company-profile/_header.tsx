"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSlotUrl, BRAND_LOGO_FALLBACK } from "@/lib/use-slot-url";

// ponytail: copy phần thanh của SiteHeader (fixed + blur khi scroll + logo glow),
// bỏ nav/dropdown/quote/mobile menu. Trang này là tài liệu gửi khách nên không
// có tab điều hướng — nhưng thanh header vẫn giống site.
export default function ProfileHeader() {
  const [scrolled, setScrolled] = useState(false);
  const logoUrl = useSlotUrl("global", "brand-logo", BRAND_LOGO_FALLBACK);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/8 bg-[#07080f]/85 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="py-2.5 md:py-3">
        <div
          className="mx-auto flex h-[76px] items-center md:h-[80px]"
          style={{ width: "min(var(--layout-width, 88%), 1280px)" }}
        >
          <Link href="/" className="flex h-full shrink-0 items-center" aria-label="TD Games home">
            <Image
              src={logoUrl}
              alt="TD Games Studio"
              width={260}
              height={76}
              priority
              className="h-[46px] w-auto object-contain object-left [filter:drop-shadow(0_0_6px_rgba(245,158,11,0.35))_drop-shadow(0_0_20px_rgba(245,158,11,0.18))] md:h-[54px] lg:h-[58px]"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
