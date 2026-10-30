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

// Nguồn: media-inbox/Monster Legend/Earth (2026-10-19) — 8 quái / 14 skeleton.
// Làm theo quy chuẩn .agent/meta/MONSTER-LEGENDS.md.
const CDN = cdnFor("earth");
const monster = monsterFactory("earth");

// Thứ tự: con có Awakened lên đầu, Ancestor/Architect rồi Mythic.
const ROSTER: readonly SpineMonster[] = splitAwakened([
  monster("miss-qylara-watson", "Miss Qylara Watson", "Architect", ["awakened"]),
  monster("president-canine", "President Canine", "Architect", ["awakened"]),
  monster("eternal-basthet", "Eternal Basthet", "Mythic", ["stage1", "stage3"]),
  monster("arkanite", "Arkanite", "Mythic", ["stage1", "stage3"]),
  monster("ishigaki", "Ishigaki", "Mythic", ["stage1", "stage3"]),
  monster("stornt", "Stornt", "Mythic", ["stage1", "stage3"]),
  monster("volken-miner", "Volken Miner", "Mythic", ["stage1", "stage3"]),
  monster("turtle-murtle", "Turtle Murtle", "Mythic", ["stage1", "stage3"]),
]);

const { rigs: RIGS, animations: ANIMS } = rosterStats(ROSTER);

export const projectMeta: ProjectMeta = {
  title: "Monster Legends — Earth Monsters | Spine 2D Animation",
  eyebrow: "Case study · Social Point",
  backHref: HUB_HREF,
  backLabel: "Back to Monster Legends",
  summary: summaryFor("Earth"),
  heroTitle: {
    primary: [{ text: "Monster Legends", color: "white" }],
    subtitle: [
      { text: "Earth Monsters", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D Animation", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: `${ROSTER.length} monsters`, label: "Earth element", icon: "cube" },
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
    body: "Earth monsters in Monster Legends are golems, burrowers and stone-hided bruisers, and their motion has to sell real weight and impact. We rigged every evolution stage as its own Spine skeleton — heavier mass and harder hits as they evolve, with the Awakened forms pushed furthest in power and secondary animation. Each rig ships the full battle set the game calls for, from idle and walk to attack, skill, level-up and knock-out.",
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
  // Splash AI riêng hệ Earth (scripts/gen-monster-legends-splash.mjs), ref = render Spine trong bài.
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
  // Cát đất nung cho bậc thường, vàng nhạt cho Awakened (theme.accentSoft).
  theme: {
    accent: "#d9965b",
    accentSoft: "#ffe08a",
    heroBackground:
      "radial-gradient(circle at 18% 12%, rgba(217,150,91,0.26), transparent 42%), radial-gradient(circle at 85% 10%, rgba(140,170,90,0.2), transparent 45%), linear-gradient(180deg, #2a1c12 0%, #130d08 75%)",
    showcaseSectionBg: "#130d08",
    showcasePanelBg: "#1c140c",
    sectionLabelBg: "#130d08",
  },
  workflow: WORKFLOW,
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-roster", variant: "sectionLabel", label: "Earth monsters · Animation Spine" },
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
  ...otherElementsModules("earth"),
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
