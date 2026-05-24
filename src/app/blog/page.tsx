"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Nunito_Sans } from "next/font/google";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { AccentHighlight } from "@/components/accent-highlight";

const nunitoSans = Nunito_Sans({ weight: ["400", "600", "700"], subsets: ["latin"] });

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  cover_image: string;
  views: number;
  author: string;
  created_at: string;
};

const PER_PAGE = 10;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, ".");
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => {/* silently fail */})
      .finally(() => setLoading(false));
  }, []);

  const tags = useMemo(() => {
    const unique = Array.from(new Set(posts.map((p) => p.tag)));
    return ["All", ...unique];
  }, [posts]);

  const filtered = useMemo(
    () => (activeTag === "All" ? posts : posts.filter((p) => p.tag === activeTag)),
    [activeTag, posts]
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pagePosts = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const changeTag = (tag: string) => { setActiveTag(tag); setPage(1); };

  return (
    <>
      <SiteHeader />
      <main className={`min-h-screen bg-[#0a0a0a] text-white ${nunitoSans.className}`}>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden pb-12 pt-28 md:pt-36 lg:pt-40">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden" aria-hidden>
            <span
              className="block font-black uppercase leading-none tracking-tighter text-white/[0.04]"
              style={{ fontFamily: "var(--font-rajdhani)", fontSize: "clamp(100px, 20vw, 280px)" }}
            >
              ARTICLES
            </span>
          </div>

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full opacity-20 blur-[120px]"
            style={{ background: "radial-gradient(ellipse, rgba(245,158,11,0.15) 0%, transparent 70%)" }}
            aria-hidden
          />

          <div className="relative z-10 mx-auto px-4" style={{ width: "min(var(--layout-width,85%),1280px)" }}>
            <div className="mb-5 flex items-center gap-4">
              <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.4)]">
                // Journal
              </span>
              <div className="h-px w-16 shrink-0 bg-gradient-to-r from-[#ff8c3a]/60 to-transparent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/70">
                {loading ? "…" : `${posts.length} Articles`}
              </span>
            </div>

            <h1
              className="text-4xl font-black uppercase leading-[1.05] tracking-tight md:text-5xl lg:text-[64px]"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              TD Games <AccentHighlight>Blog</AccentHighlight>
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/60 md:text-[15px]">
              Insights on 2D art, animation, VFX, and game production — from the team at TD Games.
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f59e0b]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f59e0b]/20 to-transparent blur-sm" />
        </section>

        {/* ── Filter + Grid ── */}
        <section className="py-12 md:py-16">
          <div className="mx-auto px-4" style={{ width: "min(var(--layout-width,85%),1280px)" }}>

            {/* Filter tabs */}
            {!loading && tags.length > 1 && (
              <div className="mb-8">
                <p className="mb-3 text-sm text-white/55">Choose the articles you are interested in</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
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
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex min-h-[180px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] animate-pulse">
                    <div className="w-[190px] shrink-0 bg-white/[0.06]" />
                    <div className="flex-1 p-5 space-y-3">
                      <div className="h-3 w-16 rounded bg-white/10" />
                      <div className="h-5 w-4/5 rounded bg-white/10" />
                      <div className="h-3 w-full rounded bg-white/[0.06]" />
                      <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && posts.length === 0 && (
              <p className="text-center text-sm text-white/40 py-16">No posts yet. Check back soon!</p>
            )}

            {/* 2-column grid */}
            {!loading && pagePosts.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {pagePosts.map((post) => (
                  <article
                    key={post.slug}
                    className="group flex min-h-[160px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all hover:border-[#f59e0b]/30 hover:bg-white/[0.05] sm:min-h-[180px]"
                  >
                    {/* Thumbnail */}
                    <Link href={`/blog/${post.slug}`} className="relative w-[160px] shrink-0 overflow-hidden sm:w-[190px] md:w-[210px]">
                      {post.cover_image ? (
                        <Image
                          src={post.cover_image}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 160px, 210px"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-white/[0.04] flex items-center justify-center">
                          <span className="text-white/20 text-3xl font-black" style={{ fontFamily: "var(--font-rajdhani)" }}>TD</span>
                        </div>
                      )}
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
                        <span>{fmtDate(post.created_at)}</span>
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
            )}

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
