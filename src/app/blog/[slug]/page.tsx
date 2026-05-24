import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Nunito_Sans } from "next/font/google";
import { marked } from "marked";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

const nunitoSans = Nunito_Sans({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

type Props = { params: Promise<{ slug: string }> };

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

async function getPost(slug: string) {
  try {
    const res = await fetch(`${BASE}/api/blog/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.post ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Not found" };
  return {
    title: `${post.title} — TD Games Blog`,
    description: post.excerpt || "Read this article on the TD Games blog.",
    openGraph: post.cover_image
      ? { images: [{ url: post.cover_image }] }
      : undefined,
  };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const htmlContent = post.content_md ? (marked(post.content_md) as string) : "";

  return (
    <>
      <SiteHeader />
      <main
        className={`min-h-screen bg-[#090a10] text-white ${nunitoSans.className}`}
      >
        <article className="mx-auto px-4 py-24 md:py-28" style={{ width: "min(var(--layout-width, 85%), 768px)" }}>

          {/* Tag */}
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ff9f1a]">
            {post.tag}
          </p>

          {/* Title */}
          <h1
            className="mt-4 text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/45">
            <span>{post.author}</span>
            <span>·</span>
            <span>{fmtDate(post.created_at)}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.views.toLocaleString()} views
            </span>
          </div>

          {/* Excerpt / subtitle */}
          {post.excerpt && (
            <p className="mt-6 text-base leading-relaxed text-white/65 md:text-lg border-l-2 border-[#f59e0b]/50 pl-4">
              {post.excerpt}
            </p>
          )}

          {/* Cover image */}
          {post.cover_image && (
            <div className="relative mt-8 h-64 w-full overflow-hidden rounded-xl sm:h-80 md:h-96">
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          )}

          {/* Markdown body */}
          {htmlContent ? (
            <>
              <style>{`
                .prose-blog h1, .prose-blog h2, .prose-blog h3,
                .prose-blog h4, .prose-blog h5, .prose-blog h6 {
                  font-family: var(--font-rajdhani);
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: -0.02em;
                  color: #fff;
                  margin-top: 2rem;
                  margin-bottom: 0.75rem;
                  line-height: 1.2;
                }
                .prose-blog h1 { font-size: 2rem; }
                .prose-blog h2 { font-size: 1.5rem; }
                .prose-blog h3 { font-size: 1.25rem; }
                .prose-blog p { margin-bottom: 1.25rem; line-height: 1.75; color: rgba(255,255,255,0.72); }
                .prose-blog ul, .prose-blog ol { margin: 1rem 0 1.25rem 1.5rem; color: rgba(255,255,255,0.72); }
                .prose-blog li { margin-bottom: 0.35rem; line-height: 1.7; }
                .prose-blog ul { list-style-type: disc; }
                .prose-blog ol { list-style-type: decimal; }
                .prose-blog a { color: #f59e0b; text-decoration: underline; }
                .prose-blog a:hover { color: #fbbf24; }
                .prose-blog strong { color: #fff; font-weight: 600; }
                .prose-blog em { font-style: italic; }
                .prose-blog blockquote {
                  border-left: 3px solid rgba(245,158,11,0.5);
                  padding: 0.5rem 0 0.5rem 1rem;
                  margin: 1.5rem 0;
                  color: rgba(255,255,255,0.55);
                  font-style: italic;
                }
                .prose-blog code {
                  background: rgba(255,255,255,0.08);
                  border-radius: 4px;
                  padding: 0.1em 0.4em;
                  font-size: 0.875em;
                  font-family: ui-monospace, monospace;
                  color: #fbbf24;
                }
                .prose-blog pre {
                  background: rgba(255,255,255,0.05);
                  border: 1px solid rgba(255,255,255,0.1);
                  border-radius: 8px;
                  padding: 1rem 1.25rem;
                  overflow-x: auto;
                  margin: 1.5rem 0;
                }
                .prose-blog pre code {
                  background: none;
                  padding: 0;
                  color: rgba(255,255,255,0.85);
                }
                .prose-blog hr {
                  border: none;
                  border-top: 1px solid rgba(255,255,255,0.1);
                  margin: 2rem 0;
                }
                .prose-blog img {
                  border-radius: 8px;
                  width: 100%;
                  margin: 1.5rem 0;
                }
                .prose-blog table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 1.5rem 0;
                  font-size: 0.9rem;
                }
                .prose-blog th, .prose-blog td {
                  border: 1px solid rgba(255,255,255,0.1);
                  padding: 0.5rem 0.75rem;
                  text-align: left;
                }
                .prose-blog th { background: rgba(255,255,255,0.05); color: #fff; font-weight: 600; }
              `}</style>
              <div
                className="prose-blog mt-10"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </>
          ) : null}

          {/* Back link */}
          <Link
            href="/blog"
            className="mt-12 inline-flex text-sm font-bold uppercase tracking-wider text-[#f59e0b] hover:underline"
          >
            ← Back to blog
          </Link>
        </article>
        <SiteFooter />
      </main>
    </>
  );
}
