"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Changa_One, Nunito_Sans } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";
import SiteHeader from "@/components/site-header";
import PortfolioGridApi from "@/components/portfolio-grid-api";
import { AccentHighlight } from "@/components/accent-highlight";

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

const changaOne = Changa_One({ weight: "400", subsets: ["latin"] });
const nunitoSans = Nunito_Sans({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

/* ── Hero video carousel data ── */
const HERO_VIDEOS = [
  {
    id: "v1",
    thumbnail: "https://cdn.tdgamestudio.com/landing/video/CutScene_SE/1big.mp4",
    video: "https://cdn.tdgamestudio.com/landing/video/CutScene_SE/video1.mp4",
  },
  {
    id: "v2",
    thumbnail: "https://cdn.tdgamestudio.com/landing/video/CutScene_SE/2big.mp4",
    video: "https://cdn.tdgamestudio.com/landing/video/CutScene_SE/video_summoner_3_skill_1_skin_2.mp4",
  },
  {
    id: "v3",
    thumbnail: "https://cdn.tdgamestudio.com/landing/video/CutScene_SE/3big.mp4",
    video: "https://cdn.tdgamestudio.com/landing/video/CutScene_SE/video_summoner_4_skill_1_skin_2.mp4",
  },
  {
    id: "v4",
    thumbnail: "https://cdn.tdgamestudio.com/landing/video/CutScene_SE/4.png",
    video: "https://cdn.tdgamestudio.com/landing/video/Super_Move/BIGBY-Long Arm of the Law_Closed.mp4",
  },
  {
    id: "v5",
    thumbnail: "https://cdn.tdgamestudio.com/landing/video/CutScene_SE/5.png",
    video: "https://cdn.tdgamestudio.com/landing/video/Super_Move/On_Your_Knees.mp4",
  },
];
const HERO_AUTO_ROTATE_MS = 6000;

const isVideoSrc = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

/* ── Component ── */

type HeroVideo = { id: string; thumbnail: string; video: string };

export default function PortfolioPage() {
  // ── Hero video carousel state ──
  const [heroVideos, setHeroVideos] = useState<HeroVideo[]>(HERO_VIDEOS);
  const [heroVideoIdx, setHeroVideoIdx] = useState(0);
  const [heroVideoSlot, setHeroVideoSlot] = useState<0 | 1>(0);
  const heroVideoRefs = useRef<(HTMLVideoElement | null)[]>([null, null]);
  const heroTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroHovered = useRef(false);

  const switchHeroVideo = useCallback(
    (nextIdx: number) => {
      if (nextIdx === heroVideoIdx) return;
      const nextSlot = heroVideoSlot === 0 ? 1 : 0;
      const vid = heroVideoRefs.current[nextSlot];
      if (vid) {
        vid.src = heroVideos[nextIdx]?.video ?? "";
        vid.load();
        vid.play().catch(() => {});
      }
      setHeroVideoSlot(nextSlot as 0 | 1);
      setHeroVideoIdx(nextIdx);
    },
    [heroVideoIdx, heroVideoSlot, heroVideos],
  );

  // Auto-rotate
  useEffect(() => {
    if (heroTimerRef.current) clearInterval(heroTimerRef.current);
    heroTimerRef.current = setInterval(() => {
      if (heroHovered.current) return;
      setHeroVideoIdx((prev) => {
        const next = (prev + 1) % heroVideos.length;
        queueMicrotask(() => switchHeroVideo(next));
        return prev;
      });
    }, HERO_AUTO_ROTATE_MS);
    return () => {
      if (heroTimerRef.current) clearInterval(heroTimerRef.current);
    };
  }, [switchHeroVideo]);

  // Fetch hero videos from page_slots DB (fallback to HERO_VIDEOS)
  useEffect(() => {
    async function fetchSlots() {
      try {
        const res = await fetch(
          "/api/page-slots?page=portfolio&slot=hero-carousel",
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          items: Array<{
            id: number;
            url: string;
            thumb_url?: string | null;
            display_name?: string | null;
            sort_order: number;
          }>;
        };
        if (!Array.isArray(json.items) || json.items.length === 0) return;
        const mapped: HeroVideo[] = json.items.map((item) => ({
          id: String(item.id),
          thumbnail: item.thumb_url ?? item.url,
          video: item.url,
        }));
        setHeroVideos(mapped);
        setHeroVideoIdx(0);
      } catch {
        // keep fallback
      }
    }
    fetchSlots();
  }, []);

  // Prefetch below-fold chunk
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
        {/* ═══════ HERO ═══════ */}
        <div className="relative isolate min-h-screen overflow-hidden">
          {/* ── Video background (dual crossfade) ── */}
          <div className="pointer-events-none absolute inset-0 z-0">
            {[0, 1].map((slot) => (
              <video
                key={slot}
                ref={(el) => {
                  heroVideoRefs.current[slot] = el;
                }}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                style={{ opacity: heroVideoSlot === slot ? 1 : 0 }}
                src={slot === 0 ? heroVideos[heroVideoIdx]?.video : undefined}
                autoPlay
                muted
                loop
                playsInline
                preload={heroVideoSlot === slot ? "auto" : "metadata"}
              />
            ))}
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50" />
            {/* Left vignette — darker where text lives */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(100deg, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.55) 28%, rgba(10,10,10,0.18) 55%, transparent 78%)",
              }}
            />
            {/* Bottom gradient for card area readability */}
            <div
              className="absolute inset-x-0 bottom-0 h-48"
              style={{
                background:
                  "linear-gradient(to top, rgba(10,10,10,0.8) 0%, transparent 100%)",
              }}
            />
          </div>

          {/* ── Text content (left side) ── */}
          <section className="relative z-10 min-h-screen">
            <div
              className="relative mx-auto flex min-h-screen w-full items-center py-24 pt-28 sm:pt-32"
              style={{ width: "var(--layout-width, 75%)" }}
            >
              <div
                className="relative z-20 max-w-[606px] tracking-[0.5px]"
                style={{ transform: "translateY(var(--hero-text-y, 0px))" }}
              >
                <div className="mb-[-10px] overflow-hidden">
                  <div
                    className={`leading-[1] font-black uppercase text-white ${changaOne.className}`}
                    style={{ fontSize: "var(--hero-title-size, 100px)" }}
                  >
                    OUR{" "}
                    <span
                      style={{
                        color: "var(--hero-highlight-color, #f59e0b)",
                      }}
                    >
                      PROJECTS
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <div
                    className="h-0.5 w-12 shrink-0"
                    style={{
                      backgroundColor: "var(--hero-subtitle-color, #f59e0b)",
                    }}
                  />
                  <h3
                    className="font-bold uppercase tracking-[0.3em]"
                    style={{
                      fontSize: "var(--hero-subtitle-size, 16px)",
                      color: "var(--hero-subtitle-color, #f59e0b)",
                    }}
                  >
                    Take a look at our game art projects!
                  </h3>
                </div>

                <p
                  className="mb-[15px] mt-4 max-w-[547px] leading-normal"
                  style={{
                    fontSize: "var(--hero-desc-size, 18px)",
                    color: "var(--hero-desc-color, #e5e7eb)",
                  }}
                >
                  TD Games&apos; portfolio. We specialize in creating modern 3D
                  environments, captivating characters, and innovative concept
                  art for next-gen games. For years of experience in the
                  industry of game art design, managed to collect a solid game
                  design portfolio of various artworks made in 2D or 3D and
                  other directions.
                </p>

                <div className="mb-[15px] mt-[32px]">
                  <Link
                    href="#contact"
                    className="inline-block rounded-xl border-2 px-[32px] py-[16px] text-[18px] font-bold uppercase tracking-wider text-black transition-colors duration-300 hover:bg-transparent hover:text-white"
                    style={{
                      backgroundColor: "var(--hero-btn-bg, #f59e0b)",
                      borderColor: "var(--hero-btn-bg, #f59e0b)",
                    }}
                  >
                    Get in Touch
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── Thumbnail cards (bottom center) ── */}
          <div
            className="absolute inset-x-0 bottom-0 z-30 flex justify-center gap-2 pb-6 sm:gap-3 md:pb-10"
            onMouseEnter={() => {
              heroHovered.current = true;
            }}
            onMouseLeave={() => {
              heroHovered.current = false;
            }}
          >
            {heroVideos.map((v, i) => {
              const isActive = i === heroVideoIdx;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => switchHeroVideo(i)}
                  aria-label={`Video ${i + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`group relative overflow-hidden rounded-lg transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                    isActive
                      ? "scale-105 border-2 border-amber-400 opacity-100 shadow-[0_0_16px_rgba(245,158,11,0.3)]"
                      : "border-2 border-white/20 opacity-60 hover:opacity-90"
                  }`}
                >
                  {isVideoSrc(v.thumbnail) ? (
                    <video
                      src={v.thumbnail}
                      className="h-12 w-[72px] object-cover sm:h-14 sm:w-20 md:h-16 md:w-24"
                      muted
                      playsInline
                      autoPlay
                      loop
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnail}
                      alt=""
                      className="h-12 w-[72px] object-cover sm:h-14 sm:w-20 md:h-16 md:w-24"
                      loading="lazy"
                    />
                  )}
                  {isActive && (
                    <div
                      key={`prog-${heroVideoIdx}`}
                      className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-amber-400"
                      style={{
                        animation: `heroProgress ${HERO_AUTO_ROTATE_MS}ms linear forwards`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <style>{`
            @keyframes heroProgress {
              from { transform: scaleX(0); }
              to   { transform: scaleX(1); }
            }
          `}</style>
        </div>

        {/* ═══════ Selected Works Grid ═══════ */}
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
