import Image from "next/image";
import Link from "next/link";
import { Changa_One } from "next/font/google";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { resolveSlot } from "@/lib/page-slots";
import siteContent from "@/content/site.json";
import fs from "node:fs/promises";
import path from "node:path";

export const revalidate = 60;

const changaOne = Changa_One({ weight: "400", subsets: ["latin"] });

type TeamMember = { id: string; name: string; title: string; photo: string };
type WorkspaceImage = { src: string; alt: string };
type AboutData = { heroImage: string; workspace: WorkspaceImage[] };

async function getAbout(): Promise<AboutData> {
  const filePath = path.join(process.cwd(), "src", "content", "site.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  const siteAbout = data.about ?? {
    heroImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80",
    workspace: [],
  };

  // Resolve heroImage từ DB nếu có label "about-hero", fallback về site.json
  const heroImage = await resolveSlot("about", "hero", siteAbout.heroImage);

  return { ...siteAbout, heroImage };
}

async function getTeam(): Promise<TeamMember[]> {
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase-admin");
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("team_members")
      .select("id, name, title, photo")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const team = await getTeam();
  const about = await getAbout();
  return (
    <>
      <SiteHeader />
      <main className="bg-[#0a0a0a] text-white">
        {/* Hero Section */}
        <section className="relative flex h-screen items-center overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 z-0">
            {/\.(mp4|webm|mov)(\?.*)?$/i.test(about.heroImage) ? (
              <video
                src={about.heroImage}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={about.heroImage}
                alt="TD Games Team"
                fill
                className="object-cover"
                priority
              />
            )}
          </div>

          {/* Subtle dark vignette — stronger on the left where text lives, dissolves toward center */}
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(100deg, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.55) 28%, rgba(10,10,10,0.18) 55%, transparent 78%)",
            }}
          />
          {/* Bottom fade for mobile */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/5 md:hidden"
            style={{
              background: "linear-gradient(to top, rgba(10,10,10,0.75) 0%, transparent 100%)",
            }}
          />

          <div
            className="relative z-[2] mx-auto px-4"
            style={{ width: "var(--layout-width, 75%)" }}
          >
            <div className="max-w-2xl">
              <h1
                className={`text-6xl font-black uppercase leading-[1] tracking-tight md:text-8xl ${changaOne.className}`}
              >
                ABOUT <span className="text-[#f59e0b]">US</span>
              </h1>

              <p className="mt-8 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
                Founded in 2023, TD Games is a Vietnam based game outsourcing studio dedicated to delivering high quality Game Art, Animation, VFX, and Game Development services.
              </p>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
                We combine creativity, professionalism, and technical expertise to help our global partners bring outstanding gaming experiences to life. Every project is approached with passion, precision, and a commitment to building long-term partnerships.
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
                  3+
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
              {about.workspace.map((img) => (
                <div key={img.src} className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
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
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/70 md:text-base">
              Two ways to work with us: outsource your{" "}
              <span className="text-white">art, animation and VFX</span> to our team, or hand us
              the whole game and we build it{" "}
              <span className="text-white">end to end</span>. Either way,{" "}
              <span className="text-[#f59e0b]">2D is where we are strongest</span> — with 3D
              support when a project needs it.
            </p>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "2D GAME ART & ILLUSTRATION",
                  desc: "Character design, splash art, concept art, environments, UI and icons — production-ready in your game's style.",
                  icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
                },
                {
                  title: "2D ANIMATION",
                  desc: "Spine and frame-by-frame character animation, skill motions, login screens and cinematic sequences.",
                  icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                },
                {
                  title: "GAME VFX",
                  desc: "Skill effects, impacts, buffs and environment FX — hand-crafted 2D VFX tuned for readability in combat.",
                  icon: "M13 10V3L4 14h7v7l9-11h-7z",
                },
                {
                  title: "FULL GAME DEVELOPMENT",
                  desc: "The complete game, not just assets: design, art, programming, build and release — one team, one timeline.",
                  icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
                },
                {
                  title: "DEDICATED ART TEAM",
                  desc: "A long-term squad of artists and animators working inside your pipeline, scaling up or down as your roadmap moves.",
                  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
                },
                {
                  title: "ENGINE INTEGRATION",
                  desc: "Assets delivered ready to ship — Spine, Unity and Cocos setups, atlases and export specs that drop straight into your build.",
                  icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
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
              {siteContent.home.featuredProjects.slice(0, 4).map((item) => (
                <Link
                  key={item.slug}
                  href={`/portfolio/${item.slug}`}
                  className="group relative aspect-[3/4] overflow-hidden rounded-lg"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
                      {item.category}
                    </p>
                    <p
                      className="mt-1 text-xs font-black uppercase tracking-wider text-[#f59e0b]"
                      style={{ fontFamily: "var(--font-rajdhani)" }}
                    >
                      {item.title}
                    </p>
                  </div>
                </Link>
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
              {team.map((member) => (
                <div key={member.id} className="group relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Name & title overlay — visible on hover */}
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p
                      className="text-sm font-black uppercase tracking-wide text-white"
                      style={{ fontFamily: "var(--font-rajdhani)" }}
                    >
                      {member.name}
                    </p>
                    <p className="mt-0.5 text-xs font-medium uppercase tracking-widest text-[#f59e0b]">
                      {member.title}
                    </p>
                  </div>
                  {/* Always-visible name strip at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 translate-y-0 group-hover:opacity-0 transition-opacity duration-300">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                      {member.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#f59e0b]/10 via-black to-black py-20 md:py-28">
          <div className="absolute right-0 top-0 h-full w-1/2 opacity-20">
            <Image
              src="https://cdn.tdgamestudio.com/landing/images/summoners.png"
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
