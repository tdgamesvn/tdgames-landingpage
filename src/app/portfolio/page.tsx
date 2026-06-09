"use client";

import dynamic from "next/dynamic";
import { Nunito_Sans } from "next/font/google";
import { useEffect } from "react";
import SiteHeader from "@/components/site-header";
import PortfolioGridApi from "@/components/portfolio-grid-api";
import { AccentHighlight } from "@/components/accent-highlight";
import PortfolioHero from "@/components/portfolio/portfolio-hero";
import siteContent from "@/content/site.json";
import type { ShowcaseProject } from "@/types/site-content";

const PortfolioLowerSections = dynamic(
  () => import("@/components/portfolio-lower-sections"),
  {
    loading: () => (
      <div
        className="min-h-[50vh] border-t border-white/10 bg-[#0a0a0a]"
        aria-hidden
      />
    ),
  },
);

const nunitoSans = Nunito_Sans({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

const showcaseProjects: ShowcaseProject[] =
  (siteContent as Record<string, unknown>).portfolio &&
  Array.isArray(
    ((siteContent as Record<string, unknown>).portfolio as Record<string, unknown>)
      ?.showcaseProjects,
  )
    ? (
        ((siteContent as Record<string, unknown>).portfolio as Record<string, unknown>)
          .showcaseProjects as ShowcaseProject[]
      )
    : [];

export default function PortfolioPage() {
  /** Prefetch chunk below-fold when main thread is idle. */
  useEffect(() => {
    const w = typeof window !== "undefined" ? window : undefined;
    if (!w) return;
    const load = () => {
      void import("@/components/portfolio-lower-sections");
    };
    const ric = w.requestIdleCallback;
    if (typeof ric === "function") {
      const id = ric.call(w, load, { timeout: 2500 });
      return () => w.cancelIdleCallback(id);
    }
    const t = w.setTimeout(load, 200);
    return () => w.clearTimeout(t);
  }, []);

  return (
    <>
      <SiteHeader />
      <main
        className={`relative min-h-screen bg-black ${nunitoSans.className}`}
      >
        {/* Hero — video background + project selector */}
        <PortfolioHero projects={showcaseProjects} />

        {/* Selected Works Grid Section */}
        <section className="relative overflow-hidden border-t border-[#ff8c3a]/20 bg-[linear-gradient(165deg,#14151f_0%,#0e0f14_42%,#0a0a10_100%)] py-14 text-white md:py-20 lg:py-24">
          <div
            className="pointer-events-none absolute -left-24 top-0 h-[320px] w-[320px] rounded-full bg-[#ff8c3a]/08 blur-[100px]"
            aria-hidden
          />
          <div
            className="relative mx-auto"
            style={{ width: "var(--layout-width, 75%)" }}
          >
            <header>
              <div className="mb-4 flex items-center gap-4">
                <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.35)]">
                  // 02
                </span>
                <div className="h-px w-12 shrink-0 bg-linear-to-r from-[#ff8c3a]/55 to-white/12" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">
                  All Projects
                </span>
              </div>

              <h2
                className="text-left text-3xl font-black uppercase leading-[1.08] tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                Selected <AccentHighlight>Works</AccentHighlight>
              </h2>
              <p className="mt-4 max-w-xl text-left text-sm leading-relaxed text-white/65 md:text-base">
                Featured game art projects from TD Games — 2D Art, Animation,
                Concept Art, and Environment Design.
              </p>
            </header>

            <div className="mt-10 md:mt-12">
              <PortfolioGridApi itemsPerPage={16} />
            </div>
          </div>
        </section>

        <PortfolioLowerSections />
      </main>
    </>
  );
}
