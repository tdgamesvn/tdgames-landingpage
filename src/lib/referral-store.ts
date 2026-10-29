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
  NEEDS_MANUAL_REASON,
  REFERRAL_DEFAULTS_KEY,
  approvedBaseSalary,
  effectiveStatus,
  bankChangedRecent,
  isCommissionable,
  isSelfPayout,
  milestoneLabel,
  payoutNeedsAttention,
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

export type Placement = {
  start_date: string | null;
  start_confirmed: boolean;
  left_date: string | null;
  history: unknown[];
  needs_manual: boolean;
  needs_manual_reason: string | null;
};

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
    defaults: parseDefaultRules(setRes.data?.value), // value là TEXT (chuỗi JSON) — parseDefaultRules tự parse
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
    .select("start_date, start_confirmed, left_date, history, needs_manual, needs_manual_reason")
    .eq("application_id", appId)
    .maybeSingle();
  if (error) throw new Error(`loadPlacement: ${error.message}`);
  if (!data) return null;
  return {
    start_date: data.start_date ?? null,
    start_confirmed: data.start_confirmed === true,
    left_date: data.left_date ?? null,
    history: Array.isArray(data.history) ? data.history : [],
    needs_manual: data.needs_manual === true,
    needs_manual_reason: (data.needs_manual_reason as string | null) ?? null,
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

  // Lưu cờ "cần xử lý tay" để UI hiện lâu dài (không chỉ ngay sau lần bấm).
  if (plan.needsManual || placement?.needs_manual) {
    const { error } = await db.from("referral_placements").upsert(
      {
        application_id: appId,
        needs_manual: plan.needsManual,
        needs_manual_reason: plan.needsManual ? NEEDS_MANUAL_REASON : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "application_id" },
    );
    if (error) throw new Error(`syncApplicationPayouts.needsManual: ${error.message}`);
  } else if (created > 0 && !placement) {
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

/**
 * Chuẩn bị xoá hồ sơ: có khoản approved/paid → false (chặn xoá); không thì xoá các khoản còn lại → true.
 * FK application_id là RESTRICT nên phải xoá khoản trước khi xoá hồ sơ.
 */
export async function deletePayoutsForApplication(appId: string): Promise<boolean> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("referral_payouts")
    .select("id")
    .eq("application_id", appId)
    .in("status", ["approved", "paid"])
    .limit(1);
  if (error) throw new Error(`deletePayoutsForApplication.check: ${error.message}`);
  if (data?.length) return false;
  const { error: delErr } = await db.from("referral_payouts").delete().eq("application_id", appId);
  if (delErr) throw new Error(`deletePayoutsForApplication.delete: ${delErr.message}`);
  return true;
}

export type PayoutView = Omit<PayoutRow, "status" | "edits"> & {
  status: PayoutStatus;
  label: string;
  due_estimated: boolean;
  candidate_name: string;
  job_title: string;
  bank_changed_recent: boolean;
  bank_changed_by: string | null;
  needs_attention: boolean;
  attention_reason: "offer_changed" | null;
  /** Người đang xem là người hưởng khoản này (isSelfPayout) — không phải Sếp thì không duyệt/sửa/trả. */
  is_self: boolean;
  edits: unknown[];
};

export type PayoutActor = { id: string | null; ref_codes: string[] | null };

/** Mã ref của tài khoản đang thao tác (để nhận ra khoản của chính mình). */
export async function loadPayoutActor(userId: string | null): Promise<PayoutActor> {
  if (!userId) return { id: null, ref_codes: [] };
  const { data, error } = await getSupabaseAdmin().from("hr_users").select("ref_codes").eq("id", userId).maybeSingle();
  if (error) throw new Error(`loadPayoutActor: ${error.message}`);
  return { id: userId, ref_codes: Array.isArray(data?.ref_codes) ? (data.ref_codes as string[]) : [] };
}

/** Gắn tên ứng viên / job / nhãn mốc / trạng thái hiển thị. Không bao giờ chứa lương. */
async function toPayoutViews(rows: PayoutRow[], today: string, actor: PayoutActor): Promise<PayoutView[]> {
  if (!rows.length) return [];
  const db = getSupabaseAdmin();
  const appIds = [...new Set(rows.map((r) => r.application_id))];
  const jobIds = [...new Set(rows.map((r) => r.job_id).filter((x): x is string => !!x))];
  const [appRes, jobRes] = await Promise.all([
    db.from("applications").select("id, full_name, offer_status, referred_by").in("id", appIds),
    jobIds.length ? db.from("jobs").select("id, title").in("id", jobIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (appRes.error) throw new Error(`toPayoutViews.apps: ${appRes.error.message}`);
  if (jobRes.error) throw new Error(`toPayoutViews.jobs: ${jobRes.error.message}`);
  const apps = new Map((appRes.data ?? []).map((a) => [a.id as string, a as { full_name: string | null; offer_status: string | null; referred_by: string | null }]));
  const jobs = new Map((jobRes.data ?? []).map((j) => [j.id as string, String(j.title ?? "")]));
  const refIds = [...new Set(rows.map((r) => r.referrer_id).filter((x): x is string => !!x))];
  const refRes = refIds.length
    ? await db.from("referrers").select("id, bank_changed_at, bank_changed_by, hr_user_id").in("id", refIds)
    : { data: [], error: null };
  if (refRes.error) throw new Error(`toPayoutViews.referrers: ${refRes.error.message}`);
  const banks = new Map((refRes.data ?? []).map((x) => [x.id as string, x as { bank_changed_at: string | null; bank_changed_by: string | null; hr_user_id: string | null }]));
  const nowMs = Date.now();
  const { data: pl, error: plErr } = await db
    .from("referral_placements")
    .select("application_id, start_confirmed")
    .in("application_id", appIds);
  if (plErr) throw new Error(`toPayoutViews.placements: ${plErr.message}`);
  const confirmed = new Map((pl ?? []).map((x) => [x.application_id as string, x.start_confirmed === true]));
  return rows.map((r) => {
    const app = apps.get(r.application_id);
    const attention = payoutNeedsAttention(r.status, app?.offer_status ?? null);
    return {
      ...r,
      status: effectiveStatus(r, today),
      label: milestoneLabel(r.milestone_months),
      due_estimated: r.due_date !== null && confirmed.get(r.application_id) !== true,
      candidate_name: app?.full_name ?? "",
      job_title: r.job_id ? (jobs.get(r.job_id) ?? "") : "",
      bank_changed_recent: r.referrer_id ? bankChangedRecent(banks.get(r.referrer_id)?.bank_changed_at ?? null, nowMs) : false,
      bank_changed_by: r.referrer_id && bankChangedRecent(banks.get(r.referrer_id)?.bank_changed_at ?? null, nowMs) ? (banks.get(r.referrer_id)?.bank_changed_by ?? null) : null,
      needs_attention: attention,
      attention_reason: attention ? "offer_changed" : null,
      is_self: isSelfPayout(
        r,
        { referrerHrUserId: r.referrer_id ? (banks.get(r.referrer_id)?.hr_user_id ?? null) : null, referredBy: app?.referred_by ?? null },
        actor,
      ),
    };
  });
}

export async function loadAllPayoutViews(today: string, actor: PayoutActor): Promise<PayoutView[]> {
  const { data, error } = await getSupabaseAdmin().from("referral_payouts").select(PAYOUT_COLUMNS).order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`loadAllPayoutViews: ${error.message}`);
  return toPayoutViews((data ?? []) as PayoutRow[], today, actor);
}

export async function loadPayoutRow(id: string): Promise<PayoutRow | null> {
  const { data, error } = await getSupabaseAdmin().from("referral_payouts").select(PAYOUT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`loadPayoutRow: ${error.message}`);
  return (data as PayoutRow | null) ?? null;
}

export async function toPayoutView(row: PayoutRow, today: string, actor: PayoutActor): Promise<PayoutView> {
  return (await toPayoutViews([row], today, actor))[0];
}

/** Hồ sơ đang có cờ "cần Sếp/Kế toán xử lý tay" (banner tab Hoa hồng). */
export async function loadNeedsManual(): Promise<{ application_id: string; candidate_name: string; reason: string | null }[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("referral_placements")
    .select("application_id, needs_manual_reason, applications(full_name)")
    .eq("needs_manual", true);
  if (error) throw new Error(`loadNeedsManual: ${error.message}`);
  return (data ?? []).map((r) => {
    const a = (Array.isArray(r.applications) ? r.applications[0] : r.applications) as { full_name?: string | null } | null | undefined;
    return { application_id: r.application_id as string, candidate_name: String(a?.full_name ?? "Ứng viên"), reason: (r.needs_manual_reason as string | null) ?? null };
  });
}

/** Ghi placement (upsert) và nối thêm 1 dòng lịch sử nếu có. */
export async function savePlacement(
  appId: string,
  patch: { start_date?: string | null; start_confirmed?: boolean; left_date?: string | null },
  historyEntry?: Record<string, unknown>,
): Promise<void> {
  const current = historyEntry ? await loadPlacement(appId) : null;
  const row: Record<string, unknown> = { application_id: appId, ...patch, updated_at: new Date().toISOString() };
  if (historyEntry) row.history = [...(current?.history ?? []), historyEntry];
  const { error } = await getSupabaseAdmin().from("referral_placements").upsert(row, { onConflict: "application_id" });
  if (error) throw new Error(`savePlacement: ${error.message}`);
}

/** Xoá mọi khoản upcoming/due của hồ sơ (đổi người giới thiệu); không chạm approved/paid. Trả số dòng xoá. */
export async function deleteOpenPayouts(appId: string): Promise<number> {
  const { data, error } = await getSupabaseAdmin()
    .from("referral_payouts")
    .delete()
    .eq("application_id", appId)
    .in("status", ["upcoming", "due"])
    .select("id");
  if (error) throw new Error(`deleteOpenPayouts: ${error.message}`);
  return data?.length ?? 0;
}
