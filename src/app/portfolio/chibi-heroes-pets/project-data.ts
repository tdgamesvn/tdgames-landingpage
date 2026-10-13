import type {
  CutsceneItem,
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";
import { relatedProjects as epicRelated } from "../epic-card/project-data";

const CDN = "https://cdn.tdgamestudio.com/landing/portfolio/chibi-heroes-pets";

// Nguồn: media-inbox/A002 (mã nội bộ dự án, 2026-10-13). Studio CHỈ làm animation
// Spine 2D. Khách chỉ giao ID → tên hiển thị tự đặt theo concept (như Stickman Legend).
// Clip gốc 640×480 nền #d3e6f8; đã nới đáy +64px bằng fillborders smear (nền khớp
// tuyệt đối) → 640×544, để chân + bóng nằm trên vùng caption ở đáy card.
const CLIP_ASPECT = 640 / 544;

const ANIM_LABEL: Record<string, string> = {
  idle: "Idle",
  run: "Run",
  attack: "Attack",
  skill: "Skill",
  hurt: "Hurt",
};

type Unit = { file: string; name: string; anims: readonly string[] };

const clips = (units: readonly Unit[]): CutsceneItem[] =>
  units.flatMap((u) =>
    u.anims.map((a) => ({
      src: `${CDN}/${u.file}_${a}.mp4`,
      poster: `${CDN}/${u.file}_${a}.jpg`,
      title: ANIM_LABEL[a] ?? a,
      kicker: u.name,
    })),
  );

const IR = ["idle", "run"] as const;

const HEROES: readonly Unit[] = [
  { file: "hero_31", name: "Valkyrie Knight", anims: IR },
  { file: "hero_28", name: "Thorn Dryad", anims: IR },
  { file: "hero_30", name: "Seraph Priestess", anims: IR },
];

const CHARACTERS: readonly Unit[] = [
  { file: "char_17", name: "Crimson Ninja", anims: IR },
  { file: "char_18", name: "Sunflower Sprite", anims: IR },
  { file: "char_19", name: "Fan Dancer", anims: IR },
  { file: "char_20", name: "Wandering Ronin", anims: IR },
  { file: "char_21", name: "Owl Sage", anims: IR },
  { file: "char_22", name: "Star Warlock", anims: IR },
  { file: "char_23", name: "Iron Fist Brawler", anims: IR },
  { file: "char_24", name: "Bat Demon", anims: IR },
  { file: "char_25", name: "Count Vamp", anims: IR },
  { file: "char_26", name: "Flame Swordsman", anims: IR },
  { file: "char_27", name: "Golden Monk", anims: IR },
  { file: "char_29", name: "Bazooka Orc", anims: IR },
];

const PETS: readonly Unit[] = [
  { file: "pet_1", name: "Goblin Porter", anims: IR },
  { file: "pet_2", name: "Red Panda", anims: IR },
  { file: "pet_3", name: "Shiba Pup", anims: IR },
  { file: "pet_4", name: "Reindeer Santa", anims: IR },
  { file: "pet_5", name: "Pumpkin Cat", anims: IR },
  { file: "pet_6", name: "Angel Blade", anims: IR },
  { file: "pet_7", name: "Leafy Sprout", anims: IR },
  { file: "pet_8", name: "Crown Cloud", anims: ["idle", "run", "skill"] },
  { file: "pet_9", name: "Chatty Sign", anims: ["idle", "run", "skill", "hurt"] },
];

const SUMMONS: readonly Unit[] = [
  { file: "summon_6", name: "Boar Warrior", anims: ["idle", "run", "attack"] },
  { file: "summon_7", name: "Oni Guardian", anims: ["idle", "run", "attack"] },
];

const grid = (id: string, units: readonly Unit[]): ShowcaseModule => ({
  id,
  variant: "cutsceneGrid",
  aspect: CLIP_ASPECT,
  columns: 3,
  items: clips(units),
});

export const projectMeta: ProjectMeta = {
  title: "Chibi Heroes & Pets — Spine 2D Casual Animation",
  eyebrow: "Case study · Client work",
  summary:
    "A bright, bouncy cast of 26 chibi heroes, characters, pets and summons animated in Spine 2D for a casual mobile game — every one with its own personality in a single idle and run.",
  heroTitle: {
    primary: [
      { text: "Chibi", color: "white" },
      { text: " " },
      { text: "Heroes", color: "accent" },
      { text: " & " , color: "white" },
      { text: "Pets", color: "accentSoft" },
    ],
    subtitle: [
      { text: "Casual Character Animation", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: "26 characters", label: "Animated", icon: "cube" },
    { value: "57 animations", label: "Delivered", icon: "calendar" },
    { value: "Animation · Spine 2D", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Spine 2D rigging & animation from client art",
    "Idle and run cycles for every unit",
    "Extra attack, skill and hurt sets for pets & summons",
  ],
  overview: {
    body: "The client handed us a big roster of finished chibi designs — heroes, playable characters, companion pets and battle summons — and asked for animation that feels as cute and lively as the art. We rigged every unit in Spine 2D so it runs natively in the game engine, then gave each one a personality through motion: a knight who plants her oversized sword, a ninja whose scarf never stops flowing, a Shiba that bounces on every step and a little rain cloud that floats and drizzles. Big heads and tiny bodies need extra care, so we leaned on squash-and-stretch, overlapping hair and cloth, and snappy run cycles that read clearly even at small sizes on a phone screen.",
    stats: [
      { value: "26", label: "Characters" },
      { value: "57", label: "Animations" },
      { value: "4", label: "Unit types" },
      { value: "Spine 2D", label: "Built with" },
    ],
  },
  behanceUrl: "",
  coverImage: `${CDN}/char_17_idle.jpg`,
  coverVideo: `${CDN}/char_17_idle.mp4`,
  coverPosition: "center",
  tools: ["Spine 2D"],
  fields: ["Character Animation", "Spine 2D"],
  tags: [
    "casual game",
    "chibi",
    "character animation",
    "pet animation",
    "spine",
    "spine 2D animation",
    "mobile game",
  ],
  // Layout chữ trắng cố định → không làm nền sáng được; "tươi sáng" bằng nền indigo
  // rực + glow vàng/hồng/xanh trời, còn ô video giữ nền pastel #d3e6f8.
  theme: {
    accent: "#ffc83d",
    accentSoft: "#7fd4ff",
    heroBackground:
      "radial-gradient(circle at 15% 10%, rgba(255,200,61,0.30), transparent 40%), radial-gradient(circle at 85% 15%, rgba(255,120,190,0.24), transparent 42%), radial-gradient(circle at 50% 100%, rgba(127,212,255,0.22), transparent 50%), linear-gradient(180deg, #2a2f7a 0%, #1a1e52 70%)",
    showcaseSectionBg: "#1a1e52",
    showcasePanelBg: "#21266a",
    sectionLabelBg: "#1a1e52",
  },
  workflow: [
    { n: "01", t: "Art Breakdown", sub: "Cut client art into parts" },
    { n: "02", t: "Rigging", sub: "Bones, meshes, weights" },
    { n: "03", t: "Animation", sub: "Idle, run, attack, skill" },
    { n: "04", t: "In-Game Check", sub: "Scale, timing, export" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  { id: "label-heroes", variant: "sectionLabel", label: "Heroes" },
  grid("heroes", HEROES),
  { id: "label-characters", variant: "sectionLabel", label: "Characters" },
  grid("characters", CHARACTERS),
  { id: "label-pets", variant: "sectionLabel", label: "Pets" },
  grid("pets", PETS),
  { id: "label-summons", variant: "sectionLabel", label: "Summons" },
  grid("summons", SUMMONS),
  {
    id: "closing",
    variant: "closing",
    text: "Tiny heroes,",
    highlight: "big personality.",
    backgroundVideo: `${CDN}/hero_31_run.mp4`,
    backgroundPoster: `${CDN}/hero_31_run.jpg`,
    cta: { label: "Ask for similar work", href: "/contact" },
  },
];

export const relatedProjects: readonly RelatedProject[] = epicRelated;
