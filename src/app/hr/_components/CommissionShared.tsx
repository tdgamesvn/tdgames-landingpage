"use client";

// Dùng chung cho tab Hoa hồng: kiểu dữ liệu API, định dạng tiền, ô nhập quy tắc (RuleEditor).

import { useState } from "react";
import { parseRule, type AmountIssue, type CommissionKind, type CommissionRule, type PayoutStatus } from "@/lib/referral-commission";
import { formatVnd } from "@/lib/offer-letter";

export const inputCls = "rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[13px] text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50";
export const warnCls = "rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[12px] text-amber-300";

export type PayoutView = {
  id: string;
  application_id: string;
  referrer_id: string | null;
  hr_user_id: string | null;
  beneficiary_name: string;
  beneficiary_kind: CommissionKind | null;
  job_id: string | null;
  job_title: string;
  candidate_name: string;
  label: string;
  milestone_months: number;
  amount: number | null;
  amount_issue: AmountIssue | null;
  due_date: string | null;
  due_estimated: boolean;
  status: PayoutStatus;
  paid_date: string | null;
  cancel_reason: string | null;
  note: string;
  bank_changed_recent: boolean;
  bank_changed_by: string | null;
  needs_attention: boolean;
  /** Người đang xem là người hưởng khoản này (server tính) — không phải Sếp thì không duyệt/sửa/trả. */
  is_self: boolean;
};

export type ReferrerView = {
  id: string;
  name: string;
  kind: CommissionKind | null;
  ref_codes: string[];
  hr_user_id: string | null;
  active: boolean;
  rule: CommissionRule | null;
  phone: string;
  email: string;
  bank_info: string;
  note: string;
  totals: { paid: number; outstanding: number };
};

export const KIND_LABEL: Record<CommissionKind, string> = { internal: "Nội bộ", external: "Headhunter" };
export const kindText = (k: CommissionKind | null) => (k ? KIND_LABEL[k] : "Chưa phân loại");

export const money = (n: number) => formatVnd(n);

export type NeedsManualItem = { application_id: string; candidate_name: string; reason: string | null };

type Fetcher = (u: string, i?: RequestInit) => Promise<Response>;

/** Gọi API, trả { ok, data, error } — lỗi (kể cả 403/409) là chuỗi server trả nguyên văn. */
export async function callJson(
  hrFetch: Fetcher,
  url: string,
  method: string,
  body?: unknown,
): Promise<{ ok: boolean; data: Record<string, unknown>; error: string }> {
  try {
    const res = await hrFetch(url, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, data, error: res.ok ? "" : String(data.error ?? `HTTP ${res.status}`) };
  } catch {
    return { ok: false, data: {}, error: "Không kết nối được máy chủ" };
  }
}

type Draft = {
  type: "fixed" | "salary_multiple";
  vnd: string;
  multiple: string;
  steps: { months: string; percent: string }[];
};

function toDraft(v: CommissionRule | null): Draft {
  return {
    type: v?.amount.type ?? "fixed",
    vnd: v?.amount.type === "fixed" ? String(v.amount.vnd) : "",
    multiple: v?.amount.type === "salary_multiple" ? String(v.amount.multiple) : "",
    steps: (v?.schedule ?? [{ months: 1, percent: 50 }, { months: 2, percent: 50 }]).map((s) => ({ months: String(s.months), percent: String(s.percent) })),
  };
}

function draftToRaw(d: Draft) {
  const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
  return {
    amount: d.type === "fixed" ? { type: "fixed", vnd: num(d.vnd) } : { type: "salary_multiple", multiple: num(d.multiple) },
    schedule: d.steps.map((s) => ({ months: num(s.months), percent: num(s.percent) })),
  };
}

/**
 * Quy tắc hoa hồng: cố định VND | hệ số lương + danh sách mốc {tháng, %}. Báo lỗi parseRule tại chỗ.
 * Hợp lệ → onChange(rule). Không hợp lệ → không gọi onChange, gọi onInvalid(lỗi) để nơi lưu chặn nút Lưu.
 * Giá trị khởi tạo đọc 1 lần (đổi `key` ở nơi dùng để nạp lại).
 */
