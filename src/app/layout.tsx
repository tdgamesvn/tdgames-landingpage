import type { Metadata, Viewport } from "next";
import { Geist, Orbitron, Rajdhani, Barlow_Condensed, Nunito_Sans } from "next/font/google";
import "./globals.css";
import ClickSpark from "@/components/ClickSpark";
import GoogleAnalytics from "@/components/google-analytics";
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
  title: {
    default: "TD Games — 2D Art & Animation Studio",
    template: "%s | TD Games",
  },
  description:
    "TD Games is a Vietnam-based outsourcing studio specializing in 2D Art, Animation, and VFX for mobile games.",
  metadataBase: new URL("https://tdgamestudio.com"),
  openGraph: {
    title: "TD Games — 2D Art & Animation Studio",
    description:
      "Vietnam-based outsourcing studio specializing in 2D Art, Animation, and VFX for mobile games.",
    url: "https://tdgamestudio.com",
    siteName: "TD Games",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TD Games — 2D Art & Animation Studio",
    description: "Vietnam-based outsourcing studio for 2D Art, Animation, and VFX.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  // Search Console: set GOOGLE_SITE_VERIFICATION (chuỗi content của thẻ meta) nếu xác minh bằng HTML tag.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  icons: {
    icon: "https://cdn.tdgamestudio.com/landing/logoCompany/logo_td_notext.png",
    shortcut: "https://cdn.tdgamestudio.com/landing/logoCompany/logo_td_notext.png",
    apple: "https://cdn.tdgamestudio.com/landing/logoCompany/logo_td_notext.png",
  },
};

// Structured data cho Google: tên công ty, logo, dịch vụ → hiện đẹp hơn trên kết quả tìm kiếm.
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TD Games",
  alternateName: "TD Games Studio",
  url: "https://tdgamestudio.com",
  logo: "https://cdn.tdgamestudio.com/landing/logoCompany/logo_td_notext.png",
  email: "tdgames.vn@gmail.com",
  description:
    "Vietnam-based outsourcing studio specializing in 2D Art, Animation, and VFX for mobile games.",
  address: { "@type": "PostalAddress", addressCountry: "VN" },
  areaServed: "Worldwide",
  knowsAbout: [
    "Game art outsourcing",
    "2D game art",
    "2D game animation",
    "Spine 2D animation",
    "Game VFX",
    "Full game production",
  ],
  makesOffer: [
    ["2D Art", "/services/2d-art"],
    ["2D Animation", "/services/2d-animation"],
    ["2D VFX", "/services/2d-vfx"],
    ["Full Game Production", "/services/full-game-production"],
  ].map(([name, path]) => ({
    "@type": "Offer",
    itemOffered: { "@type": "Service", name, url: `https://tdgamestudio.com${path}` },
  })),
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <GoogleAnalytics />
        <HeroRootStyles />
        <HashScrollOnNav />
        <ClickSpark />
        {children}
      </body>
    </html>
  );
}
