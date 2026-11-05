"use client";

// Kho freelancer (spec docs/superpowers/specs/2026-11-05-hr-freelancer-pool-design.md):
// danh sách + bộ lọc (job, hạng, rate, trạng thái, đã hợp tác, có vấn đề, job chưa mở freelance) và
// khối điều khiển trong modal hồ sơ. Đổi trạng thái / hạng / rate KHÔNG gửi mail.

import { useMemo, useState } from "react";
import type { Application, Job } from "@/app/admin/_lib/types";
import {
  FREELANCE_LEVELS,
  FREELANCE_STAGES,
  LEVEL_LABEL,
  STAGE_LABEL,
  filterFreelancers,
  formatRateVnd,
  parseRateVnd,
  type FreelanceFilter,
  type FreelanceLevel,
  type FreelanceStage,
} from "@/lib/hr-freelance";
import { hrFetch, useHrSession } from "./HrSession";

const EMPTY: FreelanceFilter = {
  jobId: null, level: null, stage: null, rateMin: null, rateMax: null,
  collaborated: false, issue: false, jobNotOpen: false, q: "",
};

const STAGE_DOT: Record<FreelanceStage, string> = {
  new: "bg-blue-400",
  talking: "bg-amber-400",
  testing: "bg-violet-400",
  collaborated: "bg-green-400",
  not_fit: "bg-white/30",
};

const selectCls = "rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white focus:border-amber-500/50 focus:outline-none";
const inputCls = "rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white placeholder:text-white/25 focus:border-amber-500/50 focus:outline-none";

const stageOf = (a: Application): FreelanceStage =>
  (FREELANCE_STAGES as readonly string[]).includes(a.freelance_stage ?? "") ? (a.freelance_stage as FreelanceStage) : "new";
const levelText = (a: Application) =>
  a.freelance_level && a.freelance_level in LEVEL_LABEL ? LEVEL_LABEL[a.freelance_level as FreelanceLevel] : "—";

