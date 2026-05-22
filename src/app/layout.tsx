import type { Metadata, Viewport } from "next";
import { Geist, Orbitron, Rajdhani, Barlow_Condensed, Nunito_Sans } from "next/font/google";
import "./globals.css";
import ClickSpark from "@/components/ClickSpark";
import HashScrollOnNav from "@/components/hash-scroll-on-nav";
import { HeroRootStyles } from "@/components/hero-layout-state";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TD Games — 2D Art & Animation Studio",
  description:
    "TD Games is a Vietnam-based outsourcing studio specializing in 2D Art, Animation, and VFX for mobile games.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${rajdhani.variable} ${orbitron.variable} ${barlowCondensed.variable} ${nunitoSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-white">
        <HeroRootStyles />
        <HashScrollOnNav />
        <ClickSpark />
        {children}
      </body>
    </html>
  );
}
