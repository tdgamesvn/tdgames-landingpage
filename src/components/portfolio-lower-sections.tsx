"use client";

import ContactShowcaseSection from "@/components/contact-showcase-section";
import PortfolioFaq from "@/components/portfolio-faq";
import SiteFooter from "@/components/site-footer";

/** Below-fold bundle: FAQ + contact + footer (code-split from portfolio hero). */
export default function PortfolioLowerSections() {
  return (
    <>
      <PortfolioFaq />
      <ContactShowcaseSection sectionStep="// 04" embedded />
      <SiteFooter />
    </>
  );
}
