import "server-only";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "./supabase-admin";
import { getHRSecret } from "./hr-auth";
import { effectivePermissions, HR_ROLES, type HrRole, type PermissionKey } from "./hr-permissions";
import { hashToken, newToken, readCookie, sessionUserIsActive } from "./hr-crypto";
import { inScope, type ScopeInput } from "./hr-scope";

export const SESSION_COOKIE = "hr_session";
const SESSION_DAYS = 30;

export type HrContext = {
  user: { id: string | null; email: string; displayName: string };
  role: HrRole;
  perms: Set<PermissionKey>;
  legacy: boolean;
};

/** Đọc ghi đè quyền theo vai từ DB → effectivePermissions. */
async function loadPerms(role: HrRole): Promise<Set<PermissionKey> | null> {
  if (role === "boss") return effectivePermissions("boss", []);
  const { data, error } = await getSupabaseAdmin()
    .from("hr_role_permissions")
    .select("permission, allowed")
    .eq("role", role);
  if (error) {
    // Fail closed: không trả quyền mặc định khi không đọc được phần ghi đè (tránh khôi phục quyền đã thu hồi).
    console.error("[hr-session] loadPerms lỗi:", error.message);
    return null;
  }
  const overrides = (data ?? []).map((r) => ({ role, permission: String(r.permission), allowed: !!r.allowed }));
  return effectivePermissions(role, overrides);
}

export async function getHrContext(req: Request): Promise<HrContext | null> {
  const cookieToken = readCookie(req.headers.get("cookie"), SESSION_COOKIE);
  if (cookieToken) {
    const supabase = getSupabaseAdmin();
    const { data: session, error: sessionError } = await supabase
      .from("hr_sessions")
      .select("expires_at, user:hr_users(id, email, display_name, role, disabled)")
      .eq("token_hash", hashToken(cookieToken))
      .maybeSingle();
    if (sessionError) {
      console.error("[hr-session] đọc phiên lỗi:", sessionError.message);
      return null; // fail closed
    }
    const user = Array.isArray(session?.user) ? session.user[0] : session?.user;
    if (
      session &&
      new Date(session.expires_at).getTime() > Date.now() &&
      user &&
      sessionUserIsActive(user) &&
      (HR_ROLES as readonly string[]).includes(user.role)
    ) {
      const role = user.role as HrRole;
      const perms = await loadPerms(role);
      if (!perms) return null;
      return {
        user: { id: user.id, email: user.email, displayName: user.display_name },
        role,
        perms,
        legacy: false,
      };
    }
    // Cookie không hợp lệ: vẫn cho thử header mật khẩu chung bên dưới.
  }

  const key = req.headers.get("x-hr-key");
  if (key) {
    const secret = await getHRSecret();
    if (secret && key === secret) {
      return {
        user: { id: null, email: "", displayName: "Mật khẩu chung" },
        role: "boss",
        perms: effectivePermissions("boss", []),
        legacy: true,
      };
    }
  }
  return null;
}

export type HrAuthResult = { ctx: HrContext } | { response: NextResponse };

export async function requireHrUser(req: Request, perm?: PermissionKey): Promise<HrAuthResult> {
  const ctx = await getHrContext(req);
  if (!ctx) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (perm && !ctx.perms.has(perm)) {
    return { response: NextResponse.json({ error: "Bạn không có quyền làm việc này" }, { status: 403 }) };
  }
  return { ctx };
}

export async function requireBoss(req: Request): Promise<HrAuthResult> {
  const ctx = await getHrContext(req);
  if (!ctx) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (ctx.role !== "boss") {
    return { response: NextResponse.json({ error: "Bạn không có quyền làm việc này" }, { status: 403 }) };
  }
  return { ctx };
}

export async function createSession(userId: string): Promise<{ token: string; expires: Date }> {
  const { token, hash } = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const { error } = await getSupabaseAdmin()
    .from("hr_sessions")
    .insert({ token_hash: hash, user_id: userId, expires_at: expires.toISOString() });
  if (error) throw new Error(`createSession: ${error.message}`);
  return { token, expires };
}

