import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireBoss, requireHrUser } from "@/lib/hr-session";
import { HR_PERMISSIONS, isPermissionKey } from "@/lib/hr-permissions";

const OVERRIDE_ROLES = ["hr", "leader", "accountant"] as const;
type OverrideRole = (typeof OVERRIDE_ROLES)[number];

// Mọi người dùng đăng nhập đều xem được bảng quyền.
export async function GET(req: Request) {
  const auth = await requireHrUser(req);
  if ("response" in auth) return auth.response;
  const { data, error } = await getSupabaseAdmin().from("hr_role_permissions").select("role, permission, allowed");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ permissions: HR_PERMISSIONS, overrides: data ?? [] });
}

export async function PUT(req: Request) {
  const auth = await requireBoss(req);
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => null);
  const role = body?.role;
  const permission = body?.permission;
  const allowed = body?.allowed;
  if (typeof role !== "string" || !(OVERRIDE_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json({ error: "Vai không hợp lệ (Sếp luôn toàn quyền)" }, { status: 400 });
  }
  if (!isPermissionKey(permission)) return NextResponse.json({ error: "Quyền không hợp lệ" }, { status: 400 });
  if (typeof allowed !== "boolean") return NextResponse.json({ error: "Giá trị allowed không hợp lệ" }, { status: 400 });

  const def = HR_PERMISSIONS.find((p) => p.key === permission);
  const supabase = getSupabaseAdmin();
  // Bằng mặc định → xoá dòng ghi đè thay vì lưu.
  if (def && def.defaults[role as OverrideRole] === allowed) {
    const { error } = await supabase.from("hr_role_permissions").delete().eq("role", role).eq("permission", permission);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("hr_role_permissions")
      .upsert({ role, permission, allowed }, { onConflict: "role,permission" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
