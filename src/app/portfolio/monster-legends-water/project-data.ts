import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
  SpineMonster,
} from "@/components/portfolio/case-study-types";
import { relatedProjects as epicRelated } from "../epic-card/project-data";
import {
  ANIMATION_LABELS,
  WORKFLOW,
  cdnFor,
  monsterFactory,
  rosterStats,
  summaryFor,
} from "../_monster-legends/shared";

// Nguồn: media-inbox/Monster Legend/Water (2026-10-18) — 6 quái / 10 skeleton.
const CDN = cdnFor("water");
const monster = monsterFactory("water");

// Thứ tự: Awakened (Ancestor) lên đầu, Mythic theo sau.
const ROSTER: readonly SpineMonster[] = [
  monster("hounen-zennomusuko", "Hounen Zennomusuko", "Ancestor", ["awakened"]),
  monster("kirk-moonwalker", "Kirk Moonwalker", "Ancestor", ["awakened"]),
  monster("crabsair", "Crabsair", "Mythic", ["stage1", "stage3"]),
  // Sếp sửa lại file ở local 2026-10-18 → upload riêng sang spine-v3 (cache CDN giữ bản cũ ở v2).
  monster("iceblood", "Iceblood", "Mythic", ["stage1", "stage3"], {}, "spine-v3"),
  monster("crocark", "Crocark", "Mythic", ["stage1", "stage3"]),
  monster("bayworker-hulk", "Bayworker Hulk", "Mythic", ["stage1", "stage3"]),
];

const { rigs: RIGS, animations: ANIMS } = rosterStats(ROSTER);

export const projectMeta: ProjectMeta = {
  title: "Monster Legends — Water Monsters | Spine 2D Animation",
  eyebrow: "Case study · Social Point",
  summary: summaryFor("Water"),
  heroTitle: {
    primary: [{ text: "Monster Legends", color: "white" }],
    subtitle: [
      { text: "Water Monsters", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D Animation", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: `${ROSTER.length} monsters`, label: "Water element", icon: "cube" },
    { value: `${ANIMS} animations`, label: "Delivered", icon: "calendar" },
    { value: "Animation · Spine 2D", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Spine 2D rigging & animation from the client's monster art",
    "Idle, walk, attack, skill, special, level-up and knock-out sets",
    "Separate rigs for each evolution stage, up to the Awakened form",
  ],
  overview: {
    body: "Water monsters in Monster Legends range from armoured crabs and crocodiles to ice-forged warriors, and each needs motion that sells its weight in and out of water. We rigged every evolution stage as its own Spine skeleton — heavier shells and bigger splashes as they evolve, and the Awakened Ancestors pushed furthest with flowing water, ice and the most secondary animation. Each rig ships the full battle set the game calls for, from idle and walk to attack, skill, level-up and knock-out.",
    stats: [
      { value: String(ROSTER.length), label: "Monsters" },
      { value: String(RIGS), label: "Spine rigs" },
      { value: String(ANIMS), label: "Animations" },
      { value: "Spine 2D", label: "Built with" },
    ],
  },
  behanceUrl: "",
  madeForLabel: "Social Point",
  madeForUrl: "https://www.socialpoint.es",
  // Splash AI riêng hệ Water (scripts/gen-monster-legends-splash.mjs), ref = render Spine trong bài.
  coverImage: `${CDN}/splash-ai-v2.jpg`,
  coverPosition: "center",
  tools: ["Spine 2D"],
  fields: ["Character Animation", "Spine 2D"],
  tags: [
    "monster legends",
    "social point",
    "monster animation",
    "creature animation",
    "spine 2D animation",
    "mobile game",
  ],
  // Xanh biển cho bậc thường, aqua sáng cho Awakened (theme.accentSoft).
  theme: {
    accent: "#2fb8e8",
    accentSoft: "#8ff0ff",
    heroBackground:
      "radial-gradient(circle at 18% 12%, rgba(47,184,232,0.26), transparent 42%), radial-gradient(circle at 85% 10%, rgba(120,80,190,0.24), transparent 45%), linear-gradient(180deg, #0f1a33 0%, #080d1c 75%)",
    showcaseSectionBg: "#080d1c",
    showcasePanelBg: "#0c1428",
    sectionLabelBg: "#080d1c",
  },
  workflow: WORKFLOW,
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-roster", variant: "sectionLabel", label: "Water monsters · Animation Spine" },
  {
    id: "stage",
    variant: "spineStage",
    roster: ROSTER,
    background: `${CDN}/arena-v3.webp`,
    // arena-v3 là ảnh ĐẦY ĐỦ; lúc thường chỉ hiện phần giữa (1/1.5) để camera lùi ra tối đa
    // ×1.5 thì nền thu nhỏ theo mà vẫn phủ kín (sếp 2026-10-18). groundY tính theo phần giữa:
    // (groundY_ảnh − 1/6) × 1.5.
    groundY: 0.65,
    backgroundRoom: 1.5,
    logo: `${CDN}/logo.webp`,
    animationLabels: ANIMATION_LABELS,
  },
  {
    id: "closing",
    variant: "closing",
    text: "Every evolution,",
    highlight: "brought to life.",
    cta: { label: "Ask for similar work", href: "/contact" },
  },
];

export const relatedProjects: readonly RelatedProject[] = epicRelated;
