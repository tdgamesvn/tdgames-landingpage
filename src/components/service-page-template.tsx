import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Changa_One, Nunito_Sans } from "next/font/google";

import ServiceCapabilitiesGrid, {
  type ServiceCapabilityItem,
} from "@/components/service-capabilities-grid";
import SiteHeader from "@/components/site-header";

const changaOne = Changa_One({ weight: "400", subsets: ["latin"] });
const nunitoSans = Nunito_Sans({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

type ServicePageTemplateProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  intro?: string;
  bullets?: string[];
  /** When false, hides the “What we deliver” and “Related services” block. */
  showDeliverRelated?: boolean;
  /** Rendered inside `<main>` after capabilities and optional deliver block. */
  appendSections?: ReactNode;
  hero?: {
    image: string;
    titleTop: string;
    titleMain: string;
    subheading: string;
    description: string;
    ctaLabel: string;
    ctaHref?: string;
  };
  capabilities?: {
    eyebrow: string;
    titlePrefix: string;
    titleHighlight: string;
    titleSuffix: string;
    items: ServiceCapabilityItem[];
    sectionMarker?: { step: string; label: string };
  };
};

export default function ServicePageTemplate({
  eyebrow,
  title,
  subtitle,
  intro = "",
  bullets = [],
  showDeliverRelated = true,
  appendSections = null,
  hero,
  capabilities,
}: ServicePageTemplateProps) {
  const heroImageSrc = hero
    ? hero.image.startsWith("/") || hero.image.startsWith("http")
      ? hero.image
      : `/${hero.image}`
    : "";

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#090a10] text-white">
        {hero ? (
          <section
            className={`relative min-h-screen overflow-hidden border-b border-white/10 bg-[#0a0a0a] snap-start ${nunitoSans.className}`}
          >
            <div className="pointer-events-none absolute inset-0 z-0">
              <Image
                src={heroImageSrc}
                alt={title}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </div>

            <div
              className="relative z-10 mx-auto flex min-h-screen items-center"
              style={{ width: "var(--layout-width, 75%)" }}
            >
              <div className="w-full">
                <div
                  className="max-w-[606px] tracking-[0.5px]"
                  style={{ transform: "translateY(var(--hero-text-y, 0px))" }}
                >
                  <div className="mb-[-10px] overflow-hidden">
                    <div
                      className={`leading-[1] font-black uppercase ${changaOne.className}`}
                      style={{
                        fontSize: "var(--hero-title-size, 100px)",
                        color: "var(--hero-highlight-color, #f59e0b)",
                      }}
                    >
                      {hero.titleTop}
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <div
                      className={`leading-[1] font-black uppercase ${changaOne.className}`}
                      style={{
                        fontSize: "var(--hero-title-size, 100px)",
                        color: "var(--hero-title-color, #ffffff)",
                      }}
                    >
                      {hero.titleMain}
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
                      {hero.subheading}
                    </h3>
                  </div>

                  <p
                    className="mb-[15px] mt-4 max-w-[547px] leading-normal"
                    style={{
                      fontSize: "var(--hero-desc-size, 18px)",
                      color: "var(--hero-desc-color, #e5e7eb)",
                    }}
                  >
                    {hero.description}
                  </p>

                  <div className="mb-[15px] mt-[32px]">
                    <Link
                      href={hero.ctaHref ?? "/contact"}
                      className="inline-block rounded-xl border-2 px-[32px] py-[16px] text-[18px] font-bold uppercase tracking-wider text-black transition-colors duration-300 hover:bg-transparent hover:text-white"
                      style={{
                        backgroundColor: "var(--hero-btn-bg, #f59e0b)",
                        borderColor: "var(--hero-btn-bg, #f59e0b)",
                      }}
                    >
                      {hero.ctaLabel}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="border-b border-white/10 pt-36 pb-14 md:pt-40">
            <div
              className="mx-auto"
              style={{ width: "min(var(--layout-width, 85%), 1120px)" }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ff9f1a]">
                {eyebrow}
              </p>
              <h1
                className="mt-3 text-4xl font-black uppercase tracking-tight md:text-6xl"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                {title}
              </h1>
              <p className="mt-3 text-lg text-white/70">{subtitle}</p>
            </div>
          </section>
        )}

        {capabilities ? (
          <ServiceCapabilitiesGrid
            eyebrow={capabilities.eyebrow}
            titlePrefix={capabilities.titlePrefix}
            titleHighlight={capabilities.titleHighlight}
            titleSuffix={capabilities.titleSuffix}
            items={capabilities.items}
            sectionMarker={capabilities.sectionMarker}
          />
        ) : null}

        {showDeliverRelated ? (
          <section className="py-14 md:py-16">
            <div
              className="mx-auto grid gap-8 md:grid-cols-[1.15fr_0.85fr]"
              style={{ width: "min(var(--layout-width, 85%), 1120px)" }}
            >
              <article className="rounded-2xl border border-white/12 bg-white/4 p-6 md:p-8">
                <h2
                  className="text-2xl font-black uppercase tracking-tight"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  What we deliver
                </h2>
                <p className="mt-4 leading-7 text-white/75">{intro}</p>
                <ul className="mt-5 space-y-3 text-white/80">
                  {bullets.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 text-[#ff9f1a]" aria-hidden>
                        ●
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <aside className="rounded-2xl border border-white/12 bg-[#11131d] p-6 md:p-8">
                <h3
                  className="text-xl font-black uppercase tracking-tight"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  Related services
                </h3>
                <div className="mt-4 flex flex-col gap-2.5 text-sm font-semibold uppercase tracking-[0.12em]">
                  <Link className="rounded-lg border border-white/12 px-4 py-3 hover:border-[#ff9f1a]/55 hover:text-[#ffcc8e]" href="/services/2d-art">
                    2D Art
                  </Link>
                  <Link className="rounded-lg border border-white/12 px-4 py-3 hover:border-[#ff9f1a]/55 hover:text-[#ffcc8e]" href="/services/2d-animation">
                    2D Animation
                  </Link>
                  <Link className="rounded-lg border border-white/12 px-4 py-3 hover:border-[#ff9f1a]/55 hover:text-[#ffcc8e]" href="/services/2d-vfx">
                    2D VFX
                  </Link>
                </div>
              </aside>
            </div>
          </section>
        ) : null}

        {appendSections}
      </main>
    </>
  );
}
