"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Chế độ "Slides": xem company profile như bản trình chiếu — mỗi slide gọn đúng
 * một màn hình, không cuộn, và có URL riêng (?view=deck&slide=N) để gửi khách
 * từng trang một.
 *
 * ponytail: KHÔNG viết lại 17 section thành layout riêng cho deck. Chỉ:
 *   1. bọc nội dung mỗi section vào 1 wrapper (tạo bằng JS, 1 lần),
 *   2. `zoom` để thu vừa bề cao màn hình.
 * Nhờ vậy thêm section mới là tự có slide mới, không phải khai báo ở đâu cả.
 *
 * 1 section = ĐÚNG 1 slide, không cắt trang. Cắt trang luôn cho ra slide thừa
 * (nửa cái card lơ lửng, sếp chê ở slide 5 / 9 / 12-13) — thu nhỏ cả section
 * cho vừa màn hình luôn đẹp hơn, ảnh bé lại là chuyện phải chấp nhận.
 *
 * ponytail: `zoom` chứ không `transform: scale` — scale co cả khung nền gradient
 * nên lòi viền đen; zoom cho layout tính lại nên nền vẫn phủ trọn màn hình.
 */

/** Chiều cao dành cho padding trên/dưới slide + thanh điều khiển nổi. */
const CHROME = 140;
/** Sàn zoom chỉ để chặn số vô lý (đo hụt → scrollHeight = 0). */
const MIN_ZOOM = 0.25;

type Slide = { sec: number; zoom: number; title: string };

