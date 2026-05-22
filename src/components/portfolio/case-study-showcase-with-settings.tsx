"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";

import type { ProjectTheme, ShowcaseModule } from "./case-study-types";
import { hexToRgba } from "./portfolio-color-utils";

/** Tiền tố localStorage — mỗi URL case study có key riêng (tránh Lưu ở trang A ghi đè màu/grid trang B). */
const STORAGE_KEY_PREFIX = "tdg-case-study-showcase-ui-v1";

function showcaseStorageKeyForPath(pathname: string | null): string {
  const p = (pathname ?? "").replace(/\/+$/, "") || "/";
  return `${STORAGE_KEY_PREFIX}::${p}`;
}

export type GifBreakpointRow = {
  /** Max-width ảnh GIF trong ô (px) */
  wPx: number;
  /** Chiều cao ô (px) */
  hPx: number;
};

export type GifGridDims = {
  base: GifBreakpointRow;
  sm: GifBreakpointRow;
  md: GifBreakpointRow;
  lg: GifBreakpointRow;
};

export type SavedShowcaseUiV2 = {
  v: 2;
  grid: GifGridDims;
  panelHex: string;
  mediaHex: string;
};

export type GifSlotDims = {
  wPx: number;
  hPx: number;
  /** Dịch cả khung (nền + ảnh) trong ô — px, mặc định 0 */
  frameX?: number;
  frameY?: number;
  /** Phóng to / thu khung, mặc định 1 */
  scale?: number;
  /** Thứ tự hiển thị trên lưới (CSS order), mặc định 0 */
  stackOrder?: number;
};

/** Per-cell GIF overrides: key = `${moduleId}:${index}` */
export type SavedShowcaseUiV3 = {
  v: 3;
  grid: GifGridDims;
  slots: Record<string, GifSlotDims>;
  panelHex: string;
  mediaHex: string;
};

export type SavedShowcaseUiV4 = {
  v: 4;
  grid: GifGridDims;
  slots: Record<string, GifSlotDims>;
  panelHex: string;
  mediaHex: string;
};

/** Legacy v1 — chỉ còn để migrate */
type SavedShowcaseUiV1 = {
  v: 1;
  gifBaseMd: number;
  panelHex: string;
  mediaHex: string;
};

export function defaultGifGrid(): GifGridDims {
  return {
    base: { wPx: 520, hPx: 300 },
    sm: { wPx: 540, hPx: 360 },
    md: { wPx: 560, hPx: 420 },
    lg: { wPx: 600, hPx: 460 },
  };
}

function gifHeightsFromBase(md: number) {
  const base = Math.min(620, Math.max(240, Math.round(md)));
  return {
    sm: Math.round((base * 300) / 420),
    mdSm: Math.round((base * 360) / 420),
    md: base,
    lg: Math.round((base * 460) / 420),
  };
}

