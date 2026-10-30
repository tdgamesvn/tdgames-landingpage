import type { Metadata } from "next";

import { ogImages } from "@/lib/seo";

// Metadata chung cho blog. /blog tự override canonical theo ?page/?tag; /blog/[slug] override bằng generateMetadata.
export const metadata: Metadata = {
  title: "Blog — 2D Game Art, Animation & VFX Insights",
  description:
    "Articles from TD Games on 2D game art pipelines, game animation, VFX and outsourcing game art — lessons from real production work.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "TD Games Blog — 2D Game Art, Animation & VFX Insights",
    description:
      "Articles on 2D game art pipelines, game animation, VFX and outsourcing game art from TD Games.",
    url: "https://tdgamestudio.com/blog",
    siteName: "TD Games",
    type: "website",
    images: ogImages(),
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
