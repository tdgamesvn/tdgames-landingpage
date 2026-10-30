import type { Metadata } from "next";

/**
 * Ảnh OG mặc định toàn site (+ fallback image cho BlogPosting): brand card 1200×630 JPG
 * (key art Summoner Era + logo TD Games), sinh 2026-10-30 bằng sharp, upload R2 key mới
 * qua scripts/upload-r2-new-keys.mjs. JPG chứ không WebP/PNG: vài nền tảng chia sẻ
 * (Zalo, LinkedIn, Facebook cũ) không đọc WebP. Đổi ảnh thì đặt key MỚI (CDN immutable).
 */
export const DEFAULT_OG_IMAGE = {
  url: "https://cdn.tdgamestudio.com/landing/og/tdgames-og-default.jpg",
  width: 1200,
  height: 630,
  alt: "TD Games — 2D game art, animation & VFX outsourcing studio",
} as const;

type OgImage = { url: string; width?: number; height?: number; alt?: string };

/** openGraph.images: ảnh riêng của trang nếu có, không thì ảnh mặc định site. Encode khoảng trắng trong URL. */
export function ogImages(image?: string | OgImage | null): OgImage[] {
  if (!image) return [{ ...DEFAULT_OG_IMAGE }];
  const img = typeof image === "string" ? { url: image } : image;
  return [{ ...img, url: img.url.replace(/ /g, "%20") }];
}

/**
 * Case study con của Monster Legends (monster-legends-fire, -water…): nội dung gần trùng
 * nhau và trùng hub → noindex,follow + bỏ khỏi sitemap. Hub /portfolio/monster-legends vẫn index
 * và vẫn link tới các trang này. Canonical vẫn tự trỏ chính nó (nội dung khác hub).
 */
export function isNoindexCaseStudy(slug: string): boolean {
  return /^monster-legends-.+/.test(slug);
}

/**
 * Metadata cho trang case study portfolio: title/description riêng + canonical.
 * Không có hàm này thì 16 case study kế thừa chung title "Portfolio" từ portfolio/layout
 * → Google coi là trùng lặp.
 */
export function caseStudyMetadata(
  slug: string,
  meta: { title: string; summary?: string; coverImage?: string },
): Metadata {
  const path = `/portfolio/${slug}`;
  const title = meta.title.replace(/\s+/g, " ").trim();
  const description = meta.summary?.replace(/\s+/g, " ").trim();
  return {
    // absolute: template "%s | TD Games" của root không tới được đây vì portfolio/layout đặt title dạng string.
    title: { absolute: `${title} | TD Games` },
    description,
    alternates: { canonical: path },
    ...(isNoindexCaseStudy(slug) ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: `${title} — TD Games Studio`,
      description,
      url: `https://tdgamestudio.com${path}`,
      siteName: "TD Games",
      type: "article",
      images: ogImages(meta.coverImage ? { url: meta.coverImage, alt: title } : null),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — TD Games Studio`,
      description,
      images: ogImages(meta.coverImage).map((i) => i.url),
    },
  };
}
