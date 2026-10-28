import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireBoss, requireHrUser } from "@/lib/hr-session";
import { DEFAULT_ASSIGNEE_KEY } from "@/lib/hr-ref-codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const auth = await requireHrUser(req);
  if ("response" in auth) return auth.response;
  const { data, error } = await getSupabaseAdmin()
    .from("app_settings")
    .select("value")
    .eq("key", DEFAULT_ASSIGNEE_KEY)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ userId: data?.value || null });
}

/** PUT { userId: string | null } — chỉ Sếp; người được chọn phải là Sếp/HR chưa khoá (xem được mọi hồ sơ). */
export async function PUT(req: Request) {
  const auth = await requireBoss(req);
  if ("response" in auth) return auth.response;
  const body = await req.json().catch(() => null);
  const userId = body?.userId ?? null;
  const supabase = getSupabaseAdmin();

  if (userId === null || userId === "") {
    const { error } = await supabase.from("app_settings").delete().eq("key", DEFAULT_ASSIGNEE_KEY);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ userId: null });
  }
  if (typeof userId !== "string" || !UUID.test(userId)) {
    return NextResponse.json({ error: "Tài khoản không hợp lệ" }, { status: 400 });
  }
  const { data: u, error: uErr } = await supabase.from("hr_users").select("role, disabled").eq("id", userId).maybeSingle();
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
  if (!u || u.disabled || (u.role !== "hr" && u.role !== "boss")) {
    return NextResponse.json({ error: "Người support mặc định phải là tài khoản HR hoặc Sếp đang hoạt động" }, { status: 400 });
  }
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: DEFAULT_ASSIGNEE_KEY, value: userId, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ userId });
}
