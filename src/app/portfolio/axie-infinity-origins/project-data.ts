import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";

const M = "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200";
const D = "https://mir-s3-cdn-cf.behance.net/project_modules/disp";

export const projectMeta: ProjectMeta = {
  title: "AXIE INFINITY - ORIGINS | ANIMATION",
  eyebrow: "Case study",
  summary:
    "Character work for Axie Infinity: Origins — in-game Axie rigs, attack loops, and showcase reels for Sky Mavis production.",
  heroTitle: {
    primary: [
      { text: "Axie Infinity", color: "accent" },
      { text: " " },
      { text: "Origins", color: "accentSoft" },
    ],
    subtitle: [
      { text: "Animation", color: "soft" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D", color: "soft" },
    ],
  },
  heroFacts: [
    { value: "Sep 2022", label: "Published", icon: "calendar" },
    { value: "Game (Web3)", label: "Project type", icon: "cube" },
    { value: "Ps", label: "Pipeline", icon: "users" },
  ],
  deliverables: [
    "Character work",
    "In-game Axie motion loops",
    "Showcase reels for Origins",
  ],
  overview: {
    body: 'Characters animation for game "AXIE INFINITY - ORIGINS" — Sky Mavis production. Spine 2D rigs and attack/idle loops for the in-game Axie roster, with Photoshop used for texture and pose prep across the pipeline.',
    stats: [
      { value: "1.1K", label: "Appreciations" },
      { value: "12.2K", label: "Views" },
      { value: "47", label: "Comments" },
      { value: "3", label: "Fields" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/153491527/Axie-Infinity-Origins-Animation",
  madeForLabel: "AnimVFX Clan",
  madeForUrl: "https://www.behance.net/AnimVFXClan",
  coverImage:
    "https://mir-s3-cdn-cf.behance.net/projects/max_808/924075153491527.Y3JvcCwxOTgxLDE1NTAsOSww.png",
  tools: [],
  fields: ["Character Design", "Game Design"],
  tags: [
    "2D",
    "animation",
    "axie infinity",
    "cartoon",
    "Character",
    "character animation",
    "Character design",
    "game design",
    "spine",
    "spine animation",
  ],
  theme: {
    accent: "#ff8c3a",
    accentSoft: "#38bdf8",
    heroBackground:
      "radial-gradient(circle at top left, rgba(56,189,248,0.16), transparent 40%), radial-gradient(circle at top right, rgba(255,140,58,0.18), transparent 42%), linear-gradient(180deg, #141414 0%, #0a0a0a 75%)",
    showcaseSectionBg: "#191919",
    showcasePanelBg: "#dbc5a5",
    sectionLabelBg: "#dbc5a5",
  },
  workflow: [
    { n: "01", t: "Rig prep", sub: "Ps · assets" },
    { n: "02", t: "Animate", sub: "Spine 2D" },
    { n: "03", t: "Polish", sub: "Loops · timing" },
    { n: "04", t: "Ship", sub: "In-game reels" },
  ],
};

export const showcaseModules = [
  { id: "m01", variant: "fullGif", src: `${M}/ed13a1153491527.63312627874d6.gif` },
  {
    id: "m02",
    variant: "full",
    src: `${M}/5199c8153491527.6331262811cd3.png`,
  },
  {
    id: "m03",
    variant: "full",
    src: `${M}/611f6b153491527.633126286340d.png`,
  },
  {
    id: "m04",
    variant: "trio",
    srcs: [
      `${D}/d17d07153491527.63312628beefc.gif`,
      `${D}/08e30d153491527.63312628be81b.gif`,
      `${D}/98d247153491527.63312628bf596.gif`,
    ],
  },
  {
    id: "m05",
    variant: "trio",
    srcs: [
      `${D}/3c7763153491527.63312629855ac.gif`,
      `${D}/a37c1f153491527.6331262984c04.gif`,
      `${D}/c99571153491527.6331262984211.gif`,
    ],
  },
  {
    id: "m06",
    variant: "trio",
    srcs: [
      `${D}/c2035f153491527.6331262a3f8a6.gif`,
      `${D}/b50b3c153491527.6331262a3fdaa.gif`,
      `${D}/aff609153491527.6331262a4025f.gif`,
    ],
  },
  {
    id: "m07",
    variant: "trio",
    srcs: [
      `${D}/6d900e153491527.6331262ab6b88.gif`,
      `${D}/e4a655153491527.6331262ab71bd.gif`,
      `${D}/8e799d153491527.6331262ab6501.png`,
    ],
  },
  {
    id: "m08",
    variant: "full",
    src: `${M}/9c381b153491527.6331262b5f01d.png`,
  },
  {
    id: "m09",
    variant: "trio",
    srcs: [
      `${D}/cb3206153491527.6331262bb27ee.gif`,
      `${D}/84ad62153491527.6331262bb2076.gif`,
      `${D}/ad17cb153491527.6331262bb2f00.gif`,
    ],
  },
  {
    id: "m10",
    variant: "trio",
    srcs: [
      `${D}/6ca496153491527.6331262c73543.gif`,
      `${D}/d27aeb153491527.6331262c74452.gif`,
      `${D}/6f0240153491527.6331262c73e41.gif`,
    ],
  },
  {
    id: "m11",
    variant: "trio",
    srcs: [
      `${D}/04a104153491527.6331262d04814.gif`,
      `${D}/af4064153491527.6331262d03fde.gif`,
      `${D}/b2e914153491527.6331262d0513c.gif`,
    ],
  },
  {
    id: "m12",
    variant: "full",
    src: `${M}/0c85fd153491527.6331262d6d51f.png`,
  },
  {
    id: "m13",
    variant: "trio",
    srcs: [
      `${D}/1ee7b8153491527.6331262db2417.gif`,
      `${D}/85e0bc153491527.6331262db1d7f.gif`,
      `${D}/9e8724153491527.6331262db15ea.gif`,
    ],
  },
  {
    id: "m14",
    variant: "trio",
    srcs: [
      `${D}/43ca3f153491527.6331262e69908.gif`,
      `${D}/e66cdf153491527.6331262e689f5.gif`,
      `${D}/c7fc99153491527.6331262e6913b.gif`,
    ],
  },
  {
    id: "m15",
    variant: "trio",
    srcs: [
      `${D}/af88e7153491527.6331262f45bd0.gif`,
      `${D}/2c3c04153491527.6331262f45421.gif`,
      `${D}/2a1bd5153491527.6331262f44c65.gif`,
    ],
  },
  {
    id: "m16",
    variant: "full",
    src: `${M}/9c7f5a153491527.6331262fbbf0a.png`,
  },
  {
    id: "m17",
    variant: "trio",
    srcs: [
      `${D}/ac7244153491527.6331263011c0c.gif`,
      `${D}/a2cd2e153491527.633126301271d.gif`,
      `${D}/5ef93d153491527.6331263013259.gif`,
    ],
  },
  {
    id: "m18",
    variant: "trio",
    srcs: [
      `${D}/295d87153491527.63312630c2dc7.gif`,
      `${D}/dbcee9153491527.63312630c3930.gif`,
      `${D}/ecf623153491527.63312630c33f8.gif`,
    ],
  },
  {
    id: "m19",
    variant: "trio",
    srcs: [
      `${D}/a91ee1153491527.6331263170cce.gif`,
      `${D}/91bde4153491527.63312631719ea.gif`,
      `${D}/e5944e153491527.6331263171368.gif`,
    ],
  },
  {
    id: "m20",
    variant: "full",
    src: `${M}/892557153491527.63312631c4038.png`,
  },
  {
    id: "m21",
    variant: "trio",
    srcs: [
      `${D}/af3122153491527.633126323b714.gif`,
      `${D}/a6d2ea153491527.633126323b025.gif`,
      `${D}/d48db1153491527.6331263239ae1.gif`,
    ],
  },
  {
    id: "m22",
    variant: "trio",
    srcs: [
      `${D}/6c8d83153491527.6331263295a3a.gif`,
      `${D}/03649e153491527.6331263295568.gif`,
      `${D}/4048de153491527.63312632950bd.gif`,
    ],
  },
  {
    id: "m23",
    variant: "trio",
    srcs: [
      `${D}/abe93b153491527.6331263317afb.gif`,
      `${D}/d8d81f153491527.6331263318584.gif`,
      `${D}/d681c0153491527.63312633172d6.gif`,
    ],
  },
  {
    id: "m24",
    variant: "trio",
    srcs: [
      `${D}/c8d004153491527.6331263374b36.gif`,
      `${D}/a1663f153491527.6331263374648.gif`,
      `${D}/6fb14d153491527.6331263374fd3.gif`,
    ],
  },
  {
    id: "m25",
    variant: "full",
    src: `${M}/aa08b7153491527.633126342142b.png`,
  },
  {
    id: "m26",
    variant: "trio",
    srcs: [
      `${D}/c67e14153491527.6331263471ab4.gif`,
      `${D}/e22aa6153491527.6331263471386.gif`,
      `${D}/7c6c1a153491527.63312634721a5.gif`,
    ],
  },
  {
    id: "m27",
    variant: "trio",
    srcs: [
      `${D}/35fa77153491527.633126351a930.gif`,
      `${D}/038f76153491527.633126351b31c.gif`,
      `${D}/cec9b9153491527.633126351ae47.gif`,
    ],
  },
  {
    id: "m28",
    variant: "trio",
    srcs: [
      `${D}/250823153491527.63312635ae3e8.gif`,
      `${D}/d62413153491527.63312635aebbf.gif`,
      `${D}/7ace1f153491527.63312635adc1f.gif`,
    ],
  },
  {
    id: "m29",
    variant: "trio",
    srcs: [
      `${D}/b47683153491527.633126362a3d3.gif`,
      `${D}/7195c7153491527.633126362ab8f.gif`,
      `${D}/61efa1153491527.6331263629bee.gif`,
    ],
  },
  { id: "m30", variant: "fullGif", src: `${M}/dca524153491527.63312636b521b.gif` },
  {
    id: "m31",
    variant: "full",
    src: `${M}/15faa4153491527.6331263759c1e.png`,
  },
  {
    id: "m32",
    variant: "full",
    src: `${M}/efda81153491527.633126378f26c.png`,
  },
  {
    id: "m33",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/753468610?h=9d8333de6f&autoplay=1&loop=1&color=3F3F3F&title=0&byline=0&portrait=0&muted=1",
    aspectRatio: 16 / 9,
  },
  {
    id: "m34",
    variant: "full",
    src: `${M}/a70bd6153491527.63312637cde8c.png`,
  },
  {
    id: "m35",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/753466137?h=b7c9977c80&autoplay=1&loop=1&color=3F3F3F&title=0&byline=0&portrait=0&muted=1",
    aspectRatio: 16 / 9,
  },
  {
    id: "m36",
    variant: "full",
    src: `${M}/9a09bc153491527.633126381334c.png`,
  },
  {
    id: "m37",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/753466039?h=2eda8ee346&autoplay=1&loop=1&color=3F3F3F&title=0&byline=0&portrait=0&muted=1",
    aspectRatio: 16 / 9,
  },
  {
    id: "m38",
    variant: "full",
    src: `${M}/a40656153491527.63313250af951.png`,
  },
] as readonly ShowcaseModule[];

export const relatedProjects: readonly RelatedProject[] = [
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
