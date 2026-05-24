import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("job_id");
  const status = searchParams.get("status");

  let query = supabase
    .from("applications")
    .select("*, jobs(title, slug)")
    .order("created_at", { ascending: false });

  if (jobId) {
    query = query.eq("job_id", jobId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications: data, total: data.length });
}
