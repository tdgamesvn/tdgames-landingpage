import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — TD Games Studio",
  description:
    "TD Games is a Vietnam-based 2D Art & Animation outsourcing studio. We specialize in character animation, VFX, and game art for mobile and PC games.",
  openGraph: {
    title: "About Us — TD Games Studio",
    description:
      "Learn about TD Games — a Vietnam-based studio delivering high-quality 2D art, animation, and VFX for game developers worldwide.",
    url: "https://www.tdgamestudio.com/about",
    siteName: "TD Games",
    type: "website",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
