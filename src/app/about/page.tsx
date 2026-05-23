"use client";

import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[#0a0a0a] text-white">
        {/* Hero Section */}
        <section className="relative flex h-screen items-center overflow-hidden border-b border-white/10">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80"
              alt="TD Games Team"
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div
            className="relative z-10 px-4"
            style={{ width: "min(90%, 1280px)", margin: "0 auto" }}
          >
            <div className="max-w-2xl">
              <h1
                className="text-6xl font-black uppercase leading-[1] tracking-tight md:text-8xl"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                ABOUT <span className="text-[#f59e0b]">US</span>
              </h1>

              <p className="mt-8 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
                Founded in 2019, TD Games emerged from a shared passion for creating visually stunning game experiences. What started as a small team of artists has grown into a trusted game art studio working with developers worldwide.
              </p>
              
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
                We specialize in 2D animation, VFX, and splash art for games — bringing characters and worlds to life with professional-grade assets that enhance gameplay and captivate players.
              </p>

              <Link
                href="/contact"
                className="mt-8 inline-flex rounded-xl border-2 border-[#f59e0b] bg-[#f59e0b] px-8 py-4 text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-transparent hover:text-white md:text-base"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b border-white/10 py-16 md:py-20">
          <div
            className="mx-auto px-4"
            style={{ width: "min(90%, 1280px)" }}
          >
            <div className="mb-4 flex items-center gap-4">
              <span className="text-sm font-black italic tracking-tighter text-[#f59e0b] drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]">
                // 01
              </span>
              <div className="h-px w-12 shrink-0 bg-gradient-to-r from-[#f59e0b]/55 to-white/12" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">
                Who We Are
              </span>
            </div>
            <h2
              className="text-3xl font-black uppercase tracking-tight md:text-4xl"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              A compact team
              <br />
              <span className="text-[#f59e0b]">with big passion</span>
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/70">
              Based in Hanoi, Vietnam, TD Games is a boutique studio focused on delivering high-quality 2D game art. We work closely with clients to understand their vision and bring it to life through animation, VFX, and illustration.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#f59e0b]/30 bg-[#f59e0b]/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-8 w-8 text-[#f59e0b]"
                  >
                    <path d="M12 2v20M2 12h20" />
                  </svg>
                </div>
                <p
                  className="mt-4 text-3xl font-black text-white"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  5+
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/50">
                  YEARS OF EXPERIENCE
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#f59e0b]/30 bg-[#f59e0b]/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-8 w-8 text-[#f59e0b]"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <p
                  className="mt-4 text-3xl font-black text-white"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  7
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/50">
                  CREATIVE TEAM
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#f59e0b]/30 bg-[#f59e0b]/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-8 w-8 text-[#f59e0b]"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <p
                  className="mt-4 text-3xl font-black text-white"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  GMT+7
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/50">
                  TIMEZONE
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#f59e0b]/30 bg-[#f59e0b]/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-8 w-8 text-[#f59e0b]"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                </div>
                <p
                  className="mt-4 text-3xl font-black text-white"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  50+
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/50">
                  PROJECTS DELIVERED
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Studio Photos Grid */}
        <section className="border-b border-white/10 py-16 md:py-20">
          <div
            className="mx-auto px-4"
            style={{ width: "min(90%, 1280px)" }}
          >
            <div className="mb-4 flex items-center gap-4">
              <span className="text-sm font-black italic tracking-tighter text-[#f59e0b] drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]">
                // 02
              </span>
              <div className="h-px w-12 shrink-0 bg-gradient-to-r from-[#f59e0b]/55 to-white/12" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">
                Our Workspace
              </span>
            </div>
            <h2
              className="text-3xl font-black uppercase tracking-tight md:text-4xl"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              Where the <span className="text-[#f59e0b]">magic happens</span>
            </h2>

            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <Image
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
                  alt="Studio workspace"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                  alt="Team collaboration"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <Image
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80"
                  alt="Creative process"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <Image
                  src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80"
                  alt="Team meeting"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Specialization Section */}
        <section className="border-b border-white/10 bg-[#0f0f0f] py-16 md:py-20">
          <div
            className="mx-auto px-4"
            style={{ width: "min(90%, 1280px)" }}
          >
            <div className="mb-4 flex items-center gap-4">
              <span className="text-sm font-black italic tracking-tighter text-[#f59e0b] drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]">
                // 03
              </span>
              <div className="h-px w-12 shrink-0 bg-gradient-to-r from-[#f59e0b]/55 to-white/12" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">
                What We Do Best
              </span>
            </div>
            <h2
              className="text-3xl font-black uppercase tracking-tight md:text-4xl"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              Our <span className="text-[#f59e0b]">Expertise</span>
            </h2>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "2D ANIMATION & VFX",
                  desc: "Character animations, skill effects, and cinematic sequences that bring your game to life.",
                  icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                },
                {
                  title: "LOGIN SCREEN ANIMATIONS",
                  desc: "Eye-catching animated login screens that create memorable first impressions for players.",
                  icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                },
                {
                  title: "SPLASH ART & ILLUSTRATION",
                  desc: "High-quality character art and promotional illustrations that showcase your game's unique style.",
                  icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-white/5 p-6 transition hover:border-[#f59e0b]/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f59e0b]/10">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-[#f59e0b]"
                    >
                      <path d={item.icon} />
                    </svg>
                  </div>
                  <h3
                    className="mt-4 text-lg font-black uppercase text-white"
                    style={{ fontFamily: "var(--font-rajdhani)" }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portfolio Showcase */}
        <section className="border-b border-white/10 py-16 md:py-20">
          <div
            className="mx-auto px-4"
            style={{ width: "min(90%, 1280px)" }}
          >
            <div className="mb-4 flex items-center gap-4">
              <span className="text-sm font-black italic tracking-tighter text-[#f59e0b] drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]">
                // 04
              </span>
              <div className="h-px w-12 shrink-0 bg-gradient-to-r from-[#f59e0b]/55 to-white/12" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">
                Featured Work
              </span>
            </div>
            <h2
              className="text-3xl font-black uppercase tracking-tight md:text-4xl"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              Recent <span className="text-[#f59e0b]">Projects</span>
            </h2>

            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { img: "https://tdgamestudio.com/landing/images/Screenshot 2026-05-13 232709.png", label: "KAYN SNOW MOON" },
                { img: "https://tdgamestudio.com/landing/images/summonerDetail.png", label: "SUMMONER ERA" },
                { img: "https://tdgamestudio.com/landing/images/service-animation.jpg", label: "ANIMATION" },
                { img: "https://tdgamestudio.com/landing/images/ourproject.jpg", label: "BATTLE OF GODS" },
              ].map((item, i) => (
                <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-lg">
                  <Image
                    src={item.img}
                    alt={item.label}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <p
                    className="absolute bottom-4 left-4 text-xs font-black uppercase tracking-wider text-[#f59e0b]"
                    style={{ fontFamily: "var(--font-rajdhani)" }}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/portfolio"
                className="inline-flex rounded-lg border-2 border-[#f59e0b] px-8 py-3 text-sm font-black uppercase tracking-wider text-[#f59e0b] transition hover:bg-[#f59e0b] hover:text-black"
              >
                View All Projects
              </Link>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="border-b border-white/10 bg-[#0f0f0f] py-16 md:py-20">
          <div
            className="mx-auto px-4"
            style={{ width: "min(90%, 1280px)" }}
          >
            <div className="mb-4 flex items-center gap-4">
              <span className="text-sm font-black italic tracking-tighter text-[#f59e0b] drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]">
                // 05
              </span>
              <div className="h-px w-12 shrink-0 bg-gradient-to-r from-[#f59e0b]/55 to-white/12" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">
                Our Values
              </span>
            </div>
            <h2
              className="text-3xl font-black uppercase tracking-tight md:text-4xl"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              What drives us
              <br />
              <span className="text-[#f59e0b]">every day</span>
            </h2>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "PASSION",
                  desc: "We love games and we love what we do.",
                  icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
                },
                {
                  title: "QUALITY",
                  desc: "We care about details that project success.",
                  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                },
                {
                  title: "COLLABORATION",
                  desc: "Close partnership brings the best results.",
                  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                },
                {
                  title: "RELIABILITY",
                  desc: "We make deadlines and keep our commitments.",
                  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                },
                {
                  title: "GROWTH",
                  desc: "We grow and level up together.",
                  icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
                },
                {
                  title: "INNOVATION",
                  desc: "We explore new techniques and workflows.",
                  icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
                },
              ].map((value) => (
                <div
                  key={value.title}
                  className="rounded-xl border border-white/10 bg-white/5 p-6 transition hover:border-[#f59e0b]/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f59e0b]/10">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-[#f59e0b]"
                    >
                      <path d={value.icon} />
                    </svg>
                  </div>
                  <h3
                    className="mt-4 text-lg font-black uppercase text-white"
                    style={{ fontFamily: "var(--font-rajdhani)" }}
                  >
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    {value.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="border-b border-white/10 py-16 md:py-20">
          <div
            className="mx-auto px-4"
            style={{ width: "min(90%, 1280px)" }}
          >
            <div className="mb-4 flex items-center gap-4">
              <span className="text-sm font-black italic tracking-tighter text-[#f59e0b] drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]">
                // 06
              </span>
              <div className="h-px w-12 shrink-0 bg-gradient-to-r from-[#f59e0b]/55 to-white/12" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">
                Meet The Team
              </span>
            </div>
            <h2
              className="text-3xl font-black uppercase tracking-tight md:text-4xl"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              Passionate <span className="text-[#f59e0b]">Artists</span>
            </h2>

            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
                "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
                "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
              ].map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={img}
                    alt={`Team member ${i + 1}`}
                    fill
                    className="object-cover grayscale transition-all duration-300 hover:grayscale-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#f59e0b]/10 via-black to-black py-20 md:py-28">
          <div className="absolute right-0 top-0 h-full w-1/2 opacity-20">
            <Image
              src="https://tdgamestudio.com/landing/images/summoners.png"
              alt=""
              fill
              className="object-cover"
            />
          </div>

          <div
            className="relative z-10 mx-auto px-4 text-center"
            style={{ width: "min(90%, 960px)" }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#f59e0b]">
              LET'S CREATE TOGETHER
            </p>
            <h2
              className="mt-4 text-4xl font-black uppercase leading-tight tracking-tight md:text-5xl"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              Have a project in mind?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              We'd love to hear about it. Let's build something amazing together.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex rounded-lg bg-[#f59e0b] px-8 py-4 text-sm font-black uppercase tracking-wider text-black transition hover:bg-[#ffb366]"
              >
                GET IN TOUCH
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex rounded-lg border-2 border-white/30 px-8 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:border-[#f59e0b] hover:text-[#f59e0b]"
              >
                VIEW OUR WORK
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
