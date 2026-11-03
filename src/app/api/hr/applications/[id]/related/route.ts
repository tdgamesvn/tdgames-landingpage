import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScope, loadScopedApplication } from "@/lib/hr-session";
import { inScope } from "@/lib/hr-scope";
import { normalizeEmail, normalizePhone } from "@/lib/hr-duplicates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLS = "id, job_id, status, offer_status, created_at, ai_score, duplicate_kind, jobs(title)";

/**
 * GET /api/hr/applications/:id/related — hồ sơ khác của cùng người (trùng email hoặc SĐT đã chuẩn hoá).
 * Chỉ trả hồ sơ người xem có quyền xem; số còn lại → `hidden`. Không trả email/SĐT; ai_score cần apps.view_ai.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHrUser(request);
  if ("response" in auth) return auth.response;
  const { ctx } = auth;

  const { id } = await params;
  const app = await loadScopedApplication(ctx, id, "email, phone").catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = getSupabaseAdmin();
  const e = normalizeEmail(app.email);
  const p = normalizePhone(app.phone);
  const empty = Promise.resolve({ data: [] as Record<string, unknown>[], error: null });
  const [byEmail, byPhone] = await Promise.all([
    e ? supabase.from("applications").select(COLS).eq("email_norm", e).neq("id", id) : empty,
    p ? supabase.from("applications").select(COLS).eq("phone_norm", p).neq("id", id) : empty,
  ]);
  // Migration chưa áp (chưa có cột chuẩn hoá) → coi như không có hồ sơ khác.
  if (byEmail.error || byPhone.error) return NextResponse.json({ related: [], hidden: 0 });

  const rows = new Map<string, Record<string, unknown>>();
  for (const r of [...(byEmail.data ?? []), ...(byPhone.data ?? [])] as Record<string, unknown>[]) rows.set(String(r.id), r);

  const full = ctx.role === "boss" || ctx.role === "hr";
  const scope = full ? null : await loadScope(ctx).catch(() => null);
  const viewAi = ctx.perms.has("apps.view_ai");
  const related: { id: string; job_title: string | null; status: string; created_at: string; ai_score: number | null; duplicate_kind: string | null }[] = [];
  let hidden = 0;
  for (const r of rows.values()) {
    const visible =
      full ||
      (!!scope &&
        inScope(scope, { job_id: String(r.job_id), status: String(r.status), offer_status: (r.offer_status as string | null) ?? null }));
    if (!visible) {
      hidden++;
      continue;
    }
    const j = r.jobs as { title?: string | null } | { title?: string | null }[] | null;
    const job = Array.isArray(j) ? j[0] : j;
    related.push({
      id: String(r.id),
      job_title: job?.title ?? null,
      status: String(r.status),
      created_at: String(r.created_at),
      ai_score: viewAi ? ((r.ai_score as number | null) ?? null) : null,
      duplicate_kind: (r.duplicate_kind as string | null) ?? null,
    });
  }
  related.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return NextResponse.json({ related, hidden });
}
