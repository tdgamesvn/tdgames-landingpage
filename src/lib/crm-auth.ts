import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "./supabase-admin";
/**
 * Returns the active CRM secret.
 * Priority: app_settings `crm_secret` → CRM_SECRET env.
 * ponytail: KHÔNG fallback sang pass HR — CRM luôn có pass riêng. Trống cả hai → 500,
 * điền lại ở /admin > Settings > "CRM Dashboard Password".
 */
export async function getCRMSecret(): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "crm_secret")
      .single();
    if (data?.value) return data.value;
  } catch {
    // DB unavailable — fall back to env
  }
  return process.env.CRM_SECRET ?? "";
}

export async function requireCRM(req: Request): Promise<NextResponse | null> {
  const secret = await getCRMSecret();
  if (!secret)
    return NextResponse.json({ error: "CRM_SECRET not configured" }, { status: 500 });
  if (req.headers.get("x-crm-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}
