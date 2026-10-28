import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tên tài khoản chưa khoá cho mọi người đăng nhập /hr — để hiện người phụ trách hồ sơ (avatar trên card).
// Chỉ id + tên, không email / SĐT / vai.
export async function GET(req: Request) {
  const auth = await requireHrUser(req);
  if ("response" in auth) return auth.response;
  const { data, error } = await getSupabaseAdmin()
    .from("hr_users")
    .select("id, display_name")
    .eq("disabled", false)
    .order("display_name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: (data ?? []).map((u) => ({ id: String(u.id), display_name: String(u.display_name) })) });
}
