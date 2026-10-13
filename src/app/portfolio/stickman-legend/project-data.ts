import type {
  CutsceneItem,
  ProjectMeta,
  RelatedProject,
  ShowcaseModule,
} from "@/components/portfolio/case-study-types";
import { relatedProjects as epicRelated } from "../epic-card/project-data";

const CDN = "https://cdn.tdgamestudio.com/landing/portfolio/stickman-legend";

// Nguồn: media-inbox/Stickman Legend (sếp 2026-10-13). Khách không đặt tên quái —
// chỉ có ID, nên caption giữ nguyên ID. Studio chỉ làm animation Spine 2D (không
// thiết kế quái, không VFX riêng). Clip gốc lệch khung (1280×720 / 720×720 /
// 960×720) → đã chuẩn hoá hết về 960×720, nền #3a3b42 như bản export gốc.
const CLIP_ASPECT = 960 / 720;

const ANIMS = [
  ["idle", "Idle"],
  ["move", "Move"],
  ["attack", "Attack"],
  ["skill_01", "Skill 01"],
  ["skill_02", "Skill 02"],
] as const;

const clip = (id: string, anim: string, title: string, name: string): CutsceneItem => ({
  src: `${CDN}/${id}_${anim}.mp4`,
  poster: `${CDN}/${id}_${anim}.jpg`,
  title,
  kicker: name,
});

// Khách chỉ giao ID. Sếp (2026-10-13): hiện ID không hay → tự đặt tên theo concept.
// `id` vẫn là tên file trên CDN, `name` chỉ để hiển thị.
// 3013 không có clip move trong bộ bàn giao.
const MONSTERS = [
  { id: "3008", name: "Cerberus Hound", anims: ["idle", "move", "attack", "skill_01", "skill_02"] }, // chó ba đầu
  { id: "3009", name: "Brood Mother", anims: ["idle", "move", "attack", "skill_01", "skill_02"] }, // nhện cõng trứng
  { id: "3010", name: "Gorehorn Maw", anims: ["idle", "move", "attack", "skill_01", "skill_02"] }, // miệng răng + sừng đỏ
  { id: "3012", name: "Bonecrusher Brute", anims: ["idle", "move", "attack", "skill_01", "skill_02"] }, // vác chuỳ gai
  { id: "3013", name: "Nightwing Demon", anims: ["idle", "attack", "skill_01", "skill_02"] }, // quỷ cánh dơi
] as const;

export const projectMeta: ProjectMeta = {
  title: "Stickman Legend — Spine 2D Monster Animation",
  eyebrow: "Case study · Client work",
  summary:
    "A roster of boss and elite monsters animated in Spine 2D — idle, movement, attacks and two signature skills per creature, ready to drop straight into the game engine.",
  heroTitle: {
    primary: [
      { text: "Stickman", color: "white" },
      { text: " " },
      { text: "Legend", color: "accent" },
    ],
    subtitle: [
      { text: "Monster Animation", color: "accent" },
      { text: " · ", color: "divider" },
      { text: "Spine 2D", color: "accentSoft" },
    ],
  },
  heroFacts: [
    { value: "5 monsters", label: "Animated", icon: "cube" },
    { value: "24 animations", label: "Delivered", icon: "calendar" },
    { value: "Animation · Spine 2D", label: "Our scope", icon: "users" },
  ],
  deliverables: [
    "Spine 2D rigging & animation from client art",
    "Idle, move and basic attack loops",
    "Two signature skill animations per monster",
  ],
  overview: {
    body: "The client supplied finished monster designs; our job was to bring them to life in Spine 2D. Each creature got a full combat set — an idle that sells its weight, a movement cycle, a basic attack and two signature skills — rigged as lightweight skeletal animation so they run natively in the game engine. The roster is deliberately varied: the three-headed Cerberus Hound, the egg-laden Brood Mother, the Gorehorn Maw, the club-wielding Bonecrusher Brute and the Nightwing Demon, each needing its own rig logic and sense of mass. We kept the black-and-crimson silhouettes readable at a glance and timed every attack with a clear anticipation, strike and recovery so every hit reads clearly in combat.",
    stats: [
      { value: "5", label: "Monsters" },
      { value: "24", label: "Animations" },
      { value: "2", label: "Skills each" },
      { value: "Spine 2D", label: "Built with" },
    ],
  },
  behanceUrl: "",
  coverImage: `${CDN}/3010_skill_02.jpg`,
  coverVideo: `${CDN}/3010_skill_02.mp4`,
  coverPosition: "center",
  tools: ["Spine 2D"],
  fields: ["Character Animation", "Spine 2D"],
  tags: [
    "monster animation",
    "boss animation",
    "spine",
    "spine 2D animation",
    "creature rig",
    "Stickman Legend",
  ],
  theme: {
    accent: "#ff3b3b",
    accentSoft: "#c9ccd6",
    heroBackground:
      "radial-gradient(circle at top left, rgba(255,59,59,0.18), transparent 42%), radial-gradient(circle at top right, rgba(201,204,214,0.08), transparent 44%), linear-gradient(180deg, #0d0b0c 0%, #060606 75%)",
    showcaseSectionBg: "#0c0b0c",
    showcasePanelBg: "#131214",
    sectionLabelBg: "#0c0b0c",
  },
  workflow: [
    { n: "01", t: "Art Breakdown", sub: "Split client art into parts" },
    { n: "02", t: "Rigging", sub: "Bones, meshes, weights" },
    { n: "03", t: "Animation", sub: "Idle, move, attack, skills" },
    { n: "04", t: "In-Game Check", sub: "Timing, hitbox, export" },
  ],
};

export const showcaseModules: readonly ShowcaseModule[] = [
  ...MONSTERS.flatMap((m): ShowcaseModule[] => [
    { id: `label-${m.id}`, variant: "sectionLabel", label: m.name },
    {
      id: `monster-${m.id}`,
      variant: "cutsceneGrid",
      aspect: CLIP_ASPECT,
      items: m.anims.map((a) =>
        clip(m.id, a, ANIMS.find(([k]) => k === a)?.[1] ?? a, m.name),
      ),
    },
  ]),
  {
    id: "closing",
    variant: "closing",
    text: "Five monsters,",
    highlight: "every hit felt.",
    backgroundVideo: `${CDN}/3013_skill_02.mp4`,
    backgroundPoster: `${CDN}/3013_skill_02.jpg`,
    cta: { label: "Ask for similar work", href: "/contact" },
  },
];

export const relatedProjects: readonly RelatedProject[] = epicRelated;
