"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import siteContent from "@/content/site.json";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_SOFT = [0.33, 1, 0.68, 1] as const;

const cardShellVariants = {
  rest: {},
  hover: {
    transition: { staggerChildren: 0.02, delayChildren: 0.03 },
  },
} as const;

const descriptionVariants = {
  rest: {
    height: 0,
    opacity: 0,
    y: 8,
    transition: {
      height: { duration: 0.42, ease: EASE_OUT },
      opacity: { duration: 0.28, ease: EASE_SOFT },
      y: { duration: 0.32, ease: EASE_OUT },
    },
  },
  hover: {
    height: "auto",
    opacity: 1,
    y: 0,
    transition: {
      height: { duration: 0.56, ease: EASE_OUT },
      opacity: { duration: 0.48, delay: 0.08, ease: EASE_SOFT },
      y: { duration: 0.48, delay: 0.06, ease: EASE_OUT },
    },
  },
} as const;

export const STUDIO_SERVICE_ACCENT = "#ff8c3a";

export type StudioServiceCard = {
  title: string;
  icon: "animation" | "art" | "vfx";
  href: string;
  statValue: string;
  statLabel: string;
  description: string;
  image: string;
};

/** Service card data loaded from src/content/site.json */
export const studioServiceCards: StudioServiceCard[] =
  siteContent.services.cards as StudioServiceCard[];

export function StudioServiceIcon({
  type,
  color,
}: {
  type: "animation" | "art" | "vfx";
  color: string;
}) {
  const iconSrc =
    type === "art"
      ? "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/art.png"
      : type === "animation"
        ? "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/running.png"
        : "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/sparkling.png";

  return (
    <span
      className="block h-6 w-6"
      style={{
        backgroundColor: color,
        maskImage: `url('${iconSrc}')`,
        WebkitMaskImage: `url('${iconSrc}')`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
      aria-hidden="true"
    />
  );
}

export function StudioServiceCardsGrid({
  items = studioServiceCards,
}: {
  items?: StudioServiceCard[];
}) {
  const accent = STUDIO_SERVICE_ACCENT;
  const reduceMotion = useReducedMotion();

  return (
    <div className="mx-auto mt-6 grid max-w-5xl items-center gap-5 md:mt-8 md:grid-cols-3 lg:gap-6">
      {items.map((service, index) => (
        <motion.div
          key={service.title}
          className="relative h-[460px] w-full overflow-visible hover:z-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{
            once: true,
            amount: 0.2,
            margin: "0px 0px -48px 0px",
          }}
          transition={{
            delay: reduceMotion ? 0 : 0.08 * (index + 1),
            duration: reduceMotion ? 0.15 : 0.52,
            ease: EASE_OUT,
          }}
        >
          <motion.article
            variants={reduceMotion ? undefined : cardShellVariants}
            initial={reduceMotion ? false : "rest"}
            whileHover={reduceMotion ? undefined : "hover"}
            className="group/card relative h-full w-full"
          >
            <div className="absolute left-0 right-0 top-1/2 z-20 flex -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-orange-300/35 bg-[linear-gradient(170deg,#1c1f28_0%,#14171f_68%,#171107_100%)] shadow-[0_24px_70px_rgba(0,0,0,0.35)] transition-[border-color,box-shadow] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:border-orange-300/65 group-hover/card:shadow-[0_32px_90px_rgba(0,0,0,0.5),0_0_28px_rgba(255,140,58,0.2)]">
            <a
              href={service.href}
              aria-label={`Open ${service.title}`}
              className="absolute inset-0 z-10"
            />
            <div className="relative h-[250px] w-full shrink-0 overflow-hidden">
              <Image
                src={service.image}
                alt=""
                fill
                className="object-cover transition-transform duration-[620ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.03]"
                sizes="(max-width:768px) 100vw, 380px"
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0b0b0f] via-transparent to-transparent opacity-75" />
            </div>

            <div className="flex flex-col px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-[24px] font-bold leading-tight tracking-tight text-white">
                  {service.title}
                </h3>
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-black/60 shadow-[0_6px_16px_rgba(0,0,0,0.28)]">
                  <StudioServiceIcon type={service.icon} color={accent} />
                </span>
              </div>

              {reduceMotion ? (
                <div className="mt-3">
                  <p className="text-[13px] leading-6 text-white/82">
                    {service.description}
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={descriptionVariants}
                  className="overflow-hidden"
                >
                  <p className="pt-1 text-[13px] leading-6 text-white/82">
                    {service.description}
                  </p>
                </motion.div>
              )}

              <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-4 pt-2">
                <div className="min-w-0">
                  <div className="text-base font-semibold leading-tight text-white">
                    {service.statValue}
                  </div>
                  <div className="text-[12px] leading-tight text-white/60">
                    {service.statLabel}
                  </div>
                </div>

                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/85 transition-[border-color,background-color,color,transform] duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:translate-x-0.5 group-hover/card:border-orange-300/60 group-hover/card:bg-[#ff8c3a] group-hover/card:text-black">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
          </motion.article>
        </motion.div>
      ))}
    </div>
  );
}
