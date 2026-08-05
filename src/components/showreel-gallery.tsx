"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Changa_One, Nunito_Sans } from "next/font/google";
import { useSlotUrl, BRAND_LOGO_FALLBACK } from "@/lib/use-slot-url";

const changaOne = Changa_One({ weight: "400", subsets: ["latin"] });
// ponytail: UI trang này toàn tiếng Anh nên latin là đủ — cần chữ có dấu ở đâu
// thì thêm lại subset "vietnamese", KHÔNG dùng Changa One (font đó không có
// glyph tiếng Việt, chữ dấu sẽ vỡ).
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

// ponytail: khoá tạm 2 tab chưa có nội dung — vẫn hiện để khách thấy studio làm
// mảng đó, nhưng không bấm vào được. Có nội dung rồi thì xoá id khỏi Set này.
const LOCKED_TABS = new Set<string>(["art", "animation"]);

// ponytail: phân cấp nằm ngay trong ô Category của admin, dạng
// "Spine Effect / Sky Fantasy" — không cần cột DB mới, không đụng API.
// Cần quản lý dự án như thực thể (đổi tên hàng loạt, sắp thứ tự) thì tách cột
// `project` riêng sau, chỗ đọc chỉ có hàm này.
function splitCategory(raw: string) {
  const [cat, ...rest] = (raw ?? "").split("/").map((s) => s.trim());
  return { cat: cat || "", project: rest.join(" / ") || "" };
}

const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))];

export default function ShowreelGallery() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [project, setProject] = useState("all");
  const [lightbox, setLightbox] = useState<Item | null>(null);
  const logoUrl = useSlotUrl("global", "brand-logo", BRAND_LOGO_FALLBACK);

  // Tab nằm trong URL (?tab=animation) → copy link gửi khách là mở đúng tab,
  // back/forward của trình duyệt cũng chạy free. Giá trị lạ hoặc tab đang khoá
  // → về "vfx" (tab duy nhất còn mở).
  const tabParam = useSearchParams().get("tab");
  const tab: Item["tab"] =
    (tabParam === "animation" || tabParam === "vfx" || tabParam === "art") &&
    !LOCKED_TABS.has(tabParam)
      ? tabParam
      : "vfx";

  useEffect(() => {
    fetch("/api/showreel")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const tabItems = useMemo(
    () => items.filter((i) => i.tab === tab).map((i) => ({ ...i, ...splitCategory(i.category) })),
    [items, tab],
  );

  // Category + project sinh từ dữ liệu thật, không hardcode — sếp gõ gì trong
  // admin thì hiện đúng thế.
  const cats = useMemo(() => uniq(tabItems.map((i) => i.cat)), [tabItems]);

  const catItems = useMemo(
    () => (cat === "all" ? tabItems : tabItems.filter((i) => i.cat === cat)),
    [tabItems, cat],
  );

  // Tầng 2 chỉ xuất hiện khi category đang chọn thực sự có nhiều dự án con.
  const projects = useMemo(() => uniq(catItems.map((i) => i.project)), [catItems]);

  const visible = useMemo(
    () => (project === "all" ? catItems : catItems.filter((i) => i.project === project)),
    [catItems, project],
  );

  // Đổi tab/category thì reset tầng dưới, nếu không sẽ lọc bằng giá trị không
  // tồn tại → grid rỗng.
  useEffect(() => {
    setCat("all");
    setProject("all");
  }, [tab]);
  useEffect(() => setProject("all"), [cat]);

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
      {/* /70 thay vì /85: để gradient nền ánh nhẹ qua header, không thành dải
          đen phẳng cắt ngang. */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-[#08080b]/70 backdrop-blur-xl">
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
              const locked = LOCKED_TABS.has(t.id);
              const cls = `${changaOne.className} relative px-4 py-2 text-lg tracking-wider transition-colors sm:px-8 sm:text-2xl ${
                locked
                  ? "cursor-not-allowed text-white/20"
                  : active
                    ? "text-amber-400"
                    : "text-white/45 hover:text-white/80"
              }`;
              const underline = (
                <span
                  className={`absolute bottom-0 left-1/2 h-[3px] -translate-x-1/2 bg-amber-400 transition-all duration-300 ${
                    active && !locked ? "w-full" : "w-0"
                  }`}
                />
              );

              return locked ? (
                <span key={t.id} aria-disabled className={cls} title="Coming soon">
                  {t.label}
                  {underline}
                </span>
              ) : (
                <Link
                  key={t.id}
                  href={`/showreel?tab=${t.id}`}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={cls}
                >
                  {t.label}
                  {underline}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">

        {/* Tầng 1 — loại việc. Underline giống tab header cho cả trang một hệ. */}
        {cats.length > 0 ? (
          <div className="mb-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 border-b border-white/8 pb-px">
            {["all", ...cats].map((c) => {
              const active = cat === c;
              const n = c === "all" ? tabItems.length : tabItems.filter((i) => i.cat === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  aria-pressed={active}
                  className={`${changaOne.className} relative pb-3 pt-1 text-base tracking-[0.18em] uppercase transition-colors ${
                    active ? "text-amber-400" : "text-white/40 hover:text-white/75"
                  }`}
                >
                  {c === "all" ? "ALL" : c}
                  <span className="ml-1.5 align-super text-[10px] tracking-normal text-white/25">
                    {n}
                  </span>
                  <span
                    className={`absolute -bottom-px left-0 h-[2px] bg-amber-400 transition-all duration-300 ${
                      active ? "w-full opacity-100" : "w-0 opacity-0"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Tầng 2 — dự án bên trong loại đó. Chỉ hiện khi thật sự có >1 dự án,
            không thì thành hàng nút thừa. */}
        {projects.length > 1 ? (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {["all", ...projects].map((p) => {
              const active = project === p;
              return (
                <button
                  key={p}
                  onClick={() => setProject(p)}
                  aria-pressed={active}
                  className={`rounded-full px-3.5 py-1 text-xs transition-all duration-200 ${
                    active
                      ? "bg-amber-400 font-semibold text-black"
                      : "bg-white/[0.06] text-white/55 hover:bg-white/12 hover:text-white"
                  }`}
                >
                  {p === "all" ? "All projects" : p}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mb-8" />
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="py-24 text-center text-white/40">
            Nothing here yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 text-left"
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
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.url}
          alt={item.title || item.category}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        {item.category ? (
          <span className="text-[10px] uppercase tracking-[0.2em] text-amber-400">
            {splitCategory(item.category).cat}
            {splitCategory(item.category).project ? (
              <span className="text-white/50"> · {splitCategory(item.category).project}</span>
            ) : null}
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
        aria-label="Close"
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
