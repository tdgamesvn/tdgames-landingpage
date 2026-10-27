// Phạm vi dữ liệu + gỡ field theo quyền cho /hr (thuần: không server-only, không supabase).
import { HR_PERMISSIONS } from "./hr-permissions.ts";
import type { HrRole, PermissionKey } from "./hr-permissions.ts";

export type ScopeInput = {
  role: HrRole;
  userId: string | null;
  leaderJobIds: string[];
  statuses: { key: string; position: number; kind: "open" | "won" | "lost" }[];
};

/** Phạm vi kế toán neo theo status có key "interview" (đổi/xoá key này thì kế toán chỉ còn thấy hồ sơ có offer_status). */
/** Status kế toán được thấy: từ vị trí "interview" trở đi, trừ nhóm lost. Không có "interview" → []. */
export function accountantStatusKeys(statuses: ScopeInput["statuses"]): string[] {
  const iv = statuses.find((s) => s.key === "interview");
  if (!iv) return [];
  return statuses.filter((s) => s.position >= iv.position && s.kind !== "lost").map((s) => s.key);
}

/** Hồ sơ có nằm trong phạm vi của người dùng không. */
export function inScope(
  s: ScopeInput,
  app: { job_id: string; status: string; offer_status?: string | null },
): boolean {
  if (s.role === "boss" || s.role === "hr") return true;
  if (s.role === "leader") return s.leaderJobIds.includes(app.job_id);
  if (s.role === "accountant") {
    // Đã có offer_status (kể cả declined) thì vẫn thấy dù status là lost.
    if (app.offer_status != null) return true;
    return accountantStatusKeys(s.statuses).includes(app.status);
  }
  return false;
}

/** Luôn giữ, không phụ thuộc quyền. */
export const BASE_FIELDS: readonly string[] = Object.freeze([
  "id", "job_id", "jobs", "full_name", "work_type", "years_experience", "cv_url", "portfolio_url",
  "available_from", "status", "offer_status", "offer_status_at", "created_at", "updated_at",
  "message", "available_hours_per_week",
]);

/** Nhóm field theo quyền; quyền không gắn field trên hồ sơ → []. Key không thuộc nhóm nào bị bỏ. */
const GROUPS_WITH_FIELDS = {
  "apps.view_contact": ["email", "phone", "contact_channel", "contact_handle", "linkedin_url", "website_url"],
  "apps.view_salary": ["expected_salary", "rate_per_hour"],
  "apps.view_ai": [
    "ai_score", "ai_evaluation", "ai_profile", "ai_profile_hash", "ai_digest", "ai_digest_hash",
    "mbti_type", "mbti_url",
  ],
  "apps.view_notes": ["admin_notes", "rejection_reason", "referred_by", "source", "blocked", "block_reason", "label"],
  "apps.view_interviews": ["interview_sessions"],
  "apps.view_tests": ["test_submissions", "test_review", "test_token", "test_eta", "test_eta_set_at"],
} as const;

export const FIELD_GROUPS: Readonly<Record<PermissionKey, readonly string[]>> = Object.freeze(
  Object.fromEntries(
    HR_PERMISSIONS.map((p) => [
      p.key,
      Object.freeze([...((GROUPS_WITH_FIELDS as Record<string, readonly string[]>)[p.key] ?? [])]),
    ]),
  ),
) as Readonly<Record<PermissionKey, readonly string[]>>;

/** Job lồng trong hồ sơ: chỉ giữ các key này khi không đủ quyền. */
const JOB_FIELDS = ["id", "title", "slug"] as const;

const VIEW_PERMS = HR_PERMISSIONS.map((p) => p.key).filter((k) => k.startsWith("apps.view_"));

function isAiKey(k: string): boolean {
  return k.startsWith("ai_") || k.startsWith("rank");
}

/** Gỡ field hồ sơ theo quyền. Đủ mọi apps.view_* → nguyên bản; ngược lại allowlist. Không mutate input. */
export function redactApplication<T extends Record<string, unknown>>(
  app: T,
  perms: Set<PermissionKey>,
): Partial<T> {
  if (VIEW_PERMS.every((k) => perms.has(k as PermissionKey))) return app;
  const allowed = new Set<string>(BASE_FIELDS);
  for (const [perm, fields] of Object.entries(FIELD_GROUPS)) {
    if (perms.has(perm as PermissionKey)) for (const f of fields) allowed.add(f);
  }
  const canAi = perms.has("apps.view_ai");
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(app)) {
    if (!(allowed.has(k) || (canAi && isAiKey(k)))) continue;
    if (k === "jobs" && v && typeof v === "object" && !Array.isArray(v)) {
      const job = v as Record<string, unknown>;
      out[k] = Object.fromEntries(JOB_FIELDS.filter((f) => f in job).map((f) => [f, job[f]]));
    } else if (k === "interview_sessions" && Array.isArray(v)) {
      // Lịch PV lồng trong hồ sơ cũng phải gỡ băng/phân tích khi thiếu quyền.
      out[k] = v.map((r) => (r && typeof r === "object" ? redactInterview(r as Record<string, unknown>, perms) : r));
    } else out[k] = v;
  }
  return out as Partial<T>;
}

/** Field lịch PV luôn giữ; gỡ băng/phân tích/ghi âm/câu hỏi/điểm khi thiếu quyền. */
export const INTERVIEW_BASE_FIELDS: string[] = [
  "id", "application_id", "round", "title", "scheduled_at", "mode", "meet_url",
  "created_at", "updated_at", "reminded_at", "analysis_status",
];

export function redactInterview<T extends Record<string, unknown>>(
  row: T,
  perms: Set<PermissionKey>,
): Partial<T> {
  if (perms.has("apps.view_interview_analysis")) return row;
  const out: Record<string, unknown> = {};
  for (const k of INTERVIEW_BASE_FIELDS) if (k in row) out[k] = row[k];
  return out as Partial<T>;
}

/**
 * Gỡ dữ liệu nhạy cảm khỏi 1 dòng lịch sử mail theo quyền (thuần):
 * - thiếu apps.view_contact: bỏ to_email/sent_to/cc_emails, subject `[TEST → …] ` → `[TEST] `;
 * - thiếu apps.view_tests: mail test_assignment che token trong đường dẫn `/test/<token>` → `/test/…`.
 */
export function redactEmailRow<T extends Record<string, unknown>>(row: T, perms: Set<PermissionKey>): Partial<T> {
  const out: Record<string, unknown> = { ...row };
  if (!perms.has("apps.view_contact")) {
    for (const k of ["to_email", "sent_to", "cc_emails"]) delete out[k];
    if (typeof out.subject === "string") out.subject = out.subject.replace(/^\[TEST → \S*\] /, "[TEST] ");
  }
  if (!perms.has("apps.view_tests") && out.kind === "test_assignment") {
    for (const k of ["body_text", "body_html"]) {
      if (typeof out[k] === "string") out[k] = (out[k] as string).replace(/\/test\/[A-Za-z0-9_-]+/g, "/test/…");
    }
  }
  return out as Partial<T>;
}
