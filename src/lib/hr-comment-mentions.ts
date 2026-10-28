// @tag thành viên trong comment hồ sơ /hr — thuần (không import server) để dùng cả client, server, test.
import { ROLE_LABEL, type HrRole } from "./hr-permissions.ts";
import { inScope, type ScopeInput } from "./hr-scope.ts";

export type MentionUser = { id: string; display_name: string; role: HrRole; disabled: boolean };
export type MentionMember = { id: string; display_name: string; role: HrRole; roleLabel: string };

/** Bỏ dấu tiếng Việt + hạ chữ — để gõ "toan" khớp "Toàn". */
export function foldVi(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();
}

type ScopeApp = { job_id: string; status: string; offer_status?: string | null };

/**
 * Tài khoản này có xem được hồ sơ không (không xét khoá): boss + hr luôn; leader nếu là Leader của job;
 * kế toán nếu hồ sơ nằm trong phạm vi kế toán.
 */
export function canViewApplication(
  u: { id: string; role: HrRole },
  app: ScopeApp,
  statuses: ScopeInput["statuses"],
  jobLeaderId: string | null,
): boolean {
  if (u.role === "boss" || u.role === "hr") return true;
  if (u.role === "leader") return jobLeaderId !== null && u.id === jobLeaderId;
  if (u.role === "accountant") return inScope({ role: "accountant", userId: u.id, leaderJobIds: [], statuses }, app);
  return false;
}

function toMember(u: MentionUser): MentionMember {
  return { id: u.id, display_name: u.display_name, role: u.role, roleLabel: ROLE_LABEL[u.role] };
}

/** Tài khoản chưa khoá xem được hồ sơ này và có quyền đọc comment (boss luôn có). */
export function mentionableUsers(
  users: MentionUser[],
  app: ScopeApp,
  statuses: ScopeInput["statuses"],
  jobLeaderId: string | null,
  rolesWithComment: Set<HrRole>,
): MentionMember[] {
  return users
    .filter((u) => !u.disabled)
    // Vai không có quyền apps.comment thì không đọc được comment → không tag (boss luôn có).
    .filter((u) => u.role === "boss" || rolesWithComment.has(u.role))
    .filter((u) => canViewApplication(u, app, statuses, jobLeaderId))
    .map(toMember);
}

/** Người được giao phụ trách hồ sơ: tài khoản chưa khoá xem được hồ sơ (không cần quyền comment). */
export function assignableUsers(
  users: MentionUser[],
  app: ScopeApp,
  statuses: ScopeInput["statuses"],
  jobLeaderId: string | null,
): MentionMember[] {
  return users.filter((u) => !u.disabled && canViewApplication(u, app, statuses, jobLeaderId)).map(toMember);
}

/** Lọc danh sách gợi ý theo chữ gõ sau @ (bỏ dấu). */
export function filterMembers<T extends { display_name: string }>(members: T[], query: string): T[] {
  const q = foldVi(query.trim());
  if (!q) return members;
  return members.filter((m) => foldVi(m.display_name).includes(q));
}

export type MentionPart = { text: string; mention?: boolean };

const WORD = "[\\p{L}\\p{N}]";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Tách nội dung thành đoạn thường / đoạn `@Tên`. Tên dài khớp trước; không khớp khi dính chữ liền kề. */
export function splitMentions(content: string, names: string[]): MentionPart[] {
  if (!content) return [];
  const list = [...new Set(names.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!list.length) return [{ text: content }];
  const re = new RegExp(`(?<!${WORD})@(?:${list.map(escapeRe).join("|")})(?!${WORD})`, "gu");
  const parts: MentionPart[] = [];
  let last = 0;
  for (const m of content.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) parts.push({ text: content.slice(last, i) });
    parts.push({ text: m[0], mention: true });
    last = i + m[0].length;
  }
  if (last < content.length) parts.push({ text: content.slice(last) });
  return parts;
}

/** Lúc gửi: chỉ giữ id có `@Tên` còn trong nội dung (người dùng có thể đã xoá), không trùng. */
export function keptMentionIds(
  content: string,
  ids: string[],
  members: { id: string; display_name: string }[],
): string[] {
  // Khớp theo mọi tên đã biết, tên dài trước ("@An Binh" không tính là "@An").
  const found = new Set(
    splitMentions(content, members.map((m) => m.display_name))
      .filter((p) => p.mention)
      .map((p) => p.text.slice(1)),
  );
  const out: string[] = [];
  for (const id of ids) {
    if (out.includes(id)) continue;
    const m = members.find((x) => x.id === id);
    if (m && found.has(m.display_name)) out.push(id);
  }
  return out;
}

/** Chỉ số màu avatar ổn định theo chuỗi (id hoặc tên). */
export function avatarColorIndex(key: string, size: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % size;
}

/** Thời gian tương đối tiếng Việt; sau 7 ngày → dd/mm/yyyy HH:mm (giờ Việt Nam). */
export function relativeTimeVi(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = now - t;
  if (diff < 60_000) return "vừa xong";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} giờ trước`;
  if (diff < 2 * 86400_000) return "hôm qua";
  if (diff < 7 * 86400_000) return `${Math.floor(diff / 86400_000)} ngày trước`;
  return formatDateTimeVi(iso);
}

/** dd/mm/yyyy HH:mm theo giờ Việt Nam (UTC+7). */
export function formatDateTimeVi(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const d = new Date(t + 7 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}
