import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { RULES_KEY, loadRankingRules } from "@/lib/candidate-ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tiêu chí loại cứng khi xếp hạng — mỗi dòng 1 tiêu chí, áp cho mọi job. */
export async function GET(request: Request) {
  const auth = await requireHrUser(request, "apps.view_ai");
  if ("response" in auth) return auth.response;
  return NextResponse.json({ rules: await loadRankingRules(getSupabaseAdmin()) });
}

export async function PUT(request: Request) {
  const auth = await requireHrUser(request, "jobs.manage");
  if ("response" in auth) return auth.response;
  let body: { rules?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const rules = String(body.rules ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((l) => l.slice(0, 200))
    .join("\n");
  const { error } = await getSupabaseAdmin()
    .from("app_settings")
    .upsert({ key: RULES_KEY, value: rules, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rules });
}
