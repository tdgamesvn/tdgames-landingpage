import type { Metadata } from "next";

import { ogImages } from "@/lib/seo";

const HERO_IMAGE = "https://cdn.tdgamestudio.com/projects/2026/09/158deb1a-5ea9-4cb9-b521-fd76c1438e3b-hero-trim.webp";

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
    // Ảnh hero mặc định của trang (fallback của slot "hero" trong page.tsx).
    images: ogImages(HERO_IMAGE),
  },
  twitter: { card: "summary_large_image", images: [HERO_IMAGE] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
