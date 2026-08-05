import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Company Profile",
  description:
    "TD Games Studio — Vietnam-based 2D Art, Animation & VFX outsourcing studio. 50+ projects delivered engine-ready for Unity, Cocos and Spine pipelines.",
};

// ponytail: toàn bộ nội dung là hằng số trong file này — 1 trang tĩnh, không API/DB.
// Số liệu copy từ home-page-lower.tsx / about/page.tsx (đang hardcode 3 nơi sẵn).
// Muốn sếp sửa được qua /admin thì tách sang page_slots / settings sau.

const STATS = [
  { value: "2023", label: "Founded" },
  { value: "50+", label: "Projects delivered" },
  { value: "12+", label: "Happy clients" },
  { value: "1200+", label: "Assets shipped" },
  { value: "7", label: "Creative team" },
  { value: "GMT+7", label: "Hanoi, Vietnam" },
];

const SERVICES = [
  {
    n: "01",
    title: "2D Art",
    href: "/services/2d-art",
    stat: "25+ projects",
    desc: "Stylized visuals built for readability, consistency, and game-ready production.",
    items: [
      "Character Concept",
      "Environment Art",
      "UI/UX Design",
      "Illustration",
      "Casual Game Art",
      "Props & Items",
    ],
  },
  {
    n: "02",
    title: "2D Animation",
    href: "/services/2d-animation",
    stat: "30+ projects",
    desc: "Spine 2D skeletal and frame-by-frame motion, from combat sets to cinematic login screens.",
    items: [
      "Character Animation",
      "UI Animation",
      "Login Animation",
      "Cutscene",
      "Cinematic",
      "3D Animation",
    ],
  },
  {
    n: "03",
    title: "2D VFX",
    href: "/services/2d-vfx",
    stat: "15+ projects",
    desc: "Dynamic skill effects and UI flourishes, delivered Spine-integrated or as sprite sheets.",
    items: [
      "Character VFX",
      "Combat VFX",
      "Environment VFX",
      "UI VFX",
      "Spine VFX",
      "Cinematic VFX",
    ],
  },
];

const WHY = [
  {
    title: "Ship-ready quality",
    body: "Every asset matches your style guide and passes an in-house art review before hand-off — you get work that ships, not work you have to fix.",
  },
  {
    title: "Low-risk start",
    body: "Begin with a small paid trial batch. See our real output and pipeline fit before you commit budget to full production.",
  },
  {
    title: "Engine-ready delivery",
    body: "Spine rigs, sprite sheets and atlases exported for Unity, Cocos or your engine — drop them into the build, no re-export loop on your side.",
  },
  {
    title: "NDA & IP protection",
    body: "Your concepts, references and unreleased work stay yours — NDA-friendly process and controlled access from the first file we touch.",
  },
];

const PROCESS = [
  {
    n: "01",
    when: "24–48h",
    title: "Brief & scope",
    body: "Send references, target style, and asset count. You get a fixed scope, a quote, and a delivery schedule back — before anyone starts drawing.",
  },
  {
    n: "02",
    when: "First asset",
    title: "Style lock",
    body: "We produce one asset and iterate until it matches your game. Nothing goes into volume production until you sign off on that piece.",
  },
  {
    n: "03",
    when: "Every week",
    title: "Production sprints",
    body: "Assets ship in batches with one producer as your only point of contact. Feedback lives in a single thread, not five inboxes.",
  },
  {
    n: "04",
    when: "On delivery",
    title: "Handoff & aftercare",
    body: "Layered source files plus engine-ready exports — PSD, Spine, sprite sheets — and the revision rounds agreed in the scope.",
  },
];

const STACK = [
  { group: "Animation", tools: ["Spine 2D", "After Effects", "Frame-by-frame"] },
  { group: "Art", tools: ["Photoshop", "Clip Studio", "Illustrator"] },
  { group: "Engines", tools: ["Unity", "Cocos", "Custom pipelines"] },
  {
    group: "Deliverables",
    tools: ["Layered PSD", "Spine source + atlas", "Sprite sheets", "Frame sequences"],
  },
];

