import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "./supabase-admin";

/**
 * Returns the active HR secret.
 * Priority: app_settings DB row → HR_SECRET env var → ADMIN_SECRET env var
 */
export async function getHRSecret(): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "hr_secret")
      .single();
    if (data?.value) return data.value;
  } catch {
    // DB unavailable — fall back to env
  }
  return process.env.HR_SECRET ?? process.env.ADMIN_SECRET ?? "";
}

/**
 * Giữ chữ ký cũ cho các route chưa chuyển. Ủy quyền cho requireHrUser (cookie phiên hoặc x-hr-key).
 * Import hr-session theo kiểu lazy vì hr-session import getHRSecret từ file này (tránh vòng khi khởi tạo module).
 */
export async function requireHR(req: Request): Promise<NextResponse | null> {
  const { requireHrUser } = await import("./hr-session");
  const r = await requireHrUser(req);
  return "response" in r ? r.response : null;
}
