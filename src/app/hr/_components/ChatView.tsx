"use client";

// Tab "Chat" (spec docs/superpowers/specs/2026-11-05-website-chat-design.md §6): hộp thư chat từ website.
// Khách → người có chat.clients (sếp), ứng viên → chat.candidates (HR). AI Phase A: chỉ soạn nháp cho staff duyệt.
import { useCallback, useEffect, useRef, useState } from "react";
import { hrFetch, useHrSession } from "./HrSession";
import QuickRepliesPanel from "./QuickRepliesPanel";
import AiKnowledgePanel from "./AiKnowledgePanel";

type Audience = "client" | "candidate";
type Filter = "needs" | "answered" | "closed";
type ThreadListItem = {
  id: string;
  audience: Audience;
  status: "open" | "answered" | "closed";
  needsHuman: boolean;
  name: string | null;
  email: string | null;
  country: string | null;
  lastPage: string | null;
  lastMessageAt: string;
  leadId: string | null;
  lastMessage: { body: string; sender: string; created_at: string } | null;
  otherThreadCount: number;
};
type Msg = {
  id: string;
  sender: "visitor" | "staff" | "system" | "ai";
  kind: "text" | "quick_reply" | "canned_answer" | "contact_form";
  body: string;
  staff_name: string | null;
  created_at: string;
};
type ThreadDetail = {
  thread: {
    id: string;
    audience: Audience;
    status: "open" | "answered" | "closed";
    needs_human: boolean;
    name: string | null;
    email: string | null;
    country: string | null;
    user_agent: string | null;
    last_page: string | null;
    pages: string[];
    lead_id: string | null;
    created_at: string;
  };
  messages: Msg[];
  previous: { id: string; createdAt: string; messages: Msg[] }[];
  applicationId: string | null;
  aiDraft: AiDraft | null;
};
type AiDraft = {
  id: string;
  status: "pending" | "failed";
  answer: string | null;
  needs_human: boolean;
  confidence: string | null;
  sources: { ref: string; title: string }[];
  warnings: string[];
  model: string | null;
  error: string | null;
  rating: number | null;
  created_at: string;
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: "needs", label: "Cần người" },
  { key: "answered", label: "Đã trả lời" },
  { key: "closed", label: "Đã đóng" },
];
const AUD_LABEL: Record<Audience, string> = { client: "KHÁCH", candidate: "ỨNG VIÊN" };
const AUD_CLS: Record<Audience, string> = {
  client: "bg-orange-500/15 text-orange-400",
  candidate: "bg-blue-500/15 text-blue-400",
};

export function countryFlag(cc: string | null): string {
  if (!cc || !/^[A-Z]{2}$/.test(cc) || cc === "XX" || cc === "T1") return "";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
const who = (t: { name: string | null; email: string | null; id: string }) =>
  t.name && t.email ? `${t.name} · ${t.email}` : t.name || t.email || `Khách #${t.id.slice(-4)}`;
const timeVN = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 60000;
  if (diff < 1) return "vừa xong";
  if (diff < 60) return `${Math.round(diff)} phút`;
  if (diff < 24 * 60) return `${Math.round(diff / 60)} giờ`;
  return d.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit" });
};
const clockVN = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

