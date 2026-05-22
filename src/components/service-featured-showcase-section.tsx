"use client";

import { motion, useReducedMotion } from "framer-motion";

import { AccentHighlight } from "@/components/accent-highlight";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
import {
  type StudioServiceCard,
  StudioServiceCardsGrid,
} from "@/components/studio-service-cards";

export type ServiceFeaturedShowcaseSectionProps = {
  id: string;
  sectionStep: string;
  railLabel: string;
  titleAccent: string;
  description: string;
  cards: StudioServiceCard[];
};

export default function ServiceFeaturedShowcaseSection({
  id,
  sectionStep,
  railLabel,
  titleAccent,
  description,
  cards,
}: ServiceFeaturedShowcaseSectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id={id}
      className="snap-start border-t border-[#252525] bg-[linear-gradient(180deg,#171717_0%,#101010_100%)] pt-10 pb-20 text-white lg:pt-14 lg:pb-24"
    >
      <div
        className="mx-auto"
        style={{ width: "min(var(--layout-width, 85%), 1240px)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25, margin: "0px 0px -32px 0px" }}
          transition={{
            duration: reduceMotion ? 0.2 : 0.58,
            ease: EASE_OUT,
          }}
          className="mb-8 md:mb-10"
        >
          <div className="text-center">
            <div className="mb-3 flex items-center justify-center gap-4">
              <span className="text-sm font-black italic tracking-tighter text-[#ff8c3a]">
                {sectionStep}
              </span>
              <div className="h-px w-10 shrink-0 bg-white/10" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
                {railLabel}
              </span>
            </div>
            <h2
              className="text-4xl font-black uppercase tracking-tight text-white md:text-5xl lg:text-7xl"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              FEATURED <AccentHighlight>{titleAccent}</AccentHighlight>
            </h2>
            <p
              className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/70 opacity-70"
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              {description}
            </p>
          </div>
        </motion.div>
        <StudioServiceCardsGrid items={cards} />
      </div>
    </section>
  );
}
