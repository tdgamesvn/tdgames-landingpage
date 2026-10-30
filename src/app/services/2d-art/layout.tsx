import type { Metadata } from "next";

import { ogImages } from "@/lib/seo";

const HERO_IMAGE = "https://cdn.tdgamestudio.com/landing/images/summoners.png";

export const metadata: Metadata = {
  title: "2D Game Art Outsourcing — Characters, Concept Art & UI",
  description:
    "Professional 2D game art outsourcing: character design, concept art, UI/UX, and environment art. TD Games delivers pixel-perfect assets for mobile and PC games.",
  alternates: { canonical: "/services/2d-art" },
  openGraph: {
    title: "2D Game Art Outsourcing — Characters, Concept Art & UI | TD Games",
    description: "High-quality 2D character design, concept art, and game UI from Vietnam's top art studio.",
    url: "https://tdgamestudio.com/services/2d-art",
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
