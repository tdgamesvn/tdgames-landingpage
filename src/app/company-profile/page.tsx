import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ProfileHeader from "./_header";
import Reveal from "./_reveal";
import MobileFold from "./_fold";
import ClientLogo from "@/components/client-logo";
import {
  StudioServiceCardsGrid,
  type StudioServiceCard,
} from "@/components/studio-service-cards";
import siteContent from "@/content/site.json";
import { resolveSlots } from "@/lib/page-slots";
import { Changa_One } from "next/font/google";

// Cùng font title với hero trang chủ.
const changaOne = Changa_One({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Company Profile",
  description:
    "TD Games Studio — Vietnam-based 2D Art, Animation & VFX outsourcing studio. 50+ projects delivered engine-ready for Unity, Cocos and Spine pipelines.",
};

/* ============================================================================
 * ponytail: trang tĩnh, không API/DB. Sếp sửa trực tiếp các hằng số dưới đây.
 *
 * LAYOUT RULES — 2026-08-05 sếp duyệt đổi hướng: bản tối giản kiểu Room 8 bị
 * chê "đen quá, toàn chữ, không hấp dẫn". Luật hiện hành = đồng bộ trang chủ:
 *   1. Continuous scroll, KHÔNG full-screen slide. (giữ nguyên)
 *   2. Section nền gradient xen kẽ + glow cam mờ, KHÔNG để đen phẳng #0a0a0a.
 *   3. Accent cam #ff8c3a (= trang chủ), heading Rajdhani + số // 01 // 02.
 *   4. Nội dung dạng card (const CARD) — không để text trần trên nền đen.
 *   5. Chữ body tối thiểu white/70; nhãn nhỏ dùng #ffcc8e.
 *
 * NGUỒN NỘI DUNG — 2026-08-05: đồng bộ với "TD Games Company Portfolio.pdf"
 * (bản chính thức sếp gửi). VISION_MISSION, CORE_VALUES, PRODUCTION, KEY_PEOPLE,
 * COMPANY (địa chỉ + hotline) và section Contact lấy nguyên văn từ PDF.
 *
 * Đã XOÁ vì là dữ liệu bịa, PDF không có:
 *   TEAM / CAPACITY (cơ cấu 12 người, throughput) · RATES (khoảng giá)
 *   TESTIMONIALS (3 quote + tên người bịa 100%) — thay bằng section Key people thật.
 *
 * 2026-08-05 (lần 2) — sếp trả lời hết phần còn treo, số liệu dưới đây là THẬT:
 *   MST 0111386856 · STATS 50+ project / 15+ studio / 1000+ asset
 *   CASE_STUDY = ORCA (50+ hero, art + animation, 4 tháng)
 *   3 vòng revision · bảo hành trọn đời · báo giá 24–48h · full IP khi thanh toán
 *   ClickUp là board chính · thêm hình thức thuê nhân sự theo giờ
 *   CLIENTS lấy logo thật từ page_slots (home/client-logos) — cùng nguồn với
 *   marquee "TRUST OUR CLIENTS" ở trang chủ ⇒ trang này phải force-dynamic.
 *   Ảnh Key people lấy từ team_members (section "Passionate Artists" ở /about).
 * ========================================================================== */

// Accent đồng bộ với trang chủ (#ff8c3a) thay vì amber #f59e0b — cùng một
// ngôn ngữ màu với tdgamestudio.com để khách không thấy 2 thương hiệu.
const A = "#ff8c3a";

// Card dùng lại khắp trang: nền hơi sáng hơn nền section + viền mảnh, hover lên cam.
const CARD =
  "rounded-2xl border border-white/10 bg-white/[0.035] transition duration-300 hover:border-[#ff8c3a]/45 hover:bg-white/[0.06]";

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

// Video nền hero — sếp chỉ định riêng cho trang này (2026-08-05), không ăn theo
// site.json nữa. Đổi video = sửa dòng này.
const HERO_VIDEO =
  "https://cdn.tdgamestudio.com/projects/2026/05/eb574720-923c-4ad0-abe3-c45320b9359a-final_loop_7s.mp4";

// Nền section Conclusion cuối trang (trước là ảnh tĩnh IMG.kayn).
const CONTACT_VIDEO =
  "https://cdn.tdgamestudio.com/projects/2026/08/957962de-4cc5-4931-bef0-cecf29a0482d-mid_autumn-.mp4";

const COMPANY = [
  ["Legal name", "TD Games Company Limited"],
  ["Founded", "2023"],
  ["Business registration", "0111386856"],
  ["Head office", "4th Floor, H1 Tower — Hoa Binh Green City, 505 Minh Khai, Hai Ba Trung District, Hanoi, Vietnam"],
  ["Time zone", "GMT+7 (ICT)"],
  ["Working languages", "English, Vietnamese"],
  ["Email", "info@tdgamestudio.com"],
  ["Hotline", "(+84) 36 260 8491"],
  ["Website", "tdgamestudio.com"],
  ["Payment", "Bank transfer (USD/VND), Wise, Payoneer"],
];

const STATS = [
  { value: "2023", label: "Founded" },
  { value: "50+", label: "Projects delivered" },
  { value: "15+", label: "Studios served" },
  { value: "1000+", label: "Assets shipped" },
];

const SERVICES = [
  {
    title: "2D Art",
    href: "/services/2d-art",
    // Media 3 card service sếp chỉ định riêng cho trang này (2026-08-05).
    // SlotMedia tự nhận .mp4 → render <video> autoplay/loop, không cần đổi gì thêm.
    image: "https://cdn.tdgamestudio.com/projects/2026/07/ee6f7e74-a2af-462f-ba57-c7fb3e63a656-image.png",
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
    image: "https://cdn.tdgamestudio.com/projects/2026/07/eaef94f6-547a-4f73-8487-fb26bdf8c948-charanimation.mp4",
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
    image: "https://cdn.tdgamestudio.com/projects/2026/07/69a8ee03-645f-4dd0-8dfb-ea5cf998857d-vfxcobat2.mp4",
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

// Vision & Mission — nguyên văn PDF trang 4
const VISION_MISSION = [
  [
    "Our Vision",
    "To become Vietnam's leading 2D game outsourcing studio, recognized globally for exceptional quality, creative excellence, and reliable partnerships. We aspire to empower game developers worldwide by delivering world-class art and development solutions while contributing to the growth of Vietnam's game industry on the international stage.",
  ],
  [
    "Our Mission",
    "To empower game studios and publishers worldwide by delivering high-quality Game Art, Animation, VFX, and Game Development services that transform ideas into engaging gaming experiences — through creativity, technical excellence, transparent collaboration, and an unwavering commitment to quality.",
  ],
];

// Core values — PDF trang 5
const CORE_VALUES = [
  ["Commitment", "We pay attention to every detail to deliver polished, production-ready, game-ready results."],
  ["Professionalism", "We ensure clear communication, efficient workflows, and on-time delivery."],
  ["Quality", "We prioritize product excellence and client satisfaction in every project."],
  ["Creativity", "We continuously innovate to create unique and impactful game experiences."],
  ["Partnership", "We build long-term relationships through transparency, trust, and collaboration."],
];

// 2D Game Production — dịch vụ thứ 4 trong PDF (trang 12)
const PRODUCTION = [
  ["Game Design", "Gameplay mechanics, level design, game economy, balancing, and feature planning."],
  ["Unity Development", "Clean, optimized, and scalable game development for mobile and cross-platform projects."],
  ["Rapid Prototyping", "Fast prototype development to validate gameplay concepts, user experience, and publisher pitches."],
  ["Casual Game Development", "End-to-end production for Puzzle, Hybrid Casual, and Hyper-Casual games."],
  ["Game Integration", "Seamless integration of art, animation, VFX, UI, audio, and gameplay into production-ready builds."],
  ["QA & Optimization", "Bug fixing, performance optimization, and device compatibility testing for a stable, launch-ready product."],
];

// Key people — PDF trang 16–17. Ảnh chân dung lấy từ team_members (đúng ảnh đang
// dùng ở section "Passionate Artists" trên /about).
// ponytail: hardcode 2 URL thay vì query DB — cả file này đã là hằng số tĩnh, thêm
// 1 query chỉ để lấy 2 ảnh không đáng. Sếp đổi ảnh trong /admin thì sửa 2 dòng này.
const KEY_PEOPLE = [
  {
    name: "Toan Dang",
    role: "CEO & Creative Director",
    photo:
      "https://cdn.tdgamestudio.com/projects/2026/05/f104ee79-426e-4b86-a39f-e3dec45deaaa-chatgpt-image-22_35_12-25-thg-5--2026.png",
    bullets: [
      "10+ years as Artist, Animator and Animation Lead",
      "Worked at Gemmob Studio, Zitga Studio and Sky Mavis",
      "1st prize, Animation Contest by Sky Mavis",
      "Coaches animation skills across the company",
      "Led the animation team on “Summoners Arena”",
    ],
  },
  {
    name: "Dung Nguyen",
    role: "CHRO",
    photo:
      "https://cdn.tdgamestudio.com/projects/2026/05/fbf5740a-7f73-4ca1-b490-a0a04f68a321-chatgpt-image-22_35_29-25-thg-5--2026.png",
    bullets: [
      "10+ years in the human resource industry",
      "Founder of a headhunting service for game & IT talent in Vietnam",
      "Supports clients and the development team in meeting our commitments",
    ],
  },
];

// Số liệu sếp xác nhận 2026-08-05. Chưa có trang case study riêng cho ORCA nên
// nút dưới trỏ về /portfolio.
const CASE_STUDY = {
  href: "/portfolio",
  client: "ORCA",
  title: "ORCA — Hero roster, art and animation",
  image: IMG.summoner,
  body: "Over fifty high-quality heroes built end to end in four months: concept and final art, then Spine rigging and combat animation — one team handling both disciplines, so the art never had to be redrawn to animate.",
  metrics: [
    ["50+", "Heroes delivered"],
    ["4 mo", "Total production time"],
    ["Art + Anim", "Both handled in-house"],
  ],
};

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
  ["Revision policy", "Three rounds included per asset; further rounds quoted upfront, never silently billed."],
  ["Source files always included", "Layered PSD and Spine project files ship with every delivery."],
  ["Lifetime warranty", "Defects traceable to our work are fixed free of charge, with no time limit."],
];

const SECURITY = [
  ["NDA first", "We sign your NDA before receiving any material. Ours is available if you prefer."],
  ["Full IP transfer", "All rights to delivered work transfer to you on final payment, in writing."],
  ["Access control", "Per-project drives; artists see only the project they are assigned to."],
  ["No public posting", "Nothing appears in our portfolio without your written approval, indefinitely."],
];

const COMMS = [
  ["Channels", "Slack, Discord, Email — we join your workspace"],
  ["Project tracking", "ClickUp — shared board, or your tool if you prefer"],
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

// CLIENTS: logo thật đọc từ page_slots (home/client-logos) — cùng nguồn với marquee
// "TRUST OUR CLIENTS" ở trang chủ, sếp thêm/bớt trong /admin là trang này ăn theo.

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
  {
    title: "Hourly hire",
    sub: "Pay for the hours you use",
    steps: ["Brief", "Pick artists", "Track hours", "Weekly report", "Invoice"],
    fit: "Best for overflow, fixes and unpredictable workloads — rent an artist by the hour instead of scoping a batch.",
  },
];

const FAQ = [
  [
    "How do we start?",
    "Send a brief with references and asset count. You get scope, quote and schedule within 24–48 hours — no charge, no commitment.",
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
    "Three rounds per asset are included, and delivered work carries a lifetime fix warranty. Anything beyond the included rounds is quoted before we start, never billed silently.",
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
  no,
  eyebrow,
  title,
  lead,
}: {
  no?: string;
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
}) {
  return (
    <Reveal className="mb-9 text-center md:mb-14">
      <div className="mb-5 flex items-center justify-center gap-4">
        {no ? (
          <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.35)]">
            {`// ${no}`}
          </span>
        ) : null}
        <div className="h-px w-12 shrink-0 bg-gradient-to-r from-[#ff8c3a]/60 to-white/10" />
        <span className="text-[11px] font-bold uppercase md:text-[10px] tracking-[0.4em] text-[#ffcc8e]/80">
          {eyebrow}
        </span>
      </div>
      <h2
        className="text-[clamp(2.25rem,5.5vw,3.75rem)] font-black uppercase leading-[1.02] tracking-tight text-white"
        style={{ fontFamily: "var(--font-rajdhani)" }}
      >
        {title}
      </h2>
      {lead ? (
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">{lead}</p>
      ) : null}
    </Reveal>
  );
}

