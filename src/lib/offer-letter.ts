/**
 * Thư mời nhận việc (PDF đính kèm mail offer) — phần thuần (không I/O, không server-only):
 * kiểu dữ liệu, mẫu mặc định công ty (chép từ file Word gốc), dựng / gộp / ép kiểu / kiểm tra
 * dữ liệu form, định dạng tiền + ngày tiếng Việt, tên file. Render PDF ở `offer-letter-pdf.tsx`.
 */

export type ScheduleItem = { time: string; task: string };
export type Allowance = { name: string; amount: number | null };

/** Mẫu mặc định công ty (app_settings `offer_letter_defaults`), sửa trong tab Mẫu mail. */
export type OfferLetterDefaults = {
  intro: string;
  location: string;
  workingHours: string;
  /** "HH:MM" */
  startTime: string;
  allowanceNames: string[];
  probationNote: string;
  computer: string;
  phone: string;
  parkingAllowance: string;
  otherBenefits: string[];
  workEmail: string;
  documents: string[];
  documentsNote: string;
  schedule: ScheduleItem[];
  closing: string;
  signerTitle: string;
  signerName: string;
};

/** Dữ liệu 1 thư (bảng offer_letters.data; snapshot trong candidate_emails.attachments). */
export type OfferLetterData = {
  candidateName: string;
  jobTitle: string;
  /** "YYYY-MM-DD" | "" */
  startDate: string;
  /** "HH:MM" */
  startTime: string;
  baseSalary: number | null;
  allowances: Allowance[];
  probationNote: string;
  location: string;
  workingHours: string;
  computer: string;
  phone: string;
  parkingAllowance: string;
  otherBenefits: string[];
  workEmail: string;
  documents: string[];
  documentsNote: string;
  schedule: ScheduleItem[];
  intro: string;
  closing: string;
  signerTitle: string;
  signerName: string;
  /** Hạn xác nhận "YYYY-MM-DD" | "" (trống → tính lúc soạn mail: hôm nay + 3 ngày làm việc). */
  confirmBy: string;
};

export const DEFAULT_OFFER_LETTER_DEFAULTS: OfferLetterDefaults = {
  intro:
    "Qua quá trình phỏng vấn và trao đổi với bạn, chúng tôi tin rằng bạn phù hợp với Công ty về năng lực chuyên môn cũng như văn hoá doanh nghiệp. Chúng tôi rất hân hạnh được mời bạn gia nhập TD Games với thông tin cụ thể như sau:",
  location: "Văn phòng TD Games – Tầng 4, 505 Minh Khai, Hai Bà Trưng, Hà Nội",
  workingHours: "Từ thứ Hai đến thứ Sáu, 8:30 – 17:30",
  startTime: "08:45",
  allowanceNames: ["Xăng xe", "Điện thoại", "Ăn trưa", "Trang phục", "KPI", "Khác"],
  probationNote: "Thử việc 2 tháng (hưởng 100% lương)",
  computer: "Sử dụng máy tính công ty",
  phone: "Sử dụng điện thoại công ty",
  parkingAllowance: "Công ty trả phí gửi xe hằng tháng cho nhân viên",
  otherBenefits: [
    "Quà các dịp Lễ Tết: Tết Âm lịch, Tết Dương lịch, Trung thu, sinh nhật…",
    "Đồ uống, snack tại văn phòng hằng ngày",
    "Liên hoan “Happy Time” thứ Sáu cuối mỗi quý",
    "Du lịch công ty",
    "Các chính sách, trợ cấp mới của Công ty (nếu có) sẽ được áp dụng cho bạn để đảm bảo quyền lợi, bình đẳng",
  ],
  workEmail:
    "Tạo email công việc theo định dạng: tên + chữ cái đầu họ, tên đệm + .tdgames@gmail.com (ví dụ: toandt.tdgames@gmail.com — Đặng Thế Toàn)",
  documents: [
    "Sơ yếu lý lịch tự thuật có công chứng",
    "Bản sao công chứng CMND/CCCD",
    "Giấy khám sức khoẻ",
  ],
  documentsNote: "Nộp trong tuần đầu làm việc cho bộ phận Nhân sự",
  schedule: [
    { time: "8:45 – 9:00", task: "Ổn định vị trí, chuẩn bị bắt đầu" },
    { time: "9:00 – 10:00", task: "Hoàn tất thủ tục hành chính (checklist onboard)" },
    { time: "10:00 – 11:00", task: "Training hội nhập (giới thiệu công ty, văn hoá, quy trình làm việc)" },
    { time: "11:00 – 12:00", task: "Hoàn tất thủ tục hành chính (checklist onboard)" },
    { time: "12:00 – 13:00", task: "Nghỉ trưa" },
    { time: "13:00 – 17:00", task: "Làm việc" },
  ],
  closing:
    "Chúng tôi hi vọng rằng cùng với sự phát triển của Công ty, bạn sẽ có nhiều cơ hội trau dồi chuyên môn, phát triển bản thân và phát huy tối đa khả năng để đóng góp vào sự thành công của Công ty.",
  signerTitle: "GIÁM ĐỐC",
  signerName: "Đặng Thế Toàn",
};

