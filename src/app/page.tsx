import type { Metadata } from "next";

import HomeHero from "@/components/home-hero";
import HomePageLower from "@/components/home-page-lower-client";
import HomeProjectsSection from "@/components/home-projects-section";
import HomeServicesSection from "@/components/home-services-section";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import type { MediaItem } from "@/components/hero-layout-state";
import { resolveSlots } from "@/lib/page-slots";
import { projectCovers } from "@/lib/project-covers";
import siteContent from "@/content/site.json";

// Hero media đọc từ DB mỗi request → không cache stale sau khi sếp sửa /admin.
export const dynamic = "force-dynamic";

// Canonical đặt ở từng page, KHÔNG đặt ở root layout (trang con sẽ kế thừa → trỏ hết về "/").
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const [slots, coverBySlug] = await Promise.all([
    resolveSlots("home", "hero-carousel"),
    // Ảnh bìa thẻ "Our Projects" theo DB (thiếu/lỗi → ảnh site.json).
    projectCovers(siteContent.home.featuredProjects.map((p) => p.slug)),
  ]);
  const heroMedia: MediaItem[] = slots.map((item) => ({
    id: String(item.id),
    name: item.display_name ?? "",
    label: item.display_label ?? "",
    thumbnail: item.thumb_url ?? item.url,
    path: item.url,
    isBgVideo: true,
    isIframe: false,
  }));

  return (
    <>
      <SiteHeader />
      <main className="scroll-smooth">
        <HomeHero initialMedia={heroMedia} />
        <HomeServicesSection />
        <HomeProjectsSection coverBySlug={coverBySlug} />
        <HomePageLower />
        <SiteFooter />
      </main>
    </>
  );
}