export async function destroySession(token: string): Promise<void> {
  await getSupabaseAdmin().from("hr_sessions").delete().eq("token_hash", hashToken(token));
}

/** Chuỗi Set-Cookie cho phiên. */
export function sessionCookie(token: string, expires: Date): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${expires.toUTCString()}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

const TOKEN_TTL_MS = { invite: 7 * 24 * 60 * 60 * 1000, reset: 60 * 60 * 1000 } as const;

/** Tạo token mời (7 ngày) / đặt lại mật khẩu (1 giờ). Xoá token cũ chưa dùng cùng mục đích của user. Trả token thô. */
export async function issueToken(userId: string, purpose: "invite" | "reset"): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { error: delError } = await supabase
    .from("hr_user_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("purpose", purpose)
    .is("used_at", null);
  if (delError) throw new Error(`issueToken: ${delError.message}`);
  const { token, hash } = newToken();
  const { error } = await supabase.from("hr_user_tokens").insert({
    token_hash: hash,
    user_id: userId,
    purpose,
    expires_at: new Date(Date.now() + TOKEN_TTL_MS[purpose]).toISOString(),
  });
  if (error) throw new Error(`issueToken: ${error.message}`);
  return token;
}

/** Gốc URL công khai cho link trong email. KHÔNG lấy từ request (chống Host header injection). Dev: đặt HR_PUBLIC_ORIGIN=http://localhost:3000. */
export function hrPublicOrigin(): string {
  return (process.env.HR_PUBLIC_ORIGIN?.trim() || "https://tdgamestudio.com").replace(/\/+$/, "");
}

/** Phạm vi dữ liệu của người dùng: status pipeline + job mình làm Leader. boss/hr không cần truy vấn job. */
export async function loadScope(ctx: HrContext): Promise<ScopeInput> {
  const supabase = getSupabaseAdmin();
  const { data: st, error: stErr } = await supabase.from("application_statuses").select("key, position, kind");
  if (stErr) throw new Error(`loadScope: ${stErr.message}`);
  let leaderJobIds: string[] = [];
  if (ctx.role === "leader" && ctx.user.id) {
    const { data: jobs, error } = await supabase.from("jobs").select("id").eq("leader_user_id", ctx.user.id);
    if (error) throw new Error(`loadScope: ${error.message}`);
    leaderJobIds = (jobs ?? []).map((j) => String(j.id));
  }
  return {
    role: ctx.role,
    userId: ctx.user.id,
    leaderJobIds,
    statuses: (st ?? []).map((r) => ({ key: String(r.key), position: Number(r.position), kind: r.kind as "open" | "won" | "lost" })),
  };
}

/** Đọc 1 hồ sơ; null nếu không tồn tại HOẶC ngoài phạm vi (route trả 404 như nhau). `columns` luôn được bổ sung job_id/status/offer_status để kiểm phạm vi. */
export async function loadScopedApplication(
  ctx: HrContext,
  appId: string,
  columns = "id",
): Promise<Record<string, unknown> | null> {
  const needed = ["id", "job_id", "status", "offer_status"];
  const cols = columns === "*" ? "*" : [...new Set([...columns.split(",").map((c) => c.trim()), ...needed])].join(", ");
  const { data, error } = await getSupabaseAdmin().from("applications").select(cols).eq("id", appId).maybeSingle();
  if (error) throw new Error(`loadScopedApplication: ${error.message}`);
  if (!data) return null;
  const row = data as unknown as Record<string, unknown>;
  const scope = await loadScope(ctx);
  const ok = inScope(scope, {
    job_id: String(row.job_id),
    status: String(row.status),
    offer_status: (row.offer_status as string | null | undefined) ?? null,
  });
  return ok ? row : null;
}
