import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Company Profile",
  description:
    "TD Games Studio — Vietnam-based 2D Art, Animation & VFX outsourcing studio. 50+ projects delivered engine-ready for Unity, Cocos and Spine pipelines.",
};

// ponytail: toàn bộ nội dung là hằng số trong file này — 1 trang tĩnh, không API/DB.
// Trình bày theo nhịp "deck": mỗi ý một màn hình, dividers ảnh full-bleed, đánh số
// trang như file PDF company profile. Muốn sếp sửa qua /admin thì tách sang
// page_slots / settings sau — chưa cần khi nội dung mỗi quý mới đổi một lần.
//
// ⚠ SỐ LIỆU DƯỚI ĐÂY LÀ PLACEHOLDER — sếp verify trước khi gửi khách.

const A = "#f59e0b";

const CDN = "https://cdn.tdgamestudio.com/landing";
const IMG = {
  summoner: `${CDN}/images/summonerDetail.png`,
  axie: `${CDN}/behance/b173c85213385cf6.png`,
  mytheria: `${CDN}/behance/9bfe7e73a64fc7d4.png`,
  skyMavis: `${CDN}/behance/e3eeb2716aa68b48.png`,
  horse: `${CDN}/behance/50a462dee6f25801.jpg`,
  boss: `${CDN}/behance/379f981b88c6a84f.png`,
  reaper: `${CDN}/behance/87a63a36f47dc948.png`,
  artStudy: `${CDN}/behance/2e9463653cd72994.jpg`,
  kayn: encodeURI(`${CDN}/images/Screenshot 2026-05-13 232709.png`),
};

const STATS = [
  { value: "2023", label: "Founded" },
  { value: "50+", label: "Projects delivered" },
  { value: "12+", label: "Happy clients" },
  { value: "1200+", label: "Assets shipped" },
];

const HIGHLIGHTS = [
  { n: "01", t: "Who We Are" },
  { n: "02", t: "What We Offer" },
  { n: "03", t: "Why Choose Us" },
  { n: "04", t: "How We Work" },
];

const PIPELINE = [
  { t: "2D Art", d: "Concept, environment, UI, splash" },
  { t: "2D Animation", d: "Spine skeletal & frame-by-frame" },
  { t: "2D VFX", d: "Skill, combat, UI effects" },
  { t: "Engine-ready", d: "Unity / Cocos exports & atlases" },
];

const SERVICES = [
  {
    n: "01",
    title: "2D Art",
    href: "/services/2d-art",
    stat: "25+ projects",
    desc: "Stylized visuals built for readability, consistency, and game-ready production.",
    image: IMG.artStudy,
    items: [
      "Character concept",
      "Environment art",
      "UI/UX design",
      "Illustration & splash art",
      "Casual game art",
      "Props & items",
    ],
  },
  {
    n: "02",
    title: "2D Animation",
    href: "/services/2d-animation",
    stat: "30+ projects",
    desc: "Spine 2D skeletal and frame-by-frame motion, from combat sets to cinematic login screens.",
    image: IMG.summoner,
    items: [
      "Character animation",
      "UI animation",
      "Login screen animation",
      "Cutscene",
      "Cinematic",
      "3D animation",
    ],
  },
  {
    n: "03",
    title: "2D VFX",
    href: "/services/2d-vfx",
    stat: "15+ projects",
    desc: "Dynamic skill effects and UI flourishes, delivered Spine-integrated or as sprite sheets.",
    image: IMG.mytheria,
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
  { group: "Animation", tools: ["Spine 2D", "After Effects", "Frame-by-frame", "Dragon Bones"] },
  { group: "Art", tools: ["Photoshop", "Clip Studio Paint", "Illustrator", "Procreate"] },
  { group: "Engines", tools: ["Unity", "Cocos Creator", "Custom pipelines"] },
  {
    group: "Deliverables",
    tools: ["Layered PSD", "Spine source + atlas", "Sprite sheets", "Frame sequences"],
  },
];

const WORK = [
  {
    slug: "axie-infinity-origins",
    title: "Axie Infinity — Origins",
    client: "Sky Mavis",
    image: IMG.axie,
  },
  {
    slug: "summoner-era",
    title: "Summoner Era — Heroes Light/Dark",
    client: "Zitga Studio",
    image: IMG.summoner,
  },
  {
    slug: "kayn-snow-moon",
    title: "Kayn Snow Moon — Login Screen",
    client: "League of Legends (fanmade)",
    image: IMG.kayn,
  },
  {
    slug: "horse-racing",
    title: "Horse Racing — Splash Art",
    client: "INVINCIBLE GG",
    image: IMG.horse,
  },
  {
    slug: "battle-of-the-gods-mytheria",
    title: "Battle of the Gods",
    client: "Mytheria",
    image: IMG.mytheria,
  },
  {
    slug: "boss-animation",
    title: "Boss Animation — The Twins",
    client: "AnimVFX Clan",
    image: IMG.boss,
  },
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
    fit: "Best when the scope is already clear: one skill VFX set, one login screen, one character batch.",
  },
  {
    title: "Dedicated art team",
    sub: "Monthly, scale up or down",
    steps: ["Brief", "Pick artists", "Trial batch", "Weekly sprints", "Scale"],
    fit: "Best when you need steady monthly output from a team that knows your game's style.",
  },
];

