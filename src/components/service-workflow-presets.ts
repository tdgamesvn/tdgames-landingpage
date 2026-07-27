import type { ServiceWorkflowConfig } from "@/components/service-workflow-types";

export const service2DArtWorkflowConfig: ServiceWorkflowConfig = {
  markerStep: "// 02",
  processLabel: "Our process",
  titleWhite: "2D",
  titleAccent: "workflow",
  stepsSubtitle: "7 steps to exceptional game art",
  description:
    "A streamlined 7-step process to transform your ideas into stunning 2D game art with precision, creativity, and consistent quality.",
  stripTitle: "Our 2D game art workflow",
  defaultStepIndex: 3,
  steps: [
    {
      title: "Discovery & art brief",
      description: "Align on visual direction, style, and mood for your game.",
      image: "https://cdn.tdgamestudio.com/landing/images/Character_Concept-1024x683.jpg",
    },
    {
      title: "Concept exploration",
      description: "Explore ideas with quick sketches and compositions.",
      image: "https://cdn.tdgamestudio.com/landing/images/Casual_character-1024x683.jpg",
    },
    {
      title: "Design approval",
      description: "Refine the chosen direction with clean lines and details.",
      image: "https://cdn.tdgamestudio.com/landing/images/Isometry_art-1024x683.jpg",
    },
    {
      title: "Final rendering",
      description: "Apply colors, lighting, and atmosphere to the approved design.",
      image: "https://cdn.tdgamestudio.com/landing/images/Environment_Art-1024x683.jpg",
    },
    {
      title: "Polish & QA",
      description: "Enhance details, lighting, and overall quality.",
      image: "https://cdn.tdgamestudio.com/landing/images/Slot_Art-1024x683.jpg",
    },
    {
      title: "Production export",
      description: "Prepare assets for implementation and export.",
      image: "https://cdn.tdgamestudio.com/landing/images/Casual_Art_Props-1024x683.jpg",
    },
    {
      title: "Delivery & integration",
      description: "Deliver final assets ready for production.",
      image: "https://cdn.tdgamestudio.com/landing/images/summoners.png",
    },
  ],
  pillars: [
    {
      title: "Production ready",
      body: "Unique, high-quality art tailored to your game's vision.",
      icon: "palette",
    },
    {
      title: "Consistent quality",
      body: "A clear workflow that ensures consistency and timely delivery.",
      icon: "bolt",
    },
    {
      title: "Scalable team",
      body: "Dedicated to delivering art that elevates your game.",
      icon: "shield",
    },
  ],
};

export const service2DAnimationWorkflowConfig: ServiceWorkflowConfig = {
  markerStep: "// 02",
  processLabel: "Our process",
  titleWhite: "2D",
  titleAccent: "animation",
  stepsSubtitle: "7 steps from brief to shipped motion",
  description:
    "A production-minded pipeline for rigs, timing, and export—so gameplay motion stays readable and your team can integrate fast.",
  stripTitle: "Our 2D animation workflow",
  defaultStepIndex: 2,
  steps: [
    {
      title: "Animation brief",
      description: "Lock style, timing targets, and technical constraints.",
      image: "https://cdn.tdgamestudio.com/landing/images/minh-hong-minh-hong-thumbnail-2.jpg",
    },
    {
      title: "Blocking & posing",
      description: "Rough motion passes to nail silhouette and beats.",
      image: "https://cdn.tdgamestudio.com/landing/images/7be77dae-b42e-44c0-b1be-397150c7ff3d.jpg",
    },
    {
      title: "Timing & motion",
      description: "Refine anticipation, follow-through, and impact frames.",
      image: "https://cdn.tdgamestudio.com/landing/images/origins-thumbnail.png",
    },
    {
      title: "Polish & secondary motion",
      description: "Hair, cloth, and accents that sell weight and energy.",
      image: "https://cdn.tdgamestudio.com/landing/images/9985f5f1-9ed5-4f08-9143-7d86a9765272.png",
    },
    {
      title: "Client review",
      description: "Walk through the animation set together before final export.",
      image: "https://cdn.tdgamestudio.com/landing/images/2f308aec-bd0c-42b9-9220-ca123338d9b9.png",
    },
    {
      title: "Export & integration",
      description: "Spine/atlas checks, naming, and integration notes.",
      image: "https://cdn.tdgamestudio.com/landing/images/a0a5dab6-1e06-4a1b-af95-af0b51fc27e6.png",
    },
    {
      title: "Final delivery",
      description: "Final packages ready for build and marketing cuts.",
      image: "https://cdn.tdgamestudio.com/landing/images/f0d05f71-5089-4b3f-b453-7a8d19afc013.png",
    },
  ],
  pillars: [
    {
      title: "Gameplay readability",
      body: "Animation tuned for clarity at real resolution and frame budgets.",
      icon: "bolt",
    },
    {
      title: "Engine-ready delivery",
      body: "Exports, naming, and notes that slot into your tools and milestones.",
      icon: "palette",
    },
    {
      title: "Production pipeline",
      body: "Review gates so every loop and attack reads as one cohesive set.",
      icon: "shield",
    },
  ],
};

