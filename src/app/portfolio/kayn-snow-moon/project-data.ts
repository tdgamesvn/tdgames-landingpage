import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";

export const projectMeta: ProjectMeta = {
  title: "Kayn Snow Moon | League of Legends - Login Screen",
  eyebrow: "Case study",
  summary:
    "Login screen for Kayn Snow Moon â€” a fan-made League of Legends piece: looping hero motion, snow-moon atmosphere, and compositing tuned for a cinematic client-style login.",
  heroTitle: {
    primary: [
      { text: "Kayn", color: "accent" },
      { text: " " },
      { text: "Snow Moon", color: "white" },
    ],
    subtitle: [{ text: "League of Legends Â· Login screen", color: "soft" }],
  },
  heroFacts: [
    { value: "Aug 2022", label: "Published", icon: "calendar" },
    { value: "Fanmade", label: "Project type", icon: "cube" },
    { value: "Ps", label: "Pipeline", icon: "cube" },
  ],
  deliverables: [
    "Login screen hero loop & timing",
    "Character motion & polish passes",
    "Compositing, VFX, and final grade",
  ],
  overview: {
    body: "A fan-made login screen for Kaynâ€™s Snow Moon skin direction: stylized motion, cold moonlight, and VFX that read clearly at full-frame promo resolution.",
    stats: [
      { value: "446+", label: "Appreciations" },
      { value: "7.5K", label: "Views" },
      { value: "12", label: "Comments" },
      { value: "4", label: "Tools" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/149524063/Kayn-Snow-Moon-League-of-Legends-Login-Screen",
  coverImage: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/Screenshot 2026-05-13 232709.png",
  tools: [],
  fields: ["Visual Effects"],
  tags: [
    "character animation",
    "creatures",
    "Digital Art",
    "Game Animation",
    "Kayn",
    "league of legends",
    "login screen",
    "motion graphics",
    "splash animation",
  ],
  theme: {
    accent: "#7dd3fc",
    accentSoft: "#ff8c3a",
    heroBackground:
      "radial-gradient(circle at top left, rgba(125,211,252,0.14), transparent 36%), radial-gradient(circle at top right, rgba(255,140,58,0.14), transparent 38%), linear-gradient(180deg, #141414 0%, #0a0a0a 75%)",
    showcaseSectionBg: "#191919",
    showcasePanelBg: "#222221",
    showcaseMediaBg: "#020a14",
    sectionLabelBg: "#191919",
  },
  workflow: [
    { n: "01", t: "Layout & mood", sub: "Key art Â· snow moon refs" },
    { n: "02", t: "Animate", sub: "Spine 2D Â· Maya" },
    { n: "03", t: "Composite", sub: "After Effects Â· Ps" },
    { n: "04", t: "Ship", sub: "Timing Â· polish" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  {
    id: "m01",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/3d5e46149524063.62ef4fd758b93.png",
  },
  {
    id: "m02",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/876993840?h=e2c03cc050&autoplay=1&loop=1&title=0&byline=0&portrait=0&muted=1",
  },
  {
    id: "m03",
    variant: "trio",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/c92d94149524063.62e955516a522.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/180960149524063.62e955516ae60.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/c09468149524063.62e955516a9d5.gif",
    ],
  },
  {
    id: "m04",
    variant: "duo",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/2880f0149524063.62ee3d17d69b3.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/disp/cceb6d149524063.62ef4f3d05d7b.gif",
    ],
  },
  {
    id: "m05",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/50f7cb149524063.62ef3da956ee8.png",
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
