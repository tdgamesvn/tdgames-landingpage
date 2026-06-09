"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { AccentHighlight } from "./accent-highlight";
import {
  STUDIO_SERVICE_ACCENT,
  StudioServiceCardsGrid,
  studioServiceCards,
  type StudioServiceCard,
} from "./studio-service-cards";

/** Map display_label → url from page_slots DB */
const LABEL_TO_INDEX: Record<string, number> = {
  "service-animation": 0,
  "service-art": 1,
  "service-vfx": 2,
};

function useServiceCardImages(): StudioServiceCard[] {
  const [cards, setCards] = useState(studioServiceCards);

  useEffect(() => {
    fetch("/api/page-slots?page=home&slot=service-card")
      .then((r) => r.json())
      .then((data) => {
        const items: { url: string; display_label?: string }[] = data.items ?? [];
        if (items.length === 0) return;

        setCards((prev) =>
          prev.map((card, i) => {
            // Match by display_label or by index
            const match =
              items.find((it) => LABEL_TO_INDEX[it.display_label ?? ""] === i) ??
              items[i];
            return match ? { ...card, image: match.url } : card;
          }),
        );
      })
      .catch(() => {/* fallback to site.json */});
  }, []);

  return cards;
}

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
  const cards = useServiceCardImages();

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
        <StudioServiceCardsGrid items={cards} />
      </div>
    </section>
  );
}
