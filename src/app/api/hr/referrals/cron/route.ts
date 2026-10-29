import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireCronOrHr } from "@/lib/hr-session";
import { vnDateKey } from "@/lib/interview-schedule";
import { notifyReferralPayouts } from "@/lib/hr-notify";
import type { AmountIssue } from "@/lib/referral-commission";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = { id: string; application_id: string; amount_issue: AmountIssue | null; applications: unknown };

function toNotifyRows(rows: Row[]) {
  return rows.map((r) => {
    const a = (Array.isArray(r.applications) ? r.applications[0] : r.applications) as
      | { full_name?: string; assignee_user_id?: string | null } | null | undefined;
    return {
      application_id: r.application_id,
      candidate_name: String(a?.full_name ?? "Ứng viên"),
      assignee_user_id: a?.assignee_user_id ?? null,
      amount_issue: r.amount_issue,
    };
  });
}

/** Cron hằng ngày: upcoming → due khi đến hạn; nhắc 1 lần/khoản cho due và approved. Idempotent. */
export async function GET(request: Request) {
  const authError = await requireCronOrHr(request);
  if (authError) return authError;
  const supabase = getSupabaseAdmin();
  const today = vnDateKey(new Date());
  try {
    // Chỉ đụng upcoming (không chạm approved/paid/cancelled).
    const moved = await supabase
      .from("referral_payouts")
      .update({ status: "due" })
      .eq("status", "upcoming")
      .not("due_date", "is", null)
      .lte("due_date", today)
      .select("id");
    if (moved.error) throw new Error(moved.error.message);

    const out = { today, movedToDue: moved.data?.length ?? 0, notifiedDue: 0, notifiedApproved: 0 };
    for (const [status, col, event] of [
      ["due", "due_notified_at", "due"],
      ["approved", "approved_notified_at", "approved"],
    ] as const) {
      const { data, error } = await supabase
        .from("referral_payouts")
        .select("id, application_id, amount_issue, applications(full_name, assignee_user_id)")
        .eq("status", status)
        .is(col, null);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Row[];
      if (!rows.length) continue;
      const delivered = await notifyReferralPayouts(event, toNotifyRows(rows));
      if (!delivered) continue; // chưa gửi được kênh nào → để ngày mai thử lại
      const { error: upErr } = await supabase
        .from("referral_payouts")
        .update({ [col]: new Date().toISOString() })
        .in("id", rows.map((r) => r.id))
        .eq("status", status);
      if (upErr) throw new Error(upErr.message);
      if (event === "due") out.notifiedDue = rows.length;
      else out.notifiedApproved = rows.length;
    }
    return NextResponse.json(out);
  } catch (e) {
    console.error("[referrals] cron", e);
    return NextResponse.json({ error: "Cron hoa hồng lỗi" }, { status: 500 });
  }
}
