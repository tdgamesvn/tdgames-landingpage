"use client";

// Kho kiến thức AI chat + bật/tắt + ngân sách tháng (quyền chat.manage). AI CHỈ được trả lời từ các thẻ ở đây
// + danh sách job đang mở — thêm/sửa thẻ = dạy AI. Viết tiếng Anh (khách quốc tế).
import { useCallback, useEffect, useState } from "react";
import { hrFetch } from "./HrSession";

type Card = { id: string; title: string; content: string; audience: "client" | "candidate" | "any"; sort_order: number; active: boolean };
type Usage = { costUsd: number; drafts: number; failed: number; sentAsIs: number; sentEdited: number; discarded: number; up: number; down: number };
type Settings = { mode: "off" | "draft" | "auto"; budgetUsd: number };
type Draft = { title: string; content: string; audience: Card["audience"] };

const EMPTY: Draft = { title: "", content: "", audience: "client" };
const AUD: Record<Card["audience"], string> = { client: "Khách", candidate: "Ứng viên", any: "Chung" };
const inputCls =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[14px] text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none sm:text-[13px]";

export default function AiKnowledgePanel({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [budget, setBudget] = useState("");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await hrFetch("/api/hr/chat/kb");
    const j = await r.json();
    if (!r.ok) return setMsg(j.error ?? "Lỗi tải");
    setCards(j.cards);
    setUsage(j.usage);
    setSettings(j.settings);
    setBudget(String(j.settings.budgetUsd));
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    setMsg("");
    try {
      const r = await hrFetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Lỗi");
      await load();
      return true;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Lỗi");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const ok =
      editing === "new"
        ? await call("/api/hr/chat/kb", "POST", { ...draft, sortOrder: (cards?.at(-1)?.sort_order ?? 0) + 10 })
        : await call(`/api/hr/chat/kb/${editing}`, "PATCH", draft);
    if (ok) setEditing(null);
  }

  const form = (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-white/[0.03] p-3">
      <input className={inputCls} placeholder="Tiêu đề (vd: Payment terms)" maxLength={80} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      <select className={inputCls} value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value as Card["audience"] })}>
        <option value="client">Khách</option>
        <option value="candidate">Ứng viên</option>
        <option value="any">Chung</option>
      </select>
      <textarea
        className={`${inputCls} min-h-[130px]`}
        placeholder="Sự thật AI được phép nói (tiếng Anh). Ghi rõ số liệu, link /…, email — AI không được nói gì ngoài thẻ."
        maxLength={3000}
        value={draft.content}
        onChange={(e) => setDraft({ ...draft, content: e.target.value })}
      />
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={save} className="rounded-lg bg-amber-500 px-4 py-2 text-[13px] font-semibold text-black disabled:opacity-40">Lưu</button>
        <button type="button" onClick={() => setEditing(null)} className="hr-toolbar-btn">Huỷ</button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-3 flex items-center gap-2">
        <button type="button" onClick={onBack} className="hr-toolbar-btn">‹ Chat</button>
        <h2 className="text-[16px] font-semibold text-white">🤖 AI trả lời chat</h2>
      </div>

      {settings && usage && (
        <div className="mb-4 rounded-xl border border-white/10 p-3 text-[13px] text-white/75">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/50">Chế độ:</span>
            <div className="hr-segmented" role="group" aria-label="Chế độ AI">
              <button type="button" aria-pressed={settings.mode === "off"} disabled={busy} onClick={() => call("/api/hr/chat/kb", "PUT", { mode: "off" })}>Tắt</button>
              <button type="button" aria-pressed={settings.mode === "draft"} disabled={busy} onClick={() => call("/api/hr/chat/kb", "PUT", { mode: "draft" })}>Soạn nháp</button>
              <button type="button" aria-pressed={settings.mode === "auto"} disabled={busy} onClick={() => call("/api/hr/chat/kb", "PUT", { mode: "auto" })}>Tự trả lời 24/7</button>
            </div>
            <span className="ml-auto flex items-center gap-1.5">
              <span className="whitespace-nowrap text-white/50">Ngân sách/tháng $</span>
              <input
                className="w-20 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[14px] text-white focus:border-amber-500/50 focus:outline-none sm:text-[13px]"
                inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} />
              <button type="button" disabled={busy || budget === String(settings.budgetUsd)} onClick={() => call("/api/hr/chat/kb", "PUT", { budgetUsd: Number(budget) })} className="hr-toolbar-btn disabled:opacity-40">Lưu</button>
            </span>
          </div>
          <p className="mt-2 text-[12px] text-white/50">
            Soạn nháp = AI viết sẵn câu trả lời trong từng cuộc chat, <b>chỉ staff thấy</b>, khách không thấy. Bấm “Dùng nháp này” để sửa rồi gửi.
            <br />Tự trả lời 24/7 = AI gửi thẳng cho khách (ghi “AI assistant”). Nháp nghi bịa → khách chỉ nhận câu “team sẽ trả lời”, nháp giữ lại cho staff.
            Staff vừa trả lời luồng nào thì AI im luồng đó 2 giờ.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[12px] sm:grid-cols-4">
            <span>Tháng này: <b className="text-white">${usage.costUsd.toFixed(2)}</b> / ${settings.budgetUsd}</span>
            <span>Nháp: <b className="text-white">{usage.drafts}</b>{usage.failed ? ` (lỗi ${usage.failed})` : ""}</span>
            <span>Gửi nguyên: {usage.sentAsIs} · sửa rồi gửi: {usage.sentEdited}</span>
            <span>Bỏ: {usage.discarded} · 👍 {usage.up} · 👎 {usage.down}</span>
          </div>
        </div>
      )}

      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[14px] font-semibold text-white">Kho kiến thức</h3>
        <button
          type="button"
          onClick={() => {
            setDraft(EMPTY);
            setEditing("new");
          }}
          className="ml-auto rounded-lg bg-amber-500 px-3 py-1.5 text-[13px] font-semibold text-black"
        >
          ＋ Thêm thẻ
        </button>
      </div>
      <p className="mb-3 text-[12.5px] text-white/50">
        AI chỉ được trả lời bằng thông tin trong các thẻ này + danh sách job đang mở. Thiếu thông tin → AI báo “team sẽ trả lời” và gắn cờ cần người.
      </p>
      {msg && <p className="mb-2 text-[13px] text-red-400">{msg}</p>}
      {editing === "new" && <div className="mb-3">{form}</div>}
      <div className="flex flex-col gap-2">
        {cards === null ? (
          <p className="py-8 text-center text-sm text-white/40">Đang tải…</p>
        ) : (
          cards.map((c) =>
            editing === c.id ? (
              <div key={c.id}>{form}</div>
            ) : (
              <div key={c.id} className={`rounded-xl border border-white/10 p-3 ${c.active ? "" : "opacity-50"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-white">{c.title}</span>
                  <span className="rounded bg-white/10 px-1.5 py-px text-[10px] text-white/60">{AUD[c.audience]}</span>
                  {!c.active && <span className="text-[11px] text-white/45">(đang tắt)</span>}
                </div>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[12.5px] text-white/60">{c.content}</p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft({ title: c.title, content: c.content, audience: c.audience });
                      setEditing(c.id);
                    }}
                    className="hr-toolbar-btn"
                  >
                    Sửa
                  </button>
                  <button type="button" disabled={busy} onClick={() => call(`/api/hr/chat/kb/${c.id}`, "PATCH", { active: !c.active })} className="hr-toolbar-btn">
                    {c.active ? "Tắt" : "Bật"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => confirm(`Xoá thẻ "${c.title}"?`) && call(`/api/hr/chat/kb/${c.id}`, "DELETE")}
                    className="hr-toolbar-btn text-red-400"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}
