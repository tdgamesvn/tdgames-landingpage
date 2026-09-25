import type { Metadata } from "next";

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
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
