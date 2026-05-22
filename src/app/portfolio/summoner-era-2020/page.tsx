"use client";

import Image from "next/image";
import Link from "next/link";

import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { projectMeta, relatedProjects, showcaseModules } from "./project-data";

function FactIcon({ name }: { name: string }) {
  const accentColor = projectMeta.theme?.accent || "#22d3ee";
  const common = `h-5 w-5`;
  if (name === "calendar") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={common}
        style={{ color: accentColor }}
        aria-hidden
      >
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
        <path d="M8 3v4M16 3v4M3.5 10h17" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={common}
        style={{ color: accentColor }}
        aria-hidden
      >
        <circle cx="9" cy="8.5" r="3.5" />
        <path d="M2.8 19.5c.7-3.4 3.3-5.5 6.2-5.5s5.5 2.1 6.2 5.5" />
        <path d="M16.5 11.5a3 3 0 1 0 0-6" />
        <path d="M17.5 19.5c-.2-2-1-3.7-2.4-5" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={common}
      style={{ color: accentColor }}
      aria-hidden
    >
      <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
      <path d="M4 7.5 12 12l8-4.5M12 12v9" />
    </svg>
  );
}

function HeroTitle() {
  const { heroTitle, theme } = projectMeta;
  
  if (!heroTitle) {
    return (
      <h1
        className="mt-3 text-[28px] font-black uppercase leading-[0.98] tracking-tight text-white md:text-[40px]"
        style={{ fontFamily: "var(--font-rajdhani)" }}
      >
        {projectMeta.title}
      </h1>
    );
  }

  const getColor = (color: string) => {
    if (color === "accent") return theme?.accent || "#22d3ee";
    if (color === "accentSoft") return theme?.accentSoft || "#ffffff";
    if (color === "white") return "#ffffff";
    if (color === "soft") return "rgba(255,255,255,0.55)";
    if (color === "divider") return "rgba(255,255,255,0.40)";
    return "#ffffff";
  };

  return (
    <h1
      className="mt-3 text-[28px] font-black uppercase leading-[0.98] tracking-tight text-white md:text-[40px]"
      style={{ fontFamily: "var(--font-rajdhani)" }}
    >
      <span className="block">
        {heroTitle.primary.map((segment, i) => (
          <span key={i} style={{ color: getColor(segment.color) }}>
            {segment.text}
          </span>
        ))}
      </span>
      <span className="mt-1 block text-[0.62em] font-black tracking-[0.06em] md:text-[0.58em]">
        {heroTitle.subtitle.map((segment, i) => (
          <span key={i} style={{ color: getColor(segment.color) }}>
            {segment.text}
          </span>
        ))}
      </span>
    </h1>
  );
}

const TOOL_LOGOS: Record<string, string> = {
  "Spine 2D": "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/spinelogo.jpg",
  "After Effects": "https://pub-97eae399068b4753bb314896c009c27e.r2.dev/landing/images/after-effects-cc-logo-png-transparent.png",
};

