import type { Metadata } from "next";
import Link from "next/link";
import { Nunito_Sans } from "next/font/google";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { AccentHighlight } from "@/components/accent-highlight";

import { TOOLS, type Tool } from "./tools";
import WaitlistForm from "./waitlist-form";

const nunitoSans = Nunito_Sans({ weight: ["400", "600", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Free Tools for Game Artists",
  description:
    "Free browser tools for 2D game artists — compress images, upscale art, rig Spine characters, and export VFX sprite sheets. Built by TD Games Studio.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Free Tools for Game Artists | TD Games",
    description:
      "Free browser tools for 2D game artists — compress images, upscale art, rig Spine characters, and export VFX sprite sheets.",
    url: "/tools",
    type: "website",
  },
};

// ponytail: server component, không "use client" — cả trang phải render sẵn HTML
// thì Google mới đọc được. Widget tương tác của từng tool sẽ là client component
// riêng bên trong src/app/tools/<slug>/, không kéo cả trang này thành client.

/** Layout width dùng chung với /blog để cột thẳng hàng với header + footer. */
const CONTAINER = { width: "min(var(--layout-width,85%),1280px)" } as const;

function ToolCard({ tool }: { tool: Tool }) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#f59e0b]/80">
          {tool.tag}
        </span>
        {tool.status === "coming-soon" && (
          <span className="rounded-full border border-white/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
            Coming soon
          </span>
        )}
      </div>

      <h2
        className="mt-1.5 text-base font-bold leading-snug text-white md:text-lg"
        style={{ fontFamily: "var(--font-rajdhani)" }}
      >
        {tool.name}
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-white/50">{tool.blurb}</p>

      <div className="mt-4 text-xs text-white/40">
        {tool.runsOn === "browser" ? "Runs in your browser" : "Runs on our servers"}
      </div>
    </>
  );

  const base =
    "flex h-full min-h-[180px] flex-col rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all md:p-6";

  // Card chưa mở thì không click được — đổi khoảng chết đó thành ô thu email.
  if (tool.status === "coming-soon") {
    return (
      <div className={base}>
        {inner}
        <div className="mt-auto pt-4">
          <WaitlistForm tool={tool.slug} />
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={`${base} group hover:border-[#f59e0b]/30 hover:bg-white/[0.05]`}
    >
      {inner}
    </Link>
  );
}

export default function ToolsPage() {
  return (
    <>
      <SiteHeader />
      <main className={`min-h-screen bg-[#0a0a0a] text-white ${nunitoSans.className}`}>

        {/* ── Hero — cùng khuôn với /blog ── */}
        <section className="relative overflow-hidden pb-12 pt-28 md:pt-36 lg:pt-40">
          <div
            className="pointer-events-none absolute inset-0 flex select-none items-center justify-center overflow-hidden"
            aria-hidden
          >
            <span
              className="block font-black uppercase leading-none tracking-tighter text-white/[0.04]"
              style={{ fontFamily: "var(--font-rajdhani)", fontSize: "clamp(100px, 20vw, 280px)" }}
            >
              TOOLS
            </span>
          </div>

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
            style={{ background: "radial-gradient(ellipse, rgba(245,158,11,0.15) 0%, transparent 70%)" }}
            aria-hidden
          />

          <div className="relative z-10 mx-auto px-4" style={CONTAINER}>
            <div className="mb-5 flex items-center gap-4">
              <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.4)]">
                {"// Toolbox"}
</span>
              <div className="h-px w-16 shrink-0 bg-gradient-to-r from-[#ff8c3a]/60 to-transparent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/70">
                {TOOLS.length} Tools
              </span>
            </div>

            <h1
              className="text-4xl font-black uppercase leading-[1.05] tracking-tight md:text-5xl lg:text-[64px]"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              TD Games <AccentHighlight>Tools</AccentHighlight>
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/60 md:text-[15px]">
              We make 2D art, animation and VFX for games every day, and build our own
              tools to cut the repetitive parts. These are those tools — free, running
              straight in your browser, nothing to install.
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f59e0b]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f59e0b]/20 to-transparent blur-sm" />
        </section>

        {/* ── Grid ── */}
        <section className="py-12 md:py-16">
          <div className="mx-auto px-4" style={CONTAINER}>
            <p className="mb-3 text-sm text-white/55">
              The tools below are still in the works. We&apos;re opening them up one by one.
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {TOOLS.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <h2
                className="text-lg font-bold uppercase tracking-wide text-white md:text-xl"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                Need more than a tool?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
                Tools solve the small stuff. A full art pipeline for a game needs a team.
                TD Games takes on 2D art, animation and VFX outsourcing for game studios.
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-block rounded-full border border-[#f59e0b] bg-[#f59e0b] px-6 py-2 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-[#f59e0b]/85"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
