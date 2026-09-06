"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuoteStyleListener } from "./hero-layout-state";
import { useSlotUrl, BRAND_LOGO_FALLBACK } from "@/lib/use-slot-url";

function navHrefPath(href: string) {
  const i = href.indexOf("#");
  return i === -1 ? href : href.slice(0, i);
}

const navLinks = [
  {
    label: "SERVICES",
    children: [
      {
        label: "2D Art",
        href: "/services/2d-art",
        description: "Characters, Environments, UI/UX, Props & more",
        icon: "art",
      },
      {
        label: "2D Animation",
        href: "/services/2d-animation",
        description: "Spine Animation, Frame by Frame, Cutscenes & more",
        icon: "animation",
      },
      {
        label: "2D VFX",
        href: "/services/2d-vfx",
        description: "Skill Effects, Particles, Explosions & more",
        icon: "vfx",
      },
      // {
      //   label: "FAQ",
      //   href: "/portfolio#portfolio-faq",
      //   description: "Pipeline, timelines, NDA & how we collaborate",
      //   icon: "faq",
      // },
      // {
      //   label: "Contact",
      //   href: "/portfolio#contact",
      //   description: "Start a project or request a quote",
      //   icon: "contact",
      // },
    ],
  },
  { label: "PORTFOLIO", href: "/portfolio" },
  // Ẩn khỏi nav cho tới khi showreel xong — trang /showreel VẪN chạy để gửi
  // link riêng cho khách, chỉ là không quảng cáo trên menu. Xong thì bỏ comment.
  // { label: "SHOWREEL", href: "/showreel" },
  { label: "ABOUT", href: "/about" },
  { label: "BLOG", href: "/blog" },
  { label: "TOOLS", href: "/tools" },
  { label: "CAREERS", href: "/careers" },
] as const;

