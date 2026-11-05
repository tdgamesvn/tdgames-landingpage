"use client";

// Sửa các nút câu hỏi có sẵn của ô chat website (quyền chat.manage). Câu trả lời viết tiếng Anh (khách quốc tế).
import { useCallback, useEffect, useState } from "react";
import { hrFetch } from "./HrSession";

type QR = {
  id: string;
  label: string;
  audience: "client" | "candidate" | "any";
  answer: string;
  link_label: string | null;
  link_url: string | null;
  sort_order: number;
  active: boolean;
};
type Draft = { label: string; audience: QR["audience"]; answer: string; linkLabel: string; linkUrl: string };

const EMPTY: Draft = { label: "", audience: "client", answer: "", linkLabel: "", linkUrl: "" };
const AUD: Record<QR["audience"], string> = { client: "Khách", candidate: "Ứng viên", any: "Chung" };
const inputCls =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[14px] text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none sm:text-[13px]";

export default function QuickRepliesPanel({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<QR[] | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await hrFetch("/api/hr/chat/quick-replies");
    const j = await r.json();
    if (r.ok) setItems(j.quickReplies);
    else setMsg(j.error ?? "Lỗi tải");
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
    const body = { label: draft.label, audience: draft.audience, answer: draft.answer, linkLabel: draft.linkLabel, linkUrl: draft.linkUrl };
    const ok =
      editing === "new"
        ? await call("/api/hr/chat/quick-replies", "POST", { ...body, sortOrder: ((items?.at(-1)?.sort_order ?? 0) + 10) })
        : await call(`/api/hr/chat/quick-replies/${editing}`, "PATCH", body);
    if (ok) setEditing(null);
  }

  async function move(i: number, dir: -1 | 1) {
    if (!items) return;
    const a = items[i];
    const b = items[i + dir];
    if (!a || !b) return;
    await call(`/api/hr/chat/quick-replies/${a.id}`, "PATCH", { sortOrder: b.sort_order });
    await call(`/api/hr/chat/quick-replies/${b.id}`, "PATCH", { sortOrder: a.sort_order });
  }

  const form = (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-white/[0.03] p-3">
      <input className={inputCls} placeholder="Nhãn nút (vd: 🎨 Our services)" maxLength={60} value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
      <select className={inputCls} value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value as QR["audience"] })}>
        <option value="client">Khách (chuyển cho Sếp)</option>
        <option value="candidate">Ứng viên (chuyển cho HR)</option>
        <option value="any">Chung</option>
      </select>
      <textarea className={`${inputCls} min-h-[110px]`} placeholder="Câu trả lời hiện cho khách (tiếng Anh)" maxLength={1500} value={draft.answer} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} />
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={inputCls} placeholder="Nhãn nút link (tuỳ chọn)" maxLength={40} value={draft.linkLabel} onChange={(e) => setDraft({ ...draft, linkLabel: e.target.value })} />
        <input className={inputCls} placeholder="/contact hoặc https://…" maxLength={300} value={draft.linkUrl} onChange={(e) => setDraft({ ...draft, linkUrl: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={save} className="rounded-lg bg-amber-500 px-4 py-2 text-[13px] font-semibold text-black disabled:opacity-40">Lưu</button>
        <button type="button" onClick={() => setEditing(null)} className="hr-toolbar-btn">Huỷ</button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="mb-3 flex items-center gap-2">
        <button type="button" onClick={onBack} className="hr-toolbar-btn">‹ Chat</button>
        <h2 className="text-[16px] font-semibold text-white">Câu hỏi có sẵn</h2>
        <button
          type="button"
          onClick={() => {
            setDraft(EMPTY);
            setEditing("new");
          }}
          className="ml-auto rounded-lg bg-amber-500 px-3 py-1.5 text-[13px] font-semibold text-black"
        >
          ＋ Thêm
        </button>
      </div>
      <p className="mb-3 text-[12.5px] text-white/50">
        Khách bấm nút là thấy ngay câu trả lời, không gọi người. Nút “Talk to a person” luôn có sẵn, không cần thêm ở đây.
      </p>
      {msg && <p className="mb-2 text-[13px] text-red-400">{msg}</p>}
      {editing === "new" && <div className="mb-3">{form}</div>}
      <div className="flex flex-col gap-2">
        {items === null ? (
          <p className="py-8 text-center text-sm text-white/40">Đang tải…</p>
        ) : (
          items.map((q, i) =>
            editing === q.id ? (
              <div key={q.id}>{form}</div>
            ) : (
              <div key={q.id} className={`rounded-xl border border-white/10 p-3 ${q.active ? "" : "opacity-50"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-white">{q.label}</span>
                  <span className="rounded bg-white/10 px-1.5 py-px text-[10px] text-white/60">{AUD[q.audience]}</span>
                  {!q.active && <span className="text-[11px] text-white/45">(đang tắt)</span>}
                  <span className="ml-auto flex gap-0.5">
                    <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} className="hr-toolbar-btn" aria-label="Lên">↑</button>
                    <button type="button" disabled={busy || i === items.length - 1} onClick={() => move(i, 1)} className="hr-toolbar-btn" aria-label="Xuống">↓</button>
                  </span>
                </div>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[12.5px] text-white/60">{q.answer}</p>
                {q.link_url && <p className="mt-1 text-[11.5px] text-amber-400">↳ {q.link_label} — {q.link_url}</p>}
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft({ label: q.label, audience: q.audience, answer: q.answer, linkLabel: q.link_label ?? "", linkUrl: q.link_url ?? "" });
                      setEditing(q.id);
                    }}
                    className="hr-toolbar-btn"
                  >
                    Sửa
                  </button>
                  <button type="button" disabled={busy} onClick={() => call(`/api/hr/chat/quick-replies/${q.id}`, "PATCH", { active: !q.active })} className="hr-toolbar-btn">
                    {q.active ? "Tắt" : "Bật"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => confirm(`Xoá nút "${q.label}"?`) && call(`/api/hr/chat/quick-replies/${q.id}`, "DELETE")}
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
