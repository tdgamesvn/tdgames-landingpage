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

// Nguồn: media-inbox/Monster Legend/Dark (2026-10-18) — 11 quái / 25 skeleton.
// Làm theo quy chuẩn .agent/meta/MONSTER-LEGENDS.md.
const CDN = cdnFor("dark");
const monster = monsterFactory("dark");

// Thứ tự: con có Awakened lên đầu, Ancestor/Architect rồi Mythic.
const ROSTER: readonly SpineMonster[] = [
  monster("don-obscurione", "Don Obscurione", "Ancestor", ["stage1", "stage3", "awakened"]),
  monster("voreth-voidspawn", "Voreth Voidspawn", "Architect", ["stage1", "stage3", "awakened"]),
  monster("wilfred-razorstorm", "Wilfred Razorstorm", "Architect", ["stage1", "stage3", "awakened"]),
  monster("anwir-paincraver", "Anwir Paincraver", "Ancestor", ["stage1", "stage3"]),
  monster("dualis", "Dualis", "Mythic", ["stage1", "stage3"]),
  monster("hexer-alb", "Hexer Alb", "Mythic", ["stage1", "stage3"]),
  monster("soulblast", "Soulblast", "Mythic", ["stage1", "stage3"]),
  monster("witchaka", "Witchaka", "Mythic", ["stage1", "stage3"]),
  monster("wizerth", "Wizerth", "Mythic", ["stage1", "stage3"]),
  monster("bruzard", "Bruzard", "Mythic", ["stage1", "stage3"]),
  monster("zerozone", "Zerozone", "Mythic", ["stage1", "stage3"]),
];

const { rigs: RIGS, animations: ANIMS } = rosterStats(ROSTER);

export const projectMeta: ProjectMeta = {
  title: "Monster Legends — Dark Monsters | Spine 2D Animation",
  eyebrow: "Case study · Social Point",
  summary: summaryFor("Dark"),
  heroTitle: {
    primary: [{ text: "Monster Legends", color: "white" }],
    subtitle: [
      { text: "Dark Monsters", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D Animation", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: `${ROSTER.length} monsters`, label: "Dark element", icon: "cube" },
    { value: `${ANIMS} animations`, label: "Delivered", icon: "calendar" },
    { value: "Animation · Spine 2D", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Spine 2D rigging & animation from the client's monster art",
    "Idle, walk, attack, skill, special, level-up and knock-out sets",
    "Separate rigs for each evolution stage, up to the Awakened form",
  ],
  overview: {
    body: "Dark monsters in Monster Legends are sorcerers, void beasts and haunted warriors, and their motion has to feel menacing and arcane. We rigged every evolution stage as its own Spine skeleton — darker auras and heavier silhouettes as they evolve, with the Awakened forms pushed furthest in shadow magic and secondary animation. Each rig ships the full battle set the game calls for, from idle and walk to attack, skill, level-up and knock-out.",
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
  // Splash AI riêng hệ Dark (scripts/gen-monster-legends-splash.mjs), ref = render Spine trong bài.
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
  // Tím u tối cho bậc thường, tím hồng sáng cho Awakened (theme.accentSoft).
  theme: {
    accent: "#a46bff",
    accentSoft: "#f0a8ff",
    heroBackground:
      "radial-gradient(circle at 18% 12%, rgba(164,107,255,0.26), transparent 42%), radial-gradient(circle at 85% 10%, rgba(80,40,160,0.28), transparent 45%), linear-gradient(180deg, #170f2b 0%, #0b0716 75%)",
    showcaseSectionBg: "#0b0716",
    showcasePanelBg: "#120c22",
    sectionLabelBg: "#0b0716",
  },
  workflow: WORKFLOW,
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-roster", variant: "sectionLabel", label: "Dark monsters · Animation Spine" },
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
