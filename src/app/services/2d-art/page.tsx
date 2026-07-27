import ContactShowcaseSection from "@/components/contact-showcase-section";
import Service2DArtFaq from "@/components/service-2d-art-faq";
import Service2DArtFeaturedShowcase from "@/components/service-2d-art-featured-showcase";
import Service2DArtWorkflow from "@/components/service-2d-art-workflow";
import ServicePageTemplate from "@/components/service-page-template";
import SiteFooter from "@/components/site-footer";
import { resolveSlot } from "@/lib/page-slots";

export const revalidate = 60;

export default async function Service2DArtPage() {
  const heroImage = await resolveSlot(
    "services-2d-art",
    "hero",
    "https://cdn.tdgamestudio.com/landing/images/summoners.png",
  );
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
        titleTop: "2D GAME ART OUTSOURCING",
        titleMain: "SERVICES",
        subheading: "High-Quality 2D Visuals for Mobile Games",
        description:
          "TD Games is a 2D art studio with an exceptional reputation for talented 2D game artists and deep industry experience. We offer comprehensive 2D game art outsourcing services tailored for mobile projects of any scale from indie titles to mid-core games. From initial character concepts and immersive environments to high-impact splash illustrations and UI assets, our team delivers high-quality, production-ready artworks that satisfy game developers and studios around the world while fitting seamlessly into your pipeline.",
        ctaLabel: "Consult with our experts",
      }}
      capabilities={{
        eyebrow: "What we do",
        sectionMarker: { step: "01", label: "What we do" },
        titlePrefix: "OUR ",
        titleHighlight: "2D ART",
        titleSuffix: " SERVICES",
        items: [
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
        ],
      }}
    />
  );
}
