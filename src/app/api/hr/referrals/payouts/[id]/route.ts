import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { vnDateKey } from "@/lib/interview-schedule";
import { checkPayoutAction, isSelfPayout, parsePayoutAction, statusAfterPayoutEdit } from "@/lib/referral-commission";
import { notifyReferralPayouts } from "@/lib/hr-notify";
import { loadPayoutActor, loadPayoutRow, toPayoutView } from "@/lib/referral-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Duyệt / huỷ / đã chuyển khoản / sửa 1 khoản. Quyền theo từng thao tác (checkPayoutAction).
 * Không phải Sếp: không duyệt/sửa/trả khoản của chính mình; sửa số tiền khoản đã duyệt → về "Chờ xác nhận".
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHrUser(req);
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const action = parsePayoutAction(await req.json().catch(() => null));
  if ("error" in action) return NextResponse.json({ error: action.error }, { status: 400 });

  const today = vnDateKey(new Date());
  const boss = ctx.role === "boss";
  try {
    const actor = await loadPayoutActor(ctx.user.id);
    const row = await loadPayoutRow(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: app, error: appErr } = await getSupabaseAdmin()
      .from("applications")
      .select("offer_status, referred_by")
      .eq("id", row.application_id)
      .maybeSingle();
    if (appErr) throw new Error(appErr.message);
    let referrerHrUserId: string | null = null;
    if (row.referrer_id) {
      const { data: ref, error: refErr } = await getSupabaseAdmin().from("referrers").select("hr_user_id").eq("id", row.referrer_id).maybeSingle();
      if (refErr) throw new Error(refErr.message);
      referrerHrUserId = (ref?.hr_user_id as string | null) ?? null;
    }
    const self = isSelfPayout(row, { referrerHrUserId, referredBy: (app?.referred_by as string | null) ?? null }, actor);
    const denied = checkPayoutAction(ctx.perms, row, action, today, app?.offer_status === "accepted", { boss, self });
    if (denied) return NextResponse.json({ error: denied.message }, { status: denied.code === "forbidden" ? 403 : 400 });

    const now = new Date().toISOString();
    const by = ctx.user.displayName;
    let patch: Record<string, unknown>;
    switch (action.action) {
      case "approve":
        patch = { status: "approved", approved_by: by, approved_at: now };
        break;
      case "pay":
        patch = { status: "paid", paid_by: by, paid_date: action.paid_date };
        break;
      case "cancel":
        patch = { status: "cancelled", cancel_reason: action.reason };
        break;
      case "edit": {
        patch = {};
        const edits: unknown[] = [];
        const log = (field: string, oldV: unknown, newV: unknown) =>
          edits.push({ at: now, by, by_user_id: ctx.user.id, field, old: oldV, new: newV });
        const amountChanged = action.amount !== undefined && action.amount !== row.amount;
        const dueChanged = action.due_date !== undefined && action.due_date !== row.due_date;
        if (amountChanged) {
          patch.amount = action.amount;
          patch.amount_edited = true;
          patch.amount_issue = null;
          log("amount", row.amount, action.amount);
        }
        if (dueChanged) {
          patch.due_date = action.due_date;
          log("due_date", row.due_date, action.due_date);
        }
        const nextStatus = statusAfterPayoutEdit(
          row.status,
          { amountChanged, dueChanged, newDue: action.due_date ?? null, oldDue: row.due_date },
          boss,
          today,
        );
        if (nextStatus !== row.status) {
          patch.status = nextStatus;
          if (row.status === "approved") {
            // Sửa tiền khoản đã duyệt → phải duyệt lại; nhắc lại HR và Kế toán theo vòng mới.
            patch.approved_by = null;
            patch.approved_at = null;
            patch.approved_notified_at = null;
            log("status", row.status, nextStatus);
          }
        }
        if (dueChanged || (nextStatus !== row.status && row.status === "approved")) patch.due_notified_at = null; // được nhắc lại khi (tới) hạn
        if (action.note !== undefined && action.note !== row.note) {
          patch.note = action.note;
          log("note", row.note, action.note);
        }
        if (!edits.length) return NextResponse.json({ payout: await toPayoutView(row, today, actor) });
        patch.edits = [...(Array.isArray(row.edits) ? row.edits : []), ...edits];
        break;
      }
    }

    const { data, error } = await getSupabaseAdmin()
      .from("referral_payouts")
      .update(patch)
      .eq("id", id)
      .eq("status", row.status)
      .select("id");
    if (error) throw new Error(error.message);
    if (!data?.length) return NextResponse.json({ error: "Khoản vừa được người khác cập nhật" }, { status: 409 });

    if (action.action === "approve") {
      // Báo Kế toán ngay; cron là lưới an toàn nếu bước này lỗi (chưa set approved_notified_at).
      try {
        const { data: a } = await getSupabaseAdmin()
          .from("applications").select("full_name, assignee_user_id").eq("id", row.application_id).maybeSingle();
        const delivered = await notifyReferralPayouts("approved", [{
          application_id: row.application_id, candidate_name: String(a?.full_name ?? "Ứng viên"),
          assignee_user_id: (a?.assignee_user_id as string | null) ?? null, amount_issue: row.amount_issue,
        }]);
        if (delivered) await getSupabaseAdmin().from("referral_payouts").update({ approved_notified_at: now }).eq("id", id).eq("status", "approved");
      } catch (e) {
        console.error("[referrals] notify approved", id, e);
      }
    }

    const fresh = await loadPayoutRow(id);
    if (!fresh) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ payout: await toPayoutView(fresh, today, actor) });
  } catch (e) {
    console.error("[referrals] payouts PATCH", id, e);
    return NextResponse.json({ error: "Không cập nhật được khoản hoa hồng" }, { status: 500 });
  }
}
