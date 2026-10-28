// Mã ref (người giới thiệu) của tài khoản /hr — thuần, không import server (dùng cả script backfill, client, test).

import { canViewApplication } from "./hr-comment-mentions.ts";
import type { HrRole } from "./hr-permissions.ts";
import type { ScopeInput } from "./hr-scope.ts";

export const MAX_REF_CODES = 10;
export const MAX_REF_CODE_LEN = 40;

/**
 * Chuẩn hoá mã ref: bỏ dấu tiếng Việt (đ→d), lowercase, khoảng trắng/gạch dưới → "-",
 * chỉ giữ [a-z0-9-], gộp "--", bỏ "-" hai đầu. Rỗng / không phải chuỗi → null.
 */
export function normalizeRefCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || null;
}

/** Mã chính của tài khoản = ref_codes[0] (đã normalize); không có mã → null. */
export function canonicalRefCode(u: { ref_codes?: string[] | null }): string | null {
  return normalizeRefCode(u.ref_codes?.[0]);
}

/** Tài khoản sở hữu mã `code` (khớp bất kỳ phần tử ref_codes sau normalize); không khớp → null. */
export function resolveRefOwner<T extends { ref_codes?: string[] | null }>(code: unknown, users: T[]): T | null {
  const c = normalizeRefCode(code);
  if (!c) return null;
  return users.find((u) => (u.ref_codes ?? []).some((r) => normalizeRefCode(r) === c)) ?? null;
}

/**
 * Đọc `ref_codes` từ body API: mảng chuỗi → normalize, bỏ rỗng/trùng, giữ thứ tự (phần tử đầu = mã chính).
 * null/undefined → []. Sai kiểu, quá 10 mã, mã dài quá 40 ký tự → { error }.
 */
export function parseRefCodes(v: unknown): string[] | { error: string } {
  if (v === null || v === undefined) return [];
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) return { error: "Mã ref phải là danh sách chuỗi" };
  const out: string[] = [];
  for (const raw of v as string[]) {
    const c = normalizeRefCode(raw);
    if (!c || out.includes(c)) continue;
    if (c.length > MAX_REF_CODE_LEN) return { error: `Mã ref “${c.slice(0, 20)}…” dài quá ${MAX_REF_CODE_LEN} ký tự` };
    out.push(c);
  }
  if (out.length > MAX_REF_CODES) return { error: `Tối đa ${MAX_REF_CODES} mã ref cho một tài khoản` };
  return out;
}

/** Mã đầu tiên trong `codes` đã thuộc tài khoản khác `selfId` → { code, owner }; không trùng → null. */
export function findRefConflict<T extends { id: string; ref_codes?: string[] | null }>(
  codes: string[],
  users: T[],
  selfId: string | null,
): { code: string; owner: T } | null {
  for (const code of codes) {
    const owner = resolveRefOwner(code, users.filter((u) => u.id !== selfId));
    if (owner) return { code, owner };
  }
  return null;
}

/**
 * Hồ sơ mới khớp mã ref của `owner`: chỉ tự giao khi chủ mã xem được hồ sơ (vd. Leader job khác,
 * Kế toán với hồ sơ "new" → không giao, vẫn lưu mã chính). Trả id người phụ trách hoặc null.
 */
export function autoAssigneeFor(
  owner: { id: string; role: HrRole } | null,
  app: { job_id: string; status: string },
  statuses: ScopeInput["statuses"],
  jobLeaderId: string | null,
): string | null {
  if (!owner) return null;
  return canViewApplication(owner, app, statuses, jobLeaderId) ? owner.id : null;
}

/** app_settings key: người support mặc định cho hồ sơ không khớp mã ref nào (sếp chọn 2026-10-28). */
export const DEFAULT_ASSIGNEE_KEY = "hr_default_assignee";
