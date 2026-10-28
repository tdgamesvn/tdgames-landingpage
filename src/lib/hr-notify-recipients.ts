// Ai nhận thông báo gắn với 1 ứng viên (Discord tag + push app) — luật duy nhất, thuần (không import server).
// Sếp chốt 2026-10-28 (kiểu ClickUp): Sếp luôn nhận; người phụ trách hồ sơ nhận mọi sự kiện; Leader của job
// nhận các sự kiện trong LEADER_EVENTS; Kế toán khi hồ sơ sang offer; người được @tag nhận comment đó;
// HR khác KHÔNG còn nhận tự động; loại người thực hiện; hồ sơ chưa có người phụ trách → @everyone + mọi HR.
import type { HrRole, PermissionKey } from "./hr-permissions.ts";
import { canViewApplication } from "./hr-comment-mentions.ts";
import type { ScopeInput } from "./hr-scope.ts";
import type { PushPayload } from "./hr-push-payload.ts";

export type NotifyEvent =
  | "comment"
  | "note"
  | "status"
  | "test_review"
  | "test_eta"
  | "test_submitted"
  | "new_application"
  | "interview_schedule"
  | "interview_remind"
  | "assigned";

export type RecipientStaff = { id: string; role: HrRole; disabled: boolean; discord_user_id: string | null };

export type Recipients = { userIds: string[]; everyone: boolean };

/** Sự kiện Leader của job được báo (như trước khi có người phụ trách). */
const LEADER_EVENTS: ReadonlySet<NotifyEvent> = new Set<NotifyEvent>([
  "comment",
  "note",
  "status",
  "interview_remind",
  "interview_schedule",
  "test_submitted",
  "new_application",
]);

export function candidateRecipients(i: {
  event: NotifyEvent;
  staff: RecipientStaff[];
  assigneeId: string | null;
  jobLeaderId: string | null;
  newStatus?: string | null;
  mentions?: string[];
  /** Người thực hiện (ctx.user.id). Sự kiện do ứng viên / cron → không có. */
  actorId?: string | null;
}): Recipients {
  const active = new Map(i.staff.filter((u) => !u.disabled).map((u) => [u.id, u]));
  const ids: string[] = [];
  const add = (id: string | null | undefined) => {
    if (id && active.has(id) && !ids.includes(id)) ids.push(id);
  };

  for (const u of active.values()) if (u.role === "boss") add(u.id);

  // Người phụ trách bị khoá / đã xoá → coi như chưa giao (để không ai bỏ sót).
  const assignee = i.assigneeId && active.has(i.assigneeId) ? i.assigneeId : null;
  add(assignee);

  if (LEADER_EVENTS.has(i.event)) add(i.jobLeaderId);
  if (i.event === "status" && i.newStatus === "offer") {
    for (const u of active.values()) if (u.role === "accountant") add(u.id);
  }
  if (i.event === "comment") for (const m of i.mentions ?? []) add(m);

  // "assigned" luôn có người nhận mới (chỉ gọi khi giao cho ai đó) → không bao giờ everyone.
  const everyone = !assignee && i.event !== "assigned";
  if (everyone) for (const u of active.values()) if (u.role === "hr") add(u.id);

  const actor = i.actorId ?? null;
  return { userIds: actor ? ids.filter((id) => id !== actor) : ids, everyone };
}

/**
 * `allowed_mentions` cho webhook: chỉ ping đúng các `<@id>` ta chủ động tag (+ everyone nếu tag có @everyone).
 * Tên ứng viên / nội dung có @everyone, <@&role> không ping được.
 */
export function allowedMentionsFor(tag: string): { parse: "everyone"[]; users: string[] } {
  const users = [...new Set([...tag.matchAll(/<@(\d{17,20})>/g)].map((m) => m[1]))];
  return { parse: tag.includes("@everyone") ? ["everyone"] : [], users };
}

/**
 * Chuỗi tag Discord cho danh sách người nhận: `<@discord_id>` người có ID (bỏ khoá, không trùng),
 * thêm `@everyone` khi cần. Không ai có ID và không cần everyone → "" (chỉ gửi nội dung).
 */
