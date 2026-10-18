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

const CDN = cdnFor("fire");
const monster = monsterFactory("fire");

// Thứ tự: con 3 bậc + Awakened lên đầu (khoe nhiều nhất), Mythic theo sau.
const ROSTER: readonly SpineMonster[] = [
  // Cánh lửa Awakened rộng + nhiều diện tích → thân trông nhỏ hơn các con khác (sếp 2026-10-18).
  monster("kennix-solaris", "Kennix Solaris", "Architect", ["stage1", "stage3", "awakened"], { awakened: 1.2 }),
  monster("kaih-the-pyrenaut", "Kaih the Pyrenaut", "Architect", ["stage1", "stage3", "awakened"]),
  monster("shallinar-emberglow", "Shallinar Emberglow", "Architect", ["awakened"]),
  monster("torog-moltenthroat", "Torog Moltenthroat", "Ancestor", ["awakened"], { awakened: 1.1 }),
  monster("akira-karioka", "Akira Karioka", "Ancestor", ["awakened"]),
  monster("ember", "Ember", "Mythic", ["stage1", "stage3"]),
  monster("calida", "Calida", "Mythic", ["stage1", "stage3"]),
  monster("klawax", "Klawax", "Mythic", ["stage1", "stage3"]),
  monster("aquatorum", "Aquatorum", "Mythic", ["stage1", "stage3"]),
  monster("scrappy", "Scrappy", "Mythic", ["stage1", "stage3"]),
  monster("the-cometstorm", "The Cometstorm", "Mythic", ["stage1", "stage3"]),
];

const { rigs: RIGS, animations: ANIMS } = rosterStats(ROSTER);

export const projectMeta: ProjectMeta = {
  title: "Monster Legends — Fire Monsters | Spine 2D Animation",
  eyebrow: "Case study · Social Point",
  summary: summaryFor("Fire"),
  heroTitle: {
    primary: [
      { text: "Monster Legends", color: "white" },
    ],
    subtitle: [
      { text: "Fire Monsters", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D Animation", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: `${ROSTER.length} monsters`, label: "Fire element", icon: "cube" },
    { value: `${ANIMS} animations`, label: "Delivered", icon: "calendar" },
    { value: "Animation · Spine 2D", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Spine 2D rigging & animation from the client's monster art",
    "Idle, walk, attack, skill, special, level-up and knock-out sets",
    "Separate rigs for each evolution stage, up to the Awakened form",
  ],
  overview: {
    body: "Monster Legends lives on its creatures: players collect, breed and evolve hundreds of monsters, and each evolution has to feel like a reward. For the Fire element we rigged and animated every evolution stage of each monster as its own Spine skeleton — a heavier stance and bigger flames at each step, and the Awakened forms pushed furthest with the most motion and secondary animation. Each rig ships the full battle set the game calls for, from idle and walk to attack, skill, level-up and knock-out.",
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
  // Splash AI riêng hệ Fire (scripts/gen-monster-legends-splash.mjs), ref = render Spine trong bài.
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
  // Lava cam cho bậc thường, vàng hổ phách cho Awakened (theme.accentSoft).
  theme: {
    accent: "#ff7a1a",
    accentSoft: "#ffc247",
    heroBackground:
      "radial-gradient(circle at 18% 12%, rgba(255,122,26,0.28), transparent 42%), radial-gradient(circle at 85% 10%, rgba(160,60,170,0.26), transparent 45%), linear-gradient(180deg, #2a1220 0%, #160a10 75%)",
    showcaseSectionBg: "#160a10",
    showcasePanelBg: "#1d0e15",
    sectionLabelBg: "#160a10",
  },
  workflow: WORKFLOW,
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-roster", variant: "sectionLabel", label: "Fire monsters · Animation Spine" },
  {
    id: "stage",
    variant: "spineStage",
    roster: ROSTER,
    background: `${CDN}/arena-v3.webp`,
    // arena-v3 là ảnh ĐẦY ĐỦ; lúc thường chỉ hiện phần giữa (1/1.5) để camera lùi ra tối đa
    // ×1.5 thì nền thu nhỏ theo mà vẫn phủ kín (sếp 2026-10-18). groundY tính theo phần giữa:
    // (groundY_ảnh − 1/6) × 1.5.
    groundY: 0.59,
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
