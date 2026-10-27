import "server-only";

import { getSupabaseAdmin } from "./supabase-admin";
import { HR_ROLES, type HrRole } from "./hr-permissions";
import { mentionableUsers, type MentionMember } from "./hr-comment-mentions";

/** Tài khoản chưa khoá xem được hồ sơ `app` (đã đọc từ DB: cần job_id, status, offer_status). Ném lỗi nếu không đọc được DB. */
export async function loadMentionableMembers(app: Record<string, unknown>): Promise<MentionMember[]> {
  const supabase = getSupabaseAdmin();
  const jobId = app.job_id ? String(app.job_id) : null;
  const [users, st, job] = await Promise.all([
    supabase.from("hr_users").select("id, display_name, role, disabled"),
    supabase.from("application_statuses").select("key, position, kind"),
    jobId
      ? supabase.from("jobs").select("leader_user_id").eq("id", jobId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (users.error) throw new Error(`loadMentionableMembers: ${users.error.message}`);
  if (st.error) throw new Error(`loadMentionableMembers: ${st.error.message}`);
  if (job.error) throw new Error(`loadMentionableMembers: ${job.error.message}`);
  const list = (users.data ?? [])
    .filter((u) => (HR_ROLES as readonly string[]).includes(u.role))
    .map((u) => ({ id: String(u.id), display_name: String(u.display_name), role: u.role as HrRole, disabled: !!u.disabled }));
  const statuses = (st.data ?? []).map((r) => ({
    key: String(r.key),
    position: Number(r.position),
    kind: r.kind as "open" | "won" | "lost",
  }));
  const leaderId = (job.data as { leader_user_id: string | null } | null)?.leader_user_id ?? null;
  return mentionableUsers(
    list,
    {
      job_id: jobId ?? "",
      status: String(app.status ?? ""),
      offer_status: (app.offer_status as string | null | undefined) ?? null,
    },
    statuses,
    leaderId,
  );
}
