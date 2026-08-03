import HomeHero from "@/components/home-hero";
import HomePageLower from "@/components/home-page-lower-client";
import HomeProjectsSection from "@/components/home-projects-section";
import HomeServicesSection from "@/components/home-services-section";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import type { MediaItem } from "@/components/hero-layout-state";
import { resolveSlots } from "@/lib/page-slots";

// Hero media đọc từ DB mỗi request → không cache stale sau khi sếp sửa /admin.
export const dynamic = "force-dynamic";

export default async function Home() {
  const slots = await resolveSlots("home", "hero-carousel");
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
        <HomeProjectsSection />
        <HomePageLower />
        <SiteFooter />
      </main>
    </>
  );
}
