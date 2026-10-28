import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireBoss, hrPublicOrigin, issueToken } from "@/lib/hr-session";
import { HR_ROLES, ROLE_LABEL, type HrRole } from "@/lib/hr-permissions";
import { parseDiscordId, parsePhone, validateUserChange } from "@/lib/hr-users";
import { buildStaffInviteEmail } from "@/lib/hr-staff-email";
import { sendStaffEmail } from "@/lib/hr-email-send";

const COLS = "id, email, display_name, role, disabled, created_at, last_login_at, discord_user_id, phone, password_hash";

type Row = {
  id: string;
  email: string;
  display_name: string;
  role: HrRole;
  disabled: boolean;
  created_at: string | null;
  last_login_at: string | null;
  discord_user_id: string | null;
  phone: string | null;
  password_hash: string | null;
};

function toPublic(u: Row) {
  const { password_hash, ...rest } = u;
  return { ...rest, status: u.disabled ? "disabled" : password_hash ? "active" : "invited" };
}

export async function PATCH(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  const auth = await requireBoss(req);
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  const { id } = await ctxRoute.params;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

  const change: { display_name?: string; role?: HrRole; disabled?: boolean; discord_user_id?: string | null; phone?: string | null } = {};
  if (body.display_name !== undefined) {
    const n = typeof body.display_name === "string" ? body.display_name.trim() : "";
    if (n.length < 1 || n.length > 80) return NextResponse.json({ error: "Tên hiển thị phải từ 1 đến 80 ký tự" }, { status: 400 });
    change.display_name = n;
  }
  if (body.role !== undefined) {
    if (typeof body.role !== "string" || !(HR_ROLES as readonly string[]).includes(body.role)) {
      return NextResponse.json({ error: "Vai không hợp lệ" }, { status: 400 });
    }
    change.role = body.role as HrRole;
  }
  if (body.disabled !== undefined) {
    if (typeof body.disabled !== "boolean") return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    change.disabled = body.disabled;
  }
  if (body.discord_user_id !== undefined) {
    const d = parseDiscordId(body.discord_user_id);
    if (d === "invalid") {
      return NextResponse.json(
        { error: "ID Discord phải là dãy 17–20 chữ số (Discord → bật Developer Mode → chuột phải tên → Copy User ID)" },
        { status: 400 },
      );
    }
    change.discord_user_id = d;
  }
  if (body.phone !== undefined) {
    const ph = parsePhone(body.phone);
    if (ph === "invalid") return NextResponse.json({ error: "Số điện thoại không hợp lệ (9–13 chữ số, có thể bắt đầu bằng +)" }, { status: 400 });
    change.phone = ph;
  }
  const resend = body.resend_invite === true;

  const supabase = getSupabaseAdmin();
  const { data: target, error: findError } = await supabase.from("hr_users").select(COLS).eq("id", id).maybeSingle();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
  if (!target) return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
  const t = target as Row;

  const { count: bossCount, error: countError } = await supabase
    .from("hr_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "boss")
    .eq("disabled", false);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  const invalid = validateUserChange(ctx.user, { id: t.id, role: t.role, disabled: t.disabled }, change, bossCount ?? 0);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  if (resend && (t.password_hash || t.disabled)) {
    return NextResponse.json({ error: "Chỉ gửi lại lời mời cho tài khoản chưa đặt mật khẩu và chưa bị khoá" }, { status: 400 });
  }

  let current = t;
  if (Object.keys(change).length > 0) {
    const { data: updated, error: updError } = await supabase
      .from("hr_users")
      .update(change)
      .eq("id", id)
      .select(COLS)
      .single();
    if (updError) return NextResponse.json({ error: updError.message }, { status: 500 });
    current = updated as Row;

    if (change.disabled === true) {
      const { error } = await supabase.from("hr_sessions").delete().eq("user_id", id);
      if (error) return NextResponse.json({ error: `Đã khoá nhưng xoá phiên lỗi: ${error.message}` }, { status: 500 });
    }
    // Rời vai được phụ trách job (Leader / Sếp) → gỡ khỏi các job đang phụ trách.
    const canLead = (r: string) => r === "leader" || r === "boss";
    if (change.role !== undefined && canLead(t.role) && !canLead(change.role)) {
      const { error } = await supabase.from("jobs").update({ leader_user_id: null }).eq("leader_user_id", id);
      if (error) return NextResponse.json({ error: `Đã đổi vai nhưng gỡ Leader khỏi job lỗi: ${error.message}` }, { status: 500 });
    }
  }

  if (resend) {
    try {
      const token = await issueToken(id, "invite");
      const link = `${hrPublicOrigin()}/hr/set-password?token=${token}`;
      const sent = await sendStaffEmail(
        current.email,
        buildStaffInviteEmail({
          displayName: current.display_name,
          roleLabel: ROLE_LABEL[current.role],
          link,
          invitedBy: ctx.user.displayName,
        }),
      );
      if ("error" in sent) throw new Error(sent.error);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[hr-users] gửi lại mail mời lỗi:", msg);
      return NextResponse.json({ user: toPublic(current), warning: `Gửi mail mời lỗi: ${msg}` });
    }
  }
  return NextResponse.json({ user: toPublic(current) });
}