function PanelWorkflow() {
  const accentColor = projectMeta.theme?.accent || "#22d3ee";
  const steps = projectMeta.workflow || [
    { n: "01", t: "Concept", sub: "Art handoff" },
    { n: "02", t: "Rig", sub: "Ps Â· Spine 2D" },
    { n: "03", t: "Animate", sub: "Ae Â· VFX" },
    { n: "04", t: "Polish", sub: "Loops Â· timing" },
  ];
  return (
    <div className="mt-4 flex h-full flex-col rounded-2xl border border-white/10 bg-white/2 p-5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/40">
          Pipeline
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/30">
          4 stages
        </div>
      </div>

      <div className="relative mt-5 flex-1">
        <div 
          className="pointer-events-none absolute left-[12%] right-[12%] top-[20px] h-px" 
          style={{ 
            background: `linear-gradient(to right, ${accentColor}88, ${accentColor}40, rgba(255,255,255,0.1))` 
          }}
        />
        <div className="relative grid grid-cols-4 gap-1">
          {steps.map((s, i) => (
            <div key={s.n} className="flex flex-col items-center text-center">
              <div 
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-black shadow-[0_0_0_3px_rgba(20,20,20,1)]"
                style={{
                  border: `1px solid ${accentColor}88`,
                  backgroundColor: '#141124',
                  color: accentColor
                }}
              >
                {s.n}
                {i < steps.length - 1 && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="absolute right-[-10px] top-1/2 h-3 w-3 -translate-y-1/2"
                    style={{ color: `${accentColor}b3` }}
                    aria-hidden
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                )}
              </div>
              <div className="mt-2.5 text-[11.5px] font-semibold leading-tight text-white/85">
                {s.t}
              </div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  const accentColor = projectMeta.theme?.accent || "#22d3ee";
  return (
    <div className="mb-8">
      <div 
        className="text-[11px] font-bold uppercase tracking-[0.34em]"
        style={{ color: accentColor }}
      >
        {eyebrow}
      </div>
      <h2
        className="mt-3 text-2xl font-black uppercase tracking-tight text-white md:text-3xl"
        style={{ fontFamily: "var(--font-rajdhani)" }}
      >
        {title}
      </h2>
    </div>
  );
}

function RelatedCard({
  project,
}: {
  project: (typeof relatedProjects)[number];
}) {
  const accentColor = projectMeta.theme?.accent || "#22d3ee";
  const className =
    "group overflow-hidden rounded-[24px] border border-white/10 bg-[#131013] transition-colors";
  const hoverStyle = { 
    borderColor: `${accentColor}66` 
  };
  
  const body = (
    <>
      <div className="relative h-52 w-full overflow-hidden">
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 320px"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      </div>
      <div className="p-5">
        <div 
          className="text-[11px] font-bold uppercase tracking-[0.22em]"
          style={{ color: accentColor }}
        >
          {project.badge}
        </div>
        <h3
          className="mt-3 text-lg font-black uppercase leading-tight tracking-tight text-white"
          style={{ fontFamily: "var(--font-rajdhani)" }}
        >
          {project.title}
        </h3>
        <div className="mt-4 flex gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
          <span>{project.appreciations} Appreciate</span>
          <span>{project.views} Views</span>
        </div>
      </div>
    </>
  );

  if (project.internal) {
    return (
      <Link
        href={project.href}
        className={className}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = hoverStyle.borderColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        }}
        aria-label={`Open ${project.title}`}
      >
        {body}
      </Link>
    );
  }

  return (
    <a
      href={project.href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hoverStyle.borderColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
      }}
    >
      {body}
    </a>
  );
}

