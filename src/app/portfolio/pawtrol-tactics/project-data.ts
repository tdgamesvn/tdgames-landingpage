import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";
import { relatedProjects as epicRelated } from "../epic-card/project-data";

const CDN = "https://cdn.tdgamestudio.com/landing/portfolio/pawtrol-tactics";
const img = (id: string) => `${CDN}/${id}.jpg`;

// Concept nội bộ (game tự nghĩ) — asset gen bằng scripts/gen-pawtrol-ui.mjs, key art làm
// neo style cho mọi màn. Không phải dự án khách → eyebrow ghi rõ "In-house concept".
export const projectMeta: ProjectMeta = {
  title: "Pawtrol Tactics — Mobile Game UI/UX Design",
  eyebrow: "Case study · In-house concept",
  summary:
    "A complete UI/UX concept for a casual turn-based tactics game starring a squad of animal heroes — from core-loop flow and design system to every key screen of the player journey.",
  heroTitle: {
    primary: [
      { text: "Pawtrol", color: "white" },
      { text: " " },
      { text: "Tactics", color: "accent" },
    ],
    subtitle: [
      { text: "Game UI/UX", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Mobile", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: "12 screens", label: "Designed", icon: "cube" },
    { value: "Turn-based tactics", label: "Project type", icon: "calendar" },
    { value: "UI/UX · Art direction", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Core loop & user flow",
    "Art direction & UI kit",
    "12 key gameplay & meta screens",
  ],
  overview: {
    body: "Pawtrol Tactics is our in-house concept for a casual mobile tactics game: four animal heroes defend a floating cookie-island village from Candy Gremlins. We started from the core loop — lobby, world map, team setup, battle, rewards — and mapped every screen the player touches before drawing a single button. A chunky, squishy UI language with a candy palette (warm orange for primary actions, teal for secondary, deep navy for readable text panels) keeps the screens playful while staying legible on a small phone in one-hand portrait play. Battle UI keeps the turn order, HP and skill charge visible at all times, while meta screens (summon, shop, quests) reuse the same components from the UI kit so the whole game feels like one product.",
    stats: [
      { value: "12", label: "Key screens" },
      { value: "8", label: "Flow steps" },
      { value: "4", label: "Hero classes" },
      { value: "1", label: "Unified UI kit" },
    ],
  },
  behanceUrl: "",
  coverImage: img("key-art"),
  coverPosition: "center",
  tools: ["Figma", "Photoshop"],
  fields: ["UI/UX Design", "Game UI", "Art Direction"],
  tags: [
    "game ui",
    "game ux",
    "mobile game ui",
    "ui kit",
    "turn-based tactics",
    "casual game",
    "Pawtrol Tactics",
  ],
  theme: {
    accent: "#ff8a3d",
    accentSoft: "#2ec4b6",
    heroBackground:
      "radial-gradient(circle at top left, rgba(255,138,61,0.20), transparent 42%), radial-gradient(circle at top right, rgba(46,196,182,0.16), transparent 44%), linear-gradient(180deg, #1c1e2e 0%, #121320 75%)",
    showcaseSectionBg: "#141522",
    showcasePanelBg: "#1c1e2e",
    sectionLabelBg: "#141522",
  },
  workflow: [
    { n: "01", t: "Core Loop", sub: "Flow & screen map" },
    { n: "02", t: "Art Direction", sub: "Cast, palette, type" },
    { n: "03", t: "UI Kit", sub: "Components & states" },
    { n: "04", t: "Screens", sub: "Gameplay & meta" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "key-art", variant: "full", src: img("key-art") },
  { id: "label-foundation", variant: "sectionLabel", label: "Flow & Art Direction" },
  { id: "user-flow", variant: "full", src: img("user-flow") },
  { id: "art-direction", variant: "full", src: img("art-direction") },
  { id: "label-core", variant: "sectionLabel", label: "Onboarding & Home" },
  // Board 3 màn ghép sẵn lúc upload (BOARDS trong script) — trio quá thấp cho màn dọc.
  { id: "core", variant: "full", src: img("screens-core") },
  { id: "label-heroes", variant: "sectionLabel", label: "Heroes & Team" },
  { id: "heroes", variant: "full", src: img("screens-heroes") },
  { id: "label-battle", variant: "sectionLabel", label: "Battle" },
  { id: "battle", variant: "full", src: img("screens-battle") },
  { id: "label-meta", variant: "sectionLabel", label: "Summon, Shop & Quests" },
  { id: "meta", variant: "full", src: img("screens-meta") },
  { id: "label-kit", variant: "sectionLabel", label: "UI Kit" },
  { id: "ui-kit", variant: "full", src: img("ui-kit") },
  { id: "showcase", variant: "full", src: img("showcase") },
  {
    id: "closing",
    variant: "closing",
    text: "Playful on the surface,",
    highlight: "clear in every tap.",
    cta: { label: "Ask for similar work", href: "/contact" },
  },
];

export const relatedProjects: readonly RelatedProject[] = epicRelated;
