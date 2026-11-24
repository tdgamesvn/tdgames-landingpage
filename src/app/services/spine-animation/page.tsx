import Link from "next/link";
import type { ReactNode } from "react";
import { Changa_One, Nunito_Sans } from "next/font/google";

import ContactShowcaseSection from "@/components/contact-showcase-section";
import JsonLd from "@/components/json-ld";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import LoopVideo from "@/components/spine-service/loop-video";
import MonsterLegendsLive from "@/components/spine-service/monster-legends-live";
import SpineHero from "@/components/spine-service/spine-hero";
import { ORG_ID, absoluteUrl, breadcrumbJsonLd } from "@/lib/json-ld";
import { ANIMATION_LABELS, cdnFor, monsterFactory } from "@/app/portfolio/_monster-legends/shared";
import { projectMeta as fireMeta } from "@/app/portfolio/monster-legends-fire/project-data";

import {
  KAYN_IMAGE,
  ROSTER,
  STICKMAN,
  SUMMONER_ERA_CLIPS,
  SUMMONER_ERA_LABEL,
  TWINS,
  YOMI_CLIPS,
} from "./showcase-data";

const changaOne = Changa_One({ weight: "400", subsets: ["latin"] });
const nunitoSans = Nunito_Sans({ weight: ["400", "600", "700"], subsets: ["latin"] });

const PATH = "/services/spine-animation";
const DESCRIPTION =
  "Spine 2D animation for RPG, gacha and fighting games: heroes, monsters, bosses and super moves, delivered as Spine project files and exports your engine can load.";

// Kennix Solaris (hệ Fire) — con sếp dùng trong mockup; Adult mặc định + Awakened.
const KENNIX = [
  monsterFactory("fire")("kennix-solaris", "Kennix Solaris", "Architect", ["stage1", "stage3", "awakened"], { awakened: 1.2 }),
];

const WRAP = "mx-auto w-[90vw] max-w-[1280px]";

function SectionHead({
  title,
  children,
  aside,
}: {
  title: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-8 grid items-end gap-6 md:mb-10 md:grid-cols-[1fr_auto]">
      <div>
        <h2
          className="text-[38px] font-black uppercase leading-[1.05] tracking-[-0.8px] md:text-[52px] md:tracking-[-1.3px]"
          style={{ fontFamily: "var(--font-rajdhani)" }}
        >
          {title}
        </h2>
        <p className="mt-3 max-w-[34em] text-base leading-relaxed text-gray-300 md:text-[17px]">{children}</p>
      </div>
      {aside ? <div className="text-sm text-gray-400 md:text-right">{aside}</div> : null}
    </div>
  );
}

function Client({ name, note }: { name: string; note: string }) {
  return (
    <>
      <b className="block text-[22px] font-bold text-white" style={{ fontFamily: "var(--font-rajdhani)" }}>
        {name}
      </b>
      {note}
    </>
  );
}

function Caption({ title, sub, size = "lg" }: { title: string; sub: string; size?: "lg" | "md" }) {
  return (
    <figcaption className="absolute inset-x-4 bottom-3.5 z-[1] md:inset-x-5 md:bottom-4">
      <b
        className={`block font-bold uppercase leading-none ${size === "lg" ? "text-[26px] md:text-[30px]" : "text-[19px] md:text-[23px]"}`}
        style={{ fontFamily: "var(--font-rajdhani)" }}
      >
        {title}
      </b>
      <span className="mt-1 block text-[13px] text-gray-300 md:text-sm">{sub}</span>
    </figcaption>
  );
}

function Chips({ items, active }: { items: readonly string[]; active: string }) {
  return (
    <div className="absolute left-4 top-3.5 z-[1] flex flex-wrap gap-1.5 md:left-5 md:top-4">
      {items.map((m) => (
        <span
          key={m}
          className={`rounded-full border px-3 py-1 text-[12px] font-semibold md:text-[13px] ${
            m === active ? "border-[#f59e0b] bg-[#f59e0b]/20 text-white" : "border-white/20 bg-black/35 text-gray-300"
          }`}
        >
          {m}
        </span>
      ))}
    </div>
  );
}

