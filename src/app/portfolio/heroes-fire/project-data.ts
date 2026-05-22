import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";

const M = "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200";
const D = "https://mir-s3-cdn-cf.behance.net/project_modules/disp";
const B = "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp";

export const projectMeta: ProjectMeta = {
  title: "ANIMATION/VFX - HEROES FIRE | SUMMONER ERA",
  eyebrow: "Case study",
  summary:
    "2D character and VFX for Summoner Era — Fire heroes: in-game attack loops, skill effects, and showcase reels.",
  heroTitle: {
    primary: [
      { text: "Heroes", color: "accent" },
      { text: " " },
      { text: "Fire", color: "accentSoft" },
    ],
    subtitle: [
      { text: "Summoner Era", color: "soft" },
      { text: " · ", color: "divider" },
      { text: "Animation / VFX", color: "accent" },
    ],
  },
  heroFacts: [
    { value: "Sep 2022", label: "Published", icon: "calendar" },
    { value: "Game (Mobile)", label: "Project type", icon: "cube" },
    { value: "", label: "Pipeline", icon: "users" },
  ],
  deliverables: [
    "Hero attack & idle loops",
    "VFX & skill passes",
    "In-game showcase reels",
  ],
  overview: {
    body: "Characters animation and VFX for the Fire heroes of Summoner Era. Each unit ships with idle/attack loops rigged in Spine 2D plus After Effects VFX for skill impacts and signature effects, packaged as in-game motion and promo reels.",
    stats: [
      { value: "627", label: "Appreciations" },
      { value: "6.0K", label: "Views" },
      { value: "26", label: "Comments" },
      { value: "3", label: "Fields" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/152527397/ANIMATIONVFX-HEROES-FIRE-SUMMONER-ERA",
  madeForLabel: "AnimVFX Clan",
  madeForUrl: "https://www.behance.net/AnimVFXClan",
  coverImage:
    "https://mir-s3-cdn-cf.behance.net/projects/max_808/d50de7152527397.Y3JvcCwxOTgxLDE1NTAsOSww.png",
  tools: [],
  fields: ["Visual Effects", "Game Design"],
  tags: [
    "2D",
    "animation",
    "character animation",
    "Character design",
    "concept art",
    "Game Animation",
    "game design",
    "spine",
    "SUMMONER",
    "vfx",
  ],
  theme: {
    accent: "#ffb000",
    accentSoft: "#ff4d2d",
    heroBackground:
      "radial-gradient(circle at top left, rgba(255,77,45,0.20), transparent 40%), radial-gradient(circle at top right, rgba(255,176,0,0.18), transparent 42%), radial-gradient(ellipse at 70% 0%, rgba(255,60,0,0.12), transparent 45%), linear-gradient(180deg, #1a0e0a 0%, #0a0606 75%)",
    showcaseSectionBg: "#191919",
    showcasePanelBg: "#222221",
    sectionLabelBg: "#191919",
  },
  workflow: [
    { n: "01", t: "Concept", sub: "Brief · ref" },
    { n: "02", t: "Rig & Anim", sub: "Spine 2D" },
    { n: "03", t: "VFX", sub: "After Effects" },
    { n: "04", t: "Ship", sub: "In-game reels" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  {
    id: "m01",
    variant: "fullGif",
    src: `${M}/867dc0152527397.631fef2a08432.gif`,
  },
  {
    id: "m02",
    variant: "fullGif",
    src: `${B}/a9be0d152527397.631fef356fdc9.png`,
  },
  {
    id: "m03",
    variant: "trio",
    srcs: [
      `${D}/49d4ff152527397.631fef2aa4da7.png`,
      `${D}/886b95152527397.631fef2aa563b.gif`,
      `${D}/87279a152527397.631fef2aa520b.png`,
    ],
  },
  {
    id: "m04",
    variant: "fullGif",
    src: `${M}/fe5f02152527397.631fef2b3f403.gif`,
  },
  {
    id: "m05",
    variant: "fullGif",
    src: `${M}/066838152527397.631fef2bc8aa7.gif`,
  },
  {
    id: "m06",
    variant: "trio",
    srcs: [
      `${D}/8f9b15152527397.631fef2c79c53.png`,
      `${D}/03e531152527397.631fef2c7a2b8.gif`,
      `${D}/2d24c7152527397.631fef2c795bf.png`,
    ],
  },
  {
    id: "m07",
    variant: "fullGif",
    src: `${M}/a1ad72152527397.631fef2d18308.gif`,
  },
  {
    id: "m08",
    variant: "fullGif",
    src: `${M}/20900d152527397.631fef2da009c.gif`,
  },
  {
    id: "m09",
    variant: "trio",
    srcs: [
      `${D}/121cc9152527397.631fef2e9600a.png`,
      `${D}/430f19152527397.631fef2e966b8.gif`,
      `${D}/ba3eec152527397.631fef2e95911.png`,
    ],
  },
  {
    id: "m10",
    variant: "fullGif",
    src: `${M}/362879152527397.631fef2f15390.gif`,
  },
  {
    id: "m11",
    variant: "fullGif",
    src: `${M}/c50dad152527397.631fef2f831d5.gif`,
  },
  {
    id: "m12",
    variant: "trio",
    srcs: [
      `${D}/a2c204152527397.631fef30389f0.png`,
      `${D}/f742d3152527397.631fef30391b3.gif`,
      `${D}/d798c0152527397.631fef3038324.png`,
    ],
  },
  {
    id: "m13",
    variant: "fullGif",
    src: `${M}/3e582d152527397.631fef30c061f.gif`,
  },
  {
    id: "m14",
    variant: "fullGif",
    src: `${M}/ad0ace152527397.631fef31562ef.gif`,
  },
  {
    id: "m15",
    variant: "trio",
    srcs: [
      `${D}/15973b152527397.631fef31f0084.png`,
      `${D}/00349c152527397.631fef31f0821.gif`,
      `${D}/defe8e152527397.631fef31ef984.png`,
    ],
  },
  {
    id: "m16",
    variant: "fullGif",
    src: `${M}/7c879d152527397.631fef32565a5.gif`,
  },
  {
    id: "m17",
    variant: "fullGif",
    src: `${M}/df2fc9152527397.631fef32c387d.gif`,
  },
  {
    id: "m18",
    variant: "trio",
    srcs: [
      `${D}/b6beca152527397.631fef336af18.png`,
      `${D}/c96f8b152527397.631fef336bd2d.gif`,
      `${D}/25431d152527397.631fef336b5f5.png`,
    ],
  },
  {
    id: "m19",
    variant: "fullGif",
    src: `${M}/e5e0d6152527397.631fef342fbdd.gif`,
  },
  {
    id: "m20",
    variant: "fullGif",
    src: `${M}/e63292152527397.631fef34cb813.gif`,
  },
  {
    id: "m21",
    variant: "fullGif",
    src: `${B}/ad5cf2152527397.631fef3570399.png`,
  },
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
  {
    id: "summoner-era-2020",
    title: "Summoner Era - Login Screen Animations (2020)",
    href: "/portfolio/summoner-era-2020",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/1efef4144430837.Y3JvcCwxOTgxLDE1NTAsOSww.jpg",
    appreciations: "89",
    views: "1.7K",
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
];
