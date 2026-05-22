"use client";

import { useState, useEffect, useLayoutEffect } from "react";

type HeroMode = "studio" | "cyber";
type QuoteStyle = "amber-clip" | "white-round" | "outline-amber" | "glow-pulse";

const HERO_MODE_EVENT = "hero-mode-change";
const QUOTE_STYLE_EVENT = "quote-style-change";
const CARD_ROTATE_EVENT = "card-rotate-change";
const CARD_SPACING_EVENT = "card-spacing-change";
const CARD_MODE_EVENT = "card-mode-change";
const LAYOUT_MODE_EVENT = "layout-mode-change";
const MEDIA_LIST_EVENT = "media-list-change";
const SERVICES_TEMPLATE_EVENT = "services-template-change";
const PROJECTS_TEMPLATE_EVENT = "projects-template-change";

export type CardMode = "classic" | "fancy" | "image" | "ornate";
export type LayoutMode = "fan" | "row";
export type ServicesTemplate = "v1" | "v2";
export type ProjectsTemplate = "v1" | "v2";

export type MediaItem = {
  id: string;
  name: string;
  label: string;
  thumbnail: string;
  thumbnailIsVideo?: boolean;
  path: string;
  isBgVideo?: boolean;
  isIframe?: boolean;
};

export const defaultMediaList: MediaItem[] = [
  {
    id: "1",
    name: "MALEFICA",
    label: "Skin 2 â€” I",
    thumbnail: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/video/CutScene_SE/1big.gif",
    path: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/video/CutScene_SE/video1.mp4",
    isBgVideo: true,
    isIframe: false,
  },
  {
    id: "2",
    name: "VESTA",
    label: "Skin 2 â€” III",
    thumbnail: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/video/CutScene_SE/2big.gif",
    path: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/video/CutScene_SE/video_summoner_3_skill_1_skin_2.mp4",
    isBgVideo: true,
    isIframe: false,
  },
  {
    id: "3",
    name: "FABER",
    label: "Skin 2 â€” IV",
    thumbnail: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/video/CutScene_SE/3big.gif",
    path: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/video/CutScene_SE/video_summoner_4_skill_1_skin_2.mp4",
    isBgVideo: true,
    isIframe: false,
  },
  {
    id: "4",
    name: "BIGBY",
    label: "Long Arm",
    thumbnail: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/video/CutScene_SE/4.png",
    path: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/video/Super_Move/BIGBY-Long Arm of the Law_Closed.mp4",
    isBgVideo: true,
    isIframe: false,
  },
  {
    id: "5",
    name: "???",
    label: "On Your Knees",
    thumbnail: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/video/CutScene_SE/5.png",
    path: "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/video/Super_Move/On_Your_Knees.mp4",
    isBgVideo: true,
    isIframe: false,
  },
];

export function useMediaListListener(): MediaItem[] {
  const [list, setList] = useState<MediaItem[]>(defaultMediaList);
  useEffect(() => {
    const handler = (e: Event) =>
      setList((e as CustomEvent<MediaItem[]>).detail);
    window.addEventListener(MEDIA_LIST_EVENT, handler);
    return () => window.removeEventListener(MEDIA_LIST_EVENT, handler);
  }, []);
  return list;
}

export function useServicesTemplateListener(
  initial: ServicesTemplate = "v2",
): ServicesTemplate {
  const [template, setTemplate] = useState<ServicesTemplate>(initial);
  useEffect(() => {
    const handler = (e: Event) =>
      setTemplate((e as CustomEvent<ServicesTemplate>).detail);
    window.addEventListener(SERVICES_TEMPLATE_EVENT, handler);
    return () => window.removeEventListener(SERVICES_TEMPLATE_EVENT, handler);
  }, []);
  return template;
}

export function useProjectsTemplateListener(
  initial: ProjectsTemplate = "v2",
): ProjectsTemplate {
  const [template, setTemplate] = useState<ProjectsTemplate>(initial);
  useEffect(() => {
    const handler = (e: Event) =>
      setTemplate((e as CustomEvent<ProjectsTemplate>).detail);
    window.addEventListener(PROJECTS_TEMPLATE_EVENT, handler);
    return () => window.removeEventListener(PROJECTS_TEMPLATE_EVENT, handler);
  }, []);
  return template;
}

export function useLayoutModeListener(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>("fan");
  useEffect(() => {
    const handler = (e: Event) =>
      setMode((e as CustomEvent<LayoutMode>).detail);
    window.addEventListener(LAYOUT_MODE_EVENT, handler);
    return () => window.removeEventListener(LAYOUT_MODE_EVENT, handler);
  }, []);
  return mode;
}

export function useCardModeListener(): CardMode {
  const [mode, setMode] = useState<CardMode>("ornate");
  useEffect(() => {
    const handler = (e: Event) => setMode((e as CustomEvent<CardMode>).detail);
    window.addEventListener(CARD_MODE_EVENT, handler);
    return () => window.removeEventListener(CARD_MODE_EVENT, handler);
  }, []);
  return mode;
}

export function useHeroModeListener(): HeroMode {
  const [mode, setMode] = useState<HeroMode>("cyber");
  useEffect(() => {
    const handler = (e: Event) => setMode((e as CustomEvent<HeroMode>).detail);
    window.addEventListener(HERO_MODE_EVENT, handler);
    return () => window.removeEventListener(HERO_MODE_EVENT, handler);
  }, []);
  return mode;
}

export function useQuoteStyleListener(): QuoteStyle {
  const [style, setStyle] = useState<QuoteStyle>("glow-pulse");
  useEffect(() => {
    const handler = (e: Event) =>
      setStyle((e as CustomEvent<QuoteStyle>).detail);
    window.addEventListener(QUOTE_STYLE_EVENT, handler);
    return () => window.removeEventListener(QUOTE_STYLE_EVENT, handler);
  }, []);
  return style;
}

