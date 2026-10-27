import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Danh sách Leader (chưa khoá) cho ô "Leader phụ trách" — người có quyền gán Leader (HR) không phải Sếp
// nên không gọi được /api/hr/users. Chỉ trả id + tên, không email.
export async function GET(req: Request) {
  const auth = await requireHrUser(req, "jobs.assign_leader");
  if ("response" in auth) return auth.response;
  const { data, error } = await getSupabaseAdmin()
    .from("hr_users")
    .select("id, display_name")
    .eq("role", "leader")
    .eq("disabled", false)
    .order("display_name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leaders: data ?? [] });
}
