"use client";

/**
 * SpineStage — sân khấu cho nhân vật Spine chạy trực tiếp trong case study
 * (Monster Legends từng hệ). Người xem chọn quái → bậc tiến hoá → animation.
 *
 * - Mỗi lúc chỉ 1 SpinePlayer (1 WebGL context): đổi quái/bậc thì remount,
 *   đổi animation thì đặt lại track trên player cũ (không tải lại).
 * - Bóng đổ: elip mờ dưới gốc skeleton (0,0) + drop-shadow theo dáng trên canvas.
 *   Gốc skeleton được kéo về đúng "mặt sàn" của ảnh nền (GROUND), nên quái nào
 *   cũng đứng trên sàn bất kể tỉ lệ khung.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { SpineCharacter } from "@/components/spine-character";

import type { ProjectTheme, SpineMonster } from "./case-study-types";
import { hexToRgba } from "./portfolio-color-utils";

/** Mặt sàn trong ảnh nền, tính theo % chiều cao sân khấu. */
const GROUND = 0.8;
/** Thứ tự showreel + nhãn mặc định; key lạ vẫn hiện bằng tên gốc. */
const ORDER = ["breathe", "walk", "attack", "attack_skill", "special1", "levelup", "prone"];
const SHOWREEL = "__showreel";

type Foot = { x: number; y: number; w: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function footOf(player: any, el: HTMLElement): Foot | null {
  // ponytail: tái hiện phép chiếu của spine-player (fit-contain viewport đã pad vào
  // canvas, camera đặt ở tâm viewport). Lib đổi field → null, sân khấu bỏ bóng elip.
  const v = player?.currentViewport;
  if (!v || !(v.width > 0)) return null;
  const vw = v.width + v.padLeft + v.padRight;
  const vh = v.height + v.padTop + v.padBottom;
  const W = el.clientWidth;
  const H = el.clientHeight;
  const s = Math.min(W / vw, H / vh);
  const cx = v.x - v.padLeft + vw / 2;
  const cy = v.y - v.padBottom + vh / 2;
  return { x: W / 2 - cx * s, y: H / 2 + cy * s, w: v.width * s };
}

/** Chiều cao dáng đứng (idle) so với khung nhân vật. */
const FILL = 0.58;

// Khung camera theo dáng đứng chứ không theo bounds mọi animation: level-up/special
// có FX bung rất rộng → quái bị thu bé tí giữa sân. Ở đây FX cứ tràn ra sân khấu.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function frameOnIdle(player: any, idle: string) {
  try {
    const data = player.skeleton?.data;
    const anim = data?.findAnimation?.(idle) ?? data?.animations?.[0];
    if (!anim) return;
    const v = { x: 0, y: 0, width: 0, height: 0 };
    player.calculateAnimationViewport(anim, v);
    if (!(v.width > 0 && v.height > 0)) return;
    const extra = v.height / FILL - v.height;
    player.currentViewport = {
      ...v,
      padLeft: v.width * 0.06,
      padRight: v.width * 0.06,
      // Chừa phần lớn khoảng trống phía trên cho đòn nhảy/vung tay.
      padTop: extra * 0.85,
      padBottom: extra * 0.15,
    };
    player.previousViewport = null;
  } catch {
    // giữ khung SpineCharacter đã đặt
  }
}

function sortAnims(list: readonly string[]) {
  const rank = (a: string) => (ORDER.includes(a) ? ORDER.indexOf(a) : ORDER.length);
  return [...list].sort((a, b) => rank(a) - rank(b));
}

