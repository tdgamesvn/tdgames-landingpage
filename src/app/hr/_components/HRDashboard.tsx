"use client";

import { useEffect, useMemo, useState } from "react";
import type { Application, ApplicationStatus, Job, JobType } from "@/app/admin/_lib/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES: ApplicationStatus[] = [
  "new",
  "reviewing",
  "interview",
  "offer",
  "rejected",
];

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  new: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  reviewing: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
  interview: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  offer: "border-green-500/40 bg-green-500/10 text-green-300",
  rejected: "border-red-500/40 bg-red-500/10 text-red-300",
};

const STATUS_NEXT: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  new: "reviewing",
  reviewing: "interview",
  interview: "offer",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AppCard({
  app,
  hrKey,
  onUpdate,
}: {
  app: Application;
  hrKey: string;
  onUpdate: (id: string, patch: Partial<Application>) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState(app.admin_notes ?? "");

  async function move(status: ApplicationStatus) {
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/applications/${app.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-hr-key": hrKey },
        body: JSON.stringify({ status }),
      });
      if (res.ok) onUpdate(app.id, { status });
    } finally {
      setSaving(false);
    }
  }

  async function saveNote() {
    setSaving(true);
    try {
      await fetch(`/api/hr/applications/${app.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-hr-key": hrKey },
        body: JSON.stringify({ admin_notes: note }),
      });
      onUpdate(app.id, { admin_notes: note });
      setShowNote(false);
    } finally {
      setSaving(false);
    }
  }

  const nextStatus = STATUS_NEXT[app.status];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 space-y-2 hover:border-white/20 transition-colors">
      {/* Name + date */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-white leading-tight">
          {app.full_name}
        </span>
        <span className="text-[10px] text-white/40 shrink-0">{timeAgo(app.created_at)}</span>
      </div>

      {/* Job title */}
      {app.jobs && (
        <p className="text-xs text-white/55 truncate">{app.jobs.title}</p>
      )}

      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5">
        {app.referred_by && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            via {app.referred_by}
          </span>
        )}
        {app.cv_url && (
          <a
            href={app.cv_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60 hover:text-white transition-colors"
          >
            CV ↗
          </a>
        )}
        {app.portfolio_url && (
          <a
            href={app.portfolio_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60 hover:text-white transition-colors"
          >
            Portfolio ↗
          </a>
        )}
      </div>

      {/* Note preview */}
      {app.admin_notes && !showNote && (
        <p className="text-[11px] text-white/40 italic truncate">
          💬 {app.admin_notes}
        </p>
      )}

      {/* Inline note editor */}
      {showNote && (
        <div className="space-y-1">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
            placeholder="Add a note…"
          />
          <div className="flex gap-1">
            <button
              onClick={saveNote}
              disabled={saving}
              className="rounded bg-amber-600 px-2 py-0.5 text-[10px] font-bold hover:bg-amber-500 disabled:opacity-40"
            >
              Save
            </button>
            <button
              onClick={() => { setShowNote(false); setNote(app.admin_notes ?? ""); }}
              className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-white/60 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1 pt-0.5">
        {nextStatus && (
          <button
            onClick={() => move(nextStatus)}
            disabled={saving}
            className="rounded border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white/80 hover:bg-white/10 disabled:opacity-40 transition-colors"
          >
            → {STATUS_LABEL[nextStatus]}
          </button>
        )}
        {app.status !== "rejected" && (
          <button
            onClick={() => move("rejected")}
            disabled={saving}
            className="rounded border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
          >
            ✕ Reject
          </button>
        )}
        {app.status === "rejected" && (
          <button
            onClick={() => move("new")}
            disabled={saving}
            className="rounded border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white/60 hover:bg-white/10 disabled:opacity-40"
          >
            ↺ Reopen
          </button>
        )}
        <button
          onClick={() => setShowNote((v) => !v)}
          className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-white/50 hover:bg-white/5"
        >
          {showNote ? "✕" : "💬"}
        </button>
      </div>
    </div>
  );
}

// ── Pipeline view ─────────────────────────────────────────────────────────────

function PipelineView({
  apps,
  hrKey,
  onUpdate,
}: {
  apps: Application[];
  hrKey: string;
  onUpdate: (id: string, patch: Partial<Application>) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {STATUSES.map((status) => {
        const col = apps.filter((a) => a.status === status);
        return (
          <div key={status} className="flex flex-col gap-2">
            {/* Column header */}
            <div className="flex items-center justify-between px-1">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[status]}`}
              >
                {STATUS_LABEL[status]}
              </span>
              <span className="text-xs font-bold text-white/50">{col.length}</span>
            </div>
            {/* Cards */}
            <div className="space-y-2 min-h-[60px]">
              {col.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/10 py-4 text-center text-[10px] text-white/20">
                  Empty
                </div>
              )}
              {col.map((app) => (
                <AppCard key={app.id} app={app} hrKey={hrKey} onUpdate={onUpdate} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── KPI view ──────────────────────────────────────────────────────────────────

function KPIView({ apps }: { apps: Application[] }) {
  const rows = useMemo(() => {
    const map = new Map<string, Record<string, number>>();

    for (const app of apps) {
      const key = app.referred_by ?? "(direct)";
      if (!map.has(key)) {
        map.set(key, { total: 0, new: 0, reviewing: 0, interview: 0, offer: 0, rejected: 0 });
      }
      const row = map.get(key)!;
      row.total += 1;
      row[app.status] = (row[app.status] ?? 0) + 1;
    }

    return [...map.entries()]
      .map(([name, counts]) => ({ name, total: 0, new: 0, reviewing: 0, interview: 0, offer: 0, rejected: 0, ...counts }))
      .sort((a, b) => b.total - a.total);
  }, [apps]);

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-white/40">No applications yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/40">
            <th className="px-4 py-3 text-left">Referrer</th>
            <th className="px-3 py-3 text-center">Total</th>
            <th className="px-3 py-3 text-center">New</th>
            <th className="px-3 py-3 text-center">Reviewing</th>
            <th className="px-3 py-3 text-center">Interview</th>
            <th className="px-3 py-3 text-center">Offer</th>
            <th className="px-3 py-3 text-center">Rejected</th>
            <th className="px-3 py-3 text-center">Offer %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const offerRate =
              row.total > 0 ? Math.round((row.offer / row.total) * 100) : 0;
            return (
              <tr
                key={row.name}
                className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                  i % 2 === 0 ? "" : "bg-white/[0.015]"
                }`}
              >
                <td className="px-4 py-3 font-medium text-white">
                  {row.name === "(direct)" ? (
                    <span className="text-white/40 italic">{row.name}</span>
                  ) : (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-300">
                      {row.name}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-center font-bold text-white">{row.total}</td>
                <td className="px-3 py-3 text-center text-blue-300">{row.new || "—"}</td>
                <td className="px-3 py-3 text-center text-yellow-300">{row.reviewing || "—"}</td>
                <td className="px-3 py-3 text-center text-purple-300">{row.interview || "—"}</td>
                <td className="px-3 py-3 text-center text-green-300">{row.offer || "—"}</td>
                <td className="px-3 py-3 text-center text-red-300">{row.rejected || "—"}</td>
                <td className="px-3 py-3 text-center">
                  {offerRate > 0 ? (
                    <span className="font-bold text-green-400">{offerRate}%</span>
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── JobsView ──────────────────────────────────────────────────────────────────

const JOB_TYPES: JobType[] = ["fulltime", "parttime", "remote", "freelancer"];

type JobDraft = {
  title: string; type: JobType; location: string; level: string;
  salary: string; summary: string; description: string;
  categories: string; requirements: string; responsibilities: string;
  nice_to_have: string; skills: string; image_url: string; is_active: boolean;
};

const EMPTY_DRAFT: JobDraft = {
  title: "", type: "fulltime", location: "", level: "", salary: "",
  summary: "", description: "", categories: "", requirements: "",
  responsibilities: "", nice_to_have: "", skills: "", image_url: "", is_active: true,
};

function jobToDraft(j: Job): JobDraft {
  return {
    title: j.title, type: j.type, location: j.location, level: j.level,
    salary: j.salary, summary: j.summary, description: j.description,
    categories: j.categories.join(", "),
    requirements: j.requirements.join("\n"),
    responsibilities: j.responsibilities.join("\n"),
    nice_to_have: j.nice_to_have.join("\n"),
    skills: j.skills.join(", "),
    image_url: j.image_url, is_active: j.is_active,
  };
}

function draftToPayload(d: JobDraft) {
  return {
    title: d.title, type: d.type, location: d.location, level: d.level,
    salary: d.salary, summary: d.summary, description: d.description,
    categories: d.categories.split(",").map((s) => s.trim()).filter(Boolean),
    requirements: d.requirements.split("\n").map((s) => s.trim()).filter(Boolean),
    responsibilities: d.responsibilities.split("\n").map((s) => s.trim()).filter(Boolean),
    nice_to_have: d.nice_to_have.split("\n").map((s) => s.trim()).filter(Boolean),
    skills: d.skills.split(",").map((s) => s.trim()).filter(Boolean),
    image_url: d.image_url, is_active: d.is_active,
  };
}

const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1";
const inputCls = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-amber-500/50 focus:outline-none";

function JobForm({
  initial, hrKey, onSave, onCancel,
}: {
  initial: JobDraft; hrKey: string;
  onSave: (job: Job) => void; onCancel: () => void;
}) {
  const [d, setD] = useState<JobDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isNew = !("id" in initial);

  function set(k: keyof JobDraft, v: string | boolean) {
    setD((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    if (!d.title) { setErr("Title is required"); return; }
    setSaving(true); setErr("");
    try {
      const payload = draftToPayload(d);
      const id: string | undefined = (initial as JobDraft & { id?: string }).id;
      const url = id ? `/api/hr/jobs/${id}` : "/api/hr/jobs";
      const method = id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "content-type": "application/json", "x-hr-key": hrKey },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onSave(json.job as Job);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4 rounded-xl border border-amber-500/20 bg-white/[0.02] p-5">
      <h3 className="text-sm font-bold text-white">{isNew ? "New Job" : "Edit Job"}</h3>

      {/* Row 1: title + type */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Title *</label>
          <input className={inputCls} value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="2D Character Artist" />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select className={inputCls} value={d.type} onChange={(e) => set("type", e.target.value as JobType)}>
            {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2: location + level + salary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Location</label>
          <input className={inputCls} value={d.location} onChange={(e) => set("location", e.target.value)} placeholder="Remote / Hanoi" />
        </div>
        <div>
          <label className={labelCls}>Level</label>
          <input className={inputCls} value={d.level} onChange={(e) => set("level", e.target.value)} placeholder="Junior / Senior" />
        </div>
        <div>
          <label className={labelCls}>Salary</label>
          <input className={inputCls} value={d.salary} onChange={(e) => set("salary", e.target.value)} placeholder="$500–$800/month" />
        </div>
      </div>

      {/* Categories + Summary */}
      <div>
        <label className={labelCls}>Categories (comma-separated)</label>
        <input className={inputCls} value={d.categories} onChange={(e) => set("categories", e.target.value)} placeholder="Art, Animation" />
      </div>
      <div>
        <label className={labelCls}>Summary (shown in detail panel)</label>
        <textarea rows={2} className={inputCls} value={d.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Short overview…" />
      </div>

      {/* Advanced toggle */}
      <button type="button" onClick={() => setShowAdvanced((v) => !v)}
        className="text-[11px] text-white/40 hover:text-white/70 transition-colors">
        {showAdvanced ? "▲ Hide advanced fields" : "▼ Show advanced fields (requirements, skills, image…)"}
      </button>

      {showAdvanced && (
        <div className="space-y-4 border-t border-white/10 pt-4">
          <div>
            <label className={labelCls}>Description (card preview)</label>
            <textarea rows={2} className={inputCls} value={d.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Requirements (one per line)</label>
              <textarea rows={4} className={inputCls} value={d.requirements} onChange={(e) => set("requirements", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Responsibilities (one per line)</label>
              <textarea rows={4} className={inputCls} value={d.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Nice to have (one per line)</label>
              <textarea rows={3} className={inputCls} value={d.nice_to_have} onChange={(e) => set("nice_to_have", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Skills (comma-separated)</label>
              <textarea rows={3} className={inputCls} value={d.skills} onChange={(e) => set("skills", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Image URL</label>
            <input className={inputCls} value={d.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://cdn.tdgamestudio.com/…" />
          </div>
        </div>
      )}

      {/* Active + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={d.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="h-4 w-4 accent-amber-500" />
          Publish (visible on /careers)
        </label>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="rounded-lg border border-white/15 px-4 py-2 text-xs text-white/60 hover:bg-white/5">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="rounded-lg bg-amber-600 px-5 py-2 text-xs font-bold hover:bg-amber-500 disabled:opacity-40">
            {saving ? "Saving…" : isNew ? "Create Job" : "Save Changes"}
          </button>
        </div>
      </div>
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}

function JobsView({ jobs, hrKey, onUpdate, onCreate, onDelete }: {
  jobs: Job[]; hrKey: string;
  onUpdate: (j: Job) => void; onCreate: (j: Job) => void; onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  async function toggleActive(job: Job) {
    setToggling(job.id);
    try {
      const res = await fetch(`/api/hr/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-hr-key": hrKey },
        body: JSON.stringify({ is_active: !job.is_active }),
      });
      const json = await res.json();
      if (res.ok) onUpdate(json.job as Job);
    } finally { setToggling(null); }
  }

  async function deleteJob(id: string) {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    const res = await fetch(`/api/hr/jobs/${id}`, {
      method: "DELETE", headers: { "x-hr-key": hrKey },
    });
    if (res.ok) onDelete(id);
  }

  const activeCount = jobs.filter((j) => j.is_active).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Jobs</h2>
          <span className="text-xs text-white/50">{jobs.length} total · {activeCount} active</span>
        </div>
        {!showCreate && (
          <button onClick={() => { setShowCreate(true); setEditingId(null); }}
            className="rounded-lg border border-amber-500/50 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition-colors">
            + New Job
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <JobForm initial={EMPTY_DRAFT} hrKey={hrKey}
          onSave={(j) => { onCreate(j); setShowCreate(false); }}
          onCancel={() => setShowCreate(false)} />
      )}

      {/* Job list */}
      {jobs.length === 0 && !showCreate && (
        <p className="py-10 text-center text-sm text-white/30">No jobs yet — create one above.</p>
      )}

      <div className="space-y-2">
        {jobs.map((job) => (
          <div key={job.id} className="rounded-xl border border-white/10 bg-white/[0.03]">
            {/* Row */}
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              {/* Status dot */}
              <span className={`h-2 w-2 shrink-0 rounded-full ${job.is_active ? "bg-green-400" : "bg-white/20"}`} />

              {/* Title + meta */}
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-white">{job.title}</span>
                <span className="ml-2 text-xs text-white/40">
                  {job.type} · {job.location || "—"} · {job.level || "—"}
                </span>
                {job.salary && <span className="ml-2 text-xs text-amber-400/70">{job.salary}</span>}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                {/* Toggle active */}
                <button
                  onClick={() => void toggleActive(job)}
                  disabled={toggling === job.id}
                  className={`rounded-full border px-3 py-1 text-[10px] font-bold transition-colors disabled:opacity-40 ${
                    job.is_active
                      ? "border-green-500/40 bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40"
                      : "border-white/15 text-white/40 hover:border-green-500/40 hover:text-green-400"
                  }`}
                >
                  {job.is_active ? "Published" : "Draft"}
                </button>

                {/* Apply link */}
                <a href={`/apply/${job.slug}`} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/50 hover:text-white transition-colors"
                  title="Open apply page">
                  ↗
                </a>

                {/* Edit */}
                <button
                  onClick={() => setEditingId(editingId === job.id ? null : job.id)}
                  className="rounded-lg border border-white/15 px-3 py-1 text-[10px] text-white/60 hover:bg-white/5 transition-colors">
                  {editingId === job.id ? "Close" : "Edit"}
                </button>

                {/* Delete */}
                <button onClick={() => void deleteJob(job.id)}
                  className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-white/30 hover:border-red-500/40 hover:text-red-400 transition-colors">
                  ✕
                </button>
              </div>
            </div>

            {/* Inline edit form */}
            {editingId === job.id && (
              <div className="border-t border-white/10 px-4 py-4">
                <JobForm
                  initial={{ ...jobToDraft(job), ...{ id: job.id } } as JobDraft & { id: string }}
                  hrKey={hrKey}
                  onSave={(j) => { onUpdate(j); setEditingId(null); }}
                  onCancel={() => setEditingId(null)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

type View = "pipeline" | "kpi" | "jobs";

export default function HRDashboard() {
  const [hrKey, setHrKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [authError, setAuthError] = useState("");
  const [view, setView] = useState<View>("pipeline");
  const [apps, setApps] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [remindMsg, setRemindMsg] = useState("");

  async function loadData(key: string) {
    const [appsRes, jobsRes] = await Promise.all([
      fetch("/api/hr/applications", { headers: { "x-hr-key": key } }),
      fetch("/api/hr/jobs",         { headers: { "x-hr-key": key } }),
    ]);
    if (!appsRes.ok) throw new Error("Invalid key");
    const [appsData, jobsData] = await Promise.all([appsRes.json(), jobsRes.json()]);
    setApps(appsData.applications ?? []);
    setJobs(jobsData.jobs ?? []);
  }

  async function signIn() {
    setAuthError("");
    setLoading(true);
    try {
      await loadData(inputKey);
      setHrKey(inputKey);
    } catch {
      setAuthError("Invalid key. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    if (!hrKey) return;
    setLoading(true);
    try { await loadData(hrKey); }
    finally { setLoading(false); }
  }

  async function sendReminder() {
    setReminding(true);
    setRemindMsg("");
    try {
      const res = await fetch("/api/hr/remind", {
        headers: { "x-hr-key": hrKey },
      });
      const data = await res.json();
      if (data.sent) {
        setRemindMsg(`✅ Sent — ${data.staleCount} stale application(s) reported to Discord`);
      } else {
        setRemindMsg(`ℹ️ ${data.reason ?? "Nothing to report"}`);
      }
    } catch {
      setRemindMsg("❌ Reminder failed");
    } finally {
      setReminding(false);
    }
  }

  function updateApp(id: string, patch: Partial<Application>) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!hrKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a10] px-4">
        <div className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              TD Games Studio
            </p>
            <h1 className="mt-1 text-2xl font-black text-white">HR Dashboard</h1>
            <p className="mt-1 text-xs text-white/40">Enter your HR key to continue</p>
          </div>
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && inputKey) void signIn(); }}
            placeholder="HR key"
            autoFocus
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
          />
          {authError && <p className="text-xs text-red-400">{authError}</p>}
          <button
            onClick={signIn}
            disabled={!inputKey || loading}
            className="w-full rounded-lg bg-[#f59e0b] py-2.5 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-amber-400 disabled:opacity-40"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const activeCount = apps.filter((a) => a.status !== "rejected").length;

  return (
    <div className="min-h-screen bg-[#0a0a10] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a10]/95 backdrop-blur px-4 py-3">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400">
                TD Games
              </p>
              <p className="text-sm font-black leading-tight text-white">HR Dashboard</p>
            </div>
            <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] text-white/50">
              {activeCount} active
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View tabs */}
            <div className="flex rounded-lg border border-white/10 p-0.5">
              {(["pipeline", "kpi", "jobs"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                    view === v ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {v === "pipeline" ? "⬛ Pipeline" : v === "kpi" ? "📊 KPI" : "💼 Jobs"}
                </button>
              ))}
            </div>

            {/* Remind button */}
            <button
              onClick={sendReminder}
              disabled={reminding}
              title="Send stale-application reminder to Discord now"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-white/60 hover:border-white/30 hover:text-white disabled:opacity-40 transition-colors"
            >
              {reminding ? "Sending…" : "⏰ Remind"}
            </button>

            {/* Refresh */}
            <button
              onClick={refresh}
              disabled={loading}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 disabled:opacity-40 transition-colors"
            >
              {loading ? "…" : "↺"}
            </button>
          </div>
        </div>

        {remindMsg && (
          <div className="mx-auto max-w-screen-2xl mt-2">
            <p className="text-xs text-white/60">{remindMsg}</p>
          </div>
        )}
      </header>

      {/* Body */}
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        {loading && apps.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/30">Loading…</p>
        ) : view === "pipeline" ? (
          <PipelineView apps={apps} hrKey={hrKey} onUpdate={updateApp} />
        ) : view === "kpi" ? (
          <KPIView apps={apps} />
        ) : (
          <JobsView
            jobs={jobs}
            hrKey={hrKey}
            onUpdate={(j) => setJobs((prev) => prev.map((x) => x.id === j.id ? j : x))}
            onCreate={(j) => setJobs((prev) => [j, ...prev])}
            onDelete={(id) => setJobs((prev) => prev.filter((x) => x.id !== id))}
          />
        )}
      </main>
    </div>
  );
}
