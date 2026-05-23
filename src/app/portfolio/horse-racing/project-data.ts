import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";

export const projectMeta: ProjectMeta = {
  title: "Horse Racing - Splash Art Animation",
  eyebrow: "Case study",
  summary:
    "Partnership with INVINCIBLE GG to bring their painted horse racing key art to life - character motion, environmental FX, and atmospheric passes integrated into a looping splash for their owners club site.",
  showOverviewSection: false,
  heroTitle: {
    primary: [
      { text: "Horse", color: "accent" },
      { text: " ", color: "white" },
      { text: "Racing", color: "accentSoft" },
    ],
    subtitle: [{ text: "Splash Art / Animation", color: "soft" }],
  },
  heroFacts: [
    { value: "Nov 2023", label: "Published", icon: "calendar" },
    { value: "Client work", label: "Project type", icon: "users" },
    { value: "Ps", label: "Pipeline", icon: "cube" },
  ],
  deliverables: [
    "Hero splash art",
    "FX integration over key art",
    "Looping web-ready renders",
  ],
  overview: {
    body: "Partnership with INVINCIBLE GG to bring their painted horse racing key art to life - character motion, environmental FX, and atmospheric passes integrated into a looping splash for their owners club site.",
    stats: [
      { value: "143+", label: "Appreciations" },
      { value: "1.7K", label: "Views" },
      { value: "6", label: "Comments" },
      { value: "3", label: "Tools" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/183792791/Horse-Racing-Slpash-Art-Animation",
  madeForLabel: "INVINCIBLE GG - Owners Club",
  madeForUrl: "https://ownersclub.invinciblegg.com/",
  coverImage:
    "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/50a462dee6f25801.jpg",
  tools: [],
  fields: [],
  tags: [
    "animation",
    "character animation",
    "splash animation",
    "vfx",
    "motion graphics",
    "creature",
    "Digital Art",
    "Video Games",
    "login screen",
    "nft",
  ],
  theme: {
    accent: "#ec4899",
    accentSoft: "#06b6d4",
    heroBackground:
      "radial-gradient(circle at top left, rgba(236,72,153,0.16), transparent 36%), radial-gradient(circle at top right, rgba(6,182,212,0.16), transparent 38%), linear-gradient(180deg, #141414 0%, #0a0a0a 75%)",
    showcaseSectionBg: "#191919",
    showcasePanelBg: "#222221",
    sectionLabelBg: "#191919",
  },
  workflow: [
    { n: "01", t: "Brief & refs", sub: "Splash / client mood" },
    { n: "02", t: "Animate", sub: "Spine 2D" },
    { n: "03", t: "FX & Comp", sub: "After Effects" },
    { n: "04", t: "Deliver", sub: "Web loop / QA" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  {
    id: "m01",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/880813664?badge=0&autoplay=1&loop=1&muted=1&title=0&byline=0&portrait=0&dnt=1",
    aspectRatio: 2560 / 1260,
  },
  {
    id: "m02",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/880812493?badge=0&autoplay=1&loop=1&muted=1&title=0&byline=0&portrait=0&dnt=1",
    aspectRatio: 2560 / 1360,
  },
  {
    id: "m03",
    variant: "closing",
    text: "THANK FOR WATCHING!!",
    size: "lg",
    color: "#ec4899",
  },
];

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
    id: "axie-infinity-origins",
    title: "Axie Infinity - Origins | Animation",
    href: "/portfolio/axie-infinity-origins",
    internal: true,
    badge: "Case study",
    image:
      "https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/2bac7de14d05fa8f.png",
    appreciations: "1.1K",
    views: "12.2K",
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
