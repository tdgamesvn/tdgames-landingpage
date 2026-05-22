import ServiceFeaturedShowcaseSection from "@/components/service-featured-showcase-section";
import type { StudioServiceCard } from "@/components/studio-service-cards";

const featured2DArtShowcaseCards: StudioServiceCard[] = [
  {
    title: "Characters & concepts",
    icon: "art",
    href: "/portfolio",
    statValue: "50+",
    statLabel: "Completed projects",
    description:
      "Hero and NPC explorations, lineup sheets, and splash-ready poses with a clear stylized read.",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/Character_Concept-1024x683.jpg",
  },
  {
    title: "Environments & scenes",
    icon: "art",
    href: "/portfolio",
    statValue: "50+",
    statLabel: "Completed projects",
    description:
      "Key art, mood-led backgrounds, and readable set dressing built for world-building and marketing beats.",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/Environment_Art-1024x683.jpg",
  },
  {
    title: "Props, UI & icon packs",
    icon: "art",
    href: "/portfolio",
    statValue: "50+",
    statLabel: "Completed projects",
    description:
      "Objects, symbols, and HUD-friendly assets that stay on-model with your gameâ€™s 2D visual language.",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/Casual_Art_Props-1024x683.jpg",
  },
];

export default function Service2DArtFeaturedShowcase() {
  return (
    <ServiceFeaturedShowcaseSection
      id="featured-2d-art"
      sectionStep="// 03"
      railLabel="Showcase"
      titleAccent="2D ART"
      description="A focused look at recent 2D art deliveriesâ€”characters, worlds, and production-ready asset packsâ€”presented in the same confident TD Games palette with a relaxed, portfolio-style layout."
      cards={featured2DArtShowcaseCards}
    />
  );
}
