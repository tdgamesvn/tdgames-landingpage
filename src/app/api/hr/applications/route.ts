import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireHR(req: Request) {
  // Falls back to ADMIN_SECRET so one key works for both panels if HR_SECRET not set
  const secret = process.env.HR_SECRET ?? process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "HR_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-hr-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const authError = requireHR(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("applications")
    .select("*, jobs(title, slug)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ applications: data ?? [], total: (data ?? []).length });
}
