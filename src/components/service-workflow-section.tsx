"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ServiceWorkflowConfig,
  ServiceWorkflowPillarKey,
} from "@/components/service-workflow-types";

function PillarGlyph({ kind }: { kind: ServiceWorkflowPillarKey }) {
  if (kind === "palette") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16l4.5-4.5M9.5 6.5L15 12M12 4l2 2M6 20l4-4M19 7l-3 3M14 14l4 4"
        />
        <circle cx="8" cy="8" r="2" />
      </svg>
    );
  }
  if (kind === "bolt") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 4v5c0 5-3.5 9-7 10-3.5-1-7-5-7-10V7l7-4z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ArrowBetween() {
  return (
    <div
      className="hidden w-5 shrink-0 items-center justify-center self-stretch sm:flex md:w-6"
      aria-hidden
    >
      <svg
        className="h-4 w-4 text-[#ff9f1a] md:h-5 md:w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.51 4.25a.75.75 0 010 1.08l-4.51 4.25a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

export default function ServiceWorkflowSection(config: ServiceWorkflowConfig) {
  const prefersReducedMotion = useReducedMotion();
  const workflowSteps = useMemo(
    () =>
      config.steps.map((s, i) => ({
        n: i + 1,
        title: s.title,
        description: s.description,
        image: s.image,
      })),
    [config.steps],
  );

  const defaultStepIndex = Math.min(
    Math.max(0, config.defaultStepIndex),
    workflowSteps.length - 1,
  );

  const [activeIndex, setActiveIndex] = useState(defaultStepIndex);
  const active = workflowSteps[activeIndex];

  const stripReveal = useMemo(() => {
    const reduced = !!prefersReducedMotion;
    return {
      container: {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : 0.09,
            delayChildren: reduced ? 0 : 0.05,
          },
        },
      },
      segment: {
        hidden: reduced
          ? { opacity: 0 }
          : { opacity: 0, x: -52 },
        visible: {
          opacity: 1,
          x: 0,
          transition: reduced
            ? { duration: 0.12 }
            : { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const },
        },
      },
    };
  }, [prefersReducedMotion]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % workflowSteps.length);
  }, [workflowSteps.length]);

  const goPrev = useCallback(() => {
    setActiveIndex(
      (i) => (i - 1 + workflowSteps.length) % workflowSteps.length,
    );
  }, [workflowSteps.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable=true]"))
        return;
      e.preventDefault();
      if (e.key === "ArrowRight") goNext();
      else goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  return (
    <section className="w-full overflow-x-hidden border-t border-white/10 bg-[#050508] text-white lg:h-svh lg:max-h-svh lg:min-h-0 lg:overflow-hidden">
      <div className="flex h-full min-h-0 max-h-[inherit] w-full flex-col px-4 py-6 sm:px-6 md:px-8 lg:py-3 lg:pl-10 lg:pr-10 xl:px-14">
        <div className="mx-auto grid min-h-0 w-full max-w-[1920px] flex-1 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,1.25fr)_minmax(0,1fr)] lg:items-center lg:gap-x-10 lg:gap-y-6 lg:pb-3 xl:gap-x-14">
          <div className="flex min-h-0 flex-col justify-center lg:max-w-xl lg:justify-self-start">
            <div className="mb-3 flex items-center gap-4">
              <span className="text-sm font-black italic tracking-tighter text-[#ff8c3a]">
                {config.markerStep}
              </span>
              <div className="h-px w-10 shrink-0 bg-white/10" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
                {config.processLabel}
              </span>
            </div>
            <h2
              className="mt-2 text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl lg:text-[2.35rem] xl:text-[2.75rem]"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              <span className="text-white">{config.titleWhite} </span>
              <span className="text-[#ff9f1a]">{config.titleAccent}</span>
            </h2>
            <p
              className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/90 sm:text-sm"
              style={{ fontFamily: "var(--font-nunito-sans)" }}
            >
              {config.stepsSubtitle}
            </p>
            <p className="mt-2 line-clamp-3 text-[13px] leading-snug text-white/60 lg:text-[12px]">
              {config.description}
            </p>
            <div className="mt-3 lg:mt-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#ff9f1a] bg-transparent px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff9f1a] transition-colors hover:bg-[#ff9f1a]/12 sm:px-5 sm:py-2.5 sm:text-xs"
                style={{ fontFamily: "var(--font-nunito-sans)" }}
              >
                Start your project
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-lg flex-col items-stretch justify-center justify-self-center lg:mx-0 lg:h-full lg:min-h-0 lg:max-w-none">
            <div className="relative mx-auto mt-6 w-full overflow-hidden rounded-xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.45)] min-h-[260px] h-[min(420px,52vh)] sm:min-h-[300px] sm:h-[min(480px,50vh)] sm:mt-5 lg:mx-0 lg:mt-7 lg:min-h-[min(360px,38vh)] lg:h-[min(520px,42vh)] xl:mt-8 xl:h-[min(560px,44vh)]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.image + activeIndex}
                  className="absolute inset-0 z-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Image
                    src={active.image}
                    alt={`${active.title} — workflow preview`}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 90vw, min(560px, 36vw)"
                    priority={activeIndex === defaultStepIndex}
                  />
                </motion.div>
              </AnimatePresence>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/85 via-black/20 to-transparent px-3 pb-3 pt-10">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#ff9f1a]">
                  Step {active.n} of {workflowSteps.length}
                </p>
                <p
                  className="mt-0.5 text-base font-black uppercase leading-tight text-white sm:text-lg"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  {active.title}
                </p>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-white/40 lg:mt-1 lg:text-[9px]">
              Select step below or use ← → keys
            </p>
          </div>

          <ul className="flex min-h-0 flex-col justify-center gap-4 lg:max-w-xl lg:justify-self-end lg:gap-3.5">
            {config.pillars.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ff9f1a]/40 bg-[#ff9f1a]/10 text-[#ff9f1a]">
                  <PillarGlyph kind={p.icon} />
                </span>
                <div className="min-w-0">
                  <h3
                    className="text-sm font-black uppercase tracking-tight text-white lg:text-[13px]"
                    style={{ fontFamily: "var(--font-rajdhani)" }}
                  >
                    {p.title}
                  </h3>
                  <p className="mt-1 line-clamp-3 text-[12px] leading-snug text-white/58 lg:text-[11px]">
                    {p.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative left-1/2 mt-6 w-[100vw] max-w-none shrink-0 -translate-x-1/2 border-t border-white/10 bg-[#03040a]/90 pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm lg:mt-2 lg:pt-3">
          <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14">
            <motion.div
              className="mb-3 flex items-center justify-center gap-3 md:mb-3.5"
              initial={
                prefersReducedMotion ? false : { opacity: 0, x: -28 }
              }
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.9 }}
              transition={{
                duration: prefersReducedMotion ? 0.15 : 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="hidden h-px min-w-[48px] flex-1 bg-linear-to-r from-transparent to-white/25 sm:block md:max-w-[min(180px,14vw)]" />
              <p className="shrink-0 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff9f1a] md:text-[11px]">
                {config.stripTitle}
              </p>
              <div className="hidden h-px min-w-[48px] flex-1 bg-linear-to-l from-transparent to-white/25 sm:block md:max-w-[min(180px,14vw)]" />
            </motion.div>

            <motion.div
              className="flex min-h-0 w-full min-w-0 flex-nowrap items-stretch justify-between gap-0 overflow-x-auto overflow-y-visible pb-2 [scrollbar-width:thin] lg:overflow-x-hidden lg:pb-1"
              variants={stripReveal.container}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25, margin: "0px 0px -40px 0px" }}
            >
              {workflowSteps.map((step, i) => (
                <motion.div
                  key={`${step.n}-${step.title}`}
                  variants={stripReveal.segment}
                  className="flex min-w-0 flex-1 items-stretch max-lg:min-w-[148px] max-lg:max-w-[200px] max-lg:flex-none"
                >
                  <div className="flex min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setActiveIndex(i)}
                      className={`flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border bg-[#12131c] text-left shadow-[0_8px_28px_rgba(0,0,0,0.4)] transition-[border-color,box-shadow,transform] duration-200 hover:border-white/22 ${
                        i === activeIndex
                          ? "border-[#ff9f1a] shadow-[0_0_26px_rgba(255,159,26,0.28)] ring-2 ring-[#ff9f1a]/40"
                          : "border-white/14"
                      }`}
                      aria-current={i === activeIndex ? "step" : undefined}
                      aria-label={`Step ${step.n}: ${step.title}. Show this stage in the preview.`}
                    >
                      <div className="flex px-2.5 pt-2.5">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black md:h-8 md:w-8 md:text-xs ${
                            i === activeIndex
                              ? "bg-[#ff9f1a] text-black"
                              : "bg-white/14 text-white"
                          }`}
                        >
                          {step.n}
                        </span>
                      </div>
                      <div className="relative mx-2.5 mt-1.5 aspect-[5/4] min-h-[64px] overflow-hidden rounded-lg bg-black/50 sm:min-h-[72px] md:aspect-[4/3] md:min-h-[80px] lg:min-h-[88px] xl:min-h-[96px]">
                        <Image
                          src={step.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width:768px) 160px, (max-width:1280px) 140px, 180px"
                        />
                      </div>
                      <div className="flex flex-1 flex-col p-2.5 pt-2 md:p-3 md:pt-2">
                        <h4
                          className="line-clamp-2 text-[10px] font-black uppercase leading-snug tracking-wide text-white sm:text-[11px] md:text-xs lg:text-[11px] xl:text-[12px]"
                          style={{ fontFamily: "var(--font-rajdhani)" }}
                        >
                          {step.title}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-[9px] leading-snug text-white/60 sm:text-[10px] md:text-[11px] lg:text-[10px] xl:text-[11px]">
                          {step.description}
                        </p>
                      </div>
                    </button>
                  </div>
                  {i < workflowSteps.length - 1 ? <ArrowBetween /> : null}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
