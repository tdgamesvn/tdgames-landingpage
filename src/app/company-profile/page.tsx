import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ProfileHeader from "./_header";
import Reveal from "./_reveal";
import {
  StudioServiceCardsGrid,
  type StudioServiceCard,
} from "@/components/studio-service-cards";
import siteContent from "@/content/site.json";

export const metadata: Metadata = {
  title: "Company Profile",
  description:
    "TD Games Studio — Vietnam-based 2D Art, Animation & VFX outsourcing studio. 50+ projects delivered engine-ready for Unity, Cocos and Spine pipelines.",
};

/* ============================================================================
 * ponytail: trang tĩnh, không API/DB. Sếp sửa trực tiếp các hằng số dưới đây.
 *
 * LAYOUT RULES (rút từ Room 8, Lemon Sky, Sparx*, Glass Egg — studio game art
 * thật, không phải deck PDF). Phá 4 luật này là trang tụt về hạng template:
 *   1. Continuous scroll, KHÔNG full-screen slide.
 *   2. Artwork bleed sát mép — không viền, không bo góc, không card.
 *   3. Amber #f59e0b chỉ cho CTA + gạch nhấn nhỏ. Art tự cung cấp màu.
 *   4. Không đánh số section (01/02/03).
 *
 * ⚠️⚠️ DỮ LIỆU BỊA — SẾP PHẢI SỬA TRƯỚC KHI GỬI KHÁCH ⚠️⚠️
 * Các khối dưới đây em điền số hợp lý để có layout, KHÔNG phải số thật:
 *   COMPANY.taxId, COMPANY.phone     — chưa ai cho em MST và số điện thoại
 *   STATS                            — 2023/50+/12+/1200+ copy từ trang cũ, chưa verify
 *   TEAM                             — cơ cấu 12 người là bịa hoàn toàn
 *   CAPACITY                         — throughput/tháng là bịa hoàn toàn
 *   CASE_STUDY.metrics               — số asset/timeline là bịa
 *   TESTIMONIALS                     — 3 quote + tên người là BỊA 100%.
 *                                      Gửi khách mà chưa xin phép = rủi ro pháp lý.
 *   RATES                            — khoảng giá là bịa, sếp tự đặt
 *   CLIENTS                          — Funtap/Gamota/VNG cần xác nhận là khách thật
 * ========================================================================== */

const A = "#f59e0b";

// ponytail: hardcode thay vì useSlotUrl() — slot hook là client-side, kéo cả
// trang thành client component chỉ để đổi 1 cái logo. Sếp đổi logo qua /admin
// thì nhớ sửa cả dòng này.
const BRAND_LOGO = "https://cdn.tdgamestudio.com/landing/logoCompany/logo_td2.png";

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

const COMPANY = [
  ["Legal name", "TD Games Company Limited"],
  ["Founded", "2023"],
  ["Business registration", "0110xxxxxx — sếp điền MST"],
  ["Head office", "Floor 4, Hoa Binh Green City, 505 Minh Khai, Vinh Tuy Ward, Hanoi, Vietnam"],
  ["Time zone", "GMT+7 (ICT)"],
  ["Working languages", "English, Vietnamese"],
  ["Email", "info@tdgamestudio.com"],
  ["Phone", "+84 xxx xxx xxx — sếp điền"],
  ["Website", "tdgamestudio.com"],
  ["Payment", "Bank transfer (USD/VND), Wise, Payoneer"],
];

const STATS = [
  { value: "2023", label: "Founded" },
  { value: "50+", label: "Projects delivered" },
  { value: "12+", label: "Studios served" },
  { value: "1200+", label: "Assets shipped" },
];

