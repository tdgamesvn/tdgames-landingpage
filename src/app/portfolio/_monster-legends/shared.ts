import type { SpineMonster, SpineTier } from "@/components/portfolio/case-study-types";

// Dùng chung cho mọi trang Monster Legends (khách Social Point) — mỗi hệ một trang:
// monster-legends-fire, monster-legends-water, … Asset upload bằng
// scripts/upload-monster-legends.mjs <Hệ>, nền bằng scripts/gen-monster-legends-bg.mjs <Hệ>.
// Sếp chốt: chỉ show nhân vật (bỏ fx_ultimate + avatar). Bậc: base (_1) → evolved (_3) →
// awakened (cao nhất).

const BASE_ANIMS = ["breathe", "walk", "special1", "levelup"] as const;
const FULL_ANIMS = ["breathe", "walk", "attack", "attack_skill", "special1", "levelup", "prone"] as const;

const TIER: Record<"stage1" | "stage3" | "awakened", Omit<SpineTier, "base">> = {
  stage1: { key: "stage1", label: "Base", animations: BASE_ANIMS },
  stage3: { key: "stage3", label: "Evolved", animations: FULL_ANIMS },
  awakened: { key: "awakened", label: "Awakened", animations: FULL_ANIMS, highlight: true },
};
type TierKey = keyof typeof TIER;

export const cdnFor = (element: string) =>
  `https://cdn.tdgamestudio.com/landing/portfolio/monster-legends-${element}`;

/** Hàm tạo quái cho một hệ. SpinePlayer tải qua proxy cùng origin (né CORS). */
export function monsterFactory(element: string) {
  const spine = `/api/cdn-proxy/landing/portfolio/monster-legends-${element}/spine-v2`;
  return (
    id: string,
    name: string,
    rank: string,
    tiers: readonly TierKey[],
    // Phóng riêng từng bậc khi tự đo cỡ vẫn lệch mắt (xem SpineTier.scale).
    scale: Partial<Record<TierKey, number>> = {},
  ): SpineMonster => ({
    id,
    name,
    rank,
    tiers: tiers.map((t) => ({ ...TIER[t], base: `${spine}/${id}/${t}`, scale: scale[t] })),
  });
}

export function rosterStats(roster: readonly SpineMonster[]) {
  return {
    monsters: roster.length,
    rigs: roster.reduce((n, m) => n + m.tiers.length, 0),
    animations: roster.reduce((n, m) => n + m.tiers.reduce((k, t) => k + t.animations.length, 0), 0),
  };
}

export const ANIMATION_LABELS = {
  breathe: "Idle",
  walk: "Walk",
  attack: "Attack",
  attack_skill: "Skill",
  special1: "Special",
  levelup: "Level up",
  prone: "Knocked out",
} as const;

export const WORKFLOW = [
  { n: "01", t: "Art Breakdown", sub: "Cut client art into parts" },
  { n: "02", t: "Rigging", sub: "One skeleton per evolution" },
  { n: "03", t: "Animation", sub: "Full battle set" },
  { n: "04", t: "In-Game Check", sub: "Scale, timing, export" },
] as const;
