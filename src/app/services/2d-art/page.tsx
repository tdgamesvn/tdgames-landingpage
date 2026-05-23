import ContactShowcaseSection from "@/components/contact-showcase-section";
import Service2DArtFaq from "@/components/service-2d-art-faq";
import Service2DArtFeaturedShowcase from "@/components/service-2d-art-featured-showcase";
import Service2DArtWorkflow from "@/components/service-2d-art-workflow";
import ServicePageTemplate from "@/components/service-page-template";
import SiteFooter from "@/components/site-footer";

export default function Service2DArtPage() {
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
        image: "https://tdgamestudio.com/landing/images/summoners.png",
        titleTop: "2D GAME ART",
        titleMain: "PRODUCTION",
        subheading: "2D Art outsource",
        description:
          "TD Games specializes in professional 2D game art, turning ideas into visually striking creations. Our expertise spans stylized characters, environments, UI-support pieces, and illustration pipelines tuned for production schedules.",
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
            title: "Slot Art",
            description:
              "Slot-ready visual sets with readable symbols and style consistency.",
            image: "https://tdgamestudio.com/landing/images/Slot_Art-1024x683.jpg",
          },
          {
            title: "Casual Characters",
            description: "Stylized character sets for casual and social game worlds.",
            image: "https://tdgamestudio.com/landing/images/Casual_character-1024x683.jpg",
          },
          {
            title: "Character Concept",
            description:
              "Unique character design from concept exploration to final lineup.",
            image: "https://tdgamestudio.com/landing/images/Character_Concept-1024x683.jpg",
          },
          {
            title: "Environment Art",
            description: "Stunning painted environments and scenic world-building.",
            image: "https://tdgamestudio.com/landing/images/Environment_Art-1024x683.jpg",
          },
          {
            title: "Isometry Art",
            description: "Isometric assets and building sets for gameplay readability.",
            image: "https://tdgamestudio.com/landing/images/Isometry_art-1024x683.jpg",
          },
          {
            title: "Casual Art Props",
            description:
              "Prop packs and icon-ready objects tailored for casual game style.",
            image: "https://tdgamestudio.com/landing/images/Casual_Art_Props-1024x683.jpg",
          },
        ],
      }}
    />
  );
}
