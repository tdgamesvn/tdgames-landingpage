import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { REFERRAL_DEFAULTS_KEY, parseRule, type CommissionRule } from "@/lib/referral-commission";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PUT { internal: rule|null, external: rule|null } — cả hai key bắt buộc (null = không có mức mặc định). */
export async function PUT(req: Request) {
  const auth = await requireHrUser(req, "referrals.manage");
  if ("response" in auth) return auth.response;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  const out: Record<"internal" | "external", CommissionRule | null> = { internal: null, external: null };
  for (const k of ["internal", "external"] as const) {
    const v = (body as Record<string, unknown>)[k];
    if (v === undefined) return NextResponse.json({ error: "Thiếu mức mặc định nội bộ hoặc bên ngoài" }, { status: 400 });
    if (v === null) continue;
    const r = parseRule(v);
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
    out[k] = r;
  }
  const { error } = await getSupabaseAdmin()
    .from("app_settings")
    .upsert({ key: REFERRAL_DEFAULTS_KEY, value: out, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ defaults: out });
}
