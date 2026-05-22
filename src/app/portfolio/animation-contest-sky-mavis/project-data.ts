import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";

const M = "https://mir-s3-cdn-cf.behance.net/project_modules/1400";
const MW = "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp";

export const projectMeta: ProjectMeta = {
  title: "Animation Contest - Sky Mavis",
  eyebrow: "Case study",
  summary:
    "Entry for the Sky Mavis Contest. A short cinematic reel and three character action loops showcasing combat timing, secondary motion, and stylised VFX.",
  heroTitle: {
    primary: [
      { text: "Animation", color: "soft" },
      { text: " " },
      { text: "Contest", color: "accent" },
    ],
    subtitle: [
      { text: "Sky Mavis", color: "white" },
      { text: " · ", color: "divider" },
      { text: "Reel + Loops", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: "Nov 2021", label: "Published", icon: "calendar" },
    { value: "Contest entry", label: "Project type", icon: "cube" },
    { value: "", label: "Pipeline", icon: "users" },
  ],
  deliverables: [
    "Cinematic reel (Vimeo)",
    "3 character action loops",
    "End-card banner",
  ],
  overview: {
    body: "Our submission for the Sky Mavis animation contest. We rigged the heroes in Spine 2D, layered VFX in After Effects, and packaged the result into a cinematic reel plus three looping action GIFs.",
    stats: [
      { value: "218", label: "Appreciations" },
      { value: "3.2K", label: "Views" },
      { value: "3", label: "Hero loops" },
      { value: "1", label: "Cinematic" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/130561969/Animation-Contest-Sky-Mavis",
  madeForLabel: "AnimVFX Clan",
  madeForUrl: "https://www.behance.net/AnimVFXClan",
  coverImage:
    "https://mir-s3-cdn-cf.behance.net/projects/max_808/33e83e130561969.Y3JvcCwxOTgxLDE1NTAsOSww.png",
  tools: [],
  fields: ["Visual Effects", "Character Design"],
  tags: [
    "2D animation",
    "after effects",
    "animation",
    "character design",
    "concept art",
    "game",
    "spine",
    "spine 2D",
    "vfx",
  ],
  theme: {
    accent: "#10b981",
    accentSoft: "#6ee7b7",
    heroBackground:
      "radial-gradient(circle at top left, rgba(16,185,129,0.15), transparent 38%), radial-gradient(circle at top right, rgba(110,231,183,0.12), transparent 40%), radial-gradient(ellipse at 60% 0%, rgba(6,78,59,0.18), transparent 45%), linear-gradient(180deg, #0f1a1a 0%, #070a0a 75%)",
    showcaseSectionBg: "#141414",
    showcasePanelBg: "#1a1a1a",
    sectionLabelBg: "#141414",
  },
  workflow: [
    { n: "01", t: "Brief", sub: "Concept" },
    { n: "02", t: "Spine", sub: "Rig + cycle" },
    { n: "03", t: "VFX", sub: "After Effects" },
    { n: "04", t: "Reel", sub: "Render" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "m01", variant: "banner", src: `${MW}/a11525130561969.6182bc9d17db5.png` },
  {
    id: "m02",
    variant: "video",
    src: "https://player.vimeo.com/video/642207661?h=f7b128ae87&badge=0&autopause=0",
  },
  { id: "m03", variant: "fullGif", src: `${M}/bba1b6130561969.61840263c5a08.gif` },
  { id: "m04", variant: "fullGif", src: `${M}/8c1bc0130561969.61840263c50e3.gif` },
  { id: "m05", variant: "fullGif", src: `${M}/aa18d4130561969.61840263c4916.gif` },
  { id: "m06", variant: "fullGif", src: `${M}/31cb6e130561969.61840263c67c3.gif` },
];

export const relatedProjects: readonly RelatedProject[] = [
  {
    id: "axie-infinity-origins",
    title: "Axie Infinity - Origins | Animation",
    href: "/portfolio/axie-infinity-origins",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/924075153491527.Y3JvcCwxOTgxLDE1NTAsOSww.png",
    appreciations: "1.1K",
    views: "12.2K",
  },
  {
    id: "lore-axie-origin",
    title: "LORE AXIE ORIGIN | CINEMATIC",
    href: "/portfolio/lore-axie-origin",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/501fca163362313.Y3JvcCwxOTgxLDE1NTAsOSww.png",
    appreciations: "138",
    views: "1.8K",
  },
  {
    id: "battle-of-the-gods-mytheria",
    title: "Battle of the Gods | Mytheria - Login Screen",
    href: "/portfolio/battle-of-the-gods-mytheria",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/d5b456134047127.Y3JvcCwyMzkyLDE4NzAsMCww.png",
    appreciations: "112",
    views: "1.9K",
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
    id: "summoner-era-heroes",
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
    id: "horse-racing",
    title: "Horse Racing - Splash Art Animation",
    href: "/portfolio/horse-racing",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/cad425183792791.Y3JvcCwyMzkyLDE4NzAsMCww.jpg",
    appreciations: "143",
    views: "1.7K",
  },
  {
    id: "kayn-snow-moon",
    title: "Kayn Snow Moon | League of Legends - Login Screen",
    href: "/portfolio/kayn-snow-moon",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/5ad036149524063.Y3JvcCwxOTgxLDE1NTAsMCww.png",
    appreciations: "446",
    views: "7.5K",
  },
];
