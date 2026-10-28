// Luật duyệt thư mời nhận việc (sếp chốt 2026-10-28) — thuần, không import server.
// Người không phải Sếp soạn → gửi Sếp duyệt → Sếp Duyệt / Yêu cầu sửa → chỉ khi `approved` mới gửi mail offer.
import type { HrRole } from "./hr-permissions.ts";
import type { RecipientStaff, Recipients } from "./hr-notify-recipients.ts";
import { sanitizeOfferLetter, type OfferLetterData } from "./offer-letter.ts";

export const APPROVAL_STATUSES = ["draft", "pending", "approved", "changes_requested"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const OFFER_NOT_APPROVED = "Thư mời chưa được Sếp duyệt";
export const REVIEW_NOTE_MAX = 500;

export function isApprovalStatus(v: unknown): v is ApprovalStatus {
  return typeof v === "string" && (APPROVAL_STATUSES as readonly string[]).includes(v);
}

/** JSON ổn định: key đối tượng sắp xếp, mảng giữ thứ tự. */
export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v) ?? "null";
}

/** Dữ liệu thư có khác nhau không (so sau sanitize, JSON ổn định). */
export function offerDataChanged(a: OfferLetterData | null, b: OfferLetterData): boolean {
  if (!a) return true;
  return stableStringify(sanitizeOfferLetter(a)) !== stableStringify(sanitizeOfferLetter(b));
}

/**
 * Trạng thái sau khi LƯU thư: Sếp lưu → approved; người khác không đổi dữ liệu → giữ nguyên;
 * người khác đổi dữ liệu (hoặc thư mới) → draft (phải gửi duyệt lại).
 */
export function nextApprovalOnSave(i: {
  actorRole: HrRole;
  prevStatus: ApprovalStatus | null;
  dataChanged: boolean;
}): ApprovalStatus {
  if (i.actorRole === "boss") return "approved";
  if (!i.prevStatus) return "draft";
  return i.dataChanged ? "draft" : i.prevStatus;
}

export const canSubmit = (s: ApprovalStatus | null): boolean => s === "draft" || s === "changes_requested";
export const canReview = (role: HrRole, s: ApprovalStatus | null): boolean => role === "boss" && s === "pending";
export const canSendOffer = (s: ApprovalStatus | null): boolean => s === "approved";

/** Body POST review: `{ decision: "approve" | "changes", note? }` — yêu cầu sửa bắt buộc có ghi chú ≤ 500 ký tự. */
export function validateReviewInput(
  body: unknown,
): { ok: true; decision: "approve" | "changes"; note: string } | { ok: false; error: string } {
  const o = (body && typeof body === "object" && !Array.isArray(body) ? body : {}) as Record<string, unknown>;
  const decision = o.decision;
  if (decision !== "approve" && decision !== "changes") return { ok: false, error: "decision không hợp lệ" };
  const note = typeof o.note === "string" ? o.note.trim() : "";
  if (decision === "changes" && !note) return { ok: false, error: "Cần ghi chú khi yêu cầu sửa" };
  if (note.length > REVIEW_NOTE_MAX) return { ok: false, error: `Ghi chú tối đa ${REVIEW_NOTE_MAX} ký tự` };
  return { ok: true, decision, note };
}

/**
 * Người nhận thông báo duyệt thư mời.
 * - submitted: mọi Sếp chưa khoá; không Sếp nào có Discord ID → @everyone (để không ai bỏ sót).
 * - reviewed: người gửi duyệt + người support (assignee), loại người thực hiện; không bao giờ everyone.
 */
export function offerApprovalRecipients(i: {
  kind: "submitted" | "reviewed";
  staff: RecipientStaff[];
  submitterId: string | null;
  assigneeId: string | null;
  actorId?: string | null;
}): Recipients {
  const active = new Map(i.staff.filter((u) => !u.disabled).map((u) => [u.id, u]));
  const ids: string[] = [];
  const add = (id: string | null | undefined) => {
    if (id && active.has(id) && !ids.includes(id)) ids.push(id);
  };
  if (i.kind === "submitted") {
    const bosses = [...active.values()].filter((u) => u.role === "boss");
    for (const u of bosses) add(u.id);
    return { userIds: ids, everyone: !bosses.some((u) => !!u.discord_user_id) };
  }
  add(i.submitterId);
  add(i.assigneeId);
  const actor = i.actorId ?? null;
  return { userIds: actor ? ids.filter((id) => id !== actor) : ids, everyone: false };
}

export const OFFER_CHANGED_SINCE_REVIEW = "Thư mời vừa được sửa — mở lại để xem bản mới rồi duyệt";

/** Hai mốc `updated_at` có cùng một phiên bản thư không (so theo thời điểm, không so chuỗi). */
export function sameVersion(expected: unknown, current: string | null | undefined): boolean {
  if (typeof expected !== "string" || !current) return false;
  const a = Date.parse(expected);
  const b = Date.parse(current);
  return Number.isFinite(a) && Number.isFinite(b) && a === b;
}

/**
 * Ghi chú "Sếp yêu cầu sửa" lần trước, vẫn hiện khi người soạn đang sửa (trạng thái đã về draft
 * nhưng Sếp phản hồi SAU lần gửi gần nhất). Trạng thái changes_requested thì dùng thẳng review_note.
 */
export function previousReviewNote(a: {
  status: ApprovalStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
}): string | null {
  if (a.status !== "draft" || !a.review_note || !a.reviewed_at) return null;
  if (!a.submitted_at) return a.review_note;
  return Date.parse(a.reviewed_at) > Date.parse(a.submitted_at) ? a.review_note : null;
}