/** Thanh ngang phân cách — thay cho dải ảnh bleed 55vh (ảnh crop xấu, đọc như
 *  quảng cáo chen giữa nội dung). Giữ nhịp trang bằng typography, không bằng art. */
function Divider({ items }: { items: string[] }) {
  return (
    <Wrap>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-y border-white/10 py-7">
        <span className="h-px w-12 shrink-0" style={{ background: A }} />
        {items.map((s, i) => (
          <span key={s} className="flex items-center gap-6">
            {i > 0 && <span className="text-white/15">/</span>}
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/55">
              {s}
            </span>
          </span>
        ))}
        {/* gạch phải cho đối xứng với gạch trái */}
        <span className="h-px w-12 shrink-0" style={{ background: A }} />
      </div>
    </Wrap>
  );
}

/** Lưới card nhãn/giá trị — dùng cho company facts, capacity, QA, rates, security,
 *  comms. Bản cũ là bảng <dl> 2 cột: nhãn trái hẹp, giá trị nhảy sang giữa trang
 *  → nhìn lệch và thừa khoảng trắng bên phải. */
function Facts({ rows }: { rows: (readonly [string, string])[] | string[][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className={`${CARD} p-5`}>
          <div className="mb-2.5 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: A }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#ffcc8e]/80">
              {k}
            </span>
          </div>
          <p className="text-[15px] leading-relaxed text-white/80">{v}</p>
        </div>
      ))}
    </div>
  );
}

