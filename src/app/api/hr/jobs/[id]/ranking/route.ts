import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import { requireHrUser, loadScope } from "@/lib/hr-session";
import { inScope } from "@/lib/hr-scope";
import { AiError } from "@/lib/interview-ai";
import {
  APP_SELECT,
  FINAL_TOP,
  RANK_JOB_SELECT,
  SCORE_BATCH,
  type AiDigest,
  type AiProfile,
  type HrCounts,
  digestHash,
  evidenceBasis,
  hrCounts,
  jobHash,
  loadHrData,
  loadRankingRules,
  pickRepresentatives,
  profileHash,
  scoreCandidates,
  tierOf,
} from "@/lib/candidate-ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Row = Record<string, unknown>;
type Entry = {
  application_id: string;
  score: number;
  tier: string;
  reason: string | null;
  fingerprint: string;
  counts: HrCounts | null;
  scored_at: string;
  blocked: boolean;
  block_reason: string | null;
};

/** Job + mọi application + dữ liệu HR + điểm đã lưu. */
async function loadPool(jobId: string) {
  const supabase = getSupabaseAdmin();
  const [{ data: job }, { data: apps, error }, { data: entries }, { data: meta }, rules] = await Promise.all([
    supabase.from("jobs").select(RANK_JOB_SELECT).eq("id", jobId).single(),
    supabase.from("applications").select(`${APP_SELECT}, offer_status`),
    supabase.from("job_ranking_entries").select("*").eq("job_id", jobId),
    supabase.from("job_rankings").select("*").eq("job_id", jobId).maybeSingle(),
    loadRankingRules(supabase),
  ]);
  if (error) throw new Error(error.message);
  if (!job) return null;
  const reps = pickRepresentatives((apps ?? []) as unknown as Row[]);
  const hr = await loadHrData(supabase, reps.map((r) => String(r.rep.id)));
  const jh = jobHash(job, rules);
  const pool = reps.map(({ rep, appliedFor }) => {
    const d = hr.get(String(rep.id))!;
    return { a: rep, d, appliedFor, curP: profileHash(rep), curD: digestHash(rep, d) };
  });
  const entryMap = new Map(((entries ?? []) as Entry[]).map((e) => [e.application_id, e]));
  return { supabase, job: job as Row, rules, jh, pool, entryMap, meta: meta as Row | null };
}

/** "+2 comment", "+1 PV"… — dữ liệu mới kể từ lần chấm trước. */
function changesSince(e: Entry | undefined, curP: string, curD: string, now: HrCounts): string[] {
  if (!e) return ["Chưa chấm"];
  const [p, d] = e.fingerprint.split(".");
  const out: string[] = [];
  if (p !== curP) out.push("CV/portfolio đổi");
  if (d !== curD) {
    const was = e.counts;
    const before = out.length;
    if (was) {
      const plus = (n: number, label: string) => n > 0 && out.push(`+${n} ${label}`);
      plus(now.comments - was.comments, "comment");
      plus(now.interviews - was.interviews, "PV");
      plus(now.subs - was.subs, "bài nộp");
      if (now.test_review && !was.test_review) out.push("Leader chấm test");
      if (now.note !== was.note) out.push("Note đổi");
    }
    if (out.length === before) out.push("Dữ liệu HR đổi");
  }
  return out;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHrUser(request, "apps.view_ai");
  if ("response" in auth) return auth.response;
  const { ctx: user } = auth;
  const { id } = await params;

  const scope = await loadScope(user).catch(() => null);
  if (!scope) return NextResponse.json({ error: "Không đọc được phạm vi dữ liệu" }, { status: 500 });
  // Leader chỉ xem xếp hạng job mình phụ trách.
  if (user.role === "leader" && !scope.leaderJobIds.includes(id)) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const ctx = await loadPool(id);
  if (!ctx) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  const { rules, jh, pool: fullPool, entryMap, meta } = ctx;

  // Pool xếp hạng gồm hồ sơ mọi job → lọc theo phạm vi.
  const pool = fullPool.filter(({ a }) =>
    inScope(scope, { job_id: String(a.job_id), status: String(a.status), offer_status: (a.offer_status as string | null) ?? null }),
  );
  const canNotes = user.perms.has("apps.view_notes");

  const rows = pool.map(({ a, d, appliedFor, curP, curD }) => {
    const e = entryMap.get(String(a.id));
    const p = a.ai_profile as AiProfile | null;
    const dg = a.ai_digest as AiDigest | null;
    const fresh = e?.fingerprint === `${curP}.${curD}.${jh}`;
    return {
      application_id: a.id,
      full_name: a.full_name,
      status: a.status,
      applied_for: appliedFor,
      applied_this_job: a.job_id === id,
      score: e?.score ?? null,
      tier: e?.tier ?? null,
      reason: e?.reason ?? null,
      // Cờ loại cứng + lý do loại thuộc nhóm ghi chú nội bộ.
      ...(canNotes
        ? { blocked: e?.blocked ?? false, block_reason: e?.block_reason ?? null, rejection_reason: a.rejection_reason || null }
        : {}),
      scored_at: e?.scored_at ?? null,
      basis: evidenceBasis(a, d),
      profile: p
        ? { headline: p.headline, highlights: p.highlights, gaps: p.gaps, portfolio_note: p.portfolio_note, cv_read: p.cv_read, location: p.location ?? null, nationality: p.nationality ?? null }
        : null,
      digest: dg ? { summary: dg.summary, positives: dg.positives, negatives: dg.negatives, verdicts: dg.verdicts ?? [] } : null,
      // JD đổi thì mọi người đều cần chấm lại — báo chung ở đầu bảng, không lặp từng dòng.
      changes: fresh ? [] : changesSince(e, curP, curD, hrCounts(a, d)),
      needs_profile: !a.ai_profile || a.ai_profile_hash !== curP || a.ai_digest_hash !== curD,
      needs_score: !fresh,
    };
  });
  // Đủ điều kiện (theo điểm) → bị loại cứng → chưa chấm.
  const group = (r: (typeof rows)[number]) => (r.score == null ? 2 : "blocked" in r && r.blocked ? 1 : 0);
  rows.sort((x, y) => group(x) - group(y) || (y.score ?? -1) - (x.score ?? -1));

  return NextResponse.json({
    rules,
    ranked_at: meta?.ranked_at ?? null,
    job_changed: !!meta && meta.job_hash !== jh,
    rows,
  });
}

