import Image from "next/image";

import ContactShowcaseSection from "@/components/contact-showcase-section";
import ServiceFaqSection from "@/components/service-faq-section";
import ServicePageTemplate from "@/components/service-page-template";
import ServiceWorkflowSection from "@/components/service-workflow-section";
import SiteFooter from "@/components/site-footer";
import { serviceFullGameProductionFaqItems } from "@/components/service-faq-presets";
import { serviceFullGameProductionWorkflowConfig } from "@/components/service-workflow-presets";
import type { ServiceCapabilityItem } from "@/components/service-capabilities-grid";
import { resolveSlot, resolveServiceCards } from "@/lib/page-slots";

export const revalidate = 60;

const PAGE = "services-full-game-production";

/** Card mặc định — dùng khi slot `service-card` của trang này chưa có row nào trong DB. */
const DEFAULT_CARDS: ServiceCapabilityItem[] = [
  {
    title: "Game design & GDD",
    description:
      "Core loop, progression, economy, and a design doc your team and ours both build against.",
    image: "https://cdn.tdgamestudio.com/ai/2026/09/d540bc1e-c303-4360-9ea1-ffd20ae6de46.webp",
  },
  {
    title: "Art direction & 2D art",
    description:
      "Style frames, characters, environments, props, and UI art built as one visual system.",
    image: "https://cdn.tdgamestudio.com/ai/2026/09/affd743b-b5f1-4b50-963c-92d000db7484.webp",
  },
  {
    title: "Animation & Spine rigs",
    description:
      "Gameplay loops, skill sets, cutscenes, and rigs authored for the engine they ship in.",
    image: "https://cdn.tdgamestudio.com/ai/2026/09/fe2899df-efe0-4609-8496-ca65fda5ecf8.webp",
  },
  {
    title: "VFX & game feel",
    description:
      "Hit feedback, skill effects, and UI flourishes tuned against real performance budgets.",
    image: "https://cdn.tdgamestudio.com/ai/2026/09/e76f822f-63ca-4307-8c4a-a438a6c834ef.webp",
  },
  {
    title: "Development & integration",
    description:
      "Unity client, gameplay systems, backend hooks, and asset pipelines wired end to end.",
    image: "https://cdn.tdgamestudio.com/ai/2026/09/d3670448-b4eb-4ac7-a2b0-d230fca27df4.webp",
  },
  {
    title: "QA, launch & liveops",
    description:
      "Device testing, balancing, store submission, then events and content updates after launch.",
    image: "https://cdn.tdgamestudio.com/ai/2026/09/27ac6cf9-ae9d-481d-b9f9-435774268cd7.webp",
  },
];

/** 8 scene gameplay Shake It! trên R2 (`landing/games/shake-it-water-sort/scene-01..08.webp`). */
const SHAKE_IT_SHOTS = Array.from(
  { length: 8 },
  (_, i) =>
    `https://cdn.tdgamestudio.com/landing/games/shake-it-water-sort/scene-${String(
      i + 1,
    ).padStart(2, "0")}.webp`,
);

const SHAKE_IT_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.td.capybara.watersort";

/** 12 scene gameplay Tidy Mart (art duyệt 2026-09-08, gốc 1080x2160 → webp w720). */
const TIDY_MART_SHOTS = [
  "https://cdn.tdgamestudio.com/projects/2026/09/0967efbd-c092-499e-a6b4-ba1235c22db7-tidy-mart-scene-01.webp",
  "https://cdn.tdgamestudio.com/projects/2026/09/e1244efe-5b65-4adb-8391-ab5b54a89547-tidy-mart-scene-02.webp",
  "https://cdn.tdgamestudio.com/projects/2026/09/d3da6cc4-038f-406c-b982-f8254d7e8862-tidy-mart-scene-03.webp",
  "https://cdn.tdgamestudio.com/projects/2026/09/4a866e1a-37e3-4b7a-b9b6-d0fcdea1c81f-tidy-mart-scene-04.webp",
  "https://cdn.tdgamestudio.com/projects/2026/09/287a23f7-3808-4cb5-bdd7-e752d8233de0-tidy-mart-scene-05.webp",
  "https://cdn.tdgamestudio.com/projects/2026/09/735b96f8-8e82-4544-abf9-e84824652f92-tidy-mart-scene-06.webp",
  "https://cdn.tdgamestudio.com/projects/2026/09/0d5cac56-3368-4a7b-99eb-5910485fefd1-tidy-mart-scene-07.webp",
  "https://cdn.tdgamestudio.com/projects/2026/09/255983ac-5a56-477c-adb4-34338f985cb2-tidy-mart-scene-08.webp",
  "https://cdn.tdgamestudio.com/projects/2026/09/37d95beb-40f4-49b8-9624-15118250d22d-tidy-mart-scene-09.webp",
  "https://cdn.tdgamestudio.com/projects/2026/09/152071df-fc83-4800-a860-2009e8b12dd3-tidy-mart-scene-10.webp",
  "https://cdn.tdgamestudio.com/projects/2026/09/544ea2a4-8e7b-4f37-ae1e-425e9b0bede2-tidy-mart-scene-11.webp",
  "https://cdn.tdgamestudio.com/projects/2026/09/7535a591-125e-4c13-9ee5-3760b895e144-tidy-mart-scene-12.webp",
];

