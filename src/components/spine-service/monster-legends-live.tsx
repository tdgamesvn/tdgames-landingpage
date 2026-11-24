"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { ProjectTheme, SpineMonster } from "@/components/portfolio/case-study-types";

// Spine runtime (~300KB) chỉ tải ở client, như trang Monster Legends.
const SpineStage = dynamic(() => import("@/components/portfolio/spine-stage"), { ssr: false });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Player = any;

/** Số lane xương hiển thị (xương có nhiều key nhất trong animation đang chạy). */
const LANES = 5;
const FPS = 30;

type Sheet = {
  name: string;
  duration: number;
  version: string;
  boneCount: number;
  lanes: { bone: string; keys: number[] }[];
  events: { t: number; name: string }[];
};

/**
 * Đọc key thật từ animation đang chạy trên track 0: gom mọi timeline của từng xương
 * (xoay/dời/co giãn…), lấy thời điểm key, chọn LANES xương nhiều key nhất. Timeline sự kiện
 * (vd "hit") vẽ màu đỏ. Duck-typing vì bundle production đổi tên class của spine-core.
 */
function readSheet(player: Player): Sheet | null {
  const anim = player?.animationState?.getCurrent?.(0)?.animation;
  const bones = player?.skeleton?.data?.bones;
  if (!anim || !bones || !(anim.duration > 0)) return null;
  const byBone = new Map<number, Set<number>>();
  const events: Sheet["events"] = [];
  for (const tl of anim.timelines ?? []) {
    const frames: ArrayLike<number> | undefined = tl.frames;
    if (!frames) continue;
    if (Array.isArray(tl.events)) {
      tl.events.forEach((e: Player, i: number) => events.push({ t: frames[i], name: e?.data?.name ?? "event" }));
      continue;
    }
    if (typeof tl.boneIndex !== "number") continue;
    const step = typeof tl.getFrameEntries === "function" ? tl.getFrameEntries() : 1;
    const set = byBone.get(tl.boneIndex) ?? new Set<number>();
    for (let i = 0; i < frames.length; i += step) set.add(Math.round(frames[i] * FPS));
    byBone.set(tl.boneIndex, set);
  }
  // Nhiều key nhất thường là cả chuỗi tail16/tail17/feather1_…/feather3_… → mỗi "họ" xương
  // (phần chữ đầu tên) chỉ lấy 1 lane cho dopesheet đa dạng.
  const family = (n: string) => n.toLowerCase().match(/^[a-z]+/)?.[0] ?? n;
  const seen = new Set<string>();
  const lanes = [...byBone.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .filter(([i]) => {
      const f = family(bones[i]?.name ?? "");
      if (seen.has(f)) return false;
      seen.add(f);
      return true;
    })
    .slice(0, LANES)
    .sort((a, b) => a[0] - b[0])
    .map(([i, set]) => ({ bone: bones[i]?.name ?? `bone ${i}`, keys: [...set].sort((x, y) => x - y).map((f) => f / FPS) }));
  const data = player.skeleton.data;
  return { name: anim.name, duration: anim.duration, version: data.version ?? "", boneCount: bones.length, lanes, events };
}

function Dopesheet({ player, labels }: { player: Player | null; labels: Readonly<Record<string, string>> }) {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!player) return;
    let raf = 0;
    let last = "";
    const tick = () => {
      raf = requestAnimationFrame(tick);
      let entry: Player;
      try {
        entry = player.animationState?.getCurrent?.(0);
      } catch {
        return;
      }
      const anim = entry?.animation;
      if (!anim) return;
      if (anim.name !== last) {
        last = anim.name;
        setSheet(readSheet(player));
      }
      const d = anim.duration || 1;
      const t = entry.loop ? entry.trackTime % d : Math.min(entry.trackTime, d);
      if (headRef.current) headRef.current.style.left = `${(t / d) * 100}%`;
      if (frameRef.current) frameRef.current.textContent = `frame ${Math.round(t * FPS)} of ${Math.round(d * FPS)}`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [player]);

  // Player bị huỷ (cuộn xa / đổi bậc) → về trạng thái chờ, không vẽ key của player cũ.
  const shown = player ? sheet : null;
  if (!shown) {
    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-[#0c0e15] px-4 py-3 text-[13px] text-gray-400">
        Keyframes appear here once the rig has loaded.
      </div>
    );
  }

  const pct = (t: number) => `${(t / shown.duration) * 100}%`;
  return (
    <figure className="mt-4 rounded-xl border border-white/10 bg-[#0c0e15] px-4 pb-4 pt-3 text-[12px] text-gray-400">
      <figcaption className="mb-2.5 flex flex-wrap justify-between gap-2">
        <span>
          <b className="font-semibold text-white">{labels[shown.name] ?? shown.name}</b>, <span ref={frameRef}>frame 0</span>,{" "}
          {FPS} fps
        </span>
        <span className="hidden sm:inline">
          Real keys from the rig{shown.version ? `, Spine ${shown.version}` : ""}, {shown.boneCount} bones
          {shown.events.length ? ". Events in red fire in your game code." : ""}
        </span>
      </figcaption>
      <div className="relative">
        {shown.lanes.map((lane) => (
          <div key={lane.bone} className="grid h-5 grid-cols-[68px_1fr] items-center sm:grid-cols-[96px_1fr]">
            <span className="truncate pr-2">{lane.bone}</span>
            <div className="relative h-full border-b border-dashed border-white/[0.06]">
              {lane.keys.map((t) => (
                <i
                  key={t}
                  className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#ffcc8e]"
                  style={{ left: pct(t) }}
                />
              ))}
            </div>
          </div>
        ))}
        {shown.events.length > 0 && (
          <div className="grid h-5 grid-cols-[68px_1fr] items-center sm:grid-cols-[96px_1fr]">
            <span className="pr-2 text-[#f87171]">events</span>
            <div className="relative h-full">
              {shown.events.map((e) => (
                <i
                  key={`${e.name}-${e.t}`}
                  title={e.name}
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#f87171]"
                  style={{ left: pct(e.t) }}
                />
              ))}
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-y-[-4px] left-[68px] right-0 sm:left-[96px]">
          <div ref={headRef} className="absolute inset-y-0 w-0.5 bg-[#f59e0b] shadow-[0_0_10px_#f59e0b]" />
        </div>
      </div>
    </figure>
  );
}

export default function MonsterLegendsLive({
  roster,
  background,
  groundY,
  backgroundRoom,
  labels,
  theme,
}: {
  roster: readonly SpineMonster[];
  background: string;
  groundY: number;
  backgroundRoom: number;
  labels: Readonly<Record<string, string>>;
  theme: ProjectTheme;
}) {
  const [player, setPlayer] = useState<Player | null>(null);
  return (
    <div>
      <div className="-mx-3 md:-mx-6">
        <SpineStage
          roster={roster}
          background={background}
          groundY={groundY}
          backgroundRoom={backgroundRoom}
          animationLabels={labels}
          theme={theme}
          centre
          onPlayer={setPlayer}
        />
      </div>
      <div className="-mt-4 md:-mt-8">
        <Dopesheet player={player} labels={labels} />
      </div>
    </div>
  );
}
