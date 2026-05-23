import type {
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";


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
  coverImage: "https://tdgamestudio.com/landing/behance/0658c26a43e63dc4.png",
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
  { id: "m01", variant: "banner", src: "https://tdgamestudio.com/landing/behance/0658c26a43e63dc4.png" },
  { id: "m02", variant: "sectionLabel", label: "Login Screen" },
  {
    id: "m03",
    variant: "videoEmbed",
    src: "https://www-ccv.adobe.io/v1/player/ccv/8GJxU2hbhrr/embed?api_key=behance1&bgcolor=%23191919",
    aspect: 619 / 1200,
  },
  { id: "m04", variant: "sectionLabel", label: "Player" },
  { id: "m05", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/ca575c9ff27edbf6.mp4" },
  { id: "m06", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/c616af44787d814c.mp4" },
  { id: "m07", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/4cbeae6956d68586.mp4" },
  { id: "m08", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/1cdf92e397fb9ab2.mp4" },
  { id: "m09", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/40b55d20223e14fc.mp4" },
  { id: "m10", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/ae8666d3edccf0d1.mp4" },
  { id: "m11", variant: "fullGif", src: "https://tdgamestudio.com/landing/behance/86d4a31151121f93.mp4" },
  { id: "m12", variant: "sectionLabel", label: "Boss" },
  { id: "m13", variant: "square", src: "https://tdgamestudio.com/landing/behance/7741aa930b977aea.mp4" },
  { id: "m14", variant: "square", src: "https://tdgamestudio.com/landing/behance/3fd13caec1338033.mp4" },
  { id: "m15", variant: "square", src: "https://tdgamestudio.com/landing/behance/178fd1acf0fb915b.mp4" },
  { id: "m16", variant: "square", src: "https://tdgamestudio.com/landing/behance/6b2ac3972fe981e8.mp4" },
  { id: "m17", variant: "square", src: "https://tdgamestudio.com/landing/behance/65513b96d4eeb59d.mp4" },
];

export const relatedProjects: readonly RelatedProject[] = [
  {
    id: "summoner-era-arena-of-heroes",
    title: "Animation for Summoner Era - Arena of Heroes",
    href: "/portfolio/summoner-era-arena-of-heroes",
    internal: true,
    badge: "Case study",
    image:
      "https://tdgamestudio.com/landing/behance/1a2bf9c55f457909.png",
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
      "https://tdgamestudio.com/landing/behance/2d586b5a85d5dfb9.jpg",
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
      "https://tdgamestudio.com/landing/behance/d4011a345f6c4002.png",
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
      "https://tdgamestudio.com/landing/behance/807956f4ca57c6ed.jpg",
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
      "https://tdgamestudio.com/landing/behance/4974242912a7c2f1.png",
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
      "https://tdgamestudio.com/landing/behance/9fed6d92877b5d19.png",
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
      "https://tdgamestudio.com/landing/behance/379f981b88c6a84f.png",
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
      "https://tdgamestudio.com/landing/behance/011ed49edb1767f3.png",
    appreciations: "627",
    views: "6.0K",
  },
];