export default function SpineStage({
  roster,
  background,
  logo,
  animationLabels = {},
  theme,
}: {
  roster: readonly SpineMonster[];
  background: string;
  logo?: string;
  animationLabels?: Readonly<Record<string, string>>;
  theme: ProjectTheme;
}) {
  const [monsterIdx, setMonsterIdx] = useState(0);
  const monster = roster[monsterIdx];
  // Mặc định bậc cao nhất — đó là bản đẹp nhất để khoe.
  const [tierKey, setTierKey] = useState(monster.tiers[monster.tiers.length - 1].key);
  const tier = monster.tiers.find((t) => t.key === tierKey) ?? monster.tiers[0];
  const [anim, setAnim] = useState<string>(SHOWREEL);
  const [ready, setReady] = useState(false);
  const [foot, setFoot] = useState<Foot | null>(null);
  const [visible, setVisible] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const spineBoxRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);

  const anims = useMemo(() => sortAnims(tier.animations), [tier]);
  // Showreel bỏ "prone" (ngã gục) — nằm giữa chuỗi trông như lỗi.
  const showreel = useMemo(() => anims.filter((a) => a !== "prone"), [anims]);
  const playing = useMemo(() => (anim === SHOWREEL ? showreel : [anim]), [anim, showreel]);

  // Chỉ dựng WebGL khi sân khấu vào màn hình.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), {
      rootMargin: "200px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [lift, setLift] = useState(0);
  const measure = useCallback(() => {
    const box = spineBoxRef.current;
    const stage = stageRef.current;
    if (!box || !stage || !playerRef.current) return;
    const f = footOf(playerRef.current, box);
    setFoot(f);
    // Kéo gốc skeleton xuống đúng mặt sàn ảnh nền.
    setLift(f ? stage.clientHeight * GROUND - box.offsetTop - f.y : 0);
  }, []);

  useEffect(() => {
    const box = spineBoxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, [measure]);

  function selectMonster(i: number) {
    if (i === monsterIdx) return;
    const m = roster[i];
    setMonsterIdx(i);
    setTierKey(m.tiers[m.tiers.length - 1].key);
    setAnim(SHOWREEL);
    setReady(false);
    setFoot(null);
  }

  function selectTier(key: string) {
    if (key === tier.key) return;
    setTierKey(key);
    const next = monster.tiers.find((t) => t.key === key);
    if (anim !== SHOWREEL && !next?.animations.includes(anim)) setAnim(SHOWREEL);
    setReady(false);
    setFoot(null);
  }

  const label = (a: string) => animationLabels[a] ?? a;
  const glow = tier.highlight ? theme.accentSoft : theme.accent;

  return (
    <div className="px-3 pb-6 pt-2 md:px-6 md:pb-10">
      <div
        ref={stageRef}
        data-spine-stage
        className="relative isolate aspect-[4/5] w-full overflow-hidden rounded-[22px] bg-[#1a0f12] sm:aspect-[16/10] lg:aspect-[16/9]"
      >
        {/* Nền: ảnh đấu trường, tối dần hai mép + đáy để quái nổi lên */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={background}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-20 h-full w-full scale-[1.04] object-cover"
          // Quái hệ lửa trên nền lửa dễ chìm → nền tối + mờ nhẹ như xoá phông.
          style={{ objectPosition: "50% 62%", filter: "blur(2px) brightness(0.62) saturate(1.1)" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background: `radial-gradient(ellipse 38% 46% at 50% ${GROUND * 100 - 22}%, ${hexToRgba(glow, tier.highlight ? 0.3 : 0.2)}, transparent 70%), radial-gradient(ellipse 85% 75% at 50% 55%, transparent 40%, rgba(20,6,10,0.78) 100%), linear-gradient(180deg, rgba(20,6,10,0.25) 0%, transparent 30%, transparent 70%, rgba(20,6,10,0.7) 100%)`,
            transition: "background 600ms ease",
          }}
        />
        <Embers color={glow} />

        {/* Nhân vật (+ bóng elip dưới chân, cùng khung để dịch chung) */}
        <div
          ref={spineBoxRef}
          className="absolute inset-x-0 bottom-[4%] top-[8%] transition-opacity duration-500"
          style={{
            opacity: ready ? 1 : 0,
            transform: `translateY(${lift}px)`,
            filter: `drop-shadow(0 14px 12px rgba(10,2,4,0.55)) drop-shadow(0 0 28px ${hexToRgba(glow, 0.35)})`,
          }}
        >
          {foot && (
            <div
              aria-hidden
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
              style={{
                left: foot.x,
                top: foot.y,
                width: foot.w * 0.72,
                height: foot.w * 0.72 * 0.17,
                background:
                  "radial-gradient(closest-side, rgba(8,1,3,0.95), rgba(8,1,3,0.55) 55%, transparent)",
              }}
            />
          )}
          {visible && (
            <SpineCharacter
              key={tier.base}
              jsonUrl={`${tier.base}.json`}
              atlasUrl={`${tier.base}.atlas`}
              animations={playing}
              mixDuration={0.18}
              className="relative h-full w-full"
              onSuccess={(p) => {
                playerRef.current = p;
                frameOnIdle(p, "breathe");
                setReady(true);
                // Viewport đã chốt trong success → đo ngay.
                requestAnimationFrame(measure);
              }}
            />
          )}
        </div>

        {!ready && (
          <div className="absolute inset-0 grid place-items-center" aria-live="polite">
            <span className="rounded-full bg-black/45 px-4 py-2 text-[13px] text-white/80 backdrop-blur-sm">
              Summoning {monster.name}…
            </span>
          </div>
        )}

        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt="Monster Legends"
            className="absolute right-4 top-4 hidden w-[130px] drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)] sm:block md:right-6 md:top-5 md:w-[170px]"
          />
        )}

        {/* Bảng tên kiểu thẻ quái trong game */}
        <div className="absolute left-4 top-4 md:left-6 md:top-6">
          <div
            className="text-[13px] font-semibold"
            style={{ color: tier.highlight ? theme.accentSoft : theme.accent }}
          >
            {monster.rank}
            {tier.highlight ? " · Awakened" : ""}
          </div>
          <h3
            className="text-[26px] font-black leading-none text-white md:text-[40px]"
            style={{ fontFamily: "var(--font-rajdhani)", textShadow: "0 3px 14px rgba(0,0,0,0.7)" }}
          >
            {monster.name}
          </h3>
        </div>

        {/* Bậc tiến hoá */}
        {monster.tiers.length > 1 && (
          <div
            role="radiogroup"
            aria-label="Evolution stage"
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/55 p-1 backdrop-blur-md md:bottom-6"
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
                  className="rounded-full px-3 py-1.5 text-[12px] font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white sm:px-3.5 sm:text-[13px] md:px-5"
                  style={
                    on
                      ? { backgroundColor: c, color: "#1a0f12" }
                      : { color: hexToRgba(c, 0.85) }
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Animation */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
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
              {a === SHOWREEL ? "Showreel" : label(a)}
            </button>
          );
        })}
      </div>

      {/* Dàn quái */}
      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11">
        {roster.map((m, i) => {
          const on = i === monsterIdx;
          const top = m.tiers[m.tiers.length - 1];
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              onClick={() => selectMonster(i)}
              className="group relative flex flex-col items-center overflow-hidden rounded-2xl border p-2 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white"
              style={{
                borderColor: on ? theme.accent : "rgba(255,255,255,0.08)",
                background: on
                  ? `radial-gradient(circle at 50% 70%, ${hexToRgba(theme.accent, 0.3)}, rgba(26,15,18,0.9) 70%)`
                  : "rgba(255,255,255,0.03)",
              }}
            >
              <div className="relative aspect-square w-full">
                {m.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.thumb}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span
                    className="absolute inset-0 grid place-items-center text-2xl font-black text-white/30"
                    style={{ fontFamily: "var(--font-rajdhani)" }}
                  >
                    {m.name.replace(/^The /, "")[0]}
                  </span>
                )}
              </div>
              <span className="mt-1 line-clamp-2 text-[12px] font-semibold leading-tight text-white/85">
                {m.name}
              </span>
              <span
                className="text-[11px]"
                style={{ color: top.highlight ? theme.accentSoft : "rgba(255,255,255,0.45)" }}
              >
                {top.highlight ? "Awakened" : m.rank}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Đốm lửa bay lên — CSS thuần, tắt khi người dùng bật giảm chuyển động. */
function Embers({ color }: { color: string }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        // Giả ngẫu nhiên cố định theo index → SSR/CSR khớp nhau.
        const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
        return {
          left: `${r(1) * 100}%`,
          size: 2 + r(2) * 3,
          dur: 5 + r(3) * 6,
          delay: -r(4) * 10,
          drift: (r(5) - 0.5) * 80,
        };
      }),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-[5] overflow-hidden">
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
