import fs from "node:fs";
import path from "node:path";

import type { MetadataRoute } from "next";

import { listActiveJobs } from "@/lib/jobs-data";
import { isNoindexCaseStudy } from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const BASE_URL = "https://tdgamestudio.com";

// Auto-blog đăng bài mỗi ngày. Để static thì sitemap bị đông cứng lúc build
// (fetch cache giữ lại danh sách 8 bài cũ) → render theo từng request.
export const dynamic = "force-dynamic";

// Server chạy `next start` từ gốc repo (VPS /opt/tdgames-landingpage) nên src/ có sẵn.
const APP_DIR = path.join(process.cwd(), "src", "app");

/**
 * lastmod thật = mtime mới nhất của file nguồn trong thư mục route (không đệ quy).
 * Deploy dùng `git reset --hard` → git chỉ ghi lại file ĐÃ ĐỔI, nên mtime ≈ lần
 * cuối nội dung trang thay đổi trên server. KHÔNG dùng new Date() (Google sẽ
 * học cách bỏ qua lastmod). Đọc lỗi → bỏ lastmod chứ không bịa.
 */
function lastModifiedOf(...relPaths: string[]): Date | undefined {
  let latest = 0;
  for (const rel of relPaths) {
    const abs = path.join(APP_DIR, rel);
    try {
      const st = fs.statSync(abs);
      const files = st.isDirectory()
        ? fs
            .readdirSync(abs, { withFileTypes: true })
            .filter((e) => e.isFile() && /\.(tsx?|json|md)$/.test(e.name))
            .map((e) => path.join(abs, e.name))
        : [abs];
      for (const f of files) latest = Math.max(latest, fs.statSync(f).mtimeMs);
    } catch {
      // file/thư mục không có → bỏ qua
    }
  }
  return latest > 0 ? new Date(latest) : undefined;
}

// Danh sách tĩnh dự phòng (chụp 2026-10-30) — chỉ dùng khi không đọc được src/app/portfolio
// lúc chạy (vd standalone build không kèm source) để sitemap không mất trắng 30 case study.
const FALLBACK_PORTFOLIO_SLUGS = [
  "animation-contest-sky-mavis", "axie-infinity-origins", "battle-of-the-gods-mytheria",
  "boss-animation", "chibi-heroes-pets", "epic-card", "game-animation-vfx-3q", "heroes-fire",
  "horse-racing", "kayn-snow-moon", "lore-axie-origin", "mid-autumn-summoner-era",
  "monster-legends", "monster-legends-dark", "monster-legends-earth", "monster-legends-fire",
  "monster-legends-light", "monster-legends-magic", "monster-legends-metal",
  "monster-legends-nature", "monster-legends-special", "monster-legends-thunder",
  "monster-legends-water", "puzzle-wonderland", "reaper-lady-project-overdrive",
  "stickman-legend", "summoner-era", "summoner-era-2020", "summoner-era-arena-of-heroes", "yomi-2",
];

/**
 * Slug case study = thư mục con của src/app/portfolio có page.tsx (bỏ thư mục `_` nội bộ).
 * Bỏ trang noindex (monster-legends-<element>) — sitemap chỉ chứa URL muốn index.
 */
function portfolioSlugs(): string[] {
  let slugs = readPortfolioSlugs();
  if (!slugs.length) {
    console.warn("[sitemap] không đọc được slug portfolio → dùng FALLBACK_PORTFOLIO_SLUGS");
    slugs = FALLBACK_PORTFOLIO_SLUGS;
  }
  return slugs.filter((slug) => !isNoindexCaseStudy(slug));
}

function readPortfolioSlugs(): string[] {
  try {
    return fs
      .readdirSync(path.join(APP_DIR, "portfolio"), { withFileTypes: true })
      .filter(
        (e) =>
          e.isDirectory() &&
          !e.name.startsWith("_") &&
          !e.name.startsWith("[") &&
          fs.existsSync(path.join(APP_DIR, "portfolio", e.name, "page.tsx")),
      )
      .map((e) => e.name)
      .sort();
  } catch (err) {
    console.error("[sitemap] portfolio dir", err);
    return [];
  }
}

// Trang tĩnh: [path, các file/thư mục nguồn (tương đối src/app) để lấy lastmod].
// /services (hub) redirect về "/" nên không đưa vào. /blog lấy lastmod theo bài mới nhất.
const STATIC_ROUTES: [string, string[]][] = [
  ["/", ["page.tsx", "../content/site.json"]],
  ["/about", ["about"]],
  ["/services/2d-art", ["services/2d-art"]],
  ["/services/2d-animation", ["services/2d-animation"]],
  ["/services/2d-vfx", ["services/2d-vfx"]],
  ["/services/full-game-production", ["services/full-game-production"]],
  ["/portfolio", ["portfolio"]],
  ["/showreel", ["showreel"]],
  ["/tools", ["tools"]],
  ["/careers", ["careers"]],
  ["/contact", ["contact"]],
  ["/company-profile", ["company-profile"]],
  ["/privacy-policy", ["privacy-policy"]],
  ["/terms-of-use", ["terms-of-use"]],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (p: string) => (p === "/" ? BASE_URL : `${BASE_URL}${p}`);

  // ponytail: blog nằm ở Supabase, không phải site.json. DB lỗi → bỏ qua blog
  // routes chứ không để cả sitemap fail.
  let blogRoutes: MetadataRoute.Sitemap = [];
  let blogLatest: Date | undefined;
  try {
    const { data } = await getSupabaseAdmin()
      .from("blog_posts")
      .select("slug, created_at, updated_at")
      .eq("published", true);
    blogRoutes = (data ?? []).map((post) => {
      const raw = post.updated_at ?? post.created_at;
      const lastModified = raw ? new Date(raw) : undefined;
      if (lastModified && (!blogLatest || lastModified > blogLatest)) blogLatest = lastModified;
      return { url: `${BASE_URL}/blog/${post.slug}`, ...(lastModified ? { lastModified } : {}) };
    });
  } catch (err) {
    console.error("[sitemap] blog_posts", err);
  }

  const staticRoutes: MetadataRoute.Sitemap = STATIC_ROUTES.map(([p, sources]) => {
    const lastModified = lastModifiedOf(...sources);
    return { url: url(p), ...(lastModified ? { lastModified } : {}) };
  });
  const blogIndexLastMod = blogLatest ?? lastModifiedOf("blog");
  staticRoutes.splice(7, 0, {
    url: url("/blog"),
    ...(blogIndexLastMod ? { lastModified: blogIndexLastMod } : {}),
  });

  // Trang riêng từng job đang tuyển (job đóng → 404 nên không đưa vào). DB lỗi → bỏ qua.
  let jobRoutes: MetadataRoute.Sitemap = [];
  try {
    jobRoutes = (await listActiveJobs()).map((job) => {
      const lastModified = job.created_at ? new Date(job.created_at) : undefined;
      return { url: `${BASE_URL}/careers/${job.slug}`, ...(lastModified ? { lastModified } : {}) };
    });
  } catch (err) {
    console.error("[sitemap] jobs", err);
  }

  const portfolioRoutes: MetadataRoute.Sitemap = portfolioSlugs().map((slug) => {
    const lastModified = lastModifiedOf(`portfolio/${slug}`);
    return { url: `${BASE_URL}/portfolio/${slug}`, ...(lastModified ? { lastModified } : {}) };
  });

  return [...staticRoutes, ...jobRoutes, ...portfolioRoutes, ...blogRoutes];
}
