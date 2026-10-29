// Hoa hồng giới thiệu (refer) — lõi thuần, không import server (dùng cả client, route, test).
// Tiền VND số nguyên; ngày YYYY-MM-DD theo giờ VN.

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
export function addMonthsClamped(ymd: string, n: number): string {
  const [y0, m, d] = ymd.split("-").map(Number);
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
  return { amount: Math.floor(rule.amount.multiple * baseSalary), issue: null };
}

/** Trạng thái hiển thị: upcoming đã tới hạn (≤ hôm nay) → due (phòng cron lỗi). */
export function effectiveStatus(p: { status: PayoutStatus; due_date: string | null }, today: string): PayoutStatus {
  return p.status === "upcoming" && p.due_date !== null && p.due_date <= today ? "due" : p.status;
}

export function milestoneLabel(months: number): string {
  return months === 0 ? "Ngay khi đi làm" : `Đủ ${months} tháng`;
}
