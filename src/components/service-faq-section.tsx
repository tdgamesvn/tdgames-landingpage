"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { AccentHighlight } from "@/components/accent-highlight";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_SOFT = [0.33, 1, 0.68, 1] as const;

export type ServiceFaqItem = {
  question: string;
  answer: string;
};

export type ServiceFaqSectionProps = {
  id: string;
  sectionStep: string;
  intro: string;
  items: ServiceFaqItem[];
};

export default function ServiceFaqSection({
  id,
  sectionStep,
  intro,
  items,
}: ServiceFaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number>(0);
  const reduceMotion = useReducedMotion();

  const openDuration = reduceMotion ? 0.12 : 0.55;
  const contentDuration = reduceMotion ? 0.1 : 0.45;
  const contentDelay = reduceMotion ? 0 : 0.1;
  const stagger = reduceMotion ? 0 : 0.08;

  return (
    <section
      id={id}
      className="relative overflow-hidden border-t border-[#ff8c3a]/20 bg-[linear-gradient(165deg,#14151f_0%,#0e0f14_42%,#0a0a10_100%)] py-14 text-white md:py-20 lg:py-24"
    >
      <div
        className="pointer-events-none absolute -left-24 top-0 h-[320px] w-[320px] rounded-full bg-[#ff8c3a]/08 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-[280px] w-[200px] bg-[linear-gradient(180deg,transparent_0%,rgba(245,158,11,0.06)_40%,rgba(255,140,58,0.12)_100%)] blur-sm md:w-[240px]"
        aria-hidden
      />

      <div
        className="relative mx-auto"
        style={{ width: "var(--layout-width, 75%)" }}
      >
        <motion.header
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{
            duration: reduceMotion ? 0.2 : 0.62,
            ease: EASE_OUT,
          }}
        >
          <div className="mb-4 flex items-center gap-4">
            <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.35)]">
              {sectionStep}
            </span>
            <div className="h-px w-12 shrink-0 bg-linear-to-r from-[#ff8c3a]/55 to-white/12" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">
              FAQ
            </span>
          </div>

          <h2
            className="text-left text-3xl font-black uppercase leading-[1.08] tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            Frequently asked <AccentHighlight>Questions</AccentHighlight>
          </h2>
          <p className="mt-4 max-w-xl text-left text-sm leading-relaxed text-white/65 md:text-base">
            {intro}
          </p>
        </motion.header>

        <ul className="mt-10 space-y-3 md:mt-12 md:space-y-3.5">
          {items.map((item, index) => {
            const open = openIndex === index;
            const panelId = `${id}-faq-panel-${index}`;
            const buttonId = `${id}-faq-trigger-${index}`;

            return (
              <motion.li
                key={item.question}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
                transition={{
                  duration: reduceMotion ? 0.15 : 0.52,
                  delay: stagger * index,
                  ease: EASE_OUT,
                }}
                className={`overflow-hidden rounded-2xl border bg-[#16171f]/95 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-[border-color,box-shadow] duration-500 ease-out hover:border-[#ff8c3a]/25 hover:shadow-[0_16px_44px_rgba(0,0,0,0.42),0_0_0_1px_rgba(255,140,58,0.06)] ${
                  open
                    ? "border-[#ff8c3a]/35 shadow-[0_0_28px_rgba(255,140,58,0.08)]"
                    : "border-white/12"
                }`}
              >
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? -1 : index)}
                  className="flex w-full items-start gap-4 px-5 py-4 text-left md:px-6 md:py-5"
                >
                  <span
                    className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-white md:text-base"
                    style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}
                  >
                    {item.question}
                  </span>
                  <motion.span
                    initial={false}
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{
                      duration: reduceMotion ? 0.12 : 0.48,
                      ease: EASE_SOFT,
                    }}
                    className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/5 text-white/80 ${
                      open
                        ? "border-[#ff8c3a]/35 bg-[#ff8c3a]/10 text-[#ffcc8e]"
                        : ""
                    }`}
                    aria-hidden
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </motion.span>
                </button>
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  aria-hidden={!open}
                  initial={false}
                  animate={{
                    height: open ? "auto" : 0,
                  }}
                  transition={{
                    height: {
                      duration: openDuration,
                      ease: EASE_OUT,
                    },
                  }}
                  style={{ overflow: "hidden" }}
                >
                  <motion.div
                    initial={false}
                    animate={
                      open
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: -6 }
                    }
                    transition={{
                      duration: contentDuration,
                      delay: open ? contentDelay : 0,
                      ease: EASE_SOFT,
                    }}
                    className="relative border-t border-white/12 px-5 pb-5 pt-0 md:px-6 md:pb-6"
                  >
                    <span
                      className="pointer-events-none absolute left-5 top-0 h-px w-24 bg-linear-to-r from-[#ff8c3a]/50 to-transparent md:left-6"
                      aria-hidden
                    />
                    <p
                      className="pt-4 text-[13px] leading-7 text-white/78 md:text-[14px] md:leading-8"
                      style={{
                        fontFamily: "var(--font-geist-sans), sans-serif",
                      }}
                    >
                      {item.answer}
                    </p>
                  </motion.div>
                </motion.div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