function ServiceIcon({ type }: { type: string }) {
  if (type === "faq") {
    return (
      <svg
        className="h-7 w-7 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }
  if (type === "contact") {
    return (
      <svg
        className="h-7 w-7 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    );
  }

  // 2D Art — palette / brush
  if (type === "art") {
    return (
      <svg className="h-7 w-7 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-9.95 9c-.07.78.57 1.43 1.35 1.43h.1c.7 0 1.3-.52 1.42-1.2A7 7 0 1 1 19 16H5" />
        <path d="M5 16v3a2 2 0 0 0 2 2h1" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  }

  // 2D Animation — running figure
  if (type === "animation") {
    return (
      <svg className="h-7 w-7 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="13" cy="4" r="1.5" />
        <path d="M7.5 13.5 10 11l2.5 2.5L15 9" />
        <path d="m9 19 2-6 3 3 2-4" />
        <path d="M3 13h4M17 13h4" />
      </svg>
    );
  }

  // 2D VFX — sparkle / effects
  return (
    <svg className="h-7 w-7 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.64 5.64l1.42 1.42M16.95 16.95l1.41 1.41M5.64 18.36l1.42-1.42M16.95 7.05l1.41-1.41" />
      <circle cx="12" cy="12" r="4" />
      <path d="m8 12 1.5 1.5M14.5 10.5 16 12M12 8v1M12 15v1" />
    </svg>
  );
}

function QuoteButton({
  style,
  scrolled,
}: {
  style: ReturnType<typeof useQuoteStyleListener>;
  scrolled: boolean;
}) {
  const base =
    "hidden md:inline-flex items-center gap-2.5 font-black text-[13px] uppercase tracking-[0.12em] transition-all duration-200";
  const font = { fontFamily: "var(--font-nunito-sans)" };

  if (style === "amber-clip")
    return (
      <Link
        href="/contact"
        className={`${base} bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_28px_rgba(245,158,11,0.55)]`}
        style={{
          ...font,
          clipPath:
            "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
        }}
      >
        Get a Free Quote
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.8}
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      </Link>
    );

  if (style === "white-round")
    return (
      <Link
        href="/contact"
        className={`${base} rounded-full bg-white hover:bg-amber-300 text-black px-7 py-2.5`}
        style={font}
      >
        Get a Free Quote
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.8}
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      </Link>
    );

  if (style === "outline-amber")
    return (
      <Link
        href="/contact"
        className={`${base} px-7 py-2.5 transition-all duration-300 ${
          scrolled
            ? "rounded-full border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black"
            : "rounded-full bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]"
        }`}
        style={font}
      >
        Get a Free Quote
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.8}
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      </Link>
    );

  // glow-pulse
  return (
    <Link
      href="/contact"
      className={`${base} rounded-lg bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5`}
      style={{
        ...font,
        boxShadow: "0 0 0 0 rgba(245,158,11,0.7)",
        animation: "glow-ping 2s ease-in-out infinite",
      }}
    >
      Get a Free Quote →
    </Link>
  );
}

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const pathname = usePathname();
  const quoteStyle = useQuoteStyleListener();
  const logoUrl = useSlotUrl("global", "brand-logo", BRAND_LOGO_FALLBACK);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#07080f]/85 backdrop-blur-xl border-b border-white/8 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-transparent"
      }`}
    >
      <div className="py-2.5 md:py-3">
        <div
          className="mx-auto flex h-[76px] items-center justify-between md:h-[80px]"
          style={{ width: "var(--layout-width, 75%)" }}
        >
          <Link
            href="/"
            className="flex h-full shrink-0 items-center"
            aria-label="TD Games home"
          >
            <Image
              src={logoUrl}
              alt=""
              width={260}
              height={76}
              className="h-[46px] w-auto object-contain object-left transition-[filter] duration-300 [filter:drop-shadow(0_0_6px_rgba(245,158,11,0.35))_drop-shadow(0_0_20px_rgba(245,158,11,0.18))] hover:[filter:drop-shadow(0_0_8px_rgba(245,158,11,0.55))_drop-shadow(0_0_26px_rgba(245,158,11,0.28))] md:h-[54px] lg:h-[58px]"
              priority
            />
          </Link>

          <nav className="hidden md:flex h-full items-center">
            {navLinks.map((link) => {
              const isActive =
                ("href" in link && pathname === link.href) ||
                ("children" in link &&
                  link.children.some(
                    (child) => pathname === navHrefPath(child.href),
                  ));

              if ("children" in link) {
                return (
                  <div key={link.label} className="relative group">
                    <button
                      type="button"
                      className={`nav-link services-trigger inline-flex cursor-default items-center transition-all duration-300 ${isActive ? "active-link" : "text-white"}`}
                      style={{
                        fontFamily: "var(--font-nunito-sans), sans-serif",
                        fontSize: "17px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        padding: "7px 14px",
                        margin: "0 5px",
                        lineHeight: 1,
                      }}
                      aria-haspopup="menu"
                    >
                      {link.label}
                      <svg
                        className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:rotate-180"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    <div className="pointer-events-none invisible absolute left-1/2 top-full z-50 w-[360px] -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100">
                      <div className="relative rounded-2xl border border-white/20 bg-[linear-gradient(165deg,rgba(8,8,12,0.96)_0%,rgba(15,12,24,0.94)_52%,rgba(17,12,31,0.9)_100%)] p-3.5 shadow-[0_18px_44px_rgba(0,0,0,0.62)] backdrop-blur-md">
                        <div className="absolute top-[-7px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-l border-t border-white/20 bg-[#1a1005]" />
                        {link.children.map((child, index) => {
                          const isChildActive =
                            pathname === navHrefPath(child.href) &&
                            !child.href.includes("#");
                          return (
                            <div key={child.href}>
                              <Link
                                href={child.href}
                                className={`group/item flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all duration-200 ${
                                  isChildActive
                                    ? "bg-white/[0.06] text-white"
                                    : "text-white/92 hover:bg-[#f7a31c]/10 hover:text-white"
                                }`}
                                style={{
                                  fontFamily:
                                    "var(--font-nunito-sans), sans-serif",
                                }}
                              >
                                <span
                                  className={`inline-flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-xl border ${
                                    isChildActive
                                      ? "border-[#ffb867]/45 bg-[#ff9f1a]/6 text-[#ff9f1a] shadow-[0_0_10px_rgba(255,159,26,0.18)]"
                                      : "border-white/24 bg-white/7 text-[#ff9f1a] group-hover/item:border-white/45 group-hover/item:bg-white/12 group-hover/item:shadow-[0_0_12px_rgba(255,255,255,0.14)]"
                                  }`}
                                >
                                  <ServiceIcon type={child.icon} />
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="block text-[17px] font-bold leading-tight">
                                    {child.label}
                                  </span>
                                  <span className="mt-0.5 block text-[14px] leading-snug text-white/80">
                                    {child.description}
                                  </span>
                                </span>

                                <svg
                                  className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                                    isChildActive
                                      ? "text-[#ffb867]"
                                      : "text-white/75 group-hover/item:translate-x-0.5"
                                  }`}
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 5l5 5-5 5"
                                  />
                                </svg>
                              </Link>
                              {index < link.children.length - 1 && (
                                <div className="mx-2 my-1 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link transition-all duration-300 ${isActive ? "active-link" : "text-white"}`}
                  style={{
                    fontFamily: "var(--font-nunito-sans), sans-serif",
                    fontSize: "17px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    padding: "7px 14px",
                    margin: "0 5px",
                    lineHeight: 1,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex h-full items-center gap-2">
            <QuoteButton style={quoteStyle} scrolled={scrolled} />

            <button
              className="md:hidden flex flex-col gap-1.5 p-2.5 rounded-lg border border-white/14 bg-white/6"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span
                className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
              />
              <span
                className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="mx-5 mt-2 md:hidden rounded-2xl border border-white/12 bg-[#090a0f]/96 backdrop-blur-xl px-5 py-5 flex flex-col gap-2 shadow-[0_18px_36px_rgba(0,0,0,0.5)]">
          {navLinks.map((link) => {
            const isActive =
              ("href" in link && pathname === link.href) ||
              ("children" in link &&
                link.children.some(
                  (child) => pathname === navHrefPath(child.href),
                ));

            if ("children" in link) {
              return (
                <div
                  key={link.label}
                  className="rounded-lg border border-white/10"
                >
                  <button
                    type="button"
                    onClick={() => setMobileServicesOpen((prev) => !prev)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] transition-colors ${
                      isActive
                        ? "bg-amber-400/16 text-amber-200"
                        : "text-white/80 hover:bg-white/8 hover:text-white"
                    }`}
                    style={{ fontFamily: "var(--font-nav-display)" }}
                  >
                    {link.label}
                    <svg
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${mobileServicesOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {mobileServicesOpen && (
                    <div className="px-2 pb-2">
                      {link.children.map((child) => {
                        const isChildActive =
                          pathname === navHrefPath(child.href) &&
                          !child.href.includes("#");
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMenuOpen(false)}
                            className={`mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-wider ${
                              isChildActive
                                ? "bg-amber-400/16 text-amber-200"
                                : "text-white/85 hover:bg-white/8 hover:text-white"
                            }`}
                            style={{ fontFamily: "var(--font-nav-display)" }}
                          >
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/38 bg-white/10 text-[#ff9f1a] shadow-[0_0_12px_rgba(247,163,28,0.2)]">
                              <ServiceIcon type={child.icon} />
                            </span>
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] ${
                  isActive
                    ? "bg-amber-400/16 text-amber-200"
                    : "text-white/80 hover:bg-white/8 hover:text-white"
                }`}
                style={{ fontFamily: "var(--font-nav-display)" }}
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            href="/contact"
            onClick={() => setMenuOpen(false)}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-white text-black hover:bg-amber-300 px-6 py-3 text-sm font-black uppercase tracking-[0.15em]"
            style={{ fontFamily: "var(--font-nav-display)" }}
          >
            Get a Free Quote
          </Link>
        </div>
      )}
    </header>
  );
}
