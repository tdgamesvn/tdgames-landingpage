import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { parseReferrerInput } from "@/lib/referral-commission";
import { loadReferralBasics } from "@/lib/referral-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Danh sách rút gọn (chọn người giới thiệu); không có SĐT / ngân hàng. */
export async function GET(req: Request) {
  const auth = await requireHrUser(req, "referrals.view");
  if ("response" in auth) return auth.response;
  try {
    const { referrers } = await loadReferralBasics();
    return NextResponse.json({
      referrers: referrers.map((r) => ({ id: r.id, name: r.name, kind: r.kind, ref_codes: r.ref_codes, active: r.active })),
    });
  } catch (e) {
    console.error("[referrals] referrers GET", e);
    return NextResponse.json({ error: "Không đọc được danh sách người giới thiệu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireHrUser(req, "referrals.manage");
  if ("response" in auth) return auth.response;
  const body = await req.json().catch(() => null);
  try {
    const { staff, referrers } = await loadReferralBasics();
    const input = parseReferrerInput(body, { staff, referrers, selfId: null });
    if ("error" in input) return NextResponse.json({ error: input.error }, { status: input.status });
    const { data, error } = await getSupabaseAdmin().from("referrers").insert(input).select().single();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Mã ref hoặc tài khoản đã có người giới thiệu" }, { status: 409 });
      throw new Error(error.message);
    }
    return NextResponse.json({ referrer: data }, { status: 201 });
  } catch (e) {
    console.error("[referrals] referrers POST", e);
    return NextResponse.json({ error: "Không tạo được người giới thiệu" }, { status: 500 });
  }
}
