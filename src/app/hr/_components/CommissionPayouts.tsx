"use client";

// Tab Hoa hồng — mục "Khoản": lọc, tổng, duyệt / huỷ / đã chuyển khoản / sửa từng khoản.

import { useMemo, useState } from "react";
import { filterPayouts, beneficiaryKey, type PayoutStatus } from "@/lib/referral-commission";
import { hrFetch, useHrSession } from "./HrSession";
import { callJson, inputCls, kindText, money, warnCls, type PayoutView, type ReferrerView } from "./CommissionShared";

const STATUS_LABEL: Record<PayoutStatus, string> = {
  upcoming: "Sắp tới",
  due: "Đến hạn",
  approved: "Chờ trả",
  paid: "Đã trả",
  cancelled: "Đã huỷ",
};
const STATUS_CLS: Record<PayoutStatus, string> = {
  upcoming: "text-white/60",
  due: "text-amber-300",
  approved: "text-sky-300",
  paid: "text-emerald-400",
  cancelled: "text-white/35",
};
const ALL: PayoutStatus[] = ["upcoming", "due", "approved", "paid", "cancelled"];

function viDate(ymd: string | null) {
  return ymd ? `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}/${ymd.slice(0, 4)}` : "";
}

type Open = { id: string; kind: "pay" | "edit" | "cancel" } | null;

