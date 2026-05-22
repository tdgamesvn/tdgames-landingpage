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
    "https://mir-s3-cdn-cf.behance.net/project_modules/fs_webp/9d5c36163362313.63e48c008691b.png",
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
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/fs_webp/9d5c36163362313.63e48c008691b.png",
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
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/fs_webp/3a4660163362313.63e48c0087f51.png",
  },
  {
    id: "m04",
    variant: "duo",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/d5e804163362313.63e48bfb14d39.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/98fb7a163362313.63e48bfb15ba4.gif",
    ],
  },
  {
    id: "m05",
    variant: "duo",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/1e45f2163362313.63e48bfbc3e82.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/c6f720163362313.63e48bfbc4df2.gif",
    ],
  },
  {
    id: "m06",
    variant: "duo",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/4c8ad3163362313.63e48bfc90be9.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/1e7d63163362313.63e48bfc92564.gif",
    ],
  },
  {
    id: "m07",
    variant: "duo",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/f0a1e0163362313.63e48bfd57f81.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/8e3963163362313.63e48bfd58f38.gif",
    ],
  },
  {
    id: "m08",
    variant: "duo",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/191a20163362313.63e48bfdd7132.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/49f25a163362313.63e48bfdd8595.gif",
    ],
  },
  {
    id: "m09",
    variant: "duo",
    srcs: [
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/6aa7a5163362313.63e48bfee5c18.gif",
      "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/ee3318163362313.63e48bfee527e.gif",
    ],
  },
  {
    id: "m10",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/1400/3a475f163362313.63e48bff7a44c.png",
  },
  {
    id: "m11",
    variant: "fullGif",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/1400/fb059d163362313.63e48bffe60e7.gif",
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
