"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ShowcaseProject } from "@/types/site-content";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const AUTO_ROTATE_MS = 6000;
const RESUME_DELAY_MS = 2000;
const CROSSFADE_MS = 500;
const TEXT_FADE_OUT_MS = 200;
const TEXT_FADE_IN_MS = 300;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface PortfolioHeroProps {
  projects: ShowcaseProject[];
}

export default function PortfolioHero({ projects }: PortfolioHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0); // text currently shown
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0); // which <video> is "front"
  const isPausedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null]);
  const prefersReducedMotion = useRef(false);

  // Progress bar animation
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  const project = useMemo(
    () => projects[displayIndex] ?? projects[0],
    [projects, displayIndex],
  );

  /* ------ crossfade logic ------ */

  const triggerTransition = useCallback(
    (nextIndex: number) => {
      if (isTransitioning || projects.length < 2) return;
      if (nextIndex === activeIndex) return;

      const nextSlot = activeSlot === 0 ? 1 : 0;
      const nextVideo = videoRefs.current[nextSlot];

      // Set src on the hidden video & try to play
      if (nextVideo) {
        const src = projects[nextIndex]?.heroVideo ?? "";
        if (nextVideo.src !== src) {
          nextVideo.src = src;
          nextVideo.load();
        }
      }

      setIsTransitioning(true);

      // Fade out text
      setTextVisible(false);

      const doSwap = () => {
        // Swap video opacity (CSS transition handles the visual)
        setActiveSlot(nextSlot as 0 | 1);
        setActiveIndex(nextIndex);

        // After text fade-out, update display text & fade in
        setTimeout(() => {
          setDisplayIndex(nextIndex);
          setTextVisible(true);
        }, TEXT_FADE_OUT_MS);

        // Mark transition complete
        setTimeout(() => {
          setIsTransitioning(false);
        }, CROSSFADE_MS);
      };

      // If reduced motion, swap instantly
      if (prefersReducedMotion.current) {
        setDisplayIndex(nextIndex);
        setTextVisible(true);
        setActiveSlot(nextSlot as 0 | 1);
        setActiveIndex(nextIndex);
        setIsTransitioning(false);
        return;
      }

      // Wait for canplay or fallback timeout
      const fallback = setTimeout(doSwap, 200);
      if (nextVideo) {
        const handler = () => {
          clearTimeout(fallback);
          doSwap();
          nextVideo.removeEventListener("canplay", handler);
        };
        nextVideo.addEventListener("canplay", handler, { once: true });
        nextVideo.play().catch(() => {});
      }
    },
    [isTransitioning, activeIndex, activeSlot, projects],
  );

  /* ------ auto-rotate ------ */

  const clearAutoRotate = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoRotate = useCallback(() => {
    clearAutoRotate();
    if (prefersReducedMotion.current) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % projects.length;
        // Use a microtask so React can batch
        queueMicrotask(() => triggerTransition(next));
        return prev; // actual update happens in triggerTransition
      });
    }, AUTO_ROTATE_MS);
    setProgressKey((k) => k + 1);
  }, [clearAutoRotate, projects.length, triggerTransition]);

  useEffect(() => {
    startAutoRotate();
    return clearAutoRotate;
  }, [startAutoRotate, clearAutoRotate]);

  /* ------ pause / resume on hover ------ */

  const handleMouseEnter = useCallback(() => {
    isPausedRef.current = true;
    clearAutoRotate();
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, [clearAutoRotate]);

  const handleMouseLeave = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
      startAutoRotate();
      resumeTimerRef.current = null;
    }, RESUME_DELAY_MS);
  }, [startAutoRotate]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  /* ------ card click ------ */

  const handleCardClick = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      isPausedRef.current = true;
      clearAutoRotate();
      triggerTransition(index);
      // Restart auto-rotate after a delay
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        isPausedRef.current = false;
        startAutoRotate();
        resumeTimerRef.current = null;
      }, RESUME_DELAY_MS);
      setProgressKey((k) => k + 1);
    },
    [activeIndex, clearAutoRotate, triggerTransition, startAutoRotate],
  );

  /* ------ preload next video 2s before switch ------ */

  useEffect(() => {
    if (projects.length < 2) return;
    const preloadTimer = setTimeout(() => {
      const nextIdx = (activeIndex + 1) % projects.length;
      const nextSlot = activeSlot === 0 ? 1 : 0;
      const vid = videoRefs.current[nextSlot];
      if (vid) {
        const src = projects[nextIdx]?.heroVideo ?? "";
        if (vid.src !== src) {
          vid.src = src;
          vid.preload = "auto";
          vid.load();
        }
      }
    }, AUTO_ROTATE_MS - 2000);
    return () => clearTimeout(preloadTimer);
  }, [activeIndex, activeSlot, projects]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (!projects.length) return null;

  return (
    <section
      className="relative h-screen w-full overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* -------- Video Background (2 stacked) -------- */}
      {[0, 1].map((slot) => (
        <video
          key={slot}
          ref={(el) => {
            videoRefs.current[slot] = el;
          }}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: activeSlot === slot ? 1 : 0,
            transition: prefersReducedMotion.current
              ? "none"
              : `opacity ${CROSSFADE_MS}ms ease-in-out`,
            willChange: isTransitioning ? "opacity" : "auto",
          }}
          src={
            slot === 0
              ? projects[activeIndex]?.heroVideo
              : undefined
          }
          autoPlay
          muted
          loop
          playsInline
          preload={activeSlot === slot ? "auto" : "metadata"}
        />
      ))}

      {/* -------- Vignette Overlay -------- */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(100deg, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.55) 28%, rgba(10,10,10,0.18) 55%, transparent 78%)",
        }}
      />
      {/* Bottom gradient for text readability near thumbnail cards */}
      <div
        className="absolute inset-x-0 bottom-0 z-[1] h-48"
        style={{
          background:
            "linear-gradient(to top, rgba(10,10,10,0.75) 0%, transparent 100%)",
        }}
      />

      {/* -------- Content -------- */}
      <div className="relative z-10 flex h-full flex-col">
        {/* 3a. Text Content — left side, vertically centered */}
        <div className="flex flex-1 items-center pl-6 md:pl-16 lg:pl-24">
          <div
            className="max-w-lg"
            style={{
              opacity: textVisible ? 1 : 0,
              transition: textVisible
                ? `opacity ${TEXT_FADE_IN_MS}ms ease-in ${TEXT_FADE_OUT_MS}ms`
                : `opacity ${TEXT_FADE_OUT_MS}ms ease-out`,
            }}
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400">
              Our Projects
            </p>
            <h1
              className="text-3xl font-bold leading-[1.1] text-white sm:text-4xl md:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-changa-one, inherit)" }}
            >
              {project.title}
            </h1>
            <p className="mt-2 text-lg text-white/70">{project.subtitle}</p>
            <div className="mt-6 flex gap-4">
              <Link
                href={`/portfolio/${project.slug}`}
                className="rounded-lg border-2 border-amber-400 px-6 py-2.5 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-400 hover:text-black"
              >
                View Project
              </Link>
              <Link
                href="/contact"
                className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:text-white"
              >
                Get In Touch
              </Link>
            </div>
          </div>
        </div>

        {/* 3b. Thumbnail Selector — bottom center */}
        <div className="flex justify-center gap-2 pb-8 sm:gap-3 md:pb-12">
          {projects.map((p, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleCardClick(i)}
                aria-label={`View ${p.title}`}
                aria-current={isActive ? "true" : undefined}
                className={`group relative overflow-hidden rounded-lg transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                  isActive
                    ? "scale-105 border-2 border-amber-400 opacity-100"
                    : "border-2 border-white/20 opacity-60 hover:opacity-80"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumbnail}
                  alt={p.title}
                  className="h-11 w-16 object-cover sm:h-14 sm:w-20 md:h-16 md:w-24"
                  loading="lazy"
                />
                {/* Progress bar (only on active card during auto-rotate) */}
                {isActive && !isPausedRef.current && (
                  <div
                    key={progressKey}
                    className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-amber-400"
                    role="progressbar"
                    aria-valuenow={isActive ? 100 : 0}
                    style={{
                      animation: prefersReducedMotion.current
                        ? "none"
                        : `progressFill ${AUTO_ROTATE_MS}ms linear forwards`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress bar animation */}
      <style>{`
        @keyframes progressFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </section>
  );
}
