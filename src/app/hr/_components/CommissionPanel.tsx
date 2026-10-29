"use client";

// Tab "Hoa hồng" (khoản / người giới thiệu / cài đặt) + khối chèn vào form job và khối Offer của hồ sơ.
// Khoản → CommissionPayouts, người giới thiệu → CommissionReferrers, dùng chung → CommissionShared.

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_RULES, type CommissionRule, type DefaultRules } from "@/lib/referral-commission";
import { formatVnd } from "@/lib/offer-letter";
import { hrFetch, useHrSession } from "./HrSession";
import CommissionPayouts from "./CommissionPayouts";
import CommissionReferrers from "./CommissionReferrers";
import { RuleEditor, callJson, inputCls, kindText, warnCls, type NeedsManualItem, type PayoutView, type ReferrerView } from "./CommissionShared";

export { RuleEditor };

type Overview = {
  today: string;
  payouts: PayoutView[];
  referrers: ReferrerView[];
  unknownCodes: { code: string; count: number }[];
  defaults: DefaultRules;
  manual: NeedsManualItem[];
};
type Section = "payouts" | "referrers" | "settings";

export default function CommissionPanel() {
  const { can } = useHrSession();
  const [data, setData] = useState<Overview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [section, setSection] = useState<Section>("payouts");

  const load = useCallback(async () => {
    const r = await callJson(hrFetch, "/api/hr/referrals", "GET");
    if (!r.ok) {
      setLoadError(r.error);
      return;
    }
    setData(r.data as unknown as Overview);
    setLoadError("");
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const onPayout = (p: PayoutView) => setData((d) => (d ? { ...d, payouts: d.payouts.map((x) => (x.id === p.id ? p : x)) } : d));
  // Sau thao tác khoản/người giới thiệu: tổng của người giới thiệu đổi → tải lại.
  const onPayoutAndReload = (p: PayoutView) => {
    onPayout(p);
    void load();
  };

  const tabs: [Section, string][] = [["payouts", "Khoản"], ["referrers", "Người giới thiệu"], ["settings", "Cài đặt"]];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Hoa hồng giới thiệu</h2>
        <div className="hr-segmented" role="group" aria-label="Mục hoa hồng">
          {tabs.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={section === k} onClick={() => setSection(k)}>{label}</button>
          ))}
        </div>
      </div>
      {loadError && (
        <p role="alert" className="text-[13px] text-red-400">
          {loadError}{" "}
          <button type="button" className="underline" onClick={() => void load()}>Thử lại</button>
        </p>
      )}
      {!data && !loadError && <p className="text-[13px] text-white/50">Đang tải…</p>}
      {data && section === "payouts" && data.manual.length > 0 && (
        <div className={warnCls} role="status" data-testid="referral-needs-manual">
          <strong>Cần Sếp/Kế toán xử lý tay ({data.manual.length} hồ sơ):</strong>{" "}
          {data.manual.map((m) => m.candidate_name).join(", ")}
          <div className="mt-0.5 text-[11px] text-amber-200/80">{data.manual[0].reason ?? "Đã có khoản duyệt/đã trả khác quy tắc hiện tại — chưa sinh các mốc còn lại"}</div>
        </div>
      )}
      {data && section === "payouts" && <CommissionPayouts payouts={data.payouts} referrers={data.referrers} today={data.today} onPayout={onPayoutAndReload} />}
      {data && section === "referrers" && <CommissionReferrers referrers={data.referrers} unknownCodes={data.unknownCodes} onReload={load} />}
      {data && section === "settings" && can("referrals.view") && <DefaultsSettings defaults={data.defaults} onSaved={(d) => setData((x) => (x ? { ...x, defaults: d } : x))} />}
    </div>
  );
}

