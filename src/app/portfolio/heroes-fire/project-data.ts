import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";


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
    "https://tdgamestudio.com/landing/behance/63290b160fe302fc.png",
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
    src: "https://tdgamestudio.com/landing/behance/23fb37250561f256.gif",
  },
  {
    id: "m02",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/b7ad7473f9dc7646.png",
  },
  {
    id: "m03",
    variant: "trio",
    srcs: [
      "https://tdgamestudio.com/landing/behance/c989452762da590b.png",
      "https://tdgamestudio.com/landing/behance/362cab711fd0ba99.gif",
      "https://tdgamestudio.com/landing/behance/c989452762da590b.png",
    ],
  },
  {
    id: "m04",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/5f3ac3a8a6caeec5.gif",
  },
  {
    id: "m05",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/d4f00615ece10b6b.gif",
  },
  {
    id: "m06",
    variant: "trio",
    srcs: [
      "https://tdgamestudio.com/landing/behance/c989452762da590b.png",
      "https://tdgamestudio.com/landing/behance/5ab7782ec42edb56.gif",
      "https://tdgamestudio.com/landing/behance/c989452762da590b.png",
    ],
  },
  {
    id: "m07",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/c8046016d608e62f.gif",
  },
  {
    id: "m08",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/ebaf4737711c6028.gif",
  },
  {
    id: "m09",
    variant: "trio",
    srcs: [
      "https://tdgamestudio.com/landing/behance/c989452762da590b.png",
      "https://tdgamestudio.com/landing/behance/4f8f41d24c6a42b3.gif",
      "https://tdgamestudio.com/landing/behance/c989452762da590b.png",
    ],
  },
  {
    id: "m10",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/9899dd3d75a13caa.gif",
  },
  {
    id: "m11",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/38ab622ed61b11e8.gif",
  },
  {
    id: "m12",
    variant: "trio",
    srcs: [
      "https://tdgamestudio.com/landing/behance/c989452762da590b.png",
      "https://tdgamestudio.com/landing/behance/dd22f025ed2d381c.gif",
      "https://tdgamestudio.com/landing/behance/c989452762da590b.png",
    ],
  },
  {
    id: "m13",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/753ffdc3d2210a7b.gif",
  },
  {
    id: "m14",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/c10f08784e157798.gif",
  },
  {
    id: "m15",
    variant: "trio",
    srcs: [
      "https://tdgamestudio.com/landing/behance/c989452762da590b.png",
      "https://tdgamestudio.com/landing/behance/e79533467d2ff72a.gif",
      "https://tdgamestudio.com/landing/behance/c989452762da590b.png",
    ],
  },
  {
    id: "m16",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/40bc1030a19630d1.gif",
  },
  {
    id: "m17",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/afee0415f0b688ba.gif",
  },
  {
    id: "m18",
    variant: "trio",
    srcs: [
      "https://tdgamestudio.com/landing/behance/c989452762da590b.png",
      "https://tdgamestudio.com/landing/behance/98a787b607ac46f0.gif",
      "https://tdgamestudio.com/landing/behance/c989452762da590b.png",
    ],
  },
  {
    id: "m19",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/e81db50c31a4d1dc.gif",
  },
  {
    id: "m20",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/d9e190cb47ef4303.gif",
  },
  {
    id: "m21",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/5e8305f350113f33.png",
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
      "https://tdgamestudio.com/landing/behance/2bac7de14d05fa8f.png",
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
      "https://tdgamestudio.com/landing/behance/7b463f2be013bcd3.jpg",
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
      "https://tdgamestudio.com/landing/behance/50a462dee6f25801.jpg",
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
      "https://tdgamestudio.com/landing/behance/bcd3c09a543c36d3.png",
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
      "https://tdgamestudio.com/landing/behance/379f981b88c6a84f.png",
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
      "https://tdgamestudio.com/landing/behance/0a0b35cf8d5e9eb6.png",
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
      "https://tdgamestudio.com/landing/behance/807956f4ca57c6ed.jpg",
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
      "https://tdgamestudio.com/landing/behance/4974242912a7c2f1.png",
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
      "https://tdgamestudio.com/landing/behance/9fed6d92877b5d19.png",
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
      "https://tdgamestudio.com/landing/behance/d4011a345f6c4002.png",
    appreciations: "218",
    views: "3.2K",
  },
];