const WORK = [
  { slug: "axie-infinity-origins", title: "Axie Infinity — Origins", client: "Sky Mavis" },
  { slug: "summoner-era", title: "Summoner Era — Heroes Light/Dark", client: "Zitga Studio" },
  { slug: "kayn-snow-moon", title: "Kayn Snow Moon — Login Screen", client: "League of Legends (fanmade)" },
  { slug: "horse-racing", title: "Horse Racing — Splash Art", client: "INVINCIBLE GG" },
  { slug: "battle-of-the-gods-mytheria", title: "Battle of the Gods", client: "Mytheria" },
  { slug: "boss-animation", title: "Boss Animation — The Twins", client: "AnimVFX Clan" },
];

// ponytail: số liệu demo — sếp sửa trực tiếp trong file này.
const HIGHLIGHTS = [
  { n: "01", t: "Who we are" },
  { n: "02", t: "What we offer" },
  { n: "03", t: "Why choose us" },
  { n: "04", t: "How we work" },
  { n: "05", t: "Selected work" },
];

// [label, %, màu] — tổng phải = 100
const GEO: [string, number, string][] = [
  ["Vietnam", 45, "#f59e0b"],
  ["APAC", 30, "#b45309"],
  ["US / EU", 25, "#78350f"],
];
const GENRE: [string, number, string][] = [
  ["RPG / Gacha", 40, "#f59e0b"],
  ["Casual / Puzzle", 25, "#d97706"],
  ["MOBA / Action", 20, "#b45309"],
  ["Web3 / NFT", 15, "#78350f"],
];

const CLIENTS = [
  "Sky Mavis",
  "Zitga Studio",
  "Mytheria",
  "INVINCIBLE GG",
  "AnimVFX Clan",
  "Funtap",
  "Gamota",
  "VNG",
];

const ENGAGEMENT = [
  {
    title: "Project-based",
    sub: "Fixed scope, fixed price",
    steps: ["Brief", "Quote & scope", "Style lock", "Production", "Delivery"],
    fit: "Phù hợp khi đã có scope rõ: một bộ skill VFX, một login screen, một set nhân vật.",
  },
  {
    title: "Dedicated art team",
    sub: "Monthly, scale up/down",
    steps: ["Brief", "Chọn artist", "Trial batch", "Sprint hàng tuần", "Scale"],
    fit: "Phù hợp khi cần output đều hàng tháng và muốn team quen style của game.",
  },
];

const A = "#f59e0b";

