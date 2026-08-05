"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Changa_One, Nunito_Sans } from "next/font/google";
import { useSlotUrl, BRAND_LOGO_FALLBACK } from "@/lib/use-slot-url";

const changaOne = Changa_One({ weight: "400", subsets: ["latin"] });
const nunitoSans = Nunito_Sans({ weight: ["400", "600", "700"], subsets: ["latin"] });

type Item = {
  id: string;
  tab: "art" | "animation" | "vfx";
  category: string;
  title: string;
  url: string;
  thumbnail: string | null;
  kind: "image" | "video";
};

const TABS = [
  { id: "art", label: "ART" },
  { id: "animation", label: "ANIMATION" },
  { id: "vfx", label: "VFX" },
] as const;

export default function ShowreelGallery() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [lightbox, setLightbox] = useState<Item | null>(null);
  const logoUrl = useSlotUrl("global", "brand-logo", BRAND_LOGO_FALLBACK);

  // Tab nằm trong URL (?tab=animation) → copy link gửi khách là mở đúng tab,
  // back/forward của trình duyệt cũng chạy free. Giá trị lạ → về "art".
  const tabParam = useSearchParams().get("tab");
  const tab: Item["tab"] =
    tabParam === "animation" || tabParam === "vfx" ? tabParam : "art";

  useEffect(() => {
    fetch("/api/showreel")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const tabItems = useMemo(() => items.filter((i) => i.tab === tab), [items, tab]);

  // Category pills sinh từ dữ liệu thật, không hardcode — sếp gõ category nào
  // trong admin thì nó hiện ở đây.
  const cats = useMemo(() => {
    const seen: string[] = [];
    for (const i of tabItems) if (i.category && !seen.includes(i.category)) seen.push(i.category);
    return seen;
  }, [tabItems]);

  const visible = useMemo(
    () => (cat === "all" ? tabItems : tabItems.filter((i) => i.category === cat)),
    [tabItems, cat],
  );

  // Đổi tab thì reset category, nếu không sẽ lọc bằng category không tồn tại → grid rỗng.
  useEffect(() => setCat("all"), [tab]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  return (
    <main className={`${nunitoSans.className} pt-32 pb-24`}>
      {/* Header riêng của showreel: chỉ logo + 3 tab, không nav site */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[#0a0a0a]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-2 px-4 py-3 sm:flex-row sm:justify-between sm:px-8">
          <Link href="/" aria-label="TD Games home" className="shrink-0">
            <Image
              src={logoUrl}
              alt=""
              width={260}
              height={76}
              priority
              className="h-[38px] w-auto object-contain sm:h-[46px]"
            />
          </Link>

          <nav className="flex gap-1 sm:gap-4">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <Link
                  key={t.id}
                  href={`/showreel?tab=${t.id}`}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={`${changaOne.className} relative px-4 py-2 text-lg tracking-wider transition-colors sm:px-8 sm:text-2xl ${
                    active ? "text-amber-400" : "text-white/45 hover:text-white/80"
                  }`}
                >
                  {t.label}
                  <span
                    className={`absolute bottom-0 left-1/2 h-[3px] -translate-x-1/2 bg-amber-400 transition-all duration-300 ${
                      active ? "w-full" : "w-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">

        {/* Category con */}
        {cats.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {["all", ...cats].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-4 py-1.5 text-xs sm:text-sm transition-colors ${
                  cat === c
                    ? "border-amber-400 bg-amber-400/15 text-amber-300"
                    : "border-white/15 text-white/55 hover:border-white/40 hover:text-white"
                }`}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="mb-4 h-56 animate-pulse rounded-xl bg-white/5 break-inside-avoid"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="py-24 text-center text-white/40">
            Chưa có item nào trong mục này.
          </p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {visible.map((item) => (
              <Tile key={item.id} item={item} onOpen={() => setLightbox(item)} />
            ))}
          </div>
        )}
      </div>

      {lightbox ? <Lightbox item={lightbox} onClose={() => setLightbox(null)} /> : null}
    </main>
  );
}

function Tile({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isVideo = item.kind === "video";

  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => {
        const v = videoRef.current;
        if (v) {
          v.pause();
          v.currentTime = 0;
        }
      }}
      className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] text-left"
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={item.url}
          poster={item.thumbnail ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.url}
          alt={item.title || item.category}
          loading="lazy"
          className="w-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        {item.category ? (
          <span className="text-[10px] uppercase tracking-[0.2em] text-amber-400">
            {item.category}
          </span>
        ) : null}
        {item.title ? (
          <p className="mt-0.5 text-sm font-semibold text-white">{item.title}</p>
        ) : null}
      </div>

      {isVideo ? (
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/80 backdrop-blur transition-opacity group-hover:opacity-0">
          ▶ video
        </span>
      ) : null}
    </button>
  );
}

function Lightbox({ item, onClose }: { item: Item; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
    >
      <button
        onClick={onClose}
        aria-label="Đóng"
        className="absolute right-5 top-5 text-3xl leading-none text-white/60 hover:text-white"
      >
        ×
      </button>
      <div onClick={(e) => e.stopPropagation()} className="max-h-full w-auto">
        {item.kind === "video" ? (
          <video
            src={item.url}
            poster={item.thumbnail ?? undefined}
            controls
            autoPlay
            loop
            playsInline
            className="max-h-[85vh] max-w-[92vw] rounded-lg"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.title || item.category}
            className="max-h-[85vh] max-w-[92vw] rounded-lg object-contain"
          />
        )}
        {item.title || item.category ? (
          <p className="mt-3 text-center text-sm text-white/60">
            {item.category ? (
              <span className="text-amber-400">{item.category}</span>
            ) : null}
            {item.category && item.title ? " · " : ""}
            {item.title}
          </p>
        ) : null}
      </div>
    </div>
  );
}
