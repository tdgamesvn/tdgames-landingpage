import ContactShowcaseSection from "@/components/contact-showcase-section";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { GOOGLE_MAPS_EMBED_URL, GOOGLE_MAPS_URL } from "@/lib/company-location";

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#050508] pt-[76px] md:pt-[84px]">
        <ContactShowcaseSection sectionStep="01" fitBelowHeader />
        <section
          className="mx-auto py-16"
          style={{ width: "min(var(--layout-width, 85%), 1240px)" }}
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                className="text-2xl font-black uppercase tracking-[0.08em] text-white md:text-3xl"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                Visit our studio
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Hoa Binh Green City, 505 Minh Khai, Vinh Tuy, Hanoi, Vietnam
              </p>
            </div>
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#ff8c3a]/45 bg-[#ff8c3a]/10 px-5 py-2 text-sm font-semibold text-[#ff8c3a] transition-colors hover:bg-[#ff8c3a]/20 hover:text-white"
            >
              Open in Google Maps
            </a>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <iframe
              src={GOOGLE_MAPS_EMBED_URL}
              title="TD Games on Google Maps"
              className="block h-[360px] w-full md:h-[450px]"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </section>
        <SiteFooter />
      </main>
    </>
  );
}