const SERVICES = [
  {
    title: "2D Art",
    href: "/services/2d-art",
    image: IMG.artStudy,
    lead: "Stylized visuals built for readability, consistency and game-ready production.",
    items: [
      "Character concept & design",
      "Environment & background art",
      "UI/UX design & icon sets",
      "Illustration & splash art",
      "Casual & hyper-casual game art",
      "Props, items & equipment",
    ],
  },
  {
    title: "2D Animation",
    href: "/services/2d-animation",
    image: IMG.summoner,
    lead: "Spine 2D skeletal and frame-by-frame motion, from combat sets to cinematic login screens.",
    items: [
      "Character animation & combat sets",
      "UI & menu animation",
      "Login / splash screen animation",
      "Cutscene & storyboard",
      "Cinematic sequences",
      "3D animation (on request)",
    ],
  },
  {
    title: "2D VFX",
    href: "/services/2d-vfx",
    image: IMG.mytheria,
    lead: "Dynamic skill effects and UI flourishes, delivered Spine-integrated or as sprite sheets.",
    items: [
      "Character & skill VFX",
      "Combat & impact VFX",
      "Environment & ambient VFX",
      "UI & feedback VFX",
      "Spine-integrated VFX",
      "Cinematic VFX",
    ],
  },
];

// Card service dùng chung component với trang chủ (OUR SERVICES), bản `large`.
// ponytail: statValue/statLabel lấy từ site.json qua title để khỏi khai 2 chỗ.
// Import thẳng site.json, KHÔNG import `studioServiceCards` từ module "use client"
// — qua ranh giới server/client nó thành proxy, .find() nổ 500.
const SERVICE_CARDS: StudioServiceCard[] = SERVICES.map((s, i) => {
  const c = siteContent.services.cards.find((x) => x.title === s.title);
  return {
    title: s.title,
    icon: (c?.icon as StudioServiceCard["icon"]) ?? (["art", "animation", "vfx"] as const)[i],
    href: s.href,
    statValue: c?.statValue ?? "",
    statLabel: c?.statLabel ?? "",
    description: s.lead,
    image: s.image,
  };
});

// ⚠️ BỊA — sếp sửa theo cơ cấu thật
const TEAM = [
  { role: "Art Director", count: 1 },
  { role: "Concept & Splash Artists", count: 3 },
  { role: "Spine Animators", count: 4 },
  { role: "VFX Artists", count: 2 },
  { role: "UI Artists", count: 1 },
  { role: "Producer / QA", count: 1 },
];

// ⚠️ BỊA — sếp sửa theo năng lực thật
const CAPACITY = [
  ["Character animation", "8–12 rigged characters / month"],
  ["Skill VFX", "40–60 effects / month"],
  ["Splash & key art", "6–10 illustrations / month"],
  ["UI asset packs", "2–3 full screens / month"],
  ["Ramp-up time", "5–7 working days to add an artist"],
  ["Max concurrent projects", "4 without quality trade-off"],
];

// ⚠️ BỊA metrics — nội dung dựa trên project thật nhưng số liệu chưa verify
const CASE_STUDY = {
  slug: "summoner-era",
  client: "Zitga Studio",
  title: "Summoner Era — Heroes Light / Dark",
  image: IMG.summoner,
  body: "A full hero line rebuilt for a live gacha RPG: concept pass, Spine rigging, four-skill combat sets and matching VFX, delivered in fortnightly batches straight into the client's Unity build.",
  metrics: [
    ["42", "Heroes delivered"],
    ["168", "Skill animations"],
    ["9 mo", "Continuous production"],
    ["0", "Re-export requests"],
  ],
};

// ⚠️ BỊA 100% — tên người và lời khen đều là em viết ra.
// Xin quote thật từ khách rồi thay, hoặc xoá hẳn section này.
const TESTIMONIALS = [
  {
    quote:
      "They picked up our style guide in one pass. By the second batch we stopped doing art review entirely and just merged what they sent.",
    name: "Producer",
    company: "Live gacha RPG, Southeast Asia",
  },
  {
    quote:
      "The Spine files came in clean — correct bone naming, atlas packed the way we asked. That alone saved our engineers a week.",
    name: "Technical Artist",
    company: "Mobile game studio, Vietnam",
  },
  {
    quote:
      "We started with a ten-asset trial because we'd been burned before. Three months later they were handling the whole VFX pipeline.",
    name: "Art Lead",
    company: "Web3 game, Singapore",
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
    when: "24–48h",
    title: "Brief & scope",
    body: "Send references, target style and asset count. You get a fixed scope, a quote and a delivery schedule back — before anyone starts drawing.",
  },
  {
    when: "First asset",
    title: "Style lock",
    body: "We produce one asset and iterate until it matches your game. Nothing goes into volume production until you sign off on that piece.",
  },
  {
    when: "Every week",
    title: "Production sprints",
    body: "Assets ship in batches with one producer as your only point of contact. Feedback lives in a single thread, not five inboxes.",
  },
  {
    when: "On delivery",
    title: "Handoff & aftercare",
    body: "Layered source files plus engine-ready exports — PSD, Spine, sprite sheets — and the revision rounds agreed in the scope.",
  },
];

