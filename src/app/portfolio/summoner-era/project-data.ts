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
  coverImage: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/summonerDetail.png",
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
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/11aa30199358443.664fff555d264.gif",
  },
  {
    id: "m03",
    variant: "portrait",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/b27aab199358443.664fff555b93e.gif",
  },
  {
    id: "m04",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/17e3e6199358443.664fff555b566.gif",
  },
  {
    id: "m05",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/7ce534199358443.664fff555d6e1.gif",
  },
  {
    id: "m06",
    variant: "portrait",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/c3f555199358443.664fff555c6a2.gif",
  },
  {
    id: "m07",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/7d9dc4199358443.664fff555ddd5.gif",
  },
  {
    id: "m08",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/805413199358443.664fff555c049.gif",
  },
  {
    id: "m09",
    variant: "portrait",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/9902e5199358443.664fff55600b7.gif",
  },
  {
    id: "m10",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/35e010199358443.664fff555e4c2.gif",
  },
  {
    id: "m11",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/c3329a199358443.664fff5561257.gif",
  },
  {
    id: "m12",
    variant: "portrait",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/91988f199358443.664fff555a99b.gif",
  },
  {
    id: "m13",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/a5e9d9199358443.664fff556052e.gif",
  },
  {
    id: "m14",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/cae9ac199358443.664fff555ae40.gif",
  },
  {
    id: "m15",
    variant: "portrait",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/0eaaa9199358443.664fff5561a86.gif",
  },
  {
    id: "m16",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/ca0b08199358443.664fff5560df1.gif",
  },
  {
    id: "m17",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/6f446d199358443.664fff555cdde.gif",
  },
  {
    id: "m18",
    variant: "portrait",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/bb59c6199358443.664fff555ec38.gif",
  },
  {
    id: "m19",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/b20697199358443.664fff555f47e.gif",
  },
  {
    id: "m20",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/1d8da3199358443.664fff556099c.gif",
  },
  {
    id: "m21",
    variant: "portrait",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/75bc57199358443.664fff555f87a.gif",
  },
  {
    id: "m22",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/a8f9c1199358443.664fff55616cb.gif",
  },
  {
    id: "m23",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/source/7e5e9e199358443.664fff555fcef.gif",
  },
  {
    id: "m24",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_632_webp/fb46e9199358443.664fff555a498.png",
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
      "https://mir-s3-cdn-cf.behance.net/projects/404/5ad036149524063.Y3JvcCwxOTgxLDE1NTAsMCww.png",
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
