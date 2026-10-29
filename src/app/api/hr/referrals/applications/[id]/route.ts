import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import {
  cancelOnLeave,
  hasLockedPayout,
  parseAppReferralPatch,
  rescheduleDueDates,
  resolveBeneficiary,
  type PayoutLite,
} from "@/lib/referral-commission";
import {
  deleteOpenPayouts,
  effectiveStartDate,
  loadPayouts,
  loadPlacement,
  loadReferralBasics,
  savePlacement,
  setPayoutStatus,
  syncApplicationPayouts,
  type PayoutRow,
} from "@/lib/referral-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function lite(rows: PayoutRow[]): PayoutLite[] {
  return rows.map((p) => ({
    id: p.id,
    milestone_months: p.milestone_months,
    status: p.status,
    due_date: p.due_date,
    rule_key: p.rule_key,
    amount_edited: p.amount_edited,
    amount_issue: p.amount_issue,
  }));
}

/** Không có lương; chỉ người hưởng, số khoản, ngày đi làm / nghỉ. */
async function buildView(appId: string, referredBy: string | null) {
  const [basics, rows, start, placement] = await Promise.all([
    loadReferralBasics(),
    loadPayouts(appId),
    effectiveStartDate(appId),
    loadPlacement(appId),
  ]);
  const b = resolveBeneficiary(referredBy, basics.staff, basics.referrers);
  return {
    referred_by: referredBy,
    beneficiary: b ? { name: b.name, kind: b.kind } : null,
    payoutCount: rows.filter((p) => p.status !== "cancelled").length,
    start,
    left_date: placement?.left_date ?? null,
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHrUser(req, "referrals.view");
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const app = await loadScopedApplication(auth.ctx, id, "referred_by");
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(await buildView(id, (app.referred_by as string | null) ?? null));
  } catch (e) {
    console.error("[referrals] applications GET", id, e);
    return NextResponse.json({ error: "Không đọc được hoa hồng của hồ sơ" }, { status: 500 });
  }
}

/**
 * Sửa người giới thiệu / ngày đi làm / ngày nghỉ / "Tính lại".
 * Phản hồi kèm needsManual: có khoản đã duyệt/đã trả/sửa tay khác snapshot → không tự sinh lại, cần Sếp/Kế toán xử lý tay.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHrUser(req, "referrals.manage");
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const patch = parseAppReferralPatch(await req.json().catch(() => null));
  if ("error" in patch) return NextResponse.json({ error: patch.error }, { status: 400 });

  try {
    const app = await loadScopedApplication(ctx, id, "referred_by");
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
    let referredBy = (app.referred_by as string | null) ?? null;
    let needSync = patch.recalc === true;
    const changingReferrer = patch.referred_by !== undefined && patch.referred_by !== referredBy;
    if (changingReferrer && hasLockedPayout(await loadPayouts(id))) {
      return NextResponse.json({ error: "Hồ sơ đã có hoa hồng được duyệt/đã trả — không đổi người giới thiệu được" }, { status: 409 });
    }

    if (patch.start_date !== undefined) {
      await savePlacement(id, { start_date: patch.start_date, start_confirmed: patch.start_date !== null });
      const start = await effectiveStartDate(id);
      const changes = rescheduleDueDates(lite(await loadPayouts(id)), start.date);
      for (const c of changes) {
        const { error } = await getSupabaseAdmin()
          .from("referral_payouts")
          .update({ due_date: c.due_date, status: "upcoming" })
          .eq("id", c.id)
          .in("status", ["upcoming", "due"]);
        if (error) throw new Error(error.message);
      }
    }

    if (patch.left_date !== undefined) {
      await savePlacement(id, { left_date: patch.left_date });
      if (patch.left_date !== null) {
        const [dd, mm, yyyy] = [patch.left_date.slice(8, 10), patch.left_date.slice(5, 7), patch.left_date.slice(0, 4)];
        await setPayoutStatus(cancelOnLeave(lite(await loadPayouts(id)), patch.left_date), "cancelled", `UV nghỉ ngày ${dd}/${mm}/${yyyy}`);
      }
    }

    if (changingReferrer) {
      // Bỏ hết khoản chưa duyệt của người cũ trước (kể cả khi mã mới không ai hưởng) rồi mới sinh lại.
      await deleteOpenPayouts(id);
      const { error } = await getSupabaseAdmin().from("applications").update({ referred_by: patch.referred_by }).eq("id", id);
      if (error) throw new Error(error.message);
      await savePlacement(id, {}, {
        at: new Date().toISOString(),
        by: ctx.user.displayName,
        field: "referred_by",
        old: referredBy,
        new: patch.referred_by,
      });
      referredBy = patch.referred_by ?? null;
      needSync = true;
    }

    const sync = needSync ? await syncApplicationPayouts(id, { replaceOpen: true }) : null;
    return NextResponse.json({ ...(await buildView(id, referredBy)), sync, needsManual: sync?.needsManual ?? false });
  } catch (e) {
    console.error("[referrals] applications PATCH", id, e);
    return NextResponse.json({ error: "Không cập nhật được hoa hồng của hồ sơ" }, { status: 500 });
  }
}
