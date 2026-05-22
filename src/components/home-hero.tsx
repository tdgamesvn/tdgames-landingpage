"use client";

import Link from "next/link";
import { Changa_One, Nunito_Sans } from "next/font/google";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import type React from "react";
import {
  useCardRotateListener,
  useCardSpacingListener,
  useCardSizeListener,
  useCardDimListener,
  useCardVignetteListener,
  useCardModeListener,
  useLayoutModeListener,
  useMediaListListener,
  useBgOverlayListener,
  type MediaItem,
} from "./hero-layout-state";

const changaOne = Changa_One({ weight: '400', subsets: ['latin'] });
const nunitoSans = Nunito_Sans({ weight: ['400', '600', '700'], subsets: ['latin'] });

function isProbablyVideoSrc(src: unknown) {
  if (typeof src !== "string") return false;
  const lower = src.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.startsWith("blob:");
}

// --- 1. CLASSIC THUMBNAIL CARD ---
function ClassicThumbnailCard({ video, isActive, onClick, index, cardDim, cardVignette }: any) {
  return (
    <motion.button
      onClick={onClick}
      className="group relative flex-shrink-0 w-64 h-[400px] outline-none"
      initial={false}
      animate={{ scale: isActive ? 1 : 0.88 }}
      whileHover={{ scale: isActive ? 1 : 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
      style={{ transform: "skewY(-4deg)" }}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "polygon(25% 0%, 100% 0%, 100% 96%, 75% 100%, 0% 100%, 0% 4%)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {video?.thumbnailIsVideo || isProbablyVideoSrc(video?.thumbnail) ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={video.thumbnail}
            muted
            playsInline
            loop
            autoPlay
          />
        ) : (
          <img
            src={video.thumbnail}
            alt={video.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className={`absolute inset-0 transition-all duration-300 ${isActive ? "bg-black/8" : ""}`} style={!isActive ? { backgroundColor: `rgba(0,0,0,${cardDim / 100})` } : {}} />
        {isActive && <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none animate-[scan_3s_linear_infinite]" />}
        {isActive && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-amber-900/35 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-amber-400/5" />
          </>
        )}
        {cardVignette && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        )}

        {isActive && (
          <div className="absolute top-3 right-4 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
        )}

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/50 border border-amber-400/70 backdrop-blur-sm">
              <svg className="w-4 h-4 text-amber-400 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        )}

        <div className="absolute top-3 left-4 flex items-center gap-2">
          <div className="flex flex-col gap-0.5"><div className="w-px h-2 bg-amber-400/70" /><div className="w-px h-1 bg-amber-400/40" /></div>
          <span className={`text-[11px] font-black tracking-[0.22em] transition-colors duration-200 ${isActive ? "text-amber-400" : "text-white/28 group-hover:text-white/65"}`} style={{ fontFamily: "var(--font-rajdhani)" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {isActive && (
          <div className="absolute top-3 right-4 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
        )}

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/50 border border-amber-400/70 backdrop-blur-sm">
              <svg className="w-4 h-4 text-amber-400 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 text-left">
          <div className={`text-base font-black tracking-wide leading-tight transition-colors duration-200 ${isActive ? "text-white" : "text-white/78 group-hover:text-white"}`} style={{ fontFamily: "var(--font-rajdhani)" }}>{video.name}</div>
          <div className={`text-[11px] font-bold tracking-[0.15em] uppercase mt-0.5 transition-colors duration-200 ${isActive ? "text-amber-400" : "text-white/32 group-hover:text-amber-400/85"}`} style={{ fontFamily: "var(--font-rajdhani)" }}>{video.label}</div>
        </div>
      </div>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 25 0 L 100 0 L 100 96 L 75 100 L 0 100 L 0 4 Z" fill="none" stroke={isActive ? "#fbbf24" : "rgba(255,255,255,0.12)"} strokeWidth={isActive ? "1.5" : "0.8"} vectorEffect="non-scaling-stroke" className="transition-all duration-300 group-hover:stroke-amber-400/55" style={isActive ? { filter: "drop-shadow(0 0 4px rgba(251,191,36,0.7))" } : {}} />
      </svg>
      {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 shadow-[0_0_16px_6px_rgba(251,191,36,0.6)]" />}
    </motion.button>
  );
}

// --- 2. FANTASY THUMBNAIL CARD (NOTCHED / COOKIE STYLE) ---
function FancyThumbnailCard({ video, isActive, onClick, index, cardDim, cardVignette }: any) {
  return (
    <motion.button
      onClick={onClick}
      className={`group relative flex-shrink-0 w-64 h-[400px] outline-none transition-all duration-300`}
      initial={false}
      animate={{ scale: isActive ? 1.05 : 0.95 }}
      whileHover={{ scale: isActive ? 1.05 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
    >
      <div className={`absolute inset-0 bg-[#0C0805] border-[3px] border-[#2A1B12] transition-shadow duration-300 ${isActive ? 'shadow-[0_0_25px_rgba(245,158,11,0.6)]' : 'shadow-xl'}`}>
        <div className="absolute inset-[3px] border border-amber-600/40 pointer-events-none z-10" />
        <div className="absolute inset-[6px] overflow-hidden bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {video?.thumbnailIsVideo || isProbablyVideoSrc(video?.thumbnail) ? (
            <video
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              src={video.thumbnail}
              muted
              playsInline
              loop
              autoPlay
            />
          ) : (
            <img
              src={video.thumbnail}
              alt={video.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          )}
          <div className={`absolute inset-0 transition-colors duration-300 ${isActive ? 'bg-black/0' : ''}`} style={!isActive ? { backgroundColor: `rgba(0,0,0,${cardDim / 100})` } : {}} />
          {cardVignette && <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/95 via-black/80 to-transparent" />}
        </div>

        <div className="absolute bottom-5 left-0 right-0 px-2 flex flex-col items-center text-center z-30">
          <h4 className={`text-[15px] font-black tracking-widest uppercase transition-colors duration-300 ${isActive ? 'text-amber-500' : 'text-white/80 group-hover:text-white'}`} style={{ fontFamily: "var(--font-rajdhani)" }}>
            {video.name}
          </h4>
          <div className={`w-8 h-px my-1.5 transition-colors duration-300 ${isActive ? 'bg-amber-500' : 'bg-white/20'}`} />
          <p className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${isActive ? 'text-amber-200' : 'text-white/50'}`} style={{ fontFamily: "var(--font-rajdhani)" }}>
            {video.label}
          </p>
        </div>
      </div>
    </motion.button>
  );
}



// --- 4. ORNATE FANTASY CARD (FROM DEMO 3) ---
function FantasyOrnateCard({ video, isActive, onClick, index, cardDim, cardVignette }: any) {
  return (
    <motion.button
      onClick={onClick}
      className={`group relative flex-shrink-0 w-64 h-[400px] outline-none transition-all duration-300`}
      initial={false}
      animate={{ scale: isActive ? 1.05 : 0.9 }}
      whileHover={{ scale: isActive ? 1.05 : 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
    >
      {/* Thick Dark Frame */}
      <div className={`absolute inset-0 bg-[#1A1A1A] rounded-xl border-[6px] border-[#2A2118] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-visible transition-shadow duration-300 ${isActive ? 'shadow-[0_0_40px_rgba(245,158,11,0.25)]' : ''}`}>

        {/* Inner Gold Trim */}
        <div className="absolute inset-1.5 border-2 border-[#D4A373]/80 rounded-lg pointer-events-none z-10" />

        {/* Image Container */}
        <div className="absolute inset-2 rounded-lg overflow-hidden bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.thumbnail}
            alt={video.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className={`absolute inset-0 transition-colors duration-300`} style={!isActive ? { backgroundColor: `rgba(0,0,0,${cardDim / 100})` } : {}} />
          {cardVignette && <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />}
        </div>

        {/* Top Ornament Only */}
        <div className="absolute top-0 left-0 right-0 flex flex-col items-center z-20 pointer-events-none">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-3 h-3 bg-[#BF36FF] rotate-180 shadow-[0_0_10px_rgba(191,54,255,0.8)]" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#D4A373] to-transparent mt-[-2px]" />
          </div>
        </div>

        {/* 4 Corner Ornaments (Shifted inward to overlap gold trim) */}
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-[#2A2118] border-2 border-[#D4A373] rotate-45 flex items-center justify-center z-20">
          <div className="w-1 h-1 bg-[#D4A373] rounded-full" />
        </div>
        <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#2A2118] border-2 border-[#D4A373] rotate-45 flex items-center justify-center z-20">
          <div className="w-1 h-1 bg-[#D4A373] rounded-full" />
        </div>
        <div className="absolute bottom-0.5 left-0.5 w-4 h-4 bg-[#2A2118] border-2 border-[#D4A373] rotate-45 flex items-center justify-center z-20">
          <div className="w-1 h-1 bg-[#D4A373] rounded-full" />
        </div>
        <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-[#2A2118] border-2 border-[#D4A373] rotate-45 flex items-center justify-center z-20">
          <div className="w-1 h-1 bg-[#D4A373] rounded-full" />
        </div>

        {/* Number Badge at Bottom */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#1A1A1A] border-[3px] border-[#2A2118] flex items-center justify-center z-30 shadow-2xl">
          <div className="absolute inset-1 border border-[#D4A373]/40 rounded-full" />
          <span className="relative text-[12px] font-black text-[#D4A373] tracking-widest">{String(index + 1).padStart(2, "0")}</span>
        </div>
      </div>
    </motion.button>
  );
}


// --- 5. IMAGE FRAME CARD (USING PNG OVERLAY) ---
function ImageFrameThumbnailCard({ video, isActive, onClick, index, cardDim, cardVignette }: any) {
  return (
    <motion.button
      onClick={onClick}
      className={`group relative flex-shrink-0 w-64 h-[400px] outline-none transition-all duration-300`}
      initial={false}
      animate={{ scale: isActive ? 1.05 : 0.95 }}
      whileHover={{ scale: isActive ? 1.05 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
    >
      <div className={`absolute inset-0 bg-black rounded-md overflow-hidden transition-shadow duration-300 ${isActive ? 'shadow-[0_0_30px_rgba(245,158,11,0.5)]' : 'shadow-2xl'}`}>

        {/* IMAGE BACKGROUND */}
        {video?.thumbnailIsVideo || isProbablyVideoSrc(video?.thumbnail) ? (
          <video
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
            src={video.thumbnail}
            muted
            playsInline
            loop
            autoPlay
          />
        ) : (
          <img
            src={video.thumbnail}
            alt={video.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
        )}

        {/* DIM OVERLAY */}
        <div className={`absolute inset-0 transition-colors duration-300 ${isActive ? 'bg-black/0' : ''}`} style={!isActive ? { backgroundColor: `rgba(0,0,0,${cardDim / 100})` } : {}} />

        {/* VIGNETTE */}
        {cardVignette && <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/95 via-black/70 to-transparent" />}

        {/* PNG FRAME OVERLAY */}
        <img src="/frame-8ddf2d2956184175e63d2a174c4b66ad.png" alt="Frame" className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20" />

        {/* CONTENT */}
        <div className="absolute bottom-6 left-0 right-0 px-2 flex flex-col items-center text-center z-30">
          <h4 className={`text-[15px] font-black tracking-widest uppercase transition-colors duration-300 ${isActive ? 'text-amber-500' : 'text-white/80 group-hover:text-white'}`} style={{ fontFamily: "var(--font-rajdhani)" }}>
            {video.name}
          </h4>
          <div className={`w-8 h-px my-1.5 transition-colors duration-300 ${isActive ? 'bg-amber-500' : 'bg-white/20'}`} />
          <p className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${isActive ? 'text-amber-200' : 'text-white/50'}`} style={{ fontFamily: "var(--font-rajdhani)" }}>
            {video.label}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// --- 5. DRAGGABLE STACK (FAN & ROW) ---
function DraggableStack({
  currentIdx, switchVideo, cardMode, layoutMode,
  rotatePerStep, spacingPerStep, cardSizeVal, cardDim, cardVignette, mediaList
}: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const dragMoved = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const THRESHOLD = 60;
  const n = mediaList.length;

  const getBaseTransform = (i: number, activeIdx: number, dragXVal = 0) => {
    let offset = i - activeIdx;
    if (offset > Math.floor(n / 2)) offset -= n;
    if (offset < -Math.floor(n / 2)) offset += n;
    const absOffset = Math.abs(offset);
    const isActive = offset === 0;

    // Adjust parameters based on layoutMode
    const isRow = layoutMode === "row";
    // For row mode, we multiply spacing to spread them out
    const effectiveSpacing = isRow ? (spacingPerStep * 6 + 180) : spacingPerStep;
    const effectiveY = isRow ? 0 : (absOffset * 10);
    const effectiveRotate = isRow ? 0 : (offset * rotatePerStep + (isActive ? (dragXVal / 160) * -12 : 0));
    const effectiveScale = isRow
      ? (isActive ? 1.05 : 0.85)
      : (1 - absOffset * 0.08);

    return {
      x: offset * effectiveSpacing + (isActive ? dragXVal : 0),
      y: effectiveY,
      scale: effectiveScale * cardSizeVal,
      rotate: effectiveRotate,
      zIndex: isActive ? 50 : 20 - absOffset,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    dragMoved.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > 6) dragMoved.current = true;
    if (!dragMoved.current) return;
    setDragOffset(Math.max(-160, Math.min(160, delta)));
    if (containerRef.current) containerRef.current.style.cursor = "grabbing";
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    if (containerRef.current) containerRef.current.style.cursor = "grab";

    if (!dragMoved.current) {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const cardEl = target?.closest("[data-card-index]");
      if (cardEl) {
        const idx = parseInt(cardEl.getAttribute("data-card-index") || "-1");
        if (idx >= 0) switchVideo(idx);
      }
    } else if (Math.abs(delta) >= THRESHOLD) {
      if (delta < 0) switchVideo((currentIdx + 1) % n);
      if (delta > 0) switchVideo((currentIdx - 1 + n) % n);
    }

    setDragOffset(0);
    dragStartX.current = null;
    dragMoved.current = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative select-none translate-y-16"
      style={{ width: "340px", height: "320px", cursor: "grab", touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => { setDragOffset(0); dragStartX.current = null; dragMoved.current = false; }}
    >
      {[...mediaList].reverse().map((video, revI) => {
        const i = mediaList.length - 1 - revI;
        const isActive = currentIdx === i;
        const { x, y, scale, rotate, zIndex } = getBaseTransform(i, currentIdx, isActive ? dragOffset : 0);

        return (
          <motion.div
            key={video.id}
            data-card-index={i}
            className="absolute bottom-0 left-1/2"
            style={{ zIndex, transformOrigin: "bottom center" }}
            animate={{ x: `calc(-50% + ${x}px)`, y, scale, rotate }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
          >
            {cardMode === "classic" && (
              <ClassicThumbnailCard
                video={video}
                index={i}
                isActive={isActive}
                onClick={() => switchVideo(i)}
                cardDim={cardDim}
                cardVignette={cardVignette}
              />
            )}
            {cardMode === "fancy" && (
              <FancyThumbnailCard
                video={video}
                index={i}
                isActive={isActive}
                onClick={() => switchVideo(i)}
                cardDim={cardDim}
                cardVignette={cardVignette}
              />
            )}
            {cardMode === "ornate" && (
              <FantasyOrnateCard
                video={video}
                index={i}
                isActive={isActive}
                onClick={() => switchVideo(i)}
                cardDim={cardDim}
                cardVignette={cardVignette}
              />
            )}
            {cardMode === "image" && (
              <ImageFrameThumbnailCard
                video={video}
                index={i}
                isActive={isActive}
                onClick={() => switchVideo(i)}
                cardDim={cardDim}
                cardVignette={cardVignette}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// --- MAIN HERO COMPONENT ---
export default function HomeHero() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  // const { scrollYProgress } = useScroll({
  //   target: sectionRef,
  //   offset: ["start start", "end start"]
  // });

  const contentOpacity = 1;
  const contentY = 0;
  const bgScale = 1;
  const cardsOpacity = 1;
  const cardsXOffset = 0;

  // Custom listeners for the fan stack and layout
  const cardRotate = useCardRotateListener();
  const cardSpacing = useCardSpacingListener();
  const cardSizeVal = useCardSizeListener();
  const cardDim = useCardDimListener();
  const cardVignette = useCardVignetteListener();
  const cardMode = useCardModeListener();
  const layoutMode = useLayoutModeListener();
  const mediaList = useMediaListListener();
  const bgOverlay = useBgOverlayListener();

  const activeMedia = mediaList[currentIdx];

  const switchVideo = useCallback((idx: number) => {
    if (idx !== currentIdx) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIdx(idx);
        setIsTransitioning(false);
      }, 200);
    }
  }, [currentIdx]);

  useEffect(() => {
    if (bgVideoRef.current && activeMedia?.isBgVideo) {
      bgVideoRef.current.load();
      bgVideoRef.current.play().catch(() => { });
    }
  }, [currentIdx, activeMedia]);

  if (!activeMedia) return null;

  return (
    <section ref={containerRef} className={`relative min-h-screen bg-[#0a0a0a] overflow-hidden snap-start ${nunitoSans.className}`}>
      {/* Background Video or Image or Iframe */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        {activeMedia.isIframe ? (
          <iframe
            key={`bg-iframe-${activeMedia.id}-${currentIdx}`}
            className={`absolute transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            src={activeMedia.path.includes('?') ? `${activeMedia.path}&background=1&autoplay=1&loop=1&muted=1` : `${activeMedia.path}?background=1&autoplay=1&loop=1&muted=1`}
            allow="autoplay; fullscreen"
            style={{ width: '100vw', height: '56.25vw', minHeight: '100vh', minWidth: '177.77vh', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: 'none' }}
          />
        ) : activeMedia.isBgVideo ? (
          <video
            ref={bgVideoRef}
            key={`bg-vid-${activeMedia.id}-${currentIdx}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            src={activeMedia.path}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            key={`bg-img-${activeMedia.id}-${currentIdx}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            src={activeMedia.path}
            alt={activeMedia.name}
          />
        )}
        <div className="absolute inset-0 transition-opacity duration-300" style={{ backgroundColor: `rgba(0,0,0,${bgOverlay / 100})` }} />
      </div>

      {/* Main Container */}
      <motion.div
        className="relative z-10 mx-auto flex min-h-screen items-center"
        style={{ width: "var(--layout-width, 75%)", opacity: contentOpacity }}
      >
        <motion.div className="w-full" style={{ y: contentY }}>
          {/* LEFT: Text Content with Y-axis control */}
          <div className="max-w-[606px] tracking-[0.5px]" style={{ transform: "translateY(var(--hero-text-y, 0px))" }}>
            <div className="mb-[-10px] overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`leading-[1] font-black ${changaOne.className}`}
                style={{
                  fontSize: "var(--hero-title-size, 100px)",
                  color: "var(--hero-title-color, #ffffff)"
                }}
              >
                2D & 3D GAME
              </motion.div>
            </div>
            <div className="overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className={`leading-[1] font-black ${changaOne.className}`}
                style={{
                  fontSize: "var(--hero-title-size, 100px)",
                  color: "var(--hero-title-color, #ffffff)"
                }}
              >
                ART <span style={{ color: "var(--hero-highlight-color, #f59e0b)" }}>STUDIO</span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center gap-4 mt-6"
            >
              <div className="w-12 h-[2px]" style={{ backgroundColor: "var(--hero-subtitle-color, #f59e0b)" }} />
              <h3
                className="font-bold tracking-[0.3em] uppercase"
                style={{
                  fontSize: "var(--hero-subtitle-size, 16px)",
                  color: "var(--hero-subtitle-color, #f59e0b)"
                }}
              >
                Game art outsource
              </h3>
            </motion.div>
            <p
              className="max-w-[547px] leading-[1.5] mb-[15px] mt-4"
              style={{
                fontSize: "var(--hero-desc-size, 18px)",
                color: "var(--hero-desc-color, #e5e7eb)"
              }}
            >
              TD Games specializes in transforming creative ideas into vibrant art. We offer a range of services including professional game visuals, 2D stylized art, concept designs, environment art, illustrations, and 2D spine animation. Our skilled team uses advanced techniques to produce both 2D and 3D art, ensuring dynamic and interactive results.
            </p>
            <div className="mb-[15px] mt-[32px]">
              <Link
                href="#open-form"
                className="inline-block rounded-xl border-2 px-[32px] py-[16px] text-[18px] font-bold uppercase tracking-wider text-black transition-colors duration-300 hover:bg-transparent hover:text-white"
                style={{
                  backgroundColor: "var(--hero-btn-bg, #f59e0b)",
                  borderColor: "var(--hero-btn-bg, #f59e0b)",
                }}
              >
                Get in touch
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* BOTTOM RIGHT: Cards */}
      <motion.div
        className="absolute bottom-16 right-16 lg:right-32 xl:right-48 hidden lg:block z-20"
        style={{
          opacity: cardsOpacity,
          x: cardsXOffset
        }}
      >
        <div style={{ transform: "translate(var(--hero-cards-x, 0px), var(--hero-cards-y, 0px))" }}>
          <DraggableStack
            currentIdx={currentIdx}
            switchVideo={switchVideo}
            cardMode={cardMode}
            layoutMode={layoutMode}
            rotatePerStep={cardRotate}
            spacingPerStep={cardSpacing}
            cardSizeVal={cardSizeVal}
            cardDim={cardDim}
            cardVignette={cardVignette}
            mediaList={mediaList}
          />
        </div>
      </motion.div>

    </section>
  );
}