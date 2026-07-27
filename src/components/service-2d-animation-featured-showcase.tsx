import ServiceFeaturedShowcaseSection from "@/components/service-featured-showcase-section";
import type { StudioServiceCard } from "@/components/studio-service-cards";

// ponytail: statValue/statLabel are placeholder numbers, sếp sẽ thay bằng số liệu thật sau.
const cards: StudioServiceCard[] = [
  {
    title: "Combat Animation",
    icon: "animation",
    href: "/portfolio",
    statValue: "60+",
    statLabel: "Combat animations",
    description:
      "Attack chains, cancels, and hit reactions timed for gameplay feedback and marketing trailers.",
    image: "https://cdn.tdgamestudio.com/landing/images/ourproject.jpg",
  },
  {
    title: "Character Animation",
    icon: "animation",
    href: "/portfolio",
    statValue: "90+",
    statLabel: "Animation sets",
    description:
      "Walk, run, and idle loops tuned for Spine rigs and consistent silhouette at target zoom.",
    image: "https://cdn.tdgamestudio.com/landing/images/Casual_character-1024x683.jpg",
  },
  {
    title: "UI & Motion Graphics",
    icon: "animation",
    href: "/portfolio",
    statValue: "35+",
    statLabel: "Motion graphics delivered",
    description:
      "Menu flourishes, reward reveals, and lightweight motion that supports UX without noise.",
    image: "https://cdn.tdgamestudio.com/landing/images/Screenshot 2026-05-07 233917.png",
  },
];

export default function Service2DAnimationFeaturedShowcase() {
  return (
    <ServiceFeaturedShowcaseSection
      id="featured-2d-animation"
      sectionStep="// 03"
      railLabel="Showcase"
      titleAccent="2D ANIMATION"
      description="Browse recent animation work featuring gameplay motion, character actions, combat sequences and polished UI animation."
      cards={cards}
    />
  );
}
