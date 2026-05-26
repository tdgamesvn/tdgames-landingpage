import ContactShowcaseSection from "@/components/contact-showcase-section";
import Service2DVfxFaq from "@/components/service-2d-vfx-faq";
import Service2DVfxFeaturedShowcase from "@/components/service-2d-vfx-featured-showcase";
import Service2DVfxWorkflow from "@/components/service-2d-vfx-workflow";
import ServicePageTemplate from "@/components/service-page-template";
import SiteFooter from "@/components/site-footer";

export default function Service2DVfxPage() {
  return (
    <ServicePageTemplate
      eyebrow=""
      title="2D VFX"
      subtitle="Impactful effects that enhance action without overwhelming the scene."
      showDeliverRelated={false}
      appendSections={
        <>
          <Service2DVfxWorkflow />
          <Service2DVfxFeaturedShowcase />
          <Service2DVfxFaq />
          <ContactShowcaseSection sectionStep="05" />
          <SiteFooter />
        </>
      }
      hero={{
        image: "https://cdn.tdgamestudio.com/landing/images/f8e2e81a-e72c-431b-b4ec-5ab7af73ea12.png",
        titleTop: "2D GAME",
        titleMain: "VFX",
        subheading: "2D VFX outsource",
        description:
          "TD Games authors sprite and flipbook VFX with gameplay readability first—hits, skills, auras, and UI-safe flashes—packed and timed for production builds.",
        ctaLabel: "Consult with our experts",
      }}
      capabilities={{
        eyebrow: "What we do",
        sectionMarker: { step: "01", label: "What we do" },
        titlePrefix: "OUR ",
        titleHighlight: "2D VFX",
        titleSuffix: " SERVICES",
        items: [
          {
            title: "Combat impacts",
            description:
              "Hit flashes, slams, and combo punctuation with clear telegraphing.",
            image: "https://cdn.tdgamestudio.com/landing/images/bcc4707e-cae2-46a2-9c96-c254c28ba763.png",
          },
          {
            title: "Skill libraries",
            description:
              "Elemental variants and tiered intensity so designers can reuse content.",
            image: "https://cdn.tdgamestudio.com/landing/images/3067c837-e030-403f-b7c5-0c7246bfe15f.png",
          },
          {
            title: "Buffs & auras",
            description:
              "Looping overlays and support effects that stay readable at mobile scale.",
            image: "https://cdn.tdgamestudio.com/landing/images/95bff405-e638-4cec-9260-e5c9af46f49b.png",
          },
          {
            title: "Ambient world VFX",
            description:
              "Weather hints, glows, and environmental motion that sell mood.",
            image: "https://cdn.tdgamestudio.com/landing/images/Environment_Art-1024x683.jpg",
          },
          {
            title: "UI feedback",
            description:
              "Reward bursts, level-up sparks, and HUD-safe treatments.",
            image: "https://cdn.tdgamestudio.com/landing/images/f8e2e81a-e72c-431b-b4ec-5ab7af73ea12.png",
          },
          {
            title: "Atlas delivery",
            description:
              "Packed sheets, pivots, and integration notes for your shaders and tools.",
            image: "https://cdn.tdgamestudio.com/landing/images/21f8a0a6-048f-4a5c-9946-3a89f6303fcd.png",
          },
        ],
      }}
    />
  );
}
