import ServiceFeaturedShowcaseSection from "@/components/service-featured-showcase-section";
import type { StudioServiceCard } from "@/components/studio-service-cards";

const cards: StudioServiceCard[] = [
  {
    title: "Combat & ability sets",
    icon: "animation",
    href: "/portfolio",
    statValue: "50+",
    statLabel: "Completed projects",
    description:
      "Attack chains, cancels, and hit reactions timed for gameplay feedback and marketing trailers.",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/ourproject.jpg",
  },
  {
    title: "Locomotion & idles",
    icon: "animation",
    href: "/portfolio",
    statValue: "50+",
    statLabel: "Completed projects",
    description:
      "Walk, run, and idle loops tuned for Spine rigs and consistent silhouette at target zoom.",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/Casual_character-1024x683.jpg",
  },
  {
    title: "UI & presentation motion",
    icon: "animation",
    href: "/portfolio",
    statValue: "50+",
    statLabel: "Completed projects",
    description:
      "Menu flourishes, reward reveals, and lightweight motion that supports UX without noise.",
    image: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/Screenshot 2026-05-07 233917.png",
  },
];

export default function Service2DAnimationFeaturedShowcase() {
  return (
    <ServiceFeaturedShowcaseSection
      id="featured-2d-animation"
      sectionStep="// 03"
      railLabel="Showcase"
      titleAccent="2D ANIMATION"
      description="Highlights from recent animation deliveriesâ€”loops, combat, and UI-adjacent motionâ€”using on-repo imagery as stand-ins while your production art is in flight."
      cards={cards}
    />
  );
}
