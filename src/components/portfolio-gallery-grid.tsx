import Image from "next/image";
import Link from "next/link";

import { AccentHighlight } from "@/components/accent-highlight";

export type PortfolioGalleryItem = {
  id: string;
  title: string;
  tag: string;
  image: string;
  /** Link for VIEW PROJECT button */
  href?: string;
};

/** 10 projects — adjust in production */
const DEFAULT_ITEMS: PortfolioGalleryItem[] = [
  {
    id: "kayn-snow-moon",
    title: "Kayn Snow Moon | League of Legends - Login Screen",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/5ad036149524063.Y3JvcCwxOTgxLDE1NTAsMCww.png",
    href: "/portfolio/kayn-snow-moon",
  },
  {
    id: "horse-racing",
    title: "Horse Racing - Splash Art Animation",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/cad425183792791.Y3JvcCwyMzkyLDE4NzAsMCww.jpg",
    href: "/portfolio/horse-racing",
  },
  {
    id: "lore-axie-origin",
    title: "Lore Axie Origin | Cinematic",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/501fca163362313.Y3JvcCwxOTgxLDE1NTAsOSww.png",
    href: "/portfolio/lore-axie-origin",
  },
  {
    id: "axie-infinity-origins",
    title: "Axie Infinity - Origins | Animation",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/924075153491527.Y3JvcCwxOTgxLDE1NTAsOSww.png",
    href: "/portfolio/axie-infinity-origins",
  },
  {
    id: "boss-animation",
    title: "Boss Animation - The Twins",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/9e2264152981257.Y3JvcCwxOTgxLDE1NTAsOSww.png",
    href: "/portfolio/boss-animation",
  },
  {
    id: "heroes-fire",
    title: "Animation/VFX - Heroes Fire | Summoner Era",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/d50de7152527397.Y3JvcCwxOTgxLDE1NTAsOSww.png",
    href: "/portfolio/heroes-fire",
  },
  {
    id: "summoner-era-2020",
    title: "Summoner Era - Login Screen Animations (2020)",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/1efef4144430837.Y3JvcCwxOTgxLDE1NTAsOSww.jpg",
    href: "/portfolio/summoner-era-2020",
  },
  {
    id: "game-animation-vfx-3q",
    title: "Game Animation/VFX - 3Q",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/c4e25d143388227.Y3JvcCwxOTgxLDE1NTAsOSww.png",
    href: "/portfolio/game-animation-vfx-3q",
  },
  {
    id: "battle-of-the-gods-mytheria",
    title: "Battle of the Gods | Mytheria - Login Screen",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/d5b456134047127.Y3JvcCwyMzkyLDE4NzAsMCww.png",
    href: "/portfolio/battle-of-the-gods-mytheria",
  },
  {
    id: "animation-contest-sky-mavis",
    title: "Animation Contest - Sky Mavis",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/33e83e130561969.Y3JvcCwxOTgxLDE1NTAsOSww.png",
    href: "/portfolio/animation-contest-sky-mavis",
  },
  {
    id: "mid-autumn-summoner-era",
    title: "Mid Autumn Animation for Summoner Era",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/projects/404/4cd319112053013.Y3JvcCwxOTgxLDE1NTAsOSww.jpg",
    href: "/portfolio/mid-autumn-summoner-era",
  },
  {
    id: "summoner-era-arena-of-heroes",
    title: "Animation for Summoner Era - Arena of Heroes",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/d4a408104755019.5f9b97c0a0f8a.png",
    href: "/portfolio/summoner-era-arena-of-heroes",
  },
  {
    id: "puzzle-wonderland",
    title: "Character Animation for Puzzle Wonderland",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/c93a5b67614633.5fbd2e1664ce9.png",
    href: "/portfolio/puzzle-wonderland",
  },
  {
    id: "reaper-lady-project-overdrive",
    title: "Game Animation - Reaper & Lady - Project: OverDrive",
    tag: "Behance Project",
    image:
      "https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/2bd1c365344203.5f702ed1b2566.png",
    href: "/portfolio/reaper-lady-project-overdrive",
  },
];

