import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { backupCandidates, type BackupApp } from "@/lib/offer-fallback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Ứng viên dự phòng cùng job khi ứng viên rút offer (quyền apps.offer). Đọc không giới hạn phạm vi để
 * Kế toán (chỉ thấy từ Interview) không bị báo nhầm "không còn ai": Sếp/HR nhận tên + trạng thái,
 * vai khác chỉ nhận số lượng (không lộ hồ sơ ngoài phạm vi của họ).
 */
export async function GET(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "apps.offer");
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  const { id } = await params;
  const app = await loadScopedApplication(ctx, id, "id, job_id").catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = getSupabaseAdmin();
  const jobId = String(app.job_id);
  // "Bị chặn" nằm ở bảng xếp hạng theo job (job_ranking_entries.blocked), không phải trên hồ sơ.
  const [apps, st, rank] = await Promise.all([
    db.from("applications").select("id, job_id, full_name, status, work_type").eq("job_id", jobId),
    db.from("application_statuses").select("key, kind"),
    db.from("job_ranking_entries").select("application_id").eq("job_id", jobId).eq("blocked", true),
  ]);
  const err = apps.error ?? st.error ?? rank.error;
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  const blocked = new Set((rank.data ?? []).map((r) => String(r.application_id)));
  const openKeys = new Set((st.data ?? []).filter((s) => s.kind === "open").map((s) => String(s.key)));
  const rows = ((apps.data ?? []) as BackupApp[]).map((a) => ({ ...a, blocked: blocked.has(a.id) }));
  const r = backupCandidates(rows, { id, job_id: jobId }, openKeys);

  const full = ctx.role === "boss" || ctx.role === "hr";
  if (!full) return NextResponse.json({ full: false, poolCount: r.pool.length, openCount: r.open.length });
  const pick = (a: BackupApp) => ({ id: a.id, full_name: a.full_name, status: a.status });
  return NextResponse.json({ full: true, pool: r.pool.map(pick), open: r.open.map(pick) });
}
