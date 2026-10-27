import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireBoss, hrPublicOrigin, issueToken } from "@/lib/hr-session";
import { HR_ROLES, ROLE_LABEL, type HrRole } from "@/lib/hr-permissions";
import { isValidEmail } from "@/lib/hr-email";
import { parseDiscordId } from "@/lib/hr-users";
import { buildStaffInviteEmail } from "@/lib/hr-staff-email";
import { sendStaffEmail } from "@/lib/hr-email-send";

type UserRow = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  disabled: boolean;
  created_at: string | null;
  last_login_at: string | null;
  discord_user_id: string | null;
  password_hash?: string | null;
};

const DISCORD_ID_ERROR = "ID Discord phải là dãy 17–20 chữ số (Discord → bật Developer Mode → chuột phải tên → Copy User ID)";

/** Trạng thái hiển thị; KHÔNG trả password_hash ra ngoài. */
function toPublic(u: UserRow) {
  const { password_hash, ...rest } = u;
  return { ...rest, status: u.disabled ? "disabled" : password_hash ? "active" : "invited" };
}

export async function GET(req: Request) {
  const auth = await requireBoss(req);
  if ("response" in auth) return auth.response;
  const { data, error } = await getSupabaseAdmin()
    .from("hr_users")
    .select("id, email, display_name, role, disabled, created_at, last_login_at, discord_user_id, password_hash")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: (data ?? []).map((u) => toPublic(u as UserRow)) });
}

export async function POST(req: Request) {
  const auth = await requireBoss(req);
  if ("response" in auth) return auth.response;
  const { ctx } = auth;

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const displayName = typeof body?.display_name === "string" ? body.display_name.trim() : "";
  const role = body?.role;
  if (!isValidEmail(email) || email.length > 320) return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
  if (displayName.length < 1 || displayName.length > 80) {
    return NextResponse.json({ error: "Tên hiển thị phải từ 1 đến 80 ký tự" }, { status: 400 });
  }
  if (typeof role !== "string" || !(HR_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json({ error: "Vai không hợp lệ" }, { status: 400 });
  }
  const discordId = parseDiscordId(body?.discord_user_id);
  if (discordId === "invalid") return NextResponse.json({ error: DISCORD_ID_ERROR }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("hr_users")
    .insert({ email, display_name: displayName, role, discord_user_id: discordId })
    .select("id, email, display_name, role, disabled, created_at, last_login_at, discord_user_id, password_hash")
    .single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Email đã có tài khoản" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    const token = await issueToken(user.id, "invite");
    const link = `${hrPublicOrigin()}/hr/set-password?token=${token}`;
    const sent = await sendStaffEmail(
      email,
      buildStaffInviteEmail({
        displayName,
        roleLabel: ROLE_LABEL[role as HrRole],
        link,
        invitedBy: ctx.user.displayName,
      }),
    );
    if ("error" in sent) throw new Error(sent.error);
  } catch (e) {
    // Giữ nguyên tài khoản để Sếp bấm "gửi lại lời mời".
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[hr-users] gửi mail mời lỗi:", msg);
    return NextResponse.json({ user: toPublic(user as UserRow), warning: `Đã tạo tài khoản nhưng gửi mail mời lỗi: ${msg}` });
  }
  return NextResponse.json({ user: toPublic(user as UserRow) });
}
