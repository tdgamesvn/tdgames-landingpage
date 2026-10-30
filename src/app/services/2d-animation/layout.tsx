import type { Metadata } from "next";

import { ogImages } from "@/lib/seo";

const HERO_IMAGE = "https://cdn.tdgamestudio.com/landing/images/Environment_Art-1024x683.jpg";

export const metadata: Metadata = {
  title: "2D Game Animation & Spine Animation Service",
  description:
    "Expert 2D game animation outsourcing: character animation, cutscenes, login screen animations, and idle animations. Trusted by top game studios.",
  alternates: { canonical: "/services/2d-animation" },
  openGraph: {
    title: "2D Game Animation & Spine Animation Service | TD Games",
    description: "Fluid, expressive 2D game animation from Vietnam's leading animation studio.",
    url: "https://tdgamestudio.com/services/2d-animation",
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
