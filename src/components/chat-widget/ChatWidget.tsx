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
  }, [messages.length, contactMode]);

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
        setError(e instanceof ChatError && e.status === 429 ? "Too many messages — please wait a moment." : "Message not sent. Please try again.");
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
    setBusy(true);
    setError(null);
    try {
      const r = await sendQuickReply(id);
      merge(r.messages);
      setThread(r.thread);
    } catch {
      setError("Couldn't load that answer. Please try again.");
    } finally {
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
  const showTopics = messages.length === 0;

  return (
    <div
      role="dialog"
      aria-label="TD Games chat"
      className="fixed inset-0 z-[95] flex flex-col overflow-hidden bg-white text-zinc-900 shadow-[0_24px_70px_rgba(0,0,0,0.55)] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(620px,calc(100vh-48px))] sm:w-[380px] sm:rounded-2xl"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 bg-[#111116] px-4 py-3 text-white">
        <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[#f59e0b] text-[13px] font-black text-[#111]">TD</div>
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

      {/* Chủ đề nhanh khi đã có tin */}
      {!showTopics && quickReplies.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto border-t border-zinc-100 bg-white px-3 pt-2 [scrollbar-width:none]">
          {quickReplies.map((q) => (
            <button key={q.id} type="button" disabled={busy} onClick={() => onQuickReply(q.id)} className="shrink-0 rounded-full border border-orange-200 px-3 py-1 text-[12px] font-semibold text-[#b45309] hover:bg-orange-50 disabled:opacity-50">
              {q.label}
            </button>
          ))}
        </div>
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