/**
 * Client điều phối từng bước (mỗi request ≤ 1 lượt AI, khỏi timeout proxy):
 * - {step:"score", ids}: chấm ≤ SCORE_BATCH người (đã có hồ sơ AI mới nhất).
 * - {step:"final"}: so sánh lại top đầu với nhau, chốt bảng.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireHR(request);
  if (authError) return authError;
  const { id } = await params;

  let body: { step?: string; ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ctx = await loadPool(id);
  if (!ctx) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  const { supabase, job, rules, jh, pool, entryMap } = ctx;

  try {
    if (body.step === "score") {
      const ids = new Set(Array.isArray(body.ids) ? body.ids.map(String).slice(0, SCORE_BATCH) : []);
      // Chỉ chấm người có hồ sơ AI khớp dữ liệu hiện tại — còn lại client phải làm hồ sơ trước.
      const items = pool.filter((x) => ids.has(String(x.a.id)));
      const ready = items.filter((x) => x.a.ai_profile && x.a.ai_profile_hash === x.curP && x.a.ai_digest_hash === x.curD);
      const skipped = items.filter((x) => !ready.includes(x)).map((x) => x.a.id);
      if (!ready.length) return NextResponse.json({ scored: 0, skipped });

      const { results } = await scoreCandidates(job, rules, ready.map((x) => ({ a: x.a, appliedFor: x.appliedFor })));
      const rows = ready.flatMap((x) => {
        const r = results.get(String(x.a.id));
        if (!r) return [];
        return [{
          job_id: id,
          application_id: x.a.id,
          score: r.score,
          tier: tierOf(r.score),
          reason: r.reason,
          blocked: r.blocked,
          block_reason: r.block_reason,
          fingerprint: `${x.curP}.${x.curD}.${jh}`,
          counts: hrCounts(x.a, x.d),
          scored_at: new Date().toISOString(),
        }];
      });
      if (rows.length) {
        const { error } = await supabase.from("job_ranking_entries").upsert(rows);
        if (error) throw new Error(error.message);
      }
      return NextResponse.json({ scored: rows.length, skipped, missing: ready.length - rows.length });
    }

    if (body.step === "final") {
      const repIds = new Set(pool.map((x) => String(x.a.id)));
      // Dọn điểm mồ côi (application đã xoá thì FK cascade lo; đây chỉ phòng hờ).
      const stale = [...entryMap.keys()].filter((k) => !repIds.has(k));
      if (stale.length) {
        await supabase.from("job_ranking_entries").delete().eq("job_id", id).in("application_id", stale);
      }

      const top = pool
        .filter((x) => entryMap.has(String(x.a.id)) && !entryMap.get(String(x.a.id))!.blocked && x.a.ai_profile)
        .sort((x, y) => entryMap.get(String(y.a.id))!.score - entryMap.get(String(x.a.id))!.score)
        .slice(0, FINAL_TOP);
      let model: string | null = null;
      if (top.length >= 2) {
        const out = await scoreCandidates(
          job,
          rules,
          top.map((x) => ({ a: x.a, appliedFor: x.appliedFor, extra: { prev_score: entryMap.get(String(x.a.id))!.score } })),
          true,
        );
        model = out.model;
        await Promise.all(
          top.flatMap((x) => {
            const r = out.results.get(String(x.a.id));
            if (!r) return [];
            return [supabase.from("job_ranking_entries")
              .update({ score: r.score, tier: tierOf(r.score), reason: r.reason, blocked: r.blocked, block_reason: r.block_reason })
              .eq("job_id", id).eq("application_id", x.a.id)];
          }),
        );
      }
      const { error } = await supabase
        .from("job_rankings")
        .upsert({ job_id: id, job_hash: jh, model, ranked_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, finalized: top.length });
    }

    return NextResponse.json({ error: "step must be score | final" }, { status: 400 });
  } catch (e) {
    const status = e instanceof AiError ? e.status : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ranking failed" }, { status });
  }
}
