// Nhận diện ứng viên trùng / nộp lại — luật thuần (không I/O), spec 2026-11-03-hr-duplicate-candidate-design.
// Sếp chốt 2026-11-03: cửa sổ 6 tháng; auto-reject CHỈ khi trùng email + đúng vị trí đã rejected;
// quyền giới thiệu giữ cho người giới thiệu đầu tiên trong 6 tháng (khớp email hoặc SĐT).

export const DUPLICATE_WINDOW_MONTHS = 6;

export type DuplicateKind = "auto_rejected" | "open_duplicate" | "returning";

export type PriorApp = {
  id: string;
  job_id: string;
  job_title: string | null;
  email: string;
  phone: string | null;
  status: string;
  status_kind: "open" | "won" | "lost" | null;
  status_changed_at: string | null;
  created_at: string;
  referred_by: string | null;
  assignee_user_id: string | null;
  duplicate_kind: DuplicateKind | null;
};

/** Khớp cột sinh `email_norm` (migration 20261103000000): trim + lower-case, rỗng → null. */
export function normalizeEmail(s: unknown): string | null {
  if (typeof s !== "string") return null;
  return s.trim().toLowerCase() || null;
}

/** Khớp cột sinh `phone_norm`: chỉ giữ chữ số, `84` + 9 số → `0…`, dưới 9 chữ số → null. */
export function normalizePhone(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const d = s.replace(/\D/g, "");
  if (d.length < 9) return null;
  return /^84\d{9}$/.test(d) ? `0${d.slice(2)}` : d;
}

const VN_OFFSET_MS = 7 * 3600_000;

/** Ngày (YYYY-MM-DD) theo giờ Việt Nam. */
function vnDate(iso: string): string {
  return new Date(new Date(iso).getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** Ngày VN của `iso` + `months` tháng lịch (ngày cuối tháng bị kẹp: 31/08 + 6 → 28/02). */
export function addMonthsVn(iso: string, months: number): string {
  const [y, m, d] = vnDate(iso).split("-").map(Number);
  const total = m - 1 + months;
  const ty = y + Math.floor(total / 12);
  const tm = ((total % 12) + 12) % 12;
  const last = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return `${ty}-${String(tm + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

/** Còn trong cửa sổ 6 tháng tính từ `since` (so theo ngày VN). */
function withinWindow(since: string, now: string): boolean {
  return vnDate(now) < addMonthsVn(since, DUPLICATE_WINDOW_MONTHS);
}

const titleKey = (t: string | null) => (t ?? "").trim().toLowerCase();

/** Cùng vị trí: cùng job, hoặc job đăng lại có tiêu đề giống hệt (trim, không phân biệt hoa thường). */
export function sameRole(
  a: { job_id: string; job_title: string | null },
  b: { job_id: string; job_title: string | null },
): boolean {
  if (a.job_id === b.job_id) return true;
  const ta = titleKey(a.job_title);
  return ta !== "" && ta === titleKey(b.job_title);
}

type Who = { email: string; phone: string | null };

function matchBy(input: Who, p: PriorApp): { email: boolean; phone: boolean } {
  const e = normalizeEmail(input.email);
  const ph = normalizePhone(input.phone);
  return {
    email: !!e && normalizeEmail(p.email) === e,
    phone: !!ph && normalizePhone(p.phone) === ph,
  };
}

const newest = (a: PriorApp, b: PriorApp) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0);
const rejectedAtOf = (p: PriorApp) => p.status_changed_at ?? p.created_at;

/**
 * Phân loại đơn mới so với các hồ sơ cũ (caller được truyền dư — hàm tự lọc theo email/SĐT).
 * Ưu tiên: auto_rejected → open_duplicate → returning. Hồ sơ `auto_rejected` không bao giờ là mốc trượt.
 */
export function classifyDuplicate(
  input: Who & { job_id: string; job_title: string | null; now: string },
  priors: PriorApp[],
): { kind: DuplicateKind; prior: PriorApp; rejectedAt: string | null; reapplyFrom: string | null } | null {
  const matched = priors
    .map((p) => ({ p, m: matchBy(input, p) }))
    .filter((x) => x.m.email || x.m.phone)
    .sort((a, b) => newest(a.p, b.p));
  if (matched.length === 0) return null;

  const rejections = matched
    .filter(({ p, m }) => m.email && p.status === "rejected" && p.duplicate_kind !== "auto_rejected" && sameRole(input, p))
    .map(({ p }) => p)
    .sort((a, b) => (rejectedAtOf(a) < rejectedAtOf(b) ? 1 : -1));
  const lastRejection = rejections[0];
  if (lastRejection && withinWindow(rejectedAtOf(lastRejection), input.now)) {
    const rejectedAt = rejectedAtOf(lastRejection);
    return {
      kind: "auto_rejected",
      prior: lastRejection,
      rejectedAt,
      reapplyFrom: addMonthsVn(rejectedAt, DUPLICATE_WINDOW_MONTHS),
    };
  }

  const open = matched.find(({ p }) => p.status_kind === "open" && sameRole(input, p));
  if (open) return { kind: "open_duplicate", prior: open.p, rejectedAt: null, reapplyFrom: null };

  const same = matched.find(({ p }) => sameRole(input, p));
  return { kind: "returning", prior: (same ?? matched[0]).p, rejectedAt: null, reapplyFrom: null };
}

/** Người giới thiệu đầu tiên còn hiệu lực: hồ sơ khớp (email/SĐT) SỚM NHẤT có mã ref, nộp trong 6 tháng. */
export function firstReferral(input: Who & { now: string }, priors: PriorApp[]): PriorApp | null {
  const withRef = priors
    .filter((p) => (p.referred_by ?? "").trim() !== "" && withinWindow(p.created_at, input.now))
    .filter((p) => {
      const m = matchBy(input, p);
      return m.email || m.phone;
    })
    .sort((a, b) => -newest(a, b));
  return withRef[0] ?? null;
}
