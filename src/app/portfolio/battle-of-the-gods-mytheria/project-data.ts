import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";

const DISP = "https://mir-s3-cdn-cf.behance.net/project_modules/disp";
const W1400 = "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp";

export const projectMeta: ProjectMeta = {
  title: "Battle of the Gods | Mytheria - Login Screen",
  eyebrow: "Case study",
  summary:
    "Login-screen package for Mytheria — Battle of the Gods. Six character loops with VFX, plus a hero reveal cinematic intro tuned for the title screen.",
  heroTitle: {
    primary: [
      { text: "Battle", color: "accent" },
      { text: " of the ", color: "muted" },
      { text: "Gods", color: "accentSoft" },
    ],
    subtitle: [
      { text: "Mytheria", color: "white" },
      { text: " · ", color: "divider" },
      { text: "Login Screen", color: "soft" },
    ],
  },
  heroFacts: [
    { value: "Jan 2022", label: "Published", icon: "calendar" },
    { value: "Mytheria (Mobile)", label: "Project type", icon: "cube" },
    { value: "Ps", label: "Pipeline", icon: "users" },
  ],
  deliverables: [
    "Cinematic intro composite",
    "6 hero login loops with VFX",
    "Final graphics banner",
  ],
  overview: {
    body: "A login-screen drop for Mytheria — Battle of the Gods. We delivered a short cinematic intro, six character motion + VFX loops shown two-up to compare poses and effects, and a final banner that ties the lineup together for marketing.",
    stats: [
      { value: "112", label: "Appreciations" },
      { value: "1.9K", label: "Views" },
      { value: "6", label: "Hero loops" },
      { value: "3", label: "Fields" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/134047127/Battle-of-the-Gods-Mytheria-Login-Screen",
  madeForLabel: "AnimVFX Clan",
  madeForUrl: "https://www.behance.net/AnimVFXClan",
  coverImage:
    "https://mir-s3-cdn-cf.behance.net/projects/max_808/d5b456134047127.Y3JvcCwyMzkyLDE4NzAsMCww.png",
  tools: [],
  fields: ["Visual Effects"],
  tags: [
    "battle",
    "character animation",
    "effect",
    "gods",
    "login screen",
    "motion graphics",
    "mytheria",
  ],
  theme: {
    accent: "#f97316",
    accentSoft: "#3b82f6",
    heroBackground:
      "radial-gradient(circle at top left, rgba(249,115,22,0.20), transparent 38%), radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 40%), radial-gradient(ellipse at 60% 0%, rgba(30,64,175,0.14), transparent 45%), linear-gradient(180deg, #0f1419 0%, #070a0d 75%)",
    showcaseSectionBg: "#141414",
    showcasePanelBg: "#1a1a1a",
    sectionLabelBg: "#141414",
  },
  workflow: [
    { n: "01", t: "Concept", sub: "Brief · ref" },
    { n: "02", t: "Spine", sub: "Hero rig" },
    { n: "03", t: "VFX", sub: "After Effects" },
    { n: "04", t: "Comp", sub: "Login reel" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  {
    id: "m01",
    variant: "video",
    src: "https://player.vimeo.com/video/661196669?h=913b280609&badge=0&autopause=0",
  },
  {
    id: "m02",
    variant: "duo",
    srcs: [
      `${DISP}/c93cb1134047127.61cc8d2109d9f.gif`,
      `${DISP}/9acf03134047127.61cc8d210963c.gif`,
    ],
  },
  {
    id: "m03",
    variant: "duo",
    srcs: [
      `${DISP}/cc307d134047127.61cc8d221c65f.gif`,
      `${DISP}/960fcf134047127.61cc8d221ca32.gif`,
    ],
  },
  {
    id: "m04",
    variant: "duo",
    srcs: [
      `${DISP}/5841f2134047127.61cc8d22e8351.gif`,
      `${DISP}/bb3efc134047127.61cc8d22e7ddc.gif`,
    ],
  },
  {
    id: "m05",
    variant: "full",
    src: `${W1400}/489aca134047127.61cdce85c2c17.png`,
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
      "https://mir-s3-cdn-cf.behance.net/projects/404/a8f476199358443.Y3JvcCwxOTgxLDE1NTAsOSww.jpg",
    appreciations: "208",
    views: "2.3K",
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
