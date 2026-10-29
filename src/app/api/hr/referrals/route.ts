import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { vnDateKey } from "@/lib/interview-schedule";
import { referrerTotals, unknownRefCodes } from "@/lib/referral-commission";
import { loadAllPayoutViews, loadReferralBasics } from "@/lib/referral-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tổng quan tab Hoa hồng: khoản, người giới thiệu (kèm tổng), mã ref lạ, mặc định công ty. Không có lương. */
export async function GET(req: Request) {
  const auth = await requireHrUser(req, "referrals.view");
  if ("response" in auth) return auth.response;
  const today = vnDateKey(new Date());
  try {
    const db = getSupabaseAdmin();
    const [payouts, basics, refRes, appRes] = await Promise.all([
      loadAllPayoutViews(today),
      loadReferralBasics(),
      db.from("referrers").select("id, phone, email, bank_info, note"),
      db.from("applications").select("referred_by").not("referred_by", "is", null),
    ]);
    if (refRes.error) throw new Error(refRes.error.message);
    if (appRes.error) throw new Error(appRes.error.message);
    const extra = new Map((refRes.data ?? []).map((r) => [r.id as string, r]));
    const totals = referrerTotals(payouts.filter((p) => p.status !== "cancelled"));
    const referrers = basics.referrers.map((r) => {
      const x = extra.get(r.id);
      return {
        ...r,
        phone: x?.phone ?? "",
        email: x?.email ?? "",
        bank_info: x?.bank_info ?? "",
        note: x?.note ?? "",
        totals: totals.get(r.id) ?? { paid: 0, outstanding: 0 },
      };
    });
    const unknownCodes = unknownRefCodes((appRes.data ?? []).map((a) => a.referred_by as string | null), basics.staff, basics.referrers);
    return NextResponse.json({ today, payouts, referrers, unknownCodes, defaults: basics.defaults });
  } catch (e) {
    console.error("[referrals] GET", e);
    return NextResponse.json({ error: "Không đọc được dữ liệu hoa hồng" }, { status: 500 });
  }
}
