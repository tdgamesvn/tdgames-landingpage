import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";

export const projectMeta: ProjectMeta = {
  title: "ANIMATION/VFX - HEROES LIGHT/DARK | SUMMONER ERA",
  eyebrow: "Case study",
  summary:
    "Login-screen hero packages for Summoner Era: looping character motion, key-art presentation, and VFX passes tuned for in-game and promo use.",
  heroTitle: {
    primary: [{ text: "ANIMATION/VFX", color: "white" }],
    subtitle: [
      { text: "Heroes ", color: "soft" },
      { text: "LIGHT", color: "accent" },
      { text: " / ", color: "divider" },
      { text: "DARK", color: "accentSoft" },
      { text: " Â· ", color: "divider" },
      { text: "Summoner Era", color: "soft" },
    ],
  },
  heroFacts: [
    { value: "2024", label: "Showcase", icon: "calendar" },
    { value: "Multi-hero", label: "Scope", icon: "users" },
    { value: "Spine + AE", label: "Pipeline", icon: "cube" },
  ],
  deliverables: [
    "Hero login loops (light / dark themes)",
    "Character motion & polish passes",
    "VFX integrated with key art",
  ],
  overview: {
    body: "We created a set of hero login animations and VFX for Summoner Era, combining stylized character motion with impactful visual effects to enhance both the in-game experience and promotional materials.",
    stats: [
      { value: "12+", label: "Heroes Animated" },
      { value: "30+", label: "VFX Assets" },
      { value: "2", label: "Themes" },
      { value: "3", label: "Weeks" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/199358443/ANIMATIONVFX-HEROES-LIGHTDARK-SUMMONER-ERA",
  coverImage: "https://cdn.tdgamestudio.com/landing/images/summonerDetail.png",
  tools: [],
  fields: ["Game Design", "Visual Effects"],
  tags: [
    "2D Animation",
    "Character Design",
    "Character Animation",
    "Concept Art",
    "Login Screen",
    "Key Art",
    "Summoner Era",
  ],
  theme: {
    accent: "#ffb547",
    accentSoft: "#9b6bff",
    heroBackground:
      "radial-gradient(circle at top left, rgba(255,140,58,0.18), transparent 35%), radial-gradient(circle at top right, rgba(155,107,255,0.16), transparent 38%), linear-gradient(180deg, #141414 0%, #0a0a0a 75%)",
    showcaseSectionBg: "#191919",
    showcasePanelBg: "#222221",
    sectionLabelBg: "#191919",
  },
  workflow: [
    { n: "01", t: "Concept & Style", sub: "Moodboard Â· refs" },
    { n: "02", t: "Rig & Animate", sub: "Spine 2D" },
    { n: "03", t: "VFX Layer", sub: "After Effects" },
    { n: "04", t: "Polish & Deliver", sub: "QA Â· handoff" },
  ],
};

export const showcaseModules = [
  {
    id: "m01",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/211e2e9847b1c926.mp4",
  },
  {
    id: "m03",
    variant: "portrait",
    src: "https://cdn.tdgamestudio.com/landing/behance/192f7734daff8cd2.mp4",
  },
  {
    id: "m04",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/62db6ea7378d6b16.mp4",
  },
  {
    id: "m05",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/c035a6f77f87a15b.mp4",
  },
  {
    id: "m06",
    variant: "portrait",
    src: "https://cdn.tdgamestudio.com/landing/behance/89e59ae6c88d5b44.mp4",
  },
  {
    id: "m07",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/da89fea69c0a1bc6.mp4",
  },
  {
    id: "m08",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/ae87f42e367012cd.mp4",
  },
  {
    id: "m09",
    variant: "portrait",
    src: "https://cdn.tdgamestudio.com/landing/behance/bb0264dd096a4a58.mp4",
  },
  {
    id: "m10",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/3fa7d93eee9f2523.mp4",
  },
  {
    id: "m11",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/8fac62466998e08c.mp4",
  },
  {
    id: "m12",
    variant: "portrait",
    src: "https://cdn.tdgamestudio.com/landing/behance/3bc32e8d83cdc197.mp4",
  },
  {
    id: "m13",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/6c1c89561f62fbe3.mp4",
  },
  {
    id: "m14",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/78e2258124424f7c.mp4",
  },
  {
    id: "m15",
    variant: "portrait",
    src: "https://cdn.tdgamestudio.com/landing/behance/694c56c630450a8d.mp4",
  },
  {
    id: "m16",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/360945c79ab23e9b.mp4",
  },
  {
    id: "m17",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/fb390e8adaef1901.mp4",
  },
  {
    id: "m18",
    variant: "portrait",
    src: "https://cdn.tdgamestudio.com/landing/behance/5e43c4a311b81f95.mp4",
  },
  {
    id: "m19",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/5e7cb896e192f521.mp4",
  },
  {
    id: "m20",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/93a69ffcd5fd8448.mp4",
  },
  {
    id: "m21",
    variant: "portrait",
    src: "https://cdn.tdgamestudio.com/landing/behance/c59b6bb83a8821a5.mp4",
  },
  {
    id: "m22",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/cad6aae9ae282324.mp4",
  },
  {
    id: "m23",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/2b8c7618b1a755c1.mp4",
  },
  {
    id: "m24",
    variant: "full",
    src: "https://cdn.tdgamestudio.com/landing/behance/9ecc9aeaaff184f1.png",
  },
] as readonly ShowcaseModule[];

export const relatedProjects: readonly RelatedProject[] = [
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
    id: "axie-infinity-origins",
    title: "Axie Infinity - Origins | Animation",
    href: "/portfolio/axie-infinity-origins",
    internal: true,
    badge: "Case study",
    image:
      "https://cdn.tdgamestudio.com/landing/behance/2bac7de14d05fa8f.png",
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
