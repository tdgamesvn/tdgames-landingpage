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
    "https://cdn.tdgamestudio.com/landing/behance/b173c85213385cf6.png",
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
  { id: "m01", variant: "fullGif", src: "https://cdn.tdgamestudio.com/landing/behance/ecfd71c74d962e66.mp4" },
  {
    id: "m02",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/456c40a3e4e13c4f.png",
  },
  {
    id: "m03",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/dde3b4140b62523e.png",
  },
  {
    id: "m04",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/728da822ec4370c2.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/e1e2d1836d3b53e3.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/374ab6271a79e20c.mp4",
    ],
  },
  {
    id: "m05",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/70310a13ddef660f.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/35cc94cae8fb8e14.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/4dd61a32d0cbceb8.mp4",
    ],
  },
  {
    id: "m06",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/35e6e1d0d3ab469b.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/495bffe69d521af0.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/b69259a39344a45f.mp4",
    ],
  },
  {
    id: "m07",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/22c1a6613653718e.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/c43307ca86796515.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/94fce25509686117.png",
    ],
  },
  {
    id: "m08",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/9bdf412850aa72df.png",
  },
  {
    id: "m09",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/0f06629617870c43.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/d6892cf6867ed235.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/81ef4129bd80f020.mp4",
    ],
  },
  {
    id: "m10",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/42c51cd36fd41127.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/973979e71a312c48.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/8ee1c3f3c9280f45.mp4",
    ],
  },
  {
    id: "m11",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/10ae0c43daa13d77.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/f0070ff832cc8c73.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/1ee011eaa3d180cc.mp4",
    ],
  },
  {
    id: "m12",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/ff260da9db98dc64.png",
  },
  {
    id: "m13",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/f449f4601b14092e.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/774c6e4e37670474.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/2e2fce14282bdffd.mp4",
    ],
  },
  {
    id: "m14",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/83ab0eee28acc5bf.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/e3cac681057575ee.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/44adec86f2f4910a.mp4",
    ],
  },
  {
    id: "m15",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/2cf811a8fdd3551c.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/0fbd113bad761045.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/0e18b712aac80958.mp4",
    ],
  },
  {
    id: "m16",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/8a9964ee736e6257.png",
  },
  {
    id: "m17",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/3861fdd1ed0c1c0e.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/be0194791c808771.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/9342bb167bd1e292.mp4",
    ],
  },
  {
    id: "m18",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/73f32be0e32a9350.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/fcc89dc9b264e9eb.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/2313383f455c4449.mp4",
    ],
  },
  {
    id: "m19",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/4f643e4ea6ea7e45.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/90ababdb53a3daa4.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/5502665d7e5d6f9b.mp4",
    ],
  },
  {
    id: "m20",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/898fbcb43a9a72fa.png",
  },
  {
    id: "m21",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/a276e0f6a19b6df2.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/ef855eeb7864c2cd.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/cff508d40280a7bf.mp4",
    ],
  },
  {
    id: "m22",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/78e1be5d283d80a6.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/3688dc8ae6dbb871.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/d6d791b4759e76d7.mp4",
    ],
  },
  {
    id: "m23",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/19e028cefcba0735.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/fcbe00826fb9b4af.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/1b02be0e3f1e21f9.mp4",
    ],
  },
  {
    id: "m24",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/2f3cff35b03826dd.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/ee203e9d5b33dc14.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/0fc11bf520037987.mp4",
    ],
  },
  {
    id: "m25",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/9553761b32efd93c.png",
  },
  {
    id: "m26",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/d9cd408a6791efb6.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/d5943e35bf69aa46.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/cb86594d77db425c.mp4",
    ],
  },
  {
    id: "m27",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/d71e05fcf4094113.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/9974ed323c927c15.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/6a2190fd9280d726.mp4",
    ],
  },
  {
    id: "m28",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/6e4d1011a2b5bf2b.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/cd3da98e01bfe0d2.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/334e99bd21b6f733.mp4",
    ],
  },
  {
    id: "m29",
    variant: "trio",
    srcs: [
      "https://cdn.tdgamestudio.com/landing/behance/77cf80cf8eff1690.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/fe0077f5c32ebb6e.mp4",
      "https://cdn.tdgamestudio.com/landing/behance/d99022a5be98c7fd.mp4",
    ],
  },
  { id: "m30", variant: "fullGif", src: "https://cdn.tdgamestudio.com/landing/behance/4bc665a4b9896ad1.mp4" },
  {
    id: "m31",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/1657d40b9b95a4fa.png",
  },
  {
    id: "m32",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/7d109fbd451e1a05.png",
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
    src: "https://cdn.tdgamestudio.com/landing/behance/af30b44973b417e6.png",
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
    src: "https://cdn.tdgamestudio.com/landing/behance/70878f36fcbf5acc.png",
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
    src: "https://cdn.tdgamestudio.com/landing/behance/5f5b516afa440c2e.png",
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
      "https://cdn.tdgamestudio.com/landing/behance/7b463f2be013bcd3.jpg",
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
      "https://cdn.tdgamestudio.com/landing/behance/50a462dee6f25801.jpg",
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
      "https://cdn.tdgamestudio.com/landing/behance/bcd3c09a543c36d3.png",
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
      "https://cdn.tdgamestudio.com/landing/behance/0a0b35cf8d5e9eb6.png",
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
      "https://cdn.tdgamestudio.com/landing/behance/379f981b88c6a84f.png",
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
      "https://cdn.tdgamestudio.com/landing/behance/011ed49edb1767f3.png",
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
      "https://cdn.tdgamestudio.com/landing/behance/807956f4ca57c6ed.jpg",
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
      "https://cdn.tdgamestudio.com/landing/behance/4974242912a7c2f1.png",
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
      "https://cdn.tdgamestudio.com/landing/behance/9fed6d92877b5d19.png",
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
      "https://cdn.tdgamestudio.com/landing/behance/d4011a345f6c4002.png",
    appreciations: "218",
    views: "3.2K",
  },
];
