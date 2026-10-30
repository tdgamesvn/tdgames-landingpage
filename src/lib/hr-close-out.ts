/**
 * "Báo đã tuyển đủ" hàng loạt cho 1 job — phần thuần (không I/O): hằng số, kiểm body,
 * lọc ứng viên đang mở, lý do bỏ qua, câu tóm tắt Discord. Route: /api/hr/jobs/[id]/close-out.
 */

import { isValidEmail } from "./hr-email.ts";
import { inScope, type ScopeInput } from "./hr-scope.ts";

/** Trạng thái "Lưu hồ sơ" (kind lost) — tạo ở migration 20261030000000_hold_filled_mail.sql. */
export const TALENT_POOL_STATUS = "talent_pool";
export const TALENT_POOL_MISSING =
  "Chưa có trạng thái “Lưu hồ sơ” (key talent_pool) — vào Trạng thái pipeline tạo lại (đúng key talent_pool) rồi thử lại";

/** Tối đa số hồ sơ mỗi lần bấm. */
export const CLOSE_OUT_MAX = 100;
/** Khoảng nghỉ giữa 2 mail liên tiếp (tránh dồn Resend). */
export const CLOSE_OUT_GAP_MS = 600;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseCloseOutBody(body: unknown): { ids: string[]; sendMail: boolean } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Dữ liệu gửi lên không hợp lệ" };
  const b = body as Record<string, unknown>;
  const raw = b.application_ids;
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > CLOSE_OUT_MAX) {
    return { error: `Chọn từ 1 đến ${CLOSE_OUT_MAX} hồ sơ` };
  }
  if (!raw.every((x) => typeof x === "string" && UUID_RE.test(x))) return { error: "Mã hồ sơ không hợp lệ" };
  if (typeof b.send_mail !== "boolean") return { error: "Thiếu send_mail (true/false)" };
  return { ids: [...new Set(raw as string[])], sendMail: b.send_mail };
}

export type CloseOutApp = {
  id: string;
  job_id: string;
  status: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  offer_status?: string | null;
};

export type CloseOutCandidate = { id: string; name: string; status: string; created_at: string; has_email: boolean };

type Opts = { jobId: string; scope: ScopeInput };

function isOpen(scope: ScopeInput, status: string): boolean {
  return scope.statuses.some((s) => s.key === status && s.kind === "open");
}

/** null = được xử lý; chuỗi = lý do bỏ qua. Ngoài phạm vi trả như không tồn tại (giống route 404). */
export function closeOutSkipReason(app: CloseOutApp | undefined, o: Opts): string | null {
  if (!app || !inScope(o.scope, app)) return "Không tìm thấy hồ sơ";
  if (app.job_id !== o.jobId) return "Hồ sơ không thuộc job này";
  if (!isOpen(o.scope, app.status)) return "Hồ sơ không còn ở trạng thái đang mở";
  return null;
}

/** Ứng viên của job đang ở status kind open, trong phạm vi người xem; nộp sớm trước. Không trả email, chỉ cờ hợp lệ. */
export function closeOutCandidates(apps: CloseOutApp[], o: Opts & { excludeId?: string | null }): CloseOutCandidate[] {
  return apps
    .filter((a) => a.id !== o.excludeId && closeOutSkipReason(a, o) === null)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((a) => ({
      id: a.id,
      name: (a.full_name ?? "").trim(),
      status: a.status,
      created_at: a.created_at,
      has_email: isValidEmail(a.email),
    }));
}

/** 1 dòng Discord (kênh hr, không tag ai). */
export function closeOutSummary(i: { actor: string; job: string; mailed: number; moved: number }): string {
  return `📮 ${i.actor} báo vị trí đã tuyển đủ — ${i.job}: gửi mail ${i.mailed} ứng viên, chuyển ${i.moved} hồ sơ sang Lưu hồ sơ`;
}
