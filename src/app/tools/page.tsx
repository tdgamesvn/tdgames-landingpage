import type { Metadata } from "next";
import Link from "next/link";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

import { TOOLS, type Tool } from "./tools";
import WaitlistForm from "./waitlist-form";

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

function ToolCard({ tool }: { tool: Tool }) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span
          className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400"
          style={{ fontFamily: "var(--font-rajdhani)" }}
        >
          {tool.tag}
        </span>
        {tool.status === "coming-soon" && (
          <span
            className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            Coming soon
          </span>
        )}
      </div>

      <h2
        className="mt-5 text-lg font-black uppercase tracking-[0.06em] text-white md:text-xl"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        {tool.name}
      </h2>

      <p className="mt-3 text-[15px] leading-relaxed text-white/60">{tool.blurb}</p>

      <div
        className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-white/35"
        style={{ fontFamily: "var(--font-rajdhani)" }}
      >
        {tool.runsOn === "browser" ? "Runs in your browser" : "Runs on our servers"}
      </div>
    </>
  );

  const base =
    "flex h-full flex-col rounded-2xl border p-6 transition-colors md:p-7";

  // Card chưa mở thì không click được — đổi khoảng chết đó thành ô thu email.
  if (tool.status === "coming-soon") {
    return (
      <div className={`${base} border-white/10 bg-white/[0.02]`}>
        {inner}
        <div className="mt-auto">
          <WaitlistForm tool={tool.slug} />
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={`${base} border-white/10 bg-white/[0.03] hover:border-amber-400/50 hover:bg-white/[0.06]`}
    >
      {inner}
    </Link>
  );
}

export default function ToolsPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#050508] pt-[76px] md:pt-[84px]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <h1
            className="text-3xl font-black uppercase tracking-[0.06em] text-white md:text-5xl"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            Tools
          </h1>
          <div
            className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-amber-400"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            Free for game artists
          </div>

          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-white/65">
            Chúng tôi làm 2D art, animation và VFX cho game mỗi ngày, và tự viết công cụ
            để bớt những việc lặp đi lặp lại. Đây là những công cụ đó — miễn phí, dùng
            thẳng trên trình duyệt, không cần cài đặt.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65">
            Các tool bên dưới đang được hoàn thiện. Chúng tôi sẽ mở dần từng cái.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
            <h2
              className="text-lg font-black uppercase tracking-[0.12em] text-white md:text-xl"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              Cần nhiều hơn một công cụ?
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65">
              Tool giải quyết việc nhỏ. Còn cả một pipeline art cho game thì cần một đội.
              TD Games nhận outsourcing 2D art, animation và VFX cho studio game.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block rounded-full bg-amber-400 px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-amber-300"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              Liên hệ với chúng tôi
            </Link>
          </div>
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
