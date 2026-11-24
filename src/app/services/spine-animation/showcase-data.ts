import { PROJECT_PROVENANCE, provenanceCardLabel } from "@/lib/project-provenance";

// Trang /services/spine-animation (sếp duyệt mockup v2 + chốt 2026-11-24). Dự án ưu tiên:
// Yomi 2, Monster Legends, The Twins, Stickman Legend, Kayn Snow Moon, Summoner Era.
// Media mới (poster, ảnh tĩnh) ở R2 `landing/services/spine-animation/*-v1.jpg`.

const CDN = "https://cdn.tdgamestudio.com/landing";
export const PAGE_CDN = `${CDN}/services/spine-animation`;
const YOMI = `${CDN}/portfolio/yomi-2`;
const STICK = `${CDN}/portfolio/stickman-legend`;
const BEHANCE = `${CDN}/behance`;

const summonerEra = PROJECT_PROVENANCE["summoner-era"];
/** Nhãn bắt buộc cho việc cũ của founder (project-provenance), vd "Founder's previous work · Zitga". */
export const SUMMONER_ERA_LABEL = summonerEra.label;

export type RosterPick = {
  key: string;
  /** Tên trên thẻ roster. */
  name: string;
  /** Dòng nhỏ dưới tên thẻ. */
  kicker: string;
  /** Góc phải màn lớn: đang chiếu gì. */
  playing: string;
  /** Nhãn nguồn gốc / loại việc dưới dòng "playing". */
  tag: string;
  video?: string;
  poster: string;
  /** object-position cho màn lớn (ảnh/video khác tỉ lệ). */
  focus?: string;
  /** object-position + phóng cho ảnh thẻ roster. */
  thumbFocus?: string;
  thumbZoom?: number;
  href: string;
};

export const ROSTER: readonly RosterPick[] = [
  {
    key: "yomi-2",
    name: "Yomi 2",
    kicker: "Super-move cutscenes",
    playing: "Gwen, “Desperation” super move",
    tag: "Client work, 18 cutscenes delivered",
    video: `${YOMI}/gwen-desperation.mp4`,
    poster: `${YOMI}/gwen-desperation.jpg`,
    href: "/portfolio/yomi-2",
  },
  {
    key: "monster-legends",
    name: "Monster Legends",
    kicker: "Social Point, live Spine",
    playing: "Kennix Solaris, adult form",
    tag: "Client work for Social Point",
    poster: `${PAGE_CDN}/monster-legends-kennix-v1.jpg`,
    thumbFocus: "50% 20%",
    href: "/portfolio/monster-legends",
  },
  {
    key: "the-twins",
    name: "The Twins",
    kicker: "Boss animation",
    playing: "Samurai boss, combo attack",
    tag: "10 boss reels in Spine",
    poster: `${PAGE_CDN}/twins-samurai-combo1-v1.jpg`,
    focus: "62% 72%",
    thumbFocus: "58% 66%",
    thumbZoom: 1.5,
    href: "/portfolio/boss-animation",
  },
  {
    key: "stickman-legend",
    name: "Stickman Legend",
    kicker: "Monster roster",
    playing: "Nightwing Demon, skill 02",
    tag: "Client work, full monster kits",
    video: `${STICK}/3013-v3_skill_02.mp4`,
    poster: `${STICK}/3013-v3_skill_02.jpg`,
    focus: "50% 60%",
    thumbZoom: 1.5,
    href: "/portfolio/stickman-legend",
  },
  {
    key: "kayn-snow-moon",
    name: "Kayn Snow Moon",
    kicker: "Login screen, fan-made",
    playing: "League of Legends login screen",
    tag: "Fan-made piece",
    poster: `${PAGE_CDN}/kayn-snow-moon-v1.jpg`,
    focus: "50% 30%",
    thumbFocus: "50% 25%",
    href: "/portfolio/kayn-snow-moon",
  },
  {
    key: "summoner-era",
    name: "Summoner Era",
    kicker: provenanceCardLabel(summonerEra),
    playing: "Light hero, skill attack",
    tag: SUMMONER_ERA_LABEL,
    video: `${BEHANCE}/c035a6f77f87a15b.mp4`,
    poster: `${PAGE_CDN}/summoner-era-knight-skill-v1.jpg`,
    focus: "30% 50%",
    thumbFocus: "18% 24%",
    thumbZoom: 1.4,
    href: "/portfolio/summoner-era",
  },
];

export const STICKMAN = {
  main: { name: "Nightwing Demon", anim: "Skill 02", video: `${STICK}/3013-v3_skill_02.mp4`, poster: `${STICK}/3013-v3_skill_02.jpg` },
  side: [
    { name: "Cerberus Hound", anim: "Skill 01", video: `${STICK}/3008_skill_01.mp4`, poster: `${STICK}/3008_skill_01.jpg` },
    { name: "Bonecrusher Brute", anim: "Attack", video: `${STICK}/3012_attack.mp4`, poster: `${STICK}/3012_attack.jpg` },
  ],
  /** Bộ bàn giao mỗi quái (project-data stickman-legend). */
  kit: ["Idle", "Move", "Attack", "Skill 01", "Skill 02"],
} as const;

export const YOMI_CLIPS = [
  { who: "Vendetta", move: "Maximum Ven", video: `${YOMI}/vendetta-maximum-ven.mp4`, poster: `${YOMI}/vendetta-maximum-ven.jpg` },
  { who: "Zane", move: "Maximum Anarchy", video: `${YOMI}/zane-maximum-anarchy.mp4`, poster: `${YOMI}/zane-maximum-anarchy.jpg` },
  { who: "Bigby", move: "Long Arm of the Law", video: `${YOMI}/bigby-long-arm-of-the-law.mp4`, poster: `${YOMI}/bigby-long-arm-of-the-law.jpg` },
] as const;

export const SUMMONER_ERA_CLIPS = [
  { video: `${BEHANCE}/8fac62466998e08c.mp4`, poster: `${PAGE_CDN}/summoner-era-mage-skill-v1.jpg`, label: "Winged mage, skill" },
  { video: `${BEHANCE}/ae87f42e367012cd.mp4`, poster: `${PAGE_CDN}/summoner-era-sphinx-skill-v1.jpg`, label: "Sphinx rider, attack" },
] as const;

export const TWINS = {
  poster: `${PAGE_CDN}/twins-samurai-combo4-v1.jpg`,
  moves: ["Idle", "Combo 1", "Combo 3", "Combo 4", "Skill"],
} as const;

export const KAYN_IMAGE = `${PAGE_CDN}/kayn-snow-moon-v1.jpg`;
