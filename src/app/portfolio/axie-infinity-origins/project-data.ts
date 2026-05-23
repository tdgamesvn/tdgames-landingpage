import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";


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
    "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/b173c85213385cf6.png",
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
  { id: "m01", variant: "fullGif", src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/ed13a1153491527.63312627874d6.gif" },
  {
    id: "m02",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/5199c8153491527.6331262811cd3.png",
  },
  {
    id: "m03",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/611f6b153491527.633126286340d.png",
  },
  {
    id: "m04",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/d17d07153491527.63312628beefc.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/08e30d153491527.63312628be81b.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/98d247153491527.63312628bf596.gif",
    ],
  },
  {
    id: "m05",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/3c7763153491527.63312629855ac.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/a37c1f153491527.6331262984c04.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/c99571153491527.6331262984211.gif",
    ],
  },
  {
    id: "m06",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/c2035f153491527.6331262a3f8a6.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/b50b3c153491527.6331262a3fdaa.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/aff609153491527.6331262a4025f.gif",
    ],
  },
  {
    id: "m07",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/6d900e153491527.6331262ab6b88.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/e4a655153491527.6331262ab71bd.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/8e799d153491527.6331262ab6501.png",
    ],
  },
  {
    id: "m08",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/9c381b153491527.6331262b5f01d.png",
  },
  {
    id: "m09",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/cb3206153491527.6331262bb27ee.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/84ad62153491527.6331262bb2076.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/ad17cb153491527.6331262bb2f00.gif",
    ],
  },
  {
    id: "m10",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/6ca496153491527.6331262c73543.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/d27aeb153491527.6331262c74452.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/6f0240153491527.6331262c73e41.gif",
    ],
  },
  {
    id: "m11",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/04a104153491527.6331262d04814.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/af4064153491527.6331262d03fde.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/b2e914153491527.6331262d0513c.gif",
    ],
  },
  {
    id: "m12",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/0c85fd153491527.6331262d6d51f.png",
  },
  {
    id: "m13",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/1ee7b8153491527.6331262db2417.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/85e0bc153491527.6331262db1d7f.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/9e8724153491527.6331262db15ea.gif",
    ],
  },
  {
    id: "m14",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/43ca3f153491527.6331262e69908.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/e66cdf153491527.6331262e689f5.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/c7fc99153491527.6331262e6913b.gif",
    ],
  },
  {
    id: "m15",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/af88e7153491527.6331262f45bd0.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/2c3c04153491527.6331262f45421.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/2a1bd5153491527.6331262f44c65.gif",
    ],
  },
  {
    id: "m16",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/9c7f5a153491527.6331262fbbf0a.png",
  },
  {
    id: "m17",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/ac7244153491527.6331263011c0c.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/a2cd2e153491527.633126301271d.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/5ef93d153491527.6331263013259.gif",
    ],
  },
  {
    id: "m18",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/295d87153491527.63312630c2dc7.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/dbcee9153491527.63312630c3930.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/ecf623153491527.63312630c33f8.gif",
    ],
  },
  {
    id: "m19",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/a91ee1153491527.6331263170cce.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/91bde4153491527.63312631719ea.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/e5944e153491527.6331263171368.gif",
    ],
  },
  {
    id: "m20",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/892557153491527.63312631c4038.png",
  },
  {
    id: "m21",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/af3122153491527.633126323b714.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/a6d2ea153491527.633126323b025.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/d48db1153491527.6331263239ae1.gif",
    ],
  },
  {
    id: "m22",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/6c8d83153491527.6331263295a3a.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/03649e153491527.6331263295568.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/4048de153491527.63312632950bd.gif",
    ],
  },
  {
    id: "m23",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/abe93b153491527.6331263317afb.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/d8d81f153491527.6331263318584.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/d681c0153491527.63312633172d6.gif",
    ],
  },
  {
    id: "m24",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/c8d004153491527.6331263374b36.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/a1663f153491527.6331263374648.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/6fb14d153491527.6331263374fd3.gif",
    ],
  },
  {
    id: "m25",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/aa08b7153491527.633126342142b.png",
  },
  {
    id: "m26",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/c67e14153491527.6331263471ab4.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/e22aa6153491527.6331263471386.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/7c6c1a153491527.63312634721a5.gif",
    ],
  },
  {
    id: "m27",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/35fa77153491527.633126351a930.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/038f76153491527.633126351b31c.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/cec9b9153491527.633126351ae47.gif",
    ],
  },
  {
    id: "m28",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/250823153491527.63312635ae3e8.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/d62413153491527.63312635aebbf.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/7ace1f153491527.63312635adc1f.gif",
    ],
  },
  {
    id: "m29",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/b47683153491527.633126362a3d3.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/7195c7153491527.633126362ab8f.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/61efa1153491527.6331263629bee.gif",
    ],
  },
  { id: "m30", variant: "fullGif", src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/dca524153491527.63312636b521b.gif" },
  {
    id: "m31",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/15faa4153491527.6331263759c1e.png",
  },
  {
    id: "m32",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/efda81153491527.633126378f26c.png",
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
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/a70bd6153491527.63312637cde8c.png",
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
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/9a09bc153491527.633126381334c.png",
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
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/a40656153491527.63313250af951.png",
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
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/7b463f2be013bcd3.jpg",
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
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/50a462dee6f25801.jpg",
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
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/bcd3c09a543c36d3.png",
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
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/0a0b35cf8d5e9eb6.png",
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
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/379f981b88c6a84f.png",
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
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/011ed49edb1767f3.png",
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
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/807956f4ca57c6ed.jpg",
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
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/4974242912a7c2f1.png",
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
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/9fed6d92877b5d19.png",
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
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/d4011a345f6c4002.png",
    appreciations: "218",
    views: "3.2K",
  },
];
