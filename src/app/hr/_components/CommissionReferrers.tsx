"use client";

// Tab Hoa hồng — mục "Người giới thiệu": bảng, thêm/sửa, mã chưa phân loại.

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import type { CommissionKind, CommissionRule } from "@/lib/referral-commission";
import { hrFetch, useHrSession } from "./HrSession";
import { RuleEditor, callJson, inputCls, kindText, money, type ReferrerView } from "./CommissionShared";

type Form = {
  id: string | null;
  name: string;
  kind: CommissionKind | "";
  codes: string;
  hr_user_id: string;
  phone: string;
  email: string;
  bank_info: string;
  note: string;
  active: boolean;
  rule: CommissionRule | null;
};

const EMPTY: Form = { id: null, name: "", kind: "", codes: "", hr_user_id: "", phone: "", email: "", bank_info: "", note: "", active: true, rule: null };

export default function CommissionReferrers({
  referrers,
  unknownCodes,
  onReload,
}: {
  referrers: ReferrerView[];
  unknownCodes: { code: string; count: number }[];
  onReload: () => Promise<void>;
}) {
  const { can } = useHrSession();
  const canManage = can("referrals.manage");
  const [form, setForm] = useState<Form | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [ruleErr, setRuleErr] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [users, setUsers] = useState<{ id: string; display_name: string }[]>([]);
  const [mergeFor, setMergeFor] = useState<string | null>(null);
  const [mergeTo, setMergeTo] = useState("");

  useEffect(() => {
    if (!canManage) return;
    let alive = true;
    hrFetch("/api/hr/users/directory")
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((j) => alive && setUsers(j.users ?? []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [canManage]);

  function edit(r: ReferrerView | null, preset?: Partial<Form>) {
    setErr("");
    setRuleErr(null);
    setFormKey((k) => k + 1);
    setForm(
      r
        ? { id: r.id, name: r.name, kind: r.kind ?? "", codes: r.ref_codes.join(", "), hr_user_id: r.hr_user_id ?? "", phone: r.phone, email: r.email, bank_info: r.bank_info, note: r.note, active: r.active, rule: r.rule }
        : { ...EMPTY, ...preset },
    );
  }

  async function save() {
    if (!form) return;
    setBusy(true);
    setErr("");
    const body = {
      name: form.name,
      kind: form.hr_user_id ? "internal" : form.kind || null,
      ref_codes: form.hr_user_id ? [] : form.codes.split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
      hr_user_id: form.hr_user_id || null,
      phone: form.phone,
      email: form.email,
      bank_info: form.bank_info,
      note: form.note,
      active: form.active,
      rule: form.rule,
    };
    const r = await callJson(hrFetch, form.id ? `/api/hr/referrals/referrers/${form.id}` : "/api/hr/referrals/referrers", form.id ? "PATCH" : "POST", body);
    setBusy(false);
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    setForm(null);
    await onReload();
  }

  async function merge(code: string) {
    if (!mergeTo) return;
    const target = referrers.find((x) => x.id === mergeTo);
    if (!target) return;
    setBusy(true);
    setErr("");
    const r = await callJson(hrFetch, `/api/hr/referrals/referrers/${target.id}`, "PATCH", { ref_codes: [...target.ref_codes, code] });
    setBusy(false);
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    setMergeFor(null);
    setMergeTo("");
    await onReload();
  }

  function copyLink(r: ReferrerView) {
    const code = r.ref_codes[0];
    if (!code) return;
    void navigator.clipboard.writeText(`${window.location.origin}/careers?ref=${encodeURIComponent(code)}`).then(() => {
      setCopied(r.id);
      setTimeout(() => setCopied(""), 2000);
    });
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const lbl = "block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-bold text-white">Người giới thiệu</h3>
        {canManage && !form && (
          <button type="button" className="hr-secondary-btn" onClick={() => edit(null)}>+ Thêm người giới thiệu</button>
        )}
      </div>
      {err && !form && <p role="alert" className="text-[13px] text-red-400">{err}</p>}

      {canManage && unknownCodes.length > 0 && (
        <div className="hr-group space-y-2 px-4 py-3">
          <h4 className="text-[13px] font-bold text-amber-300">Mã chưa phân loại</h4>
          <p className="text-[12px] text-white/50">Mã ref trên hồ sơ chưa thuộc ai — hồ sơ dùng các mã này chưa sinh hoa hồng.</p>
          {unknownCodes.map((u) => (
            <div key={u.code} className="flex flex-wrap items-center gap-2 text-[13px]">
              <code className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-300">{u.code}</code>
              <span className="text-white/50">{u.count} hồ sơ</span>
              <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" onClick={() => edit(null, { name: u.code, codes: u.code })}>Thêm người mới</button>
              <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" onClick={() => { setMergeFor(mergeFor === u.code ? null : u.code); setMergeTo(""); }}>Gộp vào…</button>
              {mergeFor === u.code && (
                <>
                  <select className={inputCls} value={mergeTo} onChange={(e) => setMergeTo(e.target.value)} aria-label="Gộp vào người">
                    <option value="">Chọn người giới thiệu</option>
                    {referrers.filter((r) => !r.hr_user_id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <button type="button" disabled={!mergeTo || busy} className="hr-primary-btn h-8 px-3 text-[12px] font-semibold" onClick={() => void merge(u.code)}>Gộp</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {form && canManage && (
        <div className="hr-group space-y-3 px-4 py-4">
          <h4 className="text-[14px] font-bold text-white">{form.id ? "Sửa người giới thiệu" : "Thêm người giới thiệu"}</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div><label className={lbl}>Tên *</label><input className={`${inputCls} w-full`} value={form.name} maxLength={120} onChange={(e) => set("name", e.target.value)} /></div>
            <div>
              <label className={lbl}>Loại</label>
              <select className={`${inputCls} w-full`} value={form.hr_user_id ? "internal" : form.kind} disabled={!!form.hr_user_id} onChange={(e) => set("kind", e.target.value as Form["kind"])}>
                <option value="">Chưa phân loại</option>
                <option value="internal">Nội bộ</option>
                <option value="external">Headhunter</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Tài khoản /hr (nếu là nhân sự)</label>
              <select className={`${inputCls} w-full`} value={form.hr_user_id} onChange={(e) => set("hr_user_id", e.target.value)}>
                <option value="">Không gắn tài khoản</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.display_name}</option>)}
              </select>
            </div>
          </div>
          {!form.hr_user_id && (
            <div>
              <label className={lbl}>Mã ref (cách nhau dấu phẩy; mã đầu là mã chính)</label>
              <input className={`${inputCls} w-full font-mono`} value={form.codes} onChange={(e) => set("codes", e.target.value)} placeholder="cat-tuong, cat-tuong-2" />
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label className={lbl}>Số điện thoại</label><input className={`${inputCls} w-full`} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div><label className={lbl}>Email</label><input className={`${inputCls} w-full`} value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          </div>
          <div><label className={lbl}>Thông tin chuyển khoản</label><textarea rows={2} className={`${inputCls} w-full`} value={form.bank_info} maxLength={500} onChange={(e) => set("bank_info", e.target.value)} /></div>
          <div><label className={lbl}>Ghi chú</label><textarea rows={2} className={`${inputCls} w-full`} value={form.note} maxLength={500} onChange={(e) => set("note", e.target.value)} /></div>
          <label className="flex items-center gap-2 text-[13px] text-white/70">
            <input type="checkbox" className="h-4 w-4 accent-amber-500" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
            Đang hoạt động (tắt = không sinh khoản mới)
          </label>
          <div>
            <label className={lbl}>Mức hoa hồng riêng</label>
            <RuleEditor key={formKey} value={form.rule} allowEmpty emptyLabel="Dùng mức theo job / mặc định công ty" onChange={(v) => set("rule", v)} onInvalid={setRuleErr} />
          </div>
          {err && <p role="alert" className="text-[13px] text-red-400">{err}</p>}
          <div className="flex gap-2">
            <button type="button" disabled={busy || !form.name.trim() || !!ruleErr} className="hr-primary-btn h-9 px-4 text-[14px] font-semibold" onClick={() => void save()}>
              {busy ? "Đang lưu…" : "Lưu"}
            </button>
            <button type="button" className="hr-secondary-btn" onClick={() => setForm(null)}>Huỷ</button>
          </div>
        </div>
      )}

      <div className="hr-group overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-white/40">
              <th className="px-4 py-2 font-bold">Tên</th>
              <th className="px-2 py-2 font-bold">Loại</th>
              <th className="px-2 py-2 font-bold">Mã ref</th>
              <th className="px-2 py-2 font-bold">Đã trả</th>
              <th className="px-2 py-2 font-bold">Còn phải trả</th>
              <th className="px-4 py-2 text-right font-bold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {referrers.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-white/50">Chưa có người giới thiệu nào.</td></tr>}
            {referrers.map((r) => (
              <tr key={r.id} className={`border-t border-white/10 ${r.active ? "" : "opacity-50"}`}>
                <td className="px-4 py-2.5 font-semibold text-white/90">{r.name}{!r.active && <span className="ml-1.5 text-[11px] font-normal text-white/40">(ngừng)</span>}</td>
                <td className="px-2 py-2.5 text-white/70">{kindText(r.kind)}</td>
                <td className="px-2 py-2.5 font-mono text-[12px]">
                  {r.hr_user_id ? (
                    <span className="font-sans text-white/45">Mã của tài khoản</span>
                  ) : (
                    r.ref_codes.map((c, i) => <span key={c} className={i === 0 ? "mr-2 font-bold text-white" : "mr-2 text-white/50"}>{c}</span>)
                  )}
                </td>
                <td className="px-2 py-2.5">{money(r.totals.paid)}</td>
                <td className="px-2 py-2.5">{money(r.totals.outstanding)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1.5">
                    {r.ref_codes[0] && !r.hr_user_id && (
                      <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" onClick={() => copyLink(r)}>
                        <Copy className="hr-ico" />{copied === r.id ? "Đã copy" : "Copy link"}
                      </button>
                    )}
                    {canManage && <button type="button" className="hr-secondary-btn hr-secondary-btn--sm" onClick={() => edit(r)}>Sửa</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
