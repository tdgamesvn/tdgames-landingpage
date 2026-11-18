import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { hasLockedPayout, parseAppReferralPatch, resolveBeneficiary } from "@/lib/referral-commission";
import {
  applyStartDateChange,
  deleteOpenPayouts,
  effectiveStartDate,
  loadPayouts,
  loadPlacement,
  loadReferralBasics,
  reapplyLeaveCancel,
  savePlacement,
  syncApplicationPayouts,
} from "@/lib/referral-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    needs_manual: placement?.needs_manual ?? false,
    needs_manual_reason: placement?.needs_manual_reason ?? null,
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

    // Ghi ngày nghỉ trước để bước áp lại huỷ mốc (trong applyStartDateChange) dùng ngày nghỉ mới.
    if (patch.left_date !== undefined) await savePlacement(id, { left_date: patch.left_date });

    if (patch.start_date !== undefined) {
      // Ghi ngày đi làm → dời hạn khoản → áp lại huỷ mốc sau ngày nghỉ.
      await applyStartDateChange(id, patch.start_date);
    } else if (patch.left_date !== undefined && patch.left_date !== null) {
      // Chỉ đặt ngày nghỉ: áp lại huỷ mốc sau ngày nghỉ.
      await reapplyLeaveCancel(id);
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
