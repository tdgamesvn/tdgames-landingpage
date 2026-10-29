// Hoa hồng giới thiệu (refer) — lõi thuần, không import server (dùng cả client, route, test).
// Tiền VND số nguyên; ngày YYYY-MM-DD theo giờ VN.

import { findRefConflict, normalizeRefCode, parseRefCodes, resolveRefOwner } from "./hr-ref-codes.ts";
import type { HrRole, PermissionKey } from "./hr-permissions.ts";
import { isValidDate } from "./offer-letter.ts";

export type CommissionKind = "internal" | "external";
export type PayoutStatus = "upcoming" | "due" | "approved" | "paid" | "cancelled";
export type AmountIssue = "no_rule" | "no_salary";
export type ScheduleStep = { months: number; percent: number };
export type CommissionAmount = { type: "fixed"; vnd: number } | { type: "salary_multiple"; multiple: number };
export type CommissionRule = { amount: CommissionAmount; schedule: ScheduleStep[] };
export type DefaultRules = Record<CommissionKind, CommissionRule | null>;

/** app_settings key lưu mặc định công ty. */
export const REFERRAL_DEFAULTS_KEY = "referral_default_rules";

export const DEFAULT_RULES: DefaultRules = {
  internal: {
    amount: { type: "fixed", vnd: 2_000_000 },
    schedule: [{ months: 1, percent: 50 }, { months: 2, percent: 50 }],
  },
  external: null,
};

const MAX_VND = 1_000_000_000;
const MAX_MULTIPLE = 12;
const MAX_STEPS = 6;
const MAX_MONTHS = 36;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Đọc quy tắc từ JSON: hợp lệ → quy tắc chuẩn hoá (lịch sắp tăng theo months); sai → { error } tiếng Việt. */
export function parseRule(v: unknown): CommissionRule | { error: string } {
  if (!isRecord(v)) return { error: "Quy tắc không hợp lệ" };
  const a = v.amount;
  if (!isRecord(a)) return { error: "Thiếu số tiền hoa hồng" };
  let amount: CommissionAmount;
  if (a.type === "fixed") {
    if (typeof a.vnd !== "number" || !Number.isInteger(a.vnd) || a.vnd < 1 || a.vnd > MAX_VND) {
      return { error: "Số tiền cố định phải là số nguyên từ 1 đến 1.000.000.000 đồng" };
    }
    amount = { type: "fixed", vnd: a.vnd };
  } else if (a.type === "salary_multiple") {
    if (typeof a.multiple !== "number" || !Number.isFinite(a.multiple) || a.multiple <= 0 || a.multiple > MAX_MULTIPLE) {
      return { error: `Hệ số lương phải lớn hơn 0 và không quá ${MAX_MULTIPLE}` };
    }
    const multiple = Math.round(a.multiple * 100) / 100;
    if (multiple <= 0) return { error: `Hệ số lương phải lớn hơn 0 và không quá ${MAX_MULTIPLE}` };
    amount = { type: "salary_multiple", multiple };
  } else {
    return { error: "Loại số tiền phải là cố định hoặc theo lương" };
  }
  if (!Array.isArray(v.schedule) || v.schedule.length < 1 || v.schedule.length > MAX_STEPS) {
    return { error: `Lịch trả phải có từ 1 đến ${MAX_STEPS} mốc` };
  }
  const schedule: ScheduleStep[] = [];
  const seen = new Set<number>();
  let total = 0;
  for (const s of v.schedule as unknown[]) {
    if (!isRecord(s) || typeof s.months !== "number" || typeof s.percent !== "number") return { error: "Mốc trả không hợp lệ" };
    if (!Number.isInteger(s.months) || s.months < 0 || s.months > MAX_MONTHS) return { error: `Số tháng của mốc phải là số nguyên từ 0 đến ${MAX_MONTHS}` };
    if (!Number.isInteger(s.percent) || s.percent < 1 || s.percent > 100) return { error: "Phần trăm mỗi mốc phải là số nguyên từ 1 đến 100" };
    if (seen.has(s.months)) return { error: "Hai mốc không được trùng số tháng" };
    seen.add(s.months);
    total += s.percent;
    schedule.push({ months: s.months, percent: s.percent });
  }
  if (total !== 100) return { error: "Tổng phần trăm phải bằng 100" };
  schedule.sort((x, y) => x.months - y.months);
  return { amount, schedule };
}

