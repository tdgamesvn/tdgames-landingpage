import "server-only";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "./supabase-admin";
import { getHRSecret } from "./hr-auth";
import { effectivePermissions, type HrRole, type PermissionKey } from "./hr-permissions";
import { newToken, hashToken, sessionUserIsActive } from "./hr-crypto";

export const SESSION_COOKIE = "hr_session";
const SESSION_DAYS = 30;

export type HrContext = {
  user: { id: string | null; email: string; displayName: string };
  role: HrRole;
  perms: Set<PermissionKey>;
  legacy: boolean;
};

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      const v = part.slice(i + 1).trim();
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    }
  }
  return null;
}

/** Đọc ghi đè quyền theo vai từ DB → effectivePermissions. */
async function loadPerms(role: HrRole): Promise<Set<PermissionKey>> {
  if (role === "boss") return effectivePermissions("boss", []);
  const { data } = await getSupabaseAdmin()
    .from("hr_role_permissions")
    .select("permission, allowed")
    .eq("role", role);
  const overrides = (data ?? []).map((r) => ({ role, permission: String(r.permission), allowed: !!r.allowed }));
  return effectivePermissions(role, overrides);
}

export async function getHrContext(req: Request): Promise<HrContext | null> {
  const cookieToken = readCookie(req, SESSION_COOKIE);
  if (cookieToken) {
    const supabase = getSupabaseAdmin();
    const { data: session } = await supabase
      .from("hr_sessions")
      .select("expires_at, user:hr_users(id, email, display_name, role, disabled)")
      .eq("token_hash", hashToken(cookieToken))
      .maybeSingle();
    const user = Array.isArray(session?.user) ? session.user[0] : session?.user;
    if (
      session &&
      new Date(session.expires_at).getTime() > Date.now() &&
      user &&
      sessionUserIsActive(user)
    ) {
      const role = user.role as HrRole;
      return {
        user: { id: user.id, email: user.email, displayName: user.display_name },
        role,
        perms: await loadPerms(role),
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
