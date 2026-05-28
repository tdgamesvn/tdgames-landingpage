"use client";

import dynamic from "next/dynamic";
import HomeHero from "@/components/home-hero";
import HomeProjectsSection from "@/components/home-projects-section";
import HomeServicesSection from "@/components/home-services-section";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

// Fix B: lazy-load below-fold section (contains Spine + heavy content)
const HomePageLower = dynamic(() => import("@/components/home-page-lower"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#0a0a0a]" />,
});

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
