import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { vnDateKey } from "@/lib/interview-schedule";
import { checkPayoutAction, parsePayoutAction, statusAfterDueEdit } from "@/lib/referral-commission";
import { loadPayoutRow, toPayoutView } from "@/lib/referral-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Duyệt / huỷ / đã chuyển khoản / sửa 1 khoản. Quyền theo từng thao tác (checkPayoutAction). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHrUser(req);
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const action = parsePayoutAction(await req.json().catch(() => null));
  if ("error" in action) return NextResponse.json({ error: action.error }, { status: 400 });

  const today = vnDateKey(new Date());
  try {
    const row = await loadPayoutRow(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: app, error: appErr } = await getSupabaseAdmin()
      .from("applications")
      .select("offer_status")
      .eq("id", row.application_id)
      .maybeSingle();
    if (appErr) throw new Error(appErr.message);
    const denied = checkPayoutAction(ctx.perms, row, action, today, app?.offer_status === "accepted");
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
        if (action.amount !== undefined && action.amount !== row.amount) {
          patch.amount = action.amount;
          patch.amount_edited = true;
          patch.amount_issue = null;
          log("amount", row.amount, action.amount);
        }
        if (action.due_date !== undefined && action.due_date !== row.due_date) {
          patch.due_date = action.due_date;
          patch.status = statusAfterDueEdit(row.status, action.due_date, today);
          log("due_date", row.due_date, action.due_date);
        }
        if (action.note !== undefined && action.note !== row.note) {
          patch.note = action.note;
          log("note", row.note, action.note);
        }
        if (!edits.length) return NextResponse.json({ payout: await toPayoutView(row, today) });
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

    const fresh = await loadPayoutRow(id);
    if (!fresh) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ payout: await toPayoutView(fresh, today) });
  } catch (e) {
    console.error("[referrals] payouts PATCH", id, e);
    return NextResponse.json({ error: "Không cập nhật được khoản hoa hồng" }, { status: 500 });
  }
}
