import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "./supabase-admin";

/**
 * Returns the active Admin secret.
 * Priority: app_settings DB row → ADMIN_SECRET env var
 */
export async function getAdminSecret(): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "admin_secret")
      .single();
    if (data?.value) return data.value;
  } catch {
    // DB unavailable — fall back to env
  }
  return process.env.ADMIN_SECRET ?? "";
}

export async function requireAdmin(req: Request): Promise<NextResponse | null> {
  const secret = await getAdminSecret();
  if (!secret)
    return NextResponse.json({ error: "ADMIN_SECRET not configured" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}