const Fade = () => (
  <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,.7),transparent_40%)]" />
);

const Tag = ({ children }: { children: ReactNode }) => (
  <span className="absolute left-4 top-3.5 z-[1] rounded-md border border-white/10 bg-black/60 px-2.5 py-0.5 text-[12px] text-[#ffcc8e] md:left-5 md:top-4">
    {children}
  </span>
);

// Theo case study Monster Legends (sếp duyệt): mỗi bậc một skeleton, 7 animation/rig, 10 hệ.
const ML_FACTS = [
  ["Baby, Adult, Awakened", "Each form is its own Spine skeleton, built from Social Point's monster art."],
  ["7 battle animations", "Idle, walk, attack, skill, special, level up and knocked out."],
  ["Events for gameplay", "Hit and effect cues are keyed in the rig, so the game knows when the blow lands."],
  ["10 elements", "Fire, water, nature, earth, thunder, dark, light, magic, metal and special."],
] as const;

// 4 câu khách hỏi trước khi thuê (sếp duyệt 2026-11-24). Chỉ dùng thông tin site đã công bố:
// FAQ 2D animation (rig theo style/rig khách, báo giá + ngày giao trong 24h, review 3 mốc,
// múi giờ GMT+7), số liệu 50+/1200+/12+, pipeline Unity/Cocos (About/company profile).
// Sếp cho số 2026-11-24: hero kit 3–5 ngày; 10–20 nhân vật/tháng tuỳ độ phức tạp, tăng được
// bằng nhân sự inhouse + mạng freelancer; test free hoặc trả phí tuỳ độ phức tạp + quy mô.
const QUESTIONS: readonly {
  q: string;
  a: string;
  proof?: { label: string; href: string };
  stats?: readonly (readonly [string, string])[];
}[] = [
  {
    q: "Will it still look like our art?",
    a: "We rig from your PSD and follow your style guide and bone naming. If a part is missing behind an arm or under a cape, we flag it before we animate. Reviews happen at blocking, timing and polish, so changes land while they are still cheap.",
  },
  {
    q: "Will it run in our engine on day one?",
    a: "You get the .spine project, skeleton and atlas, exported for the Spine version your runtime uses, from pipelines that ship to Unity and Cocos. Hit frames are keyed as Spine events your code can listen for.",
    proof: { label: "See the events on the Monster Legends rig above", href: "#work" },
  },
  {
    q: "How fast, and how many?",
    a: "Need a big batch on a short deadline? We add in-house artists and our freelance network to scale past that. Send a brief and you get a price per kit and a delivery date within 24 hours, before you sign.",
    stats: [
      ["3–5 days", "per hero kit"],
      ["10–20", "characters a month, by complexity"],
    ],
  },
  {
    q: "Why trust a studio we haven't used?",
    a: "Start with a test character and judge the work. Depending on its complexity and the size of your project, the test is free or paid. We work in GMT+7, so feedback sent at the end of a US day is actioned before the next morning.",
    stats: [
      ["50+", "projects delivered"],
      ["1,200+", "assets shipped"],
      ["12+", "studios came back"],
    ],
  },
];

const KIT = ["Idle", "Walk / run", "Attack", "Skill", "Ultimate", "Hit", "Die", "Victory", "Evolutions and skins"] as const;

