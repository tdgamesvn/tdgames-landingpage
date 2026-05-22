import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";
import type { SavedShowcaseUiV4 } from "@/components/portfolio/case-study-showcase-with-settings";

const M = "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200";
const D = "https://mir-s3-cdn-cf.behance.net/project_modules/disp";
const MW = "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp";

export const projectMeta: ProjectMeta = {
  title: "Game Animation - Reaper & Lady - Project: OverDrive",
  eyebrow: "Case study",
  summary:
    "Spine 2D combat animation for Shadow Fight / Overdrive-style mobile heroes — Reaper & Lady: splash-ready loops, boss-scale motion, and in-game attack reads tuned for small screens.",
  heroTitle: {
    primary: [
      { text: "Reaper", color: "accent" },
      { text: " & ", color: "muted" },
      { text: "Lady", color: "accentSoft" },
    ],
    subtitle: [
      { text: "Project: OverDrive", color: "soft" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Shadow Fight", color: "muted" },
    ],
  },
  heroFacts: [
    { value: "May 2018", label: "Published", icon: "calendar" },
    { value: "Mobile F2P", label: "Project type", icon: "cube" },
    { value: "", label: "Pipeline", icon: "users" },
  ],
  deliverables: [
    "Hero combat & idle loops",
    "Boss-scale motion passes",
    "In-game ready GIF exports",
  ],
  overview: {
    body: "Game animation pack for Project: OverDrive — Reaper and Lady hero beats built in Spine 2D for mobile combat readability: snappy anticipation, readable silhouettes, and punchy timing aligned with Shadow Fight–style action.",
    stats: [
      { value: "141", label: "Appreciations" },
      { value: "2.7K", label: "Views" },
      { value: "6", label: "Comments" },
      { value: "2", label: "Fields" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/65344203/Game-Animation-Reaper-Lady-Project-OverDrive",
  madeForLabel: "AnimVFX Clan",
  madeForUrl: "https://www.behance.net/AnimVFXClan",
  coverImage: `${MW}/2bd1c365344203.5f702ed1b2566.png`,
  credits: [
    { role: "Animator", name: "Toan Dang" },
    { role: "Studio", name: "TD GAMES" },
  ],
  tools: [],
  fields: ["Visual Effects"],
  tags: [
    "animation",
    "game mobile",
    "Overdrive",
    "Shadow Fight",
    "Spine 2D",
  ],
  theme: {
    accent: "#c084fc",
    accentSoft: "#e9d5ff",
    heroBackground:
      "radial-gradient(circle at 50% 0%, rgba(168,85,247,0.35), transparent 55%), radial-gradient(circle at 80% 20%, rgba(192,132,252,0.12), transparent 45%), linear-gradient(180deg, #14101a 0%, #0a080c 78%)",
    showcaseSectionBg: "#141414",
    showcasePanelBg: "#2b2b2b",
    showcaseMediaBg: "#333333",
    sectionLabelBg: "#2b2b2b",
  },
  workflow: [
    { n: "01", t: "Art prep", sub: "Key poses" },
    { n: "02", t: "Rig & anim", sub: "Spine 2D" },
    { n: "03", t: "Polish", sub: "Timing · hits" },
    { n: "04", t: "Ship", sub: "GIF · build" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "m01", variant: "banner", src: `${MW}/2bd1c365344203.5f702ed1b2566.png` },
  { id: "m02", variant: "banner", src: `${MW}/a5159465344203.5f702ed1b1aa9.png` },
  {
    id: "m03",
    variant: "trio",
    srcs: [
      `${M}/b9682465344203.5af1516c11e2e.gif`,
      `${M}/c590be65344203.5af1516c115dc.gif`,
      `${M}/81246f65344203.5af1516c10977.gif`,
    ],
  },
  {
    id: "m04",
    variant: "duo",
    srcs: [
      `${D}/66f7a565344203.5f702ed174490.gif`,
      `${D}/f25a0765344203.5f702ed173f7f.gif`,
    ],
  },
  { id: "m05", variant: "banner", src: `${MW}/1309dd65344203.5f702ed1b2050.png` },
  {
    id: "m06",
    variant: "trio",
    srcs: [
      `${M}/64f49f65344203.5af1516ceea6b.gif`,
      `${D}/38cf7765344203.5af1516cee55a.gif`,
      `${M}/9eb29065344203.5af1516cef83f.gif`,
    ],
  },
  {
    id: "m07",
    variant: "duo",
    srcs: [
      `${M}/368e6d65344203.5af1516cef172.gif`,
      `${D}/39eba165344203.5af1516cedec1.gif`,
    ],
  },
  { id: "m08", variant: "banner", src: `${MW}/13c8a965344203.5f702ed1b1519.png` },
];

/** Default for first load (when no localStorage showcase exists). */
export const showcaseUiInit: SavedShowcaseUiV4 = {
  v: 4,
  grid: {
    base: { wPx: 220, hPx: 300 },
    sm: { wPx: 540, hPx: 360 },
    md: { wPx: 560, hPx: 420 },
    lg: { wPx: 600, hPx: 460 },
  },
  slots: {
    "m04:0": {
      wPx: 150,
      hPx: 450,
      frameX: -196,
      frameY: 22,
      scale: 1.35,
      stackOrder: 0,
    },
    "m07:1": {
      wPx: 560,
      hPx: 260,
      frameX: -40,
      frameY: 90,
      scale: 1,
      stackOrder: 0,
    },
    "m04:1": {
      wPx: 560,
      hPx: 420,
      frameX: -320,
      frameY: -16,
      scale: 1.3,
      stackOrder: 0,
    },
    "m07:0": {
      wPx: 560,
      hPx: 420,
      frameX: 0,
      frameY: 0,
      scale: 1,
      stackOrder: 1,
    },
    "m06:0": {
      wPx: 270,
      hPx: 330,
      frameX: 2,
      frameY: 16,
      scale: 1.6,
      stackOrder: 0,
    },
  },
  panelHex: projectMeta.theme.showcasePanelBg ?? "",
  mediaHex:
    projectMeta.theme.showcaseMediaBg ??
    projectMeta.theme.showcasePanelBg ??
    "",
};

export const relatedProjects: readonly RelatedProject[] = [
  {
    id: "puzzle-wonderland",
    title: "Character animation for Puzzle Wonderland",
    href: "/portfolio/puzzle-wonderland",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/c93a5b67614633.5fbd2e1664ce9.png",
    appreciations: "239",
    views: "3.4K",
  },
  {
    id: "summoner-era-arena-of-heroes",
    title: "Animation for Summoner Era - Arena of Heroes",
    href: "/portfolio/summoner-era-arena-of-heroes",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/d4a408104755019.5f9b97c0a0f8a.png",
    appreciations: "136",
    views: "2.2K",
  },
  {
    id: "heroes-fire",
    title: "ANIMATION/VFX - HEROES FIRE | SUMMONER ERA",
    href: "/portfolio/heroes-fire",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/d50de7152527397.Y3JvcCwxOTgxLDE1NTAsOSww.png",
    appreciations: "627",
    views: "6.0K",
  },
  {
    id: "game-animation-vfx-3q",
    title: "GAME ANIMATION/VFX - 3Q",
    href: "/portfolio/game-animation-vfx-3q",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/c4e25d143388227.Y3JvcCwxOTgxLDE1NTAsOSww.png",
    appreciations: "193",
    views: "2.5K",
  },
  {
    id: "boss-animation",
    title: "BOSS ANIMATION - THE TWINS",
    href: "/portfolio/boss-animation",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/9e2264152981257.Y3JvcCwxOTgxLDE1NTAsOSww.png",
    appreciations: "261",
    views: "3.0K",
  },
  {
    id: "animation-contest-sky-mavis",
    title: "Animation Contest - Sky Mavis",
    href: "/portfolio/animation-contest-sky-mavis",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/33e83e130561969.Y3JvcCwxOTgxLDE1NTAsOSww.png",
    appreciations: "218",
    views: "3.2K",
  },
  {
    id: "summoner-era",
    title: "ANIMATION/VFX - HEROES LIGHT/DARK | SUMMONER ERA",
    href: "/portfolio/summoner-era",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/a8f476199358443.Y3JvcCwxOTgxLDE1NTAsOSww.jpg",
    appreciations: "208",
    views: "2.3K",
  },
  {
    id: "kayn-snow-moon",
    title: "Kayn Snow Moon | League of Legends - Login Screen",
    href: "/portfolio/kayn-snow-moon",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/5ad036149524063.Y3JvcCwxOTgxLDE1NTAsMCww.png",
    appreciations: "446+",
    views: "7.5K",
  },
];
