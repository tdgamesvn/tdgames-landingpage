import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — TD Games Studio",
  description:
    "Get in touch with TD Games for 2D art, animation, and VFX outsourcing. Based in Hanoi, Vietnam — serving game studios worldwide.",
  openGraph: {
    title: "Contact TD Games Studio",
    description:
      "Ready to start your project? Contact our team for 2D game art and animation outsourcing.",
    url: "https://tdgamestudio.com/contact",
    siteName: "TD Games",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
