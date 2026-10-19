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

// Nguồn: media-inbox/Monster Legend/Thunder (2026-10-19) — 12 quái / 23 skeleton.
// Làm theo quy chuẩn .agent/meta/MONSTER-LEGENDS.md.
const CDN = cdnFor("thunder");
const monster = monsterFactory("thunder");

// Thứ tự: con có Awakened lên đầu, Ancestor/Architect rồi Mythic.
const ROSTER: readonly SpineMonster[] = splitAwakened([
  monster("tyr-stormbringer", "Tyr Stormbringer", "Ancestor", ["stage1", "awakened"]),
  monster("v-kid", "V-Kid", "Architect", ["awakened"]),
  monster("godfather-imigbo", "Godfather Imigbo", "Mythic", ["stage1", "stage3"]),
  monster("lightning-star", "Lightning Star", "Mythic", ["stage1", "stage3"]),
  monster("moreena", "Moreena", "Mythic", ["stage1", "stage3"]),
  monster("piraterko", "Piraterko", "Mythic", ["stage1", "stage3"]),
  monster("proud-lionell", "Proud Lionell", "Mythic", ["stage1", "stage3"]),
  monster("shadowbolt", "Shadowbolt", "Mythic", ["stage1", "stage3"]),
  monster("bolskudon", "Bolskudon", "Mythic", ["stage1", "stage3"]),
  monster("dolores", "Dolores", "Mythic", ["stage1", "stage3"]),
  monster("folgorg", "Folgorg", "Mythic", ["stage1", "stage3"]),
  monster("thunder-eagle", "Thunder Eagle", "Common", ["stage1", "stage3"]),
]);

const { rigs: RIGS, animations: ANIMS } = rosterStats(ROSTER);

export const projectMeta: ProjectMeta = {
  title: "Monster Legends — Thunder Monsters | Spine 2D Animation",
  eyebrow: "Case study · Social Point",
  summary: summaryFor("Thunder"),
  heroTitle: {
    primary: [{ text: "Monster Legends", color: "white" }],
    subtitle: [
      { text: "Thunder Monsters", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D Animation", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: `${ROSTER.length} monsters`, label: "Thunder element", icon: "cube" },
    { value: `${ANIMS} animations`, label: "Delivered", icon: "calendar" },
    { value: "Animation · Spine 2D", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Spine 2D rigging & animation from the client's monster art",
    "Idle, walk, attack, skill, special, level-up and knock-out sets",
    "Separate rigs for each evolution stage, up to the Awakened form",
  ],
  overview: {
    body: "Thunder monsters in Monster Legends are storm lords, lightning beasts and electric brawlers, and their motion has to feel fast, sharp and charged. We rigged every evolution stage as its own Spine skeleton — more sparks and snappier strikes as they evolve, with the Awakened forms pushed furthest in lightning effects and secondary animation. Each rig ships the full battle set the game calls for, from idle and walk to attack, skill, level-up and knock-out.",
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
  // Splash AI riêng hệ Thunder (scripts/gen-monster-legends-splash.mjs), ref = render Spine trong bài.
  coverImage: `${CDN}/splash-ai-v3.jpg`,
  coverPosition: "center",
  // Splash dàn ngang nhiều quái → mobile/tablet giữ nguyên tỉ lệ 16:9, không cắt hai bên.
  coverAspectMobile: 16 / 9,
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
  // Vàng điện cho bậc thường, xanh điện cho Awakened (theme.accentSoft).
  theme: {
    accent: "#ffd23f",
    accentSoft: "#8fd8ff",
    heroBackground:
      "radial-gradient(circle at 18% 12%, rgba(255,210,63,0.24), transparent 42%), radial-gradient(circle at 85% 10%, rgba(80,140,255,0.22), transparent 45%), linear-gradient(180deg, #121a2e 0%, #080c18 75%)",
    showcaseSectionBg: "#080c18",
    showcasePanelBg: "#0e1424",
    sectionLabelBg: "#080c18",
  },
  workflow: WORKFLOW,
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-roster", variant: "sectionLabel", label: "Thunder monsters · Animation Spine" },
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
