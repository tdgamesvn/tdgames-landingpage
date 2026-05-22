export const projectMeta = {
  title: "Summoner Era — Login Screen Animations (2020)",
  eyebrow: "Case study",
  summary:
    "Splash art (login screens) for Summoner Era at Zitga Studio in 2020 — story-driven loops that introduce new champions, events and game updates.",
  heroTitle: {
    primary: [{ text: "SUMMONER ERA", color: "accent" }],
    subtitle: [
      { text: "Login Screen ", color: "white" },
      { text: "Animations", color: "accentSoft" },
      { text: " · ", color: "divider" },
      { text: "2020", color: "soft" },
    ],
  },
  heroFacts: [
    { value: "May 2022", label: "Published", icon: "calendar" },
    { value: "Game (Mobile)", label: "Project type", icon: "cube" },
    { value: "Ps", label: "Pipeline", icon: "users" },
  ] as const,
  deliverables: [
    "Splash art / login screens",
    "Character & event reveals",
    "VFX passes for skills and ambient FX",
  ] as const,
  overview: {
    body: "Animated splash art (login screens) created for the mobile game Summoner Era at Zitga Studio in 2020. Each time players launch the game, the first thing they see is one of these animated digital paintings showing what's new — from champion launches like Charon and Diadora to seasonal events: Birthday, Easter and Mid Autumn. Static illustrations from the Art team were brought to life with Spine 2D, After Effects and Photoshop.",
    stats: [
      { value: "89", label: "Appreciations" },
      { value: "1.7K", label: "Views" },
      { value: "6", label: "Comments" },
      { value: "3", label: "Fields" },
    ],
  },
  behanceUrl:
    "https://www.behance.net/gallery/144430837/Summoner-Era-Login-Screen-Animations-%282020%29",
  madeForLabel: "AnimVFX Clan",
  madeForUrl: "https://www.behance.net/AnimVFXClan",
  coverImage:
    "https://mir-s3-cdn-cf.behance.net/projects/max_808/1efef4144430837.Y3JvcCwxOTgxLDE1NTAsOSww.jpg",
  tools: [] as string[],
  fields: ["Visual Effects"] as const,
  tags: [
    "animation",
    "Champions",
    "character animation",
    "characters",
    "creatures",
    "login screen",
    "splash animation",
    "SUMMONER",
    "vfx",
    "video game",
  ] as const,
  theme: {
    accent: "#22d3ee",
    accentSoft: "#ffffff",
    heroBackground:
      "radial-gradient(circle at top left, rgba(34,211,238,0.18), transparent 35%), radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 38%), linear-gradient(180deg, #0a1a1f 0%, #050a0c 75%)",
    showcaseSectionBg: "#0f1f24",
    showcasePanelBg: "#1a2a2f",
    sectionLabelBg: "#0f1f24",
  },
  workflow: [
    { n: "01", t: "Concept & Style", sub: "Moodboard · refs" },
    { n: "02", t: "Rig & Animate", sub: "Spine 2D" },
    { n: "03", t: "VFX Layer", sub: "After Effects" },
    { n: "04", t: "Polish & Deliver", sub: "QA · handoff" },
  ],
} as const;

const ROLE_CAPTION = "My Role: All Animation / FX · Splash Team — Summoner Era";

export const showcaseModules = [
  {
    id: "intro",
    variant: "intro" as const,
    title: "Introduction",
    body: "This is a collection of my work on animated splash art (Login Screens) for the mobile game \"Summoner Era\" at Zitga Studio in 2020. Each time players launch the game, the first thing they see is one of these animated digital paintings, which show players what's new in the game. The screens here show my work on new champions and their new updates.",
    closing:
      "Everything seen below is the result of the great teams and people at Zitga Studio. The Art team created the awesome illustrations for us to animate. Enjoy and feedback if possible — thanks for your support!",
  },
  {
    id: "ch01",
    variant: "chapter" as const,
    title: "Charon",
    subtitle: "Hell's Ferryman",
    role: ROLE_CAPTION,
    embedSrc:
      "https://player.vimeo.com/video/881148755?autoplay=1&loop=1&title=0&byline=0&portrait=0&muted=1",
    aspectRatio: "16 / 9",
  },
  {
    id: "ch02",
    variant: "chapter" as const,
    title: "Birthday",
    subtitle: "Summoner Era birthday event",
    role: ROLE_CAPTION,
    embedSrc:
      "https://player.vimeo.com/video/713156017?h=dbece84ee8&autoplay=1&loop=1&title=0&byline=0&portrait=0&muted=1",
    aspectRatio: "16 / 9",
  },
  {
    id: "ch03",
    variant: "chapter" as const,
    title: "Easter",
    subtitle: "Easter event",
    role: ROLE_CAPTION,
    embedSrc:
      "https://player.vimeo.com/video/713111614?h=bc8af04fcc&autoplay=1&loop=1&title=0&byline=0&portrait=0&muted=1",
    aspectRatio: "1920 / 1180",
  },
  {
    id: "ch04",
    variant: "chapter" as const,
    title: "Mid Autumn",
    subtitle: "Mid Autumn festival event",
    role: ROLE_CAPTION,
    embedSrc:
      "https://player.vimeo.com/video/713157596?h=dfd2f15a9b&autoplay=1&loop=1&title=0&byline=0&portrait=0&muted=1",
    aspectRatio: "16 / 9",
  },
  {
    id: "ch05",
    variant: "chapter" as const,
    title: "Diadora",
    subtitle: "Diadora hero launch event",
    role: ROLE_CAPTION,
    embedSrc:
      "https://player.vimeo.com/video/713162301?h=ebcf3a5bb2&autoplay=1&loop=1&title=0&byline=0&portrait=0&muted=1",
    aspectRatio: "16 / 9",
  },
  {
    id: "outro",
    variant: "outro" as const,
    text: "Thanks for viewing all this out, and for your support!",
  },
] as const;

export const relatedProjects = [
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
  {
    id: "axie-infinity-origins",
    title: "Axie Infinity - Origins | Animation",
    href: "/portfolio/axie-infinity-origins",
    internal: true as const,
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
    internal: true as const,
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
    internal: true as const,
    badge: "Case study",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/501fca163362313.Y3JvcCwxOTgxLDE1NTAsOSww.png",
    appreciations: "138",
    views: "1.8K",
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
] as const;
