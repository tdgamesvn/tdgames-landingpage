import ServiceFeaturedShowcaseSection from "@/components/service-featured-showcase-section";
import type { StudioServiceCard } from "@/components/studio-service-cards";

const cards: StudioServiceCard[] = [
  {
    title: "Skill bursts & impacts",
    icon: "vfx",
    href: "/portfolio",
    statValue: "50+",
    statLabel: "Completed projects",
    description:
      "Punchy hit frames, elemental pops, and combo accents authored for atlas efficiency.",
    image: "https://cdn.tdgamestudio.com/landing/images/summoners.png",
  },
  {
    title: "Buffs & ambient layers",
    icon: "vfx",
    href: "/portfolio",
    statValue: "50+",
    statLabel: "Completed projects",
    description:
      "Auras, trails, and environmental shimmer that reinforce mood without stealing focus.",
    image: "https://cdn.tdgamestudio.com/landing/images/Isometry_art-1024x683.jpg",
  },
  {
    title: "UI & feedback flashes",
    icon: "vfx",
    href: "/portfolio",
    statValue: "50+",
    statLabel: "Completed projects",
    description:
      "Screen-safe glows, level-up sparks, and reward VFX aligned to your HUD contrast rules.",
    image: "https://cdn.tdgamestudio.com/landing/images/trieuvan.png",
  },
];

export default function Service2DVfxFeaturedShowcase() {
  return (
    <ServiceFeaturedShowcaseSection
      id="featured-2d-vfx"
      sectionStep="// 03"
      railLabel="Showcase"
      titleAccent="2D VFX"
      description="Sample frames and library-style cards for VFX workâ€”using placeholder art from the repo to mirror the 2D Art page layout."
      cards={cards}
    />
  );
}