export const OFFER_MAX_AMOUNT = 1e10;
// Giới hạn vừa đủ dùng thật, đồng thời chặn PDF quá to (render tốn CPU, xem offer-letter-pdf.tsx).
export const OFFER_MAX_ITEMS = 15;
export const OFFER_MAX_TEXT = 300;
export const OFFER_MAX_PARAGRAPH = 1500;

// ── Ngày giờ ──

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const WEEKDAY = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** "YYYY-MM-DD" có thật trên lịch → Date (UTC 00:00); ngược lại null. */
function parseDate(s: string): Date | null {
  const m = DATE_RE.exec(s);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3])
    ? d
    : null;
}

export function isValidDate(s: string): boolean {
  return parseDate(s) !== null;
}

export function isValidTime(s: string): boolean {
  return TIME_RE.test(s);
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Ngày hôm nay (theo giờ Việt Nam) dạng "YYYY-MM-DD". */
export function vnDateString(now: Date): string {
  return toIsoDate(new Date(now.getTime() + 7 * 60 * 60 * 1000));
}

/** Cộng n ngày làm việc (bỏ T7/CN) vào "YYYY-MM-DD". Ngày sai → trả nguyên. */
export function addWorkingDays(date: string, n: number): string {
  const d = parseDate(date);
  if (!d) return date;
  let left = Math.max(0, Math.floor(n));
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return toIsoDate(d);
}

/** "Thứ Sáu 30/10/2026"; ngày sai → "". */
export function formatDateVi(date: string): string {
  const d = parseDate(date);
  if (!d) return "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${WEEKDAY[d.getUTCDay()]} ${dd}/${mm}/${d.getUTCFullYear()}`;
}

/** "8:45, Thứ Hai 12/10/2026" (bỏ số 0 đầu giờ); thiếu giờ → chỉ ngày; ngày sai → "". */
export function formatStartVi(date: string, time: string): string {
  const day = formatDateVi(date);
  if (!day) return "";
  const t = TIME_RE.exec(time);
  return t ? `${Number(t[1])}:${t[2]}, ${day}` : day;
}

/** 12560000 → "12.560.000 VND" (làm tròn tới đồng). */
export function formatVnd(n: number): string {
  const v = Math.round(n);
  const s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${v < 0 ? "-" : ""}${s} VND`;
}

// ── Dựng / gộp ──

/**
 * Thư mới cho 1 hồ sơ: mẫu công ty + tên/chức danh từ hồ sơ; số tiền trống.
 * Hạn xác nhận để trống — tính lúc soạn mail (hôm nay + 3 ngày làm việc), không chốt từ lúc mở form.
 */
export function buildOfferLetterData(
  defaults: OfferLetterDefaults,
  ctx: { candidateName: string; jobTitle: string; today: Date },
): OfferLetterData {
  return {
    candidateName: ctx.candidateName.trim(),
    jobTitle: ctx.jobTitle.trim(),
    startDate: "",
    startTime: defaults.startTime,
    baseSalary: null,
    allowances: defaults.allowanceNames.map((name) => ({ name, amount: null })),
    probationNote: defaults.probationNote,
    location: defaults.location,
    workingHours: defaults.workingHours,
    computer: defaults.computer,
    phone: defaults.phone,
    parkingAllowance: defaults.parkingAllowance,
    otherBenefits: [...defaults.otherBenefits],
    workEmail: defaults.workEmail,
    documents: [...defaults.documents],
    documentsNote: defaults.documentsNote,
    schedule: defaults.schedule.map((s) => ({ ...s })),
    intro: defaults.intro,
    closing: defaults.closing,
    signerTitle: defaults.signerTitle,
    signerName: defaults.signerName,
    confirmBy: "",
  };
}

/** Dữ liệu đã lưu (có thể thiếu key do mẫu cũ) đè lên thư dựng mới. Key thiếu → lấy từ `built`. */
export function mergeOfferLetter(saved: Partial<OfferLetterData> | null, built: OfferLetterData): OfferLetterData {
  if (!saved || typeof saved !== "object") return built;
  const merged: Record<string, unknown> = { ...built };
  for (const k of Object.keys(built)) {
    const v = (saved as Record<string, unknown>)[k];
    if (v !== undefined) merged[k] = v;
  }
  return sanitizeOfferLetter(merged);
}

/** Tổng lương gross = lương cơ bản + phụ cấp có số tiền. */
export function offerTotal(data: OfferLetterData): number {
  let total = data.baseSalary ?? 0;
  for (const a of data.allowances) if (a.amount !== null) total += a.amount;
  return total;
}

// ── Ép kiểu từ JSON client ──

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim()) : [];
}

/** Số tiền: number hữu hạn, hoặc chuỗi chữ số (cho phép dấu . , khoảng trắng phân cách). Trống/sai → null. */
function amount(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const t = v.trim();
    // "12.000.000" / "12 000 000" / "12000000"; dạng khác (âm, dấu phẩy, chữ) → null.
    return /^\d{1,3}([.\s]\d{3})*$|^\d+$/.test(t) ? Number(t.replace(/[.\s]/g, "")) : null;
  }
  return null;
}

/** "8:45" → "08:45"; dạng khác giữ nguyên để validate báo lỗi. */
function normTime(v: unknown): string {
  const s = str(v);
  return /^\d:\d{2}$/.test(s) ? `0${s}` : s;
}

function scheduleList(v: unknown): ScheduleItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x))
    .map((x) => ({ time: str(x.time), task: str(x.task) }));
}

export function sanitizeOfferLetter(input: unknown): OfferLetterData {
  const o = (input && typeof input === "object" && !Array.isArray(input) ? input : {}) as Record<string, unknown>;
  const allowances = Array.isArray(o.allowances)
    ? o.allowances
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x))
        .map((x) => ({ name: str(x.name), amount: amount(x.amount) }))
    : [];
  return {
    candidateName: str(o.candidateName),
    jobTitle: str(o.jobTitle),
    startDate: str(o.startDate),
    startTime: normTime(o.startTime),
    baseSalary: amount(o.baseSalary),
    allowances,
    probationNote: str(o.probationNote),
    location: str(o.location),
    workingHours: str(o.workingHours),
    computer: str(o.computer),
    phone: str(o.phone),
    parkingAllowance: str(o.parkingAllowance),
    otherBenefits: strList(o.otherBenefits),
    workEmail: str(o.workEmail),
    documents: strList(o.documents),
    documentsNote: str(o.documentsNote),
    schedule: scheduleList(o.schedule),
    intro: str(o.intro),
    closing: str(o.closing),
    signerTitle: str(o.signerTitle),
    signerName: str(o.signerName),
    confirmBy: str(o.confirmBy),
  };
}

/** Mẫu công ty từ app_settings (JSON có thể thiếu key / sai kiểu) → đủ trường; thiếu lấy DEFAULT. */
export function sanitizeOfferLetterDefaults(input: unknown): OfferLetterDefaults {
  const D = DEFAULT_OFFER_LETTER_DEFAULTS;
  const o = (input && typeof input === "object" && !Array.isArray(input) ? input : {}) as Record<string, unknown>;
  const s = (k: keyof OfferLetterDefaults) => (typeof o[k] === "string" ? (o[k] as string).trim() : (D[k] as string));
  const l = (k: "allowanceNames" | "otherBenefits" | "documents") => (Array.isArray(o[k]) ? strList(o[k]) : [...D[k]]);
  return {
    intro: s("intro"),
    location: s("location"),
    workingHours: s("workingHours"),
    startTime: typeof o.startTime === "string" ? normTime(o.startTime) : D.startTime,
    allowanceNames: l("allowanceNames"),
    probationNote: s("probationNote"),
    computer: s("computer"),
    phone: s("phone"),
    parkingAllowance: s("parkingAllowance"),
    otherBenefits: l("otherBenefits"),
    workEmail: s("workEmail"),
    documents: l("documents"),
    documentsNote: s("documentsNote"),
    schedule: Array.isArray(o.schedule) ? scheduleList(o.schedule) : D.schedule.map((x) => ({ ...x })),
    closing: s("closing"),
    signerTitle: s("signerTitle"),
    signerName: s("signerName"),
  };
}

// ── Kiểm tra ──

const TEXT_LABEL: Record<string, string> = {
  candidateName: "Tên ứng viên",
  jobTitle: "Chức danh",
  probationNote: "Ghi chú thử việc",
  location: "Địa điểm làm việc",
  workingHours: "Thời gian làm việc",
  computer: "Máy tính làm việc",
  phone: "Điện thoại",
  parkingAllowance: "Trợ cấp gửi xe",
  workEmail: "Email công việc",
  documentsNote: "Ghi chú giấy tờ",
  signerTitle: "Chức vụ người ký",
  signerName: "Tên người ký",
};
const PARAGRAPH_LABEL: Record<string, string> = { intro: "Đoạn mở đầu", closing: "Đoạn kết" };
const LIST_LABEL: Record<string, string> = {
  otherBenefits: "Phúc lợi khác",
  documents: "Giấy tờ cần chuẩn bị",
  schedule: "Lịch trình ngày đầu",
  allowances: "Phụ cấp",
  allowanceNames: "Phụ cấp",
};

function checkTexts(o: Record<string, unknown>): string | null {
  for (const [k, label] of Object.entries(TEXT_LABEL)) {
    if (typeof o[k] === "string" && (o[k] as string).length > OFFER_MAX_TEXT) return `${label} tối đa ${OFFER_MAX_TEXT} ký tự`;
  }
  for (const [k, label] of Object.entries(PARAGRAPH_LABEL)) {
    if (typeof o[k] === "string" && (o[k] as string).length > OFFER_MAX_PARAGRAPH) return `${label} tối đa ${OFFER_MAX_PARAGRAPH} ký tự`;
  }
  for (const [k, label] of Object.entries(LIST_LABEL)) {
    const v = o[k];
    if (!Array.isArray(v)) continue;
    if (v.length > OFFER_MAX_ITEMS) return `${label}: tối đa ${OFFER_MAX_ITEMS} mục`;
    for (const item of v) {
      const parts = typeof item === "string" ? [item] : item && typeof item === "object" ? Object.values(item).filter((x) => typeof x === "string") : [];
      if ((parts as string[]).some((p) => p.length > OFFER_MAX_TEXT)) return `${label}: mỗi mục tối đa ${OFFER_MAX_TEXT} ký tự`;
    }
  }
  return null;
}

function checkAmount(n: number | null, label: string): string | null {
  if (n === null) return null;
  if (!Number.isFinite(n) || n < 0 || n > OFFER_MAX_AMOUNT) return `${label} phải từ 0 đến 10.000.000.000`;
  return null;
}

/** Chỉ giới hạn độ dài / số mục / số tiền (cho xem trước bản nháp chưa đủ trường). */
export function validateOfferLetterLimits(data: OfferLetterData): string | null {
  const t = checkTexts(data as unknown as Record<string, unknown>);
  if (t) return t;
  const b = checkAmount(data.baseSalary, "Lương cơ bản");
  if (b) return b;
  for (const [i, a] of data.allowances.entries()) {
    const e = checkAmount(a.amount, `Phụ cấp “${a.name || `dòng ${i + 1}`}”`);
    if (e) return e;
    if (a.amount !== null && !a.name) return `Phụ cấp dòng ${i + 1} có số tiền nhưng thiếu tên`;
  }
  if (data.startDate && !isValidDate(data.startDate)) return "Ngày bắt đầu không hợp lệ";
  if (data.startTime && !isValidTime(data.startTime)) return "Giờ bắt đầu không hợp lệ (dạng 08:45)";
  if (data.confirmBy && !isValidDate(data.confirmBy)) return "Hạn xác nhận không hợp lệ";
  return null;
}

/** Lỗi tiếng Việt hoặc null. Bắt buộc: tên ứng viên, chức danh, ngày bắt đầu, lương cơ bản > 0. */
export function validateOfferLetter(data: OfferLetterData): string | null {
  if (!data.candidateName.trim()) return "Thiếu tên ứng viên";
  if (!data.jobTitle.trim()) return "Thiếu chức danh";
  if (!isValidDate(data.startDate)) return "Thiếu ngày bắt đầu làm việc (hoặc ngày không hợp lệ)";
  if (!isValidTime(data.startTime)) return "Giờ bắt đầu không hợp lệ (dạng 08:45)";
  if (data.baseSalary === null || !(data.baseSalary > 0)) return "Thiếu lương cơ bản";
  const limits = validateOfferLetterLimits(data);
  if (limits) return limits;
  // So chuỗi YYYY-MM-DD = so ngày.
  if (data.confirmBy && data.confirmBy > data.startDate) return "Hạn xác nhận phải trước hoặc đúng ngày bắt đầu làm việc";
  return null;
}

export function validateOfferLetterDefaults(d: OfferLetterDefaults): string | null {
  if (!isValidTime(d.startTime)) return "Giờ bắt đầu mặc định không hợp lệ (dạng 08:45)";
  return checkTexts(d as unknown as Record<string, unknown>);
}

// ── Tên file ──

/** "Thư mời nhận việc - {Tên}.pdf", bỏ ký tự cấm trong tên file. */
export function offerFileName(candidateName: string): string {
  const name = candidateName
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100)
    .trim();
  return `Thư mời nhận việc - ${name || "Ứng viên"}.pdf`;
}

// ── Mail offer ──

export const NO_OFFER_LETTER = "Chưa soạn thư mời nhận việc — bấm “Soạn thư mời” trong khối Offer trước";

/**
 * Hạn xác nhận dùng khi soạn mail: trống → hôm nay (giờ VN) + 3 ngày làm việc;
 * đã lưu nhưng đã qua → tính lại từ hôm nay và trả `notice` để báo người gửi.
 */
export function resolveConfirmBy(saved: string, today: Date): { date: string; notice: string | null } {
  const todayVn = vnDateString(today);
  const fresh = addWorkingDays(todayVn, 3);
  if (!isValidDate(saved)) return { date: fresh, notice: null };
  if (saved < todayVn) return { date: fresh, notice: `Hạn xác nhận đã qua — đã tự đổi thành ${formatDateVi(fresh)}` };
  return { date: saved, notice: null };
}

/** Chuỗi đã định dạng cho các biến mail offer (DraftInput.offer) + thông báo nếu hạn xác nhận bị đổi. */
export function offerDraftFields(data: OfferLetterData, contact: string, today: Date) {
  const confirm = resolveConfirmBy(data.confirmBy, today);
  return {
    fields: {
      title: data.jobTitle,
      start: formatStartVi(data.startDate, data.startTime),
      workingHours: data.workingHours,
      location: data.location,
      confirmBy: formatDateVi(confirm.date),
      contact,
      fileName: offerFileName(data.candidateName),
    },
    notice: confirm.notice,
  };
}
