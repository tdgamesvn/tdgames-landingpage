import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { Nunito_Sans } from "next/font/google";
import { marked } from "marked";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const nunitoSans = Nunito_Sans({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

type Props = { params: Promise<{ slug: string }> };

async function getPost(slug: string) {
  try {
    // Draft Mode bật = đang preview từ /admin → cho xem cả bài chưa publish.
    // Cookie chỉ set được qua /api/admin/blog/preview (đã check admin secret).
    const isPreview = (await draftMode()).isEnabled;

    const supabase = getSupabaseAdmin();
    let query = supabase.from("blog_posts").select("*").eq("slug", slug);
    if (!isPreview) query = query.eq("published", true);
    const { data: post, error } = await query.single();

    if (error || !post) return null;

    // Increment views (fire-and-forget) — KHÔNG đếm lượt xem của chính sếp khi preview.
    if (!isPreview) {
      void supabase
        .from("blog_posts")
        .update({ views: post.views + 1 })
        .eq("id", post.id);
    }

    return { ...post, isPreview };
  } catch {
    return null;
  }
}

const BASE_URL = "https://tdgamestudio.com";

// Bài liên quan: 1 query, ưu tiên cùng tag rồi mới tới bài mới nhất.
async function getRelated(slug: string, tag: string) {
  try {
    const { data } = await getSupabaseAdmin()
      .from("blog_posts")
      .select("slug, title, tag, cover_image, created_at")
      .eq("published", true)
      .neq("slug", slug)
      .order("created_at", { ascending: false })
      .limit(9);
    return (data ?? [])
      .sort((a, b) => Number(b.tag === tag) - Number(a.tag === tag))
      .slice(0, 3);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Not found" };
  const url = `${BASE_URL}/blog/${slug}`;
  const description = post.excerpt || "Read this article on the TD Games blog.";
  const images = post.cover_image ? [{ url: post.cover_image }] : undefined;
  return {
    title: `${post.title} — TD Games Blog`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description,
      publishedTime: post.created_at,
      modifiedTime: post.updated_at ?? post.created_at,
      authors: [post.author],
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
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
  const related = await getRelated(slug, post.tag);

  // JSON-LD cho Google rich result. Bản nháp thì thôi, khỏi rác.
  const jsonLd = post.isPreview
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt || undefined,
        image: post.cover_image || undefined,
        datePublished: post.created_at,
        dateModified: post.updated_at ?? post.created_at,
        author: { "@type": "Organization", name: post.author },
        publisher: {
          "@type": "Organization",
          name: "TD Games",
          logo: { "@type": "ImageObject", url: `${BASE_URL}/icon.png` },
        },
        mainEntityOfPage: `${BASE_URL}/blog/${slug}`,
      };

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // escape `<` để title chứa "</script>" không thoát ra khỏi thẻ.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      {/* Không để sếp nhầm bản nháp với bài đã đăng thật. */}
      {post.isPreview && (
        <div className="sticky top-0 z-50 bg-[#f59e0b] px-4 py-2 text-center text-sm font-bold text-black">
          ĐANG XEM BẢN NHÁP{post.published ? "" : " — bài này CHƯA đăng"} ·{" "}
          <a href="/api/admin/blog/preview/exit" className="underline">
            Thoát preview
          </a>
        </div>
      )}
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

          {/* Bài liên quan — giữ reader ở lại thay vì bounce sau 1 bài */}
          {related.length > 0 && (
            <section className="mt-16 border-t border-white/10 pt-10">
              <h2
                className="text-lg font-black uppercase tracking-tight text-white"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                Keep reading
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="group block overflow-hidden rounded-lg border border-white/10 transition hover:border-[#f59e0b]/60"
                  >
                    <div className="relative h-28 w-full bg-white/5">
                      {r.cover_image && (
                        <Image
                          src={r.cover_image}
                          alt={r.title}
                          fill
                          className="object-cover transition group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 240px"
                        />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff9f1a]">
                        {r.tag}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-white/85">
                        {r.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

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
