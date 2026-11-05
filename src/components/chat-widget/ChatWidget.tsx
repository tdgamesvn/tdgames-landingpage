"use client";

// Khung chat (mockup A2/A3, giai đoạn 1 không AI): nút câu hỏi có sẵn + chat với người thật.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChatError,
  getConfig,
  openThread,
  pollThread,
  resumeThread,
  sendContact,
  sendMessage,
  sendQuickReply,
  type ChatConfig,
  type ChatMessage,
  type ChatThread,
} from "./chat-api";

const SEEN_KEY = "tdg_chat_seen_at";
const POLL_VISIBLE_MS = 4000;
const POLL_HIDDEN_MS = 20000;
const TYPING_MIN_MS = 1200;
const OFFLINE_NOTE = "We're offline right now (8:00–22:00 Vietnam time). Leave your email and we'll reply by email.";

type Pending = { kind: "text" | "talk_to_person"; body: string };
type ContactMode = "required" | "optional" | null;

export default function ChatWidget({ resumeToken, onClose }: { resumeToken: string | null; onClose: () => void }) {
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [online, setOnline] = useState(true);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactMode, setContactMode] = useState<ContactMode>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [askedOptional, setAskedOptional] = useState(false);
  // Bấm câu có sẵn: hiện ngay câu hỏi + 3 chấm "đang trả lời" rồi mới ra câu trả lời.
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastAtRef = useRef<string | null>(null);

  const merge = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const next = [...prev, ...incoming.filter((m) => !seen.has(m.id))];
      next.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      lastAtRef.current = next[next.length - 1]?.createdAt ?? lastAtRef.current;
      try {
        if (lastAtRef.current) localStorage.setItem(SEEN_KEY, lastAtRef.current);
      } catch {
        /* bỏ qua */
      }
      return next;
    });
  }, []);

  // Mở: cấu hình + luồng (tạo mới / luồng cũ / từ link email).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cfg, r] = await Promise.all([
          getConfig(),
          resumeToken ? resumeThread(resumeToken).catch(() => openThread()) : openThread(),
        ]);
        // (resumeToken chỉ được truyền sau khi khách BẤM "Continue" ở nút nổi — trình quét mail tự mở link không làm mất link.)
        if (!alive) return;
        setConfig(cfg);
        setThread(r.thread);
        setOnline(r.online);
        merge(r.messages);
      } catch (e) {
        if (alive) setError(e instanceof ChatError && e.code === "chat_disabled" ? "Chat is unavailable right now." : "Couldn't connect. Please try again.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [resumeToken, merge]);

  // Polling tin mới.
  const ready = thread !== null;
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const r = await pollThread(lastAtRef.current, !document.hidden);
        if (!alive) return;
        setThread(r.thread);
        setOnline(r.online);
        merge(r.messages);
      } catch {
        /* thử lại lần sau */
      }
      // Đã đóng khung trong lúc chờ → không hẹn lượt sau (tránh vòng poll mồ côi).
      if (alive) timer = setTimeout(tick, document.hidden ? POLL_HIDDEN_MS : POLL_VISIBLE_MS);
    };
    timer = setTimeout(tick, POLL_VISIBLE_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [ready, merge]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, contactMode, typing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function deliver(p: Pending) {
    setBusy(true);
    setError(null);
    try {
      const r = await sendMessage(p.kind, p.body);
      merge(r.messages);
      setThread(r.thread);
      setPending(null);
      if (!r.thread.hasEmail && !askedOptional) {
        setContactMode("optional");
        setAskedOptional(true);
      }
    } catch (e) {
      if (e instanceof ChatError && e.code === "email_required") {
        setPending(p);
        setContactMode("required");
        setOnline(false);
      } else {
        // Gửi lỗi → trả nguyên tin về ô gõ (kể cả tin đang chờ sau khi để email) để khách bấm gửi lại.
        setPending(null);
        if (p.kind === "text") setInput((cur) => cur || p.body);
        setError(e instanceof ChatError && e.status === 429 ? "Too many messages — please wait a moment." : "Message not sent — tap send to try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSend(kind: "text" | "talk_to_person") {
    const body = kind === "text" ? input.trim() : input.trim() || "I'd like to talk to a person.";
    if (!body || busy) return;
    if (!online && !thread?.hasEmail) {
      setPending({ kind, body });
      setContactMode("required");
      setInput("");
      return;
    }
    setInput("");
    await deliver({ kind, body });
  }

  async function onQuickReply(id: string) {
    if (busy) return;
    const label = config?.quickReplies.find((q) => q.id === id)?.label ?? "";
    setBusy(true);
    setError(null);
    setPendingQuestion(label);
    setTyping(true);
    try {
      // Giữ 3 chấm tối thiểu ~1.2s cho cảm giác đang trả lời (song song với gọi API).
      const [r] = await Promise.all([sendQuickReply(id), new Promise((res) => setTimeout(res, TYPING_MIN_MS))]);
      merge(r.messages);
      setThread(r.thread);
    } catch {
      setError("Couldn't load that answer. Please try again.");
    } finally {
      setPendingQuestion(null);
      setTyping(false);
      setBusy(false);
    }
  }

  async function onContact(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendContact(name.trim(), email.trim());
      setThread((t) => (t ? { ...t, hasEmail: true, name: name.trim() || t.name } : t));
      setContactMode(null);
      const p = pending;
      setBusy(false);
      if (p) await deliver(p);
      else {
        const r = await pollThread(lastAtRef.current);
        merge(r.messages);
      }
    } catch (err) {
      setError(err instanceof ChatError && err.code === "invalid_email" ? "Please enter a valid email." : "Couldn't save. Please try again.");
      setBusy(false);
    }
  }

  const quickReplies = config?.quickReplies ?? [];
  const asked = new Set(messages.filter((m) => m.kind === "quick_reply").map((m) => m.body));
  const showTopics = messages.length === 0 && !pendingQuestion;

  return (
    <div
      role="dialog"
      aria-label="TD Games chat"
      className="fixed inset-0 z-[95] flex flex-col overflow-hidden bg-white text-zinc-900 shadow-[0_24px_70px_rgba(0,0,0,0.55)] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(620px,calc(100vh-48px))] sm:w-[380px] sm:rounded-2xl"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 bg-[#111116] px-4 py-3 text-white">
        {/* Avatar = mascot TD Games (2026-11-05). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://cdn.tdgamestudio.com/landing/chat/avatar-v1.webp" alt="" width={36} height={36} className="h-9 w-9 flex-none rounded-full bg-[#f59e0b] object-cover ring-2 ring-[#f59e0b]/60" />
        <div className="min-w-0">
          <div className="text-[14px] font-bold">TD Games Support</div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className={`h-[7px] w-[7px] rounded-full ${online ? "bg-green-500" : "bg-zinc-500"}`} />
            {online ? "Usually replies in minutes" : "Offline · we reply by email"}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close chat" className="ml-auto grid h-9 w-9 place-items-center rounded-full text-xl text-zinc-400 hover:bg-white/10 hover:text-white">
          ×
        </button>
      </div>

      {/* Tin nhắn */}
      <div ref={listRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-[#f6f6f8] px-3 py-4" aria-live="polite">
        <Bubble side="left" tone="light">
          Hi there 👋 Questions about our services or jobs? Pick a topic below or type your message.
        </Bubble>
        {showTopics && (
          <div className="flex flex-col gap-2">
            {quickReplies.map((q) => (
              <button key={q.id} type="button" disabled={busy} onClick={() => onQuickReply(q.id)} className="rounded-full border-[1.5px] border-[#f59e0b] bg-white px-3.5 py-2 text-left text-[13px] font-bold text-[#b45309] transition hover:bg-orange-50 disabled:opacity-50">
                {q.label}
              </button>
            ))}
            <button type="button" disabled={busy} onClick={() => onSend("talk_to_person")} className="rounded-full border-[1.5px] border-zinc-300 bg-white px-3.5 py-2 text-left text-[13px] font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50">
              🙋 Talk to a person
            </button>
          </div>
        )}
        {messages.map((m) => (
          <MessageView key={m.id} m={m} />
        ))}
        {pendingQuestion && (
          <Bubble side="right" tone="accent">
            {pendingQuestion}
          </Bubble>
        )}
        {typing && <TypingDots />}
        {contactMode && (
          <form onSubmit={onContact} className="mt-1 flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-[12.5px]">
            <p className="text-zinc-700">
              {contactMode === "required" ? OFFLINE_NOTE : "Leave your name & email so we can reply even if you leave this page."}
            </p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" maxLength={80} className="rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-[#f59e0b]" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required maxLength={200} className="rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-[#f59e0b]" />
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="rounded-lg bg-[#f59e0b] px-4 py-2 font-bold text-[#1a1206] disabled:opacity-50">
                {pending ? "Send message" : "Save"}
              </button>
              {contactMode === "optional" && (
                <button type="button" onClick={() => setContactMode(null)} className="rounded-lg px-3 py-2 text-zinc-500 hover:bg-zinc-100">
                  Skip
                </button>
              )}
            </div>
          </form>
        )}
        {error && <p className="text-center text-[12px] text-red-600">{error}</p>}
      </div>

      {/* Chủ đề nhanh khi đã có tin: câu chưa hỏi lên đầu; mũi tên ‹ › + lăn chuột để xem tiếp */}
      {!showTopics && quickReplies.length > 0 && (
        <ChipRow>
          {[...quickReplies]
            .sort((a, b) => Number(asked.has(a.label)) - Number(asked.has(b.label)))
            .map((q) => (
              <button
                key={q.id}
                type="button"
                disabled={busy}
                onClick={() => onQuickReply(q.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition hover:bg-orange-50 disabled:opacity-50 ${
                  asked.has(q.label) ? "border-zinc-200 text-zinc-500" : "border-orange-300 text-[#b45309]"
                }`}
              >
                {q.label}
              </button>
            ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => onSend("talk_to_person")}
            className="shrink-0 rounded-full border border-zinc-300 px-3 py-1.5 text-[12.5px] font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            🙋 Talk to a person
          </button>
        </ChipRow>
      )}

      {/* Ô gõ */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSend("text");
        }}
        className="flex items-end gap-2 bg-white px-3 pb-2 pt-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSend("text");
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Type your message…"
          aria-label="Message"
          className="max-h-28 min-h-[40px] flex-1 resize-none rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-[16px] outline-none focus:border-[#f59e0b] sm:text-[13.5px]"
        />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[#f59e0b] text-[#1a1206] disabled:opacity-40">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
          </svg>
        </button>
      </form>
      <p className="bg-white pb-2 text-center text-[10.5px] text-zinc-400">
        By chatting you agree to our{" "}
        <Link href="/privacy-policy" className="underline hover:text-zinc-600">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}

function Bubble({ side, tone, children }: { side: "left" | "right"; tone: "light" | "dark" | "accent"; children: React.ReactNode }) {
  const cls =
    tone === "accent"
      ? "bg-[#f59e0b] text-[#1a1206] rounded-br-md"
      : tone === "dark"
        ? "bg-[#111116] text-white rounded-bl-md"
        : "bg-white text-zinc-900 border border-zinc-200 rounded-bl-md";
  return (
    <div className={`max-w-[84%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-[13.5px] leading-snug ${side === "right" ? "self-end" : "self-start"} ${cls}`}>
      {children}
    </div>
  );
}

function MessageView({ m }: { m: ChatMessage }) {
  if (m.sender === "visitor") {
    return (
      <Bubble side="right" tone="accent">
        {m.body}
      </Bubble>
    );
  }
  if (m.kind === "contact_form") {
    return <p className="self-center text-center text-[11px] text-zinc-500">Thanks — we&apos;ll also reply to your email.</p>;
  }
  if (m.sender === "staff") {
    return (
      <div className="flex flex-col gap-1 self-start">
        <span className="ml-1 text-[10.5px] text-zinc-500">
          <span className="mr-1 rounded bg-green-100 px-1 py-px text-[9.5px] font-bold text-green-800">Team</span>
          {m.staffName} · TD Games
        </span>
        <Bubble side="left" tone="dark">
          {m.body}
        </Bubble>
      </div>
    );
  }
  // Câu trả lời có sẵn.
  return (
    <div className="flex max-w-[84%] flex-col gap-2 self-start">
      <Bubble side="left" tone="light">
        {m.body}
      </Bubble>
      {m.linkUrl && m.linkLabel && (
        <LinkButton href={m.linkUrl} label={m.linkLabel} />
      )}
    </div>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  const cls = "self-start rounded-full bg-[#111116] px-3.5 py-1.5 text-[12.5px] font-bold text-white hover:bg-zinc-800";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={cls}>
        {label} →
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {label} ↗
    </a>
  );
}

/** 3 chấm "đang trả lời". */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-3.5 py-3" aria-label="Typing">
      <style>{`@keyframes tdg-dot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}`}</style>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-[7px] w-[7px] rounded-full bg-zinc-400"
          style={{ animation: `tdg-dot 1.1s ${i * 0.16}s infinite ease-in-out` }}
        />
      ))}
    </div>
  );
}

/** Hàng chip cuộn ngang: mũi tên ‹ › khi còn chip bị che, lăn chuột dọc → cuộn ngang, viền mờ hai bên. */
function ChipRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = setTimeout(update, 0);
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      clearTimeout(t);
      el.removeEventListener("wheel", onWheel);
      ro.disconnect();
    };
  }, [update]);
  const nudge = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 180, behavior: "smooth" });
  const arrow = "absolute top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white text-[15px] font-bold text-zinc-700 shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:bg-zinc-50";
  return (
    <div className="relative border-t border-zinc-100 bg-white pt-2">
      <div ref={ref} onScroll={update} className="flex gap-1.5 overflow-x-auto scroll-smooth px-3 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      {edge.left && (
        <>
          <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 top-2 w-10 bg-gradient-to-r from-white to-transparent" />
          <button type="button" aria-label="Previous topics" onClick={() => nudge(-1)} className={`${arrow} left-1.5 mt-1`}>‹</button>
        </>
      )}
      {edge.right && (
        <>
          <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 top-2 w-12 bg-gradient-to-l from-white to-transparent" />
          <button type="button" aria-label="More topics" onClick={() => nudge(1)} className={`${arrow} right-1.5 mt-1`}>›</button>
        </>
      )}
    </div>
  );
}
