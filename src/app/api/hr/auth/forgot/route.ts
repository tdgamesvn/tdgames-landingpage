import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { issueToken } from "@/lib/hr-session";
import { buildPasswordResetEmail } from "@/lib/hr-staff-email";
import { sendStaffEmail } from "@/lib/hr-email-send";

// Luôn trả { ok: true } để không lộ email nào tồn tại / bị khoá.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email) {
    try {
      const { data: user } = await getSupabaseAdmin()
        .from("hr_users")
        .select("id, display_name, disabled")
        .eq("email", email)
        .maybeSingle();
      if (user && !user.disabled) {
        const origin = new URL(req.url).origin || "https://tdgamestudio.com";
        const token = await issueToken(user.id, "reset");
        const link = `${origin}/hr/set-password?token=${token}`;
        const sent = await sendStaffEmail(email, buildPasswordResetEmail({ displayName: user.display_name, link }));
        if ("error" in sent) console.error("[hr-forgot] gửi mail lỗi:", sent.error);
      }
    } catch (e) {
      console.error("[hr-forgot] lỗi:", e instanceof Error ? e.message : e);
    }
  }
  return NextResponse.json({ ok: true });
}
