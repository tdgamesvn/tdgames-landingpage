import { after, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hrPublicOrigin, issueToken } from "@/lib/hr-session";
import { buildPasswordResetEmail } from "@/lib/hr-staff-email";
import { sendStaffEmail } from "@/lib/hr-email-send";
import { clientIp, createLimiter } from "@/lib/hr-rate-limit";

// Tối đa 3 yêu cầu / email / giờ; quá hạn thì bỏ qua âm thầm (vẫn trả 200).
const forgotLimiter = createLimiter(3, 60 * 60 * 1000);
// Và tối đa 10 yêu cầu / IP / giờ.
const forgotIpLimiter = createLimiter(10, 60 * 60 * 1000);

async function processForgot(email: string, ip: string) {
  if (!forgotIpLimiter.tryHit(ip)) return;
  if (!forgotLimiter.tryHit(email)) return;
  const { data: user } = await getSupabaseAdmin()
    .from("hr_users")
    .select("id, display_name, disabled")
    .eq("email", email)
    .maybeSingle();
  if (!user || user.disabled) return;
  const token = await issueToken(user.id, "reset");
  const link = `${hrPublicOrigin()}/hr/set-password?token=${token}`;
  const sent = await sendStaffEmail(email, buildPasswordResetEmail({ displayName: user.display_name, link }));
  if ("error" in sent) console.error("[hr-forgot] gửi mail lỗi:", sent.error);
}

// Luôn trả { ok: true } ngay; việc tra DB + gửi mail chạy sau response để thời gian phản hồi không lộ email tồn tại.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const ip = clientIp(req.headers);
  if (email && email.length <= 320) {
    after(async () => {
      try {
        await processForgot(email, ip);
      } catch (e) {
        console.error("[hr-forgot] lỗi:", e instanceof Error ? e.message : e);
      }
    });
  }
  return NextResponse.json({ ok: true });
}