/** Số thứ tự trong vòng tròn — dùng cho sơ đồ quy trình và list "why us". */
function StepNo({ n }: { n: number }) {
  return (
    <span
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-black"
      style={{ borderColor: `${A}59`, color: A, background: `${A}14` }}
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

/* --------------------------------------------------------------------- page */

// Logo khách đọc từ DB → không prerender được nội dung stale.
export const dynamic = "force-dynamic";

export default async function CompanyProfilePage() {
  const clientLogos = await resolveSlots("home", "client-logos");
  return (
    <main className="bg-[#0a0a0a]">
      {/* Hero */}
        <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#0a0a0a]">
          {/* ponytail: <video> thuần, không cần "use client" — autoplay/loop là thuộc tính
              HTML. Không bê HomeHero sang vì hero đó kéo theo cả dàn card + admin state. */}
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={HERO_VIDEO}
            poster={IMG.summoner}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          />
          {/* Vignette chéo giống trang chủ: tối bên trái nơi có chữ, tan dần sang phải */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.72) 30%, rgba(10,10,10,0.42) 58%, rgba(10,10,10,0.2) 80%)",
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
          <ProfileHeader />
          <Wrap className="relative w-full pb-16 pt-28 md:pb-20 md:pt-40">
            <p className="mb-6 text-[11px] uppercase tracking-[0.4em] text-white/70">
              TD Games Studio
            </p>
            <h1
              className={`max-w-4xl leading-[1] ${changaOne.className}`}
              style={{ fontSize: "min(100px, 12vw)" }}
            >
              COMPANY
              <br />
              <span style={{ color: A }}>PROFILE</span>
            </h1>
            {/* Mobile: h2 wrap 3 dòng nên gạch canh giữa khối trông lơ lửng ở dòng 2
                → xếp dọc, gạch nằm trên. Desktop giữ nguyên gạch–chữ cùng hàng. */}
            <div className="mt-6 flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-4">
              <div className="h-[2px] w-12 shrink-0" style={{ background: A }} />
              <h2
                className="text-[13px] font-bold uppercase leading-[1.5] tracking-[0.12em] md:text-[16px] md:leading-normal md:tracking-[0.16em]"
                style={{ color: A }}
              >
                2D Art, Animation &amp; VFX outsourcing studio — Hanoi, Vietnam
              </h2>
            </div>
            <p className="mt-4 max-w-[547px] text-[18px] leading-[1.5] text-[#e5e7eb]">
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
                className="inline-flex min-h-11 items-center text-sm font-bold uppercase tracking-wider text-white/70 transition hover:text-white"
              >
                See the work
              </Link>
            </div>
          </Wrap>
        </section>

        {/* Stats */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(900px_440px_at_12%_0%,rgba(255,140,58,0.10),transparent_62%),linear-gradient(165deg,#14151f_0%,#0e0f14_45%,#0a0a10_100%)] py-14 md:py-24">
          <Wrap>
            <Reveal>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.label} className={`${CARD} px-6 py-7`}>
                    <div className="text-[clamp(2.5rem,5vw,3.75rem)] font-black leading-none text-white">
                      {s.value}
                    </div>
                    <div className="mt-3 text-xs uppercase tracking-[0.2em] text-white/50">{s.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </Wrap>
        </section>

        {/* Who we are */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(820px_420px_at_88%_100%,rgba(255,140,58,0.07),transparent_60%),linear-gradient(180deg,#0b0c12_0%,#09090d_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="01"
              eyebrow="Who we are" title="A boutique game art studio in Hanoi" />
            <Reveal className="grid gap-8 text-lg leading-relaxed text-white/75 md:grid-cols-2">
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
            <Reveal className="mt-16">
              <Facts rows={COMPANY} />
            </Reveal>
          </Wrap>
        </section>

        <Divider items={["2D Art", "2D Animation", "2D VFX", "Spine", "Unity", "Cocos"]} />

        {/* Services */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(900px_440px_at_12%_0%,rgba(255,140,58,0.10),transparent_62%),linear-gradient(165deg,#14151f_0%,#0e0f14_45%,#0a0a10_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="02"
              eyebrow="What we offer"
              title="Four services, one pipeline"
              lead="Take one, or take the whole chain from concept to a production-ready build."
            />
          </Wrap>
          <Wrap>
            <StudioServiceCardsGrid items={SERVICE_CARDS} large />
          </Wrap>
          <Wrap className="pt-16">
            {/* Cùng container với StudioServiceCardsGrid (max-w-6xl, gap-5/lg:gap-6)
                + px-7 = padding trong card, để chữ thẳng cột với tiêu đề card trên. */}
            <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3 lg:gap-6">
              {SERVICES.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.08} className="px-7">
                  <div className="mb-5 h-px w-12" style={{ background: A }} />
                  <h4 className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-white">
                    {s.title}
                  </h4>
                  <ul className="space-y-2.5 text-white/72">
                    {s.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </Wrap>
          <Wrap className="pt-16">
            <Reveal>
              <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/55">
                2D Game Production
              </p>
              <p className="mb-8 max-w-2xl leading-relaxed text-white/72">
                From concept validation to a production-ready build — end-to-end production for
                Puzzle, Hybrid Casual and Hyper-Casual games, without expanding your in-house team.
              </p>
              <Facts rows={PRODUCTION} />
            </Reveal>
          </Wrap>
        </section>

        {/* Team & capacity */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(820px_420px_at_88%_100%,rgba(255,140,58,0.07),transparent_60%),linear-gradient(180deg,#0b0c12_0%,#09090d_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="03"
              eyebrow="Vision & mission"
              title="Where we're headed"
            />
            <Reveal>
              <Facts rows={VISION_MISSION} />
            </Reveal>
            <Reveal className="mt-16">
              <p className="mb-8 text-xs uppercase tracking-[0.25em] text-white/55">Core values</p>
              <Facts rows={CORE_VALUES} />
            </Reveal>
          </Wrap>
        </section>

        {/* Selected work */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(900px_440px_at_12%_0%,rgba(255,140,58,0.10),transparent_62%),linear-gradient(165deg,#14151f_0%,#0e0f14_45%,#0a0a10_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="04"
              eyebrow="Selected work" title="Shipped, not mocked up" />
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
                      className="mb-2 inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase md:text-[10px] tracking-wider"
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
              className="inline-flex min-h-11 items-end border-b pb-1 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:opacity-60"
              style={{ borderColor: A }}
            >
              View full portfolio
            </Link>
          </Wrap>
        </section>

        {/* Case study spotlight */}
        <section className="relative overflow-hidden py-14 md:py-24">
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
              <p className="mb-5 text-[11px] uppercase tracking-[0.35em] text-white/55">
                Case study — {CASE_STUDY.client}
              </p>
              <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-black uppercase leading-[1.02] tracking-tight text-white">
                {CASE_STUDY.title}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-white/75">{CASE_STUDY.body}</p>
            </Reveal>
            <Reveal delay={0.1} className="mt-14">
              <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-3">
                {CASE_STUDY.metrics.map(([v, l], i) => (
                  <div key={l} className={i > 0 ? "sm:border-l sm:border-white/10 sm:pl-8" : ""}>
                    <div className="text-[clamp(1.75rem,3.4vw,2.75rem)] font-black leading-none text-white">
                      {v}
                    </div>
                    <div className="mt-3 text-xs uppercase tracking-[0.2em] text-white/50">{l}</div>
                  </div>
                ))}
              </div>
              <Link
                href={CASE_STUDY.href}
                className="mt-12 inline-flex min-h-11 items-end border-b pb-1 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:opacity-60"
                style={{ borderColor: A }}
              >
                See more work
              </Link>
            </Reveal>
          </Wrap>
        </section>

        {/* Key people */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(820px_420px_at_88%_100%,rgba(255,140,58,0.07),transparent_60%),linear-gradient(180deg,#0b0c12_0%,#09090d_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="05"
              eyebrow="Key people" title="Who leads the work" />
            <div className="grid gap-4 md:grid-cols-2">
              {KEY_PEOPLE.map((p, i) => (
                <Reveal key={p.name} delay={i * 0.08} className={`${CARD} p-8`}>
                  <div className="flex items-center gap-5">
                    <Image
                      src={p.photo}
                      alt={p.name}
                      width={96}
                      height={96}
                      className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-[#ff8c3a]/40"
                    />
                    <div>
                      <h3 className="text-2xl font-bold text-white">{p.name}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em]" style={{ color: A }}>
                        {p.role}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-8 space-y-3 text-white/72">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex gap-3">
                        <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full" style={{ background: A }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </Wrap>
        </section>

        <Divider items={["Concept", "Production", "Integration", "Delivery"]} />

        {/* Why us */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(900px_440px_at_12%_0%,rgba(255,140,58,0.10),transparent_62%),linear-gradient(165deg,#14151f_0%,#0e0f14_45%,#0a0a10_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="06"
              eyebrow="Why choose us" title="What you actually get" />
            <div className="grid gap-4 md:grid-cols-2">
              {WHY.map((w, i) => (
                <Reveal key={w.title} delay={i * 0.06} className={`${CARD} p-7`}>
                  <div className="mb-5 flex items-center gap-4">
                    <StepNo n={i + 1} />
                    <h3 className="text-xl font-bold text-white">{w.title}</h3>
                  </div>
                  <p className="leading-relaxed text-white/72">{w.body}</p>
                </Reveal>
              ))}
            </div>
            {/* Quote CEO — nguyên văn PDF trang 13. */}
            <Reveal delay={0.24} className={`${CARD} mt-4 p-8 sm:p-10`}>
              <span
                aria-hidden
                className="block text-5xl leading-none"
                style={{ color: A }}
              >
                “
              </span>
              <blockquote className="mt-3 text-lg italic leading-relaxed text-white/85 sm:text-xl">
                We don&apos;t see ourselves as just an outsourcing vendor — we see
                ourselves as a production partner. Every asset we create, every
                milestone we deliver, and every conversation we have is driven by one
                goal:{" "}
                <strong className="font-semibold not-italic" style={{ color: A }}>
                  helping our clients build better games, faster and with confidence.
                </strong>
              </blockquote>
              <div className="mt-6 flex items-center gap-4">
                <Image
                  src={KEY_PEOPLE[0].photo}
                  alt={KEY_PEOPLE[0].name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover ring-1 ring-white/15"
                />
                <div className="text-sm">
                  <div className="font-semibold text-white">Toan Dang (Đặng Thế Toàn)</div>
                  <div className="text-white/55">CEO &amp; Creative Director</div>
                </div>
              </div>
            </Reveal>
          </Wrap>
        </section>

        {/* Process */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(820px_420px_at_88%_100%,rgba(255,140,58,0.07),transparent_60%),linear-gradient(180deg,#0b0c12_0%,#09090d_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="07"
              eyebrow="How we work" title="From brief to handoff" />
            {/* Sơ đồ ngang: đường ray + 4 mốc, thẳng cột với card bên dưới.
                Ẩn dưới lg vì 1–2 cột thì mũi tên ngang thành vô nghĩa. */}
            <Reveal className="relative mb-10 hidden lg:block">
              <div className="absolute left-[12.5%] right-[12.5%] top-[22px] h-px bg-gradient-to-r from-[#ff8c3a]/15 via-[#ff8c3a]/60 to-[#ff8c3a]/15" />
              <div className="relative grid grid-cols-4">
                {PROCESS.map((p, i) => (
                  <div key={p.title} className="flex flex-col items-center text-center">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full border text-sm font-black"
                      style={{
                        borderColor: `${A}80`,
                        color: A,
                        background: "#0b0c12",
                        boxShadow: `0 0 22px ${A}33`,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-4 font-mono text-[11px] uppercase md:text-[10px] tracking-[0.2em] text-[#ffcc8e]/80">
                      {p.when}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {PROCESS.map((p, i) => (
                <Reveal
                  key={p.title}
                  delay={i * 0.06}
                  className={`${CARD} relative p-7 lg:after:absolute lg:after:-right-4 lg:after:top-1/2 lg:after:h-px lg:after:w-4 lg:after:bg-[#ff8c3a]/35 lg:last:after:hidden`}
                >
                  <div className="mb-5 flex items-center gap-4 lg:hidden">
                    <StepNo n={i + 1} />
                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[11px] uppercase md:text-[10px] tracking-[0.2em] text-[#ffcc8e]/80">
                      {p.when}
                    </span>
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-white">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-white/70">{p.body}</p>
                </Reveal>
              ))}
            </div>
          </Wrap>
        </section>

        {/* Engagement + rates */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(900px_440px_at_12%_0%,rgba(255,140,58,0.10),transparent_62%),linear-gradient(165deg,#14151f_0%,#0e0f14_45%,#0a0a10_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="08"
              eyebrow="Engagement" title="Three ways to work with us" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ENGAGEMENT.map((e, i) => (
                <Reveal key={e.title} delay={i * 0.08} className={`${CARD} p-8`}>
                  <h3 className="text-2xl font-bold text-white">{e.title}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/50">{e.sub}</p>
                  <ol className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/70">
                    {e.steps.map((step, j) => (
                      <li key={step} className="flex items-center gap-3">
                        {j > 0 ? <span className="text-white/25">→</span> : null}
                        {step}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-8 leading-relaxed text-white/70">{e.fit}</p>
                </Reveal>
              ))}
            </div>
          </Wrap>
        </section>

        {/* Quality assurance */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(820px_420px_at_88%_100%,rgba(255,140,58,0.07),transparent_60%),linear-gradient(180deg,#0b0c12_0%,#09090d_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="09"
              eyebrow="Quality assurance"
              title="How we keep it consistent"
              lead="The controls that keep batch fifty looking like batch one."
            />
            <MobileFold label="The controls">
              <Reveal>
                <Facts rows={QA} />
              </Reveal>
            </MobileFold>
          </Wrap>
        </section>

        {/* Security & IP */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(900px_440px_at_12%_0%,rgba(255,140,58,0.10),transparent_62%),linear-gradient(165deg,#14151f_0%,#0e0f14_45%,#0a0a10_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="10"
              eyebrow="Security & IP" title="Your work stays yours" />
            <MobileFold label="What we commit to">
              <Reveal>
                <Facts rows={SECURITY} />
              </Reveal>
            </MobileFold>
          </Wrap>
        </section>

        {/* Communication */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(820px_420px_at_88%_100%,rgba(255,140,58,0.07),transparent_60%),linear-gradient(180deg,#0b0c12_0%,#09090d_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="11"
              eyebrow="Working together" title="How we stay in sync" />
            <MobileFold label="How it works">
              <Reveal>
                <Facts rows={COMMS} />
              </Reveal>
            </MobileFold>
          </Wrap>
        </section>

        {/* Tools */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(900px_440px_at_12%_0%,rgba(255,140,58,0.10),transparent_62%),linear-gradient(165deg,#14151f_0%,#0e0f14_45%,#0a0a10_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="12"
              eyebrow="Tools & deliverables" title="What lands in your repo" />
            <MobileFold label="See the stack">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STACK.map((g, i) => (
                <Reveal key={g.group} delay={i * 0.06} className={`${CARD} p-6`}>
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: A }} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#ffcc8e]/80">
                      {g.group}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {g.tools.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[13px] text-white/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
            </MobileFold>
          </Wrap>
        </section>

        {/* Clients */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(820px_420px_at_88%_100%,rgba(255,140,58,0.07),transparent_60%),linear-gradient(180deg,#0b0c12_0%,#09090d_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="13"
              eyebrow="Clients" title="Studios we've worked with" />
            <Reveal>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {clientLogos.map((logo) => (
                  <div
                    key={logo.id}
                    className={`${CARD} flex h-24 items-center justify-center px-5`}
                  >
                    <ClientLogo
                      src={logo.url}
                      alt={logo.display_name ?? ""}
                      base={48}
                      maxH={60}
                      className="opacity-80"
                    />
                  </div>
                ))}
              </div>
            </Reveal>
          </Wrap>
        </section>

        {/* FAQ */}
        <section className="relative overflow-hidden border-t border-white/[0.07] bg-[radial-gradient(900px_440px_at_12%_0%,rgba(255,140,58,0.10),transparent_62%),linear-gradient(165deg,#14151f_0%,#0e0f14_45%,#0a0a10_100%)] py-14 md:py-24">
          <Wrap>
            <Heading
              no="14"
              eyebrow="FAQ" title="Before you ask" />
            <MobileFold label="Read the answers">
              <div className="grid gap-4 md:grid-cols-2">
                {FAQ.map(([q, a], i) => (
                  <Reveal key={q} delay={i * 0.05} className={`${CARD} p-7`}>
                    <h3 className="mb-3 text-lg font-bold text-white">{q}</h3>
                    <p className="leading-relaxed text-white/72">{a}</p>
                  </Reveal>
                ))}
              </div>
            </MobileFold>
          </Wrap>
        </section>

        {/* Contact */}
        <section className="relative flex min-h-[70svh] items-center overflow-hidden">
          {/* ponytail: <video> thuần như hero. preload="none" + poster ảnh cũ —
              video này nằm cuối trang, đừng bắt khách tải khi chưa cuộn tới. */}
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={CONTACT_VIDEO}
            poster={IMG.kayn}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/40" />
          <Wrap className="relative w-full py-14 md:py-24">
            <Reveal>
              <h2 className="max-w-3xl text-[clamp(2.5rem,7vw,5.5rem)] font-black uppercase leading-[0.92] tracking-tight text-white">
                Conclusion
              </h2>
              {/* Nguyên văn trang kết PDF. */}
              <div className="mt-8 max-w-3xl space-y-5 text-lg italic leading-relaxed text-white/70">
                <p>
                  As the game industry continues to evolve at an unprecedented pace, choosing the
                  right production partner is essential to delivering high-quality games on time and
                  within budget.
                </p>
                <p>
                  At TD Games, we combine creative talent, technical expertise, and efficient
                  production pipelines to provide reliable 2D Game Art, Animation, VFX, and Game
                  Production services. More than just an outsourcing studio, we strive to become a
                  trusted extension of your team — working with transparency, flexibility, and a
                  shared commitment to creating outstanding gaming experiences.
                </p>
                <p className="font-semibold not-italic" style={{ color: A }}>
                  Ready to bring your next game to life?
                </p>
                <p>
                  Let TD Games help you accelerate production, optimize resources, and transform your
                  ideas into production-ready results.
                </p>
              </div>
              <dl className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.25em] text-white/55">Studio</dt>
                  <dd className="mt-3 text-white/75">
                    4th Floor, H1 Tower — Hoa Binh Green City
                    <br />
                    505 Minh Khai, Hai Ba Trung, Hanoi (GMT+7)
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.25em] text-white/55">Email</dt>
                  <dd className="mt-3 text-white/75">info@tdgamestudio.com</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.25em] text-white/55">Hotline</dt>
                  <dd className="mt-3 text-white/75">(+84) 36 260 8491</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.25em] text-white/55">Web</dt>
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
