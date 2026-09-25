"use client";

import { useState } from "react";
import type { StatusDef, StatusKind } from "@/app/admin/_lib/types";
import { STATUS_PALETTE } from "./status-palette";

const KIND_LABEL: Record<StatusKind, string> = {
  open: "Đang xử lý",
  won: "Chốt (won)",
  lost: "Loại (lost)",
};

/**
 * Modal ⚙ Statuses: thêm / đổi tên / màu / loại / ngưỡng nhắc / kéo đổi thứ tự / xoá.
 * Thêm & xoá gọi API ngay; sửa & đổi thứ tự gom lại, bấm "Lưu" mới gửi PATCH.
 */
export default function StatusManager({
  hrKey,
  statuses,
  counts,
  onChange,
  onMoved,
  onClose,
}: {
  hrKey: string;
  statuses: StatusDef[];
  counts: Record<string, number>;
  onChange: (list: StatusDef[]) => void;
  onMoved: (from: string, to: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<StatusDef[]>(() => [...statuses].sort((a, b) => a.position - b.position));
  const [newLabel, setNewLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{ key: string; moveTo: string } | null>(null);

  const headers = { "Content-Type": "application/json", "x-hr-key": hrKey };
  const dirty = JSON.stringify(draft) !== JSON.stringify([...statuses].sort((a, b) => a.position - b.position));

  function patchRow(key: string, patch: Partial<StatusDef>) {
    setDraft((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function moveRow(fromKey: string, toKey: string) {
    if (fromKey === toKey) return;
    setDraft((prev) => {
      const list = [...prev];
      const from = list.findIndex((s) => s.key === fromKey);
      const to = list.findIndex((s) => s.key === toKey);
      const [row] = list.splice(from, 1);
      list.splice(to, 0, row);
      return list.map((s, i) => ({ ...s, position: (i + 1) * 10 }));
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hr/statuses", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          statuses: draft.map(({ key, label, color, position, kind, remind_days }) => ({
            key, label, color, position, kind, remind_days,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lưu thất bại");
      onChange(data.statuses);
      setDraft(data.statuses);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    const label = newLabel.trim();
    if (!label) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hr/statuses", { method: "POST", headers, body: JSON.stringify({ label }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Thêm thất bại");
      const created = data.status as StatusDef;
      const next = [...statuses, created].sort((a, b) => a.position - b.position);
      onChange(next);
      setDraft((prev) => [...prev, created].sort((a, b) => a.position - b.position));
      setNewLabel("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thêm thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function remove(key: string, moveTo?: string) {
    setBusy(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ key, ...(moveTo ? { move_to: moveTo } : {}) });
      const res = await fetch(`/api/hr/statuses?${qs}`, { method: "DELETE", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Xoá thất bại");
      if (moveTo && data.moved > 0) onMoved(key, moveTo);
      onChange(statuses.filter((s) => s.key !== key));
      setDraft((prev) => prev.filter((s) => s.key !== key));
      setDeleting(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xoá thất bại");
    } finally {
      setBusy(false);
    }
  }

  function askRemove(s: StatusDef) {
    const n = counts[s.key] ?? 0;
    if (n === 0) {
      if (confirm(`Xoá status "${s.label}"?`)) void remove(s.key);
      return;
    }
    const fallback = draft.find((d) => d.key !== s.key && d.kind === "open")?.key ?? "new";
    setDeleting({ key: s.key, moveTo: fallback });
  }

  function close() {
    if (dirty && !confirm("Còn thay đổi chưa lưu — đóng luôn?")) return;
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#141418] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-base font-black text-white">Pipeline statuses</h2>
            <p className="text-[11px] text-white/40">
              Kéo ⋮⋮ để đổi thứ tự cột. New / Rejected là status hệ thống — chỉ đổi tên &amp; màu.
            </p>
          </div>
          <button onClick={close} className="text-white/40 hover:text-white">✕</button>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-[20px_1fr_110px_130px_80px_36px_28px] gap-2 px-1 text-[10px] uppercase tracking-wider text-white/30">
            <span />
            <span>Tên</span>
            <span>Màu</span>
            <span>Loại</span>
            <span title="Số ngày nằm trong cột thì Remind nhắc lên Discord. Trống = không nhắc.">Nhắc sau (ngày)</span>
            <span className="text-center">#</span>
            <span />
          </div>

          {draft.map((s) => (
            <div key={s.key}>
              <div
                draggable
                onDragStart={() => setDragKey(s.key)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragKey) moveRow(dragKey, s.key);
                }}
                onDragEnd={() => setDragKey(null)}
                className={`grid grid-cols-[20px_1fr_110px_130px_80px_36px_28px] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-1 py-1.5 ${
                  dragKey === s.key ? "opacity-50" : ""
                }`}
              >
                <span className="cursor-grab text-center text-white/30 active:cursor-grabbing">⋮⋮</span>
                <div className="flex items-center gap-2">
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${STATUS_PALETTE[s.color] ?? STATUS_PALETTE.slate}`}>
                    {s.label || "—"}
                  </span>
                  <input
                    value={s.label}
                    maxLength={40}
                    onChange={(e) => patchRow(s.key, { label: e.target.value })}
                    className="w-full min-w-0 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
                <select
                  value={s.color}
                  onChange={(e) => patchRow(s.key, { color: e.target.value })}
                  className="rounded border border-white/10 bg-[#1c1c22] px-1.5 py-1 text-xs text-white"
                >
                  {Object.keys(STATUS_PALETTE).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={s.kind}
                  disabled={s.is_system}
                  onChange={(e) => patchRow(s.key, { kind: e.target.value as StatusKind })}
                  className="rounded border border-white/10 bg-[#1c1c22] px-1.5 py-1 text-xs text-white disabled:opacity-40"
                >
                  {(Object.keys(KIND_LABEL) as StatusKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                </select>
                <input
                  type="number"
                  min={1}
                  value={s.remind_days ?? ""}
                  disabled={s.kind !== "open"}
                  placeholder="—"
                  onChange={(e) => patchRow(s.key, { remind_days: e.target.value ? Math.max(1, Number(e.target.value)) : null })}
                  className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white disabled:opacity-30"
                />
                <span className="text-center text-xs text-white/50">{counts[s.key] ?? 0}</span>
                <button
                  onClick={() => askRemove(s)}
                  disabled={s.is_system || busy}
                  title={s.is_system ? "Status hệ thống — không xoá được" : "Xoá status"}
                  className="text-xs text-white/30 hover:text-red-400 disabled:opacity-20 disabled:hover:text-white/30"
                >
                  🗑
                </button>
              </div>

              {deleting?.key === s.key && (
                <div className="mt-1 flex flex-wrap items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  <span>Còn {counts[s.key]} ứng viên — chuyển sang</span>
                  <select
                    value={deleting.moveTo}
                    onChange={(e) => setDeleting({ key: s.key, moveTo: e.target.value })}
                    className="rounded border border-white/10 bg-[#1c1c22] px-1.5 py-1 text-xs text-white"
                  >
                    {draft.filter((d) => d.key !== s.key).map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                  </select>
                  <span>rồi xoá.</span>
                  <button
                    onClick={() => void remove(s.key, deleting.moveTo)}
                    disabled={busy}
                    className="rounded bg-red-500/80 px-2.5 py-1 font-bold text-white hover:bg-red-500 disabled:opacity-40"
                  >
                    Chuyển &amp; xoá
                  </button>
                  <button onClick={() => setDeleting(null)} className="text-white/50 hover:text-white">Huỷ</button>
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <input
              value={newLabel}
              maxLength={40}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void add(); }}
              placeholder="Tên status mới, vd: Final Round"
              className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
            />
            <button
              onClick={() => void add()}
              disabled={!newLabel.trim() || busy}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/70 hover:border-white/30 hover:text-white disabled:opacity-40"
            >
              + Thêm
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
          <p className="text-xs text-red-400">{error}</p>
          <div className="flex gap-2">
            <button onClick={close} className="rounded-lg px-3 py-2 text-xs text-white/50 hover:text-white">Đóng</button>
            <button
              onClick={() => void save()}
              disabled={!dirty || busy}
              className="rounded-lg bg-[#f59e0b] px-4 py-2 text-xs font-black uppercase tracking-wider text-black hover:bg-amber-400 disabled:opacity-40"
            >
              {busy ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
