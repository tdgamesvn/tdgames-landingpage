import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";


export const projectMeta: ProjectMeta = {
  title: "Animation for Summoner Era - Arena of Heroes",
  eyebrow: "Case study",
  summary:
    "Cinematic hero showcase for Summoner Era's Arena of Heroes mode. Seven champions, each shipped with a name plate, splash, full battle reel, and a two-up combo loop — built to feed the in-game arena lobby and marketing pipeline.",
  heroTitle: {
    primary: [
      { text: "Arena", color: "accentSoft" },
      { text: " of ", color: "soft" },
      { text: "Heroes", color: "accent" },
    ],
    subtitle: [
      { text: "Animation", color: "soft" },
      { text: " — ", color: "divider" },
      { text: "Summoner Era", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "cinematic hero pack", color: "muted" },
    ],
  },
  heroFacts: [
    { value: "Oct 2020", label: "Published", icon: "calendar" },
    { value: "7 heroes", label: "Roster", icon: "users" },
    { value: "Spine + AE", label: "Pipeline", icon: "cube" },
  ],
  deliverables: [
    "Hero splash + name plates",
    "7 cinematic battle reels",
    "14 combo / VFX loops",
  ],
  overview: {
    body: "A 7-hero spotlight pack for Summoner Era's Arena of Heroes. Each champion ships with a stylised name plate, a full splash banner, a 1400-wide Spine battle reel, plus a two-up GIF combo isolating signature skills. After Effects handled VFX layers and motion graphics; Spine 2D drove the character rig. Output feeds the arena lobby loop and the marketing team's social pipeline.",
    stats: [
      { value: "136", label: "Appreciations" },
      { value: "2.2K", label: "Views" },
      { value: "7", label: "Hero reels" },
      { value: "14+", label: "Combo loops" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/104755019/Animation-for-Summoner-Era-Arena-of-Heroes",
  madeForLabel: "AnimVFX Clan",
  madeForUrl: "https://www.behance.net/AnimVFXClan",
  coverImage: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/1a2bf9c55f457909.png",
  tools: [],
  fields: ["Visual Effects"],
  tags: [
    "after effects",
    "animation",
    "cinematic",
    "effect",
    "game mobile",
    "motion graphics",
    "spine",
    "summoner",
    "character",
  ],
  theme: {
    accent: "#10b981",
    accentSoft: "#facc15",
    heroBackground:
      "radial-gradient(circle at top left, rgba(16,185,129,0.20), transparent 42%), radial-gradient(circle at top right, rgba(250,204,21,0.16), transparent 42%), linear-gradient(180deg, #0a1410 0%, #050708 75%)",
    showcaseSectionBg: "#091410",
    showcasePanelBg: "#0b1d16",
    sectionLabelBg: "#0a1813",
  },
  workflow: [
    { n: "01", t: "Concept", sub: "Sketch" },
    { n: "02", t: "Spine rig", sub: "Spine 2D" },
    { n: "03", t: "VFX", sub: "After Effects" },
    { n: "04", t: "Ship", sub: "Arena loop" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "m01", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/1a2bf9c55f457909.png" },
  { id: "m02", variant: "fullGif", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/089cfaa0e23a921c.gif" },
  { id: "m03", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c15f04daa42e0341.png" },
  { id: "m04", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/d5462666a53b8816.png" },
  { id: "m05", variant: "fullGif", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/489bdd3ca9c98f14.gif" },
  { id: "m06", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/14d2572dd60dd943.png" },
  {
    id: "m07",
    variant: "duo",
    srcs: [
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/da0d0be19681bb8d.gif",
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/21fda68d76487f85.gif",
    ],
  },
  { id: "m08", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/be2b611fda4a9621.png" },
  { id: "m09", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/b0d9634774d8123d.png" },
  { id: "m10", variant: "fullGif", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/2bd0b034cc702650.gif" },
  { id: "m11", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/14d2572dd60dd943.png" },
  {
    id: "m12",
    variant: "duo",
    srcs: [
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/200dcf272e654ef0.gif",
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/170b6a9f29b47ea0.gif",
    ],
  },
  { id: "m13", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/be2b611fda4a9621.png" },
  { id: "m14", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c826e696a5c40358.png" },
  { id: "m15", variant: "fullGif", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/8e3b7915de0c075b.gif" },
  { id: "m16", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/14d2572dd60dd943.png" },
  {
    id: "m17",
    variant: "duo",
    srcs: [
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/041855753462bed2.gif",
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/a975e03f7df629c5.gif",
    ],
  },
  { id: "m18", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/be2b611fda4a9621.png" },
  { id: "m19", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/3e878f8a07dc2bfb.png" },
  { id: "m20", variant: "fullGif", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/9336907e206163df.gif" },
  { id: "m21", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/14d2572dd60dd943.png" },
  {
    id: "m22",
    variant: "duo",
    srcs: [
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/8a3bbd468ad25036.gif",
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/24aed1fa087e7082.gif",
    ],
  },
  { id: "m23", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/be2b611fda4a9621.png" },
  { id: "m24", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/a0bb9d0d8a43ea56.png" },
  { id: "m25", variant: "fullGif", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/0630f7f03357233a.gif" },
  { id: "m26", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/14d2572dd60dd943.png" },
  {
    id: "m27",
    variant: "duo",
    srcs: [
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/2d794a10f09767a4.gif",
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/2144000a913e01e7.gif",
    ],
  },
  { id: "m28", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/be2b611fda4a9621.png" },
  { id: "m29", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/459a09baa1d71f17.png" },
  { id: "m30", variant: "fullGif", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/9ce3089eec2f8216.gif" },
  { id: "m31", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/14d2572dd60dd943.png" },
  {
    id: "m32",
    variant: "duo",
    srcs: [
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/7526707eef2b0021.gif",
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/19365834450c09f0.gif",
    ],
  },
  { id: "m33", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/be2b611fda4a9621.png" },
  { id: "m34", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/a6d2a909275849d8.png" },
  { id: "m35", variant: "fullGif", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/4f899418d731127d.gif" },
  { id: "m36", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/aa2fca14802f8aad.png" },
  { id: "m37", variant: "fullGif", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/87db4e70311ed748.gif" },
  { id: "m38", variant: "banner", src: "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/7af148f4da079814.png" },
] as const;

export const relatedProjects: readonly RelatedProject[] = [
  {
    id: "summoner-era-heroes",
    title: "ANIMATION/VFX - HEROES LIGHT/DARK | SUMMONER ERA",
    href: "/portfolio/summoner-era",
    internal: true as const,
    badge: "Case study",
    image:
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/7b463f2be013bcd3.jpg",
    appreciations: "208",
    views: "2.3K",
  },
  {
    id: "heroes-fire",
    title: "ANIMATION/VFX - HEROES FIRE | SUMMONER ERA",
    href: "/portfolio/heroes-fire",
    internal: true as const,
    badge: "Case study",
    image:
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/011ed49edb1767f3.png",
    appreciations: "627",
    views: "6.0K",
  },
  {
    id: "mid-autumn-summoner-era",
    title: "Mid Autumn Animation for Summoner Era",
    href: "/portfolio/mid-autumn-summoner-era",
    internal: true as const,
    badge: "Case study",
    image:
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/2d586b5a85d5dfb9.jpg",
    appreciations: "161",
    views: "2K",
  },
  {
    id: "summoner-era-2020",
    title: "Summoner Era - Login Screen Animations (2020)",
    href: "/portfolio/summoner-era-2020",
    internal: true as const,
    badge: "Case study",
    image:
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/807956f4ca57c6ed.jpg",
    appreciations: "89",
    views: "1.7K",
  },
  {
    id: "battle-of-the-gods-mytheria",
    title: "Battle of the Gods | Mytheria - Login Screen",
    href: "/portfolio/battle-of-the-gods-mytheria",
    internal: true as const,
    badge: "Case study",
    image:
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/9fed6d92877b5d19.png",
    appreciations: "112",
    views: "1.9K",
  },
  {
    id: "game-animation-vfx-3q",
    title: "GAME ANIMATION/VFX - 3Q",
    href: "/portfolio/game-animation-vfx-3q",
    internal: true as const,
    badge: "Case study",
    image:
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/4974242912a7c2f1.png",
    appreciations: "193",
    views: "2.5K",
  },
  {
    id: "boss-animation",
    title: "BOSS ANIMATION - THE TWINS",
    href: "/portfolio/boss-animation",
    internal: true as const,
    badge: "Case study",
    image:
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/379f981b88c6a84f.png",
    appreciations: "261",
    views: "3.0K",
  },
  {
    id: "animation-contest-sky-mavis",
    title: "Animation Contest - Sky Mavis",
    href: "/portfolio/animation-contest-sky-mavis",
    internal: true as const,
    badge: "Case study",
    image:
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/d4011a345f6c4002.png",
    appreciations: "218",
    views: "3.2K",
  },
];
