import ServiceFeaturedShowcaseSection from "@/components/service-featured-showcase-section";
import type { StudioServiceCard } from "@/components/studio-service-cards";
import { resolveFeaturedCards } from "@/lib/page-slots";

// ponytail: statValue/statLabel are placeholder numbers, sếp sẽ thay bằng số liệu thật sau.
const cards: StudioServiceCard[] = [
  {
    title: "Combat VFX",
    icon: "vfx",
    href: "/portfolio",
    statValue: "70+",
    statLabel: "VFX effects created",
    description:
      "Punchy hit frames, elemental pops, and combo accents authored for atlas efficiency.",
    image: "https://cdn.tdgamestudio.com/landing/images/summoners.png",
  },
  {
    title: "Environment VFX",
    icon: "vfx",
    href: "/portfolio",
    statValue: "40+",
    statLabel: "Ambient VFX sets",
    description:
      "Auras, trails, and environmental shimmer that reinforce mood without stealing focus.",
    image: "https://cdn.tdgamestudio.com/landing/images/Isometry_art-1024x683.jpg",
  },
  {
    title: "UI & Feedback VFX",
    icon: "vfx",
    href: "/portfolio",
    statValue: "50+",
    statLabel: "UI VFX delivered",
    description:
      "Screen-safe glows, level-up sparks, and reward VFX aligned to your HUD contrast rules.",
    image: "https://cdn.tdgamestudio.com/landing/images/trieuvan.png",
  },
];

export default async function Service2DVfxFeaturedShowcase() {
  const resolved = await resolveFeaturedCards("services-2d-vfx", cards);
  return (
    <ServiceFeaturedShowcaseSection
      id="featured-2d-vfx"
      sectionStep="// 03"
      railLabel="Showcase"
      titleAccent="2D VFX"
      description="Discover production-ready visual effects built for mobile games, including combat skills, environmental effects and polished UI feedback."
      cards={resolved}
    />
  );
}
