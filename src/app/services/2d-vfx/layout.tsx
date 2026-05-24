import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2D VFX Services — TD Games Studio",
  description:
    "Stunning 2D VFX for games: skill effects, particle systems, impact animations, and magic spells. TD Games creates visual effects that make your game stand out.",
  openGraph: {
    title: "2D VFX Services — TD Games Studio",
    description: "Eye-catching 2D game visual effects and particle systems from TD Games.",
    url: "https://tdgamestudio.com/services/2d-vfx",
    siteName: "TD Games",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