/** Đọc mặc định công ty từ app_settings; phần thiếu/hỏng → DEFAULT_RULES của loại đó. */
export function parseDefaultRules(v: unknown): DefaultRules {
  const src = isRecord(v) ? v : {};
  const one = (kind: CommissionKind): CommissionRule | null => {
    if (!(kind in src)) return DEFAULT_RULES[kind];
    if (src[kind] === null) return null;
    const r = parseRule(src[kind]);
    return "error" in r ? DEFAULT_RULES[kind] : r;
  };
  return { internal: one("internal"), external: one("external") };
}

function daysInMonth(y: number, m: number): number {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

/** Cộng n tháng vào YYYY-MM-DD, kẹp cuối tháng (31/1 + 1 → 28/2). Không dùng Date (tránh lệch múi giờ). */
export function addMonthsClamped(ymd: string, n: number): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y0, m, d] = ymd.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y0, m)) return null;
  const m0 = m - 1 + n;
  const y = y0 + Math.floor(m0 / 12);
  const mm = (((m0 % 12) + 12) % 12) + 1;
  const dd = Math.min(d, daysInMonth(y, mm));
  return `${String(y).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

/** Chia tổng theo lịch: sắp theo months, mỗi mốc làm tròn xuống, mốc cuối nhận phần dư. total null → amount null. */
export function splitSchedule(
  total: number | null,
  schedule: ScheduleStep[],
): { months: number; percent: number; amount: number | null }[] {
  const sorted = [...schedule].sort((a, b) => a.months - b.months);
  let given = 0;
  return sorted.map((s, i) => {
    if (total === null) return { months: s.months, percent: s.percent, amount: null };
    const amount = i === sorted.length - 1 ? total - given : Math.floor((total * s.percent) / 100);
    given += amount;
    return { months: s.months, percent: s.percent, amount };
  });
}

export function computeAmount(
  rule: CommissionRule | null,
  baseSalary: number | null,
): { amount: number | null; issue: AmountIssue | null } {
  if (!rule) return { amount: null, issue: "no_rule" };
  if (rule.amount.type === "fixed") return { amount: rule.amount.vnd, issue: null };
  if (baseSalary === null || !(baseSalary > 0)) return { amount: null, issue: "no_salary" };
  // Số nguyên (multiple có ≤ 2 chữ số thập phân) — tránh sai số float làm hụt 1 đồng.
  return { amount: Math.floor((Math.round(rule.amount.multiple * 100) * baseSalary) / 100), issue: null };
}

/** Trạng thái hiển thị: upcoming đã tới hạn (≤ hôm nay) → due (phòng cron lỗi). */
export function effectiveStatus(p: { status: PayoutStatus; due_date: string | null }, today: string): PayoutStatus {
  return p.status === "upcoming" && p.due_date !== null && p.due_date <= today ? "due" : p.status;
}

/** Trạng thái sau khi sửa hạn: upcoming/due tính lại theo hạn mới (hạn ≤ hôm nay → due, còn lại upcoming); approved/paid/cancelled giữ nguyên. */
export function statusAfterDueEdit(status: PayoutStatus, newDue: string | null, today: string): PayoutStatus {
  if (status !== "upcoming" && status !== "due") return status;
  return newDue !== null && newDue <= today ? "due" : "upcoming";
}

export function milestoneLabel(months: number): string {
  return months === 0 ? "Ngay khi đi làm" : `Đủ ${months} tháng`;
}

// ── Ai được hưởng ──────────────────────────────────────────────────────────

export type StaffLite = { id: string; role: HrRole; display_name: string; ref_codes: string[] | null };
export type ReferrerLite = {
  id: string;
  name: string;
  kind: CommissionKind | null;
  ref_codes: string[];
  hr_user_id: string | null;
  active: boolean;
  rule: CommissionRule | null;
};
export type Beneficiary = {
  referrerId: string | null;
  hrUserId: string | null;
  name: string;
  kind: CommissionKind | null;
  override: CommissionRule | null;
};

/**
 * Người hưởng hoa hồng của mã ref `code`; không ai hưởng → null.
 * Mã tài khoản: Kế toán → internal; HR/Leader/Sếp → chỉ khi có referrer active gắn hr_user_id (ngoại lệ).
 * Mã không thuộc tài khoản: referrer độc lập đang hoạt động khớp mã (kind null = chưa phân loại).
 */
export function resolveBeneficiary(code: unknown, staff: StaffLite[], referrers: ReferrerLite[]): Beneficiary | null {
  const c = normalizeRefCode(code);
  if (!c) return null;
  const owner = resolveRefOwner(c, staff);
  if (owner) {
    const linked = referrers.find((x) => x.hr_user_id === owner.id);
    if (linked && !linked.active) return null; // ngừng hoạt động → không hưởng, kể cả Kế toán
    const r = linked;
    if (r) return { referrerId: r.id, hrUserId: owner.id, name: r.name, kind: r.kind ?? "internal", override: r.rule };
    if (owner.role === "accountant") {
      return { referrerId: null, hrUserId: owner.id, name: owner.display_name, kind: "internal", override: null };
    }
    return null;
  }
  const r = referrers.find((x) => x.hr_user_id === null && x.active && x.ref_codes.some((k) => normalizeRefCode(k) === c));
  return r ? { referrerId: r.id, hrUserId: null, name: r.name, kind: r.kind, override: r.rule } : null;
}

/** Ghi đè người > quy tắc job (theo loại) > mặc định công ty. Chưa phân loại (kind null) → không có quy tắc. */
export function pickRule(
  b: Beneficiary,
  jobRules: Partial<Record<CommissionKind, CommissionRule>>,
  defaults: DefaultRules,
): { rule: CommissionRule | null; source: "override" | "job" | "default" | null } {
  if (b.override) return { rule: b.override, source: "override" };
  if (!b.kind) return { rule: null, source: null };
  const job = jobRules[b.kind];
  if (job) return { rule: job, source: "job" };
  const def = defaults[b.kind];
  return def ? { rule: def, source: "default" } : { rule: null, source: null };
}

/** Hồ sơ đủ điều kiện sinh hoa hồng: đã nhận offer và không phải freelancer / theo dự án. */
export function isCommissionable(app: { offer_status: string | null; work_type: string | null }): boolean {
  return app.offer_status === "accepted" && app.work_type !== "freelancer";
}

/** Lương cơ bản của thư mời đã được Sếp duyệt; chưa duyệt / không có thư → null. */
export function approvedBaseSalary(
  row: { data: { baseSalary: number | null }; approval: { status: string } } | null,
): number | null {
  if (!row || row.approval.status !== "approved") return null;
  const s = row.data.baseSalary;
  return typeof s === "number" && s > 0 ? s : null;
}

/** Mã ref trên hồ sơ chưa thuộc tài khoản nào / referrer nào (kể cả ngừng hoạt động), gộp sau normalize. */
export function unknownRefCodes(
  codes: (string | null)[],
  staff: StaffLite[],
  referrers: ReferrerLite[],
): { code: string; count: number }[] {
  const known = new Set<string>();
  for (const u of staff) for (const k of u.ref_codes ?? []) known.add(normalizeRefCode(k) ?? "");
  for (const r of referrers) for (const k of r.ref_codes) known.add(normalizeRefCode(k) ?? "");
  const counts = new Map<string, number>();
  for (const raw of codes) {
    const c = normalizeRefCode(raw);
    if (!c || known.has(c)) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts].map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}

// ── Lập kế hoạch khoản ─────────────────────────────────────────────────────

/**
 * rule_key = ruleKey(quy tắc lúc sinh) lưu trên dòng khoản; amount_edited = đã sửa tay số tiền;
 * amount_issue = lý do chưa có số tiền (placeholder "Chưa đặt mức"). Thiếu → coi như không rõ nguồn.
 */
export type PayoutLite = {
  id: string;
  milestone_months: number;
  status: PayoutStatus;
  due_date: string | null;
  rule_key?: string | null;
  amount_edited?: boolean;
  amount_issue?: AmountIssue | null;
};

/** Khoá ổn định của quy tắc (snapshot so sánh giữa các lần sinh); null → null. */
export function ruleKey(rule: CommissionRule | null): string | null {
  if (!rule) return null;
  const a = rule.amount.type === "fixed" ? { type: "fixed", vnd: rule.amount.vnd } : { type: "salary_multiple", multiple: rule.amount.multiple };
  const schedule = [...rule.schedule].sort((x, y) => x.months - y.months).map((x) => ({ months: x.months, percent: x.percent }));
  return JSON.stringify({ amount: a, schedule });
}
export type PayoutDraft = {
  milestone_months: number;
  percent: number;
  amount: number | null;
  amount_issue: AmountIssue | null;
  due_date: string | null;
  rule_key: string | null;
};

const OPEN: PayoutStatus[] = ["upcoming", "due"];

/**
 * Các khoản cần sinh mới + id cần xoá. replaceOpen (nút "Tính lại") xoá upcoming/due rồi sinh lại;
 * mốc đã có (approved/paid/…, trừ cancelled) không sinh trùng; mốc đến hạn sau ngày nghỉ bị bỏ.
 * Không có quy tắc → 1 dòng "Chưa đặt mức" (mốc 0, 100%).
 */
export function planPayouts(i: {
  existing: PayoutLite[];
  rule: CommissionRule | null;
  baseSalary: number | null;
  startDate: string | null;
  leftDate: string | null;
  replaceOpen: boolean;
}): { deleteIds: string[]; inserts: PayoutDraft[]; needsManual: boolean } {
  const deleteIds = i.replaceOpen ? i.existing.filter((p) => OPEN.includes(p.status)).map((p) => p.id) : [];
  const taken = new Set(
    i.existing.filter((p) => p.status !== "cancelled" && !deleteIds.includes(p.id)).map((p) => p.milestone_months),
  );
  // Đã có khoản approved/paid: chỉ sinh bù khi tất cả cùng snapshot quy tắc hiện tại, không sửa tay, không phải
  // placeholder; ngược lại giữ nguyên và báo cần xử lý tay (tránh trả chồng).
  const key = ruleKey(i.rule);
  const locked = i.existing.filter((p) => p.status === "approved" || p.status === "paid");
  if (locked.length && (key === null || locked.some((p) => p.rule_key !== key || p.amount_edited || p.amount_issue))) {
    return { deleteIds, inserts: [], needsManual: true };
  }
  // Đã nghỉ nhưng chưa có ngày đi làm → không biết mốc nào còn hiệu lực: không sinh.
  if (i.leftDate && !i.startDate) return { deleteIds, inserts: [], needsManual: false };
  const { amount, issue } = computeAmount(i.rule, i.baseSalary);
  const schedule = i.rule ? i.rule.schedule : [{ months: 0, percent: 100 }];
  const inserts: PayoutDraft[] = [];
  for (const s of splitSchedule(amount, schedule)) {
    if (taken.has(s.months)) continue;
    const due = i.startDate ? addMonthsClamped(i.startDate, s.months) : null;
    if (i.leftDate && due && due > i.leftDate) continue;
    inserts.push({ milestone_months: s.months, percent: s.percent, amount: s.amount, amount_issue: issue, due_date: due, rule_key: key });
  }
  return { deleteIds, inserts, needsManual: false };
}

/** Đổi ngày đi làm → ngày đến hạn mới của khoản upcoming/due (chỉ dòng đổi ngày). Route ghi kèm status "upcoming". */
export function rescheduleDueDates(existing: PayoutLite[], startDate: string | null): { id: string; due_date: string | null }[] {
  const out: { id: string; due_date: string | null }[] = [];
  for (const p of existing) {
    if (!OPEN.includes(p.status)) continue;
    const due = startDate ? addMonthsClamped(startDate, p.milestone_months) : null;
    if (due !== p.due_date) out.push({ id: p.id, due_date: due });
  }
  return out;
}

/** UV nghỉ: khoản chưa trả có ngày đến hạn SAU ngày nghỉ bị huỷ (nghỉ đúng ngày đến hạn vẫn đủ mốc). */
export function cancelOnLeave(existing: PayoutLite[], leftDate: string): string[] {
  return existing
    .filter((p) => p.status !== "paid" && p.status !== "cancelled" && p.due_date !== null && p.due_date > leftDate)
    .map((p) => p.id);
}

/** Khoản còn huỷ được (offer bị rút): upcoming | due | approved. */
export function cancellableIds(existing: PayoutLite[]): string[] {
  return existing.filter((p) => p.status === "upcoming" || p.status === "due" || p.status === "approved").map((p) => p.id);
}

export function offerTransition(oldStatus: string | null, newStatus: string | null): "generate" | "cancel" | null {
  if (oldStatus !== "accepted" && newStatus === "accepted") return "generate";
  if (oldStatus === "accepted" && newStatus !== "accepted") return "cancel";
  return null;
}

// ── Thao tác khoản + dữ liệu người giới thiệu ─────────────────────────────

export type PayoutAction =
  | { action: "approve" }
  | { action: "cancel"; reason: string }
  | { action: "pay"; paid_date: string }
  | { action: "edit"; amount?: number; due_date?: string | null; note?: string };

/** Đọc body thao tác khoản; key lạ bị bỏ qua. */
export function parsePayoutAction(v: unknown): PayoutAction | { error: string } {
  if (!isRecord(v)) return { error: "Yêu cầu không hợp lệ" };
  switch (v.action) {
    case "approve":
      return { action: "approve" };
    case "cancel": {
      const reason = typeof v.reason === "string" ? v.reason.trim() : "";
      if (!reason || reason.length > 500) return { error: "Lý do huỷ phải từ 1 đến 500 ký tự" };
      return { action: "cancel", reason };
    }
    case "pay": {
      if (typeof v.paid_date !== "string" || !isValidDate(v.paid_date)) return { error: "Ngày chuyển khoản không hợp lệ" };
      return { action: "pay", paid_date: v.paid_date };
    }
    case "edit": {
      const out: Extract<PayoutAction, { action: "edit" }> = { action: "edit" };
      if (v.amount !== undefined) {
        if (typeof v.amount !== "number" || !Number.isInteger(v.amount) || v.amount < 0 || v.amount > MAX_VND) {
          return { error: "Số tiền phải là số nguyên từ 0 đến 1.000.000.000 đồng" };
        }
        out.amount = v.amount;
      }
      if (v.due_date !== undefined) {
        if (v.due_date !== null && (typeof v.due_date !== "string" || !isValidDate(v.due_date))) return { error: "Hạn thanh toán không hợp lệ" };
        out.due_date = v.due_date;
      }
      if (v.note !== undefined) {
        if (typeof v.note !== "string" || v.note.length > 1000) return { error: "Ghi chú tối đa 1000 ký tự" };
        out.note = v.note;
      }
      if (out.amount === undefined && out.due_date === undefined && out.note === undefined) return { error: "Không có gì để sửa" };
      return out;
    }
    default:
      return { error: "Thao tác không hợp lệ" };
  }
}

/** Lỗi tiếng Việt nếu người có quyền `perms` không được làm `a` trên khoản `p`; null = được. */
export function checkPayoutAction(
  perms: Set<PermissionKey>,
  p: { status: PayoutStatus; due_date: string | null; amount: number | null },
  a: PayoutAction,
  today: string,
): string | null {
  switch (a.action) {
    case "approve":
      if (!perms.has("referrals.manage")) return "Bạn không có quyền xác nhận khoản hoa hồng";
      if (effectiveStatus(p, today) !== "due") return "Khoản chưa đến hạn hoặc không ở trạng thái chờ xác nhận";
      if (p.amount === null) return "Khoản chưa có số tiền — hãy đặt mức hoa hồng trước";
      return null;
    case "cancel":
      if (!perms.has("referrals.manage")) return "Bạn không có quyền huỷ khoản hoa hồng";
      if (p.status === "paid") return "Khoản đã chuyển khoản không thể huỷ";
      if (p.status === "cancelled") return "Khoản đã huỷ rồi";
      return null;
    case "pay":
      if (!perms.has("referrals.pay")) return "Bạn không có quyền đánh dấu đã chuyển khoản";
      if (p.status !== "approved") return "Chỉ khoản đã được xác nhận còn làm mới đánh dấu chuyển khoản được";
      if (a.paid_date > today) return "Ngày chuyển khoản không được ở tương lai";
      return null;
    case "edit":
      if (!perms.has("referrals.pay")) return "Bạn không có quyền sửa số tiền / hạn khoản hoa hồng";
      if (p.status === "cancelled") return "Khoản đã huỷ không sửa được";
      if (p.status === "paid" && (a.amount !== undefined || a.due_date !== undefined)) return "Khoản đã chuyển khoản chỉ được sửa ghi chú";
      return null;
  }
}

export type ReferrerInput = {
  name: string;
  kind: CommissionKind | null;
  ref_codes: string[];
  hr_user_id: string | null;
  phone: string;
  email: string;
  bank_info: string;
  note: string;
  active: boolean;
  rule: CommissionRule | null;
};

/** Đọc + kiểm body tạo/sửa người giới thiệu (400 sai dữ liệu, 409 trùng mã / trùng liên kết tài khoản). */
export function parseReferrerInput(
  v: unknown,
  ctx: { staff: StaffLite[]; referrers: ReferrerLite[]; selfId: string | null },
): ReferrerInput | { error: string; status: 400 | 409 } {
  const bad = (error: string, status: 400 | 409 = 400) => ({ error, status });
  if (!isRecord(v)) return bad("Yêu cầu không hợp lệ");
  const name = typeof v.name === "string" ? v.name.trim() : "";
  if (!name || name.length > 120) return bad("Tên người giới thiệu phải từ 1 đến 120 ký tự");
  const kind = v.kind ?? null;
  if (kind !== null && kind !== "internal" && kind !== "external") return bad("Loại người giới thiệu không hợp lệ");
  const codes = parseRefCodes(v.ref_codes);
  if ("error" in codes) return bad(codes.error);

  const text = (x: unknown, label: string): string | { error: string } => {
    if (x === undefined || x === null) return "";
    if (typeof x !== "string" || x.trim().length > 500) return { error: `${label} tối đa 500 ký tự` };
    return x.trim();
  };
  const phone = text(v.phone, "Số điện thoại");
  const email = text(v.email, "Email");
  const bank = text(v.bank_info, "Thông tin chuyển khoản");
  const note = text(v.note, "Ghi chú");
  for (const t of [phone, email, bank, note]) if (typeof t !== "string") return bad(t.error);

  const hrUserId = v.hr_user_id ?? null;
  if (hrUserId !== null) {
    if (typeof hrUserId !== "string" || !ctx.staff.some((u) => u.id === hrUserId)) return bad("Tài khoản /hr không tồn tại");
    if (codes.length) return bad("Người giới thiệu gắn tài khoản /hr dùng mã của tài khoản, không có mã riêng");
    if (ctx.referrers.some((r) => r.hr_user_id === hrUserId && r.id !== ctx.selfId)) {
      return bad("Tài khoản này đã có hồ sơ người giới thiệu", 409);
    }
  } else if (!codes.length) {
    return bad("Cần ít nhất một mã ref");
  }
  const acct = findRefConflict(codes, ctx.staff, null);
  if (acct) return bad(`Mã ${acct.code} đã thuộc tài khoản ${acct.owner.display_name}`, 409);
  const other = findRefConflict(codes, ctx.referrers, ctx.selfId);
  if (other) return bad(`Mã ${other.code} đã thuộc người giới thiệu ${other.owner.name}`, 409);

  let rule: CommissionRule | null = null;
  if (v.rule !== undefined && v.rule !== null) {
    const r = parseRule(v.rule);
    if ("error" in r) return bad(r.error);
    rule = r;
  }
  if (v.active !== undefined && typeof v.active !== "boolean") return bad("Trạng thái hoạt động không hợp lệ");
  return {
    name,
    kind: hrUserId !== null ? "internal" : kind,
    ref_codes: codes,
    hr_user_id: hrUserId,
    phone: phone as string,
    email: email as string,
    bank_info: bank as string,
    note: note as string,
    active: v.active ?? true,
    rule,
  };
}
