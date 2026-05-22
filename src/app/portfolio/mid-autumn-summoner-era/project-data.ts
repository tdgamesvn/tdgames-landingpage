import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";

const D = "https://mir-s3-cdn-cf.behance.net/project_modules/disp";
const MW = "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp";
const SRC = "https://mir-s3-cdn-cf.behance.net/project_modules/source";

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
    "https://mir-s3-cdn-cf.behance.net/projects/max_808/4cd319112053013.Y3JvcCwxOTgxLDE1NTAsOSww.jpg",
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
  { id: "m01", variant: "fullGif", src: `${D}/888d70112053013.600da2b1df5ce.gif` },
  { id: "m02", variant: "banner", src: `${MW}/f7f4c1112053013.600ee941bbde7.png` },
  { id: "m03", variant: "banner", src: `${MW}/421297112053013.600da2b406e26.png` },
  { id: "m04", variant: "fullGif", src: `${D}/730148112053013.600da2b2611dc.gif` },
  { id: "m05", variant: "banner", src: `${MW}/cd91a9112053013.600da2b407e4c.png` },
  { id: "m06", variant: "fullGif", src: `${D}/70df63112053013.600da2b2b1531.gif` },
  { id: "m07", variant: "banner", src: `${MW}/cdbbf6112053013.600da2b408828.png` },
  { id: "m08", variant: "fullGif", src: `${D}/aea1f4112053013.600ebd84966f1.gif` },
  { id: "m09", variant: "banner", src: `${MW}/1ba1b5112053013.600da2b40745a.png` },
  { id: "m10", variant: "fullGif", src: `${D}/1116fb112053013.600ebd84edcfe.gif` },
  { id: "m11", variant: "banner", src: `${MW}/38623b112053013.600ebd86476f0.png` },
  { id: "m12", variant: "fullGif", src: `${D}/a6c9c2112053013.600ebd8548772.gif` },
  { id: "m13", variant: "banner", src: `${MW}/904756112053013.600ebd8646fcc.png` },
  { id: "m14", variant: "fullGif", src: `${D}/c9e1e4112053013.600ebd85c8f67.gif` },
  { id: "m15", variant: "banner", src: `${MW}/97f4b0112053013.600ebd864627e.png` },
  { id: "m16", variant: "fullGif", src: `${D}/ae50e5112053013.600da2b30c391.gif` },
  { id: "m17", variant: "banner", src: `${MW}/5dff53112053013.600ebd8647d06.png` },
  { id: "m18", variant: "fullGif", src: `${D}/0f3505112053013.600da2b393c42.gif` },
  { id: "m19", variant: "banner", src: `${MW}/48734f112053013.600ee18d71ef6.png` },
  { id: "m20", variant: "fullGif", src: `${SRC}/3da343112053013.600ee18d72524.gif` },
] as const;

export const relatedProjects: readonly RelatedProject[] = [
  {
    id: "summoner-era-heroes",
    title: "ANIMATION/VFX - HEROES LIGHT/DARK | SUMMONER ERA",
    href: "/portfolio/summoner-era",
    internal: true as const,
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
    internal: true as const,
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
    internal: true as const,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/1efef4144430837.Y3JvcCwxOTgxLDE1NTAsOSww.jpg",
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
      "https://mir-s3-cdn-cf.behance.net/projects/404/33e83e130561969.Y3JvcCwxOTgxLDE1NTAsOSww.png",
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
      "https://mir-s3-cdn-cf.behance.net/projects/404/d5b456134047127.Y3JvcCwyMzkyLDE4NzAsMCww.png",
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
      "https://mir-s3-cdn-cf.behance.net/projects/404/c4e25d143388227.Y3JvcCwxOTgxLDE1NTAsOSww.png",
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
      "https://mir-s3-cdn-cf.behance.net/projects/404/9e2264152981257.Y3JvcCwxOTgxLDE1NTAsOSww.png",
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
      "https://mir-s3-cdn-cf.behance.net/projects/404/5ad036149524063.Y3JvcCwxOTgxLDE1NTAsMCww.png",
    appreciations: "446",
    views: "7.5K",
  },
];
