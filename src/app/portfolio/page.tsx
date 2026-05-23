"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Changa_One, Nunito_Sans } from "next/font/google";
import {
  ChangeEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import SiteHeader from "@/components/site-header";
import PortfolioGridApi from "@/components/portfolio-grid-api";
import { AccentHighlight } from "@/components/accent-highlight";

const PortfolioLowerSections = dynamic(
  () => import("@/components/portfolio-lower-sections"),
  {
    loading: () => (
      <div
        className="min-h-[50vh] border-t border-white/10 bg-[#0a0a0a]"
        aria-hidden
      />
    ),
  },
);

const changaOne = Changa_One({ weight: "400", subsets: ["latin"] });
const nunitoSans = Nunito_Sans({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

type CardConfig = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  align: "top" | "center" | "bottom";
  imageFit?: "cover" | "contain";
  textOffsetX?: number;
  textOffsetY?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: number;
  zIndex?: number;
  // If provided, renders a custom polygon clip-path (supports many corners).
  // Points are in the same local coordinate system as the card (before SHAPE_PAD is added).
  poly?: Array<{ x: number; y: number }>;
  tlx: number;
  tly: number;
  trx: number;
  try: number;
  brx: number;
  bry: number;
  blx: number;
  bly: number;
  imageOffsetX: number;
  imageOffsetY: number;
  imageScale: number;
  showText?: boolean;
  // Hexagon corners (optional - only for 6-corner cards)
  tmx?: number;
  tmy?: number;
  bmx?: number;
  bmy?: number;
};

type CornerKey = "tl" | "tr" | "br" | "bl" | "tm" | "bm";
const SHAPE_PAD = 120;
const BOARD_CONFIG = {
  translateX: 36,
  translateY: 8,
  rotate: 24,
  height: 520,
};
/**
 * Minimum floor (logical px); actual size = max(card bounds, this min) so JSON/export
 * doesn't scale incorrectly when adjusting layout.
 */
const BOARD_DESIGN_MIN = { w: 1065, h: 800 } as const;

function computeBoardDesignSize(cards: CardConfig[]): {
  w: number;
  h: number;
  topPad: number;
} {
  const M = 96;
  let minY = 0;
  let maxR = 0;
  let maxB = 0;
  for (const c of cards) {
    minY = Math.min(minY, c.y);
    maxR = Math.max(maxR, c.x + c.w);
    maxB = Math.max(maxB, c.y + c.h);
  }
  const topPad = minY < 0 ? -minY : 0;
  const w = Math.max(BOARD_DESIGN_MIN.w, Math.ceil(maxR + M + SHAPE_PAD * 2));
  const h = Math.max(
    BOARD_DESIGN_MIN.h,
    Math.ceil(maxB + topPad + M + SHAPE_PAD * 2),
  );
  return { w, h, topPad };
}

/** Original pixel ratio of publichttps://tdgamestudio.com/landing/images/bgright.png (adjust in settings if changing file). */
const BG_RIGHT_NATURAL = { w: 1065, h: 938 } as const;

type InteractionState =
  | {
      mode: "drag";
      index: number;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
    }
  | { mode: "rotate"; index: number; startX: number; originRotate: number }
  | {
      mode: "corner";
      index: number;
      corner: CornerKey;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
    }
  | {
      mode: "polyCorner";
      index: number;
      cornerIndex: number;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
    }
  | {
      mode: "imagePan";
      index: number;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
    }
  | null;

/** Snapshot BG Right panel (+ bgright image scale). `boardFitScale` not saved â€” recalculated per viewport. */
type PortfolioBgRightInit = {
  widthVw: number;
  heightVh: number;
  maxHeightPx: number;
  offsetX: number;
  offsetY: number;
  rotate: number;
  lockAspect: boolean;
  aspectW: number;
  aspectH: number;
  imageScale: number;
};

const PORTFOLIO_INIT_STORAGE_KEY = "portfolio-page-init-v1";

const PORTFOLIO_CARDS_INITIAL: CardConfig[] = [
  {
    id: "overdrive-top-left",
    title: "",
    subtitle: "",
    image: "https://tdgamestudio.com/landing/images/f8e2e81a-e72c-431b-b4ec-5ab7af73ea12.png",
    align: "center",
    x: 1471,
    y: 369,
    w: 600,
    h: 600,
    rotate: -1.4,
    tlx: 165,
    tly: -463,
    trx: 141,
    try: -6,
    brx: -170,
    bry: 89,
    blx: -1127,
    bly: 51,
    imageOffsetX: -87,
    imageOffsetY: -91,
    imageScale: 1.05,
    showText: true,
  },
  {
    id: "overdrive-top-right",
    title: "",
    subtitle: "",
    image: "https://tdgamestudio.com/landing/images/21f8a0a6-048f-4a5c-9946-3a89f6303fcd.png",
    align: "top",
    x: 1263,
    y: -97,
    w: 200,
    h: 149,
    rotate: 2.1,
    tlx: 10,
    tly: -388,
    trx: 49,
    try: -77,
    brx: -13,
    bry: 237,
    blx: -76,
    bly: 96,
    imageOffsetX: 25,
    imageOffsetY: -4,
    imageScale: 1.05,
    showText: true,
  },
  {
    id: "summoners-era",
    title: "",
    subtitle: "",
    image: "https://tdgamestudio.com/landing/images/3067c837-e030-403f-b7c5-0c7246bfe15f.png",
    align: "center",
    x: 1185,
    y: 259,
    w: 387,
    h: 170,
    rotate: 0,
    tlx: -10,
    tly: -440,
    trx: 65,
    try: -35,
    brx: -45,
    bry: 585,
    blx: -307,
    bly: 76,
    imageOffsetX: -10,
    imageOffsetY: -8,
    imageScale: 1.25,
  },
  {
    id: "environment-art",
    title: "",
    subtitle: "",
    image: "https://tdgamestudio.com/landing/images/f0d05f71-5089-4b3f-b453-7a8d19afc013.png",
    align: "center",
    x: 1593,
    y: -45,
    w: 506,
    h: 213,
    rotate: 0,
    tlx: -60,
    tly: -393,
    trx: -39,
    try: -26,
    brx: -122,
    bry: 786,
    blx: -223,
    bly: 24,
    textOffsetX: 0,
    textOffsetY: 0,
    imageOffsetX: -122,
    imageOffsetY: 3,
    imageScale: 1.45,
    showText: true,
  },
  {
    id: "hexagon-card",
    title: "",
    subtitle: "",
    image: "https://tdgamestudio.com/landing/images/IMG_4352.png",
    align: "center",
    x: 335,
    y: 171,
    w: 934,
    h: 899,
    rotate: -39.2,
    zIndex: 1,
    tlx: -140,
    tly: 55,
    trx: 179,
    try: -156,
    brx: 489,
    bry: 363,
    blx: -490,
    bly: 164,
    imageOffsetX: 86,
    imageOffsetY: 62,
    imageScale: 0.9,
    showText: true,
  },
];

const PORTFOLIO_BG_RIGHT_INITIAL: PortfolioBgRightInit = {
  widthVw: 66,
  heightVh: 86,
  maxHeightPx: 938,
  offsetX: 196,
  offsetY: 67,
  rotate: 0,
  lockAspect: true,
  aspectW: 1065,
  aspectH: 938,
  imageScale: 1.2,
};

/** Match Init JSON export (don't derive from compute to avoid 1px offset). */
const PORTFOLIO_DESIGN_CANVAS_INITIAL: {
  w: number;
  h: number;
  topPad: number;
} = {
  w: 1985,
  h: 1224,
  topPad: 50,
};

const PORTFOLIO_PAGE_DEFAULTS = {
  board: BOARD_CONFIG,
  background: "",
  designCanvas: PORTFOLIO_DESIGN_CANVAS_INITIAL,
  bgRight: PORTFOLIO_BG_RIGHT_INITIAL,
  cards: PORTFOLIO_CARDS_INITIAL,
};

function applyPortfolioInitPayload(
  data: Record<string, unknown>,
  apply: {
    setBgImage: (v: string) => void;
    setBgRightWidthVw: (v: number) => void;
    setBgRightHeightVh: (v: number) => void;
    setBgRightMaxHeightPx: (v: number) => void;
    setBgRightOffsetX: (v: number) => void;
    setBgRightOffsetY: (v: number) => void;
    setBgRightRotate: (v: number) => void;
    setBgRightLockAspect: (v: boolean) => void;
    setBgRightAspectW: (v: number) => void;
    setBgRightAspectH: (v: number) => void;
    setBgRightImageScale: (v: number) => void;
    setBoardCanvas: (v: { w: number; h: number; topPad: number }) => void;
    setShowcaseCards: (v: CardConfig[]) => void;
  },
) {
  if (typeof data.background === "string") {
    // Don't allow bgright.png as full-page background (it will be huge and overlap with right block)
    apply.setBgImage(
      /bgright\.png/i.test(data.background) ||
        /a0a5dab6-1e06-4a1b-af95-af0b51fc27e6\.png/i.test(data.background)
        ? PORTFOLIO_PAGE_DEFAULTS.background
        : data.background,
    );
  }

  if (data.designCanvas && typeof data.designCanvas === "object") {
    const d = data.designCanvas as Record<string, unknown>;
    const w = Number(d.width);
    const h = Number(d.height);
    const topPad = Number(d.topPad);
    if (Number.isFinite(w) && Number.isFinite(h) && Number.isFinite(topPad)) {
      apply.setBoardCanvas({ w, h, topPad });
    }
  }

  if (data.bgRight && typeof data.bgRight === "object") {
    const b = data.bgRight as Record<string, unknown>;
    const num = (k: string) => {
      const v = Number(b[k]);
      return Number.isFinite(v) ? v : null;
    };
    const nw = num("widthVw");
    if (nw !== null) apply.setBgRightWidthVw(nw);
    const nh = num("heightVh");
    if (nh !== null) apply.setBgRightHeightVh(nh);
    const nm = num("maxHeightPx");
    if (nm !== null) apply.setBgRightMaxHeightPx(nm);
    const ox = num("offsetX");
    if (ox !== null) apply.setBgRightOffsetX(ox);
    const oy = num("offsetY");
    if (oy !== null) apply.setBgRightOffsetY(oy);
    const rot = num("rotate");
    if (rot !== null) apply.setBgRightRotate(rot);
    if (typeof b.lockAspect === "boolean")
      apply.setBgRightLockAspect(b.lockAspect);
    const aw = num("aspectW");
    if (aw !== null) apply.setBgRightAspectW(aw);
    const ah = num("aspectH");
    if (ah !== null) apply.setBgRightAspectH(ah);
    const ims = num("imageScale");
    if (ims !== null) apply.setBgRightImageScale(ims);
  }

  if (Array.isArray(data.cards)) {
    apply.setShowcaseCards(data.cards as CardConfig[]);
  }
}

export default function PortfolioPage() {
  const ENABLE_EDITOR = false;
  /** Re-enable `true` when needed: background takeover + scale on card hover. */
  const ENABLE_PORTFOLIO_HOVER_FX = true;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [introCardsReady, setIntroCardsReady] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [bgImage, setBgImage] = useState(PORTFOLIO_PAGE_DEFAULTS.background);
  const [bgRightWidthVw, setBgRightWidthVw] = useState(
    PORTFOLIO_PAGE_DEFAULTS.bgRight.widthVw,
  );
  const [bgRightHeightVh, setBgRightHeightVh] = useState(
    PORTFOLIO_PAGE_DEFAULTS.bgRight.heightVh,
  );
  const [bgRightMaxHeightPx, setBgRightMaxHeightPx] = useState(
    PORTFOLIO_PAGE_DEFAULTS.bgRight.maxHeightPx,
  );
  const [bgRightOffsetX, setBgRightOffsetX] = useState(
    PORTFOLIO_PAGE_DEFAULTS.bgRight.offsetX,
  );
  const [bgRightOffsetY, setBgRightOffsetY] = useState(
    PORTFOLIO_PAGE_DEFAULTS.bgRight.offsetY,
  );
  /** Rotate bgright background separately (cards still use BOARD_CONFIG.rotate). */
  const [bgRightRotate, setBgRightRotate] = useState(
    PORTFOLIO_PAGE_DEFAULTS.bgRight.rotate,
  );
  /** Enable: block height follows image aspect ratio (width vw Ă— aspect). Disable: use vh + max px as before. */
  const [bgRightLockAspect, setBgRightLockAspect] = useState(
    PORTFOLIO_PAGE_DEFAULTS.bgRight.lockAspect,
  );
  const [bgRightAspectW, setBgRightAspectW] = useState<number>(
    PORTFOLIO_PAGE_DEFAULTS.bgRight.aspectW,
  );
  const [bgRightAspectH, setBgRightAspectH] = useState<number>(
    PORTFOLIO_PAGE_DEFAULTS.bgRight.aspectH,
  );
  const [bgRightImageScale, setBgRightImageScale] = useState(
    PORTFOLIO_PAGE_DEFAULTS.bgRight.imageScale,
  );
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [pickHint, setPickHint] = useState<string | null>(null);

  const [showcaseCards, setShowcaseCards] = useState<CardConfig[]>(
    PORTFOLIO_PAGE_DEFAULTS.cards,
  );
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [interaction, setInteraction] = useState<InteractionState>(null);
  const [lockLayout, setLockLayout] = useState(false);

  const bgrightSlotRef = useRef<HTMLDivElement>(null);
  const [boardFitScale, setBoardFitScale] = useState(1);
  /** TrĂ¡nh frame Ä‘áº§u scale=1 sai â†’ nháº£y/giáº­t (nhĂ¬n nhÆ° bgright â€œxoayâ€) trÆ°á»›c khi Ä‘o slot xong. */
  const [boardFitLayoutReady, setBoardFitLayoutReady] = useState(false);

  /**
   * Canvas scale/topPad cá»‘ Ä‘á»‹nh trong lĂºc kĂ©o; khĂ´ng tĂ­nh láº¡i má»—i frame (trĂ¡nh cáº£ khá»‘i nháº£y).
   * Báº¥m â€œRefit canvasâ€ sau khi dá»‹ch layout xa; Init JSON / localStorage khĂ´i phá»¥c designCanvas + bgRight.
   */
  const [boardCanvas, setBoardCanvas] = useState({
    w: PORTFOLIO_PAGE_DEFAULTS.designCanvas.w,
    h: PORTFOLIO_PAGE_DEFAULTS.designCanvas.h,
    topPad: PORTFOLIO_PAGE_DEFAULTS.designCanvas.topPad,
  });

  const runApplyInitPayload = (data: Record<string, unknown>) => {
    applyPortfolioInitPayload(data, {
      setBgImage,
      setBgRightWidthVw,
      setBgRightHeightVh,
      setBgRightMaxHeightPx,
      setBgRightOffsetX,
      setBgRightOffsetY,
      setBgRightRotate,
      setBgRightLockAspect,
      setBgRightAspectW,
      setBgRightAspectH,
      setBgRightImageScale,
      setBoardCanvas,
      setShowcaseCards,
    });
  };

  const portfolioHydratedRef = useRef(false);
  useLayoutEffect(() => {
    if (!ENABLE_EDITOR) return;
    if (portfolioHydratedRef.current) return;
    portfolioHydratedRef.current = true;
    try {
      const raw = localStorage.getItem(PORTFOLIO_INIT_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as unknown;
      if (data && typeof data === "object") {
        runApplyInitPayload(data as Record<string, unknown>);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const boardDesignSize = boardCanvas;

  useLayoutEffect(() => {
    const el = bgrightSlotRef.current;
    if (!el) return;
    const commit = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 2 || h < 2) return;
      const s = Math.min(w / boardDesignSize.w, h / boardDesignSize.h);
      setBoardFitScale(s > 0 ? s : 1);
      setBoardFitLayoutReady(true);
    };
    commit();
    const ro = new ResizeObserver(commit);
    ro.observe(el);
    const raf = window.requestAnimationFrame(() => commit());
    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [boardDesignSize.w, boardDesignSize.h]);

  const selectedCard = showcaseCards[selectedCardIndex];
  /** Card Ä‘ang hover â€” áº£nh dĂ¹ng lĂ m ná»n full-page (má»i card). */
  const hoveredHeroCard = useMemo(
    () =>
      hoveredCardIndex !== null
        ? (showcaseCards[hoveredCardIndex] ?? null)
        : null,
    [hoveredCardIndex, showcaseCards],
  );
  const showHoveredCardAsFullBg =
    ENABLE_PORTFOLIO_HOVER_FX && hoveredHeroCard !== null;

  const availableImageSet = useMemo(
    () => new Set(availableImages),
    [availableImages],
  );

  const updateSelectedCard = (
    key: keyof Pick<
      CardConfig,
      | "x"
      | "y"
      | "w"
      | "h"
      | "rotate"
      | "zIndex"
      | "textOffsetX"
      | "textOffsetY"
      | "imageOffsetX"
      | "imageOffsetY"
      | "imageScale"
    >,
    value: number,
  ) => {
    setShowcaseCards((prev) =>
      prev.map((card, index) =>
        index === selectedCardIndex ? { ...card, [key]: value } : card,
      ),
    );
  };

  const updateSelectedImage = (value: string) => {
    setShowcaseCards((prev) =>
      prev.map((card, index) =>
        index === selectedCardIndex ? { ...card, image: value } : card,
      ),
    );
  };

  const handlePickCardImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const nextPath = `/images/${encodeURIComponent(file.name)}`;
    updateSelectedImage(nextPath);
    setPickHint(
      availableImageSet.has(nextPath)
        ? null
        : `File not found in public/images: ${nextPath}`,
    );
  };

  const handlePickBgImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const nextPath = `/images/${encodeURIComponent(file.name)}`;
    setBgImage(nextPath);
    setPickHint(
      availableImageSet.has(nextPath)
        ? null
        : `File not found in public/images: ${nextPath}`,
    );
  };

  const fetchAvailableImages = async () => {
    try {
      const res = await fetch("/api/list-images", { cache: "no-store" });
      const data = (await res.json()) as { images?: string[] };
      const listed = Array.isArray(data.images) ? data.images : [];
      const extra = [
        "https://tdgamestudio.com/landing/sinspired/Artboard-1-copy-13-min-1024x572.jpg",
        "https://tdgamestudio.com/landing/sinspired/Artboard-1-copy-11-min-1024x572.jpg",
        "https://tdgamestudio.com/landing/sinspired/Artboard-2-copy-1024x850.jpg",
        "https://tdgamestudio.com/landing/sinspired/Artboard-2-copy-4-1024x850.jpg",
        "https://tdgamestudio.com/landing/sinspired/2D-Art-min-947x1024.jpg",
        "https://tdgamestudio.com/landing/sinspired/3a7ab9112768871.602fbfbfa228c-882x1024.jpg",
        "https://tdgamestudio.com/landing/sinspired/Character-Design-min-822x1024.jpg",
        "https://tdgamestudio.com/landing/sinspired/character_1-min-1024x970.jpg",
        "https://tdgamestudio.com/landing/sinspired/character_5-min-1024x970.jpg",
        "https://tdgamestudio.com/landing/sinspired/character_6-min-1024x970.jpg",
        "https://tdgamestudio.com/landing/sinspired/character_8-min-1024x970.jpg",
        "https://tdgamestudio.com/landing/sinspired/character_10-min-1024x970.jpg",
        "https://tdgamestudio.com/landing/sinspired/Game_Animation-min-1024x612.jpg",
        "https://tdgamestudio.com/landing/sinspired/lab_asset-min-1024x506.jpg",
        "https://tdgamestudio.com/landing/sinspired/lab_asset_dark_final-min-1024x506.jpg",
        "https://tdgamestudio.com/landing/sinspired/promo_amanda.jpg",
        "https://tdgamestudio.com/landing/sinspired/space_arena_source_nature_render_final-min-1024x599.jpg",
        "https://tdgamestudio.com/landing/sinspired/Volcano_Arena_render-min-1024x567.jpg",
      ];
      const merged = Array.from(new Set([...listed, ...extra]));
      setAvailableImages(merged);
    } catch {
      // ignore
    }
  };

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const getCardPoints = (card: CardConfig) => {
    const tl = {
      x: clamp(card.tlx, -SHAPE_PAD, card.w - 20),
      y: clamp(card.tly, -SHAPE_PAD, card.h - 20),
    };
    const tr = {
      x: clamp(card.w + card.trx, 20, card.w + SHAPE_PAD),
      y: clamp(card.try, -SHAPE_PAD, card.h - 20),
    };
    const br = {
      x: clamp(card.w + card.brx, 20, card.w + SHAPE_PAD),
      y: clamp(card.h + card.bry, 20, card.h + SHAPE_PAD),
    };
    const bl = {
      x: clamp(card.blx, -SHAPE_PAD, card.w - 20),
      y: clamp(card.h + card.bly, 20, card.h + SHAPE_PAD),
    };
    // Hexagon corners (if defined)
    const tm =
      card.tmx !== undefined
        ? {
            x: clamp(card.w / 2 + card.tmx, 20, card.w - 20),
            y: clamp(card.tmy ?? 0, -SHAPE_PAD, card.h - 20),
          }
        : undefined;
    const bm =
      card.bmx !== undefined
        ? {
            x: clamp(card.w / 2 + card.bmx, 20, card.w - 20),
            y: clamp(card.h + (card.bmy ?? 0), 20, card.h + SHAPE_PAD),
          }
        : undefined;
    return { tl, tr, br, bl, tm, bm };
  };

  const getPolygon = (card: CardConfig) => {
    if (card.poly && card.poly.length >= 3) {
      const points = card.poly.map((p) => ({
        x: clamp(p.x, -SHAPE_PAD, card.w + SHAPE_PAD),
        y: clamp(p.y, -SHAPE_PAD, card.h + SHAPE_PAD),
      }));
      return { points, kind: "poly" as const };
    }

    const pts = getCardPoints(card);
    const points =
      pts.tm && pts.bm
        ? [pts.tl, pts.tm, pts.tr, pts.br, pts.bm, pts.bl]
        : [pts.tl, pts.tr, pts.br, pts.bl];
    return { points, kind: "legacy" as const };
  };

  const bgRightExport = useMemo(
    (): PortfolioBgRightInit => ({
      widthVw: bgRightWidthVw,
      heightVh: bgRightHeightVh,
      maxHeightPx: bgRightMaxHeightPx,
      offsetX: bgRightOffsetX,
      offsetY: bgRightOffsetY,
      rotate: bgRightRotate,
      lockAspect: bgRightLockAspect,
      aspectW: bgRightAspectW,
      aspectH: bgRightAspectH,
      imageScale: bgRightImageScale,
    }),
    [
      bgRightWidthVw,
      bgRightHeightVh,
      bgRightMaxHeightPx,
      bgRightOffsetX,
      bgRightOffsetY,
      bgRightRotate,
      bgRightLockAspect,
      bgRightAspectW,
      bgRightAspectH,
      bgRightImageScale,
    ],
  );

  const exportJson = useMemo(
    () =>
      JSON.stringify(
        {
          board: {
            ...BOARD_CONFIG,
          },
          background: bgImage,
          designCanvas: {
            width: boardDesignSize.w,
            height: boardDesignSize.h,
            topPad: boardDesignSize.topPad,
          },
          bgRight: bgRightExport,
          cards: showcaseCards,
        },
        null,
        2,
      ),
    [showcaseCards, bgImage, boardDesignSize, bgRightExport],
  );

  const initJson = useMemo(
    () =>
      JSON.stringify(
        {
          board: BOARD_CONFIG,
          background: bgImage,
          designCanvas: {
            width: boardDesignSize.w,
            height: boardDesignSize.h,
            topPad: boardDesignSize.topPad,
          },
          bgRight: bgRightExport,
          cards: showcaseCards.map((c) => ({
            id: c.id,
            title: c.title,
            subtitle: c.subtitle,
            image: c.image,
            align: c.align,
            x: c.x,
            y: c.y,
            w: c.w,
            h: c.h,
            rotate: c.rotate,
            zIndex: c.zIndex,
            poly: c.poly,
            tlx: c.tlx,
            tly: c.tly,
            trx: c.trx,
            try: c.try,
            brx: c.brx,
            bry: c.bry,
            blx: c.blx,
            bly: c.bly,
            imageOffsetX: c.imageOffsetX,
            imageOffsetY: c.imageOffsetY,
            imageScale: c.imageScale,
            showText: c.showText,
            tmx: c.tmx,
            tmy: c.tmy,
            bmx: c.bmx,
            bmy: c.bmy,
          })),
        },
        null,
        2,
      ),
    [showcaseCards, bgImage, boardDesignSize, bgRightExport],
  );

  const handleExportCoordinates = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (!interaction) return;

    const onPointerMove = (event: PointerEvent) => {
      const z = Math.max(boardFitScale, 0.001);
      setShowcaseCards((prev) =>
        prev.map((card, index) => {
          if (index !== interaction.index) return card;

          if (interaction.mode === "drag") {
            const nextX = Math.round(
              interaction.originX + (event.clientX - interaction.startX) / z,
            );
            const nextY = Math.round(
              interaction.originY + (event.clientY - interaction.startY) / z,
            );
            return { ...card, x: nextX, y: nextY };
          }

          if (interaction.mode === "corner") {
            const dx = Math.round((event.clientX - interaction.startX) / z);
            const dy = Math.round((event.clientY - interaction.startY) / z);
            const nextX = interaction.originX + dx;
            const nextY = interaction.originY + dy;

            if (interaction.corner === "tl")
              return { ...card, tlx: nextX, tly: nextY };
            if (interaction.corner === "tm")
              return { ...card, tmx: nextX, tmy: nextY };
            if (interaction.corner === "tr")
              return { ...card, trx: nextX, try: nextY };
            if (interaction.corner === "br")
              return { ...card, brx: nextX, bry: nextY };
            if (interaction.corner === "bm")
              return { ...card, bmx: nextX, bmy: nextY };
            return { ...card, blx: nextX, bly: nextY };
          }

          if (interaction.mode === "polyCorner") {
            const dx = Math.round((event.clientX - interaction.startX) / z);
            const dy = Math.round((event.clientY - interaction.startY) / z);
            const nextX = clamp(
              interaction.originX + dx,
              -SHAPE_PAD,
              card.w + SHAPE_PAD,
            );
            const nextY = clamp(
              interaction.originY + dy,
              -SHAPE_PAD,
              card.h + SHAPE_PAD,
            );
            const nextPoly = (card.poly ?? []).map((p, i) =>
              i === interaction.cornerIndex ? { x: nextX, y: nextY } : p,
            );
            return { ...card, poly: nextPoly };
          }

          if (interaction.mode === "imagePan") {
            const nextOffsetX = Math.round(
              interaction.originX + (event.clientX - interaction.startX) / z,
            );
            const nextOffsetY = Math.round(
              interaction.originY + (event.clientY - interaction.startY) / z,
            );
            return {
              ...card,
              imageOffsetX: nextOffsetX,
              imageOffsetY: nextOffsetY,
            };
          }

          const nextRotate =
            Math.round(
              (interaction.originRotate +
                ((event.clientX - interaction.startX) / z) * 0.35) *
                10,
            ) / 10;
          return { ...card, rotate: nextRotate };
        }),
      );
    };

    const onPointerUp = () => setInteraction(null);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [interaction, boardFitScale]);

  // boardScale removed (rollback)

  useEffect(() => {
    fetchAvailableImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Prefetch chunk below-fold khi main thread ráº£nh (song song vá»›i dynamic mount). */
  useEffect(() => {
    const w = typeof window !== "undefined" ? window : undefined;
    if (!w) return;
    const load = () => {
      void import("@/components/portfolio-lower-sections");
    };
    const ric = w.requestIdleCallback;
    if (typeof ric === "function") {
      const id = ric.call(w, load, { timeout: 2500 });
      return () => w.cancelIdleCallback(id);
    }
    const t = w.setTimeout(load, 200);
    return () => w.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!boardFitLayoutReady) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setIntroCardsReady(true);
      return;
    }
    const id = window.requestAnimationFrame(() => setIntroCardsReady(true));
    return () => window.cancelAnimationFrame(id);
  }, [boardFitLayoutReady]);

  useEffect(() => {
    if (introCardsReady) {
      const t = window.setTimeout(() => setHasEntered(true), 3000);
      return () => window.clearTimeout(t);
    }
  }, [introCardsReady]);

  /** Slot Ä‘Ă´i khi chÆ°a cĂ³ kĂ­ch thÆ°á»›c á»Ÿ frame Ä‘áº§u (aspect/vw); khĂ´ng Ä‘á»ƒ intro káº¹t mĂ£i. */
  useEffect(() => {
    if (boardFitLayoutReady) return;
    const t = window.setTimeout(() => {
      const el = bgrightSlotRef.current;
      if (el) {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w >= 2 && h >= 2) {
          const s = Math.min(w / boardDesignSize.w, h / boardDesignSize.h);
          setBoardFitScale(s > 0 ? s : 1);
        }
      }
      setBoardFitLayoutReady(true);
    }, 400);
    return () => window.clearTimeout(t);
  }, [boardFitLayoutReady, boardDesignSize.w, boardDesignSize.h]);

  const SHOW_CARDS = true;

  return (
    <>
      <SiteHeader />
      <main
        className={`relative min-h-screen bg-black ${nunitoSans.className}`}
      >
        {/* Chá»‰ vĂ¹ng hero: ná»n hover card khĂ´ng Ä‘Æ°á»£c absolute theo cáº£ <main> (sáº½ kĂ©o dĂ i xuá»‘ng FAQ/Contact). */}
        <div 
          className="relative isolate overflow-hidden"
          onMouseLeave={() => {
            if (ENABLE_PORTFOLIO_HOVER_FX) setHoveredCardIndex(null);
          }}
        >
          {/* Global background â€” hover báº¥t ká»³ card: áº£nh card lĂ m ná»n + bá» phá»§ + scale nháº¹ */}
          <div className="pointer-events-none absolute inset-0 z-0">
            {bgImage && !/bgright\.png/i.test(bgImage) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bgImage}
                alt=""
                className={`absolute inset-0 h-full w-full origin-center object-cover transition-[opacity,transform] duration-500 ease-out ${
                  showHoveredCardAsFullBg
                    ? "scale-100 opacity-0"
                    : "scale-100 opacity-100"
                }`}
              />
            ) : null}
            {hoveredHeroCard ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hoveredHeroCard.image}
                alt=""
                className={`absolute inset-0 h-full w-full origin-center object-cover transition-[opacity,transform] duration-500 ease-out ${
                  showHoveredCardAsFullBg
                    ? "scale-110 opacity-100"
                    : "scale-100 opacity-0"
                }`}
              />
            ) : null}
            <div
              className={`absolute inset-0 bg-black/65 transition-opacity duration-500 ease-out ${
                showHoveredCardAsFullBg ? "opacity-0" : "opacity-100"
              }`}
            />
          </div>

          {ENABLE_EDITOR && settingsOpen && (
            <div className="hidden lg:block fixed left-4 top-[11rem] z-[100] max-h-[min(70vh,calc(100dvh-12rem))] w-[min(380px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-white/30 bg-black/75 p-4 text-white shadow-xl backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.09em] text-amber-300">
                  Card Controller
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLockLayout(!lockLayout)}
                    className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
                      lockLayout
                        ? "border-red-400/70 bg-red-400/20 text-red-300"
                        : "border-emerald-400/70 bg-emerald-400/20 text-emerald-300"
                    }`}
                    title={lockLayout ? "Má»Ÿ khĂ³a Ä‘á»ƒ kĂ©o gĂ³c" : "KhĂ³a layout"}
                  >
                    {lockLayout ? "đŸ”’ KhĂ³a" : "đŸ”“ Má»Ÿ"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBoardCanvas(computeBoardDesignSize(showcaseCards))
                    }
                    className="rounded-md border border-sky-400/60 bg-sky-500/25 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-sky-200"
                    title="TĂ­nh láº¡i khung canvas theo vá»‹ trĂ­ cards hiá»‡n táº¡i (sau khi kĂ©o xa)"
                  >
                    Refit canvas
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCoordinates}
                    className="rounded-md border border-amber-300/70 bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-black"
                  >
                    Xuáº¥t JSON
                  </button>
                </div>
              </div>
              <p className="mb-3 text-[11px] text-white/70">
                {lockLayout
                  ? "Layout Ä‘ang khĂ³a. Báº­t đŸ”“ Má»Ÿ Ä‘á»ƒ kĂ©o cĂ¡c gĂ³c chá»‰nh hĂ¬nh dáº¡ng (4 hoáº·c 6 gĂ³c)."
                  : "Layout Ä‘ang má»Ÿ. KĂ©o cĂ¡c cháº¥m tráº¯ng á»Ÿ gĂ³c Ä‘á»ƒ chá»‰nh hĂ¬nh. Card 5 = Hexagon 6 gĂ³c. Báº­t đŸ”’ KhĂ³a Ä‘á»ƒ giá»¯ cá»‘ Ä‘á»‹nh."}
              </p>

              <div className="mb-3 flex flex-wrap gap-2">
                {showcaseCards.map((card, index) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedCardIndex(index)}
                    className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                      selectedCardIndex === index
                        ? "border-amber-300 bg-amber-300/20 text-amber-200"
                        : "border-white/25 text-white/75"
                    }`}
                  >
                    Card {index + 1}
                  </button>
                ))}
              </div>

              {selectedCard && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex flex-col gap-1">
                    <span>Image</span>
                    <input
                      type="text"
                      value={selectedCard.image}
                      onChange={(e) => updateSelectedImage(e.target.value)}
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <div className="col-span-2 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span>Chá»n áº£nh (file browser â†’ láº¥y tĂªn file)</span>
                      <button
                        type="button"
                        onClick={fetchAvailableImages}
                        className="rounded border border-amber-300/60 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200 hover:bg-amber-400/25"
                      >
                        Reload images dir
                      </button>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePickCardImage}
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-[11px]"
                    />
                    <span className="text-[10px] text-white/55">
                      File pháº£i náº±m trong{" "}
                      <span className="font-mono">public/images</span>. MĂ¬nh chá»‰
                      láº¥y <span className="font-mono">file.name</span> vĂ  gĂ¡n
                      thĂ nh <span className="font-mono">/images/tenfile</span>.
                    </span>
                  </div>
                  {pickHint && (
                    <div className="col-span-2 rounded border border-red-400/30 bg-red-950/20 px-2 py-1 text-[10px] text-red-200">
                      {pickHint}
                    </div>
                  )}
                  <label className="flex flex-col gap-1">
                    <span>X</span>
                    <input
                      type="number"
                      value={selectedCard.x}
                      onChange={(e) =>
                        updateSelectedCard("x", Number(e.target.value))
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Y</span>
                    <input
                      type="number"
                      value={selectedCard.y}
                      onChange={(e) =>
                        updateSelectedCard("y", Number(e.target.value))
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>W</span>
                    <input
                      type="number"
                      value={selectedCard.w}
                      onChange={(e) =>
                        updateSelectedCard("w", Number(e.target.value))
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>H</span>
                    <input
                      type="number"
                      value={selectedCard.h}
                      onChange={(e) =>
                        updateSelectedCard("h", Number(e.target.value))
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>TL x,y</span>
                    <input
                      type="text"
                      value={`${selectedCard.tlx}, ${selectedCard.tly}`}
                      readOnly
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-white/75"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>TR x,y</span>
                    <input
                      type="text"
                      value={`${selectedCard.trx}, ${selectedCard.try}`}
                      readOnly
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-white/75"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Rotate</span>
                    <input
                      type="number"
                      value={selectedCard.rotate}
                      onChange={(e) =>
                        updateSelectedCard("rotate", Number(e.target.value))
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Z Index</span>
                    <input
                      type="number"
                      value={
                        selectedCard.zIndex ??
                        (selectedCardIndex === 4 ? 1 : 10)
                      }
                      onChange={(e) =>
                        updateSelectedCard("zIndex", Number(e.target.value))
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Text X</span>
                    <input
                      type="number"
                      value={selectedCard.textOffsetX ?? 0}
                      onChange={(e) =>
                        updateSelectedCard(
                          "textOffsetX",
                          Number(e.target.value),
                        )
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Text Y</span>
                    <input
                      type="number"
                      value={selectedCard.textOffsetY ?? 0}
                      onChange={(e) =>
                        updateSelectedCard(
                          "textOffsetY",
                          Number(e.target.value),
                        )
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Image X</span>
                    <input
                      type="number"
                      value={selectedCard.imageOffsetX}
                      onChange={(e) =>
                        updateSelectedCard(
                          "imageOffsetX",
                          Number(e.target.value),
                        )
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Image Y</span>
                    <input
                      type="number"
                      value={selectedCard.imageOffsetY}
                      onChange={(e) =>
                        updateSelectedCard(
                          "imageOffsetY",
                          Number(e.target.value),
                        )
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Image Scale</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.2"
                      max="5"
                      value={selectedCard.imageScale}
                      onChange={(e) =>
                        updateSelectedCard(
                          "imageScale",
                          Math.max(0.2, Math.min(5, Number(e.target.value))),
                        )
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>BR x,y</span>
                    <input
                      type="text"
                      value={`${selectedCard.brx}, ${selectedCard.bry}`}
                      readOnly
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-white/75"
                    />
                  </label>
                  <label className="col-span-2 flex flex-col gap-1">
                    <span>BL x,y</span>
                    <input
                      type="text"
                      value={`${selectedCard.blx}, ${selectedCard.bly}`}
                      readOnly
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-white/75"
                    />
                  </label>
                  {selectedCard.tmx !== undefined && (
                    <>
                      <label className="flex flex-col gap-1">
                        <span>TM x</span>
                        <input
                          type="number"
                          value={selectedCard.tmx}
                          onChange={(e) =>
                            setShowcaseCards((prev) =>
                              prev.map((card, idx) =>
                                idx === selectedCardIndex
                                  ? { ...card, tmx: Number(e.target.value) }
                                  : card,
                              ),
                            )
                          }
                          className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span>TM y</span>
                        <input
                          type="number"
                          value={selectedCard.tmy}
                          onChange={(e) =>
                            setShowcaseCards((prev) =>
                              prev.map((card, idx) =>
                                idx === selectedCardIndex
                                  ? { ...card, tmy: Number(e.target.value) }
                                  : card,
                              ),
                            )
                          }
                          className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                        />
                      </label>
                    </>
                  )}
                  {selectedCard.bmx !== undefined && (
                    <>
                      <label className="flex flex-col gap-1">
                        <span>BM x</span>
                        <input
                          type="number"
                          value={selectedCard.bmx}
                          onChange={(e) =>
                            setShowcaseCards((prev) =>
                              prev.map((card, idx) =>
                                idx === selectedCardIndex
                                  ? { ...card, bmx: Number(e.target.value) }
                                  : card,
                              ),
                            )
                          }
                          className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span>BM y</span>
                        <input
                          type="number"
                          value={selectedCard.bmy}
                          onChange={(e) =>
                            setShowcaseCards((prev) =>
                              prev.map((card, idx) =>
                                idx === selectedCardIndex
                                  ? { ...card, bmy: Number(e.target.value) }
                                  : card,
                              ),
                            )
                          }
                          className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                        />
                      </label>
                    </>
                  )}
                  <label className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCard.showText !== false}
                      onChange={(e) =>
                        setShowcaseCards((prev) =>
                          prev.map((card, index) =>
                            index === selectedCardIndex
                              ? { ...card, showText: e.target.checked }
                              : card,
                          ),
                        )
                      }
                      className="h-4 w-4 rounded border-white/20"
                    />
                    <span className="text-xs">Hiá»ƒn thá»‹ text</span>
                  </label>
                </div>
              )}

              <div className="mt-3 rounded-md border border-white/15 bg-black/55 p-2">
                <p className="mb-1 text-[10px] uppercase tracking-[0.09em] text-white/70">
                  JSON export {copied ? "(copied)" : ""}
                </p>
                <pre className="max-h-36 overflow-auto text-[10px] leading-relaxed text-white/80">
                  {exportJson}
                </pre>
              </div>

              {/* Background Image Settings */}
              <div className="mt-3 rounded-md border border-amber-400/30 bg-amber-950/20 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.09em] text-amber-300">
                  Background Image
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex flex-col gap-1">
                    <span>Image URL</span>
                    <input
                      type="text"
                      value={bgImage}
                      onChange={(e) => setBgImage(e.target.value)}
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <div className="flex flex-col gap-1">
                    <span>Pick BG (file browser)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePickBgImage}
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* BG Right Layout (bgright.png) */}
              <div className="mt-3 rounded-md border border-white/15 bg-black/55 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.09em] text-white/80">
                  BG Right Layout (bgright.png)
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex flex-col gap-1">
                    <span>Width (vw)</span>
                    <input
                      type="number"
                      min={20}
                      max={100}
                      value={bgRightWidthVw}
                      onChange={(e) =>
                        setBgRightWidthVw(Number(e.target.value))
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Height (vh)</span>
                    <input
                      type="number"
                      min={20}
                      max={100}
                      value={bgRightHeightVh}
                      onChange={(e) =>
                        setBgRightHeightVh(Number(e.target.value))
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Max height (px)</span>
                    <input
                      type="number"
                      min={200}
                      max={2000}
                      value={bgRightMaxHeightPx}
                      onChange={(e) =>
                        setBgRightMaxHeightPx(Number(e.target.value))
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Offset X (px)</span>
                    <input
                      type="number"
                      value={bgRightOffsetX}
                      onChange={(e) =>
                        setBgRightOffsetX(Number(e.target.value))
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Offset Y (px)</span>
                    <input
                      type="number"
                      value={bgRightOffsetY}
                      onChange={(e) =>
                        setBgRightOffsetY(Number(e.target.value))
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="col-span-2 flex flex-col gap-1">
                    <span>Rotate ná»n (deg)</span>
                    <input
                      type="number"
                      step="0.5"
                      value={bgRightRotate}
                      onChange={(e) => setBgRightRotate(Number(e.target.value))}
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bgRightLockAspect}
                      onChange={(e) => setBgRightLockAspect(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20"
                    />
                    <span>Giá»¯ tá»‰ lá»‡ W:H</span>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Tá»‰ lá»‡ W (px)</span>
                    <input
                      type="number"
                      min={1}
                      value={bgRightAspectW}
                      onChange={(e) =>
                        setBgRightAspectW(Math.max(1, Number(e.target.value)))
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Tá»‰ lá»‡ H (px)</span>
                    <input
                      type="number"
                      min={1}
                      value={bgRightAspectH}
                      onChange={(e) =>
                        setBgRightAspectH(Math.max(1, Number(e.target.value)))
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                  <label className="col-span-2 flex flex-col gap-1">
                    <span>Scale áº£nh bgright</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.25"
                      max="4"
                      value={bgRightImageScale}
                      onChange={(e) =>
                        setBgRightImageScale(
                          Math.max(0.25, Math.min(4, Number(e.target.value))),
                        )
                      }
                      className="rounded-md border border-white/20 bg-white/5 px-2 py-1"
                    />
                  </label>
                </div>
              </div>

              {/* Init JSON Export */}
              <div className="mt-3 rounded-md border border-emerald-400/30 bg-emerald-950/20 p-2">
                <p className="mb-1 text-[9px] leading-snug text-white/55">
                  CĂ³{" "}
                  <strong className="text-emerald-200/90">
                    bgRight.imageScale
                  </strong>{" "}
                  vĂ  layout ná»n.{" "}
                  <strong className="text-emerald-200/90">boardFitScale</strong>{" "}
                  theo khung trĂ¬nh duyá»‡t â€” khĂ´ng export, F5 váº«n Ä‘Ăºng náº¿u lÆ°u
                  Init.
                </p>
                <div className="mb-1 flex flex-wrap items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(initJson);
                        try {
                          localStorage.setItem(
                            PORTFOLIO_INIT_STORAGE_KEY,
                            initJson,
                          );
                        } catch {
                          /* ignore */
                        }
                        alert(
                          "ÄĂ£ copy Init + lÆ°u trĂ¬nh duyá»‡t (F5 khĂ´i phá»¥c cĂ¹ng scale/offset).",
                        );
                      } catch {
                        alert("Copy tháº¥t báº¡i!");
                      }
                    }}
                    className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-500/30"
                  >
                    Copy Init + lÆ°u F5
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        const data = JSON.parse(text) as unknown;
                        if (!data || typeof data !== "object") {
                          alert("JSON khĂ´ng há»£p lá»‡.");
                          return;
                        }
                        runApplyInitPayload(data as Record<string, unknown>);
                        try {
                          localStorage.setItem(
                            PORTFOLIO_INIT_STORAGE_KEY,
                            text,
                          );
                        } catch {
                          /* ignore */
                        }
                        alert("ÄĂ£ dĂ¡n Init + lÆ°u F5.");
                      } catch {
                        alert("Clipboard / JSON lá»—i.");
                      }
                    }}
                    className="rounded border border-emerald-400/50 bg-white/10 px-2 py-0.5 text-[10px] text-white/90 hover:bg-white/15"
                  >
                    DĂ¡n Init
                  </button>
                </div>
                <p className="text-[10px] uppercase tracking-[0.09em] text-emerald-300">
                  Init JSON
                </p>
                <pre className="mt-1 max-h-32 overflow-auto text-[10px] leading-relaxed text-white/80">
                  {initJson}
                </pre>
              </div>
            </div>
          )}
          <section className="relative z-10 min-h-screen">
            <div
              className="relative mx-auto flex min-h-screen w-full items-center py-24 pt-28 sm:pt-32"
              style={{ width: "var(--layout-width, 75%)" }}
            >
              <div
                className="relative z-20 max-w-[606px] tracking-[0.5px]"
                style={{ transform: "translateY(var(--hero-text-y, 0px))" }}
              >
                <div className="mb-[-10px] overflow-hidden">
                  <div
                    className={`leading-[1] font-black uppercase text-white ${changaOne.className}`}
                    style={{ fontSize: "var(--hero-title-size, 100px)" }}
                  >
                    OUR{" "}
                    <span
                      style={{
                        color: "var(--hero-highlight-color, #f59e0b)",
                      }}
                    >
                      PROJECTS
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <div
                    className="h-0.5 w-12 shrink-0"
                    style={{
                      backgroundColor: "var(--hero-subtitle-color, #f59e0b)",
                    }}
                  />
                  <h3
                    className="font-bold uppercase tracking-[0.3em]"
                    style={{
                      fontSize: "var(--hero-subtitle-size, 16px)",
                      color: "var(--hero-subtitle-color, #f59e0b)",
                    }}
                  >
                    Take a look at our game art projects!
                  </h3>
                </div>

                <p
                  className="mb-[15px] mt-4 max-w-[547px] leading-normal"
                  style={{
                    fontSize: "var(--hero-desc-size, 18px)",
                    color: "var(--hero-desc-color, #e5e7eb)",
                  }}
                >
                  TD Games&apos; portfolio. We specialize in creating modern 3D
                  environments, captivating characters, and innovative concept
                  art for next-gen games. For years of experience in the
                  industry of game art design, managed to collect a solid game
                  design portfolio of various artworks made in 2D or 3D and
                  other directions.
                </p>

                <div className="mb-[15px] mt-[32px]">
                  <Link
                    href="#contact"
                    className="inline-block rounded-xl border-2 px-[32px] py-[16px] text-[18px] font-bold uppercase tracking-wider text-black transition-colors duration-300 hover:bg-transparent hover:text-white"
                    style={{
                      backgroundColor: "var(--hero-btn-bg, #f59e0b)",
                      borderColor: "var(--hero-btn-bg, #f59e0b)",
                    }}
                  >
                    Get in Touch
                  </Link>
                </div>
              </div>
            </div>

            <div
              ref={bgrightSlotRef}
              className="absolute right-0 top-0 z-0 max-w-none"
              style={{
                right:
                  "clamp(48px, calc((100vw - var(--layout-width, 75%)) / 2 - 96px), 180px)",
                width: `${bgRightWidthVw}vw`,
                ...(bgRightLockAspect
                  ? {
                      aspectRatio: `${bgRightAspectW} / ${bgRightAspectH}`,
                      maxHeight: `min(${bgRightHeightVh}vh, ${bgRightMaxHeightPx}px)`,
                    }
                  : {
                      height: `min(${bgRightHeightVh}vh, ${bgRightMaxHeightPx}px)`,
                    }),
                transform: `translate(${bgRightOffsetX}px, ${bgRightOffsetY}px)`,
              }}
            >
              <div className="relative h-full w-full min-h-0 overflow-visible">
                <div
                  className="absolute"
                  style={{
                    right: 0,
                    top: "50%",
                    width: boardDesignSize.w,
                    height: boardDesignSize.h,
                    transform: `translateY(-50%) scale(${boardFitScale})`,
                    transformOrigin: "center right",
                    opacity: boardFitLayoutReady ? 1 : 0,
                  }}
                >
                  <div
                    className="relative h-full w-full"
                    style={{
                      transform: `translate(${BOARD_CONFIG.translateX}px, ${BOARD_CONFIG.translateY + boardDesignSize.topPad}px)`,
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        transform: `rotate(${bgRightRotate}deg)`,
                        transformOrigin: "center center",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://tdgamestudio.com/landing/images/bgright.png"
                        alt=""
                        className={`pointer-events-none absolute inset-0 h-full w-full select-none object-right transition-opacity duration-500 ease-out ${
                          bgRightLockAspect ? "object-contain" : "object-cover"
                        } ${showHoveredCardAsFullBg ? "opacity-0" : "opacity-100"}`}
                        style={{
                          transform: `scale(${bgRightImageScale})`,
                          transformOrigin: "center right",
                        }}
                      />
                    </div>

                    <div
                      className="absolute inset-0"
                      style={{
                        transform: `rotate(${BOARD_CONFIG.rotate}deg)`,
                        transformOrigin: "center center",
                      }}
                    >
                      {SHOW_CARDS &&
                        showcaseCards.map((card, index) =>
                          (() => {
                            const poly = getPolygon(card);
                            const clipPath = `polygon(${poly.points
                              .map(
                                (p) =>
                                  `${p.x + SHAPE_PAD}px ${p.y + SHAPE_PAD}px`,
                              )
                              .join(", ")})`;

                            const cardBgTakeover = showHoveredCardAsFullBg;
                            const isActiveHoveredCard =
                              hoveredCardIndex === index;

                            const cardZ =
                              interaction?.index === index
                                ? 40
                                : (card.zIndex ??
                                  (selectedCardIndex === index ? 25 : 10));
                            /** Hover: chá»‰ phĂ³ng áº£nh trong khung, khĂ´ng scale cáº£ polygon */
                            const innerImageHoverOnly =
                              card.id === "summoners-era" ||
                              card.id === "overdrive-top-left" ||
                              card.id === "overdrive-top-right";
                            const introDelayMs = index * 200;
                            const introFrom =
                              index % 3 === 0
                                ? { tx: 220, ty: 90 }
                                : index % 3 === 1
                                  ? { tx: -240, ty: 140 }
                                  : { tx: 180, ty: -160 };

                            // Khi hover: áº¨n háº¿t má»i card, chá»‰ giá»¯ background
                            const hoverOpacity = !introCardsReady
                              ? 0
                              : cardBgTakeover
                                ? 0
                                : 1;
                            const hoverFilter = !introCardsReady
                              ? "blur(10px)"
                              : "blur(0px)";
                            const hoverScale = 1;
                            const hoverRotate = card.rotate;

                            return (
                              <article
                                key={card.id}
                                className={`group absolute overflow-visible shadow-[0_14px_40px_rgba(0,0,0,0.55)] ${
                                  cardBgTakeover ? "pointer-events-none" : ""
                                } ${
                                  interaction?.index === index ? "cursor-grabbing" : "cursor-grab"
                                }`}
                                style={{
                                  left: `${card.x}px`,
                                  top: `${card.y}px`,
                                  width: `${card.w}px`,
                                  height: `${card.h}px`,
                                  zIndex: isActiveHoveredCard ? 50 : (cardBgTakeover ? 10 : cardZ),
                                  opacity: hoverOpacity,
                                  filter: hoverFilter,
                                  transform: !introCardsReady
                                    ? `translate3d(${introFrom.tx}px, ${introFrom.ty}px, 0) rotate(${card.rotate - 10}deg) scale(0.92)`
                                    : `translate3d(0,0,0) rotate(${hoverRotate}deg) scale(${hoverScale})`,
                                  transitionProperty:
                                    "transform, opacity, filter",
                                  transitionDuration: !hasEntered ? "1800ms" : "450ms",
                                  transitionTimingFunction:
                                    "cubic-bezier(0.22, 1, 0.36, 1)",
                                  transitionDelay: !hasEntered ? `${introDelayMs}ms` : "0ms",
                                }}
                                onMouseEnter={() => {
                                  if (ENABLE_PORTFOLIO_HOVER_FX)
                                    setHoveredCardIndex(index);
                                }}
                                onPointerDown={(event) => {
                                  if (!ENABLE_EDITOR) return;
                                  if (lockLayout) return;
                                  if (event.button !== 0) return;
                                  setSelectedCardIndex(index);
                                  setInteraction({
                                    mode: "drag",
                                    index,
                                    startX: event.clientX,
                                    startY: event.clientY,
                                    originX: card.x,
                                    originY: card.y,
                                  });
                                }}
                              >
                                {card.id === "summoners-era" &&
                                !ENABLE_EDITOR ? (
                                  <Link
                                    href="/portfolio/summoner-era"
                                    aria-label="Open Summoner Era project detail"
                                    className="absolute inset-0 z-20 block"
                                  />
                                ) : null}
                                <div
                                  className={`relative h-full w-full origin-center ${
                                    !ENABLE_PORTFOLIO_HOVER_FX
                                      ? ""
                                      : innerImageHoverOnly
                                        ? ""
                                        : "transition-transform duration-500 ease-out will-change-transform group-hover:scale-110"
                                  }`}
                                >
                                  <div
                                    className="absolute overflow-hidden"
                                    style={{
                                      left: `-${SHAPE_PAD}px`,
                                      top: `-${SHAPE_PAD}px`,
                                      width: `calc(100% + ${SHAPE_PAD * 2}px)`,
                                      height: `calc(100% + ${SHAPE_PAD * 2}px)`,
                                      clipPath,
                                    }}
                                  >
                                    <div
                                      className="absolute inset-0"
                                      style={{
                                        transform: `rotate(${-(BOARD_CONFIG.rotate + card.rotate)}deg) scale(${card.imageScale})`,
                                        transformOrigin: "center",
                                      }}
                                    >
                                      <div
                                        className={
                                          ENABLE_PORTFOLIO_HOVER_FX &&
                                          innerImageHoverOnly
                                            ? "absolute inset-0 origin-center transition-transform duration-500 ease-out will-change-transform group-hover:scale-110"
                                            : "absolute inset-0"
                                        }
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={card.image}
                                          alt=""
                                          className={`absolute inset-0 h-full w-full ${
                                            card.imageFit === "contain"
                                              ? "object-contain"
                                              : "object-cover"
                                          } ${
                                            card.align === "top"
                                              ? "object-top"
                                              : card.align === "bottom"
                                                ? "object-bottom"
                                                : "object-center"
                                          }`}
                                          style={{
                                            transform: `translate(${card.imageOffsetX}px, ${card.imageOffsetY}px)`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                    {card.showText !== false && (
                                      <div
                                        className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-white"
                                        style={{
                                          textShadow:
                                            "0 2px 14px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.85)",
                                        }}
                                      >
                                        <p className="text-[10px] font-black uppercase tracking-[0.08em]">
                                          {card.title}
                                        </p>
                                        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.11em] text-white/90">
                                          {card.subtitle}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  {/* Black border - outside clip-path */}
                                  {card.id !== "hexagon-card" && (
                                    <svg
                                      className="pointer-events-none absolute"
                                      style={{
                                        left: `-${SHAPE_PAD}px`,
                                        top: `-${SHAPE_PAD}px`,
                                        width: `calc(100% + ${SHAPE_PAD * 2}px)`,
                                        height: `calc(100% + ${SHAPE_PAD * 2}px)`,
                                      }}
                                      preserveAspectRatio="none"
                                    >
                                      <polygon
                                        points={poly.points
                                          .map(
                                            (p) =>
                                              `${p.x + SHAPE_PAD},${p.y + SHAPE_PAD}`,
                                          )
                                          .join(" ")}
                                        fill="none"
                                        stroke="black"
                                        strokeWidth="10"
                                      />
                                    </svg>
                                  )}
                                  {ENABLE_EDITOR &&
                                    selectedCardIndex === index && (
                                      <>
                                        <button
                                          type="button"
                                          onPointerDown={(event) => {
                                            if (lockLayout) return;
                                            event.stopPropagation();
                                            setInteraction({
                                              mode: "rotate",
                                              index,
                                              startX: event.clientX,
                                              originRotate: card.rotate,
                                            });
                                          }}
                                          className="absolute left-1/2 top-[-18px] h-4 w-4 -translate-x-1/2 rounded-full border border-white bg-white/95"
                                          title="Rotate"
                                        />
                                        <button
                                          type="button"
                                          onPointerDown={(event) => {
                                            event.stopPropagation();
                                            setInteraction({
                                              mode: "imagePan",
                                              index,
                                              startX: event.clientX,
                                              startY: event.clientY,
                                              originX: card.imageOffsetX,
                                              originY: card.imageOffsetY,
                                            });
                                          }}
                                          className="absolute right-1 top-1 h-4 w-4 rounded-full border border-white bg-white/95"
                                          title="Move image inside frame"
                                        />
                                        {card.poly && card.poly.length >= 3
                                          ? poly.points.map(
                                              (p, cornerIndex) => (
                                                <button
                                                  key={`p-${cornerIndex}`}
                                                  type="button"
                                                  onPointerDown={(event) => {
                                                    if (lockLayout) return;
                                                    event.stopPropagation();
                                                    const origin = card.poly?.[
                                                      cornerIndex
                                                    ] ?? { x: p.x, y: p.y };
                                                    setInteraction({
                                                      mode: "polyCorner",
                                                      index,
                                                      cornerIndex,
                                                      startX: event.clientX,
                                                      startY: event.clientY,
                                                      originX: origin.x,
                                                      originY: origin.y,
                                                    });
                                                  }}
                                                  className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-white/95"
                                                  style={{
                                                    left: `${p.x}px`,
                                                    top: `${p.y}px`,
                                                  }}
                                                  title={`Point ${cornerIndex + 1}`}
                                                />
                                              ),
                                            )
                                          : (
                                              [
                                                {
                                                  key: "tl",
                                                  point: poly.points[0],
                                                },
                                                {
                                                  key: "tr",
                                                  point: poly.points[1],
                                                },
                                                {
                                                  key: "br",
                                                  point: poly.points[2],
                                                },
                                                {
                                                  key: "bl",
                                                  point: poly.points[3],
                                                },
                                              ] as const
                                            ).map((handle) => (
                                              <button
                                                key={handle.key}
                                                type="button"
                                                onPointerDown={(event) => {
                                                  if (lockLayout) return;
                                                  event.stopPropagation();
                                                  const cornerKey =
                                                    handle.key as CornerKey;
                                                  const originX =
                                                    cornerKey === "tl"
                                                      ? card.tlx
                                                      : cornerKey === "tr"
                                                        ? card.trx
                                                        : cornerKey === "br"
                                                          ? card.brx
                                                          : card.blx;
                                                  const originY =
                                                    cornerKey === "tl"
                                                      ? card.tly
                                                      : cornerKey === "tr"
                                                        ? card.try
                                                        : cornerKey === "br"
                                                          ? card.bry
                                                          : card.bly;
                                                  setInteraction({
                                                    mode: "corner",
                                                    index,
                                                    corner: cornerKey,
                                                    startX: event.clientX,
                                                    startY: event.clientY,
                                                    originX,
                                                    originY,
                                                  });
                                                }}
                                                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-white/95"
                                                style={{
                                                  left: `${handle.point.x}px`,
                                                  top: `${handle.point.y}px`,
                                                }}
                                                title={`Corner ${handle.key.toUpperCase()}`}
                                              />
                                            ))}
                                      </>
                                    )}
                                </div>
                              </article>
                            );
                          })(),
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Dock Overlay â€” 4 thumbnails hiá»‡n khi hover card, náº±m ngoĂ i rotated board */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex items-end justify-center pb-6"
            style={{
              transition: "opacity 450ms cubic-bezier(0.22, 1, 0.36, 1), transform 450ms cubic-bezier(0.22, 1, 0.36, 1)",
              opacity: hoveredCardIndex !== null ? 1 : 0,
              transform: hoveredCardIndex !== null ? "translateY(0px)" : "translateY(24px)",
            }}
          >
            <div className="flex items-end gap-3">
              {hoveredCardIndex !== null &&
                showcaseCards
                  .map((dockCard, dockIdx) => {
                    const isActive = dockIdx === hoveredCardIndex;
                    return (
                      <button
                        key={dockCard.id}
                        type="button"
                        className={`pointer-events-auto group/dock relative overflow-hidden rounded-lg border-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-300 ${
                          isActive 
                            ? "border-amber-400 scale-110 -translate-y-2 z-10" 
                            : "border-white/20 scale-100 hover:border-amber-400/70 hover:scale-110 hover:z-10"
                        }`}
                        style={{
                          width: 120,
                          height: 80,
                          transitionDelay: `${dockIdx * 40}ms`,
                          animation: `dockSlideIn 400ms cubic-bezier(0.34,1.56,0.64,1) ${dockIdx * 40}ms both`,
                        }}
                        onMouseEnter={() => setHoveredCardIndex(dockIdx)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={dockCard.image}
                          alt=""
                          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 ${
                            isActive ? "scale-110" : "group-hover/dock:scale-110"
                          }`}
                        />
                        <div 
                          className={`absolute inset-0 transition-opacity duration-300 ${
                            isActive ? "bg-black/0" : "bg-black/50 group-hover/dock:bg-black/20"
                          }`} 
                        />
                        {/* Sá»‘ thá»© tá»± */}
                        <span className={`absolute bottom-1 right-1.5 text-[10px] font-bold transition-colors ${
                          isActive ? "text-amber-400" : "text-white/60"
                        }`}>
                          {dockIdx + 1}
                        </span>
                      </button>
                    );
                  })}
            </div>
          </div>

          <style>{`
            @keyframes dockSlideIn {
              from { opacity: 0; transform: translateY(20px) scale(0.85); }
              to   { opacity: 1; transform: translateY(0)    scale(1);    }
            }
          `}</style>
        </div>

        {/* Selected Works Grid Section */}
        <section className="relative overflow-hidden border-t border-[#ff8c3a]/20 bg-[linear-gradient(165deg,#14151f_0%,#0e0f14_42%,#0a0a10_100%)] py-14 text-white md:py-20 lg:py-24">
          <div
            className="pointer-events-none absolute -left-24 top-0 h-[320px] w-[320px] rounded-full bg-[#ff8c3a]/08 blur-[100px]"
            aria-hidden
          />
          <div
            className="relative mx-auto"
            style={{ width: "var(--layout-width, 75%)" }}
          >
            <header>
              <div className="mb-4 flex items-center gap-4">
                <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.35)]">
                  // 02
                </span>
                <div className="h-px w-12 shrink-0 bg-linear-to-r from-[#ff8c3a]/55 to-white/12" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">
                  All Projects
                </span>
              </div>

              <h2
                className="text-left text-3xl font-black uppercase leading-[1.08] tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                Selected <AccentHighlight>Works</AccentHighlight>
              </h2>
              <p className="mt-4 max-w-xl text-left text-sm leading-relaxed text-white/65 md:text-base">
                Featured game art projects from TD Games â€” 2D Art, Animation, Concept Art, and Environment Design.
              </p>
            </header>

            <div className="mt-10 md:mt-12">
              <PortfolioGridApi itemsPerPage={16} />
            </div>
          </div>
        </section>

        <PortfolioLowerSections />
      </main>
    </>
  );
}
