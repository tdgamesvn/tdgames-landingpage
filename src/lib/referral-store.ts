import "server-only";

/**
 * Đọc/ghi hoa hồng giới thiệu: người giới thiệu, quy tắc theo job, ngày đi làm, các khoản phải trả.
 * Logic tính nằm ở referral-commission.ts (thuần); file này chỉ đọc → gọi hàm thuần → ghi.
 * Hàm throw khi lỗi DB — route bắt và xử lý.
 */

import { getSupabaseAdmin } from "./supabase-admin";
import { loadOfferLetterRow } from "./offer-letter-store";
import { isValidDate } from "./offer-letter.ts";
import {
  REFERRAL_DEFAULTS_KEY,
  approvedBaseSalary,
  isCommissionable,
  parseDefaultRules,
  parseRule,
  pickRule,
  planPayouts,
  resolveBeneficiary,
  type AmountIssue,
  type CommissionKind,
  type CommissionRule,
  type DefaultRules,
  type PayoutLite,
  type PayoutStatus,
  type ReferrerLite,
  type StaffLite,
} from "./referral-commission.ts";

export type PayoutRow = {
  id: string;
  application_id: string;
  referrer_id: string | null;
  hr_user_id: string | null;
  beneficiary_name: string;
  beneficiary_kind: CommissionKind | null;
  job_id: string | null;
  milestone_months: number;
  percent: number;
  amount: number | null;
  amount_issue: AmountIssue | null;
  amount_edited: boolean;
  rule_key: string | null;
  rule_source: string | null;
  due_date: string | null;
  status: PayoutStatus;
  approved_by: string | null;
  paid_by: string | null;
  paid_date: string | null;
  cancel_reason: string | null;
  note: string;
  edits: unknown[];
};

export type Placement = { start_date: string | null; start_confirmed: boolean; left_date: string | null; history: unknown[] };

const PAYOUT_COLUMNS =
  "id, application_id, referrer_id, hr_user_id, beneficiary_name, beneficiary_kind, job_id, milestone_months, percent, amount, amount_issue, amount_edited, rule_key, rule_source, due_date, status, approved_by, paid_by, paid_date, cancel_reason, note, edits";

export async function loadReferralBasics(): Promise<{ staff: StaffLite[]; referrers: ReferrerLite[]; defaults: DefaultRules }> {
  const db = getSupabaseAdmin();
  const [staffRes, refRes, setRes] = await Promise.all([
    db.from("hr_users").select("id, role, display_name, ref_codes"),
    db.from("referrers").select("id, name, kind, ref_codes, hr_user_id, active, rule"),
    db.from("app_settings").select("value").eq("key", REFERRAL_DEFAULTS_KEY).maybeSingle(),
  ]);
  if (staffRes.error) throw new Error(`loadReferralBasics.staff: ${staffRes.error.message}`);
  if (refRes.error) throw new Error(`loadReferralBasics.referrers: ${refRes.error.message}`);
  if (setRes.error) throw new Error(`loadReferralBasics.defaults: ${setRes.error.message}`);
  const referrers: ReferrerLite[] = (refRes.data ?? []).map((r) => {
    const rule = r.rule == null ? null : parseRule(r.rule);
    return {
      id: r.id,
      name: r.name,
      kind: r.kind ?? null,
      ref_codes: Array.isArray(r.ref_codes) ? r.ref_codes : [],
      hr_user_id: r.hr_user_id ?? null,
      active: r.active !== false,
      rule: rule && !("error" in rule) ? rule : null,
    };
  });
  return {
    staff: (staffRes.data ?? []) as StaffLite[],
    referrers,
    defaults: parseDefaultRules(setRes.data?.value),
  };
}

export async function loadJobRules(jobId: string): Promise<Partial<Record<CommissionKind, CommissionRule>>> {
  const { data, error } = await getSupabaseAdmin().from("referral_job_rules").select("kind, rule").eq("job_id", jobId);
  if (error) throw new Error(`loadJobRules: ${error.message}`);
  const out: Partial<Record<CommissionKind, CommissionRule>> = {};
  for (const r of data ?? []) {
    const rule = parseRule(r.rule);
    if (!("error" in rule) && (r.kind === "internal" || r.kind === "external")) out[r.kind as CommissionKind] = rule;
  }
  return out;
}

export async function loadPlacement(appId: string): Promise<Placement | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("referral_placements")
    .select("start_date, start_confirmed, left_date, history")
    .eq("application_id", appId)
    .maybeSingle();
  if (error) throw new Error(`loadPlacement: ${error.message}`);
  if (!data) return null;
  return {
    start_date: data.start_date ?? null,
    start_confirmed: data.start_confirmed === true,
    left_date: data.left_date ?? null,
    history: Array.isArray(data.history) ? data.history : [],
  };
}

/** Ngày đi làm: placement.start_date nếu có, không thì ngày bắt đầu trên thư mời (chỉ nhận YYYY-MM-DD hợp lệ). */
export async function effectiveStartDate(appId: string): Promise<{ date: string | null; confirmed: boolean }> {
  const placement = await loadPlacement(appId);
  if (placement?.start_date && isValidDate(placement.start_date)) {
    return { date: placement.start_date, confirmed: placement.start_confirmed };
  }
  const offer = await loadOfferLetterRow(appId);
  const s = offer?.data.startDate;
  return { date: typeof s === "string" && isValidDate(s) ? s : null, confirmed: false };
}

