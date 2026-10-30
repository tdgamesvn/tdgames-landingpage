import type {
  CutsceneItem,
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";
import { relatedProjects as sharedRelated } from "../game-animation-vfx-3q/project-data";

const CDN = "https://cdn.tdgamestudio.com/landing/portfolio/yomi-2";
const clip = (slug: string, title: string, kicker?: string): CutsceneItem => ({
  src: `${CDN}/${slug}.mp4`,
  poster: `${CDN}/${slug}.jpg`,
  title,
  kicker,
});

/** Ultra-wide 3840×1666 masters, delivered at 1920 for web. */
const CLIP_ASPECT = 3840 / 1666;

export const projectMeta: ProjectMeta = {
  title: "Yomi 2 — Super Move Cutscenes",
  eyebrow: "Case study · Client work",
  summary:
    "18 ultra-wide super-move cutscenes for a 2D fighting game — TD Games handled the animation, motion graphics and VFX that turn every finisher into a cinematic beat.",
  heroTitle: {
    primary: [
      { text: "Yomi", color: "white" },
      { text: " " },
      { text: "2", color: "accent" },
    ],
    subtitle: [
      { text: "Animation", color: "soft" },
      { text: " · ", color: "divider" },
      { text: "Motion Graphics", color: "accentSoft" },
      { text: " · ", color: "divider" },
      { text: "VFX", color: "accent" },
    ],
  },
  heroFacts: [
    { value: "18 cutscenes", label: "Delivered", icon: "cube" },
    { value: "Fighting game", label: "Project type", icon: "calendar" },
    { value: "Anim · MG · VFX", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Super-move cutscene animation",
    "Motion graphics & camera moves",
    "2D VFX & compositing",
  ],
  showOverviewSection: true,
  overview: {
    body: "Each super move gets a 4–6 second cinematic cut-in: a dynamic camera push, punchy key poses on the client's illustrated characters, and layered hand-drawn VFX — fire, lightning, ice shards and energy bursts — composited for a 4K ultra-wide frame that reads instantly mid-match.",
    stats: [
      { value: "18", label: "Cutscenes" },
      { value: "9", label: "Characters" },
      { value: "4K", label: "Ultra-wide master" },
      { value: "3", label: "Disciplines" },
    ],
  },
  behanceUrl: "",
  coverImage: `${CDN}/gwen-desperation.jpg`,
  coverVideo: `${CDN}/gwen-desperation.mp4`,
  coverPosition: "center",
  tools: [],
  fields: ["Animation", "Motion Graphics", "Visual Effects"],
  tags: [
    "2D Animation",
    "cutscene",
    "super move",
    "fighting game",
    "motion graphics",
    "vfx",
    "Yomi 2",
  ],
  theme: {
    accent: "#ff4d5e",
    accentSoft: "#ffb547",
    heroBackground:
      "radial-gradient(circle at top left, rgba(255,77,94,0.18), transparent 42%), radial-gradient(circle at top right, rgba(255,181,71,0.14), transparent 44%), radial-gradient(ellipse at 60% 0%, rgba(139,92,246,0.10), transparent 50%), linear-gradient(180deg, #120a0c 0%, #070506 75%)",
    showcaseSectionBg: "#0d0b0c",
    showcasePanelBg: "#141112",
    sectionLabelBg: "#0d0b0c",
  },
  workflow: [
    { n: "01", t: "Storyboard", sub: "Shot & camera plan" },
    { n: "02", t: "Animation", sub: "Key poses & timing" },
    { n: "03", t: "Motion Graphics", sub: "Camera & impact frames" },
    { n: "04", t: "VFX & Comp", sub: "4K ultra-wide delivery" },
  ],
};

// Mỗi hàng = 1 nhân vật (2 chiêu) trên desktop.
export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-roster", variant: "sectionLabel", label: "Super Move Cutscenes" },
  {
    id: "cutscenes",
    variant: "cutsceneGrid",
    aspect: CLIP_ASPECT,
    items: [
      clip("gwen-desperation", "Desperation", "Gwen"),
      clip("gwen-ice-shards", "Ice Shards", "Gwen"),
      clip("bigby-long-arm-of-the-law", "Long Arm of the Law", "Bigby"),
      clip("bigby-sovereign-immunity", "Sovereign Immunity", "Bigby"),
      clip("gloria-sun-and-moon", "Sun and Moon", "Gloria"),
      clip("gloria-overdose", "Overdose", "Gloria"),
      clip("onimaru-clockwork-soldiers", "Clockwork Soldiers", "Onimaru"),
      clip("onimaru-martial-law", "Martial Law", "Onimaru"),
      clip("mistresss-command", "Mistress's Command", "Persephone"),
      clip("on-your-knees", "On Your Knees", "Persephone"),
      clip("quince-patriot-mirror", "Patriot Mirror", "Quince"),
      clip("quince-consent-of-the-governed", "Consent of the Governed", "Quince"),
      clip("bbb-beta-thrust", "Beta Thrust", "BBB"),
      clip("bbb-piston-hurricane", "Piston Hurricane", "BBB"),
      clip("vendetta-surgical-strike", "Surgical Strike", "Vendetta"),
      clip("vendetta-maximum-ven", "Maximum Ven", "Vendetta"),
      clip("zane-slipstream-phase", "Slipstream Phase", "Zane"),
      clip("zane-maximum-anarchy", "Maximum Anarchy", "Zane"),
    ],
  },
  {
    id: "closing",
    variant: "closing",
    text: "Every finisher,",
    highlight: "a cinematic moment.",
    backgroundVideo: `${CDN}/vendetta-maximum-ven.mp4`,
    backgroundPoster: `${CDN}/vendetta-maximum-ven.jpg`,
    cta: { label: "Ask for similar work", href: "/contact" },
  },
];

const RELATED_IDS = [
  "lore-axie-origin",
  "heroes-fire",
  "summoner-era-heroes",
  "boss-animation",
  "axie-infinity-origins",
  "kayn-snow-moon",
];

export const relatedProjects: readonly RelatedProject[] = [
  {
    id: "game-animation-vfx-3q",
    title: "Game Animation/VFX - 3Q",
    href: "/portfolio/game-animation-vfx-3q",
    internal: true,
    badge: "Case study",
    image: "https://cdn.tdgamestudio.com/landing/behance/16c4384f424d1e42.png",
    appreciations: "193",
    views: "2.5K",
  },
  ...sharedRelated.filter((p) => RELATED_IDS.includes(p.id)),
];
