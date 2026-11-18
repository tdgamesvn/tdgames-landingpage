import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScope } from "@/lib/hr-session";
import { inScope, redactApplication } from "@/lib/hr-scope";
import { isOnboardingEligible } from "@/lib/hr-onboarding";
import { loadOnboardingSummaries, type OnboardingSummary } from "@/lib/hr-onboarding-store";

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
  // Chỉ người có quyền offer (Kế toán + Sếp) thấy nhãn này.
  if (ctx.perms.has("emails.send_offer")) {
    const { data: pend, error: pendErr } = await supabase
      .from("offer_letters")
      .select("application_id")
      .eq("approval_status", "pending");
    if (pendErr) console.error("applications: đọc offer_letters pending lỗi:", pendErr.message);
    for (const r of pend ?? []) pendingOffers.add(String(r.application_id));
  }

  const scoped = ((data ?? []) as unknown as Record<string, unknown>[]).filter((a) =>
    inScope(scope, { job_id: String(a.job_id), status: String(a.status), offer_status: (a.offer_status as string | null) ?? null }),
  );

  // Tiến độ onboard trên thẻ (chỉ người có onboard.view, hồ sơ đã nhận offer). Lỗi → log + bỏ field, không chặn danh sách.
  let onboarding = new Map<string, OnboardingSummary>();
  if (ctx.perms.has("onboard.view")) {
    const ids = scoped
      .filter((a) => isOnboardingEligible({ offer_status: (a.offer_status as string | null) ?? null, work_type: (a.work_type as string | null) ?? null }))
      .map((a) => String(a.id));
    try {
      onboarding = await loadOnboardingSummaries(ids);
    } catch (e) {
      console.error("applications: đọc tóm tắt onboard lỗi:", e instanceof Error ? e.message : e);
    }
  }

  // Gỡ field theo quyền (kể cả interview_sessions lồng bên trong).
  const rows = scoped.map((a) => {
    const red = redactApplication({ ...a, offer_approval_status: pendingOffers.has(String(a.id)) ? "pending" : null }, ctx.perms);
    const ob = onboarding.get(String(a.id));
    return ob ? { ...red, onboarding: { start_date: ob.start_date, confirmed: ob.confirmed, done: ob.done, total: ob.total } } : red;
  });

  return NextResponse.json({ applications: rows, total: rows.length });
}
