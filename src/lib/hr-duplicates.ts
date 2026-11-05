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

/**
 * Khớp cột sinh `phone_norm` (migration 20261103010000): chỉ giữ chữ số; `84` + 9 số hoặc `840` + 9 số → `0…`;
 * 9 số bắt đầu 2/3/5/7/8/9 (số VN thiếu 0 đầu) → `0…`; dưới 9 chữ số → null. Số nước ngoài giữ nguyên.
 */
export function normalizePhone(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const d = s.replace(/\D/g, "");
  if (d.length < 9) return null;
  if (/^840?\d{9}$/.test(d)) return `0${d.slice(-9)}`;
  if (/^[235789]\d{8}$/.test(d)) return `0${d}`;
  return d;
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

const titleKey = (t: string | null) => (t ?? "").normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();

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
  input: Who & { job_id: string; job_title: string | null; now: string; work_type?: string | null },
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
  // Freelancer không có Reject (kho freelancer 2026-11-05) → không tự từ chối, rơi xuống open/returning.
  if (lastRejection && input.work_type !== "freelancer" && withinWindow(rejectedAtOf(lastRejection), input.now)) {
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

  // Ưu tiên hồ sơ thật (không phải đơn auto_rejected) làm hồ sơ gốc.
  const real = matched.filter(({ p }) => p.duplicate_kind !== "auto_rejected");
  const pool = real.length > 0 ? real : matched;
  const same = pool.find(({ p }) => sameRole(input, p));
  return { kind: "returning", prior: (same ?? pool[0]).p, rejectedAt: null, reapplyFrom: null };
}

/**
 * Người giới thiệu đầu tiên còn hiệu lực. Đi theo thời gian qua các hồ sơ khớp EMAIL có mã ref: hồ sơ đầu tiên giữ
 * quyền 6 tháng tính từ ngày nộp; hồ sơ có mã trong thời hạn đó (thừa kế mã, hoặc người khác refer) không gia hạn
 * và không cướp quyền; hết hạn thì hồ sơ có mã kế tiếp mở quyền mới. Bỏ qua đơn auto_rejected (bị từ chối thì không
 * giữ quyền). Không tính khớp chỉ SĐT: SĐT dễ đoán → nộp đơn giả bằng SĐT ứng viên để chiếm quyền giới thiệu.
 */
export function firstReferral(input: Who & { now: string }, priors: PriorApp[]): PriorApp | null {
  const rows = priors
    .filter((p) => (p.referred_by ?? "").trim() !== "" && p.duplicate_kind !== "auto_rejected" && matchBy(input, p).email)
    .sort((a, b) => -newest(a, b));
  let anchor: PriorApp | null = null;
  for (const p of rows) {
    if (!anchor || !withinWindow(anchor.created_at, p.created_at)) anchor = p;
  }
  return anchor && withinWindow(anchor.created_at, input.now) ? anchor : null;
}

// ── Tin báo (Discord / push) ──
// Không bao giờ nêu người giới thiệu trước, lý do, điểm, hay chữ "trượt" ở tin gửi người giới thiệu.

/**
 * Quyền giới thiệu có chuyển sang người đầu tiên không. Khoá chủ: "u:<hr_user>" / "r:<referrer>" / "c:<mã lạ>".
 * Không có người đầu → không đổi; tự nộp không mã (null) trong 6 tháng → vẫn thuộc người đầu (sếp chốt 2026-11-03).
 */
export function referrerChanged(submittedOwnerKey: string | null, firstOwnerKey: string | null): boolean {
  if (!firstOwnerKey) return false;
  return submittedOwnerKey !== firstOwnerKey;
}

/**
 * Quyết định về người giới thiệu cho đơn mới. `overwrite`: ghi mã người đầu thay mã B (B lưu ở referred_by_submitted).
 * `notify`: báo B ("auto_rejected" — B khác người đầu, kể cả khi không có người đầu; "taken" — quyền thuộc người đầu).
 * `needsManualNotice`: B không có tài khoản /hr → HR phải báo tay (dòng "Cần báo người giới thiệu").
 */
export function referralDecision(i: {
  dupKind: DuplicateKind | null;
  submittedOwnerKey: string | null;
  firstOwnerKey: string | null;
}): { overwrite: boolean; notify: "auto_rejected" | "taken" | null; needsManualNotice: boolean } {
  const overwrite = referrerChanged(i.submittedOwnerKey, i.firstOwnerKey);
  const bIsOther = !!i.submittedOwnerKey && i.submittedOwnerKey !== i.firstOwnerKey;
  const notify = i.dupKind === "auto_rejected" && bIsOther ? "auto_rejected" : overwrite && i.submittedOwnerKey ? "taken" : null;
  return { overwrite, notify, needsManualNotice: !!notify && !i.submittedOwnerKey!.startsWith("u:") };
}

/** "2026-05-02T20:00:00Z" → "03/05/2026" (giờ VN); "2027-03-02" → "02/03/2027". */
export function formatDateVnShort(isoOrDate: string): string {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate) ? isoOrDate : vnDate(isoOrDate);
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

export function teamAutoRejectText(i: {
  name: string;
  jobTitle: string;
  rejectedAt: string;
  priorUrl: string;
  mailSent: boolean;
  /** Mã người giới thiệu lần này — để lại dấu vết (chống dùng form công khai dò ứng viên). */
  submittedCode?: string | null;
}): string {
  const mail = i.mailSent ? "Đã gửi mail báo ứng viên." : "Chưa gửi được mail cho ứng viên (mail tự động đang tắt / chạm giới hạn / vừa gửi trong 24 giờ) — HR gửi tay nếu cần.";
  const via = i.submittedCode ? ` (giới thiệu lần này: ${i.submittedCode})` : "";
  return `🔁 Tự động từ chối: **${i.name}** nộp lại **${i.jobTitle}**${via} — hồ sơ trước đã có kết quả không phù hợp ngày ${i.rejectedAt} (${i.priorUrl}). ${mail}`;
}

/** Tin cho người giới thiệu B: không nêu ngày nộp cũ / kết quả (B có thể dùng form công khai để dò). */
export function referrerAutoRejectText(i: { name: string; jobTitle: string; reapplyFrom: string }): string {
  return `🔁 Ứng viên **${i.name}** bạn giới thiệu cho vị trí **${i.jobTitle}** đã có hồ sơ cho vị trí này gần đây nên hệ thống không nhận thêm hồ sơ lần này (đã gửi mail lịch sự cho ứng viên). Có thể giới thiệu lại từ ngày ${i.reapplyFrom}.`;
}

export function referrerTakenText(i: { name: string; jobTitle: string }): string {
  return `🔁 Ứng viên **${i.name}** (${i.jobTitle}) bạn giới thiệu đã được giới thiệu trước đó trong vòng 6 tháng. Hồ sơ vẫn được xét bình thường; hoa hồng (nếu có) thuộc người giới thiệu trước.`;
}

/** Người giới thiệu không có tài khoản /hr → nhờ người phụ trách báo lại. */
export function askHrToTellReferrerText(i: { referrer: string; contact: string | null; base: string }): string {
  const who = i.contact ? `${i.referrer} (${i.contact})` : i.referrer;
  return `${i.base}\n👉 Người giới thiệu: ${who} — chưa có tài khoản /hr, nhờ người phụ trách báo lại giúp.`;
}

/** Dòng thêm vào tin "đơn mới" khi người này đã từng nộp. */
/** Dòng thêm vào tin "đơn mới" (kênh chung): chỉ báo có hồ sơ cũ, chi tiết xem trên /hr (có phân quyền). */
export function duplicateNoticeLine(i: { kind: DuplicateKind }): string {
  return i.kind === "open_duplicate"
    ? "🔁 Nộp trùng — người này đang có hồ sơ khác cùng vị trí (xem mục Hồ sơ khác trên /hr)"
    : "🔁 Đã từng ứng tuyển (xem mục Hồ sơ khác trên /hr)";
}
