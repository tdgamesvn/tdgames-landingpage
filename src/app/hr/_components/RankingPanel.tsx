"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Bảng xếp hạng ứng viên phù hợp nhất với 1 job (toàn bộ ứng viên trong DB,
 * kể cả nộp job khác / đã reject). Client điều phối: làm hồ sơ AI cho người
 * có dữ liệu mới → chấm theo lượt → chốt top. Mỗi request ≤ 1 lượt AI.
 */

type Row = {
  application_id: string;
  full_name: string;
  status: string;
  applied_for: string[];
  applied_this_job: boolean;
  score: number | null;
  tier: string | null;
  reason: string | null;
  scored_at: string | null;
  basis: "cv" | "test" | "interview";
  profile: { headline: string; highlights: string[]; gaps: string[]; portfolio_note: string; cv_read: boolean } | null;
  digest: { summary: string; positives: string[]; negatives: string[] } | null;
  changes: string[];
  needs_profile: boolean;
  needs_score: boolean;
};

type Ranking = { ranked_at: string | null; job_changed: boolean; rows: Row[] };

const PROFILE_CHUNK = 3; // khớp MAX_IDS của /api/hr/ranking/profiles
const SCORE_CHUNK = 15; // khớp SCORE_BATCH
const PARALLEL = 2;

const BASIS: Record<Row["basis"], { label: string; title: string }> = {
  cv: { label: "📄 CV", title: "Chỉ dựa trên CV / portfolio / form" },
  test: { label: "📝 Test", title: "Có bài test Leader đã chấm" },
  interview: { label: "🎤 PV", title: "Đã phỏng vấn (có phân tích sau PV)" },
};

function rankColor(s: number) {
  if (s >= 85) return "border-green-500/50 bg-green-500/15 text-green-300";
  if (s >= 70) return "border-lime-500/40 bg-lime-500/10 text-lime-300";
  if (s >= 50) return "border-yellow-500/40 bg-yellow-500/10 text-yellow-300";
  return "border-red-500/30 bg-red-500/10 text-red-300/80";
}

const chunk = <T,>(xs: T[], n: number) =>
  Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

/** Chạy fn trên từng phần tử, tối đa `n` request song song. */
async function runPool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