type ShippedGame = {
  id: string;
  title: string;
  titleAccent?: string;
  blurb: string;
  /** Có link store thì hiện nút; không thì hiện `badge`. */
  storeUrl?: string;
  badge?: string;
  shots: string[];
  /** Game chưa lộ art — phủ đen 80% lên ảnh. */
  dim?: boolean;
};

/**
 * ponytail: chỉ còn game 3 ("Coming Soon") mượn tạm ảnh Shake It! — thay `shots`
 * khi có art thật. Tidy Mart đã có 12 scene thật, chưa lên store nên dùng `badge`
 * "In production" thay cho nút Google Play.
 */
const SHIPPED_GAMES: ShippedGame[] = [
  {
    id: "shake-it-water-sort",
    title: "Shake It!",
    titleAccent: "Water Sort Puzzle",
    blurb:
      "A casual puzzle title we took from concept to store: game design, character art, animation, VFX, Unity development and live updates.",
    storeUrl: SHAKE_IT_STORE_URL,
    shots: SHAKE_IT_SHOTS,
  },
  {
    id: "tidy-mart-sort",
    title: "Tidy Mart",
    titleAccent: "Sort Puzzle",
    blurb:
      "Shelf-sorting puzzle with a store-management meta layer — art direction, level design and Unity build handled in-house.",
    badge: "In production",
    shots: TIDY_MART_SHOTS,
  },
  {
    id: "next-title",
    title: "Coming Soon",
    blurb:
      "Our next self-published title is in production — art, systems and first playable are already running internally.",
    badge: "In production",
    shots: SHAKE_IT_SHOTS,
    dim: true,
  },
];

/**
 * Rail ảnh tự trôi ngang. ponytail: CSS `.animate-marquee` có sẵn — không cần
 * carousel lib hay client component. Duration = số ảnh × 4.5s nên thêm ảnh là rail
 * dài ra chứ không chạy nhanh hơn. `delay` âm để 3 rail lệch pha, đỡ trôi đồng loạt.
 * Dưới 5 ảnh thì rail lặp lại trông giả → render lưới tĩnh.
 */
function GameShotRail({ game, delay }: { game: ShippedGame; delay: number }) {
  const shot = (src: string, i: number, copy: number) => {
    const decorative = copy !== 0;
    return (
    <div
      key={`${copy}-${i}-${src}`}
      className="relative mr-4 aspect-[9/16] w-[168px] shrink-0 overflow-hidden rounded-[22px] border border-white/12 bg-black shadow-[0_18px_50px_rgba(0,0,0,0.45)] md:w-[200px]"
    >
      <Image
        src={src}
        alt={decorative ? "" : `${game.title} gameplay scene ${i + 1}`}
        aria-hidden={decorative}
        fill
        sizes="200px"
        // ponytail: scale-125 đi kèm blur — không phóng to thì mép ảnh bị blur ra
        // trong suốt, lòi viền xám quanh khung.
        className={`object-cover${game.dim ? " scale-125 blur-xl" : ""}`}
      />
      {game.dim ? (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      ) : null}
    </div>
    );
  };

  if (game.shots.length < 5) {
    return <div className="mt-6 flex flex-wrap">{game.shots.map((src, i) => shot(src, i, 0))}</div>;
  }

  return (
    // ponytail: mask-image làm mờ 2 mép thay vì chồng 2 div gradient — đỡ phải đoán
    // màu nền (nền section là gradient, gradient giả sẽ lệch màu).
    <div className="mt-6 overflow-hidden pb-2 [mask-image:linear-gradient(to_right,transparent_0,black_7%,black_93%,transparent_100%)] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]">
      <div
        // ponytail: khoảng cách bằng mr-4 trên từng item, KHÔNG dùng gap-4 — gap chỉ
        // chèn giữa các item nên 1/3 track ≠ đúng 1 bộ ảnh, mỗi vòng lặp giật ~5px.
        className="animate-marquee flex w-max hover:[animation-play-state:paused] motion-reduce:[animation:none]"
        style={{
          animationDuration: `${game.shots.length * 4.5}s`,
          animationDelay: `-${delay}s`,
        }}
      >
        {/* 3 bộ: keyframe `marquee` chạy -33.333% nên track phải gấp 3 mới liền mạch */}
        {[0, 1, 2].map((copy) => game.shots.map((src, i) => shot(src, i, copy)))}
      </div>
    </div>
  );
}

