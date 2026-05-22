"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Nunito_Sans } from "next/font/google";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { AccentHighlight } from "@/components/accent-highlight";

const nunitoSans = Nunito_Sans({ weight: ["400", "600", "700"], subsets: ["latin"] });

type Post = {
  slug: string;
  date: string;
  title: string;
  excerpt: string;
  tag: string;
  image: string;
  views: number;
};

const ALL_POSTS: Post[] = [
  {
    slug: "how-to-create-a-game-character",
    date: "22.01.2024",
    title: "How to create a game character",
    excerpt: "In order to craft an effective game character, artists must balance visual appeal with functional design that serves gameplay.",
    tag: "Blog",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    views: 1606,
  },
  {
    slug: "high-poly-and-low-poly-modeling",
    date: "22.01.2024",
    title: "HIGH POLY AND LOW POLY MODELING",
    excerpt: "As the field of 3D modeling continues to evolve, understanding the difference between high poly and low poly is essential.",
    tag: "Blog",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    views: 1405,
  },
  {
    slug: "animation-outsourcing-guide",
    date: "22.01.2024",
    title: "Animation Outsourcing: A Guide for Success",
    excerpt: "Animation outsourcing involves delegating animation tasks to external studios or freelancers to optimize production.",
    tag: "Blog",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
    views: 1252,
  },
  {
    slug: "complete-guide-game-art-outsourcing",
    date: "22.01.2024",
    title: "Complete 2024 Guide to Game Art Outsourcing",
    excerpt: "Developing a game is a complex process that requires a wide range of skills and expertise across multiple disciplines.",
    tag: "Blog",
    image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&q=80",
    views: 2268,
  },
  {
    slug: "different-game-art-styles",
    date: "22.01.2024",
    title: "Different Game Art Styles",
    excerpt: "Video games represent a canvas for artistic expression, with each title showcasing a unique visual language.",
    tag: "Blog",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    views: 2272,
  },
  {
    slug: "impact-animation-education",
    date: "22.01.2024",
    title: "The Impact of Animation on Education and E-Learning",
    excerpt: "Animation has evolved beyond entertainment to become a powerful educational tool in modern learning environments.",
    tag: "Blog",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    views: 2208,
  },
  {
    slug: "animation-is-not-just-for-children",
    date: "22.01.2024",
    title: "Animation Is Not Just for Children",
    excerpt: "The perception that animation is solely for children has long been challenged by studios pushing creative boundaries.",
    tag: "Blog",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80",
    views: 2135,
  },
  {
    slug: "rendering-in-3d-animation",
    date: "22.01.2024",
    title: "Rendering in 3D animation production",
    excerpt: "In the realm of 3D animation, rendering is the final step that transforms digital models into polished visual output.",
    tag: "Blog",
    image: "https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800&q=80",
    views: 2019,
  },
  {
    slug: "color-correction-3d-animation",
    date: "22.01.2024",
    title: "Color Correction Process in 3D Animation",
    excerpt: "Color correction is a crucial step in 3D animation that ensures visual consistency and emotional impact.",
    tag: "Pipeline",
    image: "https://images.unsplash.com/photo-1561736778-92e52a7769ef?w=800&q=80",
    views: 1924,
  },
  {
    slug: "animation-storyboard",
    date: "22.01.2024",
    title: "Animation Storyboard: Everything You Should Know",
    excerpt: "In professional animation studios, storyboarding is the backbone of every successful production pipeline.",
    tag: "Pipeline",
    image: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=800&q=80",
    views: 1720,
  },
  {
    slug: "vfx-in-3d-animation",
    date: "22.01.2024",
    title: "VFX in 3D Animation",
    excerpt: "When delving into visual effects in 3D animation, artists must master the interplay between physics and artistry.",
    tag: "VFX",
    image: "https://images.unsplash.com/photo-1536240478700-b869ad10e128?w=800&q=80",
    views: 1628,
  },
  {
    slug: "what-is-3d-animation-layout",
    date: "22.01.2024",
    title: "What is a 3D animation layout and why does it matter?",
    excerpt: "As the 3D animation journey begins, layout serves as the critical bridge between storyboard and final animation.",
    tag: "Blog",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    views: 1599,
  },
];