export default function RankingPanel({
  jobId,
  hrKey,
  statusLabel,
  statusColor,
  isLost,
  onOpen,
}: {
  jobId: string;
  hrKey: string;
  statusLabel: (key: string) => string;
  statusColor: (key: string) => string;
  isLost: (key: string) => boolean;
  onOpen: (applicationId: string) => void;
}) {
  const [data, setData] = useState<Ranking | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ phase: string; done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [hideLost, setHideLost] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/hr/jobs/${jobId}/ranking`, { headers: { "x-hr-key": hrKey } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setLoadError(null);
      setData(json as Ranking);
      return json as Ranking;
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Load failed");
      return null;
    }
  }, [jobId, hrKey]);

  // Tải lần đầu sau khi mount (qua microtask — không setState đồng bộ trong effect).
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-hr-key": hrKey },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
    return json;
  }

  async function run(all: boolean) {
    if (!data || progress) return;
    const errs: string[] = [];
    const name = new Map(data.rows.map((r) => [r.application_id, r.full_name]));
    try {
      // 1. Hồ sơ AI cho người có dữ liệu mới (CV đọc lại chỉ khi CV/link đổi).
      const needProfile = data.rows.filter((r) => r.needs_profile).map((r) => r.application_id);
      let done = 0;
      setProgress({ phase: "Đọc hồ sơ", done, total: needProfile.length });
      await runPool(chunk(needProfile, PROFILE_CHUNK), PARALLEL, async (ids) => {
        try {
          const json = await post("/api/hr/ranking/profiles", { ids });
          for (const r of json.results ?? []) if (!r.ok) errs.push(`${name.get(r.id) ?? r.id}: ${r.error}`);
        } catch (e) {
          errs.push(`Đọc hồ sơ: ${e instanceof Error ? e.message : "lỗi"}`);
        }
        done += ids.length;
        setProgress({ phase: "Đọc hồ sơ", done, total: needProfile.length });
      });

      // 2. Chấm theo job.
      const fresh = await load();
      if (!fresh) throw new Error("Không tải lại được bảng");
      const toScore = fresh.rows
        .filter((r) => (all || r.needs_score) && !r.needs_profile)
        .map((r) => r.application_id);
      done = 0;
      setProgress({ phase: "Chấm điểm", done, total: toScore.length });
      await runPool(chunk(toScore, SCORE_CHUNK), PARALLEL, async (ids) => {
        try {
          await post(`/api/hr/jobs/${jobId}/ranking`, { step: "score", ids });
        } catch (e) {
          errs.push(`Chấm điểm: ${e instanceof Error ? e.message : "lỗi"}`);
        }
        done += ids.length;
        setProgress({ phase: "Chấm điểm", done, total: toScore.length });
      });

      // 3. So sánh lại top đầu với nhau.
      setProgress({ phase: "Chốt top", done: 0, total: 1 });
      try {
        await post(`/api/hr/jobs/${jobId}/ranking`, { step: "final" });
      } catch (e) {
        errs.push(`Chốt top: ${e instanceof Error ? e.message : "lỗi"}`);
      }
    } catch (e) {
      errs.push(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setErrors(errs);
      setProgress(null);
      await load();
    }
  }

  if (loadError) return <p className="text-xs text-red-400">❌ {loadError}</p>;
  if (!data) return <p className="text-xs text-white/40">Đang tải bảng xếp hạng…</p>;

  const pending = data.rows.filter((r) => r.needs_score || r.needs_profile).length;
  const changed = data.rows.filter((r) => r.changes.length && r.score != null).length;
  const unscored = data.rows.filter((r) => r.score == null).length;
  const rows = hideLost ? data.rows.filter((r) => !isLost(r.status)) : data.rows;
  const rankOf = new Map(rows.filter((r) => r.score != null).map((r, i) => [r.application_id, i + 1]));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-white">🏆 Xếp hạng phù hợp</p>
          <p className="text-[10px] text-white/40">
            {data.rows.length} ứng viên trong DB (cả job khác, cả đã reject) ·{" "}
            {data.ranked_at ? `cập nhật ${new Date(data.ranked_at).toLocaleString("vi-VN")}` : "chưa tính lần nào"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-[10px] text-white/50">
            <input type="checkbox" checked={hideLost} onChange={(e) => setHideLost(e.target.checked)} />
            Ẩn Rejected
          </label>
          <button
            onClick={() => void run(false)}
            disabled={!!progress || pending === 0}
            className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 disabled:opacity-40"
            title="Chỉ tính phần có dữ liệu mới"
          >
            ↻ Tính lại{pending ? ` (${pending})` : ""}
          </button>
          <button
            onClick={() => { if (confirm("Chấm lại toàn bộ ứng viên với job này? (hồ sơ AI vẫn dùng lại nếu không đổi)")) void run(true); }}
            disabled={!!progress}
            className="rounded-lg border border-white/15 px-3 py-1 text-[11px] text-white/50 hover:bg-white/5 disabled:opacity-40"
          >
            Tính lại toàn bộ
          </button>
        </div>
      </div>

      {/* Trạng thái */}
      {progress ? (
        <div className="space-y-1">
          <p className="text-[11px] text-amber-300">
            {progress.phase}… {progress.total > 1 ? `${progress.done}/${progress.total}` : ""}
          </p>
          <div className="h-1 overflow-hidden rounded bg-white/10">
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
          </div>
        </div>
      ) : data.job_changed ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300">
          ✏️ JD đã sửa sau lần tính trước — bấm Tính lại để chấm lại cả bảng.
        </p>
      ) : (changed > 0 || unscored > 0) && (
        <p className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-[11px] text-cyan-300">
          🔄 {changed > 0 && `${changed} hồ sơ có dữ liệu mới`}{changed > 0 && unscored > 0 && " · "}
          {unscored > 0 && `${unscored} người chưa chấm`} — bấm Tính lại.
        </p>
      )}
      {errors.length > 0 && (
        <details className="text-[11px] text-red-400">
          <summary>⚠️ {errors.length} lỗi ở lần tính vừa rồi (người lỗi sẽ được tính ở lần sau)</summary>
          <ul className="mt-1 list-disc pl-5">{errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}</ul>
        </details>
      )}

      {/* Bảng */}
      <div className="divide-y divide-white/5 rounded-lg border border-white/10">
        {rows.map((r) => {
          const open = expanded === r.application_id;
          const lost = isLost(r.status);
          return (
            <div key={r.application_id} className={`px-3 py-2 ${lost ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-6 text-right text-[11px] font-bold text-white/40">{rankOf.get(r.application_id) ?? "–"}</span>
                <span className={`w-9 rounded-full border text-center text-xs font-bold ${r.score != null ? rankColor(r.score) : "border-white/10 text-white/30"}`}>
                  {r.score ?? "?"}
                </span>
                <button onClick={() => onOpen(r.application_id)} className="text-sm font-semibold text-white hover:text-amber-300 hover:underline">
                  {r.full_name}
                </button>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
                <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/50" title={BASIS[r.basis].title}>
                  {BASIS[r.basis].label}
                </span>
                {r.applied_for.map((t) => (
                  <span key={t} className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40">nộp: {t}</span>
                ))}
                {r.changes.length > 0 && r.score != null && (
                  <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-300" title="Có dữ liệu mới kể từ lần chấm trước">
                    🔄 {r.changes.join(", ")}
                  </span>
                )}
                <button onClick={() => setExpanded(open ? null : r.application_id)} className="ml-auto text-[10px] text-white/40 hover:text-white">
                  {open ? "▴ Thu gọn" : "▾ Chi tiết"}
                </button>
              </div>
              {r.reason && <p className="mt-1 pl-[4.25rem] text-[11px] text-white/60">{r.reason}</p>}
              {open && (
                <div className="mt-2 space-y-1 pl-[4.25rem] text-[11px] text-white/60">
                  {r.profile ? (
                    <>
                      <p className="text-white/80">{r.profile.headline}</p>
                      {!r.profile.cv_read && <p className="text-amber-400/80">⚠️ Không đọc được CV — tóm tắt chỉ từ form/portfolio</p>}
                      {r.profile.highlights.map((h, i) => <p key={`h${i}`} className="text-green-300/80">+ {h}</p>)}
                      {r.profile.gaps.map((g, i) => <p key={`g${i}`} className="text-red-300/80">− {g}</p>)}
                      {r.profile.portfolio_note && <p>🖼 {r.profile.portfolio_note}</p>}
                    </>
                  ) : (
                    <p className="text-white/30">Chưa có hồ sơ AI — bấm Tính lại.</p>
                  )}
                  {r.digest && (
                    <div className="mt-1 border-t border-white/5 pt-1">
                      <p>🗂 HR: {r.digest.summary}</p>
                      {r.digest.positives.map((h, i) => <p key={`p${i}`} className="text-green-300/80">+ {h}</p>)}
                      {r.digest.negatives.map((g, i) => <p key={`n${i}`} className="text-red-300/80">− {g}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && <p className="px-3 py-6 text-center text-xs text-white/30">Chưa có ứng viên.</p>}
      </div>
    </div>
  );
}
