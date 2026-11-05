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
    // Mở sau khi hydrate xong (đọc URL chỉ có ở client).
    const id = setTimeout(() => {
      setResumeToken(t);
      setOpen(true);
    }, 0);
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
      <style>{`@media print{.tdg-chat{display:none!important}} body:has(main[data-view="deck"]) .tdg-chat{display:none!important}`}</style>
      {open ? (
        <ChatWidget
          resumeToken={resumeToken}
          onClose={() => {
            setOpen(false);
            setUnread(false);
          }}
        />
      ) : (
        <div className="fixed bottom-4 right-4 z-[90] flex items-end gap-3 sm:bottom-6 sm:right-6">
          {greet && (
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
            className="relative grid h-14 w-14 place-items-center rounded-full bg-[#f59e0b] text-[#1a1206] shadow-[0_10px_30px_rgba(245,158,11,0.45)] transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
            </svg>
            {unread && <span className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-black bg-red-500" aria-label="New reply" />}
          </button>
        </div>
      )}
    </div>
  );
}
