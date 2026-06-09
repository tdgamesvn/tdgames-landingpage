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

export async function requireHR(req: Request): Promise<NextResponse | null> {
  const secret = await getHRSecret();
  if (!secret)
    return NextResponse.json({ error: "HR_SECRET not configured" }, { status: 500 });
  if (req.headers.get("x-hr-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}