export function discordTagFor(
  r: Recipients,
  staff: RecipientStaff[],
): { tag: string; allowed_mentions: { parse: "everyone"[]; users: string[] } } {
  const byId = new Map(staff.map((u) => [u.id, u]));
  const discordIds: string[] = [];
  for (const id of r.userIds) {
    const u = byId.get(id);
    if (!u || u.disabled || !u.discord_user_id) continue;
    if (!discordIds.includes(u.discord_user_id)) discordIds.push(u.discord_user_id);
  }
  // everyone → chỉ "@everyone" (đã gồm mọi người, không tag lẻ thêm).
  const tag = r.everyone ? "@everyone" : discordIds.map((d) => `<@${d}>`).join(" ");
  return { tag, allowed_mentions: allowedMentionsFor(tag) };
}

/** Ghép tag vào đầu nội dung Discord (tag rỗng → chỉ nội dung). */
export function withTag(tag: string, content: string): string {
  return tag ? `${tag} ${content}` : content;
}

/**
 * Ai trong danh sách nhận push app: tài khoản chưa khoá, xem được hồ sơ (cùng phạm vi như mentionableUsers:
 * boss/hr luôn; leader của job; kế toán trong phạm vi), và
 * - người nhận trực tiếp (`direct`: người phụ trách, người được @tag) → luôn nhận, không xét push.receive;
 * - người nhận theo vai (Sếp, Leader job, Kế toán, mọi HR khi chưa giao) → cần quyền `push.receive`.
 */
export function pushTargets(
  userIds: string[],
  staff: RecipientStaff[],
  perms: Map<HrRole, Set<PermissionKey>>,
  app: { job_id: string; status: string; offer_status?: string | null },
  statuses: ScopeInput["statuses"],
  jobLeaderId: string | null,
  direct: string[] = [],
): string[] {
  const byId = new Map(staff.map((u) => [u.id, u]));
  return userIds.filter((id) => {
    const u = byId.get(id);
    if (!u || u.disabled) return false;
    if (!direct.includes(id) && !perms.get(u.role)?.has("push.receive")) return false;
    return canViewApplication(u, app, statuses, jobLeaderId);
  });
}

/**
 * Chia người nhận push thành các lô theo nội dung: người thiếu quyền xem field (`perm`, vd. apps.view_notes
 * cho ghi chú) nhận bản chung chung (`restricted` / `mentionRestricted`) — vẫn được báo nhưng không lộ nội dung.
 * Người trong `mentionIds` nhận bản mention thay bản thường. Lô rỗng bị bỏ.
 */
export function pushBatches(i: {
  targets: string[];
  staff: RecipientStaff[];
  perms: Map<HrRole, Set<PermissionKey>>;
  perm: PermissionKey | null;
  push: PushPayload;
  restricted: PushPayload;
  mentionIds?: string[];
  mentionPush?: PushPayload | null;
  mentionRestricted?: PushPayload | null;
}): { payload: PushPayload; userIds: string[] }[] {
  const byId = new Map(i.staff.map((u) => [u.id, u]));
  const allowed = (id: string) => {
    if (!i.perm) return true;
    const u = byId.get(id);
    return !!u && !!i.perms.get(u.role)?.has(i.perm);
  };
  const tagged = i.mentionPush ? i.targets.filter((id) => i.mentionIds?.includes(id)) : [];
  const rest = i.targets.filter((id) => !tagged.includes(id));
  const out: { payload: PushPayload; userIds: string[] }[] = [];
  const push = (payload: PushPayload, userIds: string[]) => {
    if (userIds.length) out.push({ payload, userIds });
  };
  if (i.mentionPush) {
    push(i.mentionPush, tagged.filter(allowed));
    push(i.mentionRestricted ?? i.restricted, tagged.filter((id) => !allowed(id)));
  }
  push(i.push, rest.filter(allowed));
  push(i.restricted, rest.filter((id) => !allowed(id)));
  return out;
}
