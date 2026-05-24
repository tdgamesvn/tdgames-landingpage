import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio — TD Games Studio",
  description:
    "Browse TD Games' portfolio of 2D art, animation, and VFX projects for top game studios including Axie Infinity, Summoner Era, League of Legends fan works, and more.",
  openGraph: {
    title: "Portfolio — TD Games Studio",
    description:
      "Explore our award-winning 2D game art, character animation, and VFX case studies.",
    url: "https://tdgamestudio.com/portfolio",
    siteName: "TD Games",
    type: "website",
  },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