export function RuleEditor(p: {
  value: CommissionRule | null;
  onChange: (v: CommissionRule | null) => void;
  allowEmpty: boolean;
  disabled?: boolean;
  emptyLabel?: string;
  onInvalid?: (msg: string | null) => void;
}) {
  const [enabled, setEnabled] = useState(p.value !== null || !p.allowEmpty);
  const [d, setD] = useState<Draft>(() => toDraft(p.value));
  const [err, setErr] = useState("");

  function emit(nextEnabled: boolean, nd: Draft) {
    if (!nextEnabled) {
      setErr("");
      p.onInvalid?.(null);
      p.onChange(null);
      return;
    }
    const r = parseRule(draftToRaw(nd));
    if ("error" in r) {
      setErr(r.error);
      p.onInvalid?.(r.error);
      return;
    }
    setErr("");
    p.onInvalid?.(null);
    p.onChange(r);
  }
  const upd = (nd: Draft) => {
    setD(nd);
    emit(enabled, nd);
  };
  const dis = p.disabled;
  const setStep = (i: number, k: "months" | "percent", v: string) =>
    upd({ ...d, steps: d.steps.map((x, j) => (j === i ? { ...x, [k]: v.replace(/[^\d]/g, "") } : x)) });

  return (
    <div className="space-y-2">
      {p.allowEmpty && (
        <label className="flex items-center gap-2 text-[13px] text-white/70">
          <input
            type="checkbox"
            className="h-4 w-4 accent-amber-500"
            checked={enabled}
            disabled={dis}
            onChange={(e) => {
              setEnabled(e.target.checked);
              emit(e.target.checked, d);
            }}
          />
          {enabled ? "Đặt mức riêng" : (p.emptyLabel ?? "Chưa đặt")}
        </label>
      )}
      {enabled && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <select className={inputCls} disabled={dis} value={d.type} onChange={(e) => upd({ ...d, type: e.target.value as Draft["type"] })} aria-label="Cách tính">
              <option value="fixed">Số tiền cố định</option>
              <option value="salary_multiple">Hệ số lương</option>
            </select>
            {d.type === "fixed" ? (
              <label className="flex items-center gap-1.5 text-[13px] text-white/60">
                <input className={`${inputCls} w-36`} inputMode="numeric" disabled={dis} value={d.vnd} onChange={(e) => upd({ ...d, vnd: e.target.value.replace(/[^\d]/g, "") })} placeholder="2000000" aria-label="Số tiền VND" />
                {d.vnd && Number(d.vnd) > 0 ? <span className="text-white/40">= {money(Number(d.vnd))}</span> : "VND"}
              </label>
            ) : (
              <label className="flex items-center gap-1.5 text-[13px] text-white/60">
                <input className={`${inputCls} w-24`} inputMode="decimal" disabled={dis} value={d.multiple} onChange={(e) => upd({ ...d, multiple: e.target.value.replace(",", ".") })} placeholder="0.5" aria-label="Hệ số lương" />
                × lương tháng
              </label>
            )}
          </div>
          <div className="space-y-1.5">
            {d.steps.map((s, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-[13px] text-white/60">
                <span className="w-10 text-white/40">Mốc {i + 1}</span>
                <input className={`${inputCls} w-16`} inputMode="numeric" disabled={dis} value={s.months} aria-label={`Tháng mốc ${i + 1}`} onChange={(e) => setStep(i, "months", e.target.value)} />
                tháng sau khi đi làm ·
                <input className={`${inputCls} w-16`} inputMode="numeric" disabled={dis} value={s.percent} aria-label={`Phần trăm mốc ${i + 1}`} onChange={(e) => setStep(i, "percent", e.target.value)} />
                %
                {d.steps.length > 1 && !dis && (
                  <button type="button" className="text-[12px] text-red-400 hover:underline" onClick={() => upd({ ...d, steps: d.steps.filter((_, j) => j !== i) })}>
                    Xoá
                  </button>
                )}
              </div>
            ))}
            {!dis && d.steps.length < 6 && (
              <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" onClick={() => upd({ ...d, steps: [...d.steps, { months: "", percent: "" }] })}>
                + Thêm mốc
              </button>
            )}
          </div>
          {err && <p role="alert" className="text-[12px] text-red-400">{err}</p>}
        </>
      )}
    </div>
  );
}
