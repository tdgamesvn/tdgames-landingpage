"use client";

import { useCallback, useEffect, useState } from "react";

import { AutoLoopMedia } from "./auto-loop-media";
import type { CutsceneItem, ProjectTheme } from "./case-study-types";
import { hexToRgba } from "./portfolio-color-utils";

/**
 * Lưới cutscene: clip lặp im lặng (lazy qua AutoLoopMedia), click mở lightbox
 * xem lớn có controls, ←/→ chuyển clip, Esc đóng.
 */
export function CutsceneGrid({
  items,
  aspect = 16 / 9,
  featureFirst = false,
  columns = 2,
  theme,
  panelBg,
}: {
  items: readonly CutsceneItem[];
  aspect?: number;
  featureFirst?: boolean;
  /** Số cột trên desktop. 3 cho clip nhân vật nhỏ (casual roster) để trang đỡ dài. */
  columns?: 2 | 3;
  theme: ProjectTheme;
  panelBg: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  const active = open === null ? null : items[open];

  return (
    <div className="px-3 py-6 md:px-6 md:py-10" style={{ backgroundColor: panelBg }}>
      <div
        className={`grid gap-3 md:gap-4 ${
          columns === 3 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        {items.map((item, idx) => {
          const featured = featureFirst && idx === 0;
          return (
            <button
              key={item.src}
              type="button"
              onClick={() => setOpen(idx)}
              className={`group relative block w-full overflow-hidden rounded-xl bg-black text-left ring-1 ring-white/10 transition duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 ${featured ? "md:col-span-2" : ""}`}
              style={{ aspectRatio: `${aspect}` }}
              aria-label={`Play ${item.kicker ? `${item.kicker} — ` : ""}${item.title}`}
            >
              <AutoLoopMedia
                src={item.src}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                videoProps={{ poster: item.poster }}
              />
              <span
                className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                style={{ boxShadow: `inset 0 0 0 2px ${theme.accent}, inset 0 0 40px ${hexToRgba(theme.accent, 0.35)}` }}
                aria-hidden
              />
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3 pt-10 md:px-5 md:pb-4"
              >
                <span className="min-w-0">
                  {item.kicker ? (
                    <span
                      className="block text-[11px] font-bold uppercase tracking-[0.22em]"
                      style={{ color: theme.accent }}
                    >
                      {item.kicker}
                    </span>
                  ) : null}
                  <span
                    className={`block truncate font-black uppercase tracking-[0.06em] text-white ${featured ? "text-xl md:text-3xl" : "text-base md:text-lg"}`}
                    style={{ fontFamily: "var(--font-rajdhani)" }}
                  >
                    {item.title}
                  </span>
                </span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur transition group-hover:scale-110"
                  aria-hidden
                >
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/92 p-4 backdrop-blur-sm md:p-10"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={close}
        >
          <div className="relative w-full max-w-[1600px]" onClick={(e) => e.stopPropagation()}>
            <video
              key={active.src}
              src={active.src}
              poster={active.poster}
              className="w-full rounded-xl bg-black ring-1 ring-white/10"
              style={{ aspectRatio: `${aspect}` }}
              autoPlay
              loop
              muted
              playsInline
              controls
            />
            <div className="mt-4 flex items-center justify-between gap-4 text-white">
              <div className="min-w-0">
                {active.kicker ? (
                  <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: theme.accent }}>
                    {active.kicker}
                  </p>
                ) : null}
                <p
                  className="truncate text-xl font-black uppercase tracking-[0.06em] md:text-2xl"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  {active.title}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm text-white/60">
                <span className="mr-2 tabular-nums">
                  {open! + 1} / {items.length}
                </span>
                {[
                  { d: -1, label: "Previous clip", path: "M15 18l-6-6 6-6" },
                  { d: 1, label: "Next clip", path: "M9 18l6-6-6-6" },
                ].map((b) => (
                  <button
                    key={b.d}
                    type="button"
                    onClick={() => step(b.d)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
                    aria-label={b.label}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d={b.path} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}
