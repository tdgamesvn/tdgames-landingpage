import type {
  CutsceneItem,
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";
import { relatedProjects as yomiRelated } from "../yomi-2/project-data";

const CDN = "https://cdn.tdgamestudio.com/landing/portfolio/epic-card";
const clip = (slug: string, title: string, kicker?: string): CutsceneItem => ({
  src: `${CDN}/${slug}.mp4`,
  poster: `${CDN}/${slug}.jpg`,
  title,
  kicker,
});

/** In-game battle captures, normalised to 1280×764 for web. */
const CLIP_ASPECT = 1280 / 764;

export const projectMeta: ProjectMeta = {
  title: "Epic Card — Spine 2D In-Game VFX",
  eyebrow: "Case study · Client work",
  summary:
    "A full library of Spine 2D battle VFX for an anime card battler — attacks, buffs, debuffs and status effects built to read clearly on a busy combat screen.",
  heroTitle: {
    primary: [
      { text: "Epic", color: "white" },
      { text: " " },
      { text: "Card", color: "accent" },
    ],
    subtitle: [
      { text: "In-Game VFX", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: "17 effects", label: "Delivered", icon: "cube" },
    { value: "Card battler", label: "Project type", icon: "calendar" },
    { value: "VFX · Spine 2D", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Skill & attack VFX in Spine 2D",
    "Buff / debuff / status effects",
    "Card-side hit & status feedback",
  ],
  showOverviewSection: true,
  overview: {
    body: "All effects were built in Spine 2D, so they run natively in the game engine as lightweight skeletal animations instead of heavy video or sprite sheets. Every effect plays twice: once on the battlefield and once on the character card in the party bar, so players always know who was hit, healed or crowd-controlled. We designed a consistent colour language — red for bleed, orange for burn, green for poison and heal, blue for shields and immunity — and tuned timing so each effect lands in 1–6 seconds without slowing the turn flow.",
    stats: [
      { value: "17", label: "Effects" },
      { value: "6", label: "Attack skills" },
      { value: "11", label: "Status & buffs" },
      { value: "Spine 2D", label: "Built with" },
    ],
  },
  behanceUrl: "",
  coverImage: `${CDN}/magic-orb.jpg`,
  coverVideo: `${CDN}/magic-orb.mp4`,
  coverPosition: "center",
  tools: ["Spine 2D"],
  fields: ["Visual Effects", "Spine 2D"],
  tags: [
    "game vfx",
    "card game",
    "status effects",
    "skill vfx",
    "spine",
    "spine 2D vfx",
    "Epic Card",
  ],
  theme: {
    accent: "#ffb020",
    accentSoft: "#5ad1ff",
    heroBackground:
      "radial-gradient(circle at top left, rgba(255,176,32,0.18), transparent 42%), radial-gradient(circle at top right, rgba(90,209,255,0.14), transparent 44%), linear-gradient(180deg, #0b0d12 0%, #060708 75%)",
    showcaseSectionBg: "#0b0c0f",
    showcasePanelBg: "#121318",
    sectionLabelBg: "#0b0c0f",
  },
  workflow: [
    { n: "01", t: "Effect List", sub: "Skills & status matrix" },
    { n: "02", t: "Visual Language", sub: "Colour & shape per effect" },
    { n: "03", t: "Spine Build", sub: "Rig, timing, impact" },
    { n: "04", t: "In-Game Polish", sub: "Engine integration & QA" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-attacks", variant: "sectionLabel", label: "Attack Skills" },
  {
    id: "attacks",
    variant: "cutsceneGrid",
    aspect: CLIP_ASPECT,
    items: [
      clip("basic-attack-slash", "Slash", "Basic Attack"),
      clip("basic-attack-thrust", "Thrust", "Basic Attack"),
      clip("smash", "Smash", "Skill"),
      clip("magic-orb", "Magic Orb", "Skill"),
      clip("bullet-gun", "Bullet Gun", "Skill"),
      clip("rocket-launcher", "Rocket Launcher", "Skill"),
    ],
  },
  { id: "label-status", variant: "sectionLabel", label: "Status Effects & Buffs" },
  {
    id: "status",
    variant: "cutsceneGrid",
    aspect: CLIP_ASPECT,
    items: [
      clip("burn", "Burn", "Debuff"),
      clip("bleed", "Bleed", "Debuff"),
      clip("poison", "Poison", "Debuff"),
      clip("stun", "Stun", "Control"),
      clip("stat-debuff", "Stat Debuff", "Debuff"),
      clip("stat-buff", "Stat Buff", "Buff"),
      clip("heal", "Heal", "Buff"),
      clip("shield-invincibility", "Invincibility Shield", "Buff"),
      clip("debuff-immunity", "Debuff Immunity", "Buff"),
      clip("stealth", "Stealth", "Buff"),
      clip("counter-impact", "Counter", "Reaction"),
    ],
  },
  {
    id: "closing",
    variant: "closing",
    text: "Every turn,",
    highlight: "readable at a glance.",
    backgroundVideo: `${CDN}/rocket-launcher.mp4`,
    backgroundPoster: `${CDN}/rocket-launcher.jpg`,
    cta: { label: "Ask for similar work", href: "/contact" },
  },
];

export const relatedProjects: readonly RelatedProject[] = yomiRelated;
