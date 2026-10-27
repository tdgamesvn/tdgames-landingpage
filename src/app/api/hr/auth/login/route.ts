import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyPassword } from "@/lib/hr-crypto";
import { createSession, sessionCookie } from "@/lib/hr-session";
import { clientIp, createLimiter } from "@/lib/hr-rate-limit";

const BAD = "Email hoặc mật khẩu không đúng";
const TOO_MANY = "Thử quá nhiều lần, vui lòng đợi 15 phút.";
const WINDOW = 15 * 60 * 1000;
// Chỉ đếm lần đăng nhập thất bại: 10 / email, 30 / IP trong 15 phút.
const emailFails = createLimiter(10, WINDOW);
const ipFails = createLimiter(30, WINDOW);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password || password.length > 200) return NextResponse.json({ error: BAD }, { status: 401 });

  const ip = clientIp(req.headers.get("x-forwarded-for"));
  if (emailFails.blocked(email) || ipFails.blocked(ip)) {
    return NextResponse.json({ error: TOO_MANY }, { status: 429 });
  }

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
  // verifyPassword tự tính scrypt giả khi không có hash → thời gian phản hồi không lộ email tồn tại.
  const ok = await verifyPassword(password, user?.password_hash ?? null);
  if (!user || user.disabled || !ok) {
    emailFails.hit(email);
    ipFails.hit(ip);
    return NextResponse.json({ error: BAD }, { status: 401 });
  }
  emailFails.reset(email);

  const { token, expires } = await createSession(user.id);
  await supabase.from("hr_users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", sessionCookie(token, expires));
  return res;
}