const QA = [
  ["Style lock before volume", "One reference asset approved by you before the batch starts."],
  ["Two-stage internal review", "Artist self-check, then Art Director sign-off against your guide."],
  ["Technical check", "Bone naming, atlas packing, pivot points and file structure verified per your spec."],
  ["Revision policy", "Two rounds included per asset; further rounds quoted upfront, never silently billed."],
  ["Source files always included", "Layered PSD and Spine project files ship with every delivery."],
  ["Fix window", "30 days after delivery for defects traceable to our work — no charge."],
];

// ⚠️ BỊA khoảng giá — sếp tự đặt
const RATES = [
  ["Per-asset", "Fixed price per character / effect / illustration. Best for clear, bounded scopes."],
  ["Monthly dedicated artist", "From $X,XXX / artist / month — sếp điền. Best for continuous output."],
  ["Milestone-based", "Payment split across agreed milestones for larger productions."],
];

const SECURITY = [
  ["NDA first", "We sign your NDA before receiving any material. Ours is available if you prefer."],
  ["Full IP transfer", "All rights to delivered work transfer to you on final payment, in writing."],
  ["Access control", "Per-project drives; artists see only the project they are assigned to."],
  ["No public posting", "Nothing appears in our portfolio without your written approval, indefinitely."],
];

