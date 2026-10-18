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

// Nguồn: media-inbox/Monster Legend/Magic (2026-10-19) — 11 quái / 24 skeleton.
// Làm theo quy chuẩn .agent/meta/MONSTER-LEGENDS.md.
const CDN = cdnFor("magic");
const monster = monsterFactory("magic");

// Thứ tự: con có Awakened lên đầu, Ancestor/Architect rồi Mythic.
const ROSTER: readonly SpineMonster[] = [
  monster("baba-basheer", "Baba Basheer", "Ancestor", ["stage1", "stage3", "awakened"]),
  monster("mater-geneza", "Mater Geneza", "Ancestor", ["stage1", "stage3", "awakened"]),
  monster("xandrite-spellbound", "Xandrite Spellbound", "Ancestor", ["awakened"]),
  monster("the-chronicler", "The Chronicler", "Mythic", ["stage1", "stage3"]),
  monster("octomancer", "Octomancer", "Mythic", ["stage1", "stage3"]),
  monster("konrad-von-krow", "Konrad von Krow", "Mythic", ["stage1", "stage3"]),
  monster("hellmut-hoyt", "Hellmut Hoyt", "Mythic", ["stage1", "stage3"]),
  monster("akenara", "Akenara", "Mythic", ["stage1", "stage3"]),
  monster("dr-bloom", "Dr. Bloom", "Mythic", ["stage1", "stage3"]),
  monster("dosigumi", "Dosigumi", "Mythic", ["stage1", "stage3"]),
  monster("dommeath", "Dommeath", "Rare", ["stage1", "stage3"]),
];

const { rigs: RIGS, animations: ANIMS } = rosterStats(ROSTER);

export const projectMeta: ProjectMeta = {
  title: "Monster Legends — Magic Monsters | Spine 2D Animation",
  eyebrow: "Case study · Social Point",
  summary: summaryFor("Magic"),
  heroTitle: {
    primary: [{ text: "Monster Legends", color: "white" }],
    subtitle: [
      { text: "Magic Monsters", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D Animation", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: `${ROSTER.length} monsters`, label: "Magic element", icon: "cube" },
    { value: `${ANIMS} animations`, label: "Delivered", icon: "calendar" },
    { value: "Animation · Spine 2D", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Spine 2D rigging & animation from the client's monster art",
    "Idle, walk, attack, skill, special, level-up and knock-out sets",
    "Separate rigs for each evolution stage, up to the Awakened form",
  ],
  overview: {
    body: "Magic monsters in Monster Legends are spellcasters, alchemists and arcane oddities, and their motion has to feel playful yet powerful. We rigged every evolution stage as its own Spine skeleton — bigger spells and more flourish as they evolve, with the Awakened forms pushed furthest in arcane effects and secondary animation. Each rig ships the full battle set the game calls for, from idle and walk to attack, skill, level-up and knock-out.",
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
  // Splash AI riêng hệ Magic (scripts/gen-monster-legends-splash.mjs), ref = render Spine trong bài.
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
  // Tím hồng cho bậc thường, cyan cho Awakened (theme.accentSoft).
  theme: {
    accent: "#e15cff",
    accentSoft: "#6ff2ff",
    heroBackground:
      "radial-gradient(circle at 18% 12%, rgba(225,92,255,0.24), transparent 42%), radial-gradient(circle at 85% 10%, rgba(80,200,255,0.2), transparent 45%), linear-gradient(180deg, #180f2e 0%, #0a0717 75%)",
    showcaseSectionBg: "#0a0717",
    showcasePanelBg: "#120c24",
    sectionLabelBg: "#0a0717",
  },
  workflow: WORKFLOW,
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-roster", variant: "sectionLabel", label: "Magic monsters · Animation Spine" },
  {
    id: "stage",
    variant: "spineStage",
    roster: ROSTER,
    background: `${CDN}/arena-v3.webp`,
    // arena-v3 là ảnh ĐẦY ĐỦ; lúc thường chỉ hiện phần giữa (1/1.5) để camera lùi ra tối đa
    // ×1.5 thì nền thu nhỏ theo mà vẫn phủ kín (sếp 2026-10-18). groundY tính theo phần giữa:
    // (groundY_ảnh − 1/6) × 1.5.
    groundY: 0.70,
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