function DefaultsSettings({ defaults, onSaved }: { defaults: DefaultRules; onSaved: (d: DefaultRules) => void }) {
  const canManage = useHrSession().can("referrals.manage");
  const [internal, setInternal] = useState<CommissionRule | null>(defaults.internal);
  const [external, setExternal] = useState<CommissionRule | null>(defaults.external);
  const [invalid, setInvalid] = useState<{ internal: string | null; external: string | null }>({ internal: null, external: null });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await callJson(hrFetch, "/api/hr/referrals/defaults", "PUT", { internal, external });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    onSaved(r.data.defaults as DefaultRules);
    setMsg({ ok: true, text: "Đã lưu mức mặc định. Khoản đã sinh không đổi; dùng \"Tính lại\" ở hồ sơ nếu cần." });
  }

  return (
    <div className="hr-group max-w-2xl space-y-5 px-4 py-4">
      <div>
        <h3 className="mb-2 text-[14px] font-bold text-white">Mặc định công ty — Nội bộ</h3>
        <RuleEditor value={internal} allowEmpty={false} disabled={!canManage} onChange={setInternal} onInvalid={(m) => setInvalid((x) => ({ ...x, internal: m }))} />
        <p className="mt-1 text-[11px] text-white/40">Mặc định ban đầu: {formatVnd(DEFAULT_RULES.internal?.amount.type === "fixed" ? DEFAULT_RULES.internal.amount.vnd : 0)}, chia 2 mốc 50% / 50%.</p>
      </div>
      <div>
        <h3 className="mb-2 text-[14px] font-bold text-white">Mặc định công ty — Freelancer / headhunter</h3>
        <RuleEditor value={external} allowEmpty emptyLabel="chưa đặt mức (khoản hiện “Chưa đặt mức” tới khi job có mức riêng)" disabled={!canManage} onChange={setExternal} onInvalid={(m) => setInvalid((x) => ({ ...x, external: m }))} />
      </div>
      {canManage ? (
        <div className="flex items-center gap-3">
          <button type="button" disabled={busy || !!invalid.internal || !!invalid.external} className="hr-primary-btn h-9 px-4 text-[14px] font-semibold" onClick={() => void save()}>
            {busy ? "Đang lưu…" : "Lưu mặc định"}
          </button>
          {msg && <span role={msg.ok ? "status" : "alert"} className={`text-[13px] ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</span>}
        </div>
      ) : (
        <p className="text-[12px] text-white/45">Chỉ người có quyền quản lý hoa hồng mới sửa được.</p>
      )}
    </div>
  );
}

/** Quy tắc hoa hồng riêng của job (form job). null khi không có quyền xem. */
export function JobRulesFields({ jobId }: { jobId: string | null }) {
  const { can } = useHrSession();
  const canView = can("referrals.view");
  const canManage = can("referrals.manage");
  const [rules, setRules] = useState<{ internal: CommissionRule | null; external: CommissionRule | null } | null>(null);
  const [draft, setDraft] = useState<{ internal: CommissionRule | null; external: CommissionRule | null } | null>(null);
  const [invalid, setInvalid] = useState<{ internal: string | null; external: string | null }>({ internal: null, external: null });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!canView || !jobId) return;
    let alive = true;
    void callJson(hrFetch, `/api/hr/referrals/job-rules/${jobId}`, "GET").then((r) => {
      if (!alive) return;
      if (!r.ok) return setErr(r.error);
      const v = { internal: (r.data.internal as CommissionRule | null) ?? null, external: (r.data.external as CommissionRule | null) ?? null };
      setRules(v);
      setDraft(v);
    });
    return () => {
      alive = false;
    };
  }, [canView, jobId]);

  if (!canView) return null;

  async function save() {
    if (!jobId || !draft) return;
    setBusy(true);
    setErr("");
    setOk(false);
    const r = await callJson(hrFetch, `/api/hr/referrals/job-rules/${jobId}`, "PUT", { internal: draft.internal, external: draft.external });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    setOk(true);
  }

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/40">Hoa hồng giới thiệu của job</h4>
      {!jobId ? (
        <p className="text-[12px] text-white/50">Lưu job trước rồi đặt mức hoa hồng.</p>
      ) : !rules || !draft ? (
        <p className="text-[12px] text-white/50">{err || "Đang tải…"}</p>
      ) : (
        <>
          <div>
            <p className="mb-1 text-[12px] font-semibold text-white/70">Nội bộ</p>
            <RuleEditor value={rules.internal} allowEmpty emptyLabel="dùng mặc định công ty" disabled={!canManage} onChange={(v) => { setOk(false); setDraft((d) => d && { ...d, internal: v }); }} onInvalid={(m) => setInvalid((x) => ({ ...x, internal: m }))} />
          </div>
          <div>
            <p className="mb-1 text-[12px] font-semibold text-white/70">Freelancer / headhunter</p>
            <RuleEditor value={rules.external} allowEmpty emptyLabel="dùng mặc định công ty" disabled={!canManage} onChange={(v) => { setOk(false); setDraft((d) => d && { ...d, external: v }); }} onInvalid={(m) => setInvalid((x) => ({ ...x, external: m }))} />
          </div>
          {canManage && (
            <div className="flex items-center gap-3">
              <button type="button" disabled={busy || !!invalid.internal || !!invalid.external} className="hr-secondary-btn" onClick={() => void save()}>
                {busy ? "Đang lưu…" : "Lưu mức hoa hồng"}
              </button>
              {ok && <span className="text-[12px] text-emerald-400">Đã lưu</span>}
            </div>
          )}
          {err && <p role="alert" className="text-[12px] text-red-400">{err}</p>}
        </>
      )}
    </div>
  );
}

/** Ô ngày chỉ ghi khi bấm "Lưu": đủ YYYY-MM-DD, năm ≥ 2020 (hoặc rỗng để xoá). */
function DateField(p: {
  label: string;
  saved: string;
  hint?: string;
  canEdit: boolean;
  busy: boolean;
  confirmText?: string;
  onSave: (d: string | null) => Promise<void>;
}) {
  const [val, setVal] = useState(p.saved);
  const valid = val === "" || (/^\d{4}-\d{2}-\d{2}$/.test(val) && Number(val.slice(0, 4)) >= 2020);
  const dirty = val !== p.saved;
  return (
    <label className="flex flex-wrap items-center gap-2 text-[13px] text-white/60">
      {p.label}
      <input type="date" className={inputCls} value={val} min="2020-01-01" disabled={!p.canEdit || p.busy} onChange={(e) => setVal(e.target.value)} />
      {p.canEdit && dirty && (
        <button
          type="button"
          disabled={!valid || p.busy}
          className="hr-secondary-btn hr-secondary-btn--sm"
          onClick={() => {
            if (val !== "" && p.confirmText && !confirm(p.confirmText)) return;
            void p.onSave(val || null);
          }}
        >
          Lưu
        </button>
      )}
      {p.hint && <span className="text-[11px] text-white/40">{p.hint}</span>}
    </label>
  );
}

type AppReferral = {
  referred_by: string | null;
  beneficiary: { name: string; kind: "internal" | "external" | null } | null;
  payoutCount: number;
  start: { date: string | null; confirmed: boolean };
  left_date: string | null;
  needs_manual: boolean;
  needs_manual_reason: string | null;
};

/** Khối hoa hồng trong phần Offer của hồ sơ. null khi không có quyền xem / chưa Đã nhận và chưa có khoản. */
export function ReferralOfferBlock({ appId, offerStatus }: { appId: string; offerStatus: string | null }) {
  const { can } = useHrSession();
  const canView = can("referrals.view");
  const canManage = can("referrals.manage");
  const [v, setV] = useState<AppReferral | null>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const apply = (j: Record<string, unknown>) => {
    const a = j as unknown as AppReferral;
    setV(a);
    setCode(null);
  };

  useEffect(() => {
    if (!canView) return;
    let alive = true;
    void callJson(hrFetch, `/api/hr/referrals/applications/${appId}`, "GET").then((r) => {
      if (!alive) return;
      if (!r.ok) return setErr(r.error);
      setErr("");
      apply(r.data);
    });
    return () => {
      alive = false;
    };
  }, [canView, appId, offerStatus]);

  if (!canView || (offerStatus !== "accepted" && !(v && v.payoutCount > 0))) return null;

  async function patch(body: Record<string, unknown>, okText?: string) {
    setBusy(true);
    setErr("");
    setNote(null);
    const r = await callJson(hrFetch, `/api/hr/referrals/applications/${appId}`, "PATCH", body);
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    apply(r.data);
    // needsManual: cờ đã lưu trên hồ sơ → hiện ở khung cảnh báo bên dưới, không báo "thành công".
    if (r.data.needsManual !== true && okText) setNote(okText);
  }


  return (
    <div className="space-y-2 border-t border-white/10 pt-3" data-testid="referral-offer-block">
      <h5 className="text-[12px] font-bold uppercase tracking-wider text-white/45">Hoa hồng giới thiệu</h5>
      {!v ? (
        <p className="text-[13px] text-white/50">{err || "Đang tải…"}</p>
      ) : (
        <>
          <p className="text-[13px] text-white/70">
            Người giới thiệu: {v.beneficiary ? <strong className="text-white/90">{v.beneficiary.name} ({kindText(v.beneficiary.kind)})</strong> : <span className="text-white/45">không có</span>}
            {" · "}Hoa hồng: {v.payoutCount > 0 ? `${v.payoutCount} mốc` : "không có"}
          </p>
          {v.referred_by && <p className="text-[12px] text-white/45">Mã ref trên hồ sơ: <code>{v.referred_by}</code></p>}
          <DateField
            key={`s-${v.start.date}`}
            label="Ngày đi làm thực tế"
            saved={v.start.date ?? ""}
            hint={v.start.confirmed ? undefined : "dự kiến từ thư mời"}
            canEdit={canManage}
            busy={busy}
            onSave={(d) => patch({ start_date: d })}
          />
          <DateField
            key={`l-${v.left_date}`}
            label="Ngày nghỉ việc"
            saved={v.left_date ?? ""}
            canEdit={canManage}
            busy={busy}
            confirmText="Các khoản chưa duyệt có hạn sau ngày nghỉ sẽ bị huỷ — tiếp tục?"
            onSave={(d) => patch({ left_date: d })}
          />
          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-[13px] text-white/60">
                Sửa mã người giới thiệu
                <input className={`${inputCls} w-44 font-mono`} value={code ?? v.referred_by ?? ""} disabled={busy} onChange={(e) => setCode(e.target.value)} placeholder="mã ref" />
              </label>
              {code !== null && code !== (v.referred_by ?? "") && (
                <button type="button" disabled={busy} className="hr-secondary-btn hr-secondary-btn--sm" onClick={() => void patch({ referred_by: code.trim() || null })}>Lưu mã</button>
              )}
              <button
                type="button"
                disabled={busy}
                className="hr-secondary-btn hr-secondary-btn--sm"
                onClick={() => {
                  if (confirm("Các khoản chưa duyệt sẽ được tính lại theo quy tắc hiện tại")) void patch({ recalc: true }, "Đã tính lại các khoản chưa duyệt.");
                }}
              >
                Tính lại
              </button>
            </div>
          )}
          {v.needs_manual && (
            <p role="status" className={warnCls} data-testid="referral-needs-manual-app">
              Cần Sếp/Kế toán xử lý tay: {v.needs_manual_reason ?? "đã có khoản duyệt/đã trả khác quy tắc hiện tại"}
            </p>
          )}
          {note && <p role="status" className="text-[12px] text-emerald-400">{note}</p>}
          {err && <p role="alert" className="text-[12px] text-red-400">{err}</p>}
        </>
      )}
    </div>
  );
}
