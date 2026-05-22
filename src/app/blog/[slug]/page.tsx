import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nunito_Sans } from "next/font/google";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

const nunitoSans = Nunito_Sans({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

/** Keep in sync with listing slugs in /blog/page.tsx until you use a real CMS. */
const MOCK_SLUGS = new Set([
  "mock-pipeline-handoff",
  "mock-style-bible",
  "mock-vfx-readability",
]);

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!MOCK_SLUGS.has(slug)) return { title: "Not found" };
  return {
    title: `[Mock post] ${slug} — TD Games Blog`,
    description: "Draft article placeholder.",
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  if (!MOCK_SLUGS.has(slug)) notFound();

  return (
    <>
      <SiteHeader />
      <main
        className={`min-h-screen bg-[#090a10] text-white ${nunitoSans.className}`}
      >
        <article
          className="mx-auto px-4 py-28 md:py-32"
          style={{ width: "min(var(--layout-width, 85%), 720px)" }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ff9f1a]">
            [Mock article]
          </p>
          <h1
            className="mt-4 text-3xl font-black uppercase leading-tight tracking-tight md:text-4xl"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            {slug.replace(/-/g, " ")}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/75 md:text-lg">
            Đây là trang chi tiết <strong className="text-white">placeholder</strong>
            . Thay bằng MDX/HTML từ CMS hoặc file trong repo. Nội dung mock: lorem
            ipsum cho đủ chiều dài scroll.
          </p>
          <div className="mt-8 space-y-4 text-white/70">
            <p>
              TD Games blog draft — paragraph một. Viết về pipeline, tool, hoặc
              case study; thêm hình minh họa từ{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">
                public/images
              </code>
              .
            </p>
            <p>
              Paragraph hai. Khi publish thật, thêm author, date, share links,
              và related posts ở cuối bài.
            </p>
          </div>
          <Link
            href="/blog"
            className="mt-10 inline-flex text-sm font-bold uppercase tracking-wider text-[#f59e0b] hover:underline"
          >
            ← Back to blog
          </Link>
        </article>
        <SiteFooter />
      </main>
    </>
  );
}
