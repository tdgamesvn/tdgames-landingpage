import ContactShowcaseSection from "@/components/contact-showcase-section";
import Service2DAnimationFaq from "@/components/service-2d-animation-faq";
import Service2DAnimationFeaturedShowcase from "@/components/service-2d-animation-featured-showcase";
import Service2DAnimationWorkflow from "@/components/service-2d-animation-workflow";
import ServicePageTemplate from "@/components/service-page-template";
import SiteFooter from "@/components/site-footer";
import { resolveSlot, resolveServiceCards } from "@/lib/page-slots";
import type { ServiceCapabilityItem } from "@/components/service-capabilities-grid";

export const revalidate = 60;

/** Card mặc định — dùng khi slot `service-card` của trang này chưa có row nào trong DB. */
const DEFAULT_CARDS: ServiceCapabilityItem[] = [
  {
    title: "Spine Animation",
    description:
      "Rig-driven loops and attacks tuned for engine constraints and revision speed.",
    image: "https://cdn.tdgamestudio.com/landing/images/7be77dae-b42e-44c0-b1be-397150c7ff3d.jpg",
  },
  {
    title: "Frame-by-Frame Animation",
    description:
      "Hand-drawn accents for promo beats and hero moments when the brief demands it.",
    image: "https://cdn.tdgamestudio.com/landing/images/minh-hong-minh-hong-thumbnail-2.jpg",
  },
  {
    title: "UI Animation",
    description:
      "Lightweight motion for menus, rewards, and tutorial flourishes.",
    image: "https://cdn.tdgamestudio.com/landing/images/Screenshot 2026-05-07 233917.png",
  },
  {
    title: "Cutscenes",
    description:
      "Cinematic sequences and story beats timed for maximum impact.",
    image: "https://cdn.tdgamestudio.com/landing/images/ourproject.jpg",
  },
  {
    title: "Creature Animation",
    description:
      "Non-humanoid rigs and locomotion that stay on-model across variants.",
    image: "https://cdn.tdgamestudio.com/landing/images/Casual_character-1024x683.jpg",
  },
  {
    title: "Character Animation",
    description:
      "Combat, idle, and expression sets authored for readable silhouettes.",
    image: "https://cdn.tdgamestudio.com/landing/images/2f308aec-bd0c-42b9-9220-ca123338d9b9.png",
  },
];


export default async function Service2DAnimationPage() {
  const heroImage = await resolveSlot(
    "services-2d-animation",
    "hero",
    "https://cdn.tdgamestudio.com/landing/images/Environment_Art-1024x683.jpg",
  );
  const cards = await resolveServiceCards("services-2d-animation", DEFAULT_CARDS);
  return (
    <ServicePageTemplate
      eyebrow=""
      title="2D Animation"
      subtitle="Smooth, expressive motion tuned for gameplay clarity and efficient production."
      showDeliverRelated={false}
      appendSections={
        <>
          <Service2DAnimationWorkflow />
          <Service2DAnimationFeaturedShowcase />
          <Service2DAnimationFaq />
          <ContactShowcaseSection sectionStep="05" />
          <SiteFooter />
        </>
      }
      hero={{
        image: heroImage,
        titleTop: "2D GAME ANIMATION",
        titleMain: "SERVICES",
        subheading: "Engine-ready motion for characters & cutscenes",
        description:
          "Spine 2D skeletal and frame-by-frame animation, from combat sets to cinematic login screens. Full technical handoff: atlases, pivot notes, integration checklist.",
        ctaLabel: "Get a quote",
      }}
      capabilities={{
        eyebrow: "What we do",
        sectionMarker: { step: "01", label: "What we do" },
        titlePrefix: "OUR ",
        titleHighlight: "2D ANIMATION",
        titleSuffix: " SERVICES",
        items: cards,
      }}
    />
  );
}