export default function ProfileDeck() {
  const [deck, setDeck] = useState(false);
  const [i, setI] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [copied, setCopied] = useState(false);
  // ponytail: chốt chặn cho bug "gửi link ?slide=4 mở ra lại là Scroll" — effect
  // đồng bộ URL chạy TRƯỚC lúc đọc xong query nên nó xoá luôn param.
  const [ready, setReady] = useState(false);

  const total = slides.length;
  const cur = slides[i];

  // Đọc query 1 lần lúc mount. rAF vì react-hooks cấm setState đồng bộ trong effect.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const q = new URLSearchParams(window.location.search);
      if (q.get("view") === "deck") {
        setDeck(true);
        const n = Number(q.get("slide"));
        if (Number.isFinite(n) && n >= 1) setI(n - 1);
      }
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    if (deck) main.setAttribute("data-view", "deck");
    else main.removeAttribute("data-view");
    return () => main.removeAttribute("data-view");
  }, [deck]);

  // Đo từng section → dựng danh sách slide. Chạy lại khi resize.
  useEffect(() => {
    if (!deck) return;
    const measure = () => {
      const avail = window.innerHeight - CHROME;
      const list: Slide[] = [];
      document.querySelectorAll<HTMLElement>("main > section").forEach((sec, idx) => {
        // ponytail: section gắn data-deck-skip vẫn nằm trong bản cuộn nhưng không
        // thành slide — sếp chọn bỏ vài trang khỏi bản trình chiếu (2026-09-09).
        if (sec.dataset.deckSkip !== undefined) return;
        // Wrapper để dịch nội dung sang trang sau mà không dịch cả khung nền.
        let inner = sec.querySelector<HTMLElement>(":scope > [data-deck-inner]");
        if (!inner) {
          inner = document.createElement("div");
          inner.setAttribute("data-deck-inner", "");
          inner.style.width = "100%";
          // ponytail: chỉ nhét phần tử TĨNH vào wrapper. Wrapper có transform nên
          // nó thành containing block — bê cả <video>/ảnh nền `absolute inset-0`
          // vào đây thì nền neo theo wrapper (bắt đầu sau padding-top) và để hở
          // một dải đen ở đỉnh slide.
          const kids = Array.from(sec.children);
          sec.appendChild(inner);
          for (const k of kids) {
            const pos = getComputedStyle(k).position;
            if (pos === "absolute" || pos === "fixed") continue;
            inner.appendChild(k);
          }
        }
        // ponytail: bề rộng canvas chốt bằng PX, không phải %. Với % thì zoom nhỏ
        // lại làm bề rộng CSS nở ra (94%/zoom) → ảnh giữ nguyên kích thước thật,
        // thu nhỏ mấy cũng không bao giờ vừa màn hình (đúng chỗ sếp thấy ảnh
        // tràn đáy). Chốt px thì zoom co đều cả chữ lẫn ảnh, đo 1 lượt là đúng —
        // đổi lại slide ảnh nhiều sẽ hụt 2 bên, chấp nhận.
        inner.style.width = `${Math.round(window.innerWidth * 0.94)}px`;
        // ponytail: phải tạm HIỆN section mới đo được. Chỉ có slide hiện tại là
        // display:block, các section khác đang display:none → scrollHeight = 0 →
        // zoom tính ra luôn bằng 1 và slide nào cũng bị cắt.
        const prevDisplay = sec.style.display;
        sec.style.display = "block";
        sec.style.zoom = "";
        sec.style.height = "";
        const zoom = Math.max(Math.min(avail / inner.scrollHeight, 1), MIN_ZOOM);
        sec.style.display = prevDisplay;
        const title = sec.querySelector("h2")?.textContent?.trim() || `Slide ${idx + 1}`;
        list.push({ sec: idx, zoom, title });
      });
      setSlides(list);
    };
    let id = requestAnimationFrame(measure);
    const schedule = () => {
      cancelAnimationFrame(id);
      id = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", schedule);
    // ponytail: ảnh Next/Image chỉ tải khi section được hiện (measure hiện tạm)
    // nên lượt đo đầu luôn hụt chiều cao ảnh → section nhiều ảnh (team) lòi ra
    // ngoài đáy. Đo lại mỗi lần một ảnh/font xong; `load` của <img> không bubble
    // nên phải bắt ở capture. rAF gộp nhiều ảnh về 1 lượt đo.
    document.addEventListener("load", schedule, true);
    document.fonts?.ready.then(schedule);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("load", schedule, true);
    };
  }, [deck]);

  // Áp zoom + dịch trang cho slide đang xem.
  useEffect(() => {
    if (!deck || !cur) return;
    const secs = document.querySelectorAll<HTMLElement>("main > section");
    const sec = secs[cur.sec];
    if (!sec) return;
    sec.style.zoom = String(cur.zoom);
    // Khung nền luôn đúng 1 màn hình: chia ngược cho zoom.
    sec.style.height = `${window.innerHeight / cur.zoom}px`;
    sec.style.minHeight = "0";
    return () => {
      sec.style.zoom = "";
      sec.style.height = "";
      sec.style.minHeight = "";
    };
  }, [deck, cur]);

  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    if (deck) {
      url.searchParams.set("view", "deck");
      url.searchParams.set("slide", String(i + 1));
    } else {
      url.searchParams.delete("view");
      url.searchParams.delete("slide");
    }
    window.history.replaceState(null, "", url.toString());
    if (deck) window.scrollTo({ top: 0 });
  }, [deck, i, ready]);

  const go = useCallback(
    (n: number) => setI(Math.min(Math.max(n, 0), Math.max(total - 1, 0))),
    [total],
  );

  useEffect(() => {
    if (!deck) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") go(i + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(i - 1);
      if (e.key === "Escape") setDeck(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck, i, go]);

  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <>
      {deck ? (
        <style>{`
          /* Divider giữa các section không phải <section> — ẩn đi, không thì nó
             chen vào đỉnh slide và đẩy tiêu đề ra ngoài màn hình. */
          main[data-view="deck"] > *:not(section):not([data-deck-ui]) { display: none; }
          main[data-view="deck"] > section { display: none; }
          main[data-view="deck"] > section:nth-of-type(${(cur?.sec ?? 0) + 1}) {
            /* padding-bottom lớn vì nó cũng bị zoom co lại — thiếu là dòng cuối
               chui xuống dưới thanh điều khiển. */
            /* flex + center: slide ít nội dung (Stats) nằm giữa màn hình thay vì
               dính đỉnh và bỏ trống nửa dưới. */
            display: flex; flex-direction: column; justify-content: center;
            overflow: hidden; padding-top: 88px; padding-bottom: 88px;
          }
          /* Stats: 4 card một hàng ngang thì lọt thỏm giữa màn 16:9 → xếp 2x2, bó
             hẹp lại cho ra khối. Chỉ ở deck, bản cuộn vẫn 1 hàng 4 card. */
          main[data-view="deck"] [data-deck-grid="2x2"] {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            max-width: 62%; margin-inline: auto;
          }
          /* Reveal (animation khi cuộn tới) không fire cho slide đang display:none
             → tiêu đề section vô hình. Ở deck ép hiện luôn. */
          main[data-view="deck"] > section * { opacity: 1 !important; }
          /* Full chiều ngang: Wrap có inline style width nên phải !important;
             các max-w-* bên trong cũng phải nới, không thì grid card vẫn co giữa. */
          /* Bề rộng thật nằm ở [data-deck-inner] (px, set trong JS) — mấy div bên
             trong chỉ việc ăn hết wrapper. */
          main[data-view="deck"] [data-deck-inner] { margin-inline: auto; }
          main[data-view="deck"] [data-deck-inner] > div { width: 100% !important; }
          main[data-view="deck"] [data-deck-inner] .max-w-5xl,
          main[data-view="deck"] [data-deck-inner] .max-w-6xl,
          main[data-view="deck"] [data-deck-inner] .max-w-7xl { max-width: none; }
          main[data-view="deck"] > section h2 { font-size: clamp(1.9rem, 3.4vw, 2.75rem); }
          /* Nén nhịp dọc TRƯỚC khi phải thu nhỏ hoặc cắt trang — khoảng trắng của
             bản scroll là để cuộn cho thoáng, trình chiếu thì không cần. */
          main[data-view="deck"] > section .mt-16 { margin-top: 1.5rem; }
          main[data-view="deck"] > section .pt-16 { padding-top: 1.5rem; }
          main[data-view="deck"] > section .mb-10 { margin-bottom: 1.25rem; }
          main[data-view="deck"] > section .mt-8 { margin-top: 1rem; }
          main[data-view="deck"] > section .mt-6 { margin-top: 0.85rem; }
          main[data-view="deck"] > section .mb-14 { margin-bottom: 1.5rem; }
          html:has(main[data-view="deck"]) { overflow: hidden; }
        `}</style>
      ) : null}

      {/* ponytail: ở chế độ Scroll chỉ còn MỘT nút nhỏ mờ ở góc dưới phải — pill
          2 nút đặt cạnh header trước đây vừa to vừa che nội dung. Vào deck rồi
          thì nút thoát nằm luôn trong thanh điều khiển, không có gì nổi trên nữa. */}
      {!deck ? (
        <button
          data-deck-ui
          type="button"
          onClick={() => setDeck(true)}
          title="Xem dạng trình chiếu"
          className="group fixed right-5 bottom-5 z-[60] flex items-center gap-2 rounded-full border border-white/10 bg-black/50 py-2 pr-3.5 pl-3 text-white/45 opacity-70 shadow-[0_8px_28px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:border-[#ff8c3a]/50 hover:text-white hover:opacity-100"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 5h16v11H4zM9 20h6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase">Slides</span>
        </button>
      ) : null}

      {deck && total > 0 ? (
        <div
          data-deck-ui
          className="fixed inset-x-0 bottom-0 z-[60]"
        >
          {/* Tiến độ = 1px sát mép dưới, không chiếm chỗ của slide. */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10">
            <div
              className="h-px bg-[#ff8c3a] shadow-[0_0_10px_rgba(255,140,58,0.8)] transition-all duration-500"
              style={{ width: `${((i + 1) / total) * 100}%` }}
            />
          </div>
          {/* ponytail: pill nhỏ, mờ 30% lúc không dùng → hover mới hiện rõ. Không
              còn scrim đen full ngang che mất đáy slide. */}
          <div className="mx-auto mb-3 flex w-fit max-w-[92%] items-center gap-1 rounded-full border border-white/10 bg-black/55 px-1.5 py-1 opacity-30 shadow-[0_8px_28px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-opacity duration-300 hover:opacity-100">
            <button
              type="button"
              onClick={() => go(i - 1)}
              disabled={i === 0}
              aria-label="Previous slide"
              className="rounded-full px-2.5 py-1 text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
            >
              ‹
            </button>
            <span className="px-1 font-mono text-[11px] tracking-[0.14em] text-[#ffcc8e]/80 tabular-nums">
              {String(i + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => go(i + 1)}
              disabled={i >= total - 1}
              aria-label="Next slide"
              className="rounded-full px-2.5 py-1 text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
            >
              ›
            </button>
            <span className="mx-0.5 h-4 w-px bg-white/10" />
            {/* ponytail: <select> trong suốt phủ lên nút — vẫn là picker native
                (bàn phím, mobile sheet) mà chỉ tốn chỗ bằng một icon. */}
            <span className="relative flex">
              <span
                title="Chọn slide"
                className="rounded-full px-2.5 py-1 text-[13px] text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                ☰
              </span>
              <select
                value={i}
                onChange={(e) => go(Number(e.target.value))}
                aria-label="Jump to slide"
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                {slides.map((s, idx) => (
                  <option key={s.sec} value={idx}>
                    {String(idx + 1).padStart(2, "0")} — {s.title}
                  </option>
                ))}
              </select>
            </span>
            <button
              type="button"
              onClick={copy}
              title="Copy link tới slide này"
              aria-label="Copy link"
              className="flex items-center rounded-full px-2.5 py-1.5 text-white/60 transition hover:bg-white/10 hover:text-[#ffcc8e]"
            >
              {copied ? (
                <span className="text-[11px] font-bold tracking-[0.1em] text-[#ffcc8e]">✓</span>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setDeck(false)}
              title="Thoát trình chiếu (Esc)"
              aria-label="Exit slides"
              className="rounded-full px-2.5 py-1 text-[13px] text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
