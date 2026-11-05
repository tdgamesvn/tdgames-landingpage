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
