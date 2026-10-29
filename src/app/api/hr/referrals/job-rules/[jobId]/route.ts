import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser } from "@/lib/hr-session";
import { parseRule, type CommissionRule } from "@/lib/referral-commission";
import { loadJobRules } from "@/lib/referral-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function respond(jobId: string) {
  const r = await loadJobRules(jobId);
  return NextResponse.json({ internal: r.internal ?? null, external: r.external ?? null });
}

export async function GET(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const auth = await requireHrUser(req, "referrals.view");
  if ("response" in auth) return auth.response;
  const { jobId } = await params;
  if (!UUID_RE.test(jobId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    return await respond(jobId);
  } catch (e) {
    console.error("[referrals] job-rules GET", e);
    return NextResponse.json({ error: "Không đọc được quy tắc của job" }, { status: 500 });
  }
}

/** PUT { internal?: rule|null, external?: rule|null } — null = xoá dòng; thiếu key = giữ nguyên. */
export async function PUT(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const auth = await requireHrUser(req, "referrals.manage");
  if ("response" in auth) return auth.response;
  const { jobId } = await params;
  if (!UUID_RE.test(jobId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Yêu cầu không hợp lệ" }, { status: 400 });
  const changes: { kind: "internal" | "external"; rule: CommissionRule | null }[] = [];
  for (const kind of ["internal", "external"] as const) {
    const v = (body as Record<string, unknown>)[kind];
    if (v === undefined) continue;
    if (v === null) {
      changes.push({ kind, rule: null });
      continue;
    }
    const r = parseRule(v);
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
    changes.push({ kind, rule: r });
  }
  if (!changes.length) return NextResponse.json({ error: "Không có gì để lưu" }, { status: 400 });
  try {
    const db = getSupabaseAdmin();
    const { data: job, error: jobErr } = await db.from("jobs").select("id").eq("id", jobId).maybeSingle();
    if (jobErr) throw new Error(jobErr.message);
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    for (const c of changes) {
      const q = c.rule
        ? db.from("referral_job_rules").upsert(
            { job_id: jobId, kind: c.kind, rule: c.rule, updated_by: auth.ctx.user.displayName, updated_at: new Date().toISOString() },
            { onConflict: "job_id,kind" },
          )
        : db.from("referral_job_rules").delete().eq("job_id", jobId).eq("kind", c.kind);
      const { error } = await q;
      if (error) throw new Error(error.message);
    }
    return await respond(jobId);
  } catch (e) {
    console.error("[referrals] job-rules PUT", e);
    return NextResponse.json({ error: "Không lưu được quy tắc của job" }, { status: 500 });
  }
}
