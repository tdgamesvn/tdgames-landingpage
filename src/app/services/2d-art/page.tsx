import ContactShowcaseSection from "@/components/contact-showcase-section";
import Service2DArtFaq from "@/components/service-2d-art-faq";
import Service2DArtFeaturedShowcase from "@/components/service-2d-art-featured-showcase";
import Service2DArtWorkflow from "@/components/service-2d-art-workflow";
import ServicePageTemplate from "@/components/service-page-template";
import SiteFooter from "@/components/site-footer";
import { resolveSlot, resolveServiceCards } from "@/lib/page-slots";
import type { ServiceCapabilityItem } from "@/components/service-capabilities-grid";

export const revalidate = 60;

/** Card mặc định — dùng khi slot `service-card` của trang này chưa có row nào trong DB. */
const DEFAULT_CARDS: ServiceCapabilityItem[] = [
  {
    title: "Character Concept",
    description:
      "Unique character design from concept exploration to final lineup.",
    image: "https://cdn.tdgamestudio.com/landing/images/Character_Concept-1024x683.jpg",
  },
  {
    title: "Environment Art",
    description: "Stunning painted environments and scenic world-building.",
    image: "https://cdn.tdgamestudio.com/landing/images/Environment_Art-1024x683.jpg",
  },
  {
    title: "UI/UX Design",
    description: "Game-ready HUD, menu, and interface art built for clarity and flow.",
    image: "https://cdn.tdgamestudio.com/landing/images/Slot_Art-1024x683.jpg",
  },
  {
    title: "Illustration",
    description: "High-impact splash art and key visuals for marketing and story beats.",
    image: "https://cdn.tdgamestudio.com/landing/images/Casual_character-1024x683.jpg",
  },
  {
    title: "Casual Game Art",
    description: "Stylized visual sets tuned for casual and social game worlds.",
    image: "https://cdn.tdgamestudio.com/landing/images/Isometry_art-1024x683.jpg",
  },
  {
    title: "Props & Items",
    description:
      "Prop packs and icon-ready objects tailored for any game style.",
    image: "https://cdn.tdgamestudio.com/landing/images/Casual_Art_Props-1024x683.jpg",
  },
];


export default async function Service2DArtPage() {
  const heroImage = await resolveSlot(
    "services-2d-art",
    "hero",
    "https://cdn.tdgamestudio.com/landing/images/summoners.png",
  );
  const cards = await resolveServiceCards("services-2d-art", DEFAULT_CARDS);
  return (
    <ServicePageTemplate
      eyebrow=""
      title="2D Art"
      subtitle="Stylized visuals built for readability, consistency, and game-ready production."
      showDeliverRelated={false}
      appendSections={
        <>
          <Service2DArtWorkflow />
          <Service2DArtFeaturedShowcase />
          <Service2DArtFaq />
          <ContactShowcaseSection sectionStep="05" />
          <SiteFooter />
        </>
      }
      hero={{
        image: heroImage,
        titleTop: "2D GAME ART",
        titleMain: "SERVICES",
        subheading: "2D art outsourcing for mobile games",
        description:
          "From character concepts and environments to splash illustrations and UI assets — production-ready artwork that fits straight into your pipeline. Indie to mid-core, any scale.",
        ctaLabel: "Get a quote",
      }}
      capabilities={{
        eyebrow: "What we do",
        sectionMarker: { step: "01", label: "What we do" },
        titlePrefix: "OUR ",
        titleHighlight: "2D ART",
        titleSuffix: " SERVICES",
        items: cards,
      }}
    />
  );
}
