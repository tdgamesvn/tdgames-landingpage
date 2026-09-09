import type { ServiceWorkflowConfig } from "@/components/service-workflow-types";

export const service2DArtWorkflowConfig: ServiceWorkflowConfig = {
  markerStep: "// 02",
  processLabel: "Our process",
  titleWhite: "2D",
  titleAccent: "workflow",
  stepsSubtitle: "5 steps to exceptional game art",
  description:
    "A streamlined 5-step process to transform your ideas into stunning 2D game art with precision, creativity, and consistent quality.",
  stripTitle: "Our 2D game art workflow",
  defaultStepIndex: 2,
  steps: [
    {
      title: "Discovery & art brief",
      description: "Align on visual direction, style, and mood for your game.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/e80140b3-ff50-4830-8d6c-aa8165b859d6.webp",
    },
    {
      title: "Concept & design approval",
      description: "Explore directions, then lock the chosen design in clean lines.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/99f39823-423f-4da4-85f3-6bb0411c20b3.webp",
    },
    {
      title: "Final rendering",
      description: "Apply colors, lighting, and atmosphere to the approved design.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/74e09277-84e8-4f0b-bca4-909f29dc38ef.webp",
    },
    {
      title: "Polish & QA",
      description: "Enhance details, lighting, and overall quality.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/081177bf-f5e1-4382-83ed-581eec002b75.webp",
    },
    {
      title: "Delivery & integration",
      description: "Export production-ready assets and hand off for integration.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/1f2cd1f4-1536-4d06-8987-68f75ede1c00.webp",
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
  stepsSubtitle: "5 steps from brief to shipped motion",
  description:
    "A production-minded pipeline for rigs, timing, and export—so gameplay motion stays readable and your team can integrate fast.",
  stripTitle: "Our 2D animation workflow",
  defaultStepIndex: 2,
  steps: [
    {
      title: "Animation brief",
      description: "Lock style, timing targets, and technical constraints.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/fbeb66da-9bf4-4131-8528-932388869dd8.webp",
    },
    {
      title: "Blocking & posing",
      description: "Rough motion passes to nail silhouette and beats.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/0001e234-1442-418b-94cf-9d9d273a0c16.webp",
    },
    {
      title: "Timing & motion",
      description: "Refine anticipation, follow-through, and impact frames.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/6ce5ded7-8142-435f-b30e-a1a4b2ddfe9a.webp",
    },
    {
      title: "Polish & review",
      description: "Secondary motion refined, then walked through together.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/3853c676-10fd-4522-a1d9-d92238288227.webp",
    },
    {
      title: "Export & delivery",
      description: "Spine/atlas checks, naming, and packages ready for build.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/237b0c6f-1168-4c2e-bc54-733ffddd7bee.webp",
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
  stepsSubtitle: "5 steps for readable, punchy effects",
  description:
    "From concept frames to optimized atlases—effects that pop on screen without stealing clarity from characters and UI.",
  stripTitle: "Our 2D VFX workflow",
  defaultStepIndex: 2,
  steps: [
    {
      title: "VFX brief & style",
      description: "Lock palette, shape language, and hero frames before build.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/b49a1a0f-4ddd-44b4-b8d1-239092a11e66.webp",
    },
    {
      title: "Effect production",
      description: "Layering sparks, trails, and glows for performance.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/2ad4fd27-d537-4abe-a5de-419e749cedfd.webp",
    },
    {
      title: "Motion & timing",
      description: "Timing, easing, and hold frames for impact readability.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/185ef285-b86c-4411-8f55-b97f985a47cb.webp",
    },
    {
      title: "Polish & optimization",
      description: "Flashes and overlays tuned for mobile and PC targets.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/7d3802fe-a5e1-49a7-9bb5-4c65abfb4474.webp",
    },
    {
      title: "Integration & delivery",
      description: "Packed sheets, engine-ready hooks, and clear usage notes.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/6f2cfc7f-8337-4504-8465-ff31c7d0c578.webp",
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

export const serviceFullGameProductionWorkflowConfig: ServiceWorkflowConfig = {
  markerStep: "// 02",
  processLabel: "Our process",
  titleWhite: "Full production",
  titleAccent: "workflow",
  stepsSubtitle: "5 phases from pitch to live build",
  description:
    "One team owns game design, art, animation, VFX, and engineering — so scope, style, and build stay in sync from the first pitch deck to the store build.",
  stripTitle: "Our full game production workflow",
  defaultStepIndex: 2,
  steps: [
    {
      title: "Concept & GDD",
      description:
        "Pitch, core loop, target platform and budget locked into a design doc your team can sign off on.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/626e629d-10bc-49b8-a071-5c76a4018e05.webp",
    },
    {
      title: "Prototype & art direction",
      description:
        "A playable grey-box of the core loop plus a locked style frame — fun and look proven before full spend.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/1474070c-8cf5-474a-9f8b-2821f81141d6.webp",
    },
    {
      title: "Production",
      description:
        "Art, animation, VFX, and gameplay code run in parallel on one milestone plan and one asset pipeline.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/fb7e9e02-f0e9-4343-a27d-523a442a3548.webp",
    },
    {
      title: "Integration & QA",
      description:
        "Builds on target devices every milestone: performance budgets, balancing passes, and bug triage.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/1dc74ede-f0d5-45ef-b687-931352d11b79.webp",
    },
    {
      title: "Launch & liveops",
      description:
        "Store submission, launch build, then content updates, events, and seasonal art if you keep us on.",
      image: "https://cdn.tdgamestudio.com/ai/2026/09/3f006864-46b6-4067-aa22-0cfd00c31162.webp",
    },
  ],
  pillars: [
    {
      title: "One accountable team",
      body: "Design, art, and code under a single producer — no hand-off gaps between vendors.",
      icon: "shield",
    },
    {
      title: "Playable every milestone",
      body: "You get a build you can hold, not a status report, at every gate.",
      icon: "bolt",
    },
    {
      title: "Art-led from day one",
      body: "Ten years of game art direction baked into the product, not bolted on late.",
      icon: "palette",
    },
  ],
};
