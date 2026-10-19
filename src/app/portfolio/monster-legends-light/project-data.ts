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
  splitAwakened,
  summaryFor,
} from "../_monster-legends/shared";

// Nguồn: media-inbox/Monster Legend/Light (2026-10-19) — 8 quái / 16 skeleton.
// Làm theo quy chuẩn .agent/meta/MONSTER-LEGENDS.md.
const CDN = cdnFor("light");
const monster = monsterFactory("light");

// Thứ tự: con có Awakened lên đầu, Ancestor/Architect rồi Mythic.
const ROSTER: readonly SpineMonster[] = splitAwakened([
  monster("jestin-justice", "Jestin Justice", "Ancestor", ["stage1", "stage3", "awakened"]),
  monster("maximus-astrum", "Maximus Astrum", "Ancestor", ["awakened"]),
  monster("graciel-choirmaster", "Graciel Choirmaster", "Ancestor", ["awakened"]),
  monster("layth-maximus", "Layth Maximus", "Architect", ["stage1", "stage3"]),
  monster("master-shannara", "Master Shannara", "Mythic", ["stage1", "stage3"]),
  monster("dol-righteousfin", "Dol Righteousfin", "Mythic", ["stage1", "stage3"]),
  monster("pengunel", "Pengunel", "Mythic", ["stage1", "stage3"]),
  monster("cutejunk", "Cutejunk", "Mythic", ["stage1", "stage3"]),
]);

const { rigs: RIGS, animations: ANIMS } = rosterStats(ROSTER);

export const projectMeta: ProjectMeta = {
  title: "Monster Legends — Light Monsters | Spine 2D Animation",
  eyebrow: "Case study · Social Point",
  summary: summaryFor("Light"),
  heroTitle: {
    primary: [{ text: "Monster Legends", color: "white" }],
    subtitle: [
      { text: "Light Monsters", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D Animation", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: `${ROSTER.length} monsters`, label: "Light element", icon: "cube" },
    { value: `${ANIMS} animations`, label: "Delivered", icon: "calendar" },
    { value: "Animation · Spine 2D", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Spine 2D rigging & animation from the client's monster art",
    "Idle, walk, attack, skill, special, level-up and knock-out sets",
    "Separate rigs for each evolution stage, up to the Awakened form",
  ],
  overview: {
    body: "Light monsters in Monster Legends are paladins, angels and radiant guardians, and their motion has to feel noble and full of holy power. We rigged every evolution stage as its own Spine skeleton — brighter halos and grander silhouettes as they evolve, with the Awakened forms pushed furthest in divine light and secondary animation. Each rig ships the full battle set the game calls for, from idle and walk to attack, skill, level-up and knock-out.",
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
  // Splash AI riêng hệ Light (scripts/gen-monster-legends-splash.mjs), ref = render Spine trong bài.
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
  // Vàng kim cho bậc thường, vàng sáng cho Awakened (theme.accentSoft).
  theme: {
    accent: "#f2c14e",
    accentSoft: "#fff1a8",
    heroBackground:
      "radial-gradient(circle at 18% 12%, rgba(242,193,78,0.26), transparent 42%), radial-gradient(circle at 85% 10%, rgba(255,170,120,0.22), transparent 45%), linear-gradient(180deg, #2a2012 0%, #14100a 75%)",
    showcaseSectionBg: "#14100a",
    showcasePanelBg: "#1d170d",
    sectionLabelBg: "#14100a",
  },
  workflow: WORKFLOW,
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-roster", variant: "sectionLabel", label: "Light monsters · Animation Spine" },
  {
    id: "stage",
    variant: "spineStage",
    roster: ROSTER,
    background: `${CDN}/arena-v3.webp`,
    // arena-v3 là ảnh ĐẦY ĐỦ; lúc thường chỉ hiện phần giữa (1/1.5) để camera lùi ra tối đa
    // ×1.5 thì nền thu nhỏ theo mà vẫn phủ kín (sếp 2026-10-18). groundY tính theo phần giữa:
    // (groundY_ảnh − 1/6) × 1.5.
    groundY: 0.69,
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