/**
 * Tight grid (lg+): 3 columns × 12 rows mosaic + 2 full-width banner strips (rows 17–20, 21–24).
 */
const BENTO_LG: string[] = [
  "lg:col-start-1 lg:row-start-1 lg:row-span-4",
  "lg:col-start-2 lg:row-start-1 lg:row-span-5",
  "lg:col-start-3 lg:row-start-1 lg:row-span-3",
  "lg:col-start-1 lg:row-start-5 lg:row-span-4",
  "lg:col-start-2 lg:row-start-6 lg:row-span-3",
  "lg:col-start-3 lg:row-start-4 lg:row-span-5",
  "lg:col-start-1 lg:row-start-9 lg:row-span-4",
  "lg:col-start-2 lg:row-start-9 lg:row-span-4",
  "lg:col-start-3 lg:row-start-9 lg:row-span-4",
  "lg:col-start-1 lg:row-start-13 lg:row-span-4",
  "lg:col-start-2 lg:row-start-13 lg:row-span-4",
  "lg:col-start-3 lg:row-start-13 lg:row-span-4",
  "lg:col-start-1 lg:col-span-3 lg:row-start-17 lg:row-span-4",
  "lg:col-start-1 lg:col-span-3 lg:row-start-21 lg:row-span-4",
];

export default function PortfolioGalleryGrid({
  items = DEFAULT_ITEMS,
}: {
  items?: PortfolioGalleryItem[];
}) {
  return (
    <section
      id="portfolio-gallery"
      className="border-t border-[#252525] bg-[linear-gradient(180deg,#171717_0%,#101010_100%)] py-14 text-white md:py-16 lg:py-20"
    >
      <div
        className="mx-auto px-4 sm:px-0"
        style={{ width: "min(var(--layout-width, 76%), 1240px)" }}
      >
        <header className="mb-10 md:mb-12">
          <div className="mb-3 flex flex-wrap items-center gap-4">
            <span className="text-sm font-black italic tracking-tighter text-[#ff8c3a]">
              // 02
            </span>
            <div className="h-px w-10 shrink-0 bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
              14 projects
            </span>
          </div>
          <h2
            className="text-3xl font-black uppercase leading-tight tracking-tight text-white md:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-rajdhani)" }}
          >
            Selected <AccentHighlight>works</AccentHighlight>
          </h2>
          <p
            className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base"
            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          >
            Three tightly-fitted mosaic columns (no gaps): each column has a total height of 12 tiles; final banner stretches full width.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:min-h-[300vh] lg:grid-cols-3 lg:grid-rows-[repeat(24,minmax(0,1fr))] lg:gap-3">
          {items.map((item, index) => {
            const n = String(index + 1).padStart(2, "0");
            const lg = BENTO_LG[index] ?? "";
            return (
              <article
                key={item.id}
                className={`group relative min-h-[220px] overflow-hidden rounded-2xl border border-[#ff8c3a]/20 bg-[#14141a] shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-300 hover:z-1 hover:border-[#ff8c3a]/45 hover:shadow-[0_28px_80px_rgba(0,0,0,0.5)] lg:min-h-0 lg:h-full ${lg}`}
              >
                <Image
                  src={item.image}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                  sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0a0a0a]/95 via-[#0a0a0a]/25 to-transparent" />
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 md:p-5">
                  <span
                    className="text-sm font-semibold tabular-nums text-white/35"
                    style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                  >
                    {n}
                  </span>
                  <div className="pointer-events-auto">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8c3a]">
                      {item.tag}
                    </p>
                    <h3
                      className="mt-1.5 text-lg font-black uppercase leading-tight tracking-[0.04em] text-[#ffecd6] md:text-xl"
                      style={{ fontFamily: "var(--font-rajdhani)" }}
                    >
                      {item.title}
                    </h3>
                    <Link
                      href={item.href ?? "#"}
                      className="mt-4 inline-flex items-center rounded-lg border border-[#ff8c3a]/70 bg-black/35 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ffcc8e] backdrop-blur-sm transition-colors hover:border-[#ff8c3a] hover:bg-[#ff8c3a]/10"
                    >
                      View project
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
