"use client";

import { motion } from "framer-motion";

import { AccentHighlight } from "./accent-highlight";
import {
  STUDIO_SERVICE_ACCENT,
  StudioServiceCardsGrid,
  studioServiceCards,
} from "./studio-service-cards";

function ServicesStudioIntro() {
  const accentStyle = { color: STUDIO_SERVICE_ACCENT };
  const title = "OUR SERVICES";
  const highlight = "SERVICES";
  const parts = title.split(highlight);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mb-8 md:mb-10"
    >
      <div className="text-center">
        <div className="mb-3 flex items-center justify-center gap-4">
          <span
            className="text-sm font-black italic tracking-tighter"
            style={accentStyle}
          >
            // 01
          </span>
          <div className="h-px w-10 bg-white/10" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
            Capabilities
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
          This version keeps the brand energy but removes the hard AAA pressure.
          The layout follows a studio portfolio rhythm aligned with TD Games.
        </p>
      </div>
    </motion.div>
  );
}

export default function HomeServicesSection() {
  return (
    <section
      id="services"
      className="snap-start border-t border-[#252525] bg-[linear-gradient(180deg,#171717_0%,#101010_100%)] pt-6 pb-20 text-white lg:pt-8 lg:pb-24"
    >
      <div
        className="mx-auto"
        style={{ width: "min(var(--layout-width, 85%), 1240px)" }}
      >
        <ServicesStudioIntro />
        <StudioServiceCardsGrid items={studioServiceCards} />
      </div>
    </section>
  );
}
