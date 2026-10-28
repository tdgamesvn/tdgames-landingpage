import "server-only";

import { getSupabaseAdmin } from "./supabase-admin";
import { HR_ROLES, effectivePermissions, type HrRole } from "./hr-permissions";
import { assignableUsers, mentionableUsers, type MentionMember } from "./hr-comment-mentions";

/** Dữ liệu chung để tính ai xem được hồ sơ `app` (cần job_id, status, offer_status). Ném lỗi nếu không đọc được DB. */
async function loadMemberInputs(app: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  const jobId = app.job_id ? String(app.job_id) : null;
  const [users, st, job, rp] = await Promise.all([
    supabase.from("hr_users").select("id, display_name, role, disabled"),
    supabase.from("application_statuses").select("key, position, kind"),
    jobId
      ? supabase.from("jobs").select("leader_user_id").eq("id", jobId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("hr_role_permissions").select("role, permission, allowed"),
  ]);
  if (users.error) throw new Error(`loadMemberInputs: ${users.error.message}`);
  if (st.error) throw new Error(`loadMemberInputs: ${st.error.message}`);
  if (rp.error) throw new Error(`loadMemberInputs: ${rp.error.message}`);
  if (job.error) throw new Error(`loadMemberInputs: ${job.error.message}`);
  const list = (users.data ?? [])
    .filter((u) => (HR_ROLES as readonly string[]).includes(u.role))
    .map((u) => ({ id: String(u.id), display_name: String(u.display_name), role: u.role as HrRole, disabled: !!u.disabled }));
  const statuses = (st.data ?? []).map((r) => ({
    key: String(r.key),
    position: Number(r.position),
    kind: r.kind as "open" | "won" | "lost",
  }));
  const leaderId = (job.data as { leader_user_id: string | null } | null)?.leader_user_id ?? null;
  const overrides = (rp.data ?? []).map((r) => ({ role: String(r.role), permission: String(r.permission), allowed: !!r.allowed }));
  const rolesWithComment = new Set<HrRole>(
    HR_ROLES.filter((r) => effectivePermissions(r, overrides).has("apps.comment")),
  );
  const scopeApp = {
    job_id: jobId ?? "",
    status: String(app.status ?? ""),
    offer_status: (app.offer_status as string | null | undefined) ?? null,
  };
  return { list, scopeApp, statuses, leaderId, rolesWithComment };
}

/** Tài khoản chưa khoá xem được hồ sơ + đọc được comment (để @tag). Ném lỗi nếu không đọc được DB. */
export async function loadMentionableMembers(app: Record<string, unknown>): Promise<MentionMember[]> {
  const m = await loadMemberInputs(app);
  return mentionableUsers(m.list, m.scopeApp, m.statuses, m.leaderId, m.rolesWithComment);
}

/** Tài khoản chưa khoá xem được hồ sơ (để giao người phụ trách). Ném lỗi nếu không đọc được DB. */
export async function loadAssignableMembers(app: Record<string, unknown>): Promise<MentionMember[]> {
  const m = await loadMemberInputs(app);
  return assignableUsers(m.list, m.scopeApp, m.statuses, m.leaderId);
}
