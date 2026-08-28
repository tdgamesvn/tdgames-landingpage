import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

// ponytail: plain JSX render of a section array — no markdown/MDX pipeline for two static pages
export default function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string[];
  sections: LegalSection[];
}) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#050508] pt-[76px] md:pt-[84px]">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <h1
            className="text-3xl font-black uppercase tracking-[0.06em] text-white md:text-5xl"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            {title}
          </h1>
          <div
            className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-amber-400"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            Last updated {updated}
          </div>

          <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-white/65">
            {intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          {sections.map((s) => (
            <section key={s.title} className="mt-12">
              <h2
                className="text-lg font-black uppercase tracking-[0.12em] text-white md:text-xl"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                {s.title}
              </h2>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-white/65">
                {s.paragraphs?.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {s.bullets && (
                  <ul className="space-y-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex gap-3">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
