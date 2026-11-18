"use client";

/**
 * Khối "Onboard" trong hồ sơ (ngay sau khối Offer): ngày đi làm + checklist 3 giai đoạn.
 * Chỉ hồ sơ đã nhận offer (không phải freelancer) và người có onboard.view. Mỗi lần tải/tích
 * → `onProgress` để badge trên thẻ ứng viên cập nhật ngay.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Application } from "@/app/admin/_lib/types";
import { hrFetch, useHrSession } from "./HrSession";
import {
  ONBOARD_STAGES,
  STAGE_LABEL,
  isOnboardingEligible,
  onboardingCardState,
  type OnboardItem,
  type OnboardReminded,
} from "@/lib/hr-onboarding";
import { formatDateVi, vnDateString } from "@/lib/offer-letter";

type Payload = {
  eligible: true;
  start: { date: string | null; confirmed: boolean };
  items: OnboardItem[];
  progress: { done: number; total: number };
  reminded: OnboardReminded;
  can: { edit: boolean; tickIds: string[] };
};
type Summary = Application["onboarding"];

const inputCls =
  "rounded-lg bg-[var(--hr-fill)] px-3 py-1.5 text-[13px] text-[var(--hr-ink)] ring-1 ring-[var(--hr-hair)] focus:outline-none focus:ring-2 focus:ring-[var(--hr-orange)] disabled:opacity-50";
const CONFLICT_TEXT = "Vừa có người khác cập nhật, đã tải lại";

/** "10:12 20/11" theo giờ Việt Nam. */
function doneTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const vn = new Date(d.getTime() + 7 * 3_600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(vn.getUTCHours())}:${p(vn.getUTCMinutes())} ${p(vn.getUTCDate())}/${p(vn.getUTCMonth() + 1)}`;
}

function summaryOf(p: Payload): NonNullable<Summary> {
  return { start_date: p.start.date, confirmed: p.start.confirmed, done: p.progress.done, total: p.progress.total };
}

function sameSummary(a: Summary | undefined, b: Summary): boolean {
  if (!a || !b) return !a && !b;
  return a.start_date === b.start_date && a.confirmed === b.confirmed && a.done === b.done && a.total === b.total;
}

/** Ô ngày hợp lệ để lưu: đủ YYYY-MM-DD, năm ≥ 2020. */
const validDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number(v.slice(0, 4)) >= 2020;

export default function OnboardingSection({
  app,
  onProgress,
}: {
  app: Application;
  onProgress: (o: Application["onboarding"]) => void;
}) {
  const { can } = useHrSession();
  const canView = can("onboard.view");
  const eligible = isOnboardingEligible({ offer_status: app.offer_status ?? null, work_type: app.work_type ?? null });
  const [data, setData] = useState<Payload | null>(null);
  // Hồ sơ mà `data` thuộc về — đổi hồ sơ / mất điều kiện thì không hiện dữ liệu cũ.
  const [dataFor, setDataFor] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [dateVal, setDateVal] = useState<string | null>(null);

  // onProgress / tóm tắt hiện tại đọc qua ref để effect tải không chạy lại khi chúng đổi.
  const progressRef = useRef(onProgress);
  const summaryRef = useRef<Summary | undefined>(app.onboarding);
  const seq = useRef(0);
  const dataRef = useRef<Payload | null>(null);
  useEffect(() => {
    progressRef.current = onProgress;
    summaryRef.current = app.onboarding;
  });

  const report = useCallback((s: Summary) => {
    if (!sameSummary(summaryRef.current, s)) {
      summaryRef.current = s;
      progressRef.current(s);
    }
  }, []);

  const apply = useCallback(
    (j: Record<string, unknown>) => {
      if (j.eligible !== true) {
        setHidden(true);
        setData(null);
        report(null);
        return;
      }
      const p = j as unknown as Payload;
      setHidden(false);
      setData(p);
      dataRef.current = p;
      setDataFor(app.id);
      setDateVal(null);
      report(summaryOf(p));
    },
    [app.id, report],
  );

  const load = useCallback(async () => {
    const my = ++seq.current;
    try {
      const res = await hrFetch(`/api/hr/applications/${app.id}/onboarding`);
      const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (my !== seq.current) return;
      if (!res.ok) {
        // 404 = hồ sơ ngoài phạm vi → ẩn khối.
        if (res.status === 404 || res.status === 403) setHidden(true);
        else setLoadError(String(j.error ?? `HTTP ${res.status}`));
        return;
      }
      setLoadError("");
      apply(j);
    } catch {
      if (my === seq.current) setLoadError("Không kết nối được máy chủ");
    }
  }, [app.id, apply]);

  // Tải khi mở hồ sơ và mỗi khi kết quả offer đổi (vừa "Đã nhận" → hiện khối).
  useEffect(() => {
    if (!canView) return;
    if (!eligible) {
      seq.current++;
      if (summaryRef.current) {
        summaryRef.current = null;
        progressRef.current(null);
      }
      return;
    }
    void Promise.resolve().then(load);
  }, [canView, eligible, app.offer_status, load]);

  // Ngày đi làm đổi từ nơi khác (khối Hoa hồng) → app.onboarding khác dữ liệu đang hiện → tải lại.
  // Tự sửa ở đây thì apply() đã đặt dataRef khớp nên không tải lại (không lặp).
  const sumDate = app.onboarding?.start_date;
  const sumConfirmed = app.onboarding?.confirmed;
  useEffect(() => {
    const cur = dataRef.current;
    if (!canView || !eligible || sumDate === undefined || !cur) return;
    if (cur.start.date !== sumDate || cur.start.confirmed !== sumConfirmed) void Promise.resolve().then(load);
  }, [canView, eligible, sumDate, sumConfirmed, load]);

  async function patch(body: Record<string, unknown>, itemId: string | null) {
    setPending(itemId ?? "date");
    setError("");
    setNotice("");
    const my = ++seq.current;
    try {
      const res = await hrFetch(`/api/hr/applications/${app.id}/onboarding`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        if (res.status === 409) {
          await load();
          setNotice(CONFLICT_TEXT);
          return;
        }
        setError(String(j.error ?? `HTTP ${res.status}`));
        return;
      }
      if (my === seq.current) apply(j);
    } catch {
      setError("Không kết nối được máy chủ");
    } finally {
      setPending(null);
    }
  }

  if (!canView || !eligible || hidden) return null;
  const shown = dataFor === app.id ? data : null;

  if (!shown) {
    return (
      <section className="space-y-2" aria-label="Onboard">
        <h4 className="hr-section-title px-1">Onboard</h4>
        <div className="hr-group px-4 py-3">
          <p className={`text-[13px] ${loadError ? "text-[var(--hr-danger-ink)]" : "text-[var(--hr-ink-2)]"}`} role={loadError ? "alert" : undefined}>
            {loadError || "Đang tải…"}
          </p>
        </div>
      </section>
    );
  }

  const today = vnDateString(new Date());
  const state = onboardingCardState({ startDate: shown.start.date, items: shown.items, todayVn: today });
  const tick = new Set(shown.can.tickIds);
  const savedDate = shown.start.date ?? "";
  const dateInput = dateVal ?? savedDate;
  const dateDirty = dateInput !== savedDate;
  const busy = pending !== null;

  return (
    <section className="space-y-2" aria-label="Onboard">
      <h4 className="hr-section-title px-1">Onboard</h4>
      <div className="hr-group space-y-3 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-[13px] text-[var(--hr-ink-2)]">
            Ngày đi làm:{" "}
            {shown.start.date ? (
              <strong className="font-semibold text-[var(--hr-ink)]">{formatDateVi(shown.start.date)}</strong>
            ) : (
              <span>chưa có</span>
            )}
            {shown.start.date && !shown.start.confirmed && (
              <span className="ml-2 rounded-full bg-[var(--hr-fill-2)] px-2 py-0.5 text-[11px] text-[var(--hr-ink-2)]">dự kiến từ thư mời</span>
            )}
          </p>
          <p
            className={`text-[13px] font-semibold ${
              state === "overdue" ? "text-[var(--hr-danger-ink)]" : state === "done" ? "text-green-300" : "text-[var(--hr-ink-2)]"
            }`}
          >
            {state === "done"
              ? "✅ Đã onboard"
              : `${shown.progress.done}/${shown.progress.total} việc${state === "overdue" ? " · đã hết tuần đầu" : ""}`}
          </p>
        </div>

        {shown.can.edit && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-[13px] text-[var(--hr-ink-2)]">
              Sửa ngày đi làm
              <input
                type="date"
                className={inputCls}
                value={dateInput}
                min="2020-01-01"
                disabled={busy}
                onChange={(e) => setDateVal(e.target.value)}
              />
            </label>
            {dateDirty && (
              <button
                type="button"
                className="hr-secondary-btn hr-secondary-btn--sm"
                disabled={busy || !validDate(dateInput)}
                onClick={() => void patch({ start_date: dateInput }, null)}
              >
                {pending === "date" ? "Đang lưu…" : "Lưu"}
              </button>
            )}
            {shown.start.confirmed && (
              <button
                type="button"
                className="hr-secondary-btn hr-secondary-btn--sm"
                disabled={busy}
                title="Bỏ ngày đã sửa, dùng ngày bắt đầu ghi trên thư mời nhận việc"
                onClick={() => void patch({ start_date: null }, null)}
              >
                Về ngày trên thư mời
              </button>
            )}
          </div>
        )}

        {ONBOARD_STAGES.map((stage) => {
          const items = shown.items.filter((x) => x.stage === stage);
          if (items.length === 0) return null;
          return (
            <fieldset key={stage} className="min-w-0 space-y-1 rounded-xl bg-[var(--hr-fill)]/40 px-3 pb-2 pt-1 ring-1 ring-[var(--hr-hair)]">
              <legend className="px-1 text-[13px] font-semibold text-[var(--hr-ink)]">{STAGE_LABEL[stage]}</legend>
              <ul className="space-y-0.5">
                {items.map((it) => {
                  const allowed = tick.has(it.id);
                  const done = it.done_at !== null;
                  const id = `ob-${app.id}-${it.id}`;
                  return (
                    <li key={it.id} className="flex items-start gap-2.5 rounded-lg px-1 py-1.5">
                      <input
                        id={id}
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 accent-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hr-orange)] disabled:cursor-not-allowed"
                        checked={done}
                        disabled={!allowed || busy}
                        title={allowed ? undefined : "Bạn không có quyền tích mục này"}
                        onChange={(e) => void patch({ item_id: it.id, done: e.target.checked }, it.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={id}
                          className={`text-[13.5px] leading-snug ${allowed ? "cursor-pointer" : ""} ${
                            done ? "text-[var(--hr-ink-2)] line-through decoration-[var(--hr-ink-3)]" : "text-[var(--hr-ink)]"
                          }`}
                        >
                          {it.label}
                        </label>
                        {it.leader && (
                          <span className="ml-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 px-1.5 py-px text-[10px] font-bold text-purple-300">
                            Leader
                          </span>
                        )}
                        {pending === it.id ? (
                          <p className="text-[12px] text-[var(--hr-ink-3)]">Đang lưu…</p>
                        ) : (
                          done && (
                            <p className="text-[12px] text-[var(--hr-ink-3)]">
                              {it.done_by_name ?? "—"} · {doneTime(it.done_at!)}
                            </p>
                          )
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          );
        })}

        {notice && <p role="status" className="text-[13px] text-[var(--hr-orange-ink)]">{notice}</p>}
        {error && <p role="alert" className="text-[13px] text-[var(--hr-danger-ink)]">{error}</p>}
      </div>
    </section>
  );
}