export const service2DVfxWorkflowConfig: ServiceWorkflowConfig = {
  markerStep: "// 02",
  processLabel: "Our process",
  titleWhite: "2D",
  titleAccent: "VFX",
  stepsSubtitle: "7 steps for readable, punchy effects",
  description:
    "From concept frames to optimized atlases—effects that pop on screen without stealing clarity from characters and UI.",
  stripTitle: "Our 2D VFX workflow",
  defaultStepIndex: 3,
  steps: [
    {
      title: "VFX brief & references",
      description: "Define palette, shape language, and intensity tiers.",
      image: "https://cdn.tdgamestudio.com/landing/images/9ab9a213-58d4-40c7-aacc-c6ad9f826d0f.png",
    },
    {
      title: "Style exploration",
      description: "Hero frames for silhouette and color before full build.",
      image: "https://cdn.tdgamestudio.com/landing/images/bcc4707e-cae2-46a2-9c96-c254c28ba763.png",
    },
    {
      title: "Effect production",
      description: "Layering sparks, trails, and glows for performance.",
      image: "https://cdn.tdgamestudio.com/landing/images/3067c837-e030-403f-b7c5-0c7246bfe15f.png",
    },
    {
      title: "Motion & timing",
      description: "Timing, easing, and hold frames for impact readability.",
      image: "https://cdn.tdgamestudio.com/landing/images/95bff405-e638-4cec-9260-e5c9af46f49b.png",
    },
    {
      title: "Polish & optimization",
      description: "Flashes and overlays tuned for mobile and PC targets.",
      image: "https://cdn.tdgamestudio.com/landing/images/f8e2e81a-e72c-431b-b4ec-5ab7af73ea12.png",
    },
    {
      title: "Unity / Spine integration",
      description: "Packed sheets, pivot data, and engine-ready hooks.",
      image: "https://cdn.tdgamestudio.com/landing/images/21f8a0a6-048f-4a5c-9946-3a89f6303fcd.png",
    },
    {
      title: "Final delivery",
      description: "Libraries and variants shipped with clear usage notes.",
      image: "https://cdn.tdgamestudio.com/landing/images/IMG_4352.png",
    },
  ],
  pillars: [
    {
      title: "Gameplay readability",
      body: "Effects that telegraph hits and skills without visual noise.",
      icon: "shield",
    },
    {
      title: "Mobile performance",
      body: "Atlases and counts balanced for smooth gameplay on target devices.",
      icon: "bolt",
    },
    {
      title: "Unity & Spine ready",
      body: "VFX that match your art direction and UI contrast rules.",
      icon: "palette",
    },
  ],
};
