"use client";

/**
 * SpineStage — dàn nhân vật Spine chạy trực tiếp trong case study (Monster Legends
 * từng hệ). Mỗi quái một sân khấu riêng xếp dọc: khách lướt xuống là xem, không phải
 * bấm chọn (sếp chốt 2026-10-18). Trong từng sân khấu đổi được bậc + animation.
 *
 * - Mỗi sân khấu chỉ dựng SpinePlayer (1 WebGL context) khi gần vào màn hình và huỷ
 *   khi ra xa → cả trang chỉ 1–3 context sống, dù có 11+ quái.
 * - Cỡ quái đồng đều: khung camera ôm THÂN ở dáng idle (bỏ slot additive = FX/aura),
 *   thân luôn cao FILL × khung. Chân (đáy thân) đặt đúng tâm sàn của ảnh nền (groundY).
 * - Không vẽ bóng: elip/drop-shadow tĩnh không khớp dáng + animation (sếp bỏ 2026-10-18).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { SpineCharacter } from "@/components/spine-character";

import type { ProjectTheme, SpineMonster } from "./case-study-types";
import { hexToRgba } from "./portfolio-color-utils";

/** Thứ tự showreel + nhãn mặc định; key lạ vẫn hiện bằng tên gốc. */
const ORDER = ["breathe", "walk", "attack", "attack_skill", "special1", "levelup", "prone"];
const SHOWREEL = "__showreel";
const IDLE = "breathe";
/** Chiều cao thân (dáng idle) so với chiều cao khung nhân vật. */
const FILL = 0.57;
/** Trần theo chiều rộng khung cho "cỡ" thân (xem frameBody). */
const MAX_W = 0.6;
/** Hạ chân quái thấp hơn tâm sàn ảnh một chút (tỉ lệ chiều cao sân khấu). */
const DROP = 0.03;

type Box = { x: number; y: number; width: number; height: number };
/** Thân + "cỡ" dùng để chuẩn hoá (có thể nhỏ hơn height khi có cánh/vũ khí giơ cao). */
type Body = Box & { size: number };

/** Tỉ lệ thân-đặc / chiều cao toàn bộ của một quái "thường" (đo 21 skeleton Fire: 0.80–0.86). */
const CORE_RATIO = 0.82;
/** Trung vị √diện tích / cỡ-theo-chiều-cao trên 21 skeleton Fire (dải 0.77–1.54). */
const AREA_RATIO = 1.17;

/**
 * Chiều cao phần THÂN ĐẶC: từ chân lên tới mức chứa 90% diện tích hình. Cánh, trượng,
 * kiếm giơ cao chiếm ít diện tích nhưng kéo chiều cao lên nhiều — chuẩn hoá theo chiều cao
 * toàn bộ làm Kaih/Kennix (Awakened) bé hơn hẳn các con khác (sếp bắt 2026-10-18).
 * Duck-typing attachment vì bundle production đổi tên class.
 */
