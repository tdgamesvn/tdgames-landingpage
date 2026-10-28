import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScope } from "@/lib/hr-session";
import { inScope, redactApplication } from "@/lib/hr-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireHrUser(request);
  if ("response" in auth) return auth.response;
  const { ctx } = auth;

  const supabase = getSupabaseAdmin();
  const scope = await loadScope(ctx).catch(() => null);
  if (!scope) return NextResponse.json({ error: "Không đọc được phạm vi dữ liệu" }, { status: 500 });

  // Leader không có job nào → không có hồ sơ nào (không tải rồi lọc).
  if (ctx.role === "leader" && scope.leaderJobIds.length === 0) {
    return NextResponse.json({ applications: [], total: 0 });
  }

  let query = supabase
    .from("applications")
    .select("*, jobs(title, slug), interview_sessions(id, round, title, scheduled_at, mode, meet_url), test_submissions(count)")
    .order("created_at", { ascending: false });
  if (ctx.role === "leader") query = query.in("job_id", scope.leaderJobIds);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Hồ sơ có thư mời đang chờ Sếp duyệt → nhãn "Chờ duyệt offer" trên thẻ. Lỗi đọc (vd. chưa áp migration) → bỏ nhãn, không chặn danh sách.
  const pendingOffers = new Set<string>();
  {
    const { data: pend, error: pendErr } = await supabase
      .from("offer_letters")
      .select("application_id")
      .eq("approval_status", "pending");
    if (pendErr) console.error("applications: đọc offer_letters pending lỗi:", pendErr.message);
    for (const r of pend ?? []) pendingOffers.add(String(r.application_id));
  }

  const rows = ((data ?? []) as unknown as Record<string, unknown>[])
    .filter((a) => inScope(scope, { job_id: String(a.job_id), status: String(a.status), offer_status: (a.offer_status as string | null) ?? null }))
    // Gỡ field theo quyền (kể cả interview_sessions lồng bên trong).
    .map((a) => redactApplication({ ...a, offer_approval_status: pendingOffers.has(String(a.id)) ? "pending" : null }, ctx.perms));

  return NextResponse.json({ applications: rows, total: rows.length });
}
