export const projectMeta = {
  title: "Art Study",
  eyebrow: "Personal Project",
  summary:
    "A collection of character design studies and digital art explorations. Focusing on anatomy, color theory, and stylized character illustrations.",
  heroTitle: {
    primary: [
      { text: "ART ", color: "accent" },
      { text: "STUDY", color: "white" },
    ],
    subtitle: [
      { text: "Character Design ", color: "accentSoft" },
      { text: "· ", color: "divider" },
      { text: "Digital Art", color: "soft" },
    ],
  },
  heroFacts: [
    { value: "Aug 2017", label: "Published", icon: "calendar" },
    { value: "Personal", label: "Project type", icon: "cube" },
    { value: "Photoshop", label: "Tools", icon: "users" },
  ] as const,
  deliverables: [
    "Character design studies",
    "Digital painting techniques",
    "Anatomy and pose exploration",
  ] as const,
  overview: {
    body: "A personal collection of character design studies exploring different styles, techniques, and approaches to digital art. Each piece focuses on improving fundamental skills in anatomy, color theory, lighting, and character expression.",
    stats: [
      { value: "22", label: "Appreciations" },
      { value: "1.1K", label: "Views" },
      { value: "6", label: "Artworks" },
      { value: "3", label: "Fields" },
    ],
  },
  behanceUrl: "https://www.behance.net/gallery/56034977/Art-Study",
  madeForLabel: "Personal Study",
  madeForUrl: "#",
  coverImage:
    "https://cdn.tdgamestudio.com/landing/behance/2e9463653cd72994.jpg",
  tools: ["Photoshop"] as const,
  fields: ["Digital Art", "Character Design", "Illustration"] as const,
  tags: [
    "character design",
    "digital art",
    "illustration",
    "anatomy",
    "study",
    "personal project",
  ] as const,
  theme: {
    accent: "#ff8c3a",
    accentSoft: "#3b82f6",
    accentTertiary: "#a855f7",
    heroBackground:
      "radial-gradient(circle at top left, rgba(255,140,58,0.15), transparent 35%), radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 38%), linear-gradient(180deg, #0a0a14 0%, #050508 75%)",
    showcaseSectionBg: "#0a0a14",
    showcasePanelBg: "#12121a",
    sectionLabelBg: "#0a0a14",
  },
  workflow: [
    { n: "01", t: "Sketch", sub: "Rough concepts" },
    { n: "02", t: "Refine", sub: "Clean linework" },
    { n: "03", t: "Color", sub: "Base colors" },
    { n: "04", t: "Render", sub: "Lighting · details" },
  ],
} as const;

export const showcaseModules = [
  {
    id: "intro",
    variant: "intro" as const,
    title: "Character Design Studies",
    body: "This collection showcases various character design studies created to explore different artistic styles, techniques, and approaches. Each piece represents a step in developing stronger fundamentals in anatomy, color theory, and character expression.",
    closing:
      "These studies helped refine my understanding of form, lighting, and storytelling through character design.",
  },
  {
    id: "img01",
    variant: "image" as const,
    src: "https://cdn.tdgamestudio.com/landing/behance/2e9463653cd72994.jpg",
    caption: "Character Study 01",
  },
  {
    id: "img02",
    variant: "image" as const,
    src: "https://cdn.tdgamestudio.com/landing/behance/fc155f68bfc34b54.jpg",
    caption: "Character Study 02",
  },
  {
    id: "img03",
    variant: "image" as const,
    src: "https://cdn.tdgamestudio.com/landing/behance/a286c6ce7084463f.jpg",
    caption: "Character Study 03",
  },
  {
    id: "img04",
    variant: "image" as const,
    src: "https://cdn.tdgamestudio.com/landing/behance/d88bb4eedc86271f.jpg",
    caption: "Character Study 04",
  },
  {
    id: "img05",
    variant: "image" as const,
    src: "https://cdn.tdgamestudio.com/landing/behance/47797ac9ea5b2164.jpg",
    caption: "Character Study 05",
  },
  {
    id: "img06",
    variant: "image" as const,
    src: "https://cdn.tdgamestudio.com/landing/behance/adb3314f89b2e4f0.jpg",
    caption: "Character Study 06",
  },
  {
    id: "outro",
    variant: "outro" as const,
    text: "Continuous practice and study lead to growth as an artist.",
  },
] as const;

export const relatedProjects = [
  {
    id: "summoner-era",
    title: "ANIMATION/VFX - HEROES LIGHT/DARK | SUMMONER ERA",
    href: "/portfolio/summoner-era",
    internal: true as const,
    badge: "Case study",
    image:
      "https://cdn.tdgamestudio.com/landing/behance/7b463f2be013bcd3.jpg",
    appreciations: "208",
    views: "2.3K",
  },
  {
    id: "horse-racing",
    title: "Horse Racing - Splash Art Animation",
    href: "/portfolio/horse-racing",
    internal: true as const,
    badge: "Case study",
    image:
      "https://cdn.tdgamestudio.com/landing/behance/50a462dee6f25801.jpg",
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
      "https://cdn.tdgamestudio.com/landing/behance/bcd3c09a543c36d3.png",
    appreciations: "138",
    views: "1.8K",
  },
  {
    id: "axie-infinity-origins",
    title: "Axie Infinity - Origins | Animation",
    href: "/portfolio/axie-infinity-origins",
    internal: true as const,
    badge: "Case study",
    image:
      "https://cdn.tdgamestudio.com/landing/behance/2bac7de14d05fa8f.png",
    appreciations: "1.1K",
    views: "12.2K",
  },
] as const;