const COMMS = [
  ["Channels", "Slack, Discord, Email — we join your workspace"],
  ["Project tracking", "Trello, Jira, Notion or your board of choice"],
  ["File delivery", "Google Drive, Dropbox, or direct to your repo"],
  ["Overlap hours", "GMT+7 — 4–6h overlap with EU, full overlap with APAC"],
  ["Reporting", "Weekly progress summary with WIP previews"],
  ["Response time", "Within 12 working hours, same-day on active sprints"],
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
  { slug: "axie-infinity-origins", title: "Axie Infinity — Origins", client: "Sky Mavis", image: IMG.axie },
  { slug: "summoner-era", title: "Summoner Era — Heroes Light/Dark", client: "Zitga Studio", image: IMG.summoner },
  { slug: "kayn-snow-moon", title: "Kayn Snow Moon — Login Screen", client: "Fanmade", image: IMG.kayn },
  { slug: "horse-racing", title: "Horse Racing — Splash Art", client: "INVINCIBLE GG", image: IMG.horse },
  { slug: "battle-of-the-gods-mytheria", title: "Battle of the Gods", client: "Mytheria", image: IMG.mytheria },
  { slug: "boss-animation", title: "Boss Animation — The Twins", client: "AnimVFX Clan", image: IMG.boss },
  { slug: "reaper-lady-project-overdrive", title: "Reaper & Lady — OverDrive", client: "OverDrive", image: IMG.reaper },
  { slug: "animation-contest-sky-mavis", title: "Animation Contest", client: "Sky Mavis", image: IMG.skyMavis },
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

const FAQ = [
  [
    "How do we start?",
    "Send a brief with references and asset count. You get scope, quote and schedule within 48 hours — no charge, no commitment.",
  ],
  [
    "Can we test you first?",
    "Yes. Most clients start with a small paid trial batch so they can judge real output before committing budget.",
  ],
  [
    "What if the style doesn't match?",
    "That is what style lock is for. We iterate on one asset until it matches before any volume production starts — you never pay for a mismatched batch.",
  ],
  [
    "Who owns the work?",
    "You do. Full IP transfers on final payment, in writing, including all source files.",
  ],
  [
    "Can you match an existing art style?",
    "Yes — most of our work is matching an established in-game style rather than inventing one. Send the style guide and shipped assets.",
  ],
  [
    "How do you handle revisions?",
    "Two rounds per asset are included. Anything beyond is quoted before we start, never billed silently.",
  ],
];

/* ---------------------------------------------------------------- primitives */

const WRAP = { width: "min(var(--layout-width, 88%), 1280px)" };

function Wrap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto ${className}`} style={WRAP}>
      {children}
    </div>
  );
}

function Heading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
}) {
  return (
    <Reveal className="mb-14 max-w-3xl">
      <p className="mb-5 text-[11px] uppercase tracking-[0.35em] text-white/35">{eyebrow}</p>
      <h2 className="text-[clamp(2.25rem,5.5vw,4rem)] font-black uppercase leading-[0.98] tracking-tight text-white">
        {title}
      </h2>
      {lead ? <p className="mt-6 text-lg leading-relaxed text-white/55">{lead}</p> : null}
    </Reveal>
  );
}

/** Ảnh bleed sát mép — art tự nó là phần design, không cần khung. */
function ArtBreak({ src }: { src: string }) {
  return (
    <div className="relative h-[55vh] min-h-[340px] w-full">
      <Image src={src} alt="" fill sizes="100vw" className="object-cover" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </div>
  );
}

/** Bảng 2 cột nhãn/giá trị — dùng cho company facts, capacity, comms, security. */
function Facts({ rows }: { rows: (readonly [string, string])[] | string[][] }) {
  return (
    <dl className="divide-y divide-white/10 border-y border-white/10">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-2 py-5 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-8">
          <dt className="text-xs uppercase tracking-[0.2em] text-white/35">{k}</dt>
          <dd className="text-white/75">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* --------------------------------------------------------------------- page */

export default function CompanyProfilePage() {
  return (
    <main className="bg-[#0a0a0a]">
      {/* Hero */}
        <section className="relative flex min-h-[100svh] items-end overflow-hidden">
          <Image src={IMG.summoner} alt="" fill sizes="100vw" priority className="object-cover" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/30" />
          <ProfileHeader />
          <Wrap className="relative w-full pb-20 pt-40">
            <p className="mb-6 text-[11px] uppercase tracking-[0.4em] text-white/50">
              TD Games Studio — Company Profile
            </p>
            <h1 className="max-w-5xl text-[clamp(2.75rem,9vw,7rem)] font-black uppercase leading-[0.88] tracking-tight text-white">
              Game art
              <br />
              that ships
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/65">
              2D art, animation and VFX for games — built in Hanoi, delivered engine-ready for
              Unity, Cocos and Spine pipelines.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                href="/contact"
                className="inline-flex rounded-full px-9 py-4 text-sm font-bold uppercase tracking-wider text-black transition hover:opacity-90"
                style={{ background: A }}
              >
                Start a project
              </Link>
              <Link
                href="/portfolio"
                className="text-sm font-bold uppercase tracking-wider text-white/70 transition hover:text-white"
              >
                See the work
              </Link>
            </div>
          </Wrap>
        </section>

        {/* Stats */}
        <section className="py-20">
          <Wrap>
            <Reveal>
              <div className="grid grid-cols-2 gap-y-12 md:grid-cols-4">
                {STATS.map((s, i) => (
                  <div key={s.label} className={i > 0 ? "md:border-l md:border-white/10 md:pl-8" : ""}>
                    <div className="text-[clamp(2.5rem,5vw,3.75rem)] font-black leading-none text-white">
                      {s.value}
                    </div>
                    <div className="mt-3 text-xs uppercase tracking-[0.2em] text-white/40">{s.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </Wrap>
        </section>

        {/* Who we are */}
        <section className="py-24">
          <Wrap>
            <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr]">
              <Heading eyebrow="Who we are" title="A boutique game art studio in Hanoi" />
              <Reveal className="space-y-6 text-lg leading-relaxed text-white/60 lg:pt-24">
                <p>
                  TD Games Company Limited is a 2D art, animation and VFX studio founded in 2023.
                  We work as an extension of your art team — you send a style guide, we return
                  production-ready assets that drop straight into the build.
                </p>
                <p>
                  Art, animation and VFX live under one roof, so a character goes from concept
                  sheet to rigged, VFX-lit, engine-ready asset without a hand-off between vendors
                  and without style drift along the way.
                </p>
              </Reveal>
            </div>
            <Reveal className="mt-16">
              <Facts rows={COMPANY} />
            </Reveal>
          </Wrap>
        </section>

        <ArtBreak src={IMG.axie} />

        {/* Services */}
        <section className="py-24">
          <Wrap>
            <Heading
              eyebrow="What we offer"
              title="Three services, one pipeline"
              lead="Take one, or take the whole chain from concept to engine-ready delivery."
            />
          </Wrap>
          <Wrap>
            <StudioServiceCardsGrid items={SERVICE_CARDS} large />
          </Wrap>
          <Wrap className="pt-16">
            <div className="grid gap-12 md:grid-cols-3">
              {SERVICES.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.08}>
                  <div className="mb-5 h-px w-12" style={{ background: A }} />
                  <h4 className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-white">
                    {s.title}
                  </h4>
                  <ul className="space-y-2.5 text-white/55">
                    {s.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </Wrap>
        </section>

        {/* Team & capacity */}
        <section className="border-t border-white/10 py-24">
          <Wrap>
            <Heading
              eyebrow="Team & capacity"
              title="Who does the work, and how much"
              lead="A small senior team rather than a body shop — every artist here has shipped live titles."
            />
            <div className="grid gap-16 lg:grid-cols-2">
              <Reveal>
                <div className="mb-8 flex items-baseline gap-4">
                  <span className="text-[clamp(3rem,6vw,4.5rem)] font-black leading-none" style={{ color: A }}>
                    12
                  </span>
                  <span className="text-sm uppercase tracking-[0.2em] text-white/40">
                    full-time specialists
                  </span>
                </div>
                <ul className="divide-y divide-white/10 border-y border-white/10">
                  {TEAM.map((t) => (
                    <li key={t.role} className="flex items-center justify-between py-4">
                      <span className="text-white/75">{t.role}</span>
                      <span className="font-mono text-white/40">{t.count}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mb-8 text-xs uppercase tracking-[0.25em] text-white/35">
                  Monthly throughput
                </p>
                <Facts rows={CAPACITY} />
              </Reveal>
            </div>
          </Wrap>
        </section>

        {/* Selected work */}
        <section className="py-24">
          <Wrap>
            <Heading eyebrow="Selected work" title="Shipped, not mocked up" />
          </Wrap>
          <Wrap>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {WORK.map((w) => (
                <Link
                  key={w.slug}
                  href={`/portfolio/${w.slug}`}
                  className="group overflow-hidden rounded-xl bg-white/5 shadow-xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.08]"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/50">
                    <Image
                      src={w.image}
                      alt={w.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                  <div className="p-4">
                    <span
                      className="mb-2 inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ background: `${A}33`, color: A }}
                    >
                      {w.client}
                    </span>
                    <h3 className="text-base font-bold leading-snug text-white">{w.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </Wrap>
          <Wrap className="pt-12">
            <Link
              href="/portfolio"
              className="inline-flex border-b pb-1 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:opacity-60"
              style={{ borderColor: A }}
            >
              View full portfolio
            </Link>
          </Wrap>
        </section>

        {/* Case study spotlight */}
        <section className="relative overflow-hidden py-24">
          <Image
            src={CASE_STUDY.image}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-25"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]/60" />
          <Wrap className="relative">
            <Reveal className="max-w-2xl">
              <p className="mb-5 text-[11px] uppercase tracking-[0.35em] text-white/35">
                Case study — {CASE_STUDY.client}
              </p>
              <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-black uppercase leading-[1.02] tracking-tight text-white">
                {CASE_STUDY.title}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-white/60">{CASE_STUDY.body}</p>
            </Reveal>
            <Reveal delay={0.1} className="mt-14">
              <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
                {CASE_STUDY.metrics.map(([v, l], i) => (
                  <div key={l} className={i > 0 ? "md:border-l md:border-white/10 md:pl-8" : ""}>
                    <div className="text-[clamp(2rem,4vw,3rem)] font-black leading-none text-white">
                      {v}
                    </div>
                    <div className="mt-3 text-xs uppercase tracking-[0.2em] text-white/40">{l}</div>
                  </div>
                ))}
              </div>
              <Link
                href={`/portfolio/${CASE_STUDY.slug}`}
                className="mt-12 inline-flex border-b pb-1 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:opacity-60"
                style={{ borderColor: A }}
              >
                Read the case study
              </Link>
            </Reveal>
          </Wrap>
        </section>

        {/* Testimonials */}
        <section className="border-t border-white/10 py-24">
          <Wrap>
            <Heading eyebrow="What clients say" title="In their words" />
            <div className="grid gap-14 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.quote} delay={i * 0.08}>
                  <div className="mb-6 text-5xl font-black leading-none" style={{ color: A }}>
                    &ldquo;
                  </div>
                  <blockquote className="text-lg leading-relaxed text-white/75">{t.quote}</blockquote>
                  <div className="mt-6 text-sm font-bold text-white">{t.name}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/35">{t.company}</div>
                </Reveal>
              ))}
            </div>
          </Wrap>
        </section>

        <ArtBreak src={IMG.horse} />

        {/* Why us */}
        <section className="py-24">
          <Wrap>
            <Heading eyebrow="Why choose us" title="What you actually get" />
            <div className="grid gap-x-16 gap-y-14 md:grid-cols-2">
              {WHY.map((w, i) => (
                <Reveal key={w.title} delay={i * 0.06}>
                  <h3 className="mb-4 text-xl font-bold text-white">{w.title}</h3>
                  <p className="leading-relaxed text-white/55">{w.body}</p>
                </Reveal>
              ))}
            </div>
          </Wrap>
        </section>

        {/* Process */}
        <section className="border-t border-white/10 py-24">
          <Wrap>
            <Heading eyebrow="How we work" title="From brief to handoff" />
            <div className="grid gap-x-12 gap-y-14 md:grid-cols-2 lg:grid-cols-4">
              {PROCESS.map((p, i) => (
                <Reveal key={p.title} delay={i * 0.06}>
                  <div className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-white/35">
                    {p.when}
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-white">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{p.body}</p>
                </Reveal>
              ))}
            </div>
          </Wrap>
        </section>

        {/* Engagement + rates */}
        <section className="border-t border-white/10 py-24">
          <Wrap>
            <Heading eyebrow="Engagement" title="Two ways to work with us" />
            <div className="grid gap-16 md:grid-cols-2">
              {ENGAGEMENT.map((e, i) => (
                <Reveal key={e.title} delay={i * 0.08}>
                  <h3 className="text-2xl font-bold text-white">{e.title}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/40">{e.sub}</p>
                  <ol className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/70">
                    {e.steps.map((step, j) => (
                      <li key={step} className="flex items-center gap-3">
                        {j > 0 ? <span className="text-white/25">→</span> : null}
                        {step}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-8 leading-relaxed text-white/50">{e.fit}</p>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-16">
              <p className="mb-8 text-xs uppercase tracking-[0.25em] text-white/35">Pricing models</p>
              <Facts rows={RATES} />
            </Reveal>
          </Wrap>
        </section>

        {/* Quality assurance */}
        <section className="border-t border-white/10 py-24">
          <Wrap>
            <Heading
              eyebrow="Quality assurance"
              title="How we keep it consistent"
              lead="The controls that keep batch fifty looking like batch one."
            />
            <Reveal>
              <Facts rows={QA} />
            </Reveal>
          </Wrap>
        </section>

        {/* Security & IP */}
        <section className="border-t border-white/10 py-24">
          <Wrap>
            <Heading eyebrow="Security & IP" title="Your work stays yours" />
            <Reveal>
              <Facts rows={SECURITY} />
            </Reveal>
          </Wrap>
        </section>

        {/* Communication */}
        <section className="border-t border-white/10 py-24">
          <Wrap>
            <Heading eyebrow="Working together" title="How we stay in sync" />
            <Reveal>
              <Facts rows={COMMS} />
            </Reveal>
          </Wrap>
        </section>

        {/* Tools */}
        <section className="border-t border-white/10 py-24">
          <Wrap>
            <Heading eyebrow="Tools & deliverables" title="What lands in your repo" />
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
              {STACK.map((g, i) => (
                <Reveal key={g.group} delay={i * 0.06}>
                  <div className="mb-5 text-xs uppercase tracking-[0.25em] text-white/35">
                    {g.group}
                  </div>
                  <ul className="space-y-2.5 text-white/70">
                    {g.tools.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </Wrap>
        </section>

        {/* Clients */}
        <section className="border-t border-white/10 py-24">
          <Wrap>
            <Heading eyebrow="Clients" title="Studios we've worked with" />
            <Reveal>
              <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
                {CLIENTS.map((c) => (
                  <div key={c} className="text-lg font-bold text-white/50">
                    {c}
                  </div>
                ))}
              </div>
            </Reveal>
          </Wrap>
        </section>

        {/* FAQ */}
        <section className="border-t border-white/10 py-24">
          <Wrap>
            <Heading eyebrow="FAQ" title="Before you ask" />
            <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
              {FAQ.map(([q, a], i) => (
                <Reveal key={q} delay={i * 0.05}>
                  <h3 className="mb-3 text-lg font-bold text-white">{q}</h3>
                  <p className="leading-relaxed text-white/55">{a}</p>
                </Reveal>
              ))}
            </div>
          </Wrap>
        </section>

        {/* Contact */}
        <section className="relative flex min-h-[70svh] items-center overflow-hidden">
          <Image src={IMG.kayn} alt="" fill sizes="100vw" className="object-cover" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/40" />
          <Wrap className="relative w-full py-24">
            <Reveal>
              <h2 className="max-w-3xl text-[clamp(2.5rem,7vw,5.5rem)] font-black uppercase leading-[0.92] tracking-tight text-white">
                Let&apos;s build
                <br />
                something good
              </h2>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/65">
                Send a brief and get scope, quote and schedule back within 48 hours — no charge, no
                commitment.
              </p>
              <dl className="mt-14 grid gap-10 sm:grid-cols-3">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.25em] text-white/35">Studio</dt>
                  <dd className="mt-3 text-white/75">
                    Floor 4, Hoa Binh Green City
                    <br />
                    505 Minh Khai, Hanoi (GMT+7)
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.25em] text-white/35">Email</dt>
                  <dd className="mt-3 text-white/75">info@tdgamestudio.com</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.25em] text-white/35">Web</dt>
                  <dd className="mt-3 text-white/75">tdgamestudio.com</dd>
                </div>
              </dl>
              <Link
                href="/contact"
                className="mt-14 inline-flex rounded-full px-10 py-4 text-sm font-bold uppercase tracking-wider text-black transition hover:opacity-90"
                style={{ background: A }}
              >
                Request a quote
              </Link>
            </Reveal>
          </Wrap>
        </section>

      {/* ponytail: không dùng SiteFooter — phần Contact ngay trên đã có địa chỉ,
          email, web. Footer đầy đủ sẽ kéo khách ra khỏi tài liệu. */}
      <div className="border-t border-white/10 py-10">
        <Wrap>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <Image
              src={BRAND_LOGO}
              alt="TD Games Studio"
              width={140}
              height={38}
              className="h-8 w-auto opacity-60"
            />
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              TD Games Company Limited — Hanoi, Vietnam
            </p>
          </div>
        </Wrap>
      </div>
    </main>
  );
}
