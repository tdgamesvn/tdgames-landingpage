import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";

const DISP = "https://mir-s3-cdn-cf.behance.net/project_modules/disp";
const MW = "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp";
const M = "https://mir-s3-cdn-cf.behance.net/project_modules/1400";

export const projectMeta: ProjectMeta = {
  title: "Animation for Summoner Era - Arena of Heroes",
  eyebrow: "Case study",
  summary:
    "Cinematic hero showcase for Summoner Era's Arena of Heroes mode. Seven champions, each shipped with a name plate, splash, full battle reel, and a two-up combo loop — built to feed the in-game arena lobby and marketing pipeline.",
  heroTitle: {
    primary: [
      { text: "Arena", color: "accentSoft" },
      { text: " of ", color: "soft" },
      { text: "Heroes", color: "accent" },
    ],
    subtitle: [
      { text: "Animation", color: "soft" },
      { text: " — ", color: "divider" },
      { text: "Summoner Era", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "cinematic hero pack", color: "muted" },
    ],
  },
  heroFacts: [
    { value: "Oct 2020", label: "Published", icon: "calendar" },
    { value: "7 heroes", label: "Roster", icon: "users" },
    { value: "Spine + AE", label: "Pipeline", icon: "cube" },
  ],
  deliverables: [
    "Hero splash + name plates",
    "7 cinematic battle reels",
    "14 combo / VFX loops",
  ],
  overview: {
    body: "A 7-hero spotlight pack for Summoner Era's Arena of Heroes. Each champion ships with a stylised name plate, a full splash banner, a 1400-wide Spine battle reel, plus a two-up GIF combo isolating signature skills. After Effects handled VFX layers and motion graphics; Spine 2D drove the character rig. Output feeds the arena lobby loop and the marketing team's social pipeline.",
    stats: [
      { value: "136", label: "Appreciations" },
      { value: "2.2K", label: "Views" },
      { value: "7", label: "Hero reels" },
      { value: "14+", label: "Combo loops" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/104755019/Animation-for-Summoner-Era-Arena-of-Heroes",
  madeForLabel: "AnimVFX Clan",
  madeForUrl: "https://www.behance.net/AnimVFXClan",
  coverImage: `${MW}/d4a408104755019.5f9b97c0a0f8a.png`,
  tools: [],
  fields: ["Visual Effects"],
  tags: [
    "after effects",
    "animation",
    "cinematic",
    "effect",
    "game mobile",
    "motion graphics",
    "spine",
    "summoner",
    "character",
  ],
  theme: {
    accent: "#10b981",
    accentSoft: "#facc15",
    heroBackground:
      "radial-gradient(circle at top left, rgba(16,185,129,0.20), transparent 42%), radial-gradient(circle at top right, rgba(250,204,21,0.16), transparent 42%), linear-gradient(180deg, #0a1410 0%, #050708 75%)",
    showcaseSectionBg: "#091410",
    showcasePanelBg: "#0b1d16",
    sectionLabelBg: "#0a1813",
  },
  workflow: [
    { n: "01", t: "Concept", sub: "Sketch" },
    { n: "02", t: "Spine rig", sub: "Spine 2D" },
    { n: "03", t: "VFX", sub: "After Effects" },
    { n: "04", t: "Ship", sub: "Arena loop" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "m01", variant: "banner", src: `${MW}/d4a408104755019.5f9b97c0a0f8a.png` },
  { id: "m02", variant: "fullGif", src: `${M}/a86186104755019.5f984b849ae07.gif` },
  { id: "m03", variant: "banner", src: `${MW}/a2de1f104755019.5f99ae451f454.png` },
  { id: "m04", variant: "banner", src: `${MW}/a8642c104755019.5f9992828fd87.png` },
  { id: "m05", variant: "fullGif", src: `${M}/ec79f9104755019.5f984b849b2ab.gif` },
  { id: "m06", variant: "banner", src: `${MW}/c812ff104755019.5f9a40c89e623.png` },
  {
    id: "m07",
    variant: "duo",
    srcs: [
      `${DISP}/daa6bf104755019.5f9b95e85c1b2.gif`,
      `${DISP}/d4993f104755019.5f9b921a298ee.gif`,
    ],
  },
  { id: "m08", variant: "banner", src: `${MW}/a6b7ac104755019.5f8db8ffafc04.png` },
  { id: "m09", variant: "banner", src: `${MW}/1f7d58104755019.5f99928290551.png` },
  { id: "m10", variant: "fullGif", src: `${M}/a92d65104755019.5f984b849d401.gif` },
  { id: "m11", variant: "banner", src: `${MW}/b95998104755019.5f9a40c89d88c.png` },
  {
    id: "m12",
    variant: "duo",
    srcs: [
      `${DISP}/f4e5a3104755019.5f9b921bc26b7.gif`,
      `${DISP}/163211104755019.5f9b921bc2cc5.gif`,
    ],
  },
  { id: "m13", variant: "banner", src: `${MW}/5ce913104755019.5f90538c412ef.png` },
  { id: "m14", variant: "banner", src: `${MW}/ad5b07104755019.5f99928290bee.png` },
  { id: "m15", variant: "fullGif", src: `${M}/510c0a104755019.5f984b849cf7f.gif` },
  { id: "m16", variant: "banner", src: `${MW}/9fdece104755019.5f9a40c89dd30.png` },
  {
    id: "m17",
    variant: "duo",
    srcs: [
      `${DISP}/733bd8104755019.5f9b921cd3a91.gif`,
      `${DISP}/0f653a104755019.5f9b921cd33d1.gif`,
    ],
  },
  { id: "m18", variant: "banner", src: `${MW}/a4c031104755019.5f90538c42df2.png` },
  { id: "m19", variant: "banner", src: `${MW}/d53694104755019.5f9992828f605.png` },
  { id: "m20", variant: "fullGif", src: `${M}/bf345a104755019.5f984b849be5d.gif` },
  { id: "m21", variant: "banner", src: `${MW}/7b73df104755019.5f9a40c89ce0b.png` },
  {
    id: "m22",
    variant: "duo",
    srcs: [
      `${DISP}/c33317104755019.5f9b95e8bad86.gif`,
      `${DISP}/e0a3a6104755019.5f9acc0570867.gif`,
    ],
  },
  { id: "m23", variant: "banner", src: `${MW}/6d9140104755019.5f90538c41d3e.png` },
  { id: "m24", variant: "banner", src: `${MW}/3dceb8104755019.5f9992828ee00.png` },
  { id: "m25", variant: "fullGif", src: `${M}/98ce16104755019.5f984b849cafd.gif` },
  { id: "m26", variant: "banner", src: `${MW}/d9eb2e104755019.5f9a40c89d357.png` },
  {
    id: "m27",
    variant: "duo",
    srcs: [
      `${DISP}/15baae104755019.5f9b921fe37b4.gif`,
      `${DISP}/0574ad104755019.5f9b921fe3217.gif`,
    ],
  },
  { id: "m28", variant: "banner", src: `${MW}/138272104755019.5f90538c3f1c4.png` },
  { id: "m29", variant: "banner", src: `${MW}/aeac85104755019.5f99928291233.png` },
  { id: "m30", variant: "fullGif", src: `${M}/90ff3f104755019.5f984b849b747.gif` },
  { id: "m31", variant: "banner", src: `${MW}/351f0d104755019.5f9a40c89c946.png` },
  {
    id: "m32",
    variant: "duo",
    srcs: [
      `${DISP}/3418e8104755019.5f9b922077c04.gif`,
      `${DISP}/3aa341104755019.5f9b922078555.gif`,
    ],
  },
  { id: "m33", variant: "banner", src: `${MW}/05548b104755019.5f90538c3f95e.png` },
  { id: "m34", variant: "banner", src: `${MW}/b7594f104755019.5f999f71b77aa.png` },
  { id: "m35", variant: "fullGif", src: `${M}/a8f280104755019.5f99a65e7b3cc.gif` },
  { id: "m36", variant: "banner", src: `${MW}/2b2045104755019.5f99a65e7bb2e.png` },
  { id: "m37", variant: "fullGif", src: `${M}/ec8f0f104755019.5f9bd4472aa2c.gif` },
  { id: "m38", variant: "banner", src: `${MW}/3b20ee104755019.5f99afb45afec.png` },
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
    id: "mid-autumn-summoner-era",
    title: "Mid Autumn Animation for Summoner Era",
    href: "/portfolio/mid-autumn-summoner-era",
    internal: true as const,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/4cd319112053013.Y3JvcCwxOTgxLDE1NTAsOSww.jpg",
    appreciations: "161",
    views: "2K",
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
];
