import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2D Animation Services — TD Games Studio",
  description:
    "Expert 2D game animation outsourcing: character animation, cutscenes, login screen animations, and idle animations. Trusted by top game studios.",
  openGraph: {
    title: "2D Animation Services — TD Games Studio",
    description: "Fluid, expressive 2D game animation from Vietnam's leading animation studio.",
    url: "https://tdgamestudio.com/services/2d-animation",
    siteName: "TD Games",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
