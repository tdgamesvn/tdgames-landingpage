import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
  SpineMonster,
} from "@/components/portfolio/case-study-types";
import {
  ANIMATION_LABELS,
  WORKFLOW,
  cdnFor,
  monsterFactory,
  rosterStats,
  otherElementsModules,
  HUB_HREF,
  splitAwakened,
  summaryFor,
} from "../_monster-legends/shared";

// Nguồn: media-inbox/Monster Legend/Nature (2026-10-19) — 6 quái / 11 skeleton.
// Làm theo quy chuẩn .agent/meta/MONSTER-LEGENDS.md.
const CDN = cdnFor("nature");
const monster = monsterFactory("nature");

// Thứ tự: con có Awakened lên đầu, Ancestor/Architect rồi Mythic.
const ROSTER: readonly SpineMonster[] = splitAwakened([
  monster("florian-malsang", "Florian Malsang", "Ancestor", ["awakened"]),
  monster("goblarzd", "Goblarzd", "Mythic", ["stage1", "stage3"]),
  monster("gonzo", "Gonzo", "Mythic", ["stage1", "stage3"]),
  monster("korol", "Korol", "Mythic", ["stage1", "stage3"]),
  monster("onikapa", "Onikapa", "Mythic", ["stage1", "stage3"]),
  monster("wootr", "Wootr", "Mythic", ["stage1", "stage3"]),
]);

const { rigs: RIGS, animations: ANIMS } = rosterStats(ROSTER);

export const projectMeta: ProjectMeta = {
  title: "Monster Legends — Nature Monsters | Spine 2D Animation",
  eyebrow: "Case study · Social Point",
  backHref: HUB_HREF,
  backLabel: "Back to Monster Legends",
  summary: summaryFor("Nature"),
  heroTitle: {
    primary: [{ text: "Monster Legends", color: "white" }],
    subtitle: [
      { text: "Nature Monsters", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D Animation", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: `${ROSTER.length} monsters`, label: "Nature element", icon: "cube" },
    { value: `${ANIMS} animations`, label: "Delivered", icon: "calendar" },
    { value: "Animation · Spine 2D", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Spine 2D rigging & animation from the client's monster art",
    "Idle, walk, attack, skill, special, level-up and knock-out sets",
    "Separate rigs for each evolution stage, up to the Awakened form",
  ],
  showOverviewSection: true,
  overview: {
    body: "Nature monsters in Monster Legends are forest spirits, beasts and living plants, and their motion has to feel organic and full of life. We rigged every evolution stage as its own Spine skeleton — more leaves, vines and growth as they evolve, with the Awakened forms pushed furthest in natural magic and secondary animation. Each rig ships the full battle set the game calls for, from idle and walk to attack, skill, level-up and knock-out.",
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
  // Splash AI riêng hệ Nature (scripts/gen-monster-legends-splash.mjs), ref = render Spine trong bài.
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
  // Xanh lá cho bậc thường, vàng chanh cho Awakened (theme.accentSoft).
  theme: {
    accent: "#6fcf5a",
    accentSoft: "#e4ff7a",
    heroBackground:
      "radial-gradient(circle at 18% 12%, rgba(111,207,90,0.24), transparent 42%), radial-gradient(circle at 85% 10%, rgba(240,200,90,0.18), transparent 45%), linear-gradient(180deg, #122014 0%, #09100a 75%)",
    showcaseSectionBg: "#09100a",
    showcasePanelBg: "#0f1a11",
    sectionLabelBg: "#09100a",
  },
  workflow: WORKFLOW,
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-roster", variant: "sectionLabel", label: "Nature monsters · Animation Spine" },
  {
    id: "stage",
    variant: "spineStage",
    roster: ROSTER,
    background: `${CDN}/arena-v3.webp`,
    // arena-v3 là ảnh ĐẦY ĐỦ; lúc thường chỉ hiện phần giữa (1/1.5) để camera lùi ra tối đa
    // ×1.5 thì nền thu nhỏ theo mà vẫn phủ kín (sếp 2026-10-18). groundY tính theo phần giữa:
    // (groundY_ảnh − 1/6) × 1.5.
    groundY: 0.62,
    backgroundRoom: 1.5,
    logo: `${CDN}/logo.webp`,
    animationLabels: ANIMATION_LABELS,
  },
  ...otherElementsModules("nature"),
  {
    id: "closing",
    variant: "closing",
    text: "Every evolution,",
    highlight: "brought to life.",
    cta: { label: "Ask for similar work", href: "/contact" },
  },
];

// "Related Work" thay bằng lưới các hệ khác (otherElementsModules).
export const relatedProjects: readonly RelatedProject[] = [];
