/**
 * Kho freelancer trên /hr (spec docs/superpowers/specs/2026-11-05-hr-freelancer-pool-design.md) — phần thuần.
 * Freelancer không đi pipeline fulltime: `status` cố định 'freelancer', tiến độ nằm ở `freelance_stage`.
 */

export const FREELANCE_STAGES = ["new", "talking", "testing", "collaborated", "not_fit"] as const;
export type FreelanceStage = (typeof FREELANCE_STAGES)[number];
export const STAGE_LABEL: Record<FreelanceStage, string> = {
  new: "Mới",
  talking: "Đang trao đổi",
  testing: "Đang test",
  collaborated: "Đã hợp tác",
  not_fit: "Chưa phù hợp",
};

export const FREELANCE_LEVELS = ["fresher", "junior", "middle", "senior"] as const;
export type FreelanceLevel = (typeof FREELANCE_LEVELS)[number];
export const LEVEL_LABEL: Record<FreelanceLevel, string> = {
  fresher: "Fresher",
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
};

export const RATE_MIN = 10_000;
export const RATE_MAX = 100_000_000;

export function isFreelanceApp(a: { work_type?: string | null }): boolean {
  return a.work_type === "freelancer";
}

export function isFreelanceStage(v: unknown): v is FreelanceStage {
  return typeof v === "string" && (FREELANCE_STAGES as readonly string[]).includes(v);
}

export function isFreelanceLevel(v: unknown): v is FreelanceLevel {
  return typeof v === "string" && (FREELANCE_LEVELS as readonly string[]).includes(v);
}

/** Rate VNĐ/giờ: số nguyên trong [10.000, 100.000.000]. Chuỗi chỉ được có số, . , khoảng trắng và đ/VND/VNĐ. */
export function parseRateVnd(v: unknown): number | null {
  let n: number;
  if (typeof v === "number") n = v;
  else if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    const letters = s.toLowerCase().replace(/vnđ|vnd|đ/g, "").replace(/[\d.,\s]/g, "");
    if (letters) return null;
    const digits = s.replace(/\D/g, "");
    if (!digits) return null;
    n = Number(digits);
  } else return null;
  return Number.isInteger(n) && n >= RATE_MIN && n <= RATE_MAX ? n : null;
}

export function formatRateVnd(n: number | null | undefined): string {
  return typeof n === "number" ? `${n.toLocaleString("vi-VN").replace(/,/g, ".")}đ/giờ` : "—";
}

export type FreelanceFilter = {
  jobId: string | null;
  /** "none" = chưa gắn hạng. */
  level: FreelanceLevel | "none" | null;
  stage: FreelanceStage | null;
  rateMin: number | null;
  rateMax: number | null;
  collaborated: boolean;
  issue: boolean;
  jobNotOpen: boolean;
  q: string;
};

export type FreelanceRow = {
  job_id: string;
  full_name: string;
  email?: string | null;
  freelance_stage?: string | null;
  freelance_level?: string | null;
  rate_vnd_per_hour?: number | null;
  freelance_issue?: boolean | null;
  freelance_job_open?: boolean | null;
};

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();

export function filterFreelancers<T extends FreelanceRow>(rows: T[], f: FreelanceFilter): T[] {
  const q = fold(f.q);
  return rows.filter((r) => {
    if (f.jobId && r.job_id !== f.jobId) return false;
    if (f.level === "none" ? !!r.freelance_level : f.level && r.freelance_level !== f.level) return false;
    if (f.stage && (r.freelance_stage ?? "new") !== f.stage) return false;
    if (f.rateMin != null || f.rateMax != null) {
      const rate = r.rate_vnd_per_hour;
      if (rate == null) return false;
      if (f.rateMin != null && rate < f.rateMin) return false;
      if (f.rateMax != null && rate > f.rateMax) return false;
    }
    if (f.collaborated && r.freelance_stage !== "collaborated") return false;
    if (f.issue && !r.freelance_issue) return false;
    if (f.jobNotOpen && r.freelance_job_open !== false) return false;
    if (q && !fold(r.full_name).includes(q) && !fold(r.email ?? "").includes(q)) return false;
    return true;
  });
}