function Donut({ data, caption }: { data: [string, number, string][]; caption: string }) {
  const stops = data
    .map(([, pct, color], i) => {
      const from = data.slice(0, i).reduce((sum, [, p]) => sum + p, 0);
      return `${color} ${from}% ${from + pct}%`;
    })
    .join(", ");
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-8">
      <div className="mb-6 text-[11px] uppercase tracking-[0.25em] text-white/45">{caption}</div>
      <div className="flex flex-wrap items-center gap-8">
        <div
          className="h-40 w-40 shrink-0 rounded-full"
          style={{
            background: `conic-gradient(${stops})`,
            mask: "radial-gradient(circle, transparent 52%, #000 53%)",
            WebkitMask: "radial-gradient(circle, transparent 52%, #000 53%)",
          }}
        />
        <ul className="space-y-3">
          {data.map(([label, pct, color]) => (
            <li key={label} className="flex items-center gap-3 text-sm text-white/70">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
              <span className="w-36">{label}</span>
              <span className="font-mono text-white/45">{pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Section({
  n,
  eyebrow,
  title,
  children,
}: {
  n: string;
  eyebrow: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-white/[0.06] py-20 md:py-28">
      <div className="mx-auto" style={{ width: "min(var(--layout-width, 85%), 1240px)" }}>
        <div className="mb-12 flex items-baseline gap-4">
          <span className="font-mono text-sm" style={{ color: A }}>
            {"// "}
            {n}
          </span>
          <span className="text-[11px] uppercase tracking-[0.4em] text-white/40">{eyebrow}</span>
        </div>
        <h2 className="mb-10 max-w-3xl text-3xl font-bold uppercase leading-[1.1] tracking-tight text-white md:text-5xl">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

export default function CompanyProfilePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#0a0a0a] pt-[76px] md:pt-[84px]">
        {/* Cover */}
        <section className="relative overflow-hidden py-24 md:py-36">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{ background: `radial-gradient(60% 50% at 20% 0%, ${A} 0%, transparent 70%)` }}
          />
          <div
            className="relative mx-auto"
            style={{ width: "min(var(--layout-width, 85%), 1240px)" }}
          >
            <p className="mb-6 text-[11px] uppercase tracking-[0.5em]" style={{ color: A }}>
              Company Profile · 2026
            </p>
            <h1 className="max-w-4xl text-[clamp(2.5rem,7vw,5.5rem)] font-black uppercase leading-[0.95] text-white">
              2D Art & Animation
              <br />
              Outsourcing <span style={{ color: A }}>Studio</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70">
              Founded in 2023 in Hanoi, Vietnam. TD Games delivers production-ready game art,
              animation and VFX for mobile, PC and web titles — engine-ready, on schedule.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="rounded-full px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-black transition hover:brightness-110"
                style={{ background: A }}
              >
                Start a project
              </Link>
              <Link
                href="/portfolio"
                className="rounded-full border border-white/20 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:border-white/50"
              >
                View portfolio
              </Link>
            </div>
          </div>
        </section>

        {/* Content highlights */}
        <section className="border-t border-white/[0.06] py-16">
          <div className="mx-auto" style={{ width: "min(var(--layout-width, 85%), 1240px)" }}>
            <div className="mb-10 text-[11px] uppercase tracking-[0.4em] text-white/40">
              Content highlights
            </div>
            <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {HIGHLIGHTS.map((h) => (
                <div key={h.n}>
                  <div className="text-3xl font-black text-white/15">{h.n}</div>
                  <div className="mt-2 text-sm font-semibold uppercase tracking-wide" style={{ color: A }}>
                    {h.t}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 01 Who we are */}
        <Section
          n="01"
          eyebrow="Who we are"
          title={
            <>
              A compact team
              <br />
              with <span style={{ color: A }}>big passion</span>
            </>
          }
        >
          <p className="mb-14 max-w-3xl text-lg leading-relaxed text-white/60">
            TD Games Company Limited is a boutique game outsourcing studio based in Hanoi. We work
            closely with clients to understand their vision and bring it to life through animation,
            VFX and illustration. Every project is approached with passion, precision, and a
            commitment to building long-term partnerships.
          </p>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/[0.06] md:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label} className="bg-[#111114] px-6 py-10 text-center">
                <div className="text-4xl font-black md:text-5xl" style={{ color: A }}>
                  {s.value}
                </div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/45">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Donut data={GEO} caption="Client geography" />
            <Donut data={GENRE} caption="Game genres we ship" />
          </div>
        </Section>

        {/* 02 What we offer */}
        <Section
          n="02"
          eyebrow="What we offer"
          title={
            <>
              Our main <span style={{ color: A }}>services</span>
            </>
          }
        >
          <div className="grid gap-6 md:grid-cols-3">
            {SERVICES.map((s) => (
              <Link
                key={s.title}
                href={s.href}
                className="group rounded-2xl border border-white/[0.08] bg-[#121215] p-8 transition hover:border-[#f59e0b]/50"
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-mono text-xs text-white/30">{s.n}</span>
                  <span className="text-[11px] uppercase tracking-widest" style={{ color: A }}>
                    {s.stat}
                  </span>
                </div>
                <h3 className="text-2xl font-bold uppercase text-white">{s.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/55">{s.desc}</p>
                <ul className="mt-7 space-y-2.5 border-t border-white/[0.08] pt-6">
                  {s.items.map((i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white/70">
                      <span
                        className="h-1 w-1 shrink-0 rounded-full"
                        style={{ background: A }}
                      />
                      {i}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </Section>

        {/* 03 Why choose us */}
        <Section
          n="03"
          eyebrow="Why choose us"
          title={
            <>
              Why studios <span style={{ color: A }}>come back</span>
            </>
          }
        >
          <div className="grid gap-px overflow-hidden rounded-2xl bg-white/[0.06] md:grid-cols-2">
            {WHY.map((w) => (
              <div key={w.title} className="bg-[#111114] p-8 md:p-10">
                <h3 className="text-lg font-bold uppercase tracking-wide text-white">{w.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/55">{w.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 04 How we work */}
        <Section
          n="04"
          eyebrow="How we work"
          title={
            <>
              From brief to <span style={{ color: A }}>final delivery</span>
            </>
          }
        >
          <div className="grid gap-6 md:grid-cols-4">
            {PROCESS.map((p) => (
              <div key={p.n} className="rounded-2xl border border-white/[0.08] bg-[#121215] p-7">
                <div className="mb-5 flex items-baseline gap-3">
                  <span className="text-3xl font-black" style={{ color: A }}>
                    {p.n}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                    {p.when}
                  </span>
                </div>
                <h3 className="text-base font-bold uppercase text-white">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{p.body}</p>
              </div>
            ))}
          </div>

          <h3 className="mb-8 mt-20 text-xl font-bold uppercase tracking-wide text-white">
            Engagement models
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            {ENGAGEMENT.map((e) => (
              <div key={e.title} className="rounded-2xl border border-white/[0.08] bg-[#121215] p-8">
                <h4 className="text-lg font-bold uppercase text-white">{e.title}</h4>
                <div className="mt-1 text-[11px] uppercase tracking-[0.2em]" style={{ color: A }}>
                  {e.sub}
                </div>
                <ol className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-3">
                  {e.steps.map((s, i) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-white/70">
                      {i > 0 && <span className="text-white/25">→</span>}
                      <span className="rounded-full border border-white/10 px-3 py-1">{s}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 text-sm leading-relaxed text-white/50">{e.fit}</p>
              </div>
            ))}
          </div>

          <h3 className="mb-8 mt-20 text-xl font-bold uppercase tracking-wide text-white">
            Tools & pipeline
          </h3>
          <div className="grid gap-6 md:grid-cols-4">
            {STACK.map((g) => (
              <div key={g.group}>
                <div
                  className="mb-4 border-b pb-3 text-[11px] uppercase tracking-[0.25em]"
                  style={{ color: A, borderColor: "rgba(245,158,11,0.25)" }}
                >
                  {g.group}
                </div>
                <ul className="space-y-2">
                  {g.tools.map((t) => (
                    <li key={t} className="text-sm text-white/65">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* 05 Selected work */}
        <Section
          n="05"
          eyebrow="Selected work"
          title={
            <>
              Trusted by <span style={{ color: A }}>game studios</span>
            </>
          }
        >
          <div className="grid gap-px overflow-hidden rounded-2xl bg-white/[0.06] md:grid-cols-3">
            {WORK.map((w) => (
              <Link
                key={w.slug}
                href={`/portfolio/${w.slug}`}
                className="group bg-[#111114] p-8 transition hover:bg-[#16161a]"
              >
                <div className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                  {w.client}
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-snug text-white group-hover:text-[#f59e0b]">
                  {w.title}
                </h3>
              </Link>
            ))}
          </div>
          <div className="mt-16 flex flex-wrap items-center gap-x-10 gap-y-5">
            {CLIENTS.map((c) => (
              <span
                key={c}
                className="text-lg font-semibold uppercase tracking-wide text-white/30 transition hover:text-white/70"
              >
                {c}
              </span>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/portfolio"
              className="text-sm font-semibold uppercase tracking-widest"
              style={{ color: A }}
            >
              See all 16 case studies →
            </Link>
          </div>
        </Section>

        {/* Contact */}
        <section className="border-t border-white/[0.06] py-24 md:py-32">
          <div
            className="mx-auto text-center"
            style={{ width: "min(var(--layout-width, 85%), 1240px)" }}
          >
            <h2 className="text-3xl font-black uppercase leading-tight text-white md:text-5xl">
              Let&rsquo;s build <span style={{ color: A }}>great things</span> together
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-white/55">
              Tell us about your project and our team will get back to you within 24 hours.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-white/70">
              <a href="mailto:tdgames.vn@gmail.com" className="hover:text-white">
                tdgames.vn@gmail.com
              </a>
              <a
                href="https://www.behance.net/AnimVFXClan"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                behance.net/AnimVFXClan
              </a>
              <span>tdgamestudio.com</span>
              <span className="text-white/40">505 Minh Khai, Hanoi, Vietnam</span>
            </div>
            <Link
              href="/contact"
              className="mt-12 inline-block rounded-full px-10 py-4 text-sm font-semibold uppercase tracking-wider text-black transition hover:brightness-110"
              style={{ background: A }}
            >
              Get in touch
            </Link>
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
