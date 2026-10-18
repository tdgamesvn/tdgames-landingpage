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

// Nguồn: media-inbox/Monster Legend/Special (2026-10-19) — 3 quái / 5 skeleton.
// Làm theo quy chuẩn .agent/meta/MONSTER-LEGENDS.md.
const CDN = cdnFor("special");
const monster = monsterFactory("special");

// Thứ tự: con có Awakened lên đầu, Ancestor/Architect rồi Mythic.
const ROSTER: readonly SpineMonster[] = [
  monster("nebotus-evil-lord", "Nebotus Evil Lord", "Ancestor", ["awakened"]),
  monster("cakelius-the-tenth", "Cakelius the Tenth", "Mythic", ["stage1", "stage3"]),
  monster("idolator", "Idolator", "Mythic", ["stage1", "stage3"]),
];

const { rigs: RIGS, animations: ANIMS } = rosterStats(ROSTER);

export const projectMeta: ProjectMeta = {
  title: "Monster Legends — Special Monsters | Spine 2D Animation",
  eyebrow: "Case study · Social Point",
  summary: summaryFor("Special"),
  heroTitle: {
    primary: [{ text: "Monster Legends", color: "white" }],
    subtitle: [
      { text: "Special Monsters", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D Animation", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: `${ROSTER.length} monsters`, label: "Special element", icon: "cube" },
    { value: `${ANIMS} animations`, label: "Delivered", icon: "calendar" },
    { value: "Animation · Spine 2D", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Spine 2D rigging & animation from the client's monster art",
    "Idle, walk, attack, skill, special, level-up and knock-out sets",
    "Separate rigs for each evolution stage, up to the Awakened form",
  ],
  overview: {
    body: "Special monsters in Monster Legends break the usual rules — event heroes, oddballs and one-of-a-kind legends — and each needs motion with its own personality. We rigged every evolution stage as its own Spine skeleton, with the Awakened forms pushed furthest in effects and secondary animation. Each rig ships the full battle set the game calls for, from idle and walk to attack, skill, level-up and knock-out.",
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
  // Splash AI riêng hệ Special (scripts/gen-monster-legends-splash.mjs), ref = render Spine trong bài.
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
  // Hồng san hô cho bậc thường, vàng kem cho Awakened (theme.accentSoft).
  theme: {
    accent: "#ff7fb0",
    accentSoft: "#ffe38f",
    heroBackground:
      "radial-gradient(circle at 18% 12%, rgba(255,127,176,0.24), transparent 42%), radial-gradient(circle at 85% 10%, rgba(160,120,255,0.22), transparent 45%), linear-gradient(180deg, #22142a 0%, #110a16 75%)",
    showcaseSectionBg: "#110a16",
    showcasePanelBg: "#1a1022",
    sectionLabelBg: "#110a16",
  },
  workflow: WORKFLOW,
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-roster", variant: "sectionLabel", label: "Special monsters · Animation Spine" },
  {
    id: "stage",
    variant: "spineStage",
    roster: ROSTER,
    background: `${CDN}/arena-v3.webp`,
    // arena-v3 là ảnh ĐẦY ĐỦ; lúc thường chỉ hiện phần giữa (1/1.5) để camera lùi ra tối đa
    // ×1.5 thì nền thu nhỏ theo mà vẫn phủ kín (sếp 2026-10-18). groundY tính theo phần giữa:
    // (groundY_ảnh − 1/6) × 1.5.
    groundY: 0.68,
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
