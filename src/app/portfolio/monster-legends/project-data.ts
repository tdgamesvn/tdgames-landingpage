import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";
import { relatedProjects as epicRelated } from "../epic-card/project-data";
import { ELEMENTS, WORKFLOW, cdnFor, elementCards } from "../_monster-legends/shared";

// Trang tổng Monster Legends (sếp chốt 2026-10-19, kiểu ArtStation): /portfolio chỉ có 1 card
// dẫn vào đây; 10 trang hệ giữ nguyên, mỗi trang có nút quay về đây + lưới các hệ khác.
const CDN = cdnFor("all");

export const projectMeta: ProjectMeta = {
  title: "Monster Legends | Spine 2D Monster Animation for Social Point",
  eyebrow: "Case study · Social Point",
  summary: `We created the Spine 2D animation for Social Point's Monster Legends across ${ELEMENTS.length} elements — every monster in its baby, adult and awakened forms with a full set of battle animations. Pick an element below to watch its monsters running live in your browser.`,
  heroTitle: {
    primary: [{ text: "Monster Legends", color: "white" }],
    subtitle: [
      { text: "Spine 2D Monster Animation", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Social Point", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: `${ELEMENTS.length} elements`, label: "Covered", icon: "cube" },
    { value: "Baby · Adult · Awakened", label: "Every form", icon: "calendar" },
    { value: "Animation · Spine 2D", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Spine 2D rigging & animation from the client's monster art",
    "Idle, walk, attack, skill, special, level-up and knock-out sets",
    "Separate rigs for each evolution stage, up to the Awakened form",
  ],
  overview: {
    body: "Monster Legends lives on its creatures: players collect, breed and evolve hundreds of monsters, and each evolution has to feel like a reward. We rigged and animated monsters across every element of the game, each evolution stage as its own Spine skeleton, with the Awakened forms pushed furthest in effects and secondary animation.",
    stats: [
      { value: String(ELEMENTS.length), label: "Elements" },
      { value: "3", label: "Evolution forms" },
      { value: "7", label: "Animations per rig" },
      { value: "Spine 2D", label: "Built with" },
    ],
  },
  behanceUrl: "",
  madeForLabel: "Social Point",
  madeForUrl: "https://www.socialpoint.es",
  coverImage: `${CDN}/splash-ai-v4.jpg`,
  coverPosition: "center",
  coverAspectMobile: 16 / 9,
  tools: ["Spine 2D"],
  fields: ["Character Animation", "Spine 2D"],
  tags: ["monster legends", "social point", "monster animation", "spine 2D animation", "mobile game"],
  theme: {
    accent: "#ffb547",
    accentSoft: "#8fd8ff",
    heroBackground:
      "radial-gradient(circle at 18% 12%, rgba(255,181,71,0.24), transparent 42%), radial-gradient(circle at 85% 10%, rgba(143,216,255,0.22), transparent 45%), linear-gradient(180deg, #1c1430 0%, #0c0918 75%)",
    showcaseSectionBg: "#0c0918",
    showcasePanelBg: "#130f24",
    sectionLabelBg: "#0c0918",
  },
  workflow: WORKFLOW,
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-elements", variant: "sectionLabel", label: "Elements" },
  { id: "elements", variant: "linkGrid", size: "large", items: elementCards() },
  {
    id: "closing",
    variant: "closing",
    text: "Every evolution,",
    highlight: "brought to life.",
    cta: { label: "Ask for similar work", href: "/contact" },
  },
];

export const relatedProjects: readonly RelatedProject[] = epicRelated;