/* ---------------------------------------------------------------- primitives */

const WRAP = { width: "min(var(--layout-width, 88%), 1280px)" };

/** Một "slide": chiếm gần trọn màn hình, có số trang góc phải như file PDF. */
function Slide({
  page,
  eyebrow,
  title,
  children,
  className = "",
}: {
  page: number;
  eyebrow?: string;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative flex min-h-[100svh] flex-col justify-center border-t border-white/[0.06] py-24 ${className}`}
    >
      <div className="mx-auto w-full" style={WRAP}>
        <div className="mb-10 flex items-baseline justify-between gap-6">
          <div>
            {eyebrow ? (
              <p
                className="mb-3 text-[12px] font-bold uppercase tracking-[0.3em]"
                style={{ color: A }}
              >
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="max-w-4xl text-[clamp(2rem,5vw,3.75rem)] font-black uppercase leading-[1.02] tracking-tight text-white">
                {title}
              </h2>
            ) : null}
          </div>
          <span className="hidden shrink-0 font-mono text-xs text-white/30 md:block">
            Company profile / {String(page).padStart(2, "0")}
          </span>
        </div>
        {children}
      </div>
    </section>
  );
}

/** Slide ngăn chương: ảnh full-bleed + tiêu đề trắng cực to (nhịp của ITS). */
function Divider({
  page,
  kicker,
  title,
  image,
}: {
  page: number;
  kicker: string;
  title: string;
  image: string;
}) {
  return (
    <section className="relative flex min-h-[70svh] items-center overflow-hidden md:min-h-[85svh]">
      <Image
        src={image}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/40" />
      <div className="relative mx-auto w-full" style={WRAP}>
        <p className="mb-4 font-mono text-sm" style={{ color: A }}>
          {kicker}
        </p>
        <h2 className="max-w-3xl text-[clamp(2.5rem,8vw,6rem)] font-black uppercase leading-[0.92] text-white">
          {title}
        </h2>
        <span className="absolute right-0 top-0 hidden font-mono text-xs text-white/40 md:block">
          {String(page).padStart(2, "0")}
        </span>
      </div>
    </section>
  );
}

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

/* --------------------------------------------------------------------- page */

export default function CompanyProfilePage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[#0a0a0a] pt-[76px] md:pt-[84px]">
        {/* 01 — Cover */}
        <section className="relative flex min-h-[100svh] items-center overflow-hidden">
          <Image
            src={IMG.skyMavis}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover opacity-40"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{ background: `radial-gradient(60% 50% at 15% 10%, ${A} 0%, transparent 70%)` }}
          />
          <div className="relative mx-auto w-full py-24" style={WRAP}>
            <p className="mb-6 text-[11px] uppercase tracking-[0.5em]" style={{ color: A }}>
              TD Games Studio · Company Profile
            </p>
            <h1 className="max-w-4xl text-[clamp(2.75rem,8vw,6.5rem)] font-black uppercase leading-[0.92] text-white">
              Company
              <br />
              <span style={{ color: A }}>Profile</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
              2D Art, Animation &amp; VFX outsourcing for games. Hanoi, Vietnam — delivering
              engine-ready assets for mobile, PC and web titles since 2023.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="rounded-full px-8 py-4 text-sm font-bold uppercase tracking-wider text-black transition hover:opacity-90"
                style={{ background: A }}
              >
                Start a project
              </Link>
              <Link
                href="/portfolio"
                className="rounded-full border border-white/20 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:border-white/50"
              >
                View portfolio
              </Link>
            </div>
          </div>
        </section>

        {/* 02 — Content highlights */}
        <Slide page={2} eyebrow="Contents" title="Content Highlights">
          <div className="grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map((h) => (
              <div key={h.n}>
                <div className="text-[clamp(3.5rem,8vw,5.5rem)] font-black leading-none text-white">
                  {h.n}
                </div>
                <div
                  className="mt-3 text-lg font-bold uppercase tracking-wide"
                  style={{ color: A }}
                >
                  {h.t}
                </div>
              </div>
            ))}
          </div>
        </Slide>

        {/* 03 — Divider */}
        <Divider page={3} kicker="01" title="About TD Games" image={IMG.summoner} />

        {/* 04 — Who we are */}
        <Slide page={4} eyebrow="01 / Who We Are" title="A Boutique Game Art Studio In Hanoi">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-lg leading-relaxed text-white/70">
                TD Games Company Limited is a 2D art, animation and VFX studio founded in 2023. We
                work as an extension of your art team — taking a style guide and returning
                production-ready assets that drop straight into the build.
              </p>
              <div className="mt-10 grid grid-cols-2 gap-4">
                {STATS.map((s, i) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border p-6"
                    style={
                      i === 0
                        ? { background: A, borderColor: A }
                        : { background: "#121215", borderColor: "rgba(255,255,255,0.08)" }
                    }
                  >
                    <div
                      className="text-4xl font-black leading-none"
                      style={{ color: i === 0 ? "#000" : "#fff" }}
                    >
                      {s.value}
                    </div>
                    <div
                      className="mt-2 text-xs uppercase tracking-wider"
                      style={{ color: i === 0 ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.5)" }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-white/[0.08]">
              <Image
                src={IMG.reaper}
                alt="TD Games studio work"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </Slide>

        {/* 05 — Pipeline */}
        <Slide page={5} eyebrow="01 / Who We Are" title="One Studio, The Whole 2D Pipeline">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map((p, i) => (
              <div
                key={p.t}
                className="rounded-2xl border border-white/[0.08] bg-[#121215] p-8"
              >
                <div className="mb-5 font-mono text-sm" style={{ color: A }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="text-xl font-bold text-white">{p.t}</div>
                <div className="mt-2 text-sm leading-relaxed text-white/55">{p.d}</div>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-3xl text-white/55">
            No hand-offs between vendors, no style drift between art and animation — the same team
            carries a character from concept sheet to rigged, VFX-lit, engine-ready asset.
          </p>
        </Slide>

        {/* 06 — Clients breakdown */}
        <Slide page={6} eyebrow="01 / Who We Are" title="Where Our Work Goes">
          <div className="grid gap-8 lg:grid-cols-2">
            <Donut data={GEO} caption="Client geography" />
            <Donut data={GENRE} caption="Game genres" />
          </div>
        </Slide>

        {/* 07 — Divider */}
        <Divider page={7} kicker="02" title="What We Offer" image={IMG.mytheria} />

        {/* 08 — Services overview */}
        <Slide page={8} eyebrow="02 / What We Offer" title="Our Main Services">
          <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {SERVICES.map((s) => (
              <Link
                key={s.n}
                href={s.href}
                className="group flex flex-wrap items-center gap-6 py-8 transition hover:bg-white/[0.02]"
              >
                <span className="font-mono text-sm" style={{ color: A }}>
                  {s.n}
                </span>
                <span className="text-[clamp(1.75rem,4vw,3rem)] font-black uppercase leading-none text-white transition group-hover:translate-x-2">
                  {s.title}
                </span>
                <span className="ml-auto text-sm text-white/45">{s.stat}</span>
              </Link>
            ))}
          </div>
        </Slide>

        {/* 09, 10, 11 — mỗi dịch vụ một slide */}
        {SERVICES.map((s, i) => (
          <Slide
            key={s.n}
            page={9 + i}
            eyebrow={`02 / Service ${s.n}`}
            title={s.title}
          >
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <p className="text-lg leading-relaxed text-white/70">{s.desc}</p>
                <ul className="mt-8 space-y-4">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-center gap-4 text-white/80">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: A }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={s.href}
                  className="mt-10 inline-flex text-sm font-bold uppercase tracking-wider transition hover:opacity-70"
                  style={{ color: A }}
                >
                  See {s.title} work →
                </Link>
              </div>
              <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-white/[0.08]">
                <Image
                  src={s.image}
                  alt={`${s.title} sample`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Slide>
        ))}

        {/* 12 — Divider */}
        <Divider page={12} kicker="03" title="Why Choose TD Games" image={IMG.horse} />

        {/* 13 — Value propositions */}
        <Slide page={13} eyebrow="03 / Why Choose Us" title="Value Propositions">
          <div className="grid gap-6 md:grid-cols-2">
            {WHY.map((w) => (
              <div
                key={w.title}
                className="rounded-2xl border border-white/[0.08] bg-[#121215] p-8"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-black"
                    style={{ background: A }}
                  >
                    ✓
                  </span>
                  <h3 className="text-xl font-bold text-white">{w.title}</h3>
                </div>
                <p className="leading-relaxed text-white/60">{w.body}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* 14 — Technical capability */}
        <Slide page={14} eyebrow="03 / Why Choose Us" title="Technical Capability">
          <div className="grid gap-6 md:grid-cols-2">
            {STACK.map((g) => (
              <div
                key={g.group}
                className="rounded-2xl border border-white/[0.08] bg-[#121215] p-8"
              >
                <div
                  className="mb-5 text-sm font-bold uppercase tracking-[0.2em]"
                  style={{ color: A }}
                >
                  {g.group}
                </div>
                <ul className="space-y-3">
                  {g.tools.map((t) => (
                    <li key={t} className="text-white/70">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Slide>

        {/* 15 — Selected work */}
        <Slide page={15} eyebrow="03 / Why Choose Us" title="Selected Work">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WORK.map((w) => (
              <Link
                key={w.slug}
                href={`/portfolio/${w.slug}`}
                className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121215] transition hover:border-white/25"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={w.image}
                    alt={w.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="text-sm font-bold text-white">{w.title}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-white/40">
                    {w.client}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/portfolio"
            className="mt-10 inline-flex text-sm font-bold uppercase tracking-wider transition hover:opacity-70"
            style={{ color: A }}
          >
            View full portfolio →
          </Link>
        </Slide>

        {/* 16 — Clients */}
        <Slide page={16} eyebrow="03 / Why Choose Us" title="Studios We've Worked With">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
            {CLIENTS.map((c) => (
              <div
                key={c}
                className="flex min-h-[120px] items-center justify-center bg-[#121215] px-6 text-center text-lg font-bold text-white/70"
              >
                {c}
              </div>
            ))}
          </div>
        </Slide>

        {/* 17 — Divider */}
        <Divider page={17} kicker="04" title="How We Work" image={IMG.axie} />

        {/* 18 — Engagement models */}
        <Slide page={18} eyebrow="04 / How We Work" title="Engagement Models">
          <div className="grid gap-6 lg:grid-cols-2">
            {ENGAGEMENT.map((e) => (
              <div
                key={e.title}
                className="rounded-2xl border border-white/[0.08] bg-[#121215] p-8"
              >
                <h3 className="text-2xl font-bold text-white">{e.title}</h3>
                <p className="mt-1 text-sm uppercase tracking-wider" style={{ color: A }}>
                  {e.sub}
                </p>
                <ol className="mt-8 space-y-4">
                  {e.steps.map((step, i) => (
                    <li key={step} className="flex items-center gap-4">
                      <span className="font-mono text-xs text-white/35">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="h-px flex-1" style={{ background: `${A}55` }} />
                      <span className="w-40 shrink-0 text-right text-sm text-white/80">{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-8 text-sm leading-relaxed text-white/50">{e.fit}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* 19 — Process */}
        <Slide page={19} eyebrow="04 / How We Work" title="From Brief To Handoff">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p) => (
              <div key={p.n} className="border-t-2 pt-6" style={{ borderColor: A }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">{p.n}</span>
                  <span className="font-mono text-xs text-white/40">{p.when}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{p.body}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* 20 — Closing */}
        <section className="relative flex min-h-[85svh] items-center overflow-hidden">
          <Image
            src={IMG.kayn}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-30"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]/50" />
          <div className="relative mx-auto w-full py-24" style={WRAP}>
            <h2 className="max-w-3xl text-[clamp(2.5rem,7vw,5rem)] font-black uppercase leading-[0.95] text-white">
              Let&apos;s build great
              <br />
              things <span style={{ color: A }}>together</span>
            </h2>
            <dl className="mt-12 grid gap-8 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.25em] text-white/40">Studio</dt>
                <dd className="mt-2 text-white/80">
                  Xom Ngoai, Dong Anh Commune
                  <br />
                  Hanoi, Vietnam (GMT+7)
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.25em] text-white/40">Email</dt>
                <dd className="mt-2 text-white/80">tdgames.vn@gmail.com</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.25em] text-white/40">Web</dt>
                <dd className="mt-2 text-white/80">tdgamestudio.com</dd>
              </div>
            </dl>
            <Link
              href="/contact"
              className="mt-12 inline-flex rounded-full px-10 py-4 text-sm font-bold uppercase tracking-wider text-black transition hover:opacity-90"
              style={{ background: A }}
            >
              Request a quote
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
