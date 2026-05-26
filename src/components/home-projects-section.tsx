"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

import { AccentHighlight } from "./accent-highlight";
import siteContent from "@/content/site.json";

const ACCENT = "var(--hero-btn-bg, #f59e0b)";

const featuredProjects = siteContent.home.featuredProjects;
const projects = featuredProjects.slice(0, 9);

const basePositions: Array<{ col: number; row: number }> = [
  { col: 1, row: 1 },
  { col: 3, row: 1 },
  { col: 4, row: 1 },
  { col: 3, row: 2 },
  { col: 4, row: 2 },
  { col: 1, row: 3 },
  { col: 2, row: 3 },
  { col: 3, row: 3 },
  { col: 4, row: 3 },
];

const COL_START = [
  "",
  "lg:col-start-1",
  "lg:col-start-2",
  "lg:col-start-3",
  "lg:col-start-4",
] as const;
const ROW_START = [
  "",
  "lg:row-start-1",
  "lg:row-start-2",
  "lg:row-start-3",
] as const;
const COL_SPAN = ["", "lg:col-span-1", "lg:col-span-2"] as const;
const ROW_SPAN = ["", "lg:row-span-1", "lg:row-span-2"] as const;

function gridClass(opts: {
  colStart: 1 | 2 | 3 | 4;
  rowStart: 1 | 2 | 3;
  colSpan: 1 | 2;
  rowSpan: 1 | 2;
}) {
  return `${COL_START[opts.colStart]} ${ROW_START[opts.rowStart]} ${COL_SPAN[opts.colSpan]} ${ROW_SPAN[opts.rowSpan]}`;
}

function getGridLayoutForActive(activeIndex: number): string[] {
  const safeActive = Math.max(0, Math.min(8, activeIndex));
  const origin = basePositions[safeActive] ?? basePositions[0];

  const bigColStart = origin.col >= 4 ? 3 : origin.col;
  const bigRowStart = origin.row >= 3 ? 2 : 1;

  const bigCells = new Set<string>();
  for (let r = bigRowStart; r <= bigRowStart + 1; r++) {
    for (let c = bigColStart; c <= bigColStart + 1; c++) {
      bigCells.add(`${r}-${c}`);
    }
  }

  const availableCells: Array<{ row: number; col: number }> = [];
  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= 4; c++) {
      if (!bigCells.has(`${r}-${c}`)) availableCells.push({ row: r, col: c });
    }
  }

  const classes = new Array<string>(9);
  classes[safeActive] = gridClass({
    colStart: bigColStart as 1 | 2 | 3,
    rowStart: bigRowStart as 1 | 2,
    colSpan: 2,
    rowSpan: 2,
  });

  let cellIdx = 0;
  for (let i = 0; i < 9; i++) {
    if (i === safeActive) continue;
    const cell = availableCells[cellIdx++];
    classes[i] = gridClass({
      colStart: cell.col as 1 | 2 | 3 | 4,
      rowStart: cell.row as 1 | 2 | 3,
      colSpan: 1,
      rowSpan: 1,
    });
  }

  return classes;
}

function ProjectsStudioIntro() {
  const accentStyle = { color: ACCENT };
  const title = "OUR PROJECTS";
  const highlight = "PROJECTS";
  const parts = title.split(highlight);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mb-12 md:mb-16"
    >
      <div className="text-center">
        <div className="mb-3 flex items-center justify-center gap-4">
          <span
            className="text-sm font-black italic tracking-tighter"
            style={accentStyle}
          >
            // 02
          </span>
          <div className="h-px w-10 bg-white/10" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
            Portfolio
          </span>
        </div>
        <h2
          className="text-4xl font-black uppercase tracking-tight text-white md:text-5xl lg:text-7xl"
          style={{ fontFamily: "var(--font-rajdhani)" }}
        >
          {parts.length === 2 ? (
            <>
              {parts[0]}
              <AccentHighlight>{highlight}</AccentHighlight>
              {parts[1]}
            </>
          ) : (
            title
          )}
        </h2>
        <p
          className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70 opacity-70"
          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
        >
          We create immersive 2D animation, stunning game art, and eye-catching
          VFX that bring ideas to life and captivate players.
        </p>
      </div>
    </motion.div>
  );
}

