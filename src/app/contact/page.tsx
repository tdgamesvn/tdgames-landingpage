import ContactShowcaseSection from "@/components/contact-showcase-section";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#050508] pt-[76px] md:pt-[84px]">
        <ContactShowcaseSection sectionStep="01" fitBelowHeader />
        <SiteFooter />
      </main>
    </>
  );
}
