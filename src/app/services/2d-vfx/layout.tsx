import type { Metadata } from "next";

import { ogImages } from "@/lib/seo";

// Ảnh OG 1200×630 JPG crop từ hero mặc định của trang (WebP/PNG lớn không phải nền tảng chia sẻ nào cũng đọc).
const OG_IMAGE = "https://cdn.tdgamestudio.com/landing/og/2d-vfx.jpg";

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
    images: ogImages({ url: OG_IMAGE, width: 1200, height: 630 }),
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
