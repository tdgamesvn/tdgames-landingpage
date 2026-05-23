import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";


export const projectMeta: ProjectMeta = {
  title: "Mid Autumn Animation for Summoner Era",
  eyebrow: "Case study",
  summary:
    "Mid-Autumn event drop for Summoner Era. Spine character pack with festival-themed costumes, intro splash, hero name plates, and a closing reel — bouncy keyframes built for short loops on mobile.",
  heroTitle: {
    primary: [
      { text: "Mid Autumn", color: "accent" },
      { text: " ", color: "white" },
      { text: "Animation", color: "accentSoft" },
    ],
    subtitle: [
      { text: "Summoner Era", color: "soft" },
      { text: " — ", color: "divider" },
      { text: "event drop", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "festival hero pack", color: "muted" },
    ],
  },
  heroFacts: [
    { value: "Jan 2021", label: "Published", icon: "calendar" },
    { value: "Event content", label: "Project type", icon: "cube" },
    { value: "", label: "Pipeline", icon: "users" },
  ],
  deliverables: [
    "Splash & banner art",
    "8 hero loops",
    "Name plates + closing reel",
  ],
  overview: {
    body: "A seasonal Mid-Autumn pack for Summoner Era. We rigged eight heroes in festival skins, paired each with a stylised name plate, opened with a banner splash, and closed with a celebratory wide-shot. Loops were optimised to feel snappy on mobile login + lobby screens.",
    stats: [
      { value: "161", label: "Appreciations" },
      { value: "2K", label: "Views" },
      { value: "8", label: "Hero loops" },
      { value: "3", label: "Fields" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/112053013/Mid-Autumn-Animation-for-Summoner-Era",
  madeForLabel: "AnimVFX Clan",
  madeForUrl: "https://www.behance.net/AnimVFXClan",
  coverImage:
    "https://tdgamestudio.com/landing/behance/d707664aa91765a0.jpg",
  tools: [],
  fields: ["Game Design"],
  tags: [
    "2D animation",
    "character",
    "game",
    "game animation",
    "game mobile",
    "spine",
    "spine 2D",
    "spine animation",
    "summoner",
  ],
  theme: {
    accent: "#fbbf24",
    accentSoft: "#ef4444",
    heroBackground:
      "radial-gradient(circle at top left, rgba(251,191,36,0.20), transparent 42%), radial-gradient(circle at top right, rgba(239,68,68,0.18), transparent 42%), linear-gradient(180deg, #1a1108 0%, #0a0604 75%)",
    showcaseSectionBg: "#13100a",
    showcasePanelBg: "#1b1610",
    sectionLabelBg: "#15110b",
  },
  workflow: [
    { n: "01", t: "Art prep", sub: "Photoshop" },
    { n: "02", t: "Skinning", sub: "Spine 2D" },
    { n: "03", t: "Animation", sub: "Loops" },
    { n: "04", t: "Ship", sub: "Event drop" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "m01", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/728e2b4bd0ee1812.gif" },
  { id: "m02", variant: "banner", src: "https://tdgamestudio.com/landing/behance/7be1c929387344e1.png" },
  { id: "m03", variant: "banner", src: "https://tdgamestudio.com/landing/behance/c4f544c3bca1d3e0.png" },
  { id: "m04", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/6a566ab48bcb4809.gif" },
  { id: "m05", variant: "banner", src: "https://tdgamestudio.com/landing/behance/c4f544c3bca1d3e0.png" },
  { id: "m06", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/542c64f1e55c771c.gif" },
  { id: "m07", variant: "banner", src: "https://tdgamestudio.com/landing/behance/c4f544c3bca1d3e0.png" },
  { id: "m08", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/44a5819fe5bf0ab6.gif" },
  { id: "m09", variant: "banner", src: "https://tdgamestudio.com/landing/behance/c4f544c3bca1d3e0.png" },
  { id: "m10", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/caba6aa6de22d63a.gif" },
  { id: "m11", variant: "banner", src: "https://tdgamestudio.com/landing/behance/c4f544c3bca1d3e0.png" },
  { id: "m12", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/4d89acbb15424e64.gif" },
  { id: "m13", variant: "banner", src: "https://tdgamestudio.com/landing/behance/c4f544c3bca1d3e0.png" },
  { id: "m14", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/71b3c5bb1d896037.gif" },
  { id: "m15", variant: "banner", src: "https://tdgamestudio.com/landing/behance/c4f544c3bca1d3e0.png" },
  { id: "m16", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/8d6c7382a60e4c7b.gif" },
  { id: "m17", variant: "banner", src: "https://tdgamestudio.com/landing/behance/c4f544c3bca1d3e0.png" },
  { id: "m18", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/886cdb0e0cd67309.gif" },
  { id: "m19", variant: "banner", src: "https://tdgamestudio.com/landing/behance/8a5db7fe874d57cc.png" },
  { id: "m20", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/8c5d418101a286f6.gif" },
] as const;

export const relatedProjects: readonly RelatedProject[] = [
  {
    id: "summoner-era-heroes",
    title: "ANIMATION/VFX - HEROES LIGHT/DARK | SUMMONER ERA",
    href: "/portfolio/summoner-era",
    internal: true as const,
    badge: "Case study",
    image:
      "https://tdgamestudio.com/landing/behance/7b463f2be013bcd3.jpg",
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
      "https://tdgamestudio.com/landing/behance/011ed49edb1767f3.png",
    appreciations: "627",
    views: "6.0K",
  },
  {
    id: "summoner-era-2020",
    title: "Summoner Era - Login Screen Animations (2020)",
    href: "/portfolio/summoner-era-2020",
    internal: true as const,
    badge: "Case study",
    image:
      "https://tdgamestudio.com/landing/behance/807956f4ca57c6ed.jpg",
    appreciations: "89",
    views: "1.7K",
  },
  {
    id: "animation-contest-sky-mavis",
    title: "Animation Contest - Sky Mavis",
    href: "/portfolio/animation-contest-sky-mavis",
    internal: true as const,
    badge: "Case study",
    image:
      "https://tdgamestudio.com/landing/behance/d4011a345f6c4002.png",
    appreciations: "218",
    views: "3.2K",
  },
  {
    id: "battle-of-the-gods-mytheria",
    title: "Battle of the Gods | Mytheria - Login Screen",
    href: "/portfolio/battle-of-the-gods-mytheria",
    internal: true as const,
    badge: "Case study",
    image:
      "https://tdgamestudio.com/landing/behance/9fed6d92877b5d19.png",
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
      "https://tdgamestudio.com/landing/behance/4974242912a7c2f1.png",
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
      "https://tdgamestudio.com/landing/behance/379f981b88c6a84f.png",
    appreciations: "261",
    views: "3.0K",
  },
  {
    id: "kayn-snow-moon",
    title: "Kayn Snow Moon | League of Legends - Login Screen",
    href: "/portfolio/kayn-snow-moon",
    internal: true as const,
    badge: "Case study",
    image:
      "https://tdgamestudio.com/landing/behance/0a0b35cf8d5e9eb6.png",
    appreciations: "446",
    views: "7.5K",
  },
];
