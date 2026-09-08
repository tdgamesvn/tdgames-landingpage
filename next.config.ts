import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deploy build vào thư mục tạm (NEXT_DIST_DIR=.next-new) rồi mới swap sang .next,
  // để app đang chạy không mất file giữa chừng — xem .github/workflows/deploy.yml.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  // Không thêm lại rewrite `/cdn-proxy/:path*` → cdn.tdgamestudio.com. Rewrite
  // proxy thẳng ra R2 nên response giữ nguyên `Cache-Control: max-age=604800`
  // của R2, áp cho CẢ 404 → browser khách ghim lỗi 1 tuần, purge Cloudflare
  // không dọn được. Dùng route handler `/api/cdn-proxy/[...path]` (nó set
  // no-store cho lỗi và max-age ngắn cho 200).
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
