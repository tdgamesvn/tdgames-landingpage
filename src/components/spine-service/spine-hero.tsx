"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { RosterPick } from "@/app/services/spine-animation/showcase-data";

/** Mỗi dự án chiếu bao lâu trước khi roster tự chuyển (ms). */
const DWELL_MS = 7000;

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const readReducedMotion = () => window.matchMedia(REDUCED).matches;

/**
 * Hero kiểu màn "chọn nhân vật": màn lớn chiếu dự án đang chọn, roster 6 thẻ bên dưới tự
 * chuyển mỗi 7 giây (dừng khi người dùng bật giảm chuyển động). Chữ theo hệ trang dịch vụ:
 * H1 Changa One 2 tầng cam/trắng + gạch cam + dòng phụ (sếp 2026-11-24).
 */
export default function SpineHero({
  roster,
  titleClassName,
}: {
  roster: readonly RosterPick[];
  /** className của font Changa One (next/font, tạo ở page server). */
  titleClassName: string;
}) {
  const [cur, setCur] = useState(0);
  // Đổi key mỗi lần chọn → thanh tiến trình chạy lại từ đầu kể cả khi bấm lại thẻ đang chọn.
  const [round, setRound] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pick = roster[cur];

  const still = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => false);

  const choose = useCallback((i: number) => {
    setCur(i);
    setRound((r) => r + 1);
  }, []);

  useEffect(() => {
    if (still) return;
    const t = setTimeout(() => choose((cur + 1) % roster.length), DWELL_MS);
    return () => clearTimeout(t);
  }, [cur, round, still, roster.length, choose]);

  return (
    <section className="relative overflow-hidden bg-black text-white" aria-label="Featured Spine work">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[radial-gradient(ellipse_at_20%_40%,#1a1408_0%,#000_60%)] md:aspect-auto md:h-[min(88vh,840px)] md:min-h-[660px]">
        <div className="spine-hero-media absolute inset-0 md:left-[30%]">
          {pick.video && !still ? (
            <video
              key={pick.key}
              ref={videoRef}
              src={pick.video}
              poster={pick.poster}
              autoPlay
              muted
              loop
              playsInline
              aria-label={`${pick.name}: ${pick.playing}`}
              className="h-full w-full object-cover"
              style={{ objectPosition: pick.focus ?? "50% 50%" }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={pick.key}
              src={pick.poster}
              alt={`${pick.name}: ${pick.playing}`}
              className="h-full w-full object-cover"
              style={{ objectPosition: pick.focus ?? "50% 50%" }}
            />
          )}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,#000_0%,rgba(0,0,0,.6)_22%,transparent_48%)]"
        />

        {/* Đang chiếu */}
        <div
          className="absolute right-4 top-20 z-[2] max-w-[200px] text-right md:right-[5vw] md:top-28 md:max-w-[320px]"
          aria-live="polite"
        >
          <Link
            href={pick.href}
            className="block text-[22px] font-bold uppercase leading-none [text-shadow:0_2px_14px_rgba(0,0,0,.75)] hover:text-[#ffcc8e] md:text-[30px]"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            {pick.name}
          </Link>
          <span className="mt-1.5 block text-[13px] text-white [text-shadow:0_1px_8px_rgba(0,0,0,.85)] md:text-sm">
            {pick.playing}
          </span>
          <span className="mt-2.5 hidden rounded-md border border-white/10 bg-black/60 px-2.5 py-0.5 text-[12.5px] text-gray-200 md:inline-block">
            {pick.tag}
          </span>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .spine-hero-media { -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 34%); mask-image: linear-gradient(90deg, transparent 0, #000 34%); }
        }
        @keyframes spine-roster-fill { to { width: 100% } }
      `}</style>

      {/* Chữ hero */}
      <div className="relative z-[2] -mt-[150px] md:absolute md:inset-x-0 md:bottom-[200px] md:mt-0">
        <div className="mx-auto w-[90vw] max-w-[1280px]">
          <div className="max-w-[606px]">
            <h1 className={`w-[min(760px,90vw)] uppercase leading-none tracking-[0.5px] ${titleClassName}`} style={{ fontSize: "min(84px, 12vw)" }}>
              <span className="block text-[#f59e0b] [text-shadow:0_4px_30px_rgba(0,0,0,.6)]">Spine animation</span>{" "}
              <span className="block [text-shadow:0_4px_30px_rgba(0,0,0,.6)]">services</span>
            </h1>
            <div className="mt-5 flex items-center gap-4">
              <span aria-hidden className="h-0.5 w-12 shrink-0 bg-[#f59e0b]" />
              <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#f59e0b] md:text-base md:tracking-[0.3em]">
                Where every hit lands
              </p>
            </div>
            <p className="mt-4 max-w-[547px] text-base leading-relaxed text-gray-200 md:text-lg">
              Heroes, monsters, bosses and super moves for RPG, gacha and fighting games. Animated in Spine,
              delivered as files your engine can load the same day.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#quote"
                className="inline-block rounded-xl border-2 border-[#f59e0b] bg-[#f59e0b] px-7 py-3.5 text-base font-bold uppercase tracking-wider text-black transition-colors duration-300 hover:bg-transparent hover:text-white md:text-[17px]"
              >
                Send us a character
              </Link>
              <Link
                href="#work"
                className="inline-block rounded-xl border-2 border-white/30 bg-black/35 px-7 py-3.5 text-base font-bold uppercase tracking-wider text-white backdrop-blur-md transition-colors duration-300 hover:border-white md:text-[17px]"
              >
                Watch the work
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Roster */}
      <nav aria-label="Projects shown on the big screen" className="relative z-[3] pb-2 pt-6 md:absolute md:inset-x-0 md:bottom-6 md:pb-0 md:pt-0">
        <ol className="mx-auto flex gap-2.5 overflow-x-auto px-[5vw] pb-1.5 pt-1 [scrollbar-width:none] md:grid md:w-[90vw] md:max-w-[1280px] md:grid-cols-6 md:gap-3 md:overflow-visible md:px-0">
          {roster.map((p, i) => {
            const on = i === cur;
            return (
              <li key={p.key} className="w-[40%] shrink-0 md:w-auto">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(i)}
                  className={`relative block h-[112px] w-full overflow-hidden rounded-[10px] border bg-[#111] text-left outline-none transition-[transform,border-color,box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-white md:h-[132px] ${
                    on
                      ? "border-[#f59e0b] shadow-[0_10px_30px_rgba(245,158,11,.25)] md:-translate-y-2"
                      : "border-white/15 hover:border-white/40"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.poster}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300"
                    style={{
                      objectPosition: p.thumbFocus ?? "50% 50%",
                      transform: p.thumbZoom ? `scale(${p.thumbZoom})` : undefined,
                      transformOrigin: p.thumbFocus ?? "50% 50%",
                      filter: on ? "none" : "saturate(.55) brightness(.62)",
                    }}
                  />
                  <span aria-hidden className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,.85),transparent_60%)]" />
                  {on && (
                    <span
                      key={round}
                      aria-hidden
                      className="absolute left-0 top-0 z-[2] h-[3px] bg-[#f59e0b]"
                      style={{ width: still ? "100%" : 0, animation: still ? undefined : `spine-roster-fill ${DWELL_MS}ms linear forwards` }}
                    />
                  )}
                  <span
                    className="absolute bottom-2.5 left-3 right-2 z-[1] text-[17px] font-bold uppercase leading-none md:bottom-6 md:text-[20px]"
                    style={{ fontFamily: "var(--font-rajdhani)" }}
                  >
                    {p.name}
                  </span>
                  <span className="absolute bottom-[7px] left-3 z-[1] hidden text-xs text-gray-300 md:block">{p.kicker}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </section>
  );
}
