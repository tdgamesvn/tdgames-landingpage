"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Changa_One, Nunito_Sans } from "next/font/google";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { AccentHighlight } from "@/components/accent-highlight";

const changaOne = Changa_One({ weight: "400", subsets: ["latin"] });
const nunitoSans = Nunito_Sans({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

type RoleCategory =
  | "Art"
  | "Production"
  | "Marketing"
  | "Animation"
  | "Design"
  | "Illustration";

type Role = {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  image: string;
  categories: RoleCategory[];
  primaryCategory: "Art" | "Production" | "Marketing";
  postedAgo: string;
  level: string;
  salary: string;
  duration: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  skills: string[];
};

const ROLES: Role[] = [
  {
    id: "spine-2d-animator",
    title: "Spine 2D Animator",
    description:
      "Create high-quality 2D character animation using Spine for in-game assets.",
    location: "HĂ  Ná»™i",
    type: "Full-time",
    image: "https://cdn.tdgamestudio.com/landing/images/Screenshot 2026-05-13 232709.png",
    categories: ["Art", "Animation"],
    primaryCategory: "Art",
    postedAgo: "2 days ago",
    level: "Mid - Senior",
    salary: "Competitive",
    duration: "Long-term",
    summary:
      "We are looking for a passionate Spine 2D Animator to join our creative team. You will work on character animation for in-game assets, collaborating closely with art leads and game designers to bring characters to life with smooth, expressive motion.",
    responsibilities: [
      "Create high-quality 2D character animations using Spine",
      "Collaborate with art and design teams on animation requirements",
      "Optimize animations for in-game performance",
      "Maintain consistent animation quality across projects",
    ],
    requirements: [
      "2+ years of experience with Spine 2D",
      "Strong understanding of animation principles",
      "Portfolio showcasing character animation work",
      "Ability to work in a collaborative team environment",
    ],
    niceToHave: [
      "Experience with mobile game projects",
      "Familiarity with Unity integration",
      "Knowledge of rigging best practices",
    ],
    skills: ["Spine 2D", "Animation", "Character Animation", "Rigging"],
  },
  {
    id: "2d-artist",
    title: "2D Artist",
    description:
      "Design characters, props and environments with strong style and storytelling.",
    location: "HĂ  Ná»™i",
    type: "Full-time",
    image: "https://cdn.tdgamestudio.com/landing/images/summonerDetail.png",
    categories: ["Art", "Illustration"],
    primaryCategory: "Art",
    postedAgo: "5 days ago",
    level: "Junior - Senior",
    salary: "Competitive",
    duration: "Long-term",
    summary:
      "Join our team as a 2D Artist to create stunning characters, props, and environments that tell powerful stories. You'll work on a variety of projects ranging from mobile games to indie titles, contributing to the visual identity of each game.",
    responsibilities: [
      "Design characters, props and environments",
      "Create concept art and final illustrations",
      "Collaborate with the team on visual style",
      "Iterate based on feedback and direction",
    ],
    requirements: [
      "Strong portfolio of 2D art and illustration",
      "Proficiency in Photoshop / Procreate / Clip Studio",
      "Understanding of color theory and composition",
      "Good communication skills",
    ],
    niceToHave: [
      "Experience with stylized art",
      "Knowledge of game art pipelines",
      "Background in traditional art",
    ],
    skills: ["Photoshop", "Illustration", "Character Design", "Environment Art"],
  },
  {
    id: "graphic-designer",
    title: "Graphic Designer",
    description:
      "Create visual content for marketing, branding and community campaigns.",
    location: "HĂ  Ná»™i",
    type: "Full-time",
    image: "https://cdn.tdgamestudio.com/landing/images/summoners.png",
    categories: ["Art", "Design"],
    primaryCategory: "Art",
    postedAgo: "1 week ago",
    level: "Mid",
    salary: "Competitive",
    duration: "Long-term",
    summary:
      "We need a creative Graphic Designer to craft compelling visual content across our brand and marketing channels. You'll design social media assets, banners, key art, and marketing materials that resonate with our gaming community.",
    responsibilities: [
      "Design marketing materials and social assets",
      "Maintain brand consistency across channels",
      "Collaborate with marketing on campaigns",
      "Deliver assets on tight deadlines",
    ],
    requirements: [
      "3+ years in graphic design",
      "Strong portfolio across digital and print",
      "Proficiency in Adobe Creative Suite",
      "Good sense of typography and layout",
    ],
    niceToHave: [
      "Motion design skills",
      "Experience in gaming industry",
      "Video editing skills",
    ],
    skills: ["Photoshop", "Illustrator", "Branding", "Typography"],
  },
  {
    id: "outsourcing-project-assistant",
    title: "Outsourcing Project Assistant",
    description:
      "Support project managers and ensure smooth communication with partners.",
    location: "HĂ  Ná»™i",
    type: "Full-time",
    image: "https://cdn.tdgamestudio.com/landing/images/ourproject.jpg",
    categories: ["Production"],
    primaryCategory: "Production",
    postedAgo: "3 days ago",
    level: "Junior",
    salary: "Competitive",
    duration: "Long-term",
    summary:
      "We're hiring an Outsourcing Project Assistant to support our project managers in coordinating with external partners. This is a great opportunity to learn project management in a fast-paced creative environment.",
    responsibilities: [
      "Coordinate with outsourcing partners",
      "Track project progress and deliverables",
      "Support project managers on day-to-day tasks",
      "Maintain documentation and reports",
    ],
    requirements: [
      "Strong English communication skills",
      "Detail-oriented and well-organized",
      "Ability to work with multiple stakeholders",
      "Basic understanding of project management",
    ],
    niceToHave: [
      "Experience in gaming or creative industry",
      "Familiarity with project tools (Jira, Notion)",
      "Additional language skills",
    ],
    skills: ["Communication", "Project Management", "Coordination", "English"],
  },
  {
    id: "vfx-artist",
    title: "2D VFX Artist",
    description:
      "Bring skill effects, particles and impact frames to life for in-game moments.",
    location: "HĂ  Ná»™i",
    type: "Full-time",
    image: "https://cdn.tdgamestudio.com/landing/images/service-animation.jpg",
    categories: ["Art", "Animation"],
    primaryCategory: "Art",
    postedAgo: "1 day ago",
    level: "Mid - Senior",
    salary: "Competitive",
    duration: "Long-term",
    summary:
      "Join us as a 2D VFX Artist to create stunning visual effects that elevate gameplay moments. From skill effects and particles to hand-drawn impact frames, your work will make every action feel impactful and satisfying.",
    responsibilities: [
      "Create skill effects, particles and impact animations",
      "Collaborate with animators and designers",
      "Optimize VFX for performance",
      "Maintain VFX quality and consistency",
    ],
    requirements: [
      "2+ years in 2D VFX",
      "Strong sense of timing and impact",
      "Portfolio showcasing VFX work",
      "Experience with After Effects / Spine VFX",
    ],
    niceToHave: [
      "Hand-drawn animation skills",
      "Unity / Unreal VFX experience",
      "Understanding of game feel",
    ],
    skills: ["After Effects", "VFX", "Animation", "Particles"],
  },
  {
    id: "marketing-specialist",
    title: "Marketing Specialist",
    description:
      "Plan and execute marketing campaigns to grow our community and reach.",
    location: "HĂ  Ná»™i",
    type: "Full-time",
    image: "https://cdn.tdgamestudio.com/landing/images/maxresdefault.jpg",
    categories: ["Marketing"],
    primaryCategory: "Marketing",
    postedAgo: "4 days ago",
    level: "Mid",
    salary: "Competitive",
    duration: "Long-term",
    summary:
      "We're looking for a Marketing Specialist to drive our community growth and brand presence. You'll plan campaigns, manage content calendars, and engage with our audience across multiple platforms.",
    responsibilities: [
      "Plan and execute marketing campaigns",
      "Manage social media content and community",
      "Analyze campaign performance and iterate",
      "Collaborate with creative and product teams",
    ],
    requirements: [
      "2+ years in digital marketing",
      "Experience with social media platforms",
      "Strong written communication",
      "Data-driven mindset",
    ],
    niceToHave: [
      "Gaming industry experience",
      "Influencer / community management",
      "Paid ads experience",
    ],
    skills: ["Marketing", "Social Media", "Content", "Analytics"],
  },
];

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

const FILTERS = ["All", "Art", "Production", "Marketing"] as const;
type FilterType = (typeof FILTERS)[number];

const BENEFITS = [
  {
    title: "Transparency and openness",
    desc: "We build trusting relationships through honest and open communication. Everyone in our team is free to express their thoughts and ideas, knowing that they will be heard and supported.",
    icon: "transparency",
    color: "#f59e0b",
  },
  {
    title: "Friendliness and support",
    desc: "We create an atmosphere where everyone feels comfortable and can be themselves. There is no place for formalities in our team â€” only mutual assistance, warmth and team spirit.",
    icon: "friendliness",
    color: "#f59e0b",
  },
  {
    title: "Comfort and care",
    desc: "We care about the well-being of each team member, providing comfortable working conditions and support in any situation. Together we create an environment where everyone feels like part of a big family.",
    icon: "comfort",
    color: "#f59e0b",
  },
  {
    title: "Shared growth",
    desc: "Passionate about mentoring, we support ongoing learning, internal R&D, and community engagement to grow skills, confidence, and studio expertise in every team member.",
    icon: "growth",
    color: "#f59e0b",
  },
  {
    title: "Work-life balance",
    desc: "We respect your time outside work. Flexible hours, clear boundaries, and a culture that values rest help our team stay creative and motivated for the long run.",
    icon: "balance",
    color: "#f59e0b",
  },
];

function BenefitIcon({ name, color }: { name: string; color: string }) {
  const stroke = color;
  const fill = `${color}20`;

  if (name === "transparency") {
    // Eye + sparkle for openness/transparency
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
    // Two chat bubbles connecting
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
    // Heart + shield for care
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
    // Plant growing / chart up
    return (
      <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
        <path
          d="M5 27H27"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M16 27V14"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
        />
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
        <path
          d="M22 22L25 19L27 21"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 22L8 19L10 21"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "balance") {
    // Scale / clock balance
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

  return null;
}

export default function CareersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const counts = useMemo(
    () => ({
      All: ROLES.length,
      Art: ROLES.filter((r) => r.primaryCategory === "Art").length,
      Production: ROLES.filter((r) => r.primaryCategory === "Production").length,
      Marketing: ROLES.filter((r) => r.primaryCategory === "Marketing").length,
    }),
    [],
  );

  const filteredRoles = useMemo(() => {
    return ROLES.filter((role) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === "" ||
        role.title.toLowerCase().includes(q) ||
        role.description.toLowerCase().includes(q);
      const matchesFilter =
        activeFilter === "All" || role.primaryCategory === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  return (
    <>
      <SiteHeader />
      <main
        className={`min-h-screen bg-[#090a10] text-white ${nunitoSans.className}`}
      >
        {/* Hero Section */}
        <section className="relative h-[100vh] overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 z-0">
            <Image
              src="https://cdn.tdgamestudio.com/landing/images/f0d05f71-5089-4b3f-b453-7a8d19afc013.png"
              alt=""
              fill
              className="object-cover object-[center_35%]"
              sizes="100vw"
              priority
            />
          </div>

          <div
            className="relative z-10 mx-auto flex h-[100vh] items-end px-4 pb-16 pt-28 md:items-center md:pb-24 md:pt-32"
            style={{ width: "var(--layout-width, 75%)" }}
          >
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#ff9f1a]">
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
                    {ROLES.length} Open Positions
                  </span>
                </div>

                <h2
                  className="text-left text-3xl font-black uppercase leading-[1.08] tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  Find your <AccentHighlight>next adventure</AccentHighlight>
                </h2>
                <p className="mt-4 max-w-xl text-left text-sm leading-relaxed text-white/65 md:text-base">
                  Join a team of passionate artists building memorable game experiences â€” animation, VFX, illustration, and more.
                </p>
              </header>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search */}
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

                {/* Filter buttons */}
                <div className="flex flex-wrap gap-2">
                  {FILTERS.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        activeFilter === filter
                          ? "border-[#f59e0b] bg-[#f59e0b] text-black"
                          : "border-white/15 bg-white/5 text-white/80 hover:border-white/30"
                      }`}
                    >
                      {filter} ({counts[filter]})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Roles list */}
            <div className="mt-10 md:mt-12">

            {/* Roles list */}
            <ul className="flex flex-col gap-3">
              {filteredRoles.length === 0 ? (
                <li className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/60">
                  No positions match your search.
                </li>
              ) : (
                filteredRoles.map((role) => (
                  <li
                    key={role.id}
                    className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all hover:border-[#f59e0b]/40 hover:bg-white/[0.05]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      {/* Image */}
                      <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-28 sm:w-48">
                        <Image
                          src={role.image}
                          alt={role.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 192px"
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
                              {role.title}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                              {role.categories.map((cat) => (
                                <span
                                  key={cat}
                                  className="rounded-md border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f59e0b]"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-white/60">
                            {role.description}
                          </p>
                        </div>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-white/70 lg:shrink-0">
                          <span className="flex items-center gap-1.5">
                            <svg
                              className="h-4 w-4 text-white/50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {role.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <svg
                              className="h-4 w-4 text-white/50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            {role.type}
                          </span>
                        </div>

                        {/* Action button */}
                        <button
                          type="button"
                          onClick={() => setSelectedRole(role)}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#f59e0b]/50 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-[#f59e0b] transition-all hover:bg-[#f59e0b] hover:text-black"
                        >
                          View Details
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>

            {/* View all link */}
            <div className="mt-10 text-center">
              <Link
                href="/careers/all"
                className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-[#f59e0b] transition-colors hover:text-[#ffb366]"
              >
                View All Positions
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
            </div>
          </div>
        </section>

        {/* Benefits / Our Values Section */}
        <section className="relative overflow-hidden border-b border-[#ff8c3a]/20 py-14 md:py-20 lg:py-24">
          {/* Background effects */}
          <div
            className="pointer-events-none absolute -right-24 top-0 h-[320px] w-[320px] rounded-full bg-purple-500/10 blur-[100px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-24 bottom-0 h-[320px] w-[320px] rounded-full bg-[#ff8c3a]/8 blur-[100px]"
            aria-hidden
          />

          <div
            className="relative z-10 mx-auto px-4"
            style={{ width: "min(var(--layout-width, 90%), 1280px)" }}
          >
            <header>
              <div className="mb-4 flex items-center gap-4">
                <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.35)]">
                  // 02
                </span>
                <div className="h-px w-12 shrink-0 bg-linear-to-r from-[#ff8c3a]/55 to-white/12" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">
                  Why join us
                </span>
              </div>

              <h2
                className="text-left text-3xl font-black uppercase leading-[1.08] tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                Our <AccentHighlight>Values</AccentHighlight>
              </h2>
              <p className="mt-4 max-w-xl text-left text-sm leading-relaxed text-white/65 md:text-base">
                The principles that shape our team â€” how we work, how we treat each other, and how we grow together.
              </p>
            </header>

            {/* Benefits grid */}
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:mt-12">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl"
                >
                  {/* Hover glow */}
                  <div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${benefit.color}25, transparent 70%)`,
                    }}
                  />

                  {/* Icon */}
                  <div className="relative">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl border"
                      style={{
                        borderColor: `${benefit.color}40`,
                        backgroundColor: `${benefit.color}15`,
                        boxShadow: `0 0 24px ${benefit.color}15`,
                      }}
                    >
                      <BenefitIcon name={benefit.icon} color={benefit.color} />
                    </div>

                    {/* Title */}
                    <h3
                      className="mt-5 text-lg font-bold leading-tight text-white"
                      style={{ fontFamily: "var(--font-rajdhani)" }}
                    >
                      {benefit.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-3 text-sm leading-relaxed text-white/65">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hiring Process Section */}
        <section className="relative overflow-hidden border-b border-[#ff8c3a]/20 bg-[linear-gradient(165deg,#14151f_0%,#0e0f14_42%,#0a0a10_100%)] py-14 md:py-20 lg:py-24">
          <div
            className="pointer-events-none absolute -right-24 top-0 h-[320px] w-[320px] rounded-full bg-[#ff8c3a]/08 blur-[100px]"
            aria-hidden
          />

          <div
            className="relative mx-auto px-4"
            style={{ width: "min(var(--layout-width, 90%), 1280px)" }}
          >
            <header>
              <div className="mb-4 flex items-center gap-4">
                <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.35)]">
                  // 03
                </span>
                <div className="h-px w-12 shrink-0 bg-linear-to-r from-[#ff8c3a]/55 to-white/12" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">
                  5 Steps
                </span>
              </div>

              <h2
                className="text-left text-3xl font-black uppercase leading-[1.08] tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                Hiring <AccentHighlight>Process</AccentHighlight>
              </h2>
              <p className="mt-4 max-w-xl text-left text-sm leading-relaxed text-white/65 md:text-base">
                Simple. Transparent. People-first. Here&apos;s what to expect when you apply with us.
              </p>
            </header>

            {/* Timeline */}
            <div className="mt-12 md:mt-14">
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
                {HIRING_STEPS.map((step, idx) => (
                  <div
                    key={step.n}
                    className="relative flex flex-col items-center text-center"
                  >
                    {/* Connector line */}
                    {idx < HIRING_STEPS.length - 1 && (
                      <div className="absolute left-[60%] top-7 hidden h-px w-[80%] md:block">
                        <div className="relative h-full w-full">
                          <div className="h-full w-full bg-gradient-to-r from-[#f59e0b]/40 to-[#f59e0b]/10" />
                          <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#f59e0b]" />
                        </div>
                      </div>
                    )}

                    {/* Icon circle */}
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-[#f59e0b]/30 bg-[#0d0e15] text-[#f59e0b] shadow-[0_0_24px_rgba(255,140,58,0.15)]">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={step.iconPath}
                        />
                      </svg>
                    </div>

                    {/* Number */}
                    <p
                      className="mt-3 text-lg font-black text-[#f59e0b]"
                      style={{ fontFamily: "var(--font-rajdhani)" }}
                    >
                      {step.n}
                    </p>

                    {/* Title */}
                    <p
                      className="mt-1 text-sm font-bold text-white"
                      style={{ fontFamily: "var(--font-rajdhani)" }}
                    >
                      {step.title}
                    </p>

                    {/* Description */}
                    <p className="mt-1 text-xs leading-relaxed text-white/60">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Life at TD Games Section */}
        <section className="relative overflow-hidden border-b border-[#ff8c3a]/20 py-14 md:py-20 lg:py-24">
          <div
            className="pointer-events-none absolute -left-24 top-0 h-[320px] w-[320px] rounded-full bg-[#ff8c3a]/08 blur-[100px]"
            aria-hidden
          />

          <div
            className="relative mx-auto px-4"
            style={{ width: "min(var(--layout-width, 90%), 1280px)" }}
          >
            <header>
              <div className="mb-4 flex items-center gap-4">
                <span className="text-sm font-black italic tracking-tighter text-[#ffb04a] drop-shadow-[0_0_12px_rgba(255,176,74,0.35)]">
                  // 04
                </span>
                <div className="h-px w-12 shrink-0 bg-linear-to-r from-[#ff8c3a]/55 to-white/12" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffcc8e]/80">
                  Behind the scenes
                </span>
              </div>

              <h2
                className="text-left text-3xl font-black uppercase leading-[1.08] tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
                style={{ fontFamily: "var(--font-rajdhani)" }}
              >
                Life at <AccentHighlight>TD Games</AccentHighlight>
              </h2>
              <p className="mt-4 max-w-xl text-left text-sm leading-relaxed text-white/65 md:text-base">
                We work. We play. We level up. Take a peek inside our studio â€” where creativity meets community.
              </p>
            </header>

            <div className="mt-10 grid grid-cols-2 gap-3 md:mt-12 md:grid-cols-4">
              {LIFE_PHOTOS.map((photo, i) => (
                <div
                  key={i}
                  className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-white/10"
                >
                  <Image
                    src={photo}
                    alt={`Life at TD Games ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20">
          <div
            className="mx-auto px-4"
            style={{ width: "min(var(--layout-width, 90%), 1280px)" }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-[#f59e0b]/20 bg-gradient-to-br from-[#1a1410] via-[#0f0d12] to-[#0a0a10] p-8 md:p-12">
              {/* Background image */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-30">
                <Image
                  src="https://cdn.tdgamestudio.com/landing/images/summoners.png"
                  alt=""
                  fill
                  className="object-cover object-right"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#0f0d12]/60 to-[#0f0d12]" />
              </div>

              <div className="relative z-10 max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ff9f1a]">
                  Ready to build amazing worlds together?
                </p>
                <h2
                  className="mt-3 text-3xl font-black tracking-tight md:text-4xl"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  We&apos;d love to hear from you.
                </h2>
                <p className="mt-3 text-sm text-white/70 md:text-base">
                  Bring your passion. Let&apos;s create something unforgettable.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#open-roles"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#f59e0b] px-6 py-3 text-xs font-black uppercase tracking-[0.15em] text-black transition-colors hover:bg-[#ffb366]"
                  >
                    See Open Positions
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
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

type RoleDetailPanelProps = {
  role: Role | null;
  onClose: () => void;
};

function RoleDetailPanel({ role, onClose }: RoleDetailPanelProps) {
  const isOpen = role !== null;

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
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Hero image */}
              <div className="relative h-56 w-full overflow-hidden">
                <Image
                  src={role.image}
                  alt={role.title}
                  fill
                  className="object-cover"
                  sizes="640px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e15] via-[#0d0e15]/30 to-transparent" />
              </div>

              <div className="px-6 py-6">
                {/* Title */}
                <div className="flex flex-wrap items-start gap-2">
                  <h2
                    className="text-3xl font-black tracking-tight text-white"
                    style={{ fontFamily: "var(--font-rajdhani)" }}
                  >
                    {role.title}
                  </h2>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {role.categories.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-md border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f59e0b]"
                    >
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
                    Posted {role.postedAgo}
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">
                    Summary
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    {role.summary}
                  </p>
                </section>

                {/* Quick info grid */}
                <section className="mt-6 grid grid-cols-2 gap-4">
                  <InfoCard
                    iconPath="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    label="Featured Job"
                    value="Featured"
                  />
                  <InfoCard
                    iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    label="Type"
                    value={role.type}
                  />
                  <InfoCard
                    iconPath="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    label="Duration"
                    value={role.duration}
                  />
                  <InfoCard
                    iconPath="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    label="Level"
                    value={role.level}
                  />
                </section>

                {/* Responsibilities */}
                <section className="mt-8 border-t border-white/10 pt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">
                    Responsibilities
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {role.responsibilities.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/70">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f59e0b]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Requirements */}
                <section className="mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">
                    Requirements
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {role.requirements.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/70">
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Nice to have */}
                <section className="mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">
                    Nice to have
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {role.niceToHave.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/60">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Skills */}
                <section className="mt-8 border-t border-white/10 pt-6 pb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/90">
                    Skills & Expertise
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {role.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {/* Sticky footer with apply button */}
            <div className="border-t border-white/10 bg-[#0a0a10] px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    Compensation
                  </p>
                  <p className="text-sm font-bold text-white">{role.salary}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/80 transition-colors hover:border-white/30 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Save
                  </button>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#f59e0b] px-6 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-black transition-colors hover:bg-[#ffb366]"
                  >
                    Apply Now
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function InfoCard({
  iconPath,
  label,
  value,
}: {
  iconPath: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#f59e0b]/20 bg-[#f59e0b]/5 text-[#f59e0b]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
            {label}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
