import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";

export const projectMeta: ProjectMeta = {
  title: "BOSS ANIMATION - THE TWINS",
  eyebrow: "Case study",
  summary:
    "Boss for the game project: The Twins — a series of in-game boss reels covering Samurai and supporting creatures.",
  heroTitle: {
    primary: [
      { text: "Boss", color: "accentSoft" },
      { text: " " },
      { text: "Animation", color: "white" },
    ],
    subtitle: [
      { text: "The ", color: "soft" },
      { text: "Twins", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D Reels", color: "soft" },
    ],
  },
  heroFacts: [
    { value: "Sep 2022", label: "Published", icon: "calendar" },
    { value: "Game (Mobile)", label: "Project type", icon: "cube" },
    { value: "", label: "Pipeline", icon: "users" },
  ],
  deliverables: [
    "Boss set",
    "10× boss reels for in-game use",
    "Mentoring & polish pass",
  ],
  overview: {
    body: "Boss animation pack for The Twins — Legend of Shadow Ninja Monster Hunter. The release contains ten boss reels animated in Spine 2D; I led animation on Boss Samurai and mentored the broader animation pass across the rest of the set.",
    stats: [
      { value: "261", label: "Appreciations" },
      { value: "3K", label: "Views" },
      { value: "18", label: "Comments" },
      { value: "10", label: "Reels" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/152981257/BOSS-ANIMATION-THE-TWINS",
  madeForLabel: "AnimVFX Clan",
  madeForUrl: "https://www.behance.net/AnimVFXClan",
  coverImage:
    "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/7b9dcd152981257.632887fbcdc1a.png",
  tools: [],
  fields: ["Game Design", "Character Design"],
  tags: [
    "2D",
    "animation",
    "Character",
    "Character design",
    "game",
    "game design",
  ],
  theme: {
    accent: "#fbbf24",
    accentSoft: "#22d3ee",
    heroBackground:
      "radial-gradient(circle at top left, rgba(34,211,238,0.16), transparent 36%), radial-gradient(circle at top right, rgba(251,191,36,0.18), transparent 38%), linear-gradient(180deg, #141414 0%, #0a0a0a 75%)",
    showcaseSectionBg: "#191919",
    showcasePanelBg: "#222221",
    sectionLabelBg: "#191919",
  },
  workflow: [
    { n: "01", t: "Brief & refs", sub: "Client mood · pose" },
    { n: "02", t: "Rig & key", sub: "Spine 2D" },
    { n: "03", t: "Polish", sub: "Mentor pass" },
    { n: "04", t: "Deliver", sub: "In-game export" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  {
    id: "m01",
    variant: "full",
    src: "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/7b9dcd152981257.632887fbcdc1a.png",
  },
  {
    id: "m02",
    variant: "info",
    role: "Animation Mentor",
    note: "Boss Samurai — Animation by me",
    linkLabel: "Open Game on Google Play",
    linkUrl:
      "https://play.google.com/store/apps/details?id=the.twins.legend.of.shadow.ninja.monster.hunter",
  },
  {
    id: "m03",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/751087093?h=8a239dad89&autoplay=1&loop=1&badge=0&autopause=0&muted=1&title=0&byline=0&portrait=0",
    aspectRatio: 1400 / 1240,
  },
  {
    id: "m04",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/751086993?h=0cbacb04f9&autoplay=1&loop=1&badge=0&autopause=0&muted=1&title=0&byline=0&portrait=0",
    aspectRatio: 1400 / 1240,
  },
  {
    id: "m05",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/751087036?h=c435a5f54c&autoplay=1&loop=1&badge=0&autopause=0&muted=1&title=0&byline=0&portrait=0",
    aspectRatio: 1400 / 1240,
  },
  {
    id: "m06",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/751087058?h=fbf2548884&autoplay=1&loop=1&badge=0&autopause=0&muted=1&title=0&byline=0&portrait=0",
    aspectRatio: 1400 / 1240,
  },
  {
    id: "m07",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/751087024?h=d3d669dd03&autoplay=1&loop=1&badge=0&autopause=0&muted=1&title=0&byline=0&portrait=0",
    aspectRatio: 1400 / 1240,
  },
  {
    id: "m08",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/751087202?h=e2fffb7f2b&autoplay=1&loop=1&badge=0&autopause=0&muted=1&title=0&byline=0&portrait=0",
    aspectRatio: 1400 / 1240,
  },
  {
    id: "m09",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/751087124?h=eb351673d6&autoplay=1&loop=1&badge=0&autopause=0&muted=1&title=0&byline=0&portrait=0",
    aspectRatio: 1400 / 1240,
  },
  {
    id: "m10",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/751087146?h=778a1c82e0&autoplay=1&loop=1&badge=0&autopause=0&muted=1&title=0&byline=0&portrait=0",
    aspectRatio: 1400 / 1240,
  },
  {
    id: "m11",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/751087077?h=5dc4f54026&autoplay=1&loop=1&badge=0&autopause=0&muted=1&title=0&byline=0&portrait=0",
    aspectRatio: 1400 / 1240,
  },
  {
    id: "m12",
    variant: "vimeo",
    embedSrc:
      "https://player.vimeo.com/video/751087178?h=7228030974&autoplay=1&loop=1&badge=0&autopause=0&muted=1&title=0&byline=0&portrait=0",
    aspectRatio: 1400 / 1240,
  },
  {
    id: "m13",
    variant: "closing",
    text: "THANK FOR WATCHING!",
    size: "sm",
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
