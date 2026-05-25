"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AccentHighlight } from "./accent-highlight";
import CharacterMarquee from "./character-marquee";
import type { CharacterMarqueeProps } from "./character-marquee";
import { SpineCharacter } from "./spine-character";

const ACCENT = "var(--hero-btn-bg, #f59e0b)" as const;

const accentStyle = { color: ACCENT };

// ── Hardcoded fallback khi chưa có bài blog thật ─────────────────────────────
const FALLBACK_POSTS = [
  {
    slug: "",
    title: "How to create a game character",
    date: "01.22.2024",
    cover_image: "https://cdn.tdgamestudio.com/landing/images/blog-1.jpg",
  },
  {
    slug: "",
    title: "High poly and low poly modeling",
    date: "01.22.2024",
    cover_image: "https://cdn.tdgamestudio.com/landing/images/blog-2.jpg",
  },
  {
    slug: "",
    title: "Animation outsourcing: a guide for success",
    date: "01.22.2024",
    cover_image: "https://cdn.tdgamestudio.com/landing/images/blog-1.jpg",
  },
];

function BlogPreviewGrid() {
  const [posts, setPosts] = useState(FALLBACK_POSTS);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => {
        const fetched = (data.posts ?? []).slice(0, 3).map((p: {
          slug: string;
          title: string;
          created_at: string;
          cover_image?: string;
        }) => ({
          slug: p.slug,
          title: p.title,
          date: new Date(p.created_at).toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          }).replace(/\//g, "."),
          cover_image: p.cover_image || "https://cdn.tdgamestudio.com/landing/images/blog-1.jpg",
        }));
        if (fetched.length > 0) setPosts(fetched);
      })
      .catch(() => { /* giữ fallback */ });
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {posts.map((post, idx) => {
        const href = post.slug ? `/blog/${post.slug}` : "/blog";
        return (
          <motion.article
            key={post.slug || post.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: idx * 0.05, ease: "easeOut" }}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-[#141418] shadow-[0_18px_70px_rgba(0,0,0,0.55)]"
          >
            <Link href={href} className="block">
              <div className="relative aspect-16/10 overflow-hidden">
                <Image
                  src={post.cover_image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 420px"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/20 to-transparent" />
              </div>
              <div className="p-5">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                  {post.date}
                </div>
                <div
                  className="mt-2 line-clamp-2 text-base font-black uppercase tracking-tight text-white"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  {post.title}
                </div>
                <div className="mt-4">
                  <span
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-black transition-transform group-hover:scale-[1.02]"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Read more
                  </span>
                </div>
              </div>
            </Link>
          </motion.article>
        );
      })}
    </div>
  );
}

