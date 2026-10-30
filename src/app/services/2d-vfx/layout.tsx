import type { Metadata } from "next";

import { ogImages } from "@/lib/seo";

const HERO_IMAGE = "https://cdn.tdgamestudio.com/landing/images/f8e2e81a-e72c-431b-b4ec-5ab7af73ea12.png";

export const metadata: Metadata = {
  title: "2D Game VFX Outsourcing — Skill, Combat & UI Effects",
  description:
    "Stunning 2D VFX for games: skill effects, particle systems, impact animations, and magic spells. TD Games creates visual effects that make your game stand out.",
  alternates: { canonical: "/services/2d-vfx" },
  openGraph: {
    title: "2D Game VFX Outsourcing — Skill, Combat & UI Effects | TD Games",
    description: "Eye-catching 2D game visual effects and particle systems from TD Games.",
    url: "https://tdgamestudio.com/services/2d-vfx",
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
