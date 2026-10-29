import { NextResponse } from "next/server";
import { requireHrUser } from "@/lib/hr-session";
import { ROLE_LABEL } from "@/lib/hr-permissions";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { canonicalRefCode } from "@/lib/hr-ref-codes";

export async function GET(req: Request) {
  const auth = await requireHrUser(req);
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  // Mã ref chính của tài khoản → link job copy ở tab Jobs tự gắn ?ref= (lỗi đọc → null, không chặn đăng nhập).
  let refCode: string | null = null;
  if (ctx.user.id) {
    const { data } = await getSupabaseAdmin().from("hr_users").select("ref_codes").eq("id", ctx.user.id).maybeSingle();
    refCode = data ? canonicalRefCode(data as { ref_codes: string[] | null }) : null;
  }
  return NextResponse.json({
    user: ctx.user,
    role: ctx.role,
    roleLabel: ROLE_LABEL[ctx.role],
    perms: [...ctx.perms],
    refCode,
  });
}
