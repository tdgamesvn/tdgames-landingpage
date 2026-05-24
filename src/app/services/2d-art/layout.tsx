import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2D Art Services — TD Games Studio",
  description:
    "Professional 2D game art outsourcing: character design, concept art, UI/UX, and environment art. TD Games delivers pixel-perfect assets for mobile and PC games.",
  openGraph: {
    title: "2D Art Services — TD Games Studio",
    description: "High-quality 2D character design, concept art, and game UI from Vietnam's top art studio.",
    url: "https://tdgamestudio.com/services/2d-art",
    siteName: "TD Games",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
