"use client";

import HomeHero from "@/components/home-hero";
import HomePageLower from "@/components/home-page-lower";
import HomeProjectsSection from "@/components/home-projects-section";
import HomeServicesSection from "@/components/home-services-section";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="scroll-smooth">
        <HomeHero />
        <HomeServicesSection />
        <HomeProjectsSection />
        <HomePageLower />
        <SiteFooter />
      </main>
    </>
  );
}