export function useCardRotateListener(): number {
  const [val, setVal] = useState(10);
  useEffect(() => {
    const handler = (e: Event) => setVal((e as CustomEvent<number>).detail);
    window.addEventListener(CARD_ROTATE_EVENT, handler);
    return () => window.removeEventListener(CARD_ROTATE_EVENT, handler);
  }, []);
  return val;
}

export function useCardSpacingListener(): number {
  const [val, setVal] = useState(48);
  useEffect(() => {
    const handler = (e: Event) => setVal((e as CustomEvent<number>).detail);
    window.addEventListener(CARD_SPACING_EVENT, handler);
    return () => window.removeEventListener(CARD_SPACING_EVENT, handler);
  }, []);
  return val;
}

const CARD_SIZE_EVENT = "card-size-change";
const BG_OVERLAY_EVENT = "bg-overlay-change";
const CARD_DIM_EVENT = "card-dim-change";
const CARD_VIGNETTE_EVENT = "card-vignette-change";

export function useCardSizeListener(): number {
  const [val, setVal] = useState(0.7);
  useEffect(() => {
    const handler = (e: Event) => setVal((e as CustomEvent<number>).detail);
    window.addEventListener(CARD_SIZE_EVENT, handler);
    return () => window.removeEventListener(CARD_SIZE_EVENT, handler);
  }, []);
  return val;
}

export function useBgOverlayListener(): number {
  const [val, setVal] = useState(25);
  useEffect(() => {
    const handler = (e: Event) => setVal((e as CustomEvent<number>).detail);
    window.addEventListener(BG_OVERLAY_EVENT, handler);
    return () => window.removeEventListener(BG_OVERLAY_EVENT, handler);
  }, []);
  return val;
}

export function useCardDimListener(): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const handler = (e: Event) => setVal((e as CustomEvent<number>).detail);
    window.addEventListener(CARD_DIM_EVENT, handler);
    return () => window.removeEventListener(CARD_DIM_EVENT, handler);
  }, []);
  return val;
}

export function useCardVignetteListener(): boolean {
  const [val, setVal] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => setVal((e as CustomEvent<boolean>).detail);
    window.addEventListener(CARD_VIGNETTE_EVENT, handler);
    return () => window.removeEventListener(CARD_VIGNETTE_EVENT, handler);
  }, []);
  return val;
}

/** Applies :root hero CSS variables and syncs layout/card listeners on first paint. */
export function HeroRootStyles() {
  useLayoutEffect(() => {
    const r = document.documentElement.style;
    const widthPct = 76;
    const textY = 8;
    const cardsX = 96;
    const cardsY = -120;
    const cardSize = 70;
    const cardRotate = 10;
    const cardSpacing = 48;
    const titleSize = 92;
    const titleColor = "#ffffff";
    const highlightColor = "#f59e0b";
    const subtitleSize = 16;
    const subtitleColor = "#f59e0b";
    const descSize = 18;
    const descColor = "#ffffff";
    const btnColor = "#f59e0b";

    r.setProperty("--layout-width", `${widthPct}%`);
    r.setProperty("--hero-text-y", `${textY}px`);
    r.setProperty("--hero-cards-x", `${cardsX}px`);
    r.setProperty("--hero-cards-y", `${cardsY}px`);
    r.setProperty("--hero-card-size", `${cardSize / 100}`);
    r.setProperty("--hero-card-rotate", `${cardRotate}`);
    r.setProperty("--hero-card-spacing", `${cardSpacing}`);
    r.setProperty("--hero-title-size", `${titleSize}px`);
    r.setProperty("--hero-title-color", titleColor);
    r.setProperty("--hero-highlight-color", highlightColor);
    r.setProperty("--hero-subtitle-size", `${subtitleSize}px`);
    r.setProperty("--hero-subtitle-color", subtitleColor);
    r.setProperty("--hero-desc-size", `${descSize}px`);
    r.setProperty("--hero-desc-color", descColor);
    r.setProperty("--hero-btn-bg", btnColor);

    const cardSizeDetail = cardSize / 100;
    window.dispatchEvent(
      new CustomEvent(CARD_SIZE_EVENT, { detail: cardSizeDetail }),
    );
    window.dispatchEvent(new CustomEvent(BG_OVERLAY_EVENT, { detail: 25 }));
    window.dispatchEvent(
      new CustomEvent(CARD_ROTATE_EVENT, { detail: cardRotate }),
    );
    window.dispatchEvent(
      new CustomEvent(CARD_SPACING_EVENT, { detail: cardSpacing }),
    );
    window.dispatchEvent(new CustomEvent(CARD_DIM_EVENT, { detail: 0 }));
    window.dispatchEvent(
      new CustomEvent(CARD_VIGNETTE_EVENT, { detail: false }),
    );
    window.dispatchEvent(
      new CustomEvent(CARD_MODE_EVENT, { detail: "ornate" }),
    );
    window.dispatchEvent(
      new CustomEvent(LAYOUT_MODE_EVENT, { detail: "fan" }),
    );
    window.dispatchEvent(
      new CustomEvent(QUOTE_STYLE_EVENT, { detail: "glow-pulse" }),
    );
    window.dispatchEvent(
      new CustomEvent(HERO_MODE_EVENT, { detail: "cyber" }),
    );
    window.dispatchEvent(
      new CustomEvent(SERVICES_TEMPLATE_EVENT, { detail: "v2" }),
    );
    window.dispatchEvent(
      new CustomEvent(PROJECTS_TEMPLATE_EVENT, { detail: "v2" }),
    );
  }, []);

  return null;
}
