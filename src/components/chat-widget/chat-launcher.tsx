"use client";

// Nút chat nổi ở góc phải mọi trang public. Nhẹ: khung chat chỉ tải khi bấm (hoặc khi mở từ link email).
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, pollThread } from "./chat-api";

const ChatWidget = dynamic(() => import("./ChatWidget"), { ssr: false });

const HIDDEN_PREFIXES = ["/admin", "/hr", "/crm"];
const GREET_KEY = "tdg_chat_greet_at";
const GREET_DELAY_MS = 8000;
const GREET_EVERY_MS = 7 * 86_400_000;
const SEEN_KEY = "tdg_chat_seen_at";
const MASCOT_SRC = "https://cdn.tdgamestudio.com/landing/chat/mascot-v1.webp";

export default function ChatLauncher() {
  const pathname = usePathname() ?? "/";
  const hidden = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const [open, setOpen] = useState(false);
  const [resumeToken, setResumeToken] = useState<string | null>(null);
  const [greet, setGreet] = useState(false);
  const [unread, setUnread] = useState(false);

  // Link "Continue the conversation" trong email: ?chat=<mã>.
  useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("chat");
    if (!t) return;
    url.searchParams.delete("chat");
    window.history.replaceState(null, "", url.toString());
    // Không tự dùng link: link chỉ dùng 1 lần, trình quét mail (Safe Links…) chạy JS sẽ đốt mất.
    // Hiện nút "Continue your conversation", khách bấm mới gọi /resume.
    const id = setTimeout(() => setResumeToken(t), 0);
    return () => clearTimeout(id);
  }, []);

  // Câu chào nhỏ sau 8s, tối đa 1 lần / 7 ngày.
  useEffect(() => {
    if (hidden || open) return;
    let last = 0;
    try {
      last = Number(localStorage.getItem(GREET_KEY) ?? 0);
    } catch {
      return;
    }
    if (Date.now() - last < GREET_EVERY_MS) return;
    const t = setTimeout(() => {
      setGreet(true);
      try {
        localStorage.setItem(GREET_KEY, String(Date.now()));
      } catch {
        /* bỏ qua */
      }
    }, GREET_DELAY_MS);
    return () => clearTimeout(t);
  }, [hidden, open]);

  // Đã từng chat + khung đóng → kiểm tin mới của team mỗi 60s để hiện chấm đỏ.
  useEffect(() => {
    if (hidden || open || !getToken()) return;
    const check = async () => {
      if (document.hidden) return;
      try {
        const seen = localStorage.getItem(SEEN_KEY);
        const r = await pollThread(seen);
        setUnread(r.messages.some((m) => m.sender === "staff"));
      } catch {
        /* im lặng */
      }
    };
    void check();
    const i = setInterval(check, 60_000);
    return () => clearInterval(i);
  }, [hidden, open]);

  if (hidden) return null;

  return (
    <div className="tdg-chat">
      <style>{`@media print{.tdg-chat{display:none!important}} body:has(main[data-view="deck"]) .tdg-chat{display:none!important}
.tdg-chat-mascot{transition:scale .25s ease}
.tdg-chat-mascot:hover{scale:1.07}
.tdg-chat-mascot img{transform-origin:50% 92%;animation:tdg-wave 4.2s ease-in-out 1.2s infinite}
.tdg-chat-mascot:hover img{animation-duration:1.4s;animation-delay:0s}
.tdg-chat-glow{animation:tdg-glow 3.2s ease-in-out infinite}
.tdg-chat-mascot:hover .tdg-chat-glow{opacity:1}
@keyframes tdg-glow{0%,100%{opacity:.7;scale:.94}50%{opacity:1;scale:1.04}}
@keyframes tdg-wave{0%,62%,100%{transform:rotate(0)}68%{transform:rotate(-7deg)}74%{transform:rotate(6deg)}80%{transform:rotate(-5deg)}86%{transform:rotate(3deg)}92%{transform:rotate(0)}}
@media (prefers-reduced-motion:reduce){.tdg-chat-mascot img,.tdg-chat-glow{animation:none}}`}</style>
      {open ? (
        <ChatWidget
          resumeToken={resumeToken}
          onClose={() => {
            setOpen(false);
            setUnread(false);
            setResumeToken(null);
          }}
        />
      ) : (
        <div className="fixed bottom-4 right-4 z-[90] flex items-end gap-3 sm:bottom-6 sm:right-6">
          {resumeToken && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="max-w-[230px] rounded-2xl rounded-br-md bg-white px-4 py-3 text-left text-[13px] font-semibold leading-snug text-zinc-900 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
            >
              💬 Continue your conversation with TD Games →
            </button>
          )}
          {greet && !resumeToken && (
            <button
              type="button"
              onClick={() => {
                setGreet(false);
                setOpen(true);
              }}
              className="relative max-w-[230px] rounded-2xl rounded-br-md bg-white px-4 py-3 text-left text-[13px] leading-snug text-zinc-800 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
            >
              <span
                role="button"
                aria-label="Dismiss"
                onClick={(e) => {
                  e.stopPropagation();
                  setGreet(false);
                }}
                className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-zinc-800 text-xs text-white"
              >
                ×
              </span>
              👋 Hi! Questions about our services or jobs? Ask us here.
            </button>
          )}
          <button
            type="button"
            aria-label="Open chat"
            onClick={() => {
              setGreet(false);
              setOpen(true);
            }}
            className="tdg-chat-mascot relative isolate block rounded-2xl outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {/* Mascot TD Games ngồi trên bong bóng chat (2026-11-05, sếp gửi) — vẫy tay theo nhịp. */}
            {/* Vầng sáng cam nhẹ sau lưng nhân vật (ở giữa icon, sếp chốt) — đứng yên, chỉ thở nhẹ, không xoay theo. */}
            <span
              aria-hidden
              className="tdg-chat-glow pointer-events-none absolute left-1/2 top-[55%] -z-10 h-[170px] w-[170px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[10px] sm:h-[215px] sm:w-[215px]"
              style={{ background: "radial-gradient(circle at center, rgba(255,150,40,0.75) 0%, rgba(255,130,25,0.45) 40%, rgba(255,115,10,0.18) 58%, rgba(255,110,0,0) 72%)" }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MASCOT_SRC}
              alt=""
              width={154}
              height={240}
              decoding="async"
              className="relative h-[96px] w-auto select-none drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] sm:h-[120px]"
              draggable={false}
            />
            {unread && <span className="absolute right-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-black bg-red-500" aria-label="New reply" />}
          </button>
        </div>
      )}
    </div>
  );
}
