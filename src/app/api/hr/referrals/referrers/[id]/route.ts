import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { parseReferrerInput } from "@/lib/referral-commission";
import { loadReferralBasics } from "@/lib/referral-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Gộp bản cũ + body rồi kiểm lại toàn bộ (mã trùng, liên kết tài khoản…). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHrUser(req, "referrals.manage");
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  try {
    const db = getSupabaseAdmin();
    const { data: old, error: oldErr } = await db
      .from("referrers")
      .select("name, kind, ref_codes, hr_user_id, phone, email, bank_info, note, active, rule")
      .eq("id", id)
      .maybeSingle();
    if (oldErr) throw new Error(oldErr.message);
    if (!old) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { staff, referrers } = await loadReferralBasics();
    const input = parseReferrerInput({ ...old, ...(body as Record<string, unknown>) }, { staff, referrers, selfId: id });
    if ("error" in input) return NextResponse.json({ error: input.error }, { status: input.status });
    const { data, error } = await db
      .from("referrers")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Mã ref hoặc tài khoản đã có người giới thiệu" }, { status: 409 });
      throw new Error(error.message);
    }
    return NextResponse.json({ referrer: data });
  } catch (e) {
    console.error("[referrals] referrers PATCH", e);
    return NextResponse.json({ error: "Không cập nhật được người giới thiệu" }, { status: 500 });
  }
}
