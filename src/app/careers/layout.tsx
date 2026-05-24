import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers — TD Games Studio",
  description:
    "Join TD Games! We're hiring talented 2D artists, animators, and VFX artists in Hanoi, Vietnam. Help us create stunning game visuals.",
  openGraph: {
    title: "Careers at TD Games Studio",
    description:
      "We're looking for passionate 2D artists and animators. Join our team in Hanoi, Vietnam.",
    url: "https://tdgamestudio.com/careers",
    siteName: "TD Games",
    type: "website",
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