function Tags({ app }: { app: Application }) {
  return (
    <span className="flex flex-wrap gap-1">
      {app.freelance_issue && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">Có vấn đề</span>}
      {app.freelance_job_open === false && (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">Job chưa mở freelance</span>
      )}
      {app.duplicate_kind && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-400">Nộp trùng</span>}
    </span>
  );
}

export default function FreelancerView({
  apps,
  jobs,
  staffNames,
  onOpen,
}: {
  apps: Application[];
  jobs: Job[];
  staffNames: Map<string, string>;
  onOpen: (id: string) => void;
}) {
  const { can } = useHrSession();
  const canRate = can("apps.view_salary");
  const [f, setF] = useState<FreelanceFilter>(EMPTY);
  const [rateMinText, setRateMinText] = useState("");
  const [rateMaxText, setRateMaxText] = useState("");
  const set = <K extends keyof FreelanceFilter>(k: K, v: FreelanceFilter[K]) => setF((p) => ({ ...p, [k]: v }));

  const counts = useMemo(() => {
    const c = Object.fromEntries(FREELANCE_STAGES.map((s) => [s, 0])) as Record<FreelanceStage, number>;
    for (const a of apps) c[stageOf(a)] += 1;
    return c;
  }, [apps]);
  const filtered = useMemo(
    () => filterFreelancers(apps, f).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [apps, f],
  );
  const jobIds = useMemo(() => new Set(apps.map((a) => a.job_id)), [apps]);

  return (
    <div className="space-y-4">
      {/* Chip trạng thái — bấm để lọc */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => set("stage", null)}
          aria-pressed={f.stage === null}
          className={`rounded-full border px-3 py-1 text-xs ${f.stage === null ? "border-amber-500/50 bg-amber-500/10 text-white" : "border-white/15 text-white/60"}`}
        >
          Tất cả <span className="text-white/50">{apps.length}</span>
        </button>
        {FREELANCE_STAGES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => set("stage", f.stage === s ? null : s)}
            aria-pressed={f.stage === s}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${f.stage === s ? "border-amber-500/50 bg-amber-500/10 text-white" : "border-white/15 text-white/60"}`}
          >
            <span className={`h-2 w-2 rounded-full ${STAGE_DOT[s]}`} />
            {STAGE_LABEL[s]} <span className="text-white/50">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Tìm tên, email…" className={`${inputCls} w-48`} />
        <select value={f.jobId ?? ""} onChange={(e) => set("jobId", e.target.value || null)} className={selectCls} aria-label="Lọc theo job">
          <option value="">Mọi job</option>
          {jobs.filter((j) => jobIds.has(j.id) || j.accepts_freelance).map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select value={f.level ?? ""} onChange={(e) => set("level", (e.target.value || null) as FreelanceFilter["level"])} className={selectCls} aria-label="Lọc theo hạng">
          <option value="">Mọi hạng</option>
          {FREELANCE_LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
          <option value="none">Chưa gắn hạng</option>
        </select>
        {canRate && (
          <span className="flex items-center gap-1 text-xs text-white/50">
            Rate
            <input
              value={rateMinText}
              inputMode="numeric"
              onChange={(e) => { setRateMinText(e.target.value); set("rateMin", parseRateVnd(e.target.value)); }}
              placeholder="từ"
              className={`${inputCls} w-24`}
              aria-label="Rate từ (VNĐ/giờ)"
            />
            –
            <input
              value={rateMaxText}
              inputMode="numeric"
              onChange={(e) => { setRateMaxText(e.target.value); set("rateMax", parseRateVnd(e.target.value)); }}
              placeholder="đến"
              className={`${inputCls} w-24`}
              aria-label="Rate đến (VNĐ/giờ)"
            />
          </span>
        )}
        {([
          ["collaborated", "Đã hợp tác"],
          ["issue", "Có vấn đề"],
          ["jobNotOpen", "Job chưa mở freelance"],
        ] as const).map(([k, label]) => (
          <label key={k} className="flex cursor-pointer items-center gap-1.5 text-xs text-white/70">
            <input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} className="h-3.5 w-3.5 accent-amber-500" />
            {label}
          </label>
        ))}
        <span className="ml-auto text-[11px] text-white/40">{filtered.length} / {apps.length} freelancer</span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-white/30">Chưa có hồ sơ freelancer phù hợp bộ lọc.</p>
      ) : (
        <>
          {/* Mobile: thẻ */}
          <div className="space-y-2 md:hidden">
            {filtered.map((a) => (
              <button key={a.id} type="button" onClick={() => onOpen(a.id)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{a.full_name}</p>
                    <p className="truncate text-xs text-white/50">{a.jobs?.title ?? "—"} · {levelText(a)}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-white/70">
                    <span className={`h-2 w-2 rounded-full ${STAGE_DOT[stageOf(a)]}`} />{STAGE_LABEL[stageOf(a)]}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-white/60">
                  {canRate && <span>{formatRateVnd(a.rate_vnd_per_hour)}</span>}
                  {a.available_hours_per_week && <span>{a.available_hours_per_week}</span>}
                  <Tags app={a} />
                </div>
              </button>
            ))}
          </div>

          {/* Desktop: bảng */}
          <div className="hidden overflow-x-auto rounded-xl border border-white/10 md:block">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-3 py-2">Tên</th>
                  <th className="px-3 py-2">Job</th>
                  <th className="px-3 py-2">Hạng</th>
                  {canRate && <th className="px-3 py-2">Rate</th>}
                  <th className="px-3 py-2">Giờ/tuần</th>
                  <th className="px-3 py-2">Portfolio</th>
                  <th className="px-3 py-2">Trạng thái</th>
                  <th className="px-3 py-2">Nộp</th>
                  <th className="px-3 py-2">Support</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} onClick={() => onOpen(a.id)} className="cursor-pointer border-t border-white/5 hover:bg-white/[0.04]">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-white">{a.full_name}</p>
                      <Tags app={a} />
                    </td>
                    <td className="px-3 py-2.5 text-white/70">{a.jobs?.title ?? "—"}</td>
                    <td className="px-3 py-2.5 text-white/70">{levelText(a)}</td>
                    {canRate && <td className="whitespace-nowrap px-3 py-2.5 text-white/80">{formatRateVnd(a.rate_vnd_per_hour)}</td>}
                    <td className="px-3 py-2.5 text-white/60">{a.available_hours_per_week ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {a.portfolio_url && /^https?:\/\//i.test(a.portfolio_url) ? (
                        <a href={a.portfolio_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-amber-400 hover:underline">
                          Mở ↗
                        </a>
                      ) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-white/80">
                      <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${STAGE_DOT[stageOf(a)]}`} />{STAGE_LABEL[stageOf(a)]}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-white/50">{new Date(a.created_at).toLocaleDateString("vi-VN")}</td>
                    <td className="px-3 py-2.5 text-white/60">{a.assignee_user_id ? staffNames.get(a.assignee_user_id) ?? "—" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/** Khối điều khiển trong modal hồ sơ freelancer (thay Status / Reviewing / Reject). Lưu ngay khi đổi, không gửi mail. */
export function FreelanceControls({ app, onPatch }: { app: Application; onPatch: (p: Partial<Application>) => void }) {
  const { can } = useHrSession();
  const canEdit = can("apps.edit");
  const canRate = can("apps.view_salary");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateText, setRateText] = useState(app.rate_vnd_per_hour ? String(app.rate_vnd_per_hour) : "");

  async function save(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await hrFetch(`/api/hr/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      onPatch(data.application ?? body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được");
    } finally {
      setBusy(false);
    }
  }

  if (!canEdit) {
    return (
      <span className="hr-status-trigger cursor-default">
        <span className="text-white/50">Freelancer</span>
        <span>{STAGE_LABEL[stageOf(app)]} · {levelText(app)}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-[13px] text-white/60">
        Trạng thái
        <select value={stageOf(app)} disabled={busy} onChange={(e) => void save({ freelance_stage: e.target.value })} className={selectCls}>
          {FREELANCE_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-[13px] text-white/60">
        Hạng
        <select value={app.freelance_level ?? ""} disabled={busy} onChange={(e) => void save({ freelance_level: e.target.value || null })} className={selectCls}>
          <option value="">Chưa gắn</option>
          {FREELANCE_LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
        </select>
      </label>
      {canRate && (
        <label className="flex items-center gap-1.5 text-[13px] text-white/60">
          Rate
          <input
            value={rateText}
            inputMode="numeric"
            disabled={busy}
            onChange={(e) => setRateText(e.target.value)}
            onBlur={() => {
              const next = rateText.trim() === "" ? null : parseRateVnd(rateText);
              if (rateText.trim() !== "" && next == null) return setError("Rate phải là số VNĐ/giờ từ 10.000");
              if (next !== (app.rate_vnd_per_hour ?? null)) void save({ rate_vnd_per_hour: next });
            }}
            placeholder="VNĐ/giờ"
            className={`${inputCls} w-28`}
          />
        </label>
      )}
      <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-white/70">
        <input type="checkbox" checked={!!app.freelance_issue} disabled={busy} onChange={(e) => void save({ freelance_issue: e.target.checked })} className="h-4 w-4 accent-red-500" />
        Có vấn đề
      </label>
      {error && <span className="text-[12px] text-red-400">{error}</span>}
    </div>
  );
}
