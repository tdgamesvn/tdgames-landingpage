import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";

export const projectMeta: ProjectMeta = {
  title: "LORE AXIE ORIGIN | CINEMATIC",
  eyebrow: "Case study",
  summary:
    "Cinematic lore trailer for Axie Infinity Origins — storyboard-led sequence with character beats, environment FX, and pacing tuned for an in-world reveal.",
  heroTitle: {
    primary: [
      { text: "Lore", color: "accentSoft" },
      { text: " " },
      { text: "Axie", color: "accent" },
      { text: " " },
      { text: "Origin", color: "white" },
    ],
    subtitle: [{ text: "Cinematic · Motion graphics", color: "soft" }],
  },
  heroFacts: [
    { value: "Feb 2023", label: "Published", icon: "calendar" },
    { value: "Cinematic", label: "Project type", icon: "cube" },
    { value: "Ps", label: "Pipeline", icon: "users" },
  ],
  deliverables: [
    "Cinematic lore piece",
    "Storyboard & shot breakdown",
    "FX & sequence edit",
  ],
  overview: {
    body: "A cinematic lore piece for the Axie Infinity Origins world — built from a beat-driven storyboard, animated with stylized 2D motion, then composited with FX and a final color pass for a clean in-world reveal.",
    stats: [
      { value: "138", label: "Appreciations" },
      { value: "1.8K", label: "Views" },
      { value: "4", label: "Comments" },
      { value: "3", label: "Fields" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/163362313/LORE-AXIE-ORIGIN-CINEMATIC",
  madeForLabel: "AnimVFX Clan",
  madeForUrl: "https://www.behance.net/AnimVFXClan",
  coverImage:
    "https://tdgamestudio.com/landing/behance/7255b2f8d869fd9b.png",
  tools: [],
  fields: ["Storyboarding"],
  tags: [
    "after effects",
    "animation",
    "axie infinity",
    "Digital Art",
    "motion design",
    "motion graphics",
    "storyboard",
    "storytelling",
    "Video Editing",
  ],
  theme: {
    accent: "#f5deb3",
    accentSoft: "#8b7355",
    heroBackground:
      "radial-gradient(circle at top left, rgba(245,222,179,0.18), transparent 36%), radial-gradient(circle at top right, rgba(139,115,85,0.16), transparent 38%), linear-gradient(180deg, #141414 0%, #0a0a0a 75%)",
    showcaseSectionBg: "#191919",
    showcasePanelBg: "#222221",
    showcaseMediaBg: "#2a2520",
    sectionLabelBg: "#191919",
  },
  workflow: [
    { n: "01", t: "Storyboard", sub: "Beat · framing" },
    { n: "02", t: "Animate", sub: "2D · key acting" },
    { n: "03", t: "FX & Comp", sub: "After Effects" },
    { n: "04", t: "Edit", sub: "Grade · pacing" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  {
    id: "m01",
    variant: "full",
    src: "https://tdgamestudio.com/landing/behance/7255b2f8d869fd9b.png",
  },
  {
    id: "m02",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/797221932?h=2e959771c9&autoplay=1&loop=1&color=3F3F3F&title=0&byline=0&portrait=0&muted=1",
    aspectRatio: 1920 / 1080,
  },
  {
    id: "m03",
    variant: "full",
    src: "https://tdgamestudio.com/landing/behance/bffb747d4fe74a2c.png",
  },
  {
    id: "m04",
    variant: "duo",
    srcs: [
      "https://tdgamestudio.com/landing/behance/f3a0364ce0acd210.mp4",
      "https://tdgamestudio.com/landing/behance/c61527bde30b7ac0.mp4",
    ],
  },
  {
    id: "m05",
    variant: "duo",
    srcs: [
      "https://tdgamestudio.com/landing/behance/785dcae683a82ac4.mp4",
      "https://tdgamestudio.com/landing/behance/cc18566033b16338.mp4",
    ],
  },
  {
    id: "m06",
    variant: "duo",
    srcs: [
      "https://tdgamestudio.com/landing/behance/e57e2e8bcc766a79.mp4",
      "https://tdgamestudio.com/landing/behance/4219cdbe69a069e2.mp4",
    ],
  },
  {
    id: "m07",
    variant: "duo",
    srcs: [
      "https://tdgamestudio.com/landing/behance/8137e68e15121f35.mp4",
      "https://tdgamestudio.com/landing/behance/c24c7a68c6a70caa.mp4",
    ],
  },
  {
    id: "m08",
    variant: "duo",
    srcs: [
      "https://tdgamestudio.com/landing/behance/185cfbcd615a49c6.mp4",
      "https://tdgamestudio.com/landing/behance/ca0b182522cfc283.mp4",
    ],
  },
  {
    id: "m09",
    variant: "duo",
    srcs: [
      "https://tdgamestudio.com/landing/behance/33e5612d8f46230a.mp4",
      "https://tdgamestudio.com/landing/behance/4d2a41ee1a8b0fd0.mp4",
    ],
  },
  {
    id: "m10",
    variant: "full",
    src: "https://tdgamestudio.com/landing/behance/04fe503d78e71d97.png",
  },
  {
    id: "m11",
    variant: "fullGif",
    src: "https://tdgamestudio.com/landing/behance/aa7665fd9f35e181.mp4",
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
    id: "heroes-fire",
    title: "ANIMATION/VFX - HEROES FIRE | SUMMONER ERA",
    href: "/portfolio/heroes-fire",
    internal: true,
    badge: "Case study",
    image:
      "https://tdgamestudio.com/landing/behance/011ed49edb1767f3.png",
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
