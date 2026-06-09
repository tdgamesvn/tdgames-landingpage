"use client";

import { useEffect, useState } from "react";
import type { Job, Application, ApplicationStatus } from "../_lib/types";

type Props = { adminKey: string };
type SubTab = "jobs" | "applications";

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "new",
  "reviewing",
  "interview",
  "offer",
  "rejected",
];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  new: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  reviewing: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  interview: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  offer: "bg-green-500/15 text-green-300 border-green-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
};

const BLANK_JOB: Omit<Job, "id" | "created_at"> = {
  title: "",
  slug: "",
  description: "",
  type: "fulltime",
  location: "Remote",
  level: "",
  salary: "",
  rate_per_hour: null,
  categories: [],
  image_url: "",
  summary: "",
  responsibilities: [],
  requirements: [],
  nice_to_have: [],
  skills: [],
  is_active: true,
};

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function parseLines(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function linesToStr(arr: string[]): string {
  return arr.join("\n");
}

function commaSplit(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// ── Main component ─────────────────────────────────────────────────────────────
export function CareersTab({ adminKey }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("jobs");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-white/10 pb-3">
        {(["jobs", "applications"] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              subTab === t
                ? "bg-indigo-600 text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === "jobs" ? (
        <JobsSubTab adminKey={adminKey} />
      ) : (
        <ApplicationsSubTab adminKey={adminKey} />
      )}
    </div>
  );
}

// ── JobsSubTab ─────────────────────────────────────────────────────────────────
function JobsSubTab({ adminKey }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Job, "id" | "created_at">>(BLANK_JOB);
  const [saving, setSaving] = useState(false);

  // Raw string states for array fields
  const [respRaw, setRespRaw] = useState("");
  const [reqRaw, setReqRaw] = useState("");
  const [nthRaw, setNthRaw] = useState("");
  const [skillsRaw, setSkillsRaw] = useState("");
  const [catsRaw, setCatsRaw] = useState("");

  useEffect(() => {
    void loadJobs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadJobs() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        headers: { "x-admin-key": adminKey },
        cache: "no-store",
      });
      const d = await res.json();
      setJobs(d.jobs ?? []);
    } catch {
      setMsg("❌ Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(BLANK_JOB);
    setRespRaw("");
    setReqRaw("");
    setNthRaw("");
    setSkillsRaw("");
    setCatsRaw("");
    setEditJob(null);
    setShowForm(true);
  }

  function openEdit(job: Job) {
    setForm({ ...job } as Omit<Job, "id" | "created_at">);
    setRespRaw(linesToStr(job.responsibilities));
    setReqRaw(linesToStr(job.requirements));
    setNthRaw(linesToStr(job.nice_to_have));
    setSkillsRaw(linesToStr(job.skills));
    setCatsRaw(job.categories.join(", "));
    setEditJob(job);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditJob(null);
    setMsg("");
  }

  function setF(key: keyof typeof form, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function buildPayload() {
    return {
      ...form,
      slug: form.slug || toSlug(form.title),
      categories: commaSplit(catsRaw),
      responsibilities: parseLines(respRaw),
      requirements: parseLines(reqRaw),
      nice_to_have: parseLines(nthRaw),
      skills: parseLines(skillsRaw),
    };
  }

  async function saveJob() {
    setSaving(true);
    setMsg("");
    const payload = buildPayload();
    try {
      let res: Response;
      if (editJob) {
        res = await fetch(`/api/admin/jobs/${editJob.id}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/jobs", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error((await res.json()).error);
      setMsg(editJob ? "✅ Job updated" : "✅ Job created");
      closeForm();
      void loadJobs();
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : "Save failed"}`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(job: Job) {
    try {
      await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ is_active: !job.is_active }),
      });
      void loadJobs();
    } catch {
      setMsg("❌ Toggle failed");
    }
  }

  async function deleteJob(job: Job) {
    if (
      !confirm(
        `Delete "${job.title}"? This also deletes all applications for this job.`
      )
    )
      return;
    try {
      await fetch(`/api/admin/jobs/${job.id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      void loadJobs();
    } catch {
      setMsg("❌ Delete failed");
    }
  }

  const inputCls =
    "mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400";
  const textareaCls =
    "mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400";
  const labelCls =
    "text-[10px] font-bold uppercase tracking-wider text-white/50";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Jobs ({jobs.length})
        </h2>
        <button
          onClick={openCreate}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          + New Job
        </button>
      </div>

      {msg && <p className="text-sm text-white/70">{msg}</p>}

      {/* Job form */}
      {showForm && (
        <div className="rounded-xl border border-white/15 bg-zinc-900 p-5 space-y-4">
          <h3 className="font-semibold text-base">
            {editJob ? "Edit Job" : "Create Job"}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Title *</label>
              <input
                value={form.title}
                onChange={(e) => {
                  setF("title", e.target.value);
                  if (!editJob) setF("slug", toSlug(e.target.value));
                }}
                className={inputCls}
                placeholder="2D Animator"
              />
            </div>

            <div>
              <label className={labelCls}>Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setF("slug", e.target.value)}
                className={`${inputCls} font-mono`}
                placeholder="2d-animator"
              />
            </div>

            <div>
              <label className={labelCls}>Type *</label>
              <select
                value={form.type}
                onChange={(e) => setF("type", e.target.value)}
                className="mt-1 w-full rounded-md border border-white/15 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
              >
                <option value="fulltime">Fulltime</option>
                <option value="parttime">Part-time</option>
                <option value="remote">Remote</option>
                <option value="freelancer">Freelancer</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Location</label>
              <input
                value={form.location}
                onChange={(e) => setF("location", e.target.value)}
                className={inputCls}
                placeholder="Hanoi / Remote"
              />
            </div>

            <div>
              <label className={labelCls}>Level</label>
              <input
                value={form.level}
                onChange={(e) => setF("level", e.target.value)}
                className={inputCls}
                placeholder="Mid / Senior"
              />
            </div>

            <div>
              <label className={labelCls}>Salary</label>
              <input
                value={form.salary}
                onChange={(e) => setF("salary", e.target.value)}
                className={inputCls}
                placeholder="Competitive"
              />
            </div>

            <div>
              <label className={labelCls}>Rate/hr (freelancer)</label>
              <input
                value={form.rate_per_hour ?? ""}
                onChange={(e) =>
                  setF("rate_per_hour", e.target.value || null)
                }
                className={inputCls}
                placeholder="$15/hr"
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Image URL</label>
              <input
                value={form.image_url}
                onChange={(e) => setF("image_url", e.target.value)}
                className={`${inputCls} font-mono`}
                placeholder="https://cdn.tdgamestudio.com/..."
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>
                Categories (comma-separated)
              </label>
              <input
                value={catsRaw}
                onChange={(e) => setCatsRaw(e.target.value)}
                className={inputCls}
                placeholder="Art, Animation"
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>
                Short description (job card)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setF("description", e.target.value)}
                rows={2}
                className={textareaCls}
                placeholder="One-liner shown in job card listing"
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Summary (detail panel)</label>
              <textarea
                value={form.summary}
                onChange={(e) => setF("summary", e.target.value)}
                rows={3}
                className={textareaCls}
                placeholder="Longer description shown in job detail slide-in panel"
              />
            </div>
          </div>

          {/* Array fields — one item per line */}
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                {
                  label: "Responsibilities (one per line)",
                  raw: respRaw,
                  setRaw: setRespRaw,
                },
                {
                  label: "Requirements (one per line)",
                  raw: reqRaw,
                  setRaw: setReqRaw,
                },
                {
                  label: "Nice to have (one per line)",
                  raw: nthRaw,
                  setRaw: setNthRaw,
                },
                {
                  label: "Skills (one per line)",
                  raw: skillsRaw,
                  setRaw: setSkillsRaw,
                },
              ] as const
            ).map(({ label, raw, setRaw }) => (
              <div key={label}>
                <label className={labelCls}>{label}</label>
                <textarea
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-400"
                  placeholder="One item per line"
                />
              </div>
            ))}
          </div>

          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setF("is_active", e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-white/80">
              Active (visible on /careers page)
            </span>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => void saveJob()}
              disabled={saving || !form.title}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-40"
            >
              {saving ? "Saving…" : editJob ? "Save Changes" : "Create Job"}
            </button>
            <button
              onClick={closeForm}
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Jobs list */}
      {loading ? (
        <p className="py-4 text-sm text-white/50">Loading…</p>
      ) : (
        <div className="space-y-2">
          {jobs.length === 0 && (
            <p className="py-8 text-center text-sm text-white/50">
              No jobs yet. Click &quot;+ New Job&quot; to create one.
            </p>
          )}
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{job.title}</span>
                  <span className="font-mono text-[10px] text-white/40">
                    {job.slug}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                      job.is_active
                        ? "border-green-500/30 bg-green-500/10 text-green-300"
                        : "border-white/15 bg-white/5 text-white/40"
                    }`}
                  >
                    {job.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-white/50">
                  {job.type} · {job.location}
                  {job.categories.length > 0 &&
                    ` · ${job.categories.join(", ")}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => void toggleActive(job)}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5"
                >
                  {job.is_active ? "Hide" : "Show"}
                </button>
                <button
                  onClick={() => openEdit(job)}
                  className="rounded-md border border-indigo-500/30 bg-indigo-600/30 px-3 py-1.5 text-xs hover:bg-indigo-600/50"
                >
                  Edit
                </button>
                <button
                  onClick={() => void deleteJob(job)}
                  className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ApplicationsSubTab ─────────────────────────────────────────────────────────
function ApplicationsSubTab({ adminKey }: Props) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "">("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    void loadApps();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadApps();
  }, [filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadApps() {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/admin/applications${params}`, {
        headers: { "x-admin-key": adminKey },
        cache: "no-store",
      });
      const d = await res.json();
      setApps(d.applications ?? []);
    } catch {
      setMsg("❌ Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  async function updateApp(
    id: string,
    patch: { status?: ApplicationStatus; admin_notes?: string }
  ) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      // Optimistic update for status
      if (patch.status) {
        setApps((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: patch.status! } : a
          )
        );
      }
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : "Update failed"}`);
    } finally {
      setSavingId(null);
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Applications ({apps.length})</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("")}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
              filterStatus === ""
                ? "border-indigo-500 bg-indigo-600 text-white"
                : "border-white/15 text-white/60 hover:bg-white/5"
            }`}
          >
            All
          </button>
          {APPLICATION_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize ${
                filterStatus === s
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-white/15 text-white/60 hover:bg-white/5"
              }`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => void loadApps()}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5"
          >
            ↺ Refresh
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-white/70">{msg}</p>}

      {loading ? (
        <p className="py-4 text-sm text-white/50">Loading…</p>
      ) : (
        <div className="space-y-2">
          {apps.length === 0 && (
            <p className="py-8 text-center text-sm text-white/50">
              No applications yet.
            </p>
          )}
          {apps.map((app) => {
            const isExpanded = expandedId === app.id;
            const noteVal = editNotes[app.id] ?? app.admin_notes ?? "";

            return (
              <div
                key={app.id}
                className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"
              >
                {/* Summary row */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : app.id)
                  }
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {app.full_name}
                      </span>
                      <span className="text-xs text-white/50">
                        {app.email}
                      </span>
                      {app.jobs && (
                        <span className="text-[10px] text-white/40">
                          → {app.jobs.title}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-white/50">
                      <span>{timeAgo(app.created_at)}</span>
                      <span>{app.work_type}</span>
                      {app.referred_by && (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          via {app.referred_by}
                        </span>
                      )}
                      {app.portfolio_url && (
                        <a
                          href={app.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-300 hover:underline"
                        >
                          Portfolio ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[app.status]}`}
                    >
                      {app.status}
                    </span>
                    <svg
                      className={`h-4 w-4 text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="space-y-4 border-t border-white/10 px-4 py-4">
                    {/* Detail grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
                      {(
                        [
                          ["Phone", app.phone],
                          ["Work type", app.work_type],
                          [
                            "Experience",
                            app.years_experience != null
                              ? `${app.years_experience} yrs`
                              : null,
                          ],
                          ["Expected salary", app.expected_salary],
                          ["Rate/hr", app.rate_per_hour],
                          ["LinkedIn", app.linkedin_url],
                        ] as [string, string | null | undefined][]
                      ).map(([label, val]) =>
                        val ? (
                          <div key={label}>
                            <span className="text-[10px] uppercase tracking-wider text-white/40">
                              {label}
                            </span>
                            <p className="mt-0.5 truncate text-white/80">
                              {val}
                            </p>
                          </div>
                        ) : null
                      )}
                    </div>

                    {/* Status buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-white/50">
                        Status:
                      </span>
                      {APPLICATION_STATUSES.map((s) => (
                        <button
                          key={s}
                          disabled={savingId === app.id}
                          onClick={() => void updateApp(app.id, { status: s })}
                          className={`rounded-md border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                            app.status === s
                              ? STATUS_COLORS[s]
                              : "border-white/15 text-white/50 hover:bg-white/5"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    {/* Admin notes */}
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-white/40">
                        Admin Notes
                      </label>
                      <textarea
                        value={noteVal}
                        onChange={(e) =>
                          setEditNotes((n) => ({
                            ...n,
                            [app.id]: e.target.value,
                          }))
                        }
                        rows={2}
                        className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs focus:border-indigo-400 focus:outline-none"
                        placeholder="Internal notes…"
                      />
                      <button
                        disabled={savingId === app.id}
                        onClick={() =>
                          void updateApp(app.id, { admin_notes: noteVal })
                        }
                        className="mt-1.5 rounded-md border border-white/15 px-3 py-1 text-xs hover:bg-white/5 disabled:opacity-40"
                      >
                        {savingId === app.id ? "Saving…" : "Save Notes"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
