import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword, hashToken, isTokenUsable } from "@/lib/hr-crypto";
import { createSession, sessionCookie } from "@/lib/hr-session";

const BAD_LINK = "Link không còn hiệu lực";

type TokenRow = {
  token_hash: string;
  purpose: string;
  expires_at: string;
  used_at: string | null;
  user: { id: string; email: string; disabled: boolean } | { id: string; email: string; disabled: boolean }[] | null;
};

/** Tìm token còn dùng được + user chưa bị khoá; null nếu không. */
async function findUsable(token: string) {
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("hr_user_tokens")
    .select("token_hash, purpose, expires_at, used_at, user:hr_users(id, email, disabled)")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (error) {
    console.error("[hr-set-password] đọc token lỗi:", error.message);
    return null;
  }
  const row = data as TokenRow | null;
  const user = Array.isArray(row?.user) ? row?.user[0] : row?.user;
  if (!row || !user || user.disabled || !isTokenUsable(row, new Date())) return null;
  return { row, user };
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const found = await findUsable(token);
  if (!found) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, email: found.user.email, purpose: found.row.purpose });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < 8) {
    return NextResponse.json({ error: "Mật khẩu tối thiểu 8 ký tự" }, { status: 400 });
  }
  const found = await findUsable(token);
  if (!found) return NextResponse.json({ error: BAD_LINK }, { status: 400 });

  const supabase = getSupabaseAdmin();
  // Đánh dấu dùng token trước (điều kiện used_at IS NULL) để hai request song song không cùng thành công.
  const { data: claimed, error: claimError } = await supabase
    .from("hr_user_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", found.row.token_hash)
    .is("used_at", null)
    .select("token_hash");
  if (claimError) {
    console.error("[hr-set-password] đánh dấu token lỗi:", claimError.message);
    return NextResponse.json({ error: "Không đặt được mật khẩu, thử lại sau" }, { status: 500 });
  }
  if (!claimed || claimed.length === 0) return NextResponse.json({ error: BAD_LINK }, { status: 400 });

  const { error: updError } = await supabase
    .from("hr_users")
    .update({ password_hash: await hashPassword(password) })
    .eq("id", found.user.id);
  if (updError) {
    // Trả lại token để người dùng thử lại bằng cùng link.
    await supabase.from("hr_user_tokens").update({ used_at: null }).eq("token_hash", found.row.token_hash);
    console.error("[hr-set-password] lưu mật khẩu lỗi:", updError.message);
    return NextResponse.json({ error: "Không đặt được mật khẩu, thử lại sau" }, { status: 500 });
  }

  // Đổi mật khẩu → mọi phiên cũ mất hiệu lực, rồi đăng nhập luôn bằng phiên mới.
  await supabase.from("hr_sessions").delete().eq("user_id", found.user.id);
  const { token: sessionToken, expires } = await createSession(found.user.id);
  await supabase.from("hr_users").update({ last_login_at: new Date().toISOString() }).eq("id", found.user.id);
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", sessionCookie(sessionToken, expires));
  return res;
}