export default function HomeProjectsSection() {
  const [activeProject, setActiveProject] = useState(0);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverLockUntilRef = useRef(0);

  const handleProjectHover = (index: number) => {
    if (index === activeProject) return;
    if (Date.now() < hoverLockUntilRef.current) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    hoverTimeoutRef.current = setTimeout(() => {
      setActiveProject(index);
      hoverLockUntilRef.current = Date.now() + 420;
    }, 120);
  };

  const clearHoverIntent = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  return (
    <motion.section
      id="portfolio"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="snap-start relative overflow-hidden border-t border-[#252525] bg-[#0d0d12] py-20 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_50%,rgba(57,45,138,0.22),transparent_40%)]" />
      <div
        className="pointer-events-none absolute right-[10.5%] top-[17%] h-[128px] w-[128px] opacity-42"
        aria-hidden
      >
        <Image
          src="https://cdn.tdgamestudio.com/landing/images/scribble.png"
          alt=""
          fill
          className="object-contain"
          sizes="170px"
          style={{
            filter:
              "invert(62%) sepia(73%) saturate(782%) hue-rotate(342deg) brightness(101%) contrast(103%) drop-shadow(0 0 14px rgba(255,140,58,0.22))",
            transform: "rotate(90deg) scale(0.98)",
          }}
        />
      </div>

      <svg
        className="pointer-events-none absolute bottom-[10%] right-[4%] h-24 w-56 opacity-55"
        viewBox="0 0 280 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient
            id="tdgScribblePurple"
            x1="0"
            y1="0"
            x2="280"
            y2="120"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#7b6dff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#b7a8ff" stopOpacity="0.85" />
          </linearGradient>
          <filter
            id="tdgGlowPurple"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0.55 0 0 0 0  0 0.45 0 0 0  0 0 1 0 0  0 0 0 1 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#tdgGlowPurple)">
          <path
            d="M22 78C52 66 88 58 126 54C168 49 206 44 252 34"
            stroke="url(#tdgScribblePurple)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M168 49C190 53 214 62 236 74"
            stroke="url(#tdgScribblePurple)"
            strokeWidth="2.1"
            strokeLinecap="round"
            opacity="0.65"
          />
          <path
            d="M24 84C64 70 102 62 142 56C186 49 222 45 258 36"
            stroke="#e9e5ff"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.22"
          />
        </g>
      </svg>

      <div
        className="relative z-10 mx-auto"
        style={{ width: "min(var(--layout-width, 85%), 1240px)" }}
      >
        <ProjectsStudioIntro />

        <div
          className="grid auto-rows-[156px] grid-flow-dense gap-3 md:auto-rows-[220px] lg:grid-cols-4 lg:auto-rows-[190px]"
          onPointerLeave={clearHoverIntent}
        >
          {projects.map((project, index) => {
            const isActive = index === activeProject;
            const layoutClass = getGridLayoutForActive(activeProject)[index];

            return (
              <motion.article
                key={`${project.title}-${index}`}
                layout
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 135,
                    damping: 24,
                    mass: 0.9,
                  },
                  delay: index * 0.05,
                  duration: 0.25,
                  ease: "easeOut",
                }}
                onPointerEnter={() => handleProjectHover(index)}
                whileHover={{ y: -3 }}
                animate={{ opacity: isActive ? 1 : 0.72 }}
                className={`group relative overflow-hidden rounded-xl border bg-[#1a1a1a] ${
                  isActive
                    ? "border-[#ff8c3a]/85 shadow-[0_0_0_1px_rgba(255,140,58,0.5),0_24px_80px_rgba(0,0,0,0.6),0_0_90px_rgba(255,140,58,0.28)]"
                    : "border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
                } ${layoutClass}`}
                style={{ zIndex: isActive ? 30 : 10 }}
              >
                {isActive && (
                  <>
                    <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[28px] bg-[#ff8c3a]/28 blur-[52px]" />
                    <div className="pointer-events-none absolute inset-0 z-10 rounded-xl ring-1 ring-[#ffb25b]/70 shadow-[inset_0_0_0_1px_rgba(255,140,58,0.55)]" />
                    <div className="pointer-events-none absolute -inset-2 -z-10 rounded-[18px] bg-[radial-gradient(circle_at_22%_18%,rgba(255,180,82,0.45),transparent_58%)]" />
                  </>
                )}
                <div className="relative h-full min-h-[156px] lg:min-h-full">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  {isActive && (
                    <div className="absolute left-6 top-6">
                      <span
                        className="inline-block rounded-sm px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-black"
                        style={{ backgroundColor: ACCENT }}
                      >
                        Featured Project
                      </span>
                    </div>
                  )}
                  <div
                    className={
                      isActive
                        ? "absolute bottom-0 left-0 right-0 p-8"
                        : "absolute bottom-0 left-0 right-0 p-4"
                    }
                  >
                    <p
                      className={`${isActive ? "mb-1 text-[10px]" : "mb-1 text-[9px]"} font-bold uppercase tracking-[0.15em]`}
                      style={{ color: ACCENT }}
                    >
                      {project.category.toUpperCase()}
                    </p>
                    <h3
                      className={`${isActive ? "mb-2 text-4xl" : "mb-1 text-lg"} font-bold leading-tight text-white`}
                      style={{ fontFamily: "var(--font-rajdhani)" }}
                    >
                      {project.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          isActive
                            ? "text-xs text-[#9a9aaa]"
                            : "text-[10px] text-[#9a9aaa]"
                        }
                      >
                        2024 • {project.category}
                      </span>
                      {isActive ? (
                        <Link
                          href={`/portfolio/${project.slug}`}
                          className="rounded-md border bg-black/45 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white transition-all hover:text-black"
                          style={{
                            borderColor:
                              "color-mix(in srgb, var(--hero-btn-bg, #f59e0b) 60%, transparent)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "var(--hero-btn-bg, #f59e0b)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "";
                          }}
                        >
                          View Project
                        </Link>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8d8d9d]">
                          Demo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
