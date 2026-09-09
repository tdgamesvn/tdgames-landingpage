import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Full Game Production Services — TD Games Studio",
  description:
    "End-to-end game production: game design, 2D art, animation, VFX, engineering and QA under one team. TD Games builds your game from pitch to store build.",
  openGraph: {
    title: "Full Game Production Services — TD Games Studio",
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
