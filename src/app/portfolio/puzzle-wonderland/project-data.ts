import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";

const M = "https://mir-s3-cdn-cf.behance.net/project_modules/1400";
const MW = "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp";
const HD = "https://mir-s3-cdn-cf.behance.net/project_modules/hd";

export const projectMeta: ProjectMeta = {
  title: "Character animation for Puzzle Wonderland",
  eyebrow: "Case study",
  summary:
    "Spine 2D character pack for Puzzle Wonderland — a casual mobile puzzle game. Includes a portrait login splash, seven player hero loops, and five boss reactions, all rigged and animated to feel snappy, cute, and replayable on tiny screens.",
  heroTitle: {
    primary: [
      { text: "Puzzle", color: "accent" },
      { text: " " },
      { text: "Wonderland", color: "accentSoft" },
    ],
    subtitle: [
      { text: "Character", color: "soft" },
      { text: " · ", color: "divider" },
      { text: "animation", color: "accent" },
      { text: " — ", color: "divider" },
      { text: "cute mobile puzzle", color: "muted" },
    ],
  },
  heroFacts: [
    { value: "Jul 2018", label: "Published", icon: "calendar" },
    { value: "Casual mobile", label: "Project type", icon: "cube" },
    { value: "", label: "Pipeline", icon: "users" },
  ],
  deliverables: [
    "Portrait login splash",
    "7 player hero loops",
    "5 boss reaction loops",
  ],
  overview: {
    body: "A cute-style Spine 2D animation pack for a casual mobile puzzle title. We took Hung Ngo's character art and rigged each hero with snappy keyframes built for tiny mobile screens — bouncy idles, victory pops, and boss reactions. A portrait login splash anchors the pack, then seven hero loops and five boss reactions cover the in-game lobby + match-end beats.",
    stats: [
      { value: "239", label: "Appreciations" },
      { value: "3.4K", label: "Views" },
      { value: "12", label: "Animations" },
      { value: "10", label: "Comments" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/67614633/Character-animation-for-Puzzle-Wonderland",
  madeForLabel: "AnimVFX Clan",
  madeForUrl: "https://www.behance.net/AnimVFXClan",
  coverImage: `${MW}/c93a5b67614633.5fbd2e1664ce9.png`,
  credits: [
    { role: "Artist", name: "Hung Ngo" },
    { role: "Animator", name: "Toan Dang" },
  ],
  tools: [],
  fields: ["Visual Effects", "Digital Art"],
  tags: [
    "animation",
    "spine 2D",
    "cute game",
    "puzzle game",
    "game mobile",
    "character animation",
  ],
  theme: {
    accent: "#84cc16",
    accentSoft: "#fbbf24",
    heroBackground:
      "radial-gradient(circle at top left, rgba(132,204,22,0.18), transparent 40%), radial-gradient(circle at top right, rgba(251,191,36,0.16), transparent 42%), radial-gradient(ellipse at 60% 0%, rgba(101,163,13,0.12), transparent 45%), linear-gradient(180deg, #0f1a0a 0%, #060a04 75%)",
    showcaseSectionBg: "#0f1508",
    showcasePanelBg: "#151f0c",
    sectionLabelBg: "#0f1508",
  },
  workflow: [
    { n: "01", t: "Art prep", sub: "Photoshop" },
    { n: "02", t: "Skinning", sub: "Spine 2D" },
    { n: "03", t: "Animation", sub: "Loops" },
    { n: "04", t: "Ship", sub: "Mobile" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "m01", variant: "banner", src: `${MW}/c93a5b67614633.5fbd2e1664ce9.png` },
  { id: "m02", variant: "sectionLabel", label: "Login Screen" },
  {
    id: "m03",
    variant: "videoEmbed",
    src: "https://www-ccv.adobe.io/v1/player/ccv/8GJxU2hbhrr/embed?api_key=behance1&bgcolor=%23191919",
    aspect: 619 / 1200,
  },
  { id: "m04", variant: "sectionLabel", label: "Player" },
  { id: "m05", variant: "fullGif", src: `${M}/1e081567614633.5fbd2e1664099.gif` },
  { id: "m06", variant: "fullGif", src: `${M}/96425a67614633.5fbd2e1662a6d.gif` },
  { id: "m07", variant: "fullGif", src: `${M}/b8312567614633.5fbd2e166721b.gif` },
  { id: "m08", variant: "fullGif", src: `${M}/71996467614633.5fbd2e1666aae.gif` },
  { id: "m09", variant: "fullGif", src: `${M}/cbb08a67614633.5fbd2e1661937.gif` },
  { id: "m10", variant: "fullGif", src: `${M}/7ea70b67614633.5fbd2e1662059.gif` },
  { id: "m11", variant: "fullGif", src: `${M}/fa5e1067614633.5fbd2e16632b3.gif` },
  { id: "m12", variant: "sectionLabel", label: "Boss" },
  { id: "m13", variant: "square", src: `${HD}/294bc567614633.5fbd2e1665952.gif` },
  { id: "m14", variant: "square", src: `${HD}/ec138c67614633.5fbd2e16663c5.gif` },
  { id: "m15", variant: "square", src: `${HD}/a7aa3067614633.5fbd2e166479a.gif` },
  { id: "m16", variant: "square", src: `${HD}/04b04567614633.5fbd2e1665e99.gif` },
  { id: "m17", variant: "square", src: `${HD}/47661867614633.5fbd2e1665283.gif` },
];

export const relatedProjects: readonly RelatedProject[] = [
  {
    id: "summoner-era-arena-of-heroes",
    title: "Animation for Summoner Era - Arena of Heroes",
    href: "/portfolio/summoner-era-arena-of-heroes",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/d4a408104755019.5f9b97c0a0f8a.png",
    appreciations: "136",
    views: "2.2K",
  },
  {
    id: "mid-autumn-summoner-era",
    title: "Mid Autumn Animation for Summoner Era",
    href: "/portfolio/mid-autumn-summoner-era",
    internal: true,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/4cd319112053013.Y3JvcCwxOTgxLDE1NTAsOSww.jpg",
    appreciations: "161",
    views: "2K",
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
];