export default function ChatView({
  initialThreadId,
  onCount,
  onOpenApp,
}: {
  initialThreadId?: string | null;
  onCount?: (n: number) => void;
  onOpenApp?: (appId: string) => void;
}) {
  const { can } = useHrSession();
  const [filter, setFilter] = useState<Filter>("needs");
  const [aud, setAud] = useState<"all" | Audience>("all");
  const [threads, setThreads] = useState<ThreadListItem[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(initialThreadId ?? null);
  const [showQr, setShowQr] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [err, setErr] = useState("");
  const both = can("chat.clients") && can("chat.candidates");

  const loadList = useCallback(async () => {
    try {
      const r = await hrFetch(`/api/hr/chat/threads?filter=${filter}&audience=${aud}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Lỗi tải chat");
      setThreads(j.threads);
      onCount?.(j.counts?.needs ?? 0);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải chat");
    }
  }, [filter, aud, onCount]);

  useEffect(() => {
    void Promise.resolve().then(loadList);
    const i = setInterval(() => !document.hidden && loadList(), 15000);
    return () => clearInterval(i);
  }, [loadList]);

  if (showQr) return <QuickRepliesPanel onBack={() => setShowQr(false)} />;
  if (showAi) return <AiKnowledgePanel onBack={() => setShowAi(false)} />;

  const list = (
    <div className={`flex min-w-0 flex-col ${openId ? "hidden lg:flex" : "flex"} lg:w-[380px] lg:flex-none`}>
      <div className="mb-2 flex items-center gap-2">
        <div className="hr-segmented flex-1" role="group" aria-label="Lọc chat">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {(both || can("chat.manage")) && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {both &&
            (["all", "client", "candidate"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAud(a)}
                className={`rounded-full border px-3 py-1 text-[12px] font-medium ${aud === a ? "border-amber-500/60 bg-amber-500/10 text-amber-400" : "border-white/15 text-white/60"}`}
              >
                {a === "all" ? "Tất cả" : a === "client" ? "Khách" : "Ứng viên"}
              </button>
            ))}
          {can("chat.manage") && (
            <span className="ml-auto flex gap-1">
              <button type="button" onClick={() => setShowQr(true)} className="hr-toolbar-btn whitespace-nowrap" title="Sửa các nút câu hỏi có sẵn">
                ⚙ Câu có sẵn
              </button>
              <button type="button" onClick={() => setShowAi(true)} className="hr-toolbar-btn whitespace-nowrap" title="Kho kiến thức & cài đặt AI">
                🤖 AI
              </button>
            </span>
          )}
        </div>
      )}
      {err && <p className="mb-2 text-[13px] text-red-400">{err}</p>}
      <div className="overflow-hidden rounded-xl border border-white/10">
        {threads === null ? (
          <p className="py-10 text-center text-sm text-white/40">Đang tải…</p>
        ) : threads.length === 0 ? (
          <p className="py-10 text-center text-sm text-white/40">
            {filter === "needs" ? "Không có ai đang chờ trả lời 🎉" : "Chưa có cuộc chat nào."}
          </p>
        ) : (
          threads.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setOpenId(t.id)}
              className={`flex w-full gap-3 border-b border-white/5 px-3 py-2.5 text-left last:border-0 hover:bg-white/5 ${openId === t.id ? "bg-white/[0.07]" : t.needsHuman ? "bg-amber-500/[0.04]" : ""}`}
            >
              <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-full bg-white/10 text-[13px] font-semibold text-white/80">
                {(t.name || t.email || "K").slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13.5px] font-semibold text-white">{who(t)}</span>
                  <span className={`flex-none rounded px-1.5 py-px text-[9.5px] font-bold ${AUD_CLS[t.audience]}`}>{AUD_LABEL[t.audience]}</span>
                  <span className="ml-auto flex-none text-[11px] text-white/40">{timeVN(t.lastMessageAt)}</span>
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-white/60">
                  {t.lastMessage ? `${t.lastMessage.sender === "staff" ? "Bạn: " : t.lastMessage.sender === "ai" ? "🤖 AI: " : ""}${t.lastMessage.body}` : "—"}
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-[11px] text-white/45">
                  <span className={`h-[7px] w-[7px] rounded-full ${t.needsHuman ? "bg-red-500" : t.status === "closed" ? "bg-white/30" : "bg-green-500"}`} />
                  {t.needsHuman ? "Cần trả lời" : t.status === "closed" ? "Đã đóng" : "Đã trả lời"}
                  {t.lastPage && <span className="truncate">· {t.lastPage}</span>}
                  {countryFlag(t.country) && <span>· {countryFlag(t.country)}</span>}
                  {t.leadId && <span>· đã tạo lead</span>}
                  {t.otherThreadCount > 0 && <span>· {t.otherThreadCount} chat trước</span>}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex gap-5">
      {list}
      {openId ? (
        <ThreadPane
          key={openId}
          id={openId}
          onOpenApp={onOpenApp}
          onBack={() => setOpenId(null)}
          onChanged={loadList}
          onDeleted={() => {
            setOpenId(null);
            void loadList();
          }}
        />
      ) : (
        <div className="hidden flex-1 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/35 lg:flex">
          Chọn một cuộc chat để xem
        </div>
      )}
    </div>
  );
}

function ThreadPane({
  id,
  onBack,
  onChanged,
  onDeleted,
  onOpenApp,
}: {
  id: string;
  onBack: () => void;
  onChanged: () => void;
  onDeleted: () => void;
  onOpenApp?: (appId: string) => void;
}) {
  const { can } = useHrSession();
  const [data, setData] = useState<ThreadDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [showPrev, setShowPrev] = useState(false);
  // Nháp AI đã chèn vào ô trả lời — gửi kèm để đánh dấu "đã dùng" (+ có sửa không).
  const [usedDraftId, setUsedDraftId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const r = await hrFetch(`/api/hr/chat/threads/${id}`);
    if (r.status === 404) return setNotFound(true);
    if (r.ok) setData(await r.json());
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(load);
    const i = setInterval(() => !document.hidden && load(), 4000);
    return () => clearInterval(i);
  }, [load]);

  const count = data?.messages.length ?? 0;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count]);

  async function act(body: Record<string, unknown>, msg?: string) {
    setBusy(true);
    setNote("");
    try {
      const r = await hrFetch(`/api/hr/chat/threads/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Lỗi");
      if (j.deleted) return onDeleted();
      if (msg) setNote(msg);
      await load();
      onChanged();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setNote("");
    try {
      const r = await hrFetch(`/api/hr/chat/threads/${id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body, aiDraftId: usedDraftId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Không gửi được");
      setText("");
      setUsedDraftId(null);
      await load();
      onChanged();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Không gửi được");
    } finally {
      setBusy(false);
    }
  }

  async function draftAction(body: Record<string, unknown>) {
    if (!data?.aiDraft) return;
    setNote("");
    try {
      const r = await hrFetch(`/api/hr/chat/threads/${id}/ai-draft`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draftId: data.aiDraft.id, ...body }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Lỗi");
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Lỗi");
    }
  }

  async function createLead() {
    setBusy(true);
    setNote("");
    try {
      const r = await hrFetch(`/api/hr/chat/threads/${id}/lead`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Không tạo được lead");
      setNote("Đã tạo lead trong CRM.");
      await load();
      onChanged();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <div className="flex-1 rounded-xl border border-white/10 p-6 text-sm text-white/50">
        <button type="button" onClick={onBack} className="hr-toolbar-btn mb-3">‹ Quay lại</button>
        <p>Không tìm thấy cuộc chat (đã xoá hoặc bạn không có quyền xem).</p>
      </div>
    );
  }
  if (!data) return <div className="flex-1 py-16 text-center text-sm text-white/40">Đang tải…</div>;
  const t = data.thread;
  const isClient = t.audience === "client";
  const other: Audience = isClient ? "candidate" : "client";
  const canOther = can(other === "client" ? "chat.clients" : "chat.candidates");

  return (
    <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-white/10" style={{ height: "calc(100dvh - 190px)", minHeight: 420 }}>
      {/* Đầu luồng */}
      <div className="flex items-start gap-2 border-b border-white/10 px-3 py-2.5">
        <button type="button" onClick={onBack} className="hr-toolbar-btn lg:hidden" aria-label="Quay lại">‹</button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[14px] font-semibold text-white">{who(t)}</span>
            <span className={`rounded px-1.5 py-px text-[9.5px] font-bold ${AUD_CLS[t.audience]}`}>{AUD_LABEL[t.audience]}</span>
          </div>
          <div className="mt-0.5 text-[11.5px] text-white/50">
            {countryFlag(t.country)} {t.last_page ? `Đang xem ${t.last_page}` : ""}
            {t.pages.length > 1 && ` · trước đó: ${t.pages.slice(0, -1).reverse().join(", ")}`}
          </div>
        </div>
      </div>

      {/* Thao tác */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/10 px-3 py-2">
        {t.status === "closed" ? (
          <button type="button" disabled={busy} onClick={() => act({ action: "reopen" })} className="hr-toolbar-btn">↺ Mở lại</button>
        ) : (
          <button type="button" disabled={busy} onClick={() => act({ action: "close" }, "Đã đóng cuộc chat.")} className="hr-toolbar-btn">✓ Đóng</button>
        )}
        {canOther && (
          <button type="button" disabled={busy} onClick={() => act({ action: "set_audience", audience: other }, "Đã đổi nhãn.")} className="hr-toolbar-btn">
            Đổi thành {other === "client" ? "Khách" : "Ứng viên"}
          </button>
        )}
        {isClient &&
          (t.lead_id ? (
            <span className="px-2 py-1 text-[12px] text-green-400">✓ Đã tạo lead</span>
          ) : (
            <button
              type="button"
              disabled={busy || !t.email}
              onClick={createLead}
              title={t.email ? "Tạo lead trong CRM" : "Xin email khách trước"}
              className="hr-toolbar-btn disabled:opacity-40"
            >
              ＋ Tạo lead CRM
            </button>
          ))}
        {data.applicationId && onOpenApp && (
          <button type="button" onClick={() => onOpenApp(data.applicationId!)} className="hr-toolbar-btn">
            Mở hồ sơ ứng viên
          </button>
        )}
        {can("chat.manage") && (
          <button
            type="button"
            disabled={busy}
            onClick={() => confirm("Xoá vĩnh viễn cuộc chat này (khách yêu cầu xoá dữ liệu)?") && act({ action: "delete" })}
            className="hr-toolbar-btn ml-auto text-red-400"
          >
            Xoá
          </button>
        )}
      </div>

      {/* Tin nhắn */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
        {data.previous.length > 0 && (
          <div className="mb-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px]">
            <button type="button" onClick={() => setShowPrev((v) => !v)} className="font-medium text-amber-400">
              {showPrev ? "▾" : "▸"} Người này có {data.previous.length} cuộc chat trước (cùng email)
            </button>
            {showPrev &&
              data.previous.map((p) => (
                <div key={p.id} className="mt-2 border-t border-white/10 pt-2">
                  <div className="mb-1 text-[11px] text-white/40">Bắt đầu {clockVN(p.createdAt)}</div>
                  {p.messages.map((m) => (
                    <MsgRow key={m.id} m={m} compact />
                  ))}
                </div>
              ))}
          </div>
        )}
        {data.messages.map((m) => (
          <MsgRow key={m.id} m={m} />
        ))}
        <div ref={endRef} />
      </div>

      {data.aiDraft && t.status !== "closed" && (
        <AiDraftCard
          d={data.aiDraft}
          onUse={() => {
            setText(data.aiDraft?.answer ?? "");
            setUsedDraftId(data.aiDraft?.id ?? null);
          }}
          onDiscard={() => draftAction({ action: "discard" })}
          onRate={(rating) => draftAction({ action: "rate", rating })}
        />
      )}
      {note && <p className="px-3 pb-1 text-[12px] text-amber-400">{note}</p>}
      {!t.email && (
        <p className="px-3 pb-1 text-[11.5px] text-white/45">Khách chưa để email — họ chỉ thấy trả lời khi còn mở trang / quay lại website.</p>
      )}
      <div className="flex items-end gap-2 border-t border-white/10 p-2.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          maxLength={2000}
          placeholder={isClient ? "Trả lời khách (tiếng Anh)…" : "Trả lời ứng viên…"}
          className="max-h-40 min-h-[44px] flex-1 resize-y rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[15px] text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none sm:text-[13.5px]"
        />
        <button type="button" disabled={busy || !text.trim()} onClick={send} className="rounded-xl bg-amber-500 px-4 py-2.5 text-[13px] font-semibold text-black disabled:opacity-40">
          Gửi
        </button>
      </div>
    </section>
  );
}

const WARN_LABEL: Record<string, string> = {
  no_source: "không dẫn nguồn",
  unknown_source: "dẫn nguồn không có thật",
  unverified_numbers: "có số không có trong dữ liệu",
  unverified_email: "có email lạ",
  unverified_link: "có link lạ",
  nda_mention: "nhắc dự án NDA",
};

/** Nháp AI (Phase A): chỉ staff thấy. Dùng = chèn vào ô trả lời để sửa rồi gửi. */
function AiDraftCard({
  d,
  onUse,
  onDiscard,
  onRate,
}: {
  d: AiDraft;
  onUse: () => void;
  onDiscard: () => void;
  onRate: (r: 1 | -1 | null) => void;
}) {
  const [open, setOpen] = useState(true);
  if (d.status === "failed") {
    return (
      <div className="mx-3 mb-2 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-[12px] text-red-300">
        🤖 AI không soạn được nháp (đã báo admin). <span className="text-red-300/60">{d.error?.slice(0, 160)}</span>
      </div>
    );
  }
  const warns = d.warnings.map((w) => WARN_LABEL[w.split(":")[0]] ?? w);
  return (
    <div className="mx-3 mb-2 rounded-xl border border-violet-400/30 bg-violet-500/[0.07] px-3 py-2">
      <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
        <button type="button" onClick={() => setOpen((v) => !v)} className="font-semibold text-violet-300">
          {open ? "▾" : "▸"} 🤖 Nháp AI
        </button>
        <span className="text-white/40">chỉ bạn thấy · độ chắc: {d.confidence ?? "?"}</span>
        {d.needs_human && <span className="rounded bg-amber-500/15 px-1.5 py-px text-amber-400">cần người xem kỹ</span>}
        {warns.map((w) => (
          <span key={w} className="rounded bg-red-500/15 px-1.5 py-px text-red-300">⚠ {w}</span>
        ))}
      </div>
      {open && (
        <>
          <p className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap text-[13px] leading-snug text-white/85">{d.answer}</p>
          {d.sources.length > 0 && (
            <p className="mt-1 text-[11px] text-white/40">Nguồn: {d.sources.map((s) => s.title).join(" · ")}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={onUse} className="rounded-lg bg-violet-500 px-3 py-1 text-[12px] font-semibold text-white">
              Dùng nháp này
            </button>
            <button type="button" onClick={onDiscard} className="hr-toolbar-btn">Bỏ</button>
            <span className="ml-auto flex gap-1">
              <button type="button" aria-pressed={d.rating === 1} onClick={() => onRate(d.rating === 1 ? null : 1)} className={`hr-toolbar-btn ${d.rating === 1 ? "text-green-400" : ""}`} title="Nháp tốt">👍</button>
              <button type="button" aria-pressed={d.rating === -1} onClick={() => onRate(d.rating === -1 ? null : -1)} className={`hr-toolbar-btn ${d.rating === -1 ? "text-red-400" : ""}`} title="Nháp sai / dở">👎</button>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function MsgRow({ m, compact }: { m: Msg; compact?: boolean }) {
  const time = <span className="text-[10.5px] text-white/35">{clockVN(m.created_at)}</span>;
  if (m.kind === "contact_form") {
    return <p className="self-center text-[11.5px] text-white/45">📧 Khách để lại liên hệ: {m.body}</p>;
  }
  if (m.kind === "quick_reply") {
    return (
      <p className="self-start text-[12px] text-white/50">
        Khách bấm: <b className="text-white/75">{m.body}</b> {time}
      </p>
    );
  }
  if (m.kind === "canned_answer") {
    return compact ? null : (
      <details className="self-start text-[11.5px] text-white/40">
        <summary className="cursor-pointer">Câu trả lời có sẵn đã hiện cho khách</summary>
        <p className="mt-1 max-w-[520px] whitespace-pre-wrap text-white/55">{m.body}</p>
      </details>
    );
  }
  const ai = m.sender === "ai";
  const mine = m.sender === "staff" || ai;
  return (
    <div className={`flex max-w-[85%] flex-col gap-0.5 ${mine ? "self-end items-end" : "self-start"}`}>
      <span className="text-[10.5px] text-white/40">
        {ai ? "🤖 AI tự trả lời" : mine ? `${m.staff_name ?? "TD Games"}` : "Khách"} · {clockVN(m.created_at)}
      </span>
      <div
        className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-[13.5px] leading-snug ${
          ai
            ? "rounded-br-md border border-sky-400/30 bg-sky-500/15 text-white"
            : mine
              ? "rounded-br-md bg-amber-500 text-black"
              : "rounded-bl-md border border-white/10 bg-white/5 text-white"
        }`}
      >
        {m.body}
      </div>
    </div>
  );
}
