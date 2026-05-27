import ContactShowcaseSection from "@/components/contact-showcase-section";
import Service2DAnimationFaq from "@/components/service-2d-animation-faq";
import Service2DAnimationFeaturedShowcase from "@/components/service-2d-animation-featured-showcase";
import Service2DAnimationWorkflow from "@/components/service-2d-animation-workflow";
import ServicePageTemplate from "@/components/service-page-template";
import SiteFooter from "@/components/site-footer";
import { resolveSlot } from "@/lib/page-slots";

export const dynamic = "force-dynamic";

export default async function Service2DAnimationPage() {
  const heroImage = await resolveSlot(
    "services-2d-animation",
    "hero",
    "https://cdn.tdgamestudio.com/landing/images/Environment_Art-1024x683.jpg",
  );
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
        titleTop: "2D GAME",
        titleMain: "ANIMATION",
        subheading: "2D Animation outsource",
        description:
          "TD Games delivers production-ready 2D animation—from idle and locomotion to combat sets and UI motion—with timing, exports, and integration notes built for real shipping schedules.",
        ctaLabel: "Consult with our experts",
      }}
      capabilities={{
        eyebrow: "What we do",
        sectionMarker: { step: "01", label: "What we do" },
        titlePrefix: "OUR ",
        titleHighlight: "2D ANIMATION",
        titleSuffix: " SERVICES",
        items: [
          {
            title: "Spine gameplay sets",
            description:
              "Rig-driven loops and attacks tuned for engine constraints and revision speed.",
            image: "https://cdn.tdgamestudio.com/landing/images/7be77dae-b42e-44c0-b1be-397150c7ff3d.jpg",
          },
          {
            title: "Frame highlights",
            description:
              "Hand-drawn accents for promo beats and hero moments when the brief demands it.",
            image: "https://cdn.tdgamestudio.com/landing/images/minh-hong-minh-hong-thumbnail-2.jpg",
          },
          {
            title: "Combat actions",
            description:
              "Chains, cancels, and hit reactions authored for readable silhouettes.",
            image: "https://cdn.tdgamestudio.com/landing/images/ourproject.jpg",
          },
          {
            title: "Locomotion packages",
            description:
              "Walk, run, turn, and idle families that stay on-model across variants.",
            image: "https://cdn.tdgamestudio.com/landing/images/Casual_character-1024x683.jpg",
          },
          {
            title: "UI & presentation",
            description:
              "Lightweight motion for menus, rewards, and tutorial flourishes.",
            image: "https://cdn.tdgamestudio.com/landing/images/Screenshot 2026-05-07 233917.png",
          },
          {
            title: "Export & QA",
            description:
              "Atlases, naming, pivots, and checklists so engineering can integrate fast.",
            image: "https://cdn.tdgamestudio.com/landing/images/2f308aec-bd0c-42b9-9220-ca123338d9b9.png",
          },
        ],
      }}
    />
  );
}