function StudioSectionTitle({
  sectionNum,
  label,
  title,
  highlight,
  description,
  className = "mb-8 md:mb-10",
  align = "center",
  compact = false,
}: {
  sectionNum: string;
  label: string;
  title: string;
  highlight: string;
  description?: string;
  className?: string;
  align?: "center" | "left";
  compact?: boolean;
}) {
  const parts = title.split(highlight);
  const h2Class = compact
    ? "text-3xl font-black uppercase tracking-tight text-white md:text-4xl lg:text-5xl"
    : "text-4xl font-black uppercase tracking-tight text-white md:text-5xl lg:text-7xl";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={className}
    >
      <div className={align === "center" ? "text-center" : "text-left"}>
        <div
          className={`mb-3 flex items-center gap-4 ${
            align === "center" ? "justify-center" : "justify-start"
          }`}
        >
          <span
            className="text-sm font-black italic tracking-tighter"
            style={accentStyle}
          >
            {sectionNum}
          </span>
          <div className="h-px w-10 bg-white/10" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
            {label}
          </span>
        </div>
        <h2 className={h2Class} style={{ fontFamily: "var(--font-rajdhani)" }}>
          {parts.length === 2 ? (
            <>
              {parts[0]}
              <AccentHighlight>{highlight}</AccentHighlight>
              {parts[1]}
            </>
          ) : (
            title
          )}
        </h2>
        {description ? (
          <p
            className={`mt-5 max-w-2xl text-base leading-7 text-white/70 opacity-70 ${
              align === "center" ? "mx-auto" : ""
            }`}
            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          >
            {description}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}

function CountUp({
  end,
  durationMs = 900,
  suffix = "",
  className = "",
}: {
  end: number;
  durationMs?: number;
  suffix?: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.7 });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    if (reduceMotion) {
      setVal(end);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(end * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, end, isInView, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

function TypingText({
  text,
  cps = 45,
  className = "",
}: {
  text: string;
  cps?: number; // characters per second
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLParagraphElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!isInView) return;
    if (reduceMotion) {
      setShown(text);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const total = Math.max(1, text.length);
    const duration = (total / Math.max(1, cps)) * 1000;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const count = Math.floor(total * t);
      setShown(text.slice(0, count));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cps, isInView, reduceMotion, text]);

  return (
    <p ref={ref} className={className}>
      {shown}
      {!reduceMotion && isInView && shown.length < text.length ? (
        <span className="inline-block w-[0.6ch] translate-y-px animate-pulse bg-white/45 align-baseline" />
      ) : null}
    </p>
  );
}

type MarqueeFilter = {
  id: string;
  label: string;
  images: CharacterMarqueeProps["images"];
};

const characterMarqueeFilters: MarqueeFilter[] = [
  {
    id: "characters",
    label: "3D Characters",
    images: [
      { src: "https://cdn.tdgamestudio.com/landing/sinspired/character_1-min-1024x970.jpg", alt: "Character 1" },
      { src: "https://cdn.tdgamestudio.com/landing/sinspired/character_5-min-1024x970.jpg", alt: "Character 2" },
      { src: "https://cdn.tdgamestudio.com/landing/sinspired/character_6-min-1024x970.jpg", alt: "Character 3" },
      { src: "https://cdn.tdgamestudio.com/landing/sinspired/character_8-min-1024x970.jpg", alt: "Character 4" },
      { src: "https://cdn.tdgamestudio.com/landing/sinspired/character_10-min-1024x970.jpg", alt: "Character 5" },
    ],
  },
  {
    id: "props",
    label: "3D Props",
    images: [
      { src: "https://cdn.tdgamestudio.com/landing/sinspired/lab_asset-min-1024x506.jpg", alt: "Prop 1" },
      {
        src: "https://cdn.tdgamestudio.com/landing/sinspired/Volcano_Arena_render-min-1024x567.jpg",
        alt: "Prop 2",
      },
      { src: "https://cdn.tdgamestudio.com/landing/sinspired/Artboard-1-copy-13-min-1024x572.jpg", alt: "Scene 1" },
      {
        src: "https://cdn.tdgamestudio.com/landing/sinspired/space_arena_source_nature_render_final-min-1024x599.jpg",
        alt: "Scene 2",
      },
      {
        src: "https://cdn.tdgamestudio.com/landing/sinspired/lab_asset_dark_final-min-1024x506.jpg",
        alt: "Scene 3",
      },
    ],
  },
  {
    id: "backgrounds",
    label: "Backgrounds",
    images: [
      { src: "https://cdn.tdgamestudio.com/landing/sinspired/Artboard-2-copy-4-1024x850.jpg", alt: "Background 1" },
      { src: "https://cdn.tdgamestudio.com/landing/sinspired/Artboard-2-copy-1024x850.jpg", alt: "Background 2" },
      {
        src: "https://cdn.tdgamestudio.com/landing/sinspired/Artboard-1-copy-11-min-1024x572.jpg",
        alt: "Background 3",
      },
      {
        src: "https://cdn.tdgamestudio.com/landing/sinspired/Artboard-1-copy-13-min-1024x572.jpg",
        alt: "Background 4",
      },
      {
        src: "https://cdn.tdgamestudio.com/landing/sinspired/space_arena_source_nature_render_final-min-1024x599.jpg",
        alt: "Background 5",
      },
    ],
  },
  {
    id: "design",
    label: "Character design",
    images: [
      { src: "https://cdn.tdgamestudio.com/landing/sinspired/Character-Design-min-822x1024.jpg", alt: "Design 1" },
      { src: "https://cdn.tdgamestudio.com/landing/sinspired/2D-Art-min-947x1024.jpg", alt: "Design 2" },
      { src: "https://cdn.tdgamestudio.com/landing/sinspired/promo_amanda.jpg", alt: "Design 3" },
      {
        src: "https://cdn.tdgamestudio.com/landing/sinspired/3a7ab9112768871.602fbfbfa228c-882x1024.jpg",
        alt: "Design 4",
      },
      { src: "https://cdn.tdgamestudio.com/landing/sinspired/character_8-min-1024x970.jpg", alt: "Design 5" },
    ],
  },
];

type SpineCharacterData = {
  id: string;
  slug: string;
  json_url: string | null;
  atlas_url: string | null;
  animation: string;
  skin: string | null;
};

/** Rewrite cdn.tdgamestudio.com URLs through the same-origin proxy to avoid CORS */
function proxyCdnUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace("https://cdn.tdgamestudio.com/", "/cdn-proxy/");
}

function useCareersCharacter() {
  const [character, setCharacter] = useState<SpineCharacterData | null>(null);

  useEffect(() => {
    fetch("/api/spine")
      .then((r) => r.json())
      .then((data: { characters: SpineCharacterData[] }) => {
        const found = (data.characters ?? []).find((c) => c.slug === "careers-hero");
        if (found) {
          // Proxy CDN URLs through same origin so Spine player XHR requests don't hit CORS
          setCharacter({
            ...found,
            json_url: proxyCdnUrl(found.json_url) ?? found.json_url,
            atlas_url: proxyCdnUrl(found.atlas_url) ?? found.atlas_url,
          });
        }
      })
      .catch(() => { /* silently fall back to placeholder */ });
  }, []);

  return character;
}

export default function HomePageLower() {
  const [activeMarqueeFilter, setActiveMarqueeFilter] = useState(characterMarqueeFilters[0]);
  const careersCharacter = useCareersCharacter();

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.22 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="snap-start border-t border-[#252525] bg-[#0b0b10] py-16 lg:py-20"
      >
        <div
          className="mx-auto"
          style={{ width: "min(var(--layout-width, 85%), 1240px)" }}
        >
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <h3
                className="text-3xl font-black uppercase tracking-tight text-white md:text-4xl"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                CHARACTER <AccentHighlight>SHOWCASE</AccentHighlight>
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                Bringing game characters to life through expressive animation, dynamic poses, and polished visual effects.
              </p>
            </div>
            <div className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 md:flex">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                Drag
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                Hover slow
              </span>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            {characterMarqueeFilters.map((f) => {
              const isActive = f.id === activeMarqueeFilter.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveMarqueeFilter(f)}
                  className={`rounded-full px-4 py-2 text-[11px] font-bold tracking-[0.14em] transition-all ${
                    isActive
                      ? "bg-white text-black"
                      : "border border-white/12 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <CharacterMarquee
            images={activeMarqueeFilter.images}
            baseSpeedMs={5200}
            hoverSlowdownPct={0.1}
          />
        </div>
      </motion.section>

      {/* Benefits â€” dark TD Games-style: layered title, 4 cards, stats bar */}
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.16 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="snap-start relative overflow-hidden border-t border-white/10 bg-[#0b0b0b] py-20 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,140,58,0.08),transparent_55%)]" />
        <div className="pointer-events-none absolute -left-24 top-14 h-[380px] w-[380px] rounded-full bg-[#ff8c3a]/12 blur-[90px]" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-[420px] w-[420px] rounded-full bg-[#7b6dff]/8 blur-[110px]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,180,80,0.12) 0, transparent 1px), radial-gradient(circle at 80% 70%, rgba(255,120,40,0.1) 0, transparent 1px)",
            backgroundSize: "120px 120px",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_45%)] mix-blend-overlay opacity-50" />

        {/* subtle ember particles */}
        {[
          { left: "6%", top: "22%", s: 6, o: 0.18, d: 14 },
          { left: "18%", top: "62%", s: 10, o: 0.14, d: 18 },
          { left: "52%", top: "18%", s: 8, o: 0.12, d: 16 },
          { left: "78%", top: "44%", s: 12, o: 0.12, d: 20 },
          { left: "90%", top: "72%", s: 7, o: 0.16, d: 15 },
        ].map((p, idx) => (
          <motion.div
            key={`benefit-ember-${idx}`}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, p.o, 0], y: [0, -16, 0] }}
            transition={{
              duration: p.d,
              repeat: Infinity,
              ease: "easeInOut",
              delay: idx * 0.9,
            }}
            className="pointer-events-none absolute rounded-full bg-[#ff8c3a] blur-[10px]"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.s}px`,
              height: `${p.s}px`,
            }}
          />
        ))}
        <div
          className="relative z-10 mx-auto"
          style={{ width: "min(var(--layout-width, 85%), 1240px)" }}
        >
          <StudioSectionTitle
            sectionNum="// 03"
            label="Why us"
            title="WHY CHOOSE TD GAMES"
            highlight="TD GAMES"
            description="We create immersive 2D animation, stunning game art, and eye-catching VFX that bring ideas to life and captivate players."
            className="mb-10 md:mb-12"
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "HIGH QUALITY ART",
                body: "Every asset is crafted with attention to detail, style consistency, and production-ready polish.",
                icon: (
                  <path d="M12 3l2.4 5.5L20 9.3l-4.2 3.6 1.3 5.6L12 15.9 6.9 18.5l1.3-5.6L4 9.3l5.6-.8L12 3z" />
                ),
              },
              {
                title: "REASONABLE PRICES",
                body: "Clear scopes and predictable delivery so teams can plan budgets without surprises.",
                icon: (
                  <path d="M4 10h16v2H4v-2zm0-4h10v2H4V6zm0 8h16v2H4v-2z" />
                ),
              },
              {
                title: "STREAMLINED WORKFLOW",
                body: "Fast feedback loops, organized handoffs, and milestones that keep production moving.",
                icon: <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
              },
              {
                title: "PROTECTING YOUR IDEA",
                body: "NDA-friendly process and careful handling of concepts, references, and unreleased work.",
                icon: (
                  <path d="M12 2L4 6v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V6l-8-4zm0 2.2l6 3v4.8c0 4-2.5 7.8-6 9-3.5-1.2-6-5-6-9V7.2l6-3zM10 10h4v6h-2v-4h-2v-2z" />
                ),
              },
            ].map((item, idx) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.45,
                  delay: idx * 0.06,
                  ease: "easeOut",
                }}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl border border-white/12 bg-[#141414] p-6 text-center shadow-[0_22px_70px_rgba(0,0,0,0.52)] transition-colors hover:border-white/20"
              >
                {/* top specular + bottom glow line */}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/6 via-transparent to-transparent opacity-70" />
                <div
                  className="pointer-events-none absolute inset-x-8 bottom-0 h-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,140,58,0) 0%, rgba(255,140,58,0.9) 35%, rgba(255,180,0,0.9) 65%, rgba(255,180,0,0) 100%)",
                  }}
                />

                <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/12 bg-black/45 text-[#ff8c3a] shadow-[0_0_0_1px_rgba(255,140,58,0.12),0_18px_40px_rgba(0,0,0,0.45)] transition-transform group-hover:scale-[1.06]">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    {item.icon}
                  </svg>
                </div>
                <h4
                  className="relative mt-4 text-[13px] font-black uppercase tracking-[0.12em] text-white"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  {item.title}
                </h4>
                <p className="relative mt-3 text-[13px] leading-6 text-white/60">
                  {item.body}
                </p>
              </motion.article>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mt-10 rounded-2xl border border-[#ff8c3a]/40 bg-[#111]/80 px-4 py-8 md:px-8"
          >
            <div className="grid gap-8 md:grid-cols-3 md:divide-x md:divide-white/10">
              {[
                {
                  value: "150+",
                  label: "PROJECTS COMPLETED",
                  icon: (
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 3h2v7h-2v-7z" />
                  ),
                },
                {
                  value: "50+",
                  label: "HAPPY CLIENTS",
                  icon: (
                    <path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3c-.2 0-.4 0-.6.1C15.2 4.2 13.4 3 11.5 3 9 3 7 5 7 7.5c0 2.3 1.8 4.3 4.1 4.5-.3.5-.6 1-1 1.5H7v2h3.5c-.4.6-.7 1.3-.9 2H7v2h2.1c.4 1.7 1.9 3 3.9 3h6v-2h-6c-.8 0-1.5-.5-1.8-1.2L16 11zm-4.5-6C12.9 5 14 6.1 14 7.5S12.9 10 11.5 10 9 8.9 9 7.5 10.1 5 11.5 5z" />
                  ),
                },
                {
                  value: "3700+",
                  label: "ASSETS DELIVERED",
                  icon: (
                    <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44-.16.09-.16-.09-7.9-4.44A.99.99 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44.16-.09.16.09 7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L5.04 8 12 11.85 18.96 8 12 4.15zM5 14.5l6 3.35v-6.7L5 9.15v5.35zm14 0v-5.35l-6 3.35v6.7l6-3.35z" />
                  ),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-3 text-center md:px-4"
                >
                  <div className="text-[#ff8c3a]">
                    <svg
                      className="h-8 w-8"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      {stat.icon}
                    </svg>
                  </div>
                  <div
                    className="text-4xl font-black tracking-tight text-[#ff8c3a] md:text-5xl"
                    style={{ fontFamily: "var(--font-rajdhani)" }}
                  >
                    {stat.value === "150+" ? (
                      <CountUp end={150} suffix="+" />
                    ) : stat.value === "50+" ? (
                      <CountUp end={50} suffix="+" />
                    ) : (
                      <CountUp end={3700} suffix="+" />
                    )}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Reviews + Join us â€” dark cards, avatars, stars; full-bleed CTA */}
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.14 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="snap-start relative border-t border-white/10 bg-[#08080a] py-20 lg:py-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,140,58,0.08),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_80%,rgba(123,109,255,0.10),transparent_45%)]" />
        <div
          className="pointer-events-none absolute left-[4%] top-[10%] h-[170px] w-[170px] opacity-28"
          aria-hidden
        >
          <Image
            src="https://cdn.tdgamestudio.com/landing/images/scribble.png"
            alt=""
            fill
            className="object-contain"
            sizes="170px"
            style={{
              filter:
                "invert(61%) sepia(75%) saturate(776%) hue-rotate(343deg) brightness(100%) contrast(102%) drop-shadow(0 0 12px rgba(255,140,58,0.2))",
              transform: "rotate(-14deg) scale(1.03)",
            }}
          />
        </div>

        {/* subtle ember particles */}
        {[
          { left: "10%", top: "74%", s: 7, o: 0.14, d: 18 },
          { left: "42%", top: "22%", s: 9, o: 0.12, d: 16 },
          { left: "66%", top: "60%", s: 11, o: 0.1, d: 20 },
          { left: "86%", top: "30%", s: 6, o: 0.14, d: 15 },
        ].map((p, idx) => (
          <motion.div
            key={`review-ember-${idx}`}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, p.o, 0], y: [0, -14, 0] }}
            transition={{
              duration: p.d,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.6 + idx * 0.8,
            }}
            className="pointer-events-none absolute rounded-full bg-[#ff8c3a] blur-[10px]"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.s}px`,
              height: `${p.s}px`,
            }}
          />
        ))}
        <div
          className="mx-auto"
          style={{ width: "min(var(--layout-width, 85%), 1240px)" }}
        >
          <StudioSectionTitle
            sectionNum="// 04"
            label="Testimonials"
            title="WHAT ARE PEOPLE SAYING"
            highlight="SAYING"
            className="mb-12 md:mb-14"
          />

          <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch">
            <motion.article
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="flex flex-col rounded-2xl border border-white/14 bg-[#17171a] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.55)] lg:row-span-2 lg:min-h-[420px]"
            >
              <span
                className="text-4xl font-serif leading-none text-[#ff8c3a]"
                aria-hidden
              >
                &ldquo;
              </span>
              <TypingText
                text="Overall we are EXTREMELY happy! This is one thing we'll love to improve upon in more frequent communication. Twice a day can be doable in order to keep things moving."
                cps={46}
                className="mt-2 flex-1 text-[14px] leading-7 text-white/80"
              />
              <div className="mt-6 flex items-center gap-3 border-t border-white/12 pt-5">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-[#ff8c3a]/40">
                  <Image
                    src="https://cdn.tdgamestudio.com/landing/sinspired/character_1-min-1024x970.jpg"
                    alt=""
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white">
                    Jens Weinberg
                  </div>
                  <div className="text-xs text-white/55">Animation lead</div>
                </div>
                <div className="flex shrink-0 gap-0.5 text-[#ff8c3a]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="text-sm" aria-hidden>
                      â˜…
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>

            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2">
              {[
                {
                  quote:
                    "I recently had a 3D character created, and the experience was fantastic. The team nailed my vision and delivered on time.",
                  name: "Tom Brunner",
                  role: "Indie dev",
                  avatar: "https://cdn.tdgamestudio.com/landing/sinspired/character_5-min-1024x970.jpg",
                  stars: 5,
                },
                {
                  quote:
                    "Awesome job, guys! Thanks for cooperation, delivery in time, and of course quality of the animation.",
                  name: "Adel Wazir",
                  role: "Producer",
                  avatar: "https://cdn.tdgamestudio.com/landing/sinspired/character_6-min-1024x970.jpg",
                  stars: 5,
                },
                {
                  quote:
                    "Worked with this team on a couple of titles â€” quality is smooth and consistent. Would recommend.",
                  name: "Tom Johnson",
                  role: "Art director",
                  avatar: "https://cdn.tdgamestudio.com/landing/sinspired/character_8-min-1024x970.jpg",
                  stars: 4,
                },
                {
                  quote:
                    "Very short deadline for characters after our previous vendor slipped â€” you helped us ship on time.",
                  name: "Peter Wilson",
                  role: "Studio lead",
                  avatar: "https://cdn.tdgamestudio.com/landing/sinspired/character_10-min-1024x970.jpg",
                  stars: 5,
                },
              ].map((r, idx) => (
                <motion.article
                  key={r.name}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.04 * idx,
                    ease: "easeOut",
                  }}
                  className="flex flex-col rounded-2xl border border-white/14 bg-[#17171a] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.5)]"
                >
                  <span
                    className="text-3xl font-serif leading-none text-[#ff8c3a]"
                    aria-hidden
                  >
                    &ldquo;
                  </span>
                  <TypingText
                    text={r.quote}
                    cps={52}
                    className="mt-1 flex-1 text-[13.5px] leading-6 text-white/80"
                  />
                  <div className="mt-4 flex items-center gap-3 border-t border-white/12 pt-4">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-[#ff8c3a]/35">
                      <Image
                        src={r.avatar}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white">
                        {r.name}
                      </div>
                      <div className="text-[11px] text-white/55">{r.role}</div>
                    </div>
                    <div className="flex shrink-0 gap-0.5 text-[#ff8c3a]">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className="text-xs" aria-hidden>
                          {i < r.stars ? "â˜…" : "â˜†"}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          id="careers"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative mx-auto mt-16 md:mt-20 scroll-mt-24"
          style={{ width: "min(var(--layout-width, 85%), 1240px)" }}
        >
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-[linear-gradient(152deg,rgba(123,109,255,0.11)_0%,rgba(10,10,14,0.92)_38%,rgba(10,10,14,0.96)_62%,rgba(245,158,11,0.07)_100%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] md:p-10">
            <div
              className="pointer-events-none absolute -left-24 top-1/2 h-[min(420px,55vw)] w-[min(420px,55vw)] -translate-y-1/2 rounded-full opacity-90 blur-[72px]"
              style={{
                background:
                  "radial-gradient(circle, rgba(123,109,255,0.38) 0%, transparent 68%)",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-20 bottom-0 h-[280px] w-[280px] rounded-full opacity-80 blur-[64px]"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--hero-btn-bg, #f59e0b) 38%, transparent) 0%, transparent 70%)",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.22]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25% 35%, rgba(255,255,255,0.06) 0, transparent 1px), radial-gradient(circle at 75% 65%, rgba(255,255,255,0.05) 0, transparent 1px)",
                backgroundSize: "72px 72px",
              }}
              aria-hidden
            />

            <div className="relative grid min-h-[380px] gap-8 md:min-h-[460px] md:grid-cols-[1.25fr_1fr] md:items-center md:gap-10">
              <div className="relative mx-auto flex w-full max-w-[520px] items-center justify-center md:max-w-none md:justify-end">
                <div className="relative h-[min(420px,78vw)] w-full max-w-[420px] md:h-[520px] md:max-w-[480px]">
                  {careersCharacter?.json_url && careersCharacter?.atlas_url ? (
                    <SpineCharacter
                      jsonUrl={careersCharacter.json_url}
                      atlasUrl={careersCharacter.atlas_url}
                      animation={careersCharacter.animation ?? "idle"}
                      skin={careersCharacter.skin ?? undefined}
                      className="h-full w-full"
                    />
                  ) : (
                    /* placeholder until character is uploaded via admin */
                    <div className="h-full w-full rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                      <span className="text-xs text-white/20">Character coming soon</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative flex flex-col justify-center pb-2 md:pb-0 md:pl-0">
                <StudioSectionTitle
                  sectionNum="// 05"
                  label="Careers"
                  title="LET'S CREATE AMAZING GAMES TOGETHER"
                  highlight="AMAZING GAMES"
                  description="We're passionate, talented individuals. Join our team and help shape the future of game art."
                  align="left"
                  className="mb-2 max-w-xl"
                />
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href="#"
                    className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.18em] text-black transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: ACCENT }}
                  >
                    View vacancies
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/90 transition-colors hover:bg-white/10"
                  >
                    Contact us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Trust / Clients + Blog + Small CTA (dark, with logo marquee) */}
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.16 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        id="blog"
        className="snap-start relative scroll-mt-24 overflow-hidden border-t border-white/10 bg-[#070709] py-20 lg:py-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-12%,rgba(245,158,11,0.09),transparent_52%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_75%,rgba(123,109,255,0.09),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,rgba(123,109,255,0.06),transparent_45%)]" />
        <div
          className="mx-auto"
          style={{ width: "min(var(--layout-width, 85%), 1240px)" }}
        >
          {/* Partners: studio eyebrow + single-line TRUST OUR CLIENTS */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.28 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative pb-2 md:pb-4"
          >
            <div className="mb-8 flex items-center justify-center gap-4 md:mb-10">
              <span
                className="text-sm font-black italic tracking-tighter"
                style={accentStyle}
              >
                // 06
              </span>
              <div className="h-px w-10 bg-white/10" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
                Partners
              </span>
            </div>

            <h2
              className="flex flex-wrap items-center justify-center gap-x-[0.35em] gap-y-1 px-4 text-center text-[clamp(1.65rem,5vw,3.75rem)] font-black uppercase leading-tight tracking-tight text-white md:gap-x-[0.28em]"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              <span>TRUST OUR</span>
              <AccentHighlight>CLIENTS</AccentHighlight>
            </h2>

            <p
              className="mx-auto mt-6 max-w-lg px-4 text-center text-sm leading-7 text-white/55 md:mt-8 md:text-[15px]"
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              Teams we&apos;ve shipped with â€” from rapid prototypes to live ops,
              built on clarity, craft, and follow-through.
            </p>
          </motion.div>

          {/* Logo marquee: full-bleed track + frosted â€œrailâ€ so it feels less flat */}
          <div className="relative mt-10 md:mt-14">
            <div className="pointer-events-none absolute -top-3 left-1/2 h-px w-[min(520px,88vw)] -translate-x-1/2 bg-linear-to-r from-transparent via-[color-mix(in_srgb,var(--hero-btn-bg,#f59e0b)_45%,transparent)] to-transparent opacity-80" />
            <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,transparent_28%,transparent_72%,rgba(0,0,0,0.25)_100%)] py-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] md:py-12">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-linear-to-r from-[#070709] to-transparent md:w-44" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-linear-to-l from-[#070709] to-transparent md:w-44" />
              <div className="pointer-events-none absolute inset-0 bg-white/[0.02]" />

              <motion.div
                className="relative flex w-max items-center gap-20 px-10 md:gap-28 md:px-20"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
              >
                {[
                  "https://cdn.tdgamestudio.com/landing/logoCompany/Frame-26-min-300x141.png",
                  "https://cdn.tdgamestudio.com/landing/logoCompany/Frame-27-min-300x141.png",
                  "https://cdn.tdgamestudio.com/landing/logoCompany/Frame-28-min-300x141.png",
                  "https://cdn.tdgamestudio.com/landing/logoCompany/Frame-29-min-300x141.png",
                  "https://cdn.tdgamestudio.com/landing/logoCompany/Frame-30-min-300x141.png",
                  "https://cdn.tdgamestudio.com/landing/logoCompany/Frame-26-min-300x141.png",
                  "https://cdn.tdgamestudio.com/landing/logoCompany/Frame-27-min-300x141.png",
                  "https://cdn.tdgamestudio.com/landing/logoCompany/Frame-28-min-300x141.png",
                  "https://cdn.tdgamestudio.com/landing/logoCompany/Frame-29-min-300x141.png",
                  "https://cdn.tdgamestudio.com/landing/logoCompany/Frame-30-min-300x141.png",
                ].map((src, idx) => (
                  <div
                    key={`${src}-${idx}`}
                    className="relative h-14 w-[220px] shrink-0 md:h-16 md:w-[260px]"
                  >
                    <Image
                      src={src}
                      alt="Client logo"
                      fill
                      className="object-contain opacity-80 brightness-[1.15] contrast-[1.05] transition-opacity hover:opacity-100"
                      sizes="260px"
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          <StudioSectionTitle
            sectionNum="// 07"
            label="Insights"
            title="STAY INFORMED WITH OUR BLOG"
            highlight="OUR BLOG"
            className="mt-16 mb-10 md:mb-12"
          />

          <BlogPreviewGrid />

          <div className="mt-14 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 md:grid-cols-[1fr_180px] md:items-center md:p-10">
            <div>
              <StudioSectionTitle
                sectionNum="// 08"
                label="Contact"
                title="LET'S TALK"
                highlight="TALK"
                description="Ready to bring your vision to life?"
                align="left"
                compact
                className="mb-0"
              />
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#"
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: ACCENT }}
                >
                  Get a quote
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center rounded-full border border-white/18 bg-transparent px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Contact
                </a>
              </div>
            </div>
            <div className="relative mx-auto h-[160px] w-[160px]">
              <Image
                src="https://cdn.tdgamestudio.com/landing/logoCompany/5-min-1-1024x970.jpg"
                alt="Mascot"
                fill
                className="rounded-2xl object-cover"
                sizes="160px"
              />
            </div>
          </div>
        </div>
      </motion.section>
    </>
  );
}