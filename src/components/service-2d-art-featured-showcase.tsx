import ServiceFeaturedShowcaseSection from "@/components/service-featured-showcase-section";
import type { StudioServiceCard } from "@/components/studio-service-cards";

// ponytail: statValue/statLabel are placeholder numbers, sếp sẽ thay bằng số liệu thật sau.
const featured2DArtShowcaseCards: StudioServiceCard[] = [
  {
    title: "Characters & Creatures",
    icon: "art",
    href: "/portfolio",
    statValue: "80+",
    statLabel: "Characters delivered",
    description:
      "Hero and NPC explorations, lineup sheets, and splash-ready poses with a clear stylized read.",
    image: "https://cdn.tdgamestudio.com/landing/images/Character_Concept-1024x683.jpg",
  },
  {
    title: "Environments & Worlds",
    icon: "art",
    href: "/portfolio",
    statValue: "45+",
    statLabel: "Environments delivered",
    description:
      "Key art, mood-led backgrounds, and readable set dressing built for world-building and marketing beats.",
    image: "https://cdn.tdgamestudio.com/landing/images/Environment_Art-1024x683.jpg",
  },
  {
    title: "UI, Props & Icons",
    icon: "art",
    href: "/portfolio",
    statValue: "200+",
    statLabel: "Assets delivered",
    description:
      "Objects, symbols, and HUD-friendly assets that stay on-model with your game’s 2D visual language.",
    image: "https://cdn.tdgamestudio.com/landing/images/Casual_Art_Props-1024x683.jpg",
  },
];

export default function Service2DArtFeaturedShowcase() {
  return (
    <ServiceFeaturedShowcaseSection
      id="featured-2d-art"
      sectionStep="// 03"
      railLabel="Showcase"
      titleAccent="2D ART"
      description="Explore a selection of production-ready 2D artwork created for mobile games, including characters, environments, UI assets and props."
      cards={featured2DArtShowcaseCards}
    />
  );
}