export async function loadPayouts(appId: string): Promise<PayoutRow[]> {
  const { data, error } = await getSupabaseAdmin().from("referral_payouts").select(PAYOUT_COLUMNS).eq("application_id", appId);
  if (error) throw new Error(`loadPayouts: ${error.message}`);
  return (data ?? []) as PayoutRow[];
}

/**
 * Sinh các khoản hoa hồng còn thiếu của hồ sơ (replaceOpen = "Tính lại": xoá upcoming/due rồi sinh lại).
 * needsManual = đã có khoản duyệt/trả khác snapshot hoặc sửa tay → không sinh, cần Sếp/Kế toán xử lý tay.
 */
export async function syncApplicationPayouts(
  appId: string,
  opts: { replaceOpen: boolean },
): Promise<{ created: number; deleted: number; skipped: "not_commissionable" | "no_referrer" | null; needsManual: boolean }> {
  const db = getSupabaseAdmin();
  const none = (skipped: "not_commissionable" | "no_referrer") => ({ created: 0, deleted: 0, skipped, needsManual: false });

  const { data: app, error: appErr } = await db
    .from("applications")
    .select("offer_status, work_type, referred_by, job_id")
    .eq("id", appId)
    .maybeSingle();
  if (appErr) throw new Error(`syncApplicationPayouts.app: ${appErr.message}`);
  if (!app || !isCommissionable(app)) return none("not_commissionable");

  const basics = await loadReferralBasics();
  const b = resolveBeneficiary(app.referred_by, basics.staff, basics.referrers);
  if (!b) return none("no_referrer");

  const jobRules = app.job_id ? await loadJobRules(app.job_id) : {};
  const { rule, source } = pickRule(b, jobRules, basics.defaults);

  let baseSalary: number | null = null;
  if (rule?.amount.type === "salary_multiple") baseSalary = approvedBaseSalary(await loadOfferLetterRow(appId));

  const start = await effectiveStartDate(appId);
  const placement = await loadPlacement(appId);
  const existingRows = await loadPayouts(appId);
  const existing: PayoutLite[] = existingRows.map((p) => ({
    id: p.id,
    milestone_months: p.milestone_months,
    status: p.status,
    due_date: p.due_date,
    rule_key: p.rule_key,
    amount_edited: p.amount_edited,
    amount_issue: p.amount_issue,
  }));

  const leftDate = placement?.left_date && isValidDate(placement.left_date) ? placement.left_date : null;
  const plan = planPayouts({
    existing,
    rule,
    baseSalary,
    startDate: start.date,
    leftDate,
    replaceOpen: opts.replaceOpen,
  });

  let deleted = 0;
  if (plan.deleteIds.length) {
    const { data, error } = await db
      .from("referral_payouts")
      .delete()
      .in("id", plan.deleteIds)
      .in("status", ["upcoming", "due"])
      .select("id");
    if (error) throw new Error(`syncApplicationPayouts.delete: ${error.message}`);
    deleted = data?.length ?? 0;
  }

  let created = 0;
  for (const d of plan.inserts) {
    const { error } = await db.from("referral_payouts").insert({
      application_id: appId,
      referrer_id: b.referrerId,
      hr_user_id: b.hrUserId,
      beneficiary_name: b.name,
      beneficiary_kind: b.kind,
      job_id: app.job_id ?? null,
      milestone_months: d.milestone_months,
      percent: d.percent,
      amount: d.amount,
      amount_issue: d.amount_issue,
      amount_edited: false,
      rule_key: d.rule_key,
      rule_snapshot: rule,
      rule_source: source,
      due_date: d.due_date,
      status: "upcoming",
    });
    if (error) {
      if (error.code === "23505") continue; // sinh trùng song song: bỏ qua
      throw new Error(`syncApplicationPayouts.insert: ${error.message}`);
    }
    created++;
  }

  if (created > 0 && !placement) {
    const { error } = await db
      .from("referral_placements")
      .upsert({ application_id: appId }, { onConflict: "application_id", ignoreDuplicates: true });
    if (error) throw new Error(`syncApplicationPayouts.placement: ${error.message}`);
  }

  return { created, deleted, skipped: null, needsManual: plan.needsManual };
}

/** Huỷ khoản chưa trả; luôn kèm lọc status nên không bao giờ chạm khoản paid. Trả số dòng đã huỷ. */
export async function setPayoutStatus(ids: string[], status: "cancelled", reason: string): Promise<number> {
  if (!ids.length) return 0;
  const { data, error } = await getSupabaseAdmin()
    .from("referral_payouts")
    .update({ status, cancel_reason: reason })
    .in("id", ids)
    .in("status", ["upcoming", "due", "approved"])
    .select("id");
  if (error) throw new Error(`setPayoutStatus: ${error.message}`);
  return data?.length ?? 0;
}