export default function CommissionPayouts({
  payouts,
  referrers,
  today,
  onPayout,
}: {
  payouts: PayoutView[];
  referrers: ReferrerView[];
  today: string;
  onPayout: (p: PayoutView) => void;
}) {
  const { can, me } = useHrSession();
  const isBoss = me?.role === "boss";
  const canManage = can("referrals.manage");
  const canPay = can("referrals.pay");
  const [statuses, setStatuses] = useState<PayoutStatus[]>(["due", "approved"]);
  const [who, setWho] = useState("");
  const [jobId, setJobId] = useState("");
  const [month, setMonth] = useState("");
  const [open, setOpen] = useState<Open>(null);
  const [busy, setBusy] = useState("");
  const [rowErr, setRowErr] = useState<Record<string, string>>({});
  // Ô nhập của form đang mở
  const [fDate, setFDate] = useState(today);
  const [fAmount, setFAmount] = useState("");
  const [fDue, setFDue] = useState("");
  const [fNote, setFNote] = useState("");
  const [fReason, setFReason] = useState("");

  const beneficiaries = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of payouts) m.set(beneficiaryKey(p), p.beneficiary_name);
    for (const r of referrers) m.set(r.id, r.name);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "vi"));
  }, [payouts, referrers]);
  const jobs = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of payouts) if (p.job_id) m.set(p.job_id, p.job_title || p.job_id);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "vi"));
  }, [payouts]);

  const { rows, total } = filterPayouts(payouts, {
    statuses,
    beneficiaryKey: who || null,
    jobId: jobId || null,
    month: /^\d{4}-\d{2}$/.test(month) ? month : null,
  });

  function openForm(p: PayoutView, kind: "pay" | "edit" | "cancel") {
    setOpen({ id: p.id, kind });
    setFDate(today);
    setFAmount(p.amount === null ? "" : String(p.amount));
    setFDue(p.due_date ?? "");
    setFNote(p.note);
    setFReason("");
    setRowErr((e) => ({ ...e, [p.id]: "" }));
  }

  async function send(p: PayoutView, body: Record<string, unknown>) {
    setBusy(p.id);
    setRowErr((e) => ({ ...e, [p.id]: "" }));
    const r = await callJson(hrFetch, `/api/hr/referrals/payouts/${p.id}`, "PATCH", body);
    setBusy("");
    if (!r.ok) {
      setRowErr((e) => ({ ...e, [p.id]: r.error }));
      return;
    }
    onPayout(r.data.payout as PayoutView);
    setOpen(null);
  }

  function submitEdit(p: PayoutView) {
    const body: Record<string, unknown> = { action: "edit" };
    if (p.status === "paid") {
      if (fNote !== p.note) body.note = fNote;
    } else {
      if (fAmount.trim() !== "" && Number(fAmount) !== p.amount) body.amount = Number(fAmount);
      if ((fDue || null) !== p.due_date) body.due_date = fDue || null;
      if (fNote !== p.note) body.note = fNote;
    }
    if (Object.keys(body).length === 1) {
      setOpen(null);
      return;
    }
    void send(p, body);
  }

  const toggle = (s: PayoutStatus) => setStatuses((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {ALL.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={statuses.includes(s)}
            onClick={() => toggle(s)}
            className={`rounded-full border px-3 py-1 text-[12px] ${statuses.includes(s) ? "border-amber-500/60 bg-amber-500/15 text-amber-200" : "border-white/15 text-white/50"}`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
        <select className={inputCls} value={who} onChange={(e) => setWho(e.target.value)} aria-label="Người giới thiệu">
          <option value="">Mọi người giới thiệu</option>
          {beneficiaries.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
        </select>
        <select className={inputCls} value={jobId} onChange={(e) => setJobId(e.target.value)} aria-label="Job">
          <option value="">Mọi job</option>
          {jobs.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
        </select>
        <input className={`${inputCls} w-32`} value={month} onChange={(e) => setMonth(e.target.value.trim())} placeholder="YYYY-MM" aria-label="Tháng đến hạn" maxLength={7} />
      </div>
      <p className="text-[13px] text-white/70">
        {rows.length} khoản · Tổng <strong className="text-white">{money(total)}</strong>
      </p>

      <div className="hr-group overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-white/40">
              <th className="px-4 py-2 font-bold">Người giới thiệu</th>
              <th className="px-2 py-2 font-bold">Ứng viên</th>
              <th className="px-2 py-2 font-bold">Job</th>
              <th className="px-2 py-2 font-bold">Mốc</th>
              <th className="px-2 py-2 font-bold">Số tiền</th>
              <th className="px-2 py-2 font-bold">Đến hạn</th>
              <th className="px-2 py-2 font-bold">Trạng thái</th>
              <th className="px-4 py-2 text-right font-bold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-white/50">Không có khoản nào khớp bộ lọc.</td></tr>
            )}
            {rows.map((p) => {
              const att = p.needs_attention;
              const selfLock = p.is_self && !isBoss; // khoản của chính mình: nhờ Sếp duyệt/sửa/trả
              const canApprove = canManage && !selfLock && p.status === "due" && !att && p.amount !== null;
              const canCancel = canManage && p.status !== "paid" && p.status !== "cancelled";
              const canPayNow = canPay && !selfLock && p.status === "approved" && !att;
              const canEdit = canPay && !selfLock && p.status !== "cancelled";
              const isOpen = open?.id === p.id;
              return (
                <tr key={p.id} className="border-t border-white/10 align-top" data-testid={`payout-${p.id}`}>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-white/90">{p.beneficiary_name}</div>
                    <div className="text-[11px] text-white/40">{kindText(p.beneficiary_kind)}</div>
                  </td>
                  <td className="px-2 py-2.5 text-white/80">{p.candidate_name}</td>
                  <td className="px-2 py-2.5 text-white/60">{p.job_title || "—"}</td>
                  <td className="px-2 py-2.5 text-white/70">{p.label}</td>
                  <td className="px-2 py-2.5">
                    {p.amount_issue === "no_rule" ? (
                      <span className="text-amber-300">Chưa đặt mức</span>
                    ) : p.amount_issue === "no_salary" ? (
                      <span className="text-amber-300">Thiếu lương</span>
                    ) : p.amount === null ? (
                      "—"
                    ) : (
                      money(p.amount)
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-white/70">
                    {p.due_date ? (
                      <>
                        {viDate(p.due_date)}
                        {p.due_estimated && <span className="ml-1 text-[11px] text-white/40">(dự kiến)</span>}
                      </>
                    ) : (
                      <span className="text-white/40">chưa có ngày</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className={`font-semibold ${STATUS_CLS[p.status]}`}>{STATUS_LABEL[p.status]}</div>
                    {p.status === "paid" && p.paid_date && <div className="text-[11px] text-white/40">{viDate(p.paid_date)}</div>}
                    {p.status === "cancelled" && p.cancel_reason && <div className="max-w-[180px] text-[11px] text-white/40">{p.cancel_reason}</div>}
                    {att && <div className={`mt-1 ${warnCls}`}>Offer đã đổi — cần xử lý tay</div>}
                    {p.status === "approved" && p.bank_changed_recent && (
                      <div className={`mt-1 ${warnCls}`}>TK nhận tiền vừa đổi bởi {p.bank_changed_by ?? "ai đó"} — kiểm tra trước khi chuyển</div>
                    )}
                    {selfLock && p.status !== "paid" && p.status !== "cancelled" && (
                      <div className="mt-1 max-w-[180px] text-[11px] text-white/45">Khoản của bạn — nhờ Sếp duyệt/trả</div>
                    )}
                    {p.note && <div className="mt-1 max-w-[180px] text-[11px] text-white/45">{p.note}</div>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {canApprove && (
                        <button type="button" disabled={busy === p.id} className="hr-primary-btn h-8 px-3 text-[12px] font-semibold" onClick={() => void send(p, { action: "approve" })}>
                          Xác nhận còn làm
                        </button>
                      )}
                      {canPayNow && (
                        <button type="button" className="hr-primary-btn h-8 px-3 text-[12px] font-semibold" onClick={() => openForm(p, "pay")}>
                          Đã chuyển khoản
                        </button>
                      )}
                      {canEdit && (
                        <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" onClick={() => openForm(p, "edit")}>
                          Sửa
                        </button>
                      )}
                      {canCancel && (
                        <button type="button" className="hr-secondary-btn hr-secondary-btn--sm text-red-400" onClick={() => openForm(p, "cancel")}>
                          Huỷ (UV đã nghỉ)
                        </button>
                      )}
                    </div>
                    {isOpen && open?.kind === "pay" && (
                      <div className="mt-2 space-y-2 text-right">
                        {p.bank_changed_recent && (
                          <p className={warnCls}>TK nhận tiền vừa đổi bởi {p.bank_changed_by ?? "ai đó"} — kiểm tra trước khi chuyển</p>
                        )}
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <label className="text-[12px] text-white/60">Ngày chuyển <input type="date" className={inputCls} value={fDate} max={today} onChange={(e) => setFDate(e.target.value)} /></label>
                          <button type="button" disabled={busy === p.id || !fDate} className="hr-primary-btn h-8 px-3 text-[12px] font-semibold" onClick={() => void send(p, { action: "pay", paid_date: fDate })}>Xác nhận</button>
                          <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" onClick={() => setOpen(null)}>Đóng</button>
                        </div>
                      </div>
                    )}
                    {isOpen && open?.kind === "cancel" && (
                      <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                        <input className={`${inputCls} w-52`} value={fReason} maxLength={500} onChange={(e) => setFReason(e.target.value)} placeholder="Lý do huỷ (bắt buộc)" aria-label="Lý do huỷ" />
                        <button type="button" disabled={busy === p.id || !fReason.trim()} className="hr-primary-btn h-8 px-3 text-[12px] font-semibold" onClick={() => void send(p, { action: "cancel", reason: fReason.trim() })}>Huỷ khoản</button>
                        <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" onClick={() => setOpen(null)}>Đóng</button>
                      </div>
                    )}
                    {isOpen && open?.kind === "edit" && (
                      <div className="mt-2 space-y-2 text-right">
                        {p.status === "paid" ? (
                          <p className="text-[12px] text-white/50">Khoản đã trả chỉ sửa được ghi chú.</p>
                        ) : (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <label className="text-[12px] text-white/60">Số tiền <input className={`${inputCls} w-32`} inputMode="numeric" value={fAmount} onChange={(e) => setFAmount(e.target.value.replace(/[^\d]/g, ""))} /></label>
                            <label className="text-[12px] text-white/60">Hạn <input type="date" className={inputCls} value={fDue} onChange={(e) => setFDue(e.target.value)} /></label>
                            {p.status === "approved" && !isBoss && (
                              <span className="w-full text-[11px] text-white/45">Sửa số tiền sẽ đưa khoản về Chờ xác nhận (HR duyệt lại).</span>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <input className={`${inputCls} w-64`} value={fNote} maxLength={1000} onChange={(e) => setFNote(e.target.value)} placeholder="Ghi chú" aria-label="Ghi chú" />
                          <button type="button" disabled={busy === p.id} className="hr-primary-btn h-8 px-3 text-[12px] font-semibold" onClick={() => submitEdit(p)}>Lưu</button>
                          <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" onClick={() => setOpen(null)}>Đóng</button>
                        </div>
                      </div>
                    )}
                    {rowErr[p.id] && <p role="alert" className="mt-1 text-right text-[12px] text-red-400">{rowErr[p.id]}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
