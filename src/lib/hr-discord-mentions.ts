// Ai được tag trong thông báo Discord kênh HR — thuần, không import server.
import type { HrRole } from "./hr-permissions.ts";

export type MentionStaff = { id: string; role: HrRole; disabled: boolean; discord_user_id: string | null };

/**
 * Chuỗi tag `<@id> <@id>` cho các vai cần báo. Vai "leader" = người phụ trách job (jobLeaderId, có thể là Sếp),
 * vai khác = mọi tài khoản chưa khoá của vai đó; vai Sếp luôn được tag. Không ai có Discord ID → "@everyone" như cũ.
 */
export function buildMentions(staff: MentionStaff[], roles: HrRole[], jobLeaderId: string | null): string {
  const ids: string[] = [];
  for (const u of staff) {
    if (u.disabled || !u.discord_user_id) continue;
    // "leader" = người được gán phụ trách job (vai Leader hoặc Sếp kiêm Leader).
    const isJobLeader = roles.includes("leader") && jobLeaderId !== null && u.id === jobLeaderId;
    // Sếp luôn được tag ở mọi thông báo (sếp chốt 2026-10-27).
    const always = u.role === "boss";
    if (!always && !isJobLeader && (u.role === "leader" || !roles.includes(u.role))) continue;
    if (!ids.includes(u.discord_user_id)) ids.push(u.discord_user_id);
  }
  return ids.length ? ids.map((id) => `<@${id}>`).join(" ") : "@everyone";
}

/**
 * `allowed_mentions` cho webhook: chỉ ping đúng các `<@id>` ta chủ động tag.
 * Tag là "@everyone" (fallback) → cho phép everyone; tên ứng viên/nội dung có @everyone, <@&role> không ping được.
 */
export function allowedMentionsFor(tag: string): { parse: ("everyone")[]; users: string[] } {
  const users = [...new Set([...tag.matchAll(/<@(\d{17,20})>/g)].map((m) => m[1]))];
  return { parse: tag.includes("@everyone") ? ["everyone"] : [], users };
}
