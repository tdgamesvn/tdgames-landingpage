import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyPassword } from "@/lib/hr-crypto";
import { createSession, sessionCookie } from "@/lib/hr-session";
import { clientIp, createLimiter } from "@/lib/hr-rate-limit";

const BAD = "Email hoặc mật khẩu không đúng";
const TOO_MANY = "Thử quá nhiều lần, vui lòng đợi 15 phút.";
const WINDOW = 15 * 60 * 1000;
// Đặt chỗ (tryHit) TRƯỚC khi tốn scrypt để request song song không lách được hạn mức.
// Theo cặp email|IP (kẻ ở IP khác không khoá được người thật): 10 / 15 phút; theo IP: 30; theo email toàn cục: 20 (chốt chặn).
// Đăng nhập thành công thì hoàn lại lượt IP + email toàn cục và xoá bộ đếm cặp.
const pairLimit = createLimiter(10, WINDOW);
const ipLimit = createLimiter(30, WINDOW);
const emailLimit = createLimiter(20, WINDOW);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password || password.length > 200 || email.length > 320) return NextResponse.json({ error: BAD }, { status: 401 });

  const ip = clientIp(req.headers);
  const pairKey = `${email}|${ip}`;
  // Đặt chỗ lần lượt; dừng ở limiter đầu tiên từ chối rồi hoàn lại các lượt đã đặt trước đó.
  const took: Array<[typeof pairLimit, string]> = [];
  let allowed = true;
  for (const [lim, key] of [[pairLimit, pairKey], [ipLimit, ip], [emailLimit, email]] as const) {
    if (!allowed) break;
    if (lim.tryHit(key)) took.push([lim, key]);
    else allowed = false;
  }
  if (!allowed) {
    for (const [lim, key] of took) lim.undo(key);
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
    pairLimit.undo(pairKey);
    ipLimit.undo(ip);
    emailLimit.undo(email);
    return NextResponse.json({ error: "Không đăng nhập được, thử lại sau" }, { status: 500 });
  }
  // verifyPassword tự tính scrypt giả khi không có hash → thời gian phản hồi không lộ email tồn tại.
  const ok = await verifyPassword(password, user?.password_hash ?? null);
  if (!user || user.disabled || !ok) return NextResponse.json({ error: BAD }, { status: 401 });
  pairLimit.reset(pairKey);
  ipLimit.undo(ip);
  emailLimit.undo(email);

  const { token, expires } = await createSession(user.id);
  await supabase.from("hr_users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", sessionCookie(token, expires));
  return res;
}
