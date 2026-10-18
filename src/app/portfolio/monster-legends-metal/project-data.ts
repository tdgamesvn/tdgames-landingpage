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

// Nguồn: media-inbox/Monster Legend/Metal (2026-10-19) — 5 quái / 10 skeleton.
// Làm theo quy chuẩn .agent/meta/MONSTER-LEGENDS.md.
const CDN = cdnFor("metal");
const monster = monsterFactory("metal");

// Thứ tự: con có Awakened lên đầu, Ancestor/Architect rồi Mythic.
const ROSTER: readonly SpineMonster[] = [
  monster("exarch-quor", "Exarch Quor", "Architect", ["stage1", "stage3", "awakened"]),
  monster("primerion-unimate", "Primerion Unimate", "Ancestor", ["awakened"]),
  monster("droitler", "Droitler", "Mythic", ["stage1", "stage3"]),
  monster("ionv2", "Ion V2", "Mythic", ["stage1", "stage3"]),
  monster("mollugh", "Mollugh", "Mythic", ["stage1", "stage3"]),
];

const { rigs: RIGS, animations: ANIMS } = rosterStats(ROSTER);

export const projectMeta: ProjectMeta = {
  title: "Monster Legends — Metal Monsters | Spine 2D Animation",
  eyebrow: "Case study · Social Point",
  summary: summaryFor("Metal"),
  heroTitle: {
    primary: [{ text: "Monster Legends", color: "white" }],
    subtitle: [
      { text: "Metal Monsters", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D Animation", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: `${ROSTER.length} monsters`, label: "Metal element", icon: "cube" },
    { value: `${ANIMS} animations`, label: "Delivered", icon: "calendar" },
    { value: "Animation · Spine 2D", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Spine 2D rigging & animation from the client's monster art",
    "Idle, walk, attack, skill, special, level-up and knock-out sets",
    "Separate rigs for each evolution stage, up to the Awakened form",
  ],
  overview: {
    body: "Metal monsters in Monster Legends are robots, cyborgs and armoured machines, and their motion has to feel mechanical, precise and heavy. We rigged every evolution stage as its own Spine skeleton — more plating and more moving parts as they evolve, with the Awakened forms pushed furthest in tech effects and secondary animation. Each rig ships the full battle set the game calls for, from idle and walk to attack, skill, level-up and knock-out.",
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
  // Splash AI riêng hệ Metal (scripts/gen-monster-legends-splash.mjs), ref = render Spine trong bài.
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
  // Xám thép xanh cho bậc thường, cyan sáng cho Awakened (theme.accentSoft).
  theme: {
    accent: "#8fb3c9",
    accentSoft: "#7ff0ff",
    heroBackground:
      "radial-gradient(circle at 18% 12%, rgba(143,179,201,0.24), transparent 42%), radial-gradient(circle at 85% 10%, rgba(255,150,80,0.18), transparent 45%), linear-gradient(180deg, #141a20 0%, #0a0d11 75%)",
    showcaseSectionBg: "#0a0d11",
    showcasePanelBg: "#11161c",
    sectionLabelBg: "#0a0d11",
  },
  workflow: WORKFLOW,
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-roster", variant: "sectionLabel", label: "Metal monsters · Animation Spine" },
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
