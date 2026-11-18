"use client";

/**
 * Tab Mẫu mail → "Checklist onboard": sửa mẫu checklist (thêm/xoá/đổi thứ tự, giai đoạn, cờ Leader).
 * Mẫu chỉ áp cho người onboard sau — checklist của người đang onboard đã chép riêng, không đổi.
 */

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Save, Trash2, Undo2 } from "lucide-react";
import { hrFetch } from "./HrSession";
import { ONBOARD_STAGES, STAGE_LABEL, type OnboardStage, type OnboardTemplateItem } from "@/lib/hr-onboarding";

type Loaded = { items: OnboardTemplateItem[]; saved: boolean; builtin: OnboardTemplateItem[] };

const MAX_ITEMS = 30;
const surface = "rounded-2xl bg-[var(--hr-raised)] shadow-[var(--hr-surface-shadow)] ring-1 ring-[var(--hr-hair)]";
const inputBase =
  "rounded-lg bg-[var(--hr-fill)] px-3 py-2 text-[14px] text-[var(--hr-ink)] ring-1 ring-[var(--hr-hair)] placeholder:text-[var(--hr-ink-3)] focus:outline-none focus:ring-2 focus:ring-[var(--hr-orange)]";
const iconBtn =
  "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--hr-ink-3)] hover:bg-[var(--hr-fill)] hover:text-[var(--hr-ink)] disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--hr-orange)]";
const addBtn =
  "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-[var(--hr-orange-ink)] hover:bg-[var(--hr-fill)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--hr-orange)]";

export default function OnboardingTemplatePanel({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [items, setItems] = useState<OnboardTemplateItem[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const accept = useCallback((j: Loaded) => {
    setLoaded(j);
    setItems(j.items);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await hrFetch("/api/hr/onboarding-template");
      const j = (await res.json().catch(() => ({}))) as Loaded & { error?: string };
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      accept(j);
      setLoadError("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Không tải được mẫu checklist");
    }
  }, [accept]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const dirty = !!loaded && !!items && JSON.stringify(items) !== JSON.stringify(loaded.items);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  async function send(init: RequestInit, okText: string) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await hrFetch("/api/hr/onboarding-template", init);
      const j = (await res.json().catch(() => ({}))) as Partial<Loaded> & { error?: string };
      if (!res.ok || !j.items) {
        setNotice({ kind: "error", text: j.error ?? `HTTP ${res.status}` });
        return;
      }
      accept(j as Loaded);
      setNotice({ kind: "ok", text: okText });
    } catch {
      setNotice({ kind: "error", text: "Không kết nối được máy chủ" });
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    items &&
    send(
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: items.map((x) => ({ ...x, label: x.label.trim() })) }),
      },
      "Đã lưu mẫu checklist",
    );

  function resetDefault() {
    if (!confirm("Đưa checklist onboard về mẫu mặc định? Các mục đã sửa sẽ mất.")) return;
    void send({ method: "DELETE" }, "Đã về mẫu mặc định");
  }

  if (loadError) return <p className="text-[13px] text-[var(--hr-danger-ink)]">{loadError}</p>;
  if (!loaded || !items) return <p className="py-16 text-center text-sm text-[var(--hr-ink-3)]">Đang tải mẫu checklist…</p>;

  const set = (i: number, patch: Partial<OnboardTemplateItem>) => {
    setNotice(null);
    setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    setNotice(null);
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  const add = () => {
    setNotice(null);
    setItems([...items, { id: crypto.randomUUID(), label: "", stage: items[items.length - 1]?.stage ?? "before", leader: false }]);
  };

  const emptyLabel = items.some((x) => !x.label.trim());
  const status =
    notice?.text ??
    (dirty
      ? emptyLabel
        ? "Có mục chưa đặt tên"
        : "Có thay đổi chưa lưu"
      : loaded.saved
        ? "Mẫu công ty đã lưu"
        : "Đang dùng mẫu mặc định");

  return (
    <section className={`${surface} flex flex-col overflow-hidden`} aria-label="Sửa mẫu checklist onboard">
      <div className="border-b border-[var(--hr-hair)] px-5 py-3">
        <p className="text-[15px] font-semibold text-[var(--hr-ink)]">Checklist onboard</p>
        <p className="text-[12.5px] text-[var(--hr-ink-2)]">Sửa mẫu chỉ áp cho người onboard sau, không đổi người đang onboard.</p>
      </div>

      <ol className="divide-y divide-[var(--hr-hair)]">
        {items.map((it, i) => (
          <li key={it.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5 sm:flex-nowrap sm:px-5">
            <span className="w-5 shrink-0 text-right text-[12px] tabular-nums text-[var(--hr-ink-3)]">{i + 1}</span>
            <input
              aria-label={`Tên mục ${i + 1}`}
              className={`${inputBase} min-w-0 flex-1 basis-[calc(100%-2rem)] sm:basis-auto`}
              maxLength={200}
              value={it.label}
              placeholder="Việc cần làm…"
              onChange={(e) => set(i, { label: e.target.value })}
            />
            <select
              aria-label={`Giai đoạn mục ${i + 1}`}
              className={`${inputBase} ml-7 shrink-0 py-1.5 sm:ml-0`}
              value={it.stage}
              onChange={(e) => set(i, { stage: e.target.value as OnboardStage })}
            >
              {ONBOARD_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
            <label className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] text-[var(--hr-ink-2)]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hr-orange)]"
                checked={it.leader}
                onChange={(e) => set(i, { leader: e.target.checked })}
              />
              Leader tích được
            </label>
            <div className="ml-auto flex shrink-0 items-center">
              <button type="button" className={iconBtn} aria-label={`Đưa mục ${i + 1} lên`} title="Lên" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={iconBtn}
                aria-label={`Đưa mục ${i + 1} xuống`}
                title="Xuống"
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`${iconBtn} hover:text-[var(--hr-danger-ink)]`}
                aria-label={`Xoá mục ${i + 1}`}
                title="Xoá"
                disabled={items.length <= 1}
                onClick={() => {
                  setNotice(null);
                  setItems(items.filter((_, j) => j !== i));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ol>

      {items.length < MAX_ITEMS && (
        <div className="border-t border-[var(--hr-hair)] px-4 py-2 sm:px-5">
          <button type="button" className={addBtn} onClick={add}>
            <Plus className="h-3.5 w-3.5" /> Thêm mục
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hr-hair)] px-5 py-3">
        <p
          role="status"
          className={`min-w-0 flex-1 truncate text-[12.5px] ${
            notice?.kind === "error" ? "text-[var(--hr-danger-ink)]" : notice || dirty ? "text-[var(--hr-orange-ink)]" : "text-[var(--hr-ink-2)]"
          }`}
          title={status}
        >
          {status}
        </p>
        <div className="flex items-center gap-1.5">
          {loaded.saved && (
            <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" disabled={busy} onClick={resetDefault} title="Xoá mẫu đã sửa, dùng lại checklist mặc định">
              <RotateCcw className="mr-1 inline h-3.5 w-3.5" /> Về mặc định
            </button>
          )}
          {dirty && (
            <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" disabled={busy} onClick={() => setItems(loaded.items)}>
              <Undo2 className="mr-1 inline h-3.5 w-3.5" /> Huỷ
            </button>
          )}
          <button type="button" className="hr-primary-btn hr-primary-btn--sm" disabled={busy || !dirty || emptyLabel} onClick={() => void save()}>
            <Save className="mr-1 inline h-3.5 w-3.5" /> {busy ? "Đang lưu…" : "Lưu mẫu"}
          </button>
        </div>
      </div>
    </section>
  );
}
