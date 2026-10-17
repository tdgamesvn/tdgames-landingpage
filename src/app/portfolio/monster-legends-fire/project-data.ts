import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
  SpineMonster,
  SpineTier,
} from "@/components/portfolio/case-study-types";
import { relatedProjects as epicRelated } from "../epic-card/project-data";

const CDN = "https://cdn.tdgamestudio.com/landing/portfolio/monster-legends-fire";
// SpinePlayer tải qua proxy cùng origin (né CORS), như Spine ở trang chủ.
const SPINE = "/api/cdn-proxy/landing/portfolio/monster-legends-fire/spine-v2";

// Nguồn: media-inbox/Monster Legend/Fire (2026-10-17), upload bằng
// scripts/upload-monster-legends.mjs Fire. Sếp chốt: chỉ show nhân vật, bỏ fx_ultimate +
// avatar. Bậc: base (_1) → evolved (_3) → awakened (cao nhất). Mỗi hệ một trang riêng —
// hệ sau copy file này, đổi CDN/SPINE/ROSTER/theme + nền scripts/gen-monster-legends-bg.mjs.
const BASE_ANIMS = ["breathe", "walk", "special1", "levelup"] as const;
const FULL_ANIMS = ["breathe", "walk", "attack", "attack_skill", "special1", "levelup", "prone"] as const;

const TIER: Record<"stage1" | "stage3" | "awakened", Omit<SpineTier, "base">> = {
  stage1: { key: "stage1", label: "Base", animations: BASE_ANIMS },
  stage3: { key: "stage3", label: "Evolved", animations: FULL_ANIMS },
  awakened: { key: "awakened", label: "Awakened", animations: FULL_ANIMS, highlight: true },
};

const monster = (
  id: string,
  name: string,
  rank: string,
  tiers: readonly (keyof typeof TIER)[],
): SpineMonster => ({
  id,
  name,
  rank,
  tiers: tiers.map((t) => ({ ...TIER[t], base: `${SPINE}/${id}/${t}` })),
});

// Thứ tự: con 3 bậc + Awakened lên đầu (khoe nhiều nhất), Mythic theo sau.
const ROSTER: readonly SpineMonster[] = [
  monster("kennix-solaris", "Kennix Solaris", "Architect", ["stage1", "stage3", "awakened"]),
  monster("kaih-the-pyrenaut", "Kaih the Pyrenaut", "Architect", ["stage1", "stage3", "awakened"]),
  monster("shallinar-emberglow", "Shallinar Emberglow", "Architect", ["awakened"]),
  monster("torog-moltenthroat", "Torog Moltenthroat", "Ancestor", ["awakened"]),
  monster("akira-karioka", "Akira Karioka", "Ancestor", ["awakened"]),
  monster("ember", "Ember", "Mythic", ["stage1", "stage3"]),
  monster("calida", "Calida", "Mythic", ["stage1", "stage3"]),
  monster("klawax", "Klawax", "Mythic", ["stage1", "stage3"]),
  monster("aquatorum", "Aquatorum", "Mythic", ["stage1", "stage3"]),
  monster("scrappy", "Scrappy", "Mythic", ["stage1", "stage3"]),
  monster("the-cometstorm", "The Cometstorm", "Mythic", ["stage1", "stage3"]),
];

const RIGS = ROSTER.reduce((n, m) => n + m.tiers.length, 0);
const ANIMS = ROSTER.reduce((n, m) => n + m.tiers.reduce((k, t) => k + t.animations.length, 0), 0);

export const projectMeta: ProjectMeta = {
  title: "Monster Legends — Fire Monsters | Spine 2D Animation",
  eyebrow: "Case study · Social Point",
  summary: `${ROSTER.length} Fire-element monsters from Social Point's Monster Legends, animated in Spine 2D across every evolution stage — from the base form to the Awakened. Every one below is running live in your browser.`,
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
  coverImage: `${CDN}/splash.jpg`,
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
  workflow: [
    { n: "01", t: "Art Breakdown", sub: "Cut client art into parts" },
    { n: "02", t: "Rigging", sub: "One skeleton per evolution" },
    { n: "03", t: "Animation", sub: "Full battle set" },
    { n: "04", t: "In-Game Check", sub: "Scale, timing, export" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-roster", variant: "sectionLabel", label: "Fire monsters · live Spine" },
  {
    id: "stage",
    variant: "spineStage",
    roster: ROSTER,
    background: `${CDN}/arena-v2.webp`,
    // Đo trên ảnh arena-v2 (tâm vùng sáng của sàn).
    groundY: 0.63,
    logo: `${CDN}/logo.webp`,
    animationLabels: {
      breathe: "Idle",
      walk: "Walk",
      attack: "Attack",
      attack_skill: "Skill",
      special1: "Special",
      levelup: "Level up",
      prone: "Knocked out",
    },
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
