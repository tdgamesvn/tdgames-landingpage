import type { Metadata } from "next";

import { ogImages } from "@/lib/seo";

// OG 1200×630 cắt từ cảnh Gwen "Desperation" (Yomi 2) — cùng cảnh mở đầu hero.
const OG_IMAGE = "https://cdn.tdgamestudio.com/landing/og/spine-animation-v1.jpg";

const TITLE = "Spine Animation Services for Games";
const DESCRIPTION =
  "Spine 2D animation outsourcing for RPG, gacha and fighting games: heroes, monsters, bosses and super moves, delivered as Spine project files and exports your engine can load.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/services/spine-animation" },
  openGraph: {
    title: `${TITLE} | TD Games`,
    description: DESCRIPTION,
    url: "https://tdgamestudio.com/services/spine-animation",
    siteName: "TD Games",
    type: "website",
    images: ogImages({ url: OG_IMAGE, width: 1200, height: 630 }),
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
