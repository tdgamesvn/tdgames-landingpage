import type { Metadata } from "next";

/**
 * Metadata cho trang case study portfolio: title/description riêng + canonical.
 * Không có hàm này thì 16 case study kế thừa chung title "Portfolio" từ portfolio/layout
 * → Google coi là trùng lặp.
 */
export function caseStudyMetadata(
  slug: string,
  meta: { title: string; summary?: string },
): Metadata {
  const path = `/portfolio/${slug}`;
  const title = meta.title.replace(/\s+/g, " ").trim();
  const description = meta.summary?.replace(/\s+/g, " ").trim();
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} — TD Games Studio`,
      description,
      url: `https://tdgamestudio.com${path}`,
      siteName: "TD Games",
      type: "article",
    },
  };
}
