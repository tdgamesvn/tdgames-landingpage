import type { Metadata } from "next";

import { ogImages } from "@/lib/seo";

// Ảnh OG 1200×630 JPG crop từ hero mặc định của trang (WebP/PNG lớn không phải nền tảng chia sẻ nào cũng đọc).
const OG_IMAGE = "https://cdn.tdgamestudio.com/landing/og/2d-art.jpg";

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
    images: ogImages({ url: OG_IMAGE, width: 1200, height: 630 }),
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
