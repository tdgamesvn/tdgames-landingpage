"use client";

import { useEffect, useMemo, useState } from "react";
import type { Application, ApplicationStatus } from "@/app/admin/_lib/types";

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

// ── Main dashboard ────────────────────────────────────────────────────────────

type View = "pipeline" | "kpi";

export default function HRDashboard() {
  const [hrKey, setHrKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [authError, setAuthError] = useState("");
  const [view, setView] = useState<View>("pipeline");
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [remindMsg, setRemindMsg] = useState("");

  async function signIn() {
    setAuthError("");
    setLoading(true);
    try {
      const res = await fetch("/api/hr/applications", {
        headers: { "x-hr-key": inputKey },
      });
      if (!res.ok) {
        setAuthError("Invalid key. Try again.");
        return;
      }
      const data = await res.json();
      setApps(data.applications ?? []);
      setHrKey(inputKey);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    if (!hrKey) return;
    setLoading(true);
    try {
      const res = await fetch("/api/hr/applications", {
        headers: { "x-hr-key": hrKey },
      });
      const data = await res.json();
      setApps(data.applications ?? []);
    } finally {
      setLoading(false);
    }
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
              {(["pipeline", "kpi"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                    view === v
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {v === "pipeline" ? "⬛ Pipeline" : "📊 KPI"}
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
        ) : (
          <KPIView apps={apps} />
        )}
      </main>
    </div>
  );
}