function migrateV1ToGrid(gifBaseMd: number): GifGridDims {
  const h = gifHeightsFromBase(gifBaseMd);
  return {
    base: { wPx: 520, hPx: h.sm },
    sm: { wPx: 540, hPx: h.mdSm },
    md: { wPx: 560, hPx: h.md },
    lg: { wPx: 600, hPx: h.lg },
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function sanitizeGrid(g: unknown): GifGridDims {
  const d = defaultGifGrid();
  if (!g || typeof g !== "object") return d;
  const o = g as Record<string, unknown>;
  const row = (x: unknown, fb: GifBreakpointRow): GifBreakpointRow => {
    if (!x || typeof x !== "object") return fb;
    const r = x as Record<string, unknown>;
    const wPx = clamp(Math.round(Number(r.wPx)) || fb.wPx, 80, 1400);
    const hPx = clamp(Math.round(Number(r.hPx)) || fb.hPx, 160, 900);
    return { wPx, hPx };
  };
  return {
    base: row(o.base, d.base),
    sm: row(o.sm, d.sm),
    md: row(o.md, d.md),
    lg: row(o.lg, d.lg),
  };
}

const FRAME_OFF_MAX = 320;
const SLOT_SCALE_MIN = 0.35;
const SLOT_SCALE_MAX = 2.5;
const SLOT_ORDER_MIN = -99;
const SLOT_ORDER_MAX = 99;

function sanitizeSlots(s: unknown): Record<string, GifSlotDims> {
  if (!s || typeof s !== "object") return {};
  const out: Record<string, GifSlotDims> = {};
  for (const [k, v] of Object.entries(s as Record<string, unknown>)) {
    if (!k || !v || typeof v !== "object") continue;
    const r = v as Record<string, unknown>;
    const wPx = clamp(Math.round(Number(r.wPx)) || 560, 80, 1400);
    const hPx = clamp(Math.round(Number(r.hPx)) || 420, 160, 900);
    const fxRaw = r.frameX ?? r.frameOffXPx;
    const fyRaw = r.frameY ?? r.frameOffYPx;
    const frameX =
      fxRaw !== undefined && Number.isFinite(Number(fxRaw))
        ? clamp(Math.round(Number(fxRaw)), -FRAME_OFF_MAX, FRAME_OFF_MAX)
        : 0;
    const frameY =
      fyRaw !== undefined && Number.isFinite(Number(fyRaw))
        ? clamp(Math.round(Number(fyRaw)), -FRAME_OFF_MAX, FRAME_OFF_MAX)
        : 0;
    const scaleRaw = r.scale;
    const scale =
      scaleRaw !== undefined && Number.isFinite(Number(scaleRaw))
        ? clamp(Number(scaleRaw), SLOT_SCALE_MIN, SLOT_SCALE_MAX)
        : 1;
    const ordRaw = r.stackOrder ?? r.order;
    const stackOrder =
      ordRaw !== undefined && Number.isFinite(Number(ordRaw))
        ? clamp(Math.round(Number(ordRaw)), SLOT_ORDER_MIN, SLOT_ORDER_MAX)
        : 0;
    const slot: GifSlotDims = { wPx, hPx };
    if (frameX !== 0) slot.frameX = frameX;
    if (frameY !== 0) slot.frameY = frameY;
    if (scale !== 1) slot.scale = scale;
    if (stackOrder !== 0) slot.stackOrder = stackOrder;
    out[k] = slot;
  }
  return out;
}

function normalizeHexInput(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const withHash = t.startsWith("#") ? t : `#${t}`;
  if (/^#[0-9A-Fa-f]{3}$/.test(withHash)) {
    const x = withHash.slice(1);
    return `#${x[0]}${x[0]}${x[1]}${x[1]}${x[2]}${x[2]}`.toLowerCase();
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(withHash)) return withHash.toLowerCase();
  return "";
}

function loadSavedAll(storageKey: string): {
  grid: GifGridDims;
  slots: Record<string, GifSlotDims>;
  panelHex: string;
  mediaHex: string;
} {
  if (typeof window === "undefined") {
    return {
      grid: defaultGifGrid(),
      slots: {},
      panelHex: "",
      mediaHex: "",
    };
  }
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return {
        grid: defaultGifGrid(),
        slots: {},
        panelHex: "",
        mediaHex: "",
      };
    }
    const j = JSON.parse(raw) as
      | SavedShowcaseUiV4
      | SavedShowcaseUiV3
      | SavedShowcaseUiV2
      | SavedShowcaseUiV1;
    if (j && typeof j === "object" && "v" in j && j.v === 4) {
      const v4 = j as SavedShowcaseUiV4;
      return {
        grid: sanitizeGrid(v4.grid),
        slots: sanitizeSlots(v4.slots),
        panelHex: typeof v4.panelHex === "string" ? v4.panelHex : "",
        mediaHex: typeof v4.mediaHex === "string" ? v4.mediaHex : "",
      };
    }
    if (j && typeof j === "object" && "v" in j && j.v === 3) {
      const v3 = j as SavedShowcaseUiV3;
      return {
        grid: sanitizeGrid(v3.grid),
        slots: sanitizeSlots(v3.slots),
        panelHex: typeof v3.panelHex === "string" ? v3.panelHex : "",
        mediaHex: typeof v3.mediaHex === "string" ? v3.mediaHex : "",
      };
    }
    if (j && typeof j === "object" && "v" in j && j.v === 2) {
      const v2 = j as SavedShowcaseUiV2;
      return {
        grid: sanitizeGrid(v2.grid),
        slots: {},
        panelHex: typeof v2.panelHex === "string" ? v2.panelHex : "",
        mediaHex: typeof v2.mediaHex === "string" ? v2.mediaHex : "",
      };
    }
    if (j && typeof j === "object" && "v" in j && j.v === 1) {
      const v1 = j as SavedShowcaseUiV1;
      const md =
        typeof v1.gifBaseMd === "number" && Number.isFinite(v1.gifBaseMd)
          ? v1.gifBaseMd
          : 420;
      return {
        grid: migrateV1ToGrid(md),
        slots: {},
        panelHex: typeof v1.panelHex === "string" ? v1.panelHex : "",
        mediaHex: typeof v1.mediaHex === "string" ? v1.mediaHex : "",
      };
    }
  } catch {
    /* ignore */
  }
  return {
    grid: defaultGifGrid(),
    slots: {},
    panelHex: "",
    mediaHex: "",
  };
}

function formatSlotLabel(slotKey: string): string {
  const m = /^([^:]+):(\d+)$/.exec(slotKey);
  if (!m) return slotKey;
  return `${m[1]} · ảnh ${parseInt(m[2], 10) + 1}`;
}

function buildDraftSlotDims(
  slotW: number,
  slotH: number,
  slotFrameX: number,
  slotFrameY: number,
  slotScale: number,
  slotStackOrder: number,
): GifSlotDims {
  const wPx = clamp(slotW, 80, 1400);
  const hPx = clamp(slotH, 160, 900);
  const frameX = clamp(
    Math.round(slotFrameX),
    -FRAME_OFF_MAX,
    FRAME_OFF_MAX,
  );
  const frameY = clamp(
    Math.round(slotFrameY),
    -FRAME_OFF_MAX,
    FRAME_OFF_MAX,
  );
  const scale = clamp(
    Number.isFinite(slotScale) ? slotScale : 1,
    SLOT_SCALE_MIN,
    SLOT_SCALE_MAX,
  );
  const stackOrder = clamp(
    Math.round(slotStackOrder),
    SLOT_ORDER_MIN,
    SLOT_ORDER_MAX,
  );
  const slot: GifSlotDims = { wPx, hPx };
  if (frameX !== 0) slot.frameX = frameX;
  if (frameY !== 0) slot.frameY = frameY;
  if (scale !== 1) slot.scale = scale;
  if (stackOrder !== 0) slot.stackOrder = stackOrder;
  return slot;
}

/** Gộp nháp ô đang chọn; bỏ key nếu trùng mặc định (md + khung 0 + scale 1 + order 0). */
function applySelectedSlotToSlots(
  slots: Record<string, GifSlotDims>,
  selectedSlot: string | null,
  draft: GifSlotDims | null,
  grid: GifGridDims,
): Record<string, GifSlotDims> {
  let safe = sanitizeSlots(slots);
  if (!selectedSlot || !draft) return safe;
  const md = sanitizeGrid(grid).md;
  const fx = draft.frameX ?? 0;
  const fy = draft.frameY ?? 0;
  const sc = draft.scale ?? 1;
  const ord = draft.stackOrder ?? 0;
  const isDefault =
    draft.wPx === md.wPx &&
    draft.hPx === md.hPx &&
    fx === 0 &&
    fy === 0 &&
    sc === 1 &&
    ord === 0;
  const prev = safe[selectedSlot];
  if (isDefault && prev) {
    const { [selectedSlot]: _, ...rest } = safe;
    return rest;
  }
  if (!isDefault) {
    const slot: GifSlotDims = { wPx: draft.wPx, hPx: draft.hPx };
    if (fx !== 0) slot.frameX = fx;
    if (fy !== 0) slot.frameY = fy;
    if (sc !== 1) slot.scale = sc;
    if (ord !== 0) slot.stackOrder = ord;
    return { ...safe, [selectedSlot]: slot };
  }
  return safe;
}

