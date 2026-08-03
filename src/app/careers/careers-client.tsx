"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Changa_One, Nunito_Sans } from "next/font/google";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { AccentHighlight } from "@/components/accent-highlight";
import SlotMedia from "@/components/slot-media";
import type { Job } from "@/app/admin/_lib/types";

const changaOne = Changa_One({ weight: "400", subsets: ["latin"] });
const nunitoSans = Nunito_Sans({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

const isVideoUrl = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

const HIRING_STEPS = [
  {
    n: "01",
    title: "Apply",
    desc: "Send your application and portfolio.",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    n: "02",
    title: "Review",
    desc: "We review your profile and portfolio.",
    iconPath:
      "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    n: "03",
    title: "Interview",
    desc: "Let's talk about you and our expectations.",
    iconPath:
      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    n: "04",
    title: "Test (if needed)",
    desc: "A short test to see how you approach challenges.",
    iconPath:
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    n: "05",
    title: "Offer",
    desc: "Welcome to the team!",
    iconPath:
      "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
];

const LIFE_PHOTOS = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
];

// ponytail: mỗi desc ~22-26 từ để 5 card cao bằng nhau ở grid 3 cột.
// Mỗi value phải kèm một chi tiết kiểm chứng được — bỏ tính từ chung chung.
const BENEFITS = [
  {
    title: "Work that ships",
    desc: "Real titles for global studios, real production pipelines — not mock tasks. What you build goes live and goes in your portfolio.",
    icon: "comfort",
    color: "#f59e0b",
  },
  {
    title: "Feedback, not silence",
    desc: "Art direction reviews every milestone. You always know why a note was given — and you leave each project better than you started it.",
    icon: "friendliness",
    color: "#f59e0b",
  },
  {
    title: "Level up on the clock",
    desc: "Mentoring from senior artists across 2D art, animation and VFX, plus internal R&D time to learn new tools and styles during work hours.",
    icon: "growth",
    color: "#f59e0b",
  },
  {
    title: "Planned, not panicked",
    desc: "We scope schedules with buffer instead of burning weekends. Crunch is not the plan here — and when overtime happens, it is paid.",
    icon: "balance",
    color: "#f59e0b",
  },
  {
    title: "Say it straight",
    desc: "Flat team, direct access to leads. Disagree with a decision? Say so — pushing back on the work is part of the job here.",
    icon: "transparency",
    color: "#f59e0b",
  },
  {
    title: "Paid on the books",
    desc: "Full statutory insurance, 13th-month salary and a formal review twice a year. Your income is on paper, not a handshake — no surprises at payday.",
    icon: "pay",
    color: "#f59e0b",
  },
];

// ponytail: chip text thuần, không icon riêng — chỉ thêm khi có fact thật.
// Đổi ở đây phải khớp policy thật; đừng thêm chip không verify được.
const PERKS = [
  "1 remote day every week",
  "Mon–Fri, 8-hour days — weekends off",
  "Overtime is paid, always",
  "100% salary during probation",
  "13th-month salary",
  "Full statutory insurance (social, health, unemployment)",
  "Workstation & tablet provided",
  "12 days paid annual leave",
  "Salary reviews twice a year",
  "Paid public holidays & Tet break",
  "Team trip every year",
];

function BenefitIcon({ name, color }: { name: string; color: string }) {
  const stroke = color;
  const fill = `${color}20`;

  if (name === "transparency") {
    return (
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <path
          d="M3 16C5.5 10.5 10.3 7 16 7C21.7 7 26.5 10.5 29 16C26.5 21.5 21.7 25 16 25C10.3 25 5.5 21.5 3 16Z"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="16" r="4" fill={fill} stroke={stroke} strokeWidth="2" />
        <circle cx="16" cy="16" r="1.5" fill={stroke} />
        <path
          d="M26 6L26.7 7.6L28.3 8.3L26.7 9L26 10.6L25.3 9L23.7 8.3L25.3 7.6L26 6Z"
          fill={stroke}
        />
      </svg>
    );
  }

  if (name === "friendliness") {
    return (
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <path
          d="M4 11C4 9.34315 5.34315 8 7 8H17C18.6569 8 20 9.34315 20 11V16C20 17.6569 18.6569 19 17 19H10L6 23V19C4.89543 19 4 18.1046 4 17V11Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M22 14H25C26.6569 14 28 15.3431 28 17V21C28 22.1046 27.1046 23 26 23V26L23 23H17C15.3431 23 14 21.6569 14 20V19.5"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="13.5" r="1" fill={stroke} />
        <circle cx="12" cy="13.5" r="1" fill={stroke} />
        <circle cx="15" cy="13.5" r="1" fill={stroke} />
      </svg>
    );
  }

  if (name === "comfort") {
    return (
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <path
          d="M16 4L6 7V15C6 21 10.5 26 16 28C21.5 26 26 21 26 15V7L16 4Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M16 19C16 19 11.5 16.5 11.5 13.5C11.5 12.1193 12.6193 11 14 11C14.8333 11 15.5667 11.4167 16 12C16.4333 11.4167 17.1667 11 18 11C19.3807 11 20.5 12.1193 20.5 13.5C20.5 16.5 16 19 16 19Z"
          fill={stroke}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "growth") {
    return (
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <path d="M5 27H27" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="M16 27V14" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path
          d="M16 14C16 11 13 9 10 9C10 12 12 15 16 15"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 13C16 9 19 6 23 6C23 10 20 13 16 14"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M22 22L25 19L27 21" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 22L8 19L10 21" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "balance") {
    return (
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <path d="M16 5V27" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="M9 27H23" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path
          d="M16 8L8 9L5 18C5 20 7 21 9.5 21C12 21 14 20 14 18L11 9"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 8L24 9L21 18C21 20 23 21 25.5 21C28 21 30 20 30 18L27 9"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="6" r="2" fill={fill} stroke={stroke} strokeWidth="2" />
      </svg>
    );
  }

  if (name === "pay") {
    return (
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <rect
          x="4"
          y="8"
          width="24"
          height="17"
          rx="3"
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
        />
        <path d="M4 14H28" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="M9 20H14" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return null;
}

export default function CareersClient({
  heroUrl,
  lifePhotos,
}: {
  heroUrl: string;
  lifePhotos?: string[];
}) {
  // Slot `careers/gallery` rỗng → giữ ảnh mặc định, section không bao giờ trống.
  const photos = lifePhotos?.length ? lifePhotos : LIFE_PHOTOS;
  // Marquee dịch -33.333% nên cần đúng 3 bản sao. Ít ảnh quá thì 1 bản không
  // phủ hết màn rộng → nhân lên tới >= 8 ảnh trước khi nhân 3.
  // ponytail: 8 ảnh × ~240px ≈ 2000px, đủ cho màn 1440. Màn > 2000px CSS thì
  // nâng ngưỡng này.
  const marqueePhotos = useMemo(() => {
    const filled = [...photos];
    while (filled.length < 8) filled.push(...photos);
    return [...filled, ...filled, ...filled];
  }, [photos]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<Job | null>(null);

  useEffect(() => {
    fetch("/api/jobs", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, []);

  const filteredRoles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (q === "") return jobs;
    return jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        (job.description ?? "").toLowerCase().includes(q),
    );
  }, [jobs, searchQuery]);

  return (
    <>
      <SiteHeader />
      <main
        className={`min-h-screen bg-[#090a10] text-white ${nunitoSans.className}`}
      >
        {/* Hero Section */}
        <section className="relative h-[100vh] overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 z-0">
            {isVideoUrl(heroUrl) ? (
              <video
                src={heroUrl}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover object-[center_35%]"
              />
            ) : (
              <Image
                src={heroUrl}
                alt=""
                fill
                className="object-cover object-[center_35%]"
                sizes="100vw"
                priority
              />
            )}
          </div>

          {/* Subtle dark vignette — stronger on the left where text lives, dissolves toward center */}
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(100deg, rgba(9,10,16,0.82) 0%, rgba(9,10,16,0.55) 28%, rgba(9,10,16,0.18) 55%, transparent 78%)",
            }}
          />
          {/* Bottom fade for mobile (text sits at bottom on small screens) */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/5 md:hidden"
            style={{
              background:
                "linear-gradient(to top, rgba(9,10,16,0.75) 0%, transparent 100%)",
            }}
          />

          <div
            className="relative z-[2] mx-auto flex h-[100vh] items-end px-4 pb-16 pt-28 md:items-center md:pb-24 md:pt-32"
            style={{ width: "var(--layout-width, 75%)" }}
          >
            <div className="max-w-2xl">
              {/* ml-[2px]: bù side-bearing của Changa One để mép chữ khớp H1 bên dưới */}
              <p className="ml-[2px] text-base font-bold uppercase tracking-[0.3em] text-[#ff9f1a] md:text-lg">
                Hiring
              </p>
              <h1
                className={`mt-4 text-5xl font-black uppercase leading-[0.98] tracking-tight sm:text-6xl md:text-7xl ${changaOne.className}`}
              >
                Build games
                <br />
                <span className="text-[#f59e0b] drop-shadow-[0_0_24px_rgba(245,158,11,0.35)]">
                  with us
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90 md:text-lg">
                Join our creative team and bring stunning game art to life.
                We&apos;re looking for passionate artists who love crafting
                characters, environments, and visual effects that players
                remember.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#open-roles"
                  className="inline-flex rounded-xl border-2 border-[#f59e0b] bg-[#f59e0b] px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-transparent hover:text-white md:text-base"
                >
                  Open roles
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Open Positions Section */}
        <section
          id="open-roles"
          className="scroll-mt-24 relative overflow-hidden border-b border-[#ff8c3a]/20 bg-[linear-gradient(165deg,#14151f_0%,#0e0f14_42%,#0a0a10_100%)] py-14 md:py-20 lg:py-24"
        >
          <div
            className="pointer-events-none absolute -left-24 top-0 h-[320px] w-[320px] rounded-full bg-[#ff8c3a]/08 blur-[100px]"
            aria-hidden
          />

          <div
            className="relative mx-auto px-4"
            style={{ width: "min(var(--layout-width, 90%), 1280px)", maxWidth: "100%" }}
          >
            {/* Header with search & filters */}
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <header>
                <div className="mb-4 flex items-center gap-4">
                  <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.35)]">
                    // 01
                  </span>
                  <div className="h-px w-12 shrink-0 bg-linear-to-r from-[#ff8c3a]/55 to-white/12" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">
                    {loadingJobs ? "…" : `${jobs.length} Open Positions`}
                  </span>
                </div>

                <h2
                  className="text-left text-3xl font-black uppercase leading-[1.08] tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  Find your <AccentHighlight>next adventure</AccentHighlight>
                </h2>
                <p className="mt-4 max-w-xl text-left text-sm leading-relaxed text-white/65 md:text-base">
                  Join a team of passionate artists building memorable game experiences — animation, VFX, illustration, and more.
                </p>
              </header>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search — bỏ filter theo category (2026-08-03): 5 job, không cần lọc */}
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search positions..."
                    className="w-full rounded-lg border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-[#f59e0b]/50 focus:outline-none sm:w-64"
                  />
                </div>
              </div>
            </div>

            {/* Roles list */}
            <div className="mt-10 md:mt-12">
              {loadingJobs ? (
                <div className="py-16 text-center text-white/40 text-sm">Loading positions…</div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {filteredRoles.length === 0 ? (
                    <li className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/60">
                      No positions match your search.
                    </li>
                  ) : (
                    filteredRoles.map((job) => (
                      <li
                        key={job.id}
                        className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all hover:border-[#f59e0b]/40 hover:bg-white/[0.05]"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-stretch">
                          {/* Image — stretches full card height on desktop */}
                          <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-auto sm:w-44">
                            <Image
                              src={job.image_url ?? ""}
                              alt={job.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 100vw, 176px"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex flex-1 flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6">
                            {/* Title + description */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3
                                  className="text-xl font-bold text-white"
                                  style={{ fontFamily: "var(--font-rajdhani)" }}
                                >
                                  {job.title}
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                  {job.categories.map((cat) => (
                                    <span
                                      key={cat}
                                      className="rounded-md border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f59e0b]"
                                    >
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                                {/* Employment type — pill xanh, tách hẳn khỏi địa chỉ */}
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                                  {job.type}
                                </span>
                              </div>
                              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
                                {job.description ?? ""}
                              </p>
                              {/* Địa chỉ — dòng meta mờ, nằm dưới mô tả để không còn khoảng trống giữa card */}
                              <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-white/45">
                                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {job.location}
                              </p>
                            </div>

                            {/* Action button */}
                            <button
                              type="button"
                              onClick={() => setSelectedRole(job)}
                              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#f59e0b]/50 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-[#f59e0b] transition-all hover:bg-[#f59e0b] hover:text-black"
                            >
                              View Details
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Benefits / Our Values Section */}
        <section className="relative overflow-hidden border-b border-[#ff8c3a]/20 py-14 md:py-20 lg:py-24">
          <div className="pointer-events-none absolute -right-24 top-0 h-[320px] w-[320px] rounded-full bg-purple-500/10 blur-[100px]" aria-hidden />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-[320px] w-[320px] rounded-full bg-[#ff8c3a]/8 blur-[100px]" aria-hidden />

          <div
            className="relative z-10 mx-auto px-4"
            style={{ width: "min(var(--layout-width, 90%), 1280px)" }}
          >
            <header>
              <div className="mb-4 flex items-center gap-4">
                <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.35)]">// 02</span>
                <div className="h-px w-12 shrink-0 bg-linear-to-r from-[#ff8c3a]/55 to-white/12" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">Why join us</span>
              </div>
              <h2 className="text-left text-3xl font-black uppercase leading-[1.08] tracking-tight text-white md:text-4xl lg:text-[2.75rem]" style={{ fontFamily: "var(--font-rajdhani)" }}>
                Our <AccentHighlight>Values</AccentHighlight>
              </h2>
              <p className="mt-4 max-w-xl text-left text-sm leading-relaxed text-white/65 md:text-base">
                Not slogans — what you can actually expect from your first week here.
              </p>
            </header>

            {/* ponytail: dừng ở 3 cột — 5 cột làm mỗi card chỉ ~150px, chữ dày đặc */}
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 md:mt-12">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl"
                >
                  <div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${benefit.color}25, transparent 70%)` }}
                  />
                  <div className="relative">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl border"
                      style={{ borderColor: `${benefit.color}40`, backgroundColor: `${benefit.color}15`, boxShadow: `0 0 24px ${benefit.color}15` }}
                    >
                      <BenefitIcon name={benefit.icon} color={benefit.color} />
                    </div>
                    <h3 className="mt-5 text-lg font-bold leading-tight text-white" style={{ fontFamily: "var(--font-rajdhani)" }}>{benefit.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/65">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5 md:mt-10">
              {PERKS.map((perk) => (
                <span
                  key={perk}
                  className="inline-flex items-center gap-2 rounded-full border border-[#ff8c3a]/25 bg-[#ff8c3a]/[0.07] px-4 py-2 text-xs font-medium text-white/80 md:text-sm"
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden>
                    <path d="M3.5 8.5L6.5 11.5L12.5 5" stroke="#ffb04a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {perk}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Hiring Process Section */}
        <section className="relative overflow-hidden border-b border-[#ff8c3a]/20 bg-[linear-gradient(165deg,#14151f_0%,#0e0f14_42%,#0a0a10_100%)] py-14 md:py-20 lg:py-24">
          <div className="pointer-events-none absolute -right-24 top-0 h-[320px] w-[320px] rounded-full bg-[#ff8c3a]/08 blur-[100px]" aria-hidden />
          <div className="relative mx-auto px-4" style={{ width: "min(var(--layout-width, 90%), 1280px)" }}>
            <header>
              <div className="mb-4 flex items-center gap-4">
                <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.35)]">// 03</span>
                <div className="h-px w-12 shrink-0 bg-linear-to-r from-[#ff8c3a]/55 to-white/12" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">5 Steps</span>
              </div>
              <h2 className="text-left text-3xl font-black uppercase leading-[1.08] tracking-tight text-white md:text-4xl lg:text-[2.75rem]" style={{ fontFamily: "var(--font-rajdhani)" }}>
                Hiring <AccentHighlight>Process</AccentHighlight>
              </h2>
              <p className="mt-4 max-w-xl text-left text-sm leading-relaxed text-white/65 md:text-base">
                Simple. Transparent. People-first. Here&apos;s what to expect when you apply with us.
              </p>
            </header>
            <div className="mt-12 md:mt-14">
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
                {HIRING_STEPS.map((step, idx) => (
                  <div key={step.n} className="relative flex flex-col items-center text-center">
                    {idx < HIRING_STEPS.length - 1 && (
                      <div className="absolute left-[60%] top-7 hidden h-px w-[80%] md:block">
                        <div className="relative h-full w-full">
                          <div className="h-full w-full bg-gradient-to-r from-[#f59e0b]/40 to-[#f59e0b]/10" />
                          <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#f59e0b]" />
                        </div>
                      </div>
                    )}
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-[#f59e0b]/30 bg-[#0d0e15] text-[#f59e0b] shadow-[0_0_24px_rgba(255,140,58,0.15)]">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.iconPath} />
                      </svg>
                    </div>
                    <p className="mt-3 text-lg font-black text-[#f59e0b]" style={{ fontFamily: "var(--font-rajdhani)" }}>{step.n}</p>
                    <p className="mt-1 text-sm font-bold text-white" style={{ fontFamily: "var(--font-rajdhani)" }}>{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/60">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Life at TD Games Section */}
        <section className="relative overflow-hidden border-b border-[#ff8c3a]/20 py-14 md:py-20 lg:py-24">
          <div className="pointer-events-none absolute -left-24 top-0 h-[320px] w-[320px] rounded-full bg-[#ff8c3a]/08 blur-[100px]" aria-hidden />
          <div className="relative mx-auto px-4" style={{ width: "min(var(--layout-width, 90%), 1280px)" }}>
            <header>
              <div className="mb-4 flex items-center gap-4">
                <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.35)]">// 04</span>
                <div className="h-px w-12 shrink-0 bg-linear-to-r from-[#ff8c3a]/55 to-white/12" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">Behind the scenes</span>
              </div>
              <h2 className="text-left text-3xl font-black uppercase leading-[1.08] tracking-tight text-white md:text-4xl lg:text-[2.75rem]" style={{ fontFamily: "var(--font-rajdhani)" }}>
                Life at <AccentHighlight>TD Games</AccentHighlight>
              </h2>
              <p className="mt-4 max-w-xl text-left text-sm leading-relaxed text-white/65 md:text-base">
                We work. We play. We level up. Take a peek inside our studio — where creativity meets community.
              </p>
            </header>
          </div>
          {/* Marquee full-bleed — thêm/bớt ảnh ở admin không làm vỡ layout */}
          <div
            className="group relative mt-10 overflow-hidden md:mt-12"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            }}
          >
            <div className="animate-marquee flex w-max gap-3 group-hover:[animation-play-state:paused]">
              {marqueePhotos.map((photo, i) => (
                <div
                  key={i}
                  className="relative aspect-square w-[150px] shrink-0 overflow-hidden rounded-lg border border-white/10 md:w-[240px]"
                >
                  {/* SlotMedia: sếp upload mp4 vào slot cũng chạy, alt="" vì ảnh
                      lặp 3 lần — screen reader không cần đọc lại. */}
                  <SlotMedia
                    src={photo}
                    className="object-cover transition-transform duration-500 hover:scale-110"
                    sizes="240px"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20">
          <div className="mx-auto px-4" style={{ width: "min(var(--layout-width, 90%), 1280px)" }}>
            <div className="relative overflow-hidden rounded-2xl border border-[#f59e0b]/20 bg-gradient-to-br from-[#1a1410] via-[#0f0d12] to-[#0a0a10] p-8 md:p-12">
              <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-30">
                <Image src="https://cdn.tdgamestudio.com/landing/images/summoners.png" alt="" fill className="object-cover object-right" />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#0f0d12]/60 to-[#0f0d12]" />
              </div>
              <div className="relative z-10 max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ff9f1a]">Ready to build amazing worlds together?</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl" style={{ fontFamily: "var(--font-rajdhani)" }}>
                  We&apos;d love to hear from you.
                </h2>
                <p className="mt-3 text-sm text-white/70 md:text-base">Bring your passion. Let&apos;s create something unforgettable.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#open-roles"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#f59e0b] px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-black transition-colors hover:bg-[#ffb366]"
                  >
                    See Open Positions
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/40 px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-white transition-colors hover:border-[#f59e0b]/60 hover:text-[#f59e0b]"
                  >
                    Get in Touch
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>

      {/* Slide-in Job Detail Panel */}
      <RoleDetailPanel
        role={selectedRole}
        onClose={() => setSelectedRole(null)}
      />
    </>
  );
}

// ── RoleDetailPanel ────────────────────────────────────────────────────────────

type RoleDetailPanelProps = {
  role: Job | null;
  onClose: () => void;
};

function RoleDetailPanel({ role, onClose }: RoleDetailPanelProps) {
  const isOpen = role !== null;
  const router = useRouter();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-[101] flex h-full w-full max-w-[640px] flex-col border-l border-white/10 bg-[#0d0e15] shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        {role && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0a0a10] px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <>
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Hero image */}
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={role.image_url ?? ""}
                      alt={role.title}
                      fill
                      className="object-cover"
                      sizes="640px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e15] via-[#0d0e15]/30 to-transparent" />
                  </div>

                  <div className="px-6 py-6">
                    {/* Title */}
                    <h2 className="text-3xl font-black tracking-tight text-white" style={{ fontFamily: "var(--font-rajdhani)" }}>
                      {role.title}
                    </h2>

                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {role.categories.map((cat) => (
                        <span key={cat} className="rounded-md border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f59e0b]">
                          {cat}
                        </span>
                      ))}
                    </div>

                    {/* Meta row */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60">
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Posted {timeAgo(role.created_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {role.location}
                      </span>
                    </div>

                    {/* Summary */}
                    <section className="mt-8 border-t border-white/10 pt-6">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">Summary</h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/70">{role.summary}</p>
                    </section>

                    {/* Quick info grid */}
                    <section className="mt-6 grid grid-cols-2 gap-4">
                      <InfoCard iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" label="Type" value={role.type} />
                      <InfoCard iconPath="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" label="Duration" value="Long-term" />
                      <InfoCard iconPath="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" label="Level" value={role.level ?? "Open"} />
                      <InfoCard iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" label="Salary" value={role.salary ?? "Competitive"} />
                    </section>

                    {/* Responsibilities */}
                    {role.responsibilities.length > 0 && (
                      <section className="mt-8 border-t border-white/10 pt-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">Responsibilities</h3>
                        <ul className="mt-3 space-y-2">
                          {role.responsibilities.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/70">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f59e0b]" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Requirements */}
                    {role.requirements.length > 0 && (
                      <section className="mt-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">Requirements</h3>
                        <ul className="mt-3 space-y-2">
                          {role.requirements.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/70">
                              <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Nice to have */}
                    {role.nice_to_have.length > 0 && (
                      <section className="mt-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">Nice to have</h3>
                        <ul className="mt-3 space-y-2">
                          {role.nice_to_have.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/60">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Skills */}
                    {role.skills.length > 0 && (
                      <section className="mt-8 border-t border-white/10 pt-6 pb-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">Skills &amp; Expertise</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {role.skills.map((skill) => (
                            <span key={skill} className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </div>

                {/* Sticky footer */}
                <div className="border-t border-white/10 bg-[#0a0a10] px-6 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Compensation</p>
                      <p className="text-sm font-bold text-white">{role.salary ?? "Competitive"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { onClose(); router.push(`/apply/${role.slug}`); }}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#f59e0b] px-6 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-black transition-colors hover:bg-[#ffb366]"
                    >
                      Apply Now
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                </div>
            </>
          </>
        )}
      </aside>
    </>
  );
}

// ── InfoCard ───────────────────────────────────────────────────────────────────

function InfoCard({ iconPath, label, value }: { iconPath: string; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#f59e0b]/20 bg-[#f59e0b]/5 text-[#f59e0b]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