export default async function ServiceFullGameProductionPage() {
  const [heroImage, cards] = await Promise.all([
    resolveSlot(
      PAGE,
      "hero",
      // ponytail: squad 6 nhân vật core dồn sang phải, 40% trái để trống tối cho chữ
      // hero đọc được. Ảnh gốc AI có dải đen letterbox → đã sharp .trim() rồi up lại.
      "https://cdn.tdgamestudio.com/projects/2026/09/158deb1a-5ea9-4cb9-b521-fd76c1438e3b-hero-trim.webp",
    ),
    resolveServiceCards(PAGE, DEFAULT_CARDS),
  ]);

  return (
    <ServicePageTemplate
      eyebrow=""
      title="Full Game Production"
      subtitle="One team for game design, art, animation, VFX and development."
      showDeliverRelated={false}
      appendSections={
        <>
          <ServiceWorkflowSection {...serviceFullGameProductionWorkflowConfig} />

          {/*
            ponytail: section "// 03 Game production showreel" đã xoá 2026-09-09 —
            chưa có video thật. Khôi phục từ git (`git log -S showreel-full-game-production`)
            khi quay xong, nhớ đánh lại số section.
          */}
          <section
            id="shipped-titles"
            className="border-t border-[#252525] bg-[linear-gradient(180deg,#0a0a10_0%,#141118_100%)] py-14 text-white md:py-20"
          >
            <div className="mx-auto" style={{ width: "min(var(--layout-width, 85%), 1240px)" }}>
              <div className="mb-6 flex items-center gap-4">
                <span className="text-sm font-black italic tracking-tighter text-[#ff8c3a]">
                  {"// 03"}
                </span>
                <div className="h-px w-10 shrink-0 bg-white/10" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
                  Shipped titles
                </span>
              </div>

              <div className="max-w-[720px]">
                <h2
                  className="text-3xl font-black uppercase tracking-tight md:text-5xl"
                  style={{ fontFamily: "var(--font-rajdhani)" }}
                >
                  Games we <span className="text-[#ff8c3a]">shipped end to end</span>
                </h2>
                <p className="mt-3 text-white/65">
                  Game design, character art, animation, VFX, Unity development and live
                  updates — built in-house and taken all the way to the store.
                </p>
              </div>

              {/*
                ponytail: 3 game là CON của h2 — thể hiện bằng 1 đường rail dọc + nhánh
                ngang vào từng game (kiểu cây thư mục) và h3 nhỏ hơn hẳn h2, kèm số thứ
                tự. Không thêm card/box: viền hộp lồng nhau sẽ đánh nhau với border-top
                sẵn có giữa các game.
              */}
              <div className="mt-10 md:border-l md:border-white/12 md:pl-10">
                {SHIPPED_GAMES.map((game, i) => (
                <article
                  key={game.id}
                  id={game.id}
                  className="relative mt-10 border-t border-white/10 pt-10 first:mt-0 first:border-t-0 first:pt-0"
                >
                  <span
                    aria-hidden
                    className="absolute top-3 -left-10 hidden h-px w-6 bg-white/15 md:block"
                  />
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-[680px]">
                      <h3
                        className="flex items-baseline gap-3 text-xl font-black uppercase tracking-tight md:text-2xl"
                        style={{ fontFamily: "var(--font-rajdhani)" }}
                      >
                        <span className="text-sm font-black tabular-nums text-[#ff8c3a]/60">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>
                        {game.title}
                        {game.titleAccent ? (
                          <span className="text-[#ff8c3a]"> {game.titleAccent}</span>
                        ) : null}
                        </span>
                      </h3>
                      <p className="mt-2 text-sm text-white/60 md:text-base">{game.blurb}</p>
                    </div>
                    {game.storeUrl ? (
                      <a
                        href={game.storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border-2 border-[#f59e0b] bg-[#f59e0b] px-6 py-3 text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-transparent hover:text-white md:self-auto"
                      >
                        Play on Google Play
                      </a>
                    ) : game.badge ? (
                      <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white/45 md:self-auto">
                        {game.badge}
                      </span>
                    ) : null}
                  </div>
                  <GameShotRail game={game} delay={i * 6} />
                </article>
                ))}
              </div>

              <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/30 md:pl-10">
                Hover to pause
              </p>
            </div>
          </section>

          {/*
            ponytail: section "// 04 FEATURED client titles" xoá 2026-09-09 — 3 card đều là
            outsource visual (Summoner Era / Puzzle Wonderland / Axie), không thuộc full game
            production. Chúng vẫn nằm ở /portfolio và 3 trang service 2D.
            Khôi phục: `git log -S featured-full-game-production`.
          */}
          <ServiceFaqSection
            id="faq-full-game-production"
            sectionStep="// 04"
            intro="How we scope, price, and ship a full game — and what you own at the end."
            items={serviceFullGameProductionFaqItems}
          />
          <ContactShowcaseSection sectionStep="05" />
          <SiteFooter />
        </>
      }
      hero={{
        image: heroImage,
        titleTop: "FULL GAME",
        titleMain: "PRODUCTION",
        subheading: "From concept to store build, under one roof",
        description:
          "Game design, 2D art, animation, VFX, and development handled by a single accountable team. You get a playable build at every milestone — and full ownership of the source, art, and IP at the end.",
        ctaLabel: "Start your game",
      }}
      capabilities={{
        eyebrow: "What we do",
        sectionMarker: { step: "01", label: "What we do" },
        titlePrefix: "OUR ",
        titleHighlight: "FULL GAME",
        titleSuffix: " SERVICES",
        items: cards,
      }}
    />
  );
}
