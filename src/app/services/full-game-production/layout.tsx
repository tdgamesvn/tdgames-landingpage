import type { Metadata } from "next";

import { ogImages } from "@/lib/seo";

// Ảnh OG 1200×630 JPG crop từ hero mặc định của trang (WebP/PNG lớn không phải nền tảng chia sẻ nào cũng đọc).
const OG_IMAGE = "https://cdn.tdgamestudio.com/landing/og/full-game-production.jpg";

export const metadata: Metadata = {
  title: "Full-Cycle Game Development Outsourcing",
  description:
    "End-to-end game production: game design, 2D art, animation, VFX, engineering and QA under one team. TD Games builds your game from pitch to store build.",
  alternates: { canonical: "/services/full-game-production" },
  openGraph: {
    title: "Full-Cycle Game Development Outsourcing | TD Games",
    description:
      "One team for game design, art, animation, VFX and development — from concept to launch.",
    url: "https://tdgamestudio.com/services/full-game-production",
    siteName: "TD Games",
    type: "website",
    images: ogImages({ url: OG_IMAGE, width: 1200, height: 630 }),
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