export default function SpineAnimationPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Spine Animation",
      serviceType: "Spine 2D animation outsourcing",
      url: absoluteUrl(PATH),
      description: DESCRIPTION,
      image: "https://cdn.tdgamestudio.com/landing/og/spine-animation-v1.jpg",
      provider: { "@id": ORG_ID },
      areaServed: "Worldwide",
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "2D Animation", path: "/services/2d-animation" },
      { name: "Spine Animation", path: PATH },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader />
      <main className={`min-h-screen bg-[#0a0a0a] text-white ${nunitoSans.className}`}>
        <SpineHero roster={ROSTER} titleClassName={changaOne.className} />

        {/* Số liệu */}
        <div className="border-b border-white/10">
          <dl className={`${WRAP} flex flex-wrap gap-x-11 gap-y-3 py-5 text-[15px] text-gray-400`}>
            {[
              ["Social Point", "Monster Legends client"],
              ["10", "Monster Legends elements"],
              ["18", "Yomi 2 super moves"],
              ["3 forms", "Baby, Adult, Awakened per monster"],
            ].map(([k, v]) => (
              <div key={v} className="flex items-baseline gap-2">
                <dt className="order-2">{v}</dt>
                <dd className="text-[26px] font-bold leading-none text-white md:text-[30px]" style={{ fontFamily: "var(--font-rajdhani)" }}>
                  {k}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 1. Monster Legends chạy Spine thật */}
        <section id="work" className="scroll-mt-24 pt-20 md:pt-28">
          <div className={WRAP}>
            <SectionHead
              title={
                <>
                  Monster Legends,
                  <br />
                  running live
                </>
              }
              aside={<Client name="Social Point" note="Client work across every element" />}
            >
              This is the rig we built for Social Point, playing in a Spine player on this page. Pick a form or a move,
              and the keyframes below are read straight from the file.
            </SectionHead>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-10 [&>*]:min-w-0">
              <MonsterLegendsLive
                roster={KENNIX}
                background={`${cdnFor("fire")}/arena-v3.webp`}
                groundY={0.59}
                backgroundRoom={1.5}
                labels={ANIMATION_LABELS}
                theme={fireMeta.theme}
              />
              <aside className="lg:pt-[60px]">
                <h3 className="text-[22px] font-bold uppercase leading-none md:text-[26px]" style={{ fontFamily: "var(--font-rajdhani)" }}>
                  Monster Legends at a glance
                </h3>
                <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
                  {ML_FACTS.map(([k, v]) => (
                    <li key={k} className="py-4">
                      <b className="block text-[19px] font-bold text-white" style={{ fontFamily: "var(--font-rajdhani)" }}>
                        {k}
                      </b>
                      <span className="text-[15px] text-gray-400">{v}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[15px] text-gray-400">
                  Every element is playable in the browser.{" "}
                  <Link href="/portfolio/monster-legends" className="font-semibold text-[#f59e0b] hover:text-[#ffcc8e]">
                    Open the Monster Legends rigs
                  </Link>
                </p>
              </aside>
            </div>
          </div>
        </section>

        {/* 2. Boss + quái */}
        <section className="pt-20 md:pt-28">
          <div className={WRAP}>
            <SectionHead
              title={
                <>
                  Bosses built
                  <br />
                  for a full fight
                </>
              }
            >
              Every boss ships with the whole kit: idle, movement, combos and signature skills, timed so the hit reads at
              battle zoom.
            </SectionHead>
            <div className="grid gap-3 md:grid-cols-[7fr_5fr] md:grid-rows-[370px_270px] md:gap-5">
              <Link
                href="/portfolio/boss-animation"
                className="group relative block aspect-square overflow-hidden rounded-[14px] border border-white/10 bg-[#323232] md:row-span-2 md:aspect-auto"
              >
                <figure className="absolute inset-0 m-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={TWINS.poster}
                    alt="Samurai boss from The Twins, ground slam combo"
                    loading="lazy"
                    className="h-full w-full scale-[1.35] object-cover transition-transform duration-500 group-hover:scale-[1.4]"
                    style={{ objectPosition: "50% 78%", transformOrigin: "50% 80%" }}
                  />
                  <Chips items={TWINS.moves} active="Combo 4" />
                  <Caption title="The Twins" sub="Samurai boss, one of 10 boss reels. Watch the reels in the case study." />
                </figure>
              </Link>
              <Link
                href="/portfolio/stickman-legend"
                className="relative block aspect-[4/3] overflow-hidden rounded-[14px] border border-white/10 bg-[#3a3b42] md:aspect-auto"
              >
                <figure className="absolute inset-0 m-0">
                  <LoopVideo
                    src={STICKMAN.main.video}
                    poster={STICKMAN.main.poster}
                    label={`${STICKMAN.main.name}, ${STICKMAN.main.anim}`}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "50% 60%" }}
                  />
                  <Fade />
                  <Chips items={STICKMAN.kit} active={STICKMAN.main.anim} />
                  <Caption title={STICKMAN.main.name} sub="Stickman Legend, client work" />
                </figure>
              </Link>
              <div className="grid grid-cols-2 gap-3 md:gap-5">
                {STICKMAN.side.map((m) => (
                  <Link
                    key={m.name}
                    href="/portfolio/stickman-legend"
                    className="relative block aspect-square overflow-hidden rounded-[14px] border border-white/10 bg-[#3a3b42] md:aspect-auto"
                  >
                    <figure className="absolute inset-0 m-0">
                      <LoopVideo
                        src={m.video}
                        poster={m.poster}
                        label={`${m.name}, ${m.anim}`}
                        className="h-full w-full scale-[1.75] object-cover"
                        style={{ objectPosition: "50% 60%", transformOrigin: "50% 62%" }}
                      />
                      <Fade />
                      <Caption title={m.name} sub={m.anim} size="md" />
                    </figure>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Yomi 2 */}
        <section className="mt-20 bg-black py-16 md:mt-28 md:py-24">
          <div className={WRAP}>
            <SectionHead
              title={
                <>
                  Super moves,
                  <br />
                  cut for ultra-wide
                </>
              }
              aside={<Client name="Yomi 2" note="Client work, 2D fighting game" />}
            >
              For Yomi 2 we turned every finisher into a cinematic cut-in: camera push, key poses on the client&apos;s art,
              and hand-drawn fire, lightning and ice composited at 4K.
            </SectionHead>
            <div className="grid gap-1.5 md:grid-cols-2">
              {YOMI_CLIPS.map((c, i) => (
                <Link
                  key={c.who}
                  href="/portfolio/yomi-2"
                  className={`relative block aspect-[1920/834] overflow-hidden ${i === 0 ? "md:col-span-2" : ""}`}
                >
                  <figure className="absolute inset-0 m-0">
                    <LoopVideo src={c.video} poster={c.poster} label={`${c.who}, ${c.move}`} className="h-full w-full object-cover" />
                    <figcaption className="absolute bottom-3.5 left-4 text-sm text-gray-200 [text-shadow:0_1px_8px_#000] md:left-5">
                      <b className="mr-2 text-[22px] font-bold uppercase text-white md:text-[24px]" style={{ fontFamily: "var(--font-rajdhani)" }}>
                        {c.who}
                      </b>
                      {c.move}
                    </figcaption>
                  </figure>
                </Link>
              ))}
            </div>
            <dl className="mt-8 flex gap-10 text-[15px] text-gray-400 md:gap-12">
              {[
                ["18", "cutscenes"],
                ["9", "characters"],
                ["4K", "ultra-wide master"],
              ].map(([k, v]) => (
                <div key={v}>
                  <dd className="text-[40px] font-bold leading-none text-white md:text-[54px]" style={{ fontFamily: "var(--font-rajdhani)" }}>
                    {k}
                  </dd>
                  <dt>{v}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 4. Hero: login screen + skill */}
        <section className="pt-20 md:pt-28">
          <div className={WRAP}>
            <SectionHead
              title={
                <>
                  Heroes, from login
                  <br />
                  screen to skill
                </>
              }
            >
              Key art brought to life as a seamless login loop, and hero skills that land with weight in battle.
            </SectionHead>
            <div className="grid gap-3 md:grid-cols-2 md:gap-5">
              <Link
                href="/portfolio/kayn-snow-moon"
                className="relative block aspect-[16/10] overflow-hidden rounded-[14px] border border-white/10 md:col-span-2 md:aspect-[2.4/1]"
              >
                <figure className="absolute inset-0 m-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={KAYN_IMAGE}
                    alt="Kayn Snow Moon login screen animation"
                    loading="lazy"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "50% 30%" }}
                  />
                  <Fade />
                  <Tag>Fan-made piece</Tag>
                  <Caption title="Kayn Snow Moon" sub="League of Legends login screen, Spine and After Effects" />
                </figure>
              </Link>
              {SUMMONER_ERA_CLIPS.map((c) => (
                <Link
                  key={c.video}
                  href="/portfolio/summoner-era"
                  className="relative block aspect-[1400/582] overflow-hidden rounded-[14px] border border-white/10 bg-[#1c1c1c]"
                >
                  <figure className="absolute inset-0 m-0">
                    <LoopVideo src={c.video} poster={c.poster} label={`Summoner Era, ${c.label}`} className="h-full w-full object-cover" />
                    <Fade />
                    <Tag>{SUMMONER_ERA_LABEL}</Tag>
                    <Caption title="Summoner Era" sub={c.label} size="md" />
                  </figure>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Câu hỏi của khách */}
        <section className="pt-20 md:pt-28">
          <div className={WRAP}>
            <SectionHead
              title={
                <>
                  Before you send
                  <br />
                  us a character
                </>
              }
            >
              The four questions producers and art leads ask us first, answered with what we can show.
            </SectionHead>
            <div className="grid gap-3 md:grid-cols-2 md:gap-5">
              {QUESTIONS.map(({ q, a, proof, stats }) => (
                <article key={q} className="rounded-[14px] border border-white/10 bg-[#12141c] p-6 md:p-8">
                  <h3 className="text-[24px] font-bold leading-tight md:text-[28px]" style={{ fontFamily: "var(--font-rajdhani)" }}>
                    “{q}”
                  </h3>
                  {stats ? (
                    <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
                      {stats.map(([k, v]) => (
                        <div key={v} className="flex flex-col">
                          <dt className="order-2 mt-1 text-[13px] text-gray-400">{v}</dt>
                          <dd className="text-[34px] font-bold leading-none text-[#f59e0b] md:text-[40px]" style={{ fontFamily: "var(--font-rajdhani)" }}>
                            {k}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  <p className="mt-3 text-[15.5px] leading-relaxed text-gray-300 md:text-base">{a}</p>
                  {proof ? (
                    <Link href={proof.href} className="mt-4 inline-block text-[15px] font-semibold text-[#f59e0b] hover:text-[#ffcc8e]">
                      {proof.label}
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[15px] text-gray-400">A typical hero kit, adjusted to your combat system before we quote:</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {KIT.map((k) => (
                    <li key={k} className="rounded-full border border-white/15 px-3.5 py-1.5 text-[13px] font-semibold text-gray-200">
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="#quote"
                className="inline-block shrink-0 self-start rounded-xl border-2 border-[#f59e0b] bg-[#f59e0b] px-7 py-3.5 text-center text-base font-bold uppercase tracking-wider text-black transition-colors duration-300 hover:bg-transparent hover:text-white md:self-auto md:text-[17px]"
              >
                Request a test character
              </Link>
            </div>
          </div>
          <p className={`${WRAP} mt-10 text-[15px] text-gray-400`}>
            Need frame-by-frame, UI motion or cinematics too?{" "}
            <Link href="/services/2d-animation" className="font-semibold text-[#f59e0b] hover:text-[#ffcc8e]">
              See all 2D animation services
            </Link>
          </p>
        </section>

        <div id="quote" className="mt-20 scroll-mt-20 md:mt-28">
          <ContactShowcaseSection sectionStep="06" embedded />
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
