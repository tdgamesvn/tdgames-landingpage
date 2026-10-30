import type { Metadata } from "next";

/**
 * Ảnh OG mặc định toàn site (+ fallback image cho BlogPosting). CDN không có ảnh
 * brand 1200×630 → dùng key art Summoner Era (hero mặc định /services/2d-art),
 * 2400×1306 ≈ 1.84:1, gần tỉ lệ 1.91:1 của OG. Có ảnh OG chuẩn thì thay ở đây.
 */
export const DEFAULT_OG_IMAGE = {
  url: "https://cdn.tdgamestudio.com/landing/images/summoners.png",
  width: 2400,
  height: 1306,
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
