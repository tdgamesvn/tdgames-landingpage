import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyPassword } from "@/lib/hr-crypto";
import { createSession, sessionCookie } from "@/lib/hr-session";

const BAD = "Email hoặc mật khẩu không đúng";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ error: BAD }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("hr_users")
    .select("id, password_hash, disabled")
    .eq("email", email)
    .maybeSingle();
  if (error) {
    console.error("[hr-login] đọc user lỗi:", error.message);
    return NextResponse.json({ error: "Không đăng nhập được, thử lại sau" }, { status: 500 });
  }
  // Luôn chạy verifyPassword (kể cả khi không có user) để thời gian phản hồi không lộ email tồn tại.
  const ok = await verifyPassword(password, user?.password_hash ?? null);
  if (!user || user.disabled || !ok) return NextResponse.json({ error: BAD }, { status: 401 });

  const { token, expires } = await createSession(user.id);
  await supabase.from("hr_users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", sessionCookie(token, expires));
  return res;
}
