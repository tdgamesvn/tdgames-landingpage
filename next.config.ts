import type { NextConfig } from "next";

import blogRedirects from "./src/content/blog-redirects.json";
import { buildBlogRedirects } from "./src/lib/blog-redirects";

const nextConfig: NextConfig = {
  // Deploy build vào thư mục tạm (NEXT_DIST_DIR=.next-new) rồi mới swap sang .next,
  // để app đang chạy không mất file giữa chừng — xem .github/workflows/deploy.yml.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // react-pdf (sinh PDF thư mời nhận việc) là ESM nặng, đọc font bằng fs → chạy thẳng từ node_modules, không bundle.
  serverExternalPackages: ["@react-pdf/renderer"],
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  // Không thêm lại rewrite `/cdn-proxy/:path*` → cdn.tdgamestudio.com. Rewrite
  // proxy thẳng ra R2 nên response giữ nguyên `Cache-Control: max-age=604800`
  // của R2, áp cho CẢ 404 → browser khách ghim lỗi 1 tuần, purge Cloudflare
  // không dọn được. Dùng route handler `/api/cdn-proxy/[...path]` (nó set
  // no-store cho lỗi và max-age ngắn cho 200).
  // URL của site cũ mà Google vẫn còn nhớ (Search Console báo 404, 2026-09-25) → 308 sang trang mới.
  async redirects() {
    return [
      { source: "/quote", destination: "/contact", permanent: true },
      { source: "/services/art", destination: "/services/2d-art", permanent: true },
      { source: "/services/animation", destination: "/services/2d-animation", permanent: true },
      { source: "/services/vfx", destination: "/services/2d-vfx", permanent: true },
      // Bài blog đã gộp vào bài trụ cột → 301 (giữ vĩnh viễn, không có chuỗi). Dữ liệu sai thì build throw.
      ...buildBlogRedirects(blogRedirects),
    ];
  },
  // Security headers cho mọi route. HSTS cố ý KHÔNG includeSubDomains/preload
  // (subdomain khác chưa chắc toàn HTTPS). Không có CSP (chưa audit nguồn script).
  // microphone=(): grep src không có getUserMedia/MediaRecorder (kể cả /hr) → khoá hết.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tdgamestudio.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.tdgamestudio.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "mir-s3-cdn-cf.behance.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pps.services.adobe.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