const TAGS = ["All", "Blog", "Pipeline", "VFX"] as const;
type TagType = (typeof TAGS)[number];
const PER_PAGE = 10;

export default function BlogPage() {
  const [activeTag, setActiveTag] = useState<TagType>("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() =>
    activeTag === "All" ? ALL_POSTS : ALL_POSTS.filter((p) => p.tag === activeTag),
    [activeTag],
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const posts = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const changeTag = (tag: TagType) => { setActiveTag(tag); setPage(1); };

  return (
    <>
      <SiteHeader />
      <main className={`min-h-screen bg-[#0a0a0a] text-white ${nunitoSans.className}`}>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden pb-12 pt-28 md:pt-36 lg:pt-40">
          {/* Background ghost text */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden" aria-hidden>
            <span
              className="block font-black uppercase leading-none tracking-tighter text-white/[0.04]"
              style={{ fontFamily: "var(--font-rajdhani)", fontSize: "clamp(100px, 20vw, 280px)" }}
            >
              ARTICLES
            </span>
          </div>

          {/* Subtle radial glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full opacity-20 blur-[120px]"
            style={{ background: "radial-gradient(ellipse, rgba(245,158,11,0.15) 0%, transparent 70%)" }}
            aria-hidden
          />

          <div className="relative z-10 mx-auto px-4" style={{ width: "min(var(--layout-width,85%),1280px)" }}>
            {/* Tag line */}
            <div className="mb-5 flex items-center gap-4">
              <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.4)]">
                // Journal
              </span>
              <div className="h-px w-16 shrink-0 bg-gradient-to-r from-[#ff8c3a]/60 to-transparent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/70">
                {ALL_POSTS.length} Articles
              </span>
            </div>

            {/* Title */}
            <h1
              className="text-4xl font-black uppercase leading-[1.05] tracking-tight md:text-5xl lg:text-[64px]"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              TD Games <AccentHighlight>Blog</AccentHighlight>
            </h1>

            {/* Description */}
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/60 md:text-[15px]">
              Insights on 2D art, animation, VFX, and game production — from the team at TD Games.
            </p>
          </div>

          {/* Bottom gradient border */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f59e0b]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f59e0b]/20 to-transparent blur-sm" />
        </section>

        {/* ── Filter + Grid ── */}
        <section className="py-12 md:py-16">
          <div className="mx-auto px-4" style={{ width: "min(var(--layout-width,85%),1280px)" }}>

            {/* Filter tabs */}
            <div className="mb-8">
              <p className="mb-3 text-sm text-white/55">Choose the articles you are interested in</p>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => changeTag(tag)}
                    className={`rounded-full border px-5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTag === tag
                        ? "border-[#f59e0b] bg-[#f59e0b] text-black"
                        : "border-white/20 text-white/70 hover:border-white/40 hover:text-white"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 2-column grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="group flex min-h-[160px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all hover:border-[#f59e0b]/30 hover:bg-white/[0.05] sm:min-h-[180px]"
                >
                  {/* Thumbnail */}
                  <Link href={`/blog/${post.slug}`} className="relative w-[160px] shrink-0 overflow-hidden sm:w-[190px] md:w-[210px]">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 160px, 210px"
                    />
                  </Link>

                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#f59e0b]/80">
                        {post.tag}
                      </span>
                      <h2
                        className="mt-1.5 text-base font-bold leading-snug text-white transition-colors group-hover:text-[#f59e0b] md:text-lg"
                        style={{ fontFamily: "var(--font-rajdhani)" }}
                      >
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/50">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="mt-4 flex items-center gap-3 text-xs text-white/40">
                      <span>{post.date}</span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {post.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/60 transition-all hover:border-white/30 hover:text-white disabled:opacity-30"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold transition-all ${
                      page === n
                        ? "border-[#f59e0b] bg-[#f59e0b] text-black"
                        : "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/60 transition-all hover:border-white/30 hover:text-white disabled:opacity-30"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