function slotsForExportJson(slots: Record<string, GifSlotDims>) {
  const s = sanitizeSlots(slots);
  const out: Record<string, GifSlotDims> = {};
  for (const [k, v] of Object.entries(s)) {
    out[k] = {
      wPx: v.wPx,
      hPx: v.hPx,
      frameX: v.frameX ?? 0,
      frameY: v.frameY ?? 0,
      scale: v.scale ?? 1,
      stackOrder: v.stackOrder ?? 0,
    };
  }
  return out;
}

function GifClickableCell({
  slotKey,
  src,
  alt,
  mediaCanvas,
  override,
  gifRowCellClass,
  gifImgClass,
  selectedSlot,
  onSelectSlot,
}: {
  slotKey: string;
  src: string;
  alt: string;
  mediaCanvas: string;
  override: GifSlotDims | undefined;
  gifRowCellClass: string;
  gifImgClass: string;
  selectedSlot: string | null;
  onSelectSlot: (key: string) => void;
}) {
  const isSel = selectedSlot === slotKey;
  const has = !!override;
  const orderVal = override?.stackOrder ?? 0;
  const cellShell =
    "min-w-0 cursor-pointer px-2 py-3 outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff8c3a]/80 md:px-3 md:py-4";
  const ringSel = isSel
    ? "ring-2 ring-[#ff8c3a] ring-inset"
    : "hover:ring-1 hover:ring-white/30 hover:ring-inset";
  const cellInner =
    "flex min-h-0 w-full min-w-0 flex-1 items-center justify-center overflow-hidden";

  if (!has) {
    return (
      <div
        className={`flex min-h-0 w-full flex-col ${cellShell} ${gifRowCellClass} ${ringSel}`}
        style={{ backgroundColor: mediaCanvas, order: orderVal }}
        role="button"
        tabIndex={0}
        aria-label={`Chọn ${alt} để chỉnh khung`}
        aria-pressed={isSel}
        onClick={(e) => {
          e.preventDefault();
          onSelectSlot(slotKey);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectSlot(slotKey);
          }
        }}
      >
        <div className={cellInner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className={`${gifImgClass} w-full`}
            loading="lazy"
            draggable={false}
          />
        </div>
      </div>
    );
  }

  const o = override;
  const fx = o.frameX ?? 0;
  const fy = o.frameY ?? 0;
  const sc = o.scale ?? 1;

  return (
    <div
      className={`flex min-h-0 w-full flex-col items-center justify-center ${cellShell} ${gifRowCellClass}`}
      style={{ order: orderVal, backgroundColor: mediaCanvas }}
      role="button"
      tabIndex={0}
      aria-label={`Chọn ${alt} để chỉnh khung`}
      aria-pressed={isSel}
      onClick={(e) => {
        e.preventDefault();
        onSelectSlot(slotKey);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectSlot(slotKey);
        }
      }}
    >
      <div
        className={`flex shrink-0 flex-col overflow-hidden ${ringSel}`}
        style={{
          width: `min(100%, ${o.wPx}px)`,
          height: o.hPx,
          minHeight: o.hPx,
          backgroundColor: mediaCanvas,
          transform: `translate(${fx}px, ${fy}px) scale(${sc})`,
          transformOrigin: "center center",
        }}
      >
        <div className={cellInner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="h-full w-full max-w-full object-contain"
            loading="lazy"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

function ShowcaseSectionLabel({
  label,
  theme,
}: {
  label: string;
  theme: ProjectTheme;
}) {
  const bg = theme.sectionLabelBg ?? "#0a1418";
  return (
    <div
      className="flex items-center justify-center px-6 py-8 md:py-12"
      style={{ backgroundColor: bg }}
    >
      <div className="flex items-center gap-4">
        <span
          className="h-px w-12 shrink-0"
          style={{ backgroundColor: hexToRgba(theme.accent, 0.33) }}
          aria-hidden
        />
        <h3
          className="text-2xl font-black uppercase tracking-[0.16em] md:text-3xl"
          style={{ color: theme.accent, fontFamily: "var(--font-rajdhani)" }}
        >
          {label}
        </h3>
        <span
          className="h-px w-12 shrink-0"
          style={{ backgroundColor: hexToRgba(theme.accent, 0.33) }}
          aria-hidden
        />
      </div>
    </div>
  );
}

function ShowcaseRenderer({
  modules,
  title,
  theme,
  gifGrid,
  gifSlots,
  selectedSlot,
  onSelectSlot,
}: {
  modules: readonly ShowcaseModule[];
  title: string;
  theme: ProjectTheme;
  gifGrid: GifGridDims;
  gifSlots: Record<string, GifSlotDims>;
  selectedSlot: string | null;
  onSelectSlot: (slotKey: string) => void;
}) {
  const panelBg = theme.showcasePanelBg ?? "#0b1d24";
  const labelBg = theme.sectionLabelBg ?? "#0a1418";
  const mediaCanvas = theme.showcaseMediaBg ?? panelBg;

  const gifVarStyle = {
    "--gr-h-0": `${gifGrid.base.hPx}px`,
    "--gr-h-1": `${gifGrid.sm.hPx}px`,
    "--gr-h-2": `${gifGrid.md.hPx}px`,
    "--gr-h-3": `${gifGrid.lg.hPx}px`,
    "--gr-w-0": `${gifGrid.base.wPx}px`,
    "--gr-w-1": `${gifGrid.sm.wPx}px`,
    "--gr-w-2": `${gifGrid.md.wPx}px`,
    "--gr-w-3": `${gifGrid.lg.wPx}px`,
  } as CSSProperties;

  const gifRowCellClass =
    "h-[var(--gr-h-0)] sm:h-[var(--gr-h-1)] md:h-[var(--gr-h-2)] lg:h-[var(--gr-h-3)]";

  const gifImgClass =
    "max-h-full object-contain max-w-[min(100%,var(--gr-w-0))] sm:max-w-[min(100%,var(--gr-w-1))] md:max-w-[min(100%,var(--gr-w-2))] lg:max-w-[min(100%,var(--gr-w-3))]";

  return (
    <div
      className="overflow-visible rounded-[28px]"
      style={{ backgroundColor: panelBg, ...gifVarStyle }}
    >
      {modules.map((module) => {
        const altBase = `${title} module ${module.id}`;

        if (module.variant === "sectionLabel") {
          return (
            <ShowcaseSectionLabel
              key={module.id}
              label={module.label}
              theme={theme}
            />
          );
        }

        if (module.variant === "video") {
          const aspect = module.aspect ?? 16 / 9;
          return (
            <div
              key={module.id}
              className="flex justify-center px-4 py-6 md:py-10"
              style={{ backgroundColor: labelBg }}
            >
              <div
                className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black"
                style={{ aspectRatio: `${aspect}` }}
              >
                <iframe
                  src={module.src}
                  title={`${title} video reel`}
                  loading="lazy"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          );
        }

        if (module.variant === "vimeo") {
          const aspect = module.aspectRatio ?? 16 / 9;
          return (
            <div key={module.id} className="bg-black">
              <div
                className="relative mx-auto w-full max-w-[1600px]"
                style={{ aspectRatio: `${aspect}` }}
              >
                <iframe
                  src={module.embedSrc}
                  title={`${title} video — ${module.id}`}
                  loading="lazy"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            </div>
          );
        }

        if (module.variant === "videoEmbed") {
          return (
            <div
              key={module.id}
              className="flex justify-center px-4 py-6 md:py-10"
              style={{ backgroundColor: labelBg }}
            >
              <div
                className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black"
                style={{ aspectRatio: `${module.aspect}` }}
              >
                <iframe
                  src={module.src}
                  title={`${title} portrait reel`}
                  loading="lazy"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          );
        }

        if (module.variant === "duo") {
          return (
            <div
              key={module.id}
              className="grid min-h-0 grid-cols-1 gap-0 overflow-visible md:grid-cols-2 md:items-stretch"
              style={{ backgroundColor: panelBg }}
            >
              {module.srcs.map((src, idx) => {
                const slotKey = `${module.id}:${idx}`;
                return (
                  <GifClickableCell
                    key={slotKey}
                    slotKey={slotKey}
                    src={src}
                    alt={`${altBase} ${idx + 1}`}
                    mediaCanvas={mediaCanvas}
                    override={gifSlots[slotKey]}
                    gifRowCellClass={gifRowCellClass}
                    gifImgClass={gifImgClass}
                    selectedSlot={selectedSlot}
                    onSelectSlot={onSelectSlot}
                  />
                );
              })}
            </div>
          );
        }

        if (module.variant === "trio") {
          return (
            <div
              key={module.id}
              className="grid min-h-0 grid-cols-1 gap-0 overflow-visible sm:grid-cols-3 sm:items-stretch"
              style={{ backgroundColor: panelBg }}
            >
              {module.srcs.map((src, idx) => {
                const slotKey = `${module.id}:${idx}`;
                return (
                  <GifClickableCell
                    key={slotKey}
                    slotKey={slotKey}
                    src={src}
                    alt={`${altBase} ${idx + 1}`}
                    mediaCanvas={mediaCanvas}
                    override={gifSlots[slotKey]}
                    gifRowCellClass={gifRowCellClass}
                    gifImgClass={gifImgClass}
                    selectedSlot={selectedSlot}
                    onSelectSlot={onSelectSlot}
                  />
                );
              })}
            </div>
          );
        }

        if (module.variant === "square") {
          const maxW = module.maxWidth ?? 680;
          return (
            <div
              key={module.id}
              className="flex justify-center px-4 py-3"
              style={{ backgroundColor: labelBg }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={module.src}
                alt={altBase}
                className="block h-auto w-full rounded-lg"
                style={{ maxWidth: `${maxW}px` }}
                loading="lazy"
              />
            </div>
          );
        }

        if (module.variant === "portrait") {
          const maxW = module.maxWidth ?? 420;
          return (
            <div
              key={module.id}
              className="flex justify-center px-4 py-6 md:py-10"
              style={{ backgroundColor: panelBg }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={module.src}
                alt={altBase}
                className="block h-auto w-full"
                style={{ maxWidth: `${maxW}px` }}
                loading="lazy"
              />
            </div>
          );
        }

        if (module.variant === "closing") {
          const isLarge = (module.size ?? "lg") === "lg";
          const color =
            module.color ?? (isLarge ? theme.accent : "rgba(255,255,255,0.55)");
          return (
            <div
              key={module.id}
              className={`flex items-center justify-center px-6 ${isLarge ? "py-16 md:py-24" : "py-14 md:py-20"}`}
              style={{ backgroundColor: "#000" }}
            >
              {isLarge ? (
                <h3
                  className="text-center text-3xl font-black uppercase tracking-[0.08em] md:text-5xl"
                  style={{ color, fontFamily: "var(--font-rajdhani)" }}
                >
                  {module.text}
                </h3>
              ) : (
                <p
                  className="text-center text-[22px] font-bold md:text-[25px]"
                  style={{ color }}
                >
                  {module.text}
                </p>
              )}
            </div>
          );
        }

        if (module.variant === "info") {
          return (
            <div
              key={module.id}
              className="flex items-center justify-center bg-black px-6 py-10 md:py-12"
            >
              <div className="text-center">
                <a
                  href={module.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] underline underline-offset-4 transition-opacity hover:opacity-80 md:text-base"
                  style={{ color: theme.accent }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                    className="h-4 w-4"
                  >
                    <path d="M3.6 3.2c-.3.3-.5.7-.5 1.2v15.2c0 .5.2.9.5 1.2L12 12 3.6 3.2Zm10.4 7.4 2.6 1.5L19 14.4 13.7 9 14 10.6Zm-1.7 1-8.3 8.3c.3 0 .7-.1 1-.3l9.4-5.4-2.1-2.6Zm9.1-2.7L18 10.1l-2.5 1.4 2.5 1.4 3.5 2.1c.6-.3 1-.9 1-1.7v-2.3c0-.8-.4-1.4-1.1-1.7ZM4.6 3.1l8.3 8.3 2.1-2.1L5.6 3.4c-.3-.2-.7-.3-1-.3Z" />
                  </svg>
                  {module.linkLabel}
                </a>
                <p className="mt-3 text-[13px] italic leading-6 text-white/55 md:text-sm">
                  Role in project:{" "}
                  <span className="font-semibold not-italic text-white/80">
                    {module.role}
                  </span>
                  <br />
                  {module.note}
                </p>
              </div>
            </div>
          );
        }

        return (
          <div
            key={module.id}
            className="w-full"
            style={{ backgroundColor: mediaCanvas }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={module.src}
              alt={altBase}
              className="block h-auto w-full"
              loading="lazy"
            />
          </div>
        );
      })}
    </div>
  );
}

export function CaseStudyShowcaseWithSettings({
  modules,
  title,
  theme,
  showcaseUiInit = null,
}: {
  modules: readonly ShowcaseModule[];
  title: string;
  theme: ProjectTheme;
  /** Khi chưa có localStorage — dùng object JSON đã xuất làm mặc định lần đầu. */
  showcaseUiInit?: SavedShowcaseUiV4 | null;
}) {
  const [open, setOpen] = useState(false);
  const [grid, setGrid] = useState<GifGridDims>(() => defaultGifGrid());
  const [slots, setSlots] = useState<Record<string, GifSlotDims>>({});
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotW, setSlotW] = useState(560);
  const [slotH, setSlotH] = useState(420);
  const [slotFrameX, setSlotFrameX] = useState(0);
  const [slotFrameY, setSlotFrameY] = useState(0);
  const [slotScale, setSlotScale] = useState(1);
  const [slotStackOrder, setSlotStackOrder] = useState(0);
  const [panelHexDraft, setPanelHexDraft] = useState("");
  const [mediaHexDraft, setMediaHexDraft] = useState("");
  const [savedToast, setSavedToast] = useState(false);
  const [copiedJsonToast, setCopiedJsonToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();
  const storageKey = useMemo(
    () => showcaseStorageKeyForPath(pathname),
    [pathname],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(storageKey);
    if (!raw && showcaseUiInit?.v === 4) {
      setGrid(sanitizeGrid(showcaseUiInit.grid));
      setSlots(sanitizeSlots(showcaseUiInit.slots));
      setPanelHexDraft(
        typeof showcaseUiInit.panelHex === "string"
          ? showcaseUiInit.panelHex
          : "",
      );
      setMediaHexDraft(
        typeof showcaseUiInit.mediaHex === "string"
          ? showcaseUiInit.mediaHex
          : "",
      );
      return;
    }
    const { grid: g, slots: sl, panelHex, mediaHex } = loadSavedAll(storageKey);
    setGrid(g);
    setSlots(sl);
    setPanelHexDraft(panelHex);
    setMediaHexDraft(mediaHex);
  }, [showcaseUiInit, storageKey]);

  const gridPreview = useMemo(() => sanitizeGrid(grid), [grid]);

  /** Panel mở + đã chọn ô: luôn áp W/H + XY đang gõ lên đúng ô đó (xem trước tức thì). */
  const gifSlotsPreview = useMemo(() => {
    const base = sanitizeSlots(slots);
    if (!open || !selectedSlot) return base;
    const draft = buildDraftSlotDims(
      slotW,
      slotH,
      slotFrameX,
      slotFrameY,
      slotScale,
      slotStackOrder,
    );
    return { ...base, [selectedSlot]: draft };
  }, [
    slots,
    open,
    selectedSlot,
    slotW,
    slotH,
    slotFrameX,
    slotFrameY,
    slotScale,
    slotStackOrder,
  ]);

  const handleSelectSlot = useCallback(
    (key: string) => {
      const md = sanitizeGrid(grid).md;
      const s = slots[key];
      setSlotW(s?.wPx ?? md.wPx);
      setSlotH(s?.hPx ?? md.hPx);
      setSlotFrameX(s?.frameX ?? 0);
      setSlotFrameY(s?.frameY ?? 0);
      setSlotScale(s?.scale ?? 1);
      setSlotStackOrder(s?.stackOrder ?? 0);
      setSelectedSlot(key);
      setOpen(true);
    },
    [grid, slots],
  );

  const clearSlotOverride = useCallback(() => {
    if (!selectedSlot) return;
    setSlots((prev) => {
      const next = { ...prev };
      delete next[selectedSlot];
      return next;
    });
    const md = sanitizeGrid(grid).md;
    setSlotW(md.wPx);
    setSlotH(md.hPx);
    setSlotFrameX(0);
    setSlotFrameY(0);
    setSlotScale(1);
    setSlotStackOrder(0);
  }, [selectedSlot, grid]);

  const mergedTheme = useMemo((): ProjectTheme => {
    const panel = normalizeHexInput(panelHexDraft);
    const media = normalizeHexInput(mediaHexDraft);
    return {
      ...theme,
      ...(panel ? { showcasePanelBg: panel } : {}),
      ...(media ? { showcaseMediaBg: media } : {}),
    };
  }, [theme, panelHexDraft, mediaHexDraft]);

  const setRow = useCallback(
    (key: keyof GifGridDims, field: "wPx" | "hPx", value: string) => {
      setGrid((prev) => {
        const cur = prev[key];
        const parsed = parseInt(value, 10);
        const v = Number.isFinite(parsed) ? parsed : cur[field];
        const next =
          field === "hPx"
            ? clamp(v, 160, 900)
            : clamp(v, 80, 1400);
        return { ...prev, [key]: { ...cur, [field]: next } };
      });
    },
    [],
  );

  const persist = useCallback(() => {
    const panel = normalizeHexInput(panelHexDraft);
    const media = normalizeHexInput(mediaHexDraft);
    if (panelHexDraft.trim() && !panel) {
      setError("Màu khung không hợp lệ (#RGB hoặc #RRGGBB).");
      return;
    }
    if (mediaHexDraft.trim() && !media) {
      setError("Màu nền ô ảnh không hợp lệ.");
      return;
    }
    setError(null);
    const safeGrid = sanitizeGrid(grid);
    const draft =
      selectedSlot !== null
        ? buildDraftSlotDims(
            slotW,
            slotH,
            slotFrameX,
            slotFrameY,
            slotScale,
            slotStackOrder,
          )
        : null;
    const safeSlots = applySelectedSlotToSlots(
      slots,
      selectedSlot,
      draft,
      safeGrid,
    );
    setGrid(safeGrid);
    setSlots(safeSlots);
    const payload: SavedShowcaseUiV4 = {
      v: 4,
      grid: safeGrid,
      slots: safeSlots,
      panelHex: panel,
      mediaHex: media,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2000);
  }, [
    storageKey,
    grid,
    slots,
    selectedSlot,
    slotW,
    slotH,
    slotFrameX,
    slotFrameY,
    slotScale,
    slotStackOrder,
    panelHexDraft,
    mediaHexDraft,
  ]);

  const copyShowcaseJson = useCallback(async () => {
    const panel = normalizeHexInput(panelHexDraft);
    const media = normalizeHexInput(mediaHexDraft);
    const g = sanitizeGrid(grid);
    const draft =
      open && selectedSlot
        ? buildDraftSlotDims(
            slotW,
            slotH,
            slotFrameX,
            slotFrameY,
            slotScale,
            slotStackOrder,
          )
        : null;
    const merged = applySelectedSlotToSlots(
      slots,
      open && selectedSlot ? selectedSlot : null,
      draft,
      grid,
    );
    const payload: SavedShowcaseUiV4 = {
      v: 4,
      grid: g,
      slots: slotsForExportJson(merged),
      panelHex: panel,
      mediaHex: media,
    };
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedJsonToast(true);
      window.setTimeout(() => setCopiedJsonToast(false), 2200);
      setError(null);
    } catch {
      setError("Không sao chép được — kiểm tra quyền clipboard của trình duyệt.");
    }
  }, [
    grid,
    slots,
    open,
    selectedSlot,
    slotW,
    slotH,
    slotFrameX,
    slotFrameY,
    slotScale,
    slotStackOrder,
    panelHexDraft,
    mediaHexDraft,
  ]);

  const resetAll = useCallback(() => {
    localStorage.removeItem(storageKey);
    setGrid(defaultGifGrid());
    setSlots({});
    setSelectedSlot(null);
    setSlotW(560);
    setSlotH(420);
    setSlotFrameX(0);
    setSlotFrameY(0);
    setSlotScale(1);
    setSlotStackOrder(0);
    setPanelHexDraft("");
    setMediaHexDraft("");
    setError(null);
    setOpen(false);
  }, [storageKey]);

  const bpRows: {
    key: keyof GifGridDims;
    order: number;
    title: string;
    hint: string;
  }[] = [
    {
      key: "base",
      order: 1,
      title: "Mobile (mặc định, <640px)",
      hint: "Áp dụng trước breakpoint sm.",
    },
    { key: "sm", order: 2, title: "sm (≥640px)", hint: "Tailwind sm." },
    { key: "md", order: 3, title: "md (≥768px)", hint: "Tailwind md." },
    { key: "lg", order: 4, title: "lg (≥1024px)", hint: "Tailwind lg." },
  ];

  return (
    <div className="relative">
      <ShowcaseRenderer
        modules={modules}
        title={title}
        theme={mergedTheme}
        gifGrid={gridPreview}
        gifSlots={gifSlotsPreview}
        selectedSlot={selectedSlot}
        onSelectSlot={handleSelectSlot}
      />

      {/* Settings button - commented out for production */}
      {/* <button
        type="button"
        aria-label="Cài đặt hiển thị showcase"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[90] flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#1f1f1f] text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition hover:border-[#ff8c3a]/50 hover:bg-[#252525] md:bottom-8 md:right-8"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="currentColor"
          aria-hidden
        >
          <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.3.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
      </button> */}

      {savedToast && (
        <div
          className="fixed bottom-24 right-5 z-[95] rounded-lg border border-emerald-500/40 bg-emerald-950/95 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-lg md:bottom-28 md:right-8"
          role="status"
        >
          Đã lưu vào trình duyệt
        </div>
      )}

      {copiedJsonToast && (
        <div
          className="fixed bottom-24 right-5 z-[95] max-w-[min(92vw,320px)] rounded-lg border border-cyan-500/45 bg-cyan-950/95 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-lg md:bottom-28 md:right-8"
          role="status"
        >
          Đã sao chép JSON (v4) — dán vào{" "}
          <code className="text-xs">showcaseUiInit</code> trên layout
        </div>
      )}

      {/* Settings modal - commented out for production */}
      {/* {open ? (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-black/55 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-showcase-settings-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Đóng"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative z-[1] flex h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#161616] shadow-2xl sm:max-w-[22rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 px-4 py-3">
              <h2
                id="case-showcase-settings-title"
                className="text-base font-black uppercase tracking-tight text-white"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                Showcase
              </h2>
              <p className="mt-1 text-[11px] leading-snug text-white/55">
                Chọn ô GIF trên trang →{" "}
                <span className="font-semibold text-white/80">Rộng / Cao</span>{" "}
                (khung xám).{" "}
                <span className="font-semibold text-white/80">
                  Dịch khung X / Y
                </span>{" "}
                = kéo cả khung trong ô (px).{" "}
                <span className="font-semibold text-white/80">
                  Tỉ lệ / thứ tự
                </span>{" "}
                = phóng khung và vị trí trên lưới.{" "}
                <span className="font-semibold text-[#ff8c3a]">Lưu</span> để
                giữ. Nút{" "}
                <span className="font-semibold text-cyan-300/90">
                  Sao chép JSON
                </span>{" "}
                dán <code className="text-[9px]">showcaseUiInit</code>.
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {selectedSlot ? (
                <fieldset className="rounded-lg border border-[#ff8c3a]/40 bg-black/35 px-3 py-2.5">
                  <legend className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff8c3a]">
                    Ô đang chọn
                  </legend>
                  <p className="mb-2 text-[10px] text-white/50">
                    {formatSlotLabel(selectedSlot)}
                    {slots[selectedSlot] ? (
                      <span className="text-emerald-400/80"> · đã lưu</span>
                    ) : (
                      <span> · xem trước trực tiếp</span>
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="slot-w"
                        className="text-[9px] font-bold uppercase tracking-wider text-white/45"
                      >
                        Rộng (px)
                      </label>
                      <input
                        id="slot-w"
                        type="number"
                        inputMode="numeric"
                        min={80}
                        max={1400}
                        step={10}
                        value={slotW}
                        onChange={(e) => {
                          const p = parseInt(e.target.value, 10);
                          setSlotW(
                            Number.isFinite(p) ? clamp(p, 80, 1400) : slotW,
                          );
                        }}
                        className="mt-0.5 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1.5 text-sm text-white outline-none focus:border-[#ff8c3a]/50"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="slot-h"
                        className="text-[9px] font-bold uppercase tracking-wider text-white/45"
                      >
                        Cao (px)
                      </label>
                      <input
                        id="slot-h"
                        type="number"
                        inputMode="numeric"
                        min={160}
                        max={900}
                        step={10}
                        value={slotH}
                        onChange={(e) => {
                          const p = parseInt(e.target.value, 10);
                          setSlotH(
                            Number.isFinite(p) ? clamp(p, 160, 900) : slotH,
                          );
                        }}
                        className="mt-0.5 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1.5 text-sm text-white outline-none focus:border-[#ff8c3a]/50"
                      />
                    </div>
                  </div>
                  <p className="mb-2 rounded-md bg-white/5 px-2 py-1.5 text-[9px] leading-snug text-white/45">
                    Thanh{" "}
                    <span className="font-semibold text-white/65">
                      Dịch khung
                    </span>{" "}
                    = di chuyển cả ô nền + ảnh (px), không phải crop trong ảnh.
                  </p>
                  <div className="mt-2.5 space-y-2">
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <label
                          htmlFor="slot-frame-x"
                          className="text-[9px] font-bold uppercase tracking-wider text-white/45"
                        >
                          Dịch khung ngang (px)
                        </label>
                        <span className="text-[10px] tabular-nums text-white/55">
                          {slotFrameX}
                        </span>
                      </div>
                      <input
                        id="slot-frame-x"
                        type="range"
                        min={-FRAME_OFF_MAX}
                        max={FRAME_OFF_MAX}
                        step={2}
                        value={slotFrameX}
                        onChange={(e) =>
                          setSlotFrameX(
                            clamp(
                              parseInt(e.target.value, 10),
                              -FRAME_OFF_MAX,
                              FRAME_OFF_MAX,
                            ),
                          )
                        }
                        className="mt-1 h-2 w-full cursor-pointer accent-[#ff8c3a]"
                      />
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <label
                          htmlFor="slot-frame-y"
                          className="text-[9px] font-bold uppercase tracking-wider text-white/45"
                        >
                          Dịch khung dọc (px)
                        </label>
                        <span className="text-[10px] tabular-nums text-white/55">
                          {slotFrameY}
                        </span>
                      </div>
                      <input
                        id="slot-frame-y"
                        type="range"
                        min={-FRAME_OFF_MAX}
                        max={FRAME_OFF_MAX}
                        step={2}
                        value={slotFrameY}
                        onChange={(e) =>
                          setSlotFrameY(
                            clamp(
                              parseInt(e.target.value, 10),
                              -FRAME_OFF_MAX,
                              FRAME_OFF_MAX,
                            ),
                          )
                        }
                        className="mt-1 h-2 w-full cursor-pointer accent-[#ff8c3a]"
                      />
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <label
                          htmlFor="slot-scale"
                          className="text-[9px] font-bold uppercase tracking-wider text-white/45"
                        >
                          Tỉ lệ khung (%)
                        </label>
                        <span className="text-[10px] tabular-nums text-white/55">
                          {Math.round(slotScale * 100)}%
                        </span>
                      </div>
                      <input
                        id="slot-scale"
                        type="range"
                        min={Math.round(SLOT_SCALE_MIN * 100)}
                        max={Math.round(SLOT_SCALE_MAX * 100)}
                        step={5}
                        value={Math.round(slotScale * 100)}
                        onChange={(e) => {
                          const pct = parseInt(e.target.value, 10);
                          setSlotScale(
                            clamp(
                              pct / 100,
                              SLOT_SCALE_MIN,
                              SLOT_SCALE_MAX,
                            ),
                          );
                        }}
                        className="mt-1 h-2 w-full cursor-pointer accent-[#ff8c3a]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="slot-stack-order"
                        className="text-[9px] font-bold uppercase tracking-wider text-white/45"
                      >
                        Thứ tự trên lưới (order)
                      </label>
                      <input
                        id="slot-stack-order"
                        type="number"
                        inputMode="numeric"
                        min={SLOT_ORDER_MIN}
                        max={SLOT_ORDER_MAX}
                        step={1}
                        value={slotStackOrder}
                        onChange={(e) => {
                          const p = parseInt(e.target.value, 10);
                          setSlotStackOrder(
                            Number.isFinite(p)
                              ? clamp(p, SLOT_ORDER_MIN, SLOT_ORDER_MAX)
                              : slotStackOrder,
                          );
                        }}
                        className="mt-0.5 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1.5 text-sm text-white outline-none focus:border-[#ff8c3a]/50"
                      />
                      <p className="mt-1 text-[9px] leading-snug text-white/40">
                        Số lớn hơn = về sau trong luồng lưới (CSS{" "}
                        <code className="text-[8px] text-white/50">order</code>
                        ), hữu ích khi chồng ô.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSlotOverride}
                    className="mt-2.5 w-full rounded-md border border-white/20 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/80 transition hover:bg-white/5"
                  >
                    Bỏ chỉnh ô này
                  </button>
                </fieldset>
              ) : (
                <p className="rounded-lg border border-dashed border-white/15 bg-black/20 px-3 py-2.5 text-[10px] leading-relaxed text-white/45">
                  Bấm một ô GIF (hàng 2 hoặc 3 ảnh) trên trang để chỉnh.
                </p>
              )}

              <details className="group rounded-lg border border-white/10 bg-black/20">
                <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/60 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="mr-1 inline-block text-[#ff8c3a] transition-transform group-open:rotate-90">
                    ▸
                  </span>
                  Lưới mặc định theo breakpoint (mobile / sm / md / lg)
                </summary>
                <div className="space-y-3 border-t border-white/10 px-3 py-3">
                  {bpRows.map(({ key, order, title: rowTitle, hint }) => {
                    const row = grid[key];
                    const wid = `gif-${key}-w`;
                    const hid = `gif-${key}-h`;
                    return (
                      <fieldset
                        key={key}
                        className="rounded-md border border-white/10 bg-black/25 px-2.5 py-2"
                      >
                        <legend className="px-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#ff8c3a]/90">
                          {order}. {rowTitle}
                        </legend>
                        <p className="mb-2 text-[9px] leading-snug text-white/38">
                          {hint}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label
                              htmlFor={wid}
                              className="text-[9px] font-bold uppercase tracking-wider text-white/45"
                            >
                              W
                            </label>
                            <input
                              id={wid}
                              type="number"
                              inputMode="numeric"
                              min={80}
                              max={1400}
                              step={10}
                              value={row.wPx}
                              onChange={(e) =>
                                setRow(key, "wPx", e.target.value)
                              }
                              className="mt-0.5 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1.5 text-sm text-white outline-none focus:border-[#ff8c3a]/50"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={hid}
                              className="text-[9px] font-bold uppercase tracking-wider text-white/45"
                            >
                              H
                            </label>
                            <input
                              id={hid}
                              type="number"
                              inputMode="numeric"
                              min={160}
                              max={900}
                              step={10}
                              value={row.hPx}
                              onChange={(e) =>
                                setRow(key, "hPx", e.target.value)
                              }
                              className="mt-0.5 w-full rounded-md border border-white/15 bg-black/50 px-2 py-1.5 text-sm text-white outline-none focus:border-[#ff8c3a]/50"
                            />
                          </div>
                        </div>
                      </fieldset>
                    );
                  })}
                </div>
              </details>

              <div>
                <label
                  htmlFor="panel-hex"
                  className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45"
                >
                  Màu nền khung (panel)
                </label>
                <input
                  id="panel-hex"
                  type="text"
                  placeholder="#2b2b2b hoặc để trống"
                  value={panelHexDraft}
                  onChange={(e) => setPanelHexDraft(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#ff8c3a]/50"
                  autoComplete="off"
                />
              </div>

              <div>
                <label
                  htmlFor="media-hex"
                  className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45"
                >
                  Màu nền ô ảnh (GIF)
                </label>
                <input
                  id="media-hex"
                  type="text"
                  placeholder="#2b2b2b hoặc để trống"
                  value={mediaHexDraft}
                  onChange={(e) => setMediaHexDraft(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#ff8c3a]/50"
                  autoComplete="off"
                />
              </div>

              {error ? (
                <p className="text-sm font-medium text-red-400">{error}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={persist}
                className="rounded-lg bg-[#ff8c3a] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-[#ffb366]"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={copyShowcaseJson}
                className="rounded-lg border border-cyan-500/45 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-cyan-100 transition hover:bg-cyan-950/50"
              >
                Sao chép JSON
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/85 transition hover:bg-white/5"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="ml-auto rounded-lg border border-red-500/40 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-950/40"
              >
                Xóa và mặc định
              </button>
            </div>
          </div>
        </div>
      ) : null} */}
    </div>
  );
}
