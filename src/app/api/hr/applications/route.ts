import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("applications")
    .select("*, jobs(title, slug)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ applications: data ?? [], total: (data ?? []).length });
}