function coreHeight(sk: Player, bottom: number): { core: number; area: number } | null {
  const pts: [number, number][] = [];
  let total = 0;
  for (const slot of sk.drawOrder) {
    const a = slot.getAttachment();
    if (!a || !slot.bone.active) continue;
    let v: number[];
    let tris: ArrayLike<number>;
    if (a.triangles && a.worldVerticesLength) {
      v = new Array(a.worldVerticesLength);
      a.computeWorldVertices(slot, 0, a.worldVerticesLength, v, 0, 2);
      tris = a.triangles;
    } else if (a.offset?.length === 8) {
      v = new Array(8);
      a.computeWorldVertices(slot, v, 0, 2);
      tris = [0, 1, 2, 2, 3, 0];
    } else continue;
    for (let t = 0; t < tris.length; t += 3) {
      const [i, j, k] = [tris[t] * 2, tris[t + 1] * 2, tris[t + 2] * 2];
      const area = Math.abs((v[j] - v[i]) * (v[k + 1] - v[i + 1]) - (v[k] - v[i]) * (v[j + 1] - v[i + 1])) / 2;
      pts.push([(v[i + 1] + v[j + 1] + v[k + 1]) / 3, area]);
      total += area;
    }
  }
  if (!(total > 0)) return null;
  pts.sort((p, q) => p[0] - q[0]);
  let acc = 0;
  for (const [y, w] of pts) if ((acc += w) >= total * 0.9) return { core: y - bottom, area: total };
  return null;
}
type Foot = { x: number; y: number; w: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Player = any;

/**
 * Bounds của THÂN qua cả animation idle: tạm cho slot additive (aura, lửa, glow — FX
 * bung rộng tuỳ con) trả về "không có attachment" trong lúc player đo, rồi trả lại.
 * ponytail: chạm internal spine-player (calculateAnimationViewport) + Slot.getAttachment.
 */
function bodyBounds(player: Player, idle: string): Body | null {
  const sk = player.skeleton;
  const anim = sk?.data?.findAnimation?.(idle) ?? sk?.data?.animations?.[0];
  if (!anim) return null;
  // Không tính vào thân: slot additive (BlendMode.Additive = 1), attachment FX (rig Monster
  // Legends đặt tên "fx/…", thân là "basic/…"), và slot đang ẩn (alpha ≈ 0). Akira có
  // "fx-sword_fx" blend thường, alpha 0 ở idle, dài gấp đôi thân → quái bé + bóng rơi xa.
  for (const s of sk.slots) {
    const own = Object.getPrototypeOf(s).getAttachment;
    s.getAttachment = function () {
      const a = own.call(this);
      if (!a || this.data.blendMode === 1 || this.color.a < 0.05) return null;
      if (a.name?.startsWith("fx/") || (a.color && a.color.a < 0.05)) return null;
      return a;
    };
  }
  try {
    const v = { x: 0, y: 0, width: 0, height: 0 };
    player.calculateAnimationViewport(anim, v);
    if (!(v.width > 0 && v.height > 0)) return null;
    // Đo thân đặc trên pose cuối của idle (calculateAnimationViewport để skeleton ở đó).
    const m = coreHeight(sk, v.y);
    if (!m) return { ...v, size: v.height };
    const tall = Math.min(v.height, m.core / CORE_RATIO);
    // Cùng chiều cao thì con mảnh (Ember, Shallinar) trông nhỏ, con bè (Aquatorum) trông to
    // → trộn thêm "độ đầy": hệ số theo căn diện tích / chiều cao, so với mức trung vị.
    const fullness = Math.sqrt(m.area) / tall / AREA_RATIO;
    const adjust = Math.min(1.15, Math.max(0.85, fullness ** 0.35));
    return { ...v, size: tall * adjust };
  } finally {
    for (const s of sk.slots) delete s.getAttachment;
  }
}

/**
 * Đặt camera: "cỡ" thân (Body.size) cao min(FILL × khung cao, MAX_W × khung rộng) — một
 * con số chung cho mọi quái trong cùng khung. Trước đây con bè chạm mép bị thu nhỏ riêng
 * → trên mobile (khung hẹp) mỗi con một cỡ (sếp bắt 2026-10-18). MAX_W chọn sao cho con
 * bè nhất (Aquatorum, rộng ≈ 1.55 × cỡ) vẫn lọt khung.
 */
function frameBody(player: Player, body: Body, W: number, H: number, scale = 1) {
  let px = Math.min(FILL * H, MAX_W * W) * scale; // chiều cao (px) của "cỡ" thân
  let s = px / body.size; // px trên mỗi đơn vị world
  // Chốt an toàn: không để thân tràn ngang khỏi khung.
  if (body.width * s > 0.96 * W) {
    s = (0.96 * W) / body.width;
    px = s * body.size;
  }
  const vw = W / s;
  const vh = H / s;
  const padX = (vw - body.width) / 2;
  const padBottom = (vh - body.height) * 0.06;
  player.currentViewport = {
    ...body,
    padLeft: padX,
    padRight: padX,
    padBottom,
    padTop: vh - body.height - padBottom,
  };
  player.previousViewport = null;
}

/** Điểm chân (đáy giữa của thân) trong toạ độ khung — tái hiện phép chiếu của player. */
function footOf(player: Player, body: Box, W: number, H: number): Foot | null {
  const v = player?.currentViewport;
  if (!v || !(v.width > 0)) return null;
  const vw = v.width + v.padLeft + v.padRight;
  const vh = v.height + v.padTop + v.padBottom;
  const s = Math.min(W / vw, H / vh);
  const cx = v.x - v.padLeft + vw / 2;
  const cy = v.y - v.padBottom + vh / 2;
  const toX = (x: number) => W / 2 + (x - cx) * s;
  const toY = (y: number) => H / 2 - (y - cy) * s;
  return { x: toX(body.x + body.width / 2), y: toY(body.y), w: body.width * s };
}

function sortAnims(list: readonly string[]) {
  const rank = (a: string) => (ORDER.includes(a) ? ORDER.indexOf(a) : ORDER.length);
  return [...list].sort((a, b) => rank(a) - rank(b));
}

type StageProps = {
  background: string;
  /** Tâm sàn trong ảnh nền, tính theo tỉ lệ chiều cao ảnh (0–1). */
  groundY: number;
  animationLabels: Readonly<Record<string, string>>;
  theme: ProjectTheme;
};

export default function SpineStage({
  roster,
  logo,
  animationLabels = {},
  groundY = 0.7,
  ...rest
}: Omit<StageProps, "animationLabels" | "groundY"> & {
  roster: readonly SpineMonster[];
  logo?: string;
  animationLabels?: Readonly<Record<string, string>>;
  groundY?: number;
}) {
  return (
    <div className="px-3 pb-8 pt-4 md:px-6 md:pb-12">
      {logo && (
        <div className="mb-8 flex flex-col items-center gap-3 text-center md:mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="Monster Legends" className="w-[200px] md:w-[280px]" />
          <p className="max-w-[46ch] text-[14px] leading-relaxed text-white/60">
            {roster.length} monsters, each running live in Spine. Switch evolution stage or
            animation on any of them.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-12 md:gap-20">
        {roster.map((m) => (
          <MonsterStage
            key={m.id}
            monster={m}
            animationLabels={animationLabels}
            groundY={groundY}
            {...rest}
          />
        ))}
      </div>
    </div>
  );
}

function MonsterStage({
  monster,
  background,
  groundY,
  animationLabels,
  theme,
}: StageProps & { monster: SpineMonster }) {
  // Mặc định bậc cao nhất — bản đẹp nhất để khoe.
  const [tierKey, setTierKey] = useState(monster.tiers[monster.tiers.length - 1].key);
  const tier = monster.tiers.find((t) => t.key === tierKey) ?? monster.tiers[0];
  const [anim, setAnim] = useState<string>(SHOWREEL);
  const [ready, setReady] = useState(false);
  const [near, setNear] = useState(false);
  const [lift, setLift] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const playerRef = useRef<Player>(null);
  const bodyRef = useRef<Body | null>(null);

  const anims = useMemo(() => sortAnims(tier.animations), [tier]);
  // Showreel (sếp chốt 2026-10-18): idle xen giữa mọi lần đổi animation, walk lặp 3 lần.
  // Bỏ "prone" (ngã gục) — nằm giữa chuỗi trông như lỗi. Chuỗi lặp lại từ idle đầu.
  const showreel = useMemo(() => {
    const idle = anims.includes(IDLE) ? IDLE : null;
    const seq: string[] = [];
    for (const a of anims) {
      if (a === IDLE || a === "prone") continue;
      if (idle) seq.push(idle);
      for (let i = 0; i < (a === "walk" ? 3 : 1); i++) seq.push(a);
    }
    return seq.length ? seq : anims.slice(0, 1);
  }, [anims]);
  const playing = useMemo(() => (anim === SHOWREEL ? showreel : [anim]), [anim, showreel]);

  // Dựng khi gần vào màn hình, huỷ khi ra xa (giữ số WebGL context thấp).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setNear(e.isIntersecting);
        if (!e.isIntersecting) {
          setReady(false);
          playerRef.current = null;
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const layout = useCallback(() => {
    const box = boxRef.current;
    const stage = stageRef.current;
    const p = playerRef.current;
    const body = bodyRef.current;
    if (!box || !stage || !p || !body) return;
    const W = box.clientWidth;
    const H = box.clientHeight;
    frameBody(p, body, W, H, tier.scale);
    const f = footOf(p, body, W, H);
    // Tâm sàn của ảnh nền sau object-cover (neo mép trên) → toạ độ sân khấu.
    const img = bgRef.current;
    const aspect = img?.naturalWidth ? img.naturalWidth / img.naturalHeight : 1.5;
    const SW = stage.clientWidth;
    const SH = stage.clientHeight;
    const drawnH = Math.max(SH, SW / aspect);
    const ground = groundY * drawnH + DROP * SH;
    // Khung hẹp (mobile vuông): sàn ảnh ở ~66% → con cao chạm mép trên (sếp 2026-10-18).
    // Chân lấy điểm THẤP hơn giữa mặt sàn và vị trí để quái cân giữa khung theo chiều dọc;
    // phần sàn đá kéo tới đáy ảnh nên chân vẫn trên sàn. Desktop gần như không đổi.
    const heightPx = f ? (f.w / body.width) * body.height : 0;
    const centred = Math.min(0.92 * SH, (SH + heightPx) / 2);
    setLift(f ? Math.max(ground, centred) - box.offsetTop - f.y : 0);
  }, [groundY, tier.scale]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(layout);
    ro.observe(box);
    return () => ro.disconnect();
  }, [layout]);

  function selectTier(key: string) {
    if (key === tier.key) return;
    setTierKey(key);
    const next = monster.tiers.find((t) => t.key === key);
    if (anim !== SHOWREEL && !next?.animations.includes(anim)) setAnim(SHOWREEL);
    setReady(false);
  }

  const glow = tier.highlight ? theme.accentSoft : theme.accent;

  return (
    <section aria-label={monster.name}>
      {/* Tên + bậc */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 md:mb-4">
        <div>
          <div className="text-[13px] font-semibold" style={{ color: glow }}>
            {monster.rank}
            {tier.highlight ? " · Awakened" : ""}
          </div>
          <h3
            className="text-[28px] font-black leading-none text-white md:text-[40px]"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            {monster.name}
          </h3>
        </div>
        {monster.tiers.length > 1 && (
          <div
            role="radiogroup"
            aria-label={`${monster.name} evolution stage`}
            className="flex gap-1 rounded-full bg-white/[0.06] p-1"
          >
            {monster.tiers.map((t) => {
              const on = t.key === tier.key;
              const c = t.highlight ? theme.accentSoft : theme.accent;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => selectTier(t.key)}
                  className="rounded-full px-3 py-1.5 text-[12px] font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white sm:px-4 sm:text-[13px]"
                  style={on ? { backgroundColor: c, color: "#1a0f12" } : { color: hexToRgba(c, 0.85) }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        ref={stageRef}
        data-spine-stage
        className="relative isolate aspect-square w-full overflow-hidden rounded-[22px] bg-[#1a0f12] sm:aspect-[4/3] lg:aspect-[16/9]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={bgRef}
          src={background}
          alt=""
          aria-hidden
          loading="lazy"
          onLoad={layout}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          // Neo mép trên: trên khung ngang ảnh bị cắt phần đáy thay vì đều hai đầu → sàn
          // hạ thấp (~75% thay vì ~65%), phía trên đủ chỗ cho quái to.
          style={{ filter: "brightness(0.82)", objectPosition: "50% 0%" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background: `radial-gradient(ellipse 30% 40% at 50% ${groundY * 100 - 12}%, ${hexToRgba(glow, tier.highlight ? 0.22 : 0.14)}, transparent 70%), radial-gradient(ellipse 90% 80% at 50% 55%, transparent 45%, rgba(20,6,10,0.7) 100%)`,
            transition: "background 600ms ease",
          }}
        />
        <Embers color={glow} />

        {/* Nhân vật */}
        <div
          ref={boxRef}
          className="absolute inset-x-0 bottom-0 top-[6%] transition-opacity duration-500"
          style={{
            opacity: ready ? 1 : 0,
            transform: `translateY(${lift}px)`,
          }}
        >
          {near && (
            <SpineCharacter
              key={tier.base}
              jsonUrl={`${tier.base}.json`}
              atlasUrl={`${tier.base}.atlas`}
              animations={playing}
              mixDuration={0.18}
              className="relative h-full w-full"
              onSuccess={(p) => {
                playerRef.current = p;
                bodyRef.current = bodyBounds(p, "breathe");
                layout();
                setReady(true);
              }}
            />
          )}
        </div>

        {near && !ready && (
          <div className="absolute inset-0 grid place-items-center" aria-live="polite">
            <span className="rounded-full bg-black/45 px-4 py-2 text-[13px] text-white/80 backdrop-blur-sm">
              Summoning {monster.name}…
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[SHOWREEL, ...anims].map((a) => {
          const on = a === anim;
          return (
            <button
              key={a}
              type="button"
              aria-pressed={on}
              onClick={() => setAnim(a)}
              className="shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white"
              style={
                on
                  ? { borderColor: glow, backgroundColor: hexToRgba(glow, 0.18), color: "#fff" }
                  : { borderColor: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.7)" }
              }
            >
              {a === SHOWREEL ? "Showreel" : (animationLabels[a] ?? a)}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Đốm lửa bay lên — CSS thuần, tắt khi người dùng bật giảm chuyển động. */
function Embers({ color }: { color: string }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        // Giả ngẫu nhiên cố định theo index → SSR/CSR khớp nhau.
        const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
        return {
          left: `${r(1) * 100}%`,
          size: 2 + r(2) * 2.5,
          dur: 6 + r(3) * 7,
          delay: -r(4) * 12,
          drift: (r(5) - 0.5) * 80,
        };
      }),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-[5] overflow-hidden opacity-70">
      <style>{`
        @keyframes ss-ember { 0% { transform: translate(0, 0); opacity: 0 } 15% { opacity: 1 }
          100% { transform: translate(var(--drift), -110cqh); opacity: 0 } }
        @media (prefers-reduced-motion: reduce) { .ss-ember { animation: none !important; opacity: 0 } }
      `}</style>
      <div className="absolute inset-0" style={{ containerType: "size" }}>
        {dots.map((d, i) => (
          <span
            key={i}
            className="ss-ember absolute bottom-0 rounded-full"
            style={
              {
                left: d.left,
                width: d.size,
                height: d.size,
                background: color,
                boxShadow: `0 0 ${d.size * 3}px ${color}`,
                animation: `ss-ember ${d.dur}s linear ${d.delay}s infinite`,
                "--drift": `${d.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