export default function SummonerEra2020DetailPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[#080808] text-white">
        <section className="relative overflow-hidden border-b border-white/10 pt-20 md:pt-24" style={{ background: projectMeta.theme?.heroBackground || "radial-gradient(circle at top left, rgba(34,211,238,0.18), transparent 35%), radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 38%), linear-gradient(180deg, #0a1a1f 0%, #050a0c 75%)" }}>
          <div
            className="relative mx-auto grid gap-8 px-4 pb-6 sm:px-0 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch lg:pb-8"
            style={{ width: "min(var(--layout-width, 88%), 1280px)" }}
          >
            <div className="flex flex-col">
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/55 transition-colors hover:text-white"
              >
                <span aria-hidden>â†</span>
                Back to Portfolio
              </Link>
              <div 
                className="mt-4 text-[11px] font-bold uppercase tracking-[0.34em]"
                style={{ color: projectMeta.theme?.accent || "#22d3ee" }}
              >
                {projectMeta.eyebrow}
              </div>

              <HeroTitle />

              <p className="mt-4 max-w-xl text-[13px] leading-6 text-white/70 md:text-sm">
                {projectMeta.summary}
              </p>

              <div className="mt-2 text-[12px] text-white/55">
                Made for:{" "}
                <a
                  href={projectMeta.madeForUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#ffd966] underline-offset-2 hover:underline"
                >
                  {projectMeta.madeForLabel}
                </a>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={projectMeta.behanceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-colors"
                  style={{ 
                    backgroundColor: projectMeta.theme?.accent || "#22d3ee",
                  }}
                  onMouseEnter={(e) => {
                    const color = projectMeta.theme?.accent || "#22d3ee";
                    e.currentTarget.style.backgroundColor = `${color}dd`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = projectMeta.theme?.accent || "#22d3ee";
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  View Project on Behance
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-colors"
                  onMouseEnter={(e) => {
                    const color = projectMeta.theme?.accent || "#22d3ee";
                    e.currentTarget.style.borderColor = `${color}80`;
                    e.currentTarget.style.backgroundColor = `${color}1a`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                >
                  Ask for Similar Work
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
                  </svg>
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2.5">
                {projectMeta.heroFacts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-xl border border-white/10 bg-white/3 px-3 py-2.5"
                  >
                    <FactIcon name={fact.icon} />
                    <div className="mt-2 text-base font-black tracking-tight text-white md:text-lg">
                      {fact.value}
                    </div>
                    <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                      {fact.label}
                    </div>
                  </div>
                ))}
              </div>

              <PanelWorkflow />
            </div>

            <div className="flex h-full flex-col">
              <div className="relative aspect-video w-full overflow-hidden rounded-[26px] border border-white/10 bg-[#0d0a1a] shadow-[0_28px_70px_-28px_rgba(167,139,250,0.30),0_32px_85px_-32px_rgba(99,102,241,0.32)]">
                <Image
                  src={projectMeta.coverImage}
                  alt={projectMeta.title}
                  fill
                  priority
                  sizes="(max-width: 1280px) 55vw, 640px"
                  className="object-cover"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 via-black/5 to-[#0d0a1a]/30"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-inset ring-white/10"
                  aria-hidden
                />
              </div>

              <div className="mt-4 flex-1 grid gap-4 rounded-[24px] border border-white/10 bg-white/[0.025] p-5 md:grid-cols-3">
                <div className="flex h-full flex-col">
                  <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-white/40">
                    Deliverables
                  </div>
                  <ul className="mt-3 flex flex-1 flex-col justify-around gap-2 text-[12.5px] leading-snug text-white/75">
                    {projectMeta.deliverables.map((line) => (
                      <li key={line} className="flex gap-2">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mt-0.5 h-4 w-4 shrink-0"
                          style={{ stroke: projectMeta.theme?.accent || "#22d3ee" }}
                          aria-hidden
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="m8.5 12.5 2.5 2.5 4.5-5" />
                        </svg>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex h-full flex-col">
                  <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-white/40">
                    Tools
                  </div>
                  <ul className="mt-3 flex flex-1 flex-col justify-around gap-2 text-[12.5px] text-white/80">
                    {projectMeta.tools && projectMeta.tools.length > 0 ? projectMeta.tools.map((tool) => {
                      const logo = TOOL_LOGOS[tool];
                      return (
                        <li key={tool} className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/8">
                            {logo ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={logo}
                                alt={tool}
                                className="h-full w-full object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-[10px] font-black uppercase text-white/80">
                                {tool.slice(0, 2)}
                              </span>
                            )}
                          </span>
                          {tool}
                        </li>
                      );
                    }) : (
                      <li className="text-white/40 text-[12px]">No tools specified</li>
                    )}
                  </ul>
                </div>

                <div className="flex h-full flex-col">
                  <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-white/40">
                    Creative Fields
                  </div>
                  <div className="mt-3 flex flex-1 flex-wrap content-start gap-2">
                    {projectMeta.fields.map((field) => (
                      <span
                        key={field}
                        className="rounded-md px-3 py-1.5 text-[11px] font-medium transition-all duration-200 hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${projectMeta.theme?.accent || "#22d3ee"}20 0%, ${projectMeta.theme?.accent || "#22d3ee"}10 100%)`,
                          border: `1px solid ${projectMeta.theme?.accent || "#22d3ee"}50`,
                          color: `${projectMeta.theme?.accentSoft || "#ffffff"}ff`,
                          boxShadow: `0 2px 8px ${projectMeta.theme?.accent || "#22d3ee"}15`,
                        }}
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-3 rounded-[20px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: projectMeta.theme?.accent || "#22d3ee" }}
                    />
                    <div className="text-[11px] font-bold uppercase tracking-[0.34em] text-white/60">
                      Snapshot
                    </div>
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-[1.05fr_1fr] md:items-end">
                    <p className="max-w-xl text-[12.5px] leading-6 text-white/68">
                      {projectMeta.overview.body}
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {projectMeta.overview.stats.map((s) => (
                        <div key={s.label}>
                          <div
                            className="text-2xl font-black tracking-tight text-white md:text-3xl"
                            style={{ fontFamily: "var(--font-rajdhani)" }}
                          >
                            {s.value}
                          </div>
                          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/8 py-14 md:py-18" style={{ backgroundColor: projectMeta.theme?.showcaseSectionBg || "#0f1f24" }}>
          <div
            className="mx-auto px-4 sm:px-0"
            style={{ width: "min(var(--layout-width, 86%), 1280px)" }}
          >
            <SectionTitle eyebrow="Showcase" title="Login Screen Chapters" />
            <div className="overflow-hidden rounded-[28px]" style={{ backgroundColor: projectMeta.theme?.showcasePanelBg || "#1a2a2f" }}>
              {showcaseModules.map((module) => {
                if (module.variant === "intro") {
                  return (
                    <div
                      key={module.id}
                      className="px-6 py-10 sm:px-10 md:px-14 md:py-14"
                      style={{ backgroundColor: projectMeta.theme?.showcasePanelBg || "#1a2a2f" }}
                    >
                      <div className="mx-auto max-w-[880px]">
                        <div 
                          className="text-[10px] font-bold uppercase tracking-[0.34em]"
                          style={{ color: projectMeta.theme?.accent || "#22d3ee" }}
                        >
                          Chapter 00
                        </div>
                        <h3
                          className="mt-2 text-2xl font-black uppercase tracking-tight md:text-[28px]"
                          style={{ fontFamily: "var(--font-rajdhani)", color: "#ffffff" }}
                        >
                          {module.title}
                        </h3>
                        <div 
                          className="mt-4 h-px w-16"
                          style={{ backgroundColor: `${projectMeta.theme?.accent || "#22d3ee"}66` }}
                        />
                        <p className="mt-5 text-[14px] leading-7 text-white/80 md:text-[15px]">
                          {module.body}
                        </p>
                        <p className="mt-4 text-[13px] leading-7 italic text-white/60 md:text-sm">
                          {module.closing}
                        </p>
                      </div>
                    </div>
                  );
                }
                if (module.variant === "chapter") {
                  return (
                    <div key={module.id} style={{ backgroundColor: projectMeta.theme?.showcasePanelBg || "#1a2a2f" }}>
                      <div className="px-6 pt-10 sm:px-10 md:px-14 md:pt-12">
                        <div
                          className="text-[10px] font-bold uppercase tracking-[0.34em]"
                          style={{ color: projectMeta.theme?.accent || "#22d3ee" }}
                        >
                          Chapter Â· {module.id.replace("ch", "")}
                        </div>
                        <h3
                          className="mt-2 text-[26px] font-black uppercase leading-[1] tracking-tight md:text-[34px]"
                          style={{
                            fontFamily: "var(--font-rajdhani)",
                          }}
                        >
                          <span
                            style={{
                              color: "#ffffff",
                            }}
                          >
                            {module.title}
                          </span>
                          <span className="ml-3" style={{ color: projectMeta.theme?.accent || "#22d3ee" }}>
                            â€” {module.subtitle}
                          </span>
                        </h3>
                        <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: projectMeta.theme?.accent || "#22d3ee" }}>
                          {module.role}
                        </div>
                      </div>
                      <div className="mt-6 px-3 pb-6 sm:px-4 md:mt-8 md:pb-10">
                        <div
                          className="relative mx-auto w-full max-w-[1600px] overflow-hidden rounded-[18px] bg-black shadow-[0_18px_50px_-22px_rgba(0,0,0,0.55)]"
                          style={{ aspectRatio: module.aspectRatio }}
                        >
                          <iframe
                            src={module.embedSrc}
                            title={`${projectMeta.title} â€” ${module.title}`}
                            className="absolute inset-0 h-full w-full border-0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </div>
                  );
                }
                if (module.variant === "outro") {
                  return (
                    <div
                      key={module.id}
                      className="px-6 py-14 text-center sm:px-10 md:py-20"
                      style={{ backgroundColor: projectMeta.theme?.showcasePanelBg || "#1a2a2f" }}
                    >
                      <div className="mx-auto max-w-[680px]">
                        <div 
                          className="mx-auto h-px w-16"
                          style={{ backgroundColor: `${projectMeta.theme?.accent || "#22d3ee"}66` }}
                        />
                        <p
                          className="mt-6 text-[20px] font-black uppercase leading-[1.2] tracking-[0.04em] md:text-[26px]"
                          style={{ fontFamily: "var(--font-rajdhani)", color: "#ffffff" }}
                        >
                          {module.text}
                        </p>
                        <div 
                          className="mx-auto mt-6 h-px w-16"
                          style={{ backgroundColor: `${projectMeta.theme?.accent || "#22d3ee"}66` }}
                        />
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,#0f0c1a_0%,#070512_100%)] py-14 md:py-18">
          <div
            className="mx-auto px-4 sm:px-0"
            style={{ width: "min(var(--layout-width, 86%), 1280px)" }}
          >
            <SectionTitle eyebrow="More Projects" title="Related Work" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {relatedProjects.map((project) => (
                <RelatedCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
