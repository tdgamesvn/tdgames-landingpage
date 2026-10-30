import type { Metadata, Viewport } from "next";
import { Geist, Orbitron, Rajdhani, Barlow_Condensed, Nunito_Sans } from "next/font/google";
import "./globals.css";
import ClickSpark from "@/components/ClickSpark";
import GoogleAnalytics from "@/components/google-analytics";
import HashScrollOnNav from "@/components/hash-scroll-on-nav";
import { HeroRootStyles } from "@/components/hero-layout-state";
import JsonLd from "@/components/json-ld";
import { ORG_ID, ORG_LOGO, SITE_URL, WEBSITE_ID } from "@/lib/json-ld";
import { DEFAULT_OG_IMAGE, ogImages } from "@/lib/seo";

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
    images: ogImages(),
  },
  twitter: {
    card: "summary_large_image",
    title: "TD Games — 2D Art & Animation Studio",
    description: "Vietnam-based outsourcing studio for 2D Art, Animation, and VFX.",
    images: [DEFAULT_OG_IMAGE.url],
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

// Profile mạng xã hội THẬT đang được link trên site (trang /apply/[slug] — khối "Follow us").
// Thêm profile mới (YouTube…) thì thêm vào đây, đừng bịa link.
const SAME_AS = [
  "https://www.behance.net/tdgamesstudio",
  "https://www.artstation.com/td_games",
  "https://www.facebook.com/tdgamesstudio",
  "https://www.linkedin.com/company/td-games-company-limited",
];

// Structured data cho Google: tên công ty, logo, dịch vụ → hiện đẹp hơn trên kết quả tìm kiếm.
// Organization có @id — Service/BlogPosting/WebSite trỏ về ORG_ID thay vì lặp lại.
const ORGANIZATION_JSON_LD = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "TD Games",
  alternateName: "TD Games Studio",
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: ORG_LOGO },
  email: "tdgames.vn@gmail.com",
  sameAs: SAME_AS,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    email: "tdgames.vn@gmail.com",
    url: `${SITE_URL}/contact`,
    availableLanguage: ["English", "Vietnamese"],
  },
  description:
    "Vietnam-based outsourcing studio specializing in 2D Art, Animation, and VFX for mobile games.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Hoa Binh Green City, 505 Minh Khai",
    addressLocality: "Hanoi",
    postalCode: "100000",
    addressCountry: "VN",
  },
  // Nối website với hồ sơ Google Business "Công ty TNHH TD GAMES" (CID từ link embed).
  location: {
    "@type": "Place",
    name: "TD Games Studio",
    hasMap: "https://maps.google.com/?cid=16662951877678538407",
  },
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
    itemOffered: { "@type": "Service", name, url: `${SITE_URL}${path}` },
  })),
};

// Không có SearchAction: site không có trang tìm kiếm.
const WEBSITE_JSON_LD = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: "TD Games Studio",
  inLanguage: "en",
  publisher: { "@id": ORG_ID },
};

const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [ORGANIZATION_JSON_LD, WEBSITE_JSON_LD],
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
        <JsonLd data={SITE_JSON_LD} />
        <GoogleAnalytics />
        <HeroRootStyles />
        <HashScrollOnNav />
        <ClickSpark />
        {children}
      </body>
    </html>
  );
}