/** Trường freelancer HR sửa được qua PATCH /api/hr/applications/[id]. */
export const FREELANCE_PATCH_KEYS = ["freelance_stage", "freelance_level", "rate_vnd_per_hour", "freelance_issue"] as const;

/**
 * Kiểm body PATCH theo hình thức hồ sơ. Lỗi (tiếng Việt) hoặc null.
 * Freelancer: không đổi `status` (status cố định 'freelancer'). Fulltime: không đặt status 'freelancer',
 * không có trường freelancer. `convert_work_type` đổi hình thức, không đi kèm `status`.
 */
export function checkFreelancePatch(old: { work_type: string; status: string }, body: Record<string, unknown>): string | null {
  const fl = isFreelanceApp(old);
  if ("convert_work_type" in body) {
    const to = body.convert_work_type;
    if (to !== "freelancer" && to !== "fulltime") return "Hình thức không hợp lệ";
    if ((to === "freelancer") === fl) return "Hồ sơ đã là hình thức này";
    if ("status" in body) return "Không đổi trạng thái cùng lúc với đổi hình thức";
  }
  if ("status" in body) {
    if (fl) return "Hồ sơ freelancer không đổi trạng thái pipeline — dùng trạng thái freelancer";
    if (body.status === "freelancer") return "Dùng “Chuyển sang freelancer” thay vì kéo vào cột Freelancer";
  }
  const fKeys = FREELANCE_PATCH_KEYS.filter((k) => k in body);
  if (fKeys.length && !fl) return "Trường này chỉ dành cho hồ sơ freelancer";
  if ("freelance_stage" in body && !isFreelanceStage(body.freelance_stage)) return "Trạng thái freelancer không hợp lệ";
  if ("freelance_level" in body) {
    const v = body.freelance_level;
    if (v !== null && v !== "" && !isFreelanceLevel(v)) return "Hạng không hợp lệ";
  }
  if ("rate_vnd_per_hour" in body) {
    const v = body.rate_vnd_per_hour;
    if (v !== null && v !== "" && parseRateVnd(v) == null) return "Rate phải là số VNĐ/giờ từ 10.000";
  }
  if ("freelance_issue" in body && typeof body.freelance_issue !== "boolean") return "Giá trị không hợp lệ";
  return null;
}

/** Cột cần ghi cho body đã qua `checkFreelancePatch`. `jobOpen` = job hiện có nhận freelancer (khi đổi sang freelancer). */
export function freelancePatchFields(body: Record<string, unknown>, ctx: { jobOpen: boolean }): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if ("freelance_stage" in body) out.freelance_stage = body.freelance_stage;
  if ("freelance_level" in body) out.freelance_level = body.freelance_level || null;
  if ("rate_vnd_per_hour" in body) out.rate_vnd_per_hour = body.rate_vnd_per_hour === "" ? null : parseRateVnd(body.rate_vnd_per_hour);
  if ("freelance_issue" in body) out.freelance_issue = body.freelance_issue;
  if (body.convert_work_type === "freelancer") {
    Object.assign(out, { work_type: "freelancer", status: "freelancer", freelance_stage: "new", freelance_job_open: ctx.jobOpen });
  } else if (body.convert_work_type === "fulltime") {
    Object.assign(out, { work_type: "fulltime", status: "new" });
  }
  return out;
}

/** Status cố định của hồ sơ freelancer. */
export const FREELANCER_STATUS_KEY = "freelancer";

/** Xoá status trong Quản lý trạng thái: không được dồn hồ sơ (fulltime) vào cột freelancer. */
export function isBlockedMoveTarget(key: string | null | undefined): boolean {
  return key === FREELANCER_STATUS_KEY;
}

/** Sửa status trong Quản lý trạng thái: cột freelancer không có nhắc hồ sơ tồn (remind_days). */
export function freelanceStatusPatch(key: string, patch: Record<string, unknown>): Record<string, unknown> {
  if (key !== FREELANCER_STATUS_KEY || !("remind_days" in patch)) return patch;
  const rest = { ...patch };
  delete rest.remind_days;
  return rest;
}
