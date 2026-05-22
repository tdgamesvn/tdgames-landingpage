import Image from "next/image";

import { AccentHighlight } from "@/components/accent-highlight";

export type ServiceCapabilityItem = {
  title: string;
  description: string;
  image: string;
};

type ServiceCapabilitiesGridProps = {
  eyebrow: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  items: ServiceCapabilityItem[];
  /** When set, shows `// step · label` and skips the orange eyebrow line (avoid duplicate with label). */
  sectionMarker?: { step: string; label: string };
};

export default function ServiceCapabilitiesGrid({
  eyebrow,
  titlePrefix,
  titleHighlight,
  titleSuffix,
  items,
  sectionMarker,
}: ServiceCapabilitiesGridProps) {
  return (
    <section className="border-t border-[#252525] bg-[linear-gradient(180deg,#121218_0%,#0b0b10_100%)] py-14 text-white md:py-20 lg:py-24">
      <div
        className="mx-auto"
        style={{ width: "min(var(--layout-width, 85%), 1240px)" }}
      >
        <header className="mb-10 md:mb-12">
          {sectionMarker ? (
            <div className="mb-4 flex items-center gap-4">
              <span className="text-sm font-black italic tracking-tighter text-[#ff8c3a]">{`// ${sectionMarker.step}`}</span>
              <div className="h-px w-10 shrink-0 bg-white/10" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
                {sectionMarker.label}
              </span>
            </div>
          ) : (
            <p
              className="text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{ color: "var(--hero-btn-bg, #f59e0b)" }}
            >
              {eyebrow}
            </p>
          )}
          <h2
            className={`text-4xl font-black uppercase leading-tight tracking-tight text-white md:text-5xl lg:text-[3.25rem] lg:leading-[1.05] ${sectionMarker ? "mt-0" : "mt-3"}`}
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            {titlePrefix}
            <AccentHighlight>{titleHighlight}</AccentHighlight>
            {titleSuffix}
          </h2>
        </header>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.title}
              className="group overflow-hidden rounded-2xl border border-[#ff8c3a]/20 bg-[#14141a] shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.18]"
                  sizes="(max-width:768px) 100vw, 380px"
                />
                {/* Gradient & overlay content */}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#14141a]/90 via-transparent to-transparent opacity-90" />

                <div className="pointer-events-none absolute bottom-4 left-4">
                  <div
                    className="inline-flex items-center rounded-xl border border-[#ff8c3a]/35 bg-black/45 px-4 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur"
                  >
                    <h3
                      className="text-sm font-black uppercase tracking-[0.08em] text-[#ffcc8e] md:text-base"
                      style={{ fontFamily: "var(--font-rajdhani)" }}
                    >
                      {item.title}
                    </h3>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
