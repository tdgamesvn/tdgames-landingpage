import type { SpineMonster, SpineTier } from "@/components/portfolio/case-study-types";

// QUY CHUẨN làm hệ mới: .agent/meta/MONSTER-LEGENDS.md (sếp chốt 2026-10-18).
// Dùng chung cho mọi trang Monster Legends (khách Social Point) — mỗi hệ một trang:
// monster-legends-fire, monster-legends-water, … Asset upload bằng
// scripts/upload-monster-legends.mjs <Hệ>, nền bằng scripts/gen-monster-legends-bg.mjs <Hệ>.
// Sếp chốt: chỉ show nhân vật (bỏ fx_ultimate + avatar). Bậc: baby (_1) → adult (_3) →
// awakened (cao nhất) — tên hiển thị theo cách sếp gọi (2026-10-18).

const BASE_ANIMS = ["breathe", "walk", "special1", "levelup"] as const;
const FULL_ANIMS = ["breathe", "walk", "attack", "attack_skill", "special1", "levelup", "prone"] as const;

const TIER: Record<"stage1" | "stage3" | "awakened", Omit<SpineTier, "base">> = {
  stage1: { key: "stage1", label: "Baby", animations: BASE_ANIMS },
  stage3: { key: "stage3", label: "Adult", animations: FULL_ANIMS },
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
    // Thư mục khác "spine-v2" khi upload lại riêng con này (né cache CDN), vd "spine-v3".
    dir?: string,
  ): SpineMonster => ({
    id,
    name,
    rank,
    tiers: tiers.map((t) => ({
      ...TIER[t],
      base: `${dir ? spine.replace(/spine-v2$/, dir) : spine}/${id}/${t}`,
      scale: scale[t],
    })),
  });
}

/**
 * Con có Awakened + bậc thường (Baby/Adult) → tách 2 sân khấu liền nhau: Baby/Adult, rồi
 * Awakened riêng (sếp chốt 2026-10-19 — áp cho mọi hệ). Con chỉ có Awakened giữ nguyên.
 */
export function splitAwakened(roster: readonly SpineMonster[]): SpineMonster[] {
  return roster.flatMap((m) => {
    const awakened = m.tiers.filter((t) => t.key === "awakened");
    const normal = m.tiers.filter((t) => t.key !== "awakened");
    if (!awakened.length || !normal.length) return [m];
    return [
      { ...m, tiers: normal },
      { ...m, id: `${m.id}-awakened`, tiers: awakened },
    ];
  });
}

export function rosterStats(roster: readonly SpineMonster[]) {
  return {
    monsters: roster.length,
    rigs: roster.reduce((n, m) => n + m.tiers.length, 0),
    animations: roster.reduce((n, m) => n + m.tiers.reduce((k, t) => k + t.animations.length, 0), 0),
  };
}

/** Mô tả hero — chung chung, nói rõ vai trò studio + hướng dẫn bấm xem; KHÔNG nêu số lượng
 * nhân vật (sếp chốt 2026-10-18). */
export const summaryFor = (element: string) =>
  `We created the Spine 2D animation for the ${element} monsters of Social Point's Monster Legends shown below — each in its baby, adult and awakened forms, with its full set of battle animations. Tap a form or an animation under any monster to see it up close.`;

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
