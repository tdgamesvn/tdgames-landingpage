import ContactShowcaseSection from "@/components/contact-showcase-section";
import Service2DVfxFaq from "@/components/service-2d-vfx-faq";
import Service2DVfxFeaturedShowcase from "@/components/service-2d-vfx-featured-showcase";
import Service2DVfxWorkflow from "@/components/service-2d-vfx-workflow";
import ServicePageTemplate from "@/components/service-page-template";
import SiteFooter from "@/components/site-footer";
import { resolveSlot } from "@/lib/page-slots";

export const revalidate = 60;

export default async function Service2DVfxPage() {
  const heroImage = await resolveSlot(
    "services-2d-vfx",
    "hero",
    "https://cdn.tdgamestudio.com/landing/images/f8e2e81a-e72c-431b-b4ec-5ab7af73ea12.png",
  );
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
        image: heroImage,
        titleTop: "2D GAME VFX",
        titleMain: "SERVICES",
        subheading: "2D VFX outsourcing that elevates your game feel",
        description:
          "Dynamic skill effects, explosive particles, and UI flourishes built for mobile and mid-core games. Delivered as Spine-integrated or standalone sprite sheets — optimized for smooth frame rates.",
        ctaLabel: "Get a quote",
      }}
      capabilities={{
        eyebrow: "What we do",
        sectionMarker: { step: "01", label: "What we do" },
        titlePrefix: "OUR ",
        titleHighlight: "2D VFX",
        titleSuffix: " SERVICES",
        items: [
          {
            title: "Combat VFX",
            description:
              "Hit flashes, slams, and combo punctuation with clear telegraphing.",
            image: "https://cdn.tdgamestudio.com/landing/images/bcc4707e-cae2-46a2-9c96-c254c28ba763.png",
          },
          {
            title: "Character VFX",
            description:
              "Skill and elemental effects built around each character's kit and silhouette.",
            image: "https://cdn.tdgamestudio.com/landing/images/3067c837-e030-403f-b7c5-0c7246bfe15f.png",
          },
          {
            title: "Environment VFX",
            description:
              "Weather hints, glows, and environmental motion that sell mood.",
            image: "https://cdn.tdgamestudio.com/landing/images/Environment_Art-1024x683.jpg",
          },
          {
            title: "UI & Feedback VFX",
            description:
              "Reward bursts, level-up sparks, and HUD-safe treatments.",
            image: "https://cdn.tdgamestudio.com/landing/images/f8e2e81a-e72c-431b-b4ec-5ab7af73ea12.png",
          },
          {
            title: "Cinematic VFX",
            description:
              "Atmospheric overlays and mood-driven effects for cutscenes and key moments.",
            image: "https://cdn.tdgamestudio.com/landing/images/95bff405-e638-4cec-9260-e5c9af46f49b.png",
          },
          {
            title: "Unity & Spine Integration",
            description:
              "Packed sheets, pivots, and integration notes for your shaders and tools.",
            image: "https://cdn.tdgamestudio.com/landing/images/21f8a0a6-048f-4a5c-9946-3a89f6303fcd.png",
          },
        ],
      }}
    />
  );
}
