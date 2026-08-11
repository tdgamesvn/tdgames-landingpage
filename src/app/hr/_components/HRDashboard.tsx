"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Application, ApplicationComment, ApplicationStatus, Job, JobType } from "@/app/admin/_lib/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES: ApplicationStatus[] = [
  "new",
  "reviewing",
  "phone_screening",
  "test",
  "interview",
  "offer",
  "rejected",
];

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  phone_screening: "Phone Screening",
  test: "Test",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  new: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  reviewing: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
  phone_screening: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  test: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  interview: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  offer: "border-green-500/40 bg-green-500/10 text-green-300",
  rejected: "border-red-500/40 bg-red-500/10 text-red-300",
};

const STATUS_NEXT: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  new: "reviewing",
  reviewing: "phone_screening",
  phone_screening: "test",
  test: "interview",
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

function scoreColor(s: number) {
  if (s >= 75) return "border-green-500/40 bg-green-500/10 text-green-300";
  if (s >= 50) return "border-yellow-500/40 bg-yellow-500/10 text-yellow-300";
  return "border-red-500/40 bg-red-500/10 text-red-300";
}

const VERDICT_LABEL: Record<string, string> = {
  strong_yes: "Strong Yes",
  yes: "Yes",
  maybe: "Maybe",
  no: "No",
};

// ── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({
  appName,
  onConfirm,
  onCancel,
}: {
  appName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const presets = [
    "Portfolio quality does not meet requirements",
    "Insufficient experience for this role",
    "Skills mismatch",
    "Position already filled",
    "Salary expectations too high",
    "No response after follow-up",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#141418] p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="text-base font-bold text-white">Reject Application</h3>
          <p className="mt-1 text-xs text-white/50">Rejecting <span className="font-semibold text-white/70">{appName}</span></p>
        </div>

        {/* Preset reasons */}
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setReason(p)}
              className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
                reason === p
                  ? "border-red-500/50 bg-red-500/15 text-red-300"
                  : "border-white/10 text-white/50 hover:border-white/25 hover:text-white/70"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Custom reason */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            autoFocus
            className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-red-500/50 focus:outline-none"
            placeholder="Enter rejection reason…"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/15 px-4 py-2 text-xs text-white/60 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition-colors"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DetailRow({ label, value, href }: { label: string; value?: string | number | null; href?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="shrink-0 w-28 text-white/35 uppercase text-[10px] font-bold tracking-wider pt-0.5">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-400/80 hover:text-amber-300 break-all">
          {String(value)} ↗
        </a>
      ) : (
        <span className="text-white/70 break-all">{String(value)}</span>
      )}
    </div>
  );
}

const COMMENT_AUTHOR_KEY = "tdg.hr.comment.author";

function CommentThread({ appId, hrKey, listMaxH = "max-h-60" }: { appId: string; hrKey: string; listMaxH?: string }) {
  const [comments, setComments] = useState<ApplicationComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(COMMENT_AUTHOR_KEY) ?? ""
      : "",
  );
  // Whether the author name is confirmed (persisted) vs. still being typed.
  // Gating the "name input" vs. "Commenting as" display on `author` truthiness
  // (instead of this separate flag) unmounted the input after the first
  // keystroke, since `author` became truthy immediately on every change.
  const [authorLocked, setAuthorLocked] = useState(
    () => typeof window !== "undefined" && !!localStorage.getItem(COMMENT_AUTHOR_KEY),
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [content]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/hr/applications/${appId}/comments`, {
        headers: { "x-hr-key": hrKey },
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [appId, hrKey]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  async function submit() {
    const trimAuthor = author.trim();
    const trimContent = content.trim();
    if (!trimAuthor || !trimContent) return;

    // Persist author name
    localStorage.setItem(COMMENT_AUTHOR_KEY, trimAuthor);
    setAuthor(trimAuthor);
    setAuthorLocked(true);

    setSending(true);
    try {
      const res = await fetch(`/api/hr/applications/${appId}/comments`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hr-key": hrKey,
        },
        body: JSON.stringify({
          author_name: trimAuthor,
          content: trimContent,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setContent("");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400/70">
        Comments ({comments.length})
      </p>

      {/* Comment list */}
      <div className={`${listMaxH} space-y-2 overflow-y-auto pr-1`}>
        {loading && (
          <p className="text-xs text-white/30 italic">Loading...</p>
        )}
        {!loading && comments.length === 0 && (
          <p className="text-xs text-white/25 italic">
            No comments yet. Start the conversation.
          </p>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-purple-300/90">
                {c.author_name}
              </span>
              <span className="text-[9px] text-white/30">
                {new Date(c.created_at).toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-xs text-white/65 whitespace-pre-wrap leading-relaxed">
              {c.content}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* New comment form */}
      <div className="space-y-2 border-t border-white/8 pt-3">
        {/* Author input (only until name is confirmed) */}
        {!authorLocked && (
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name..."
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/25 focus:border-purple-500/50 focus:outline-none"
          />
        )}
        {authorLocked && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/40">
              Commenting as{" "}
              <span className="font-bold text-purple-300/70">{author}</span>
            </span>
            <button
              onClick={() => {
                setAuthor("");
                setAuthorLocked(false);
                localStorage.removeItem(COMMENT_AUTHOR_KEY);
              }}
              className="text-[9px] text-white/25 hover:text-white/50"
            >
              (change)
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && content.trim() && author.trim()) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="Write a comment... (Shift+Enter xuống dòng)"
            rows={1}
            className="flex-1 resize-none rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/25 focus:border-purple-500/50 focus:outline-none overflow-y-auto"
          />
          <button
            onClick={submit}
            disabled={sending || !content.trim() || !author.trim()}
            className="shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-purple-500 disabled:opacity-40 transition-colors"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppDetail({ app, hrKey, comments = true }: { app: Application; hrKey: string; comments?: boolean }) {
  return (
    <div className="space-y-2 border-t border-white/10 pt-3 mt-2">
      <DetailRow label="Email" value={app.email} href={`mailto:${app.email}`} />
      <DetailRow label="Phone" value={app.phone} href={app.phone ? `tel:${app.phone}` : undefined} />
      <DetailRow label="Type" value={app.work_type} />
      <DetailRow label="Experience" value={app.years_experience ? `${app.years_experience} year(s)` : null} />
      <DetailRow label="Salary" value={app.expected_salary} />
      <DetailRow label="Rate/hr" value={app.rate_per_hour} />
      <DetailRow label="Hours/week" value={app.available_hours_per_week} />
      <DetailRow label="Available" value={app.available_from} />
      <DetailRow label="Portfolio" value={app.portfolio_url} href={app.portfolio_url ?? undefined} />
      <DetailRow label="CV" value={app.cv_url ? "Download" : null} href={app.cv_url ?? undefined} />
      <DetailRow label="LinkedIn" value={app.linkedin_url} href={app.linkedin_url ?? undefined} />
      <DetailRow label="Source" value={app.source} />
      <DetailRow label="Referred by" value={app.referred_by} />
      {app.message && (
        <div className="pt-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/35 mb-1">Message</p>
          <p className="text-xs text-white/60 whitespace-pre-wrap bg-white/[0.03] rounded-lg p-2 border border-white/5">
            {app.message}
          </p>
        </div>
      )}
      {app.rejection_reason && (
        <div className="pt-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400/60 mb-1">Rejection Reason</p>
          <p className="text-xs text-red-300/80 whitespace-pre-wrap bg-red-500/[0.06] rounded-lg p-2 border border-red-500/15">
            {app.rejection_reason}
          </p>
        </div>
      )}
      <DetailRow label="Applied" value={new Date(app.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} />

      {/* Comment thread */}
      {comments && (
        <div className="pt-3 mt-2 border-t border-white/8">
          <CommentThread appId={app.id} hrKey={hrKey} />
        </div>
      )}
    </div>
  );
}

// ── Candidate Modal (ClickUp-style: info left, comments right) ───────────────

function CandidateModal({
  app,
  hrKey,
  saving,
  onMove,
  onDeleteApp,
  onSaveNote,
  onPatch,
  onClose,
}: {
  app: Application;
  hrKey: string;
  saving: boolean;
  onMove: (status: ApplicationStatus, reason?: string) => void;
  onDeleteApp: () => void;
  onSaveNote: (note: string) => void;
  onPatch: (patch: Partial<Application>) => void;
  onClose: () => void;
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [note, setNote] = useState(app.admin_notes ?? "");
  const [evaluating, setEvaluating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function evaluate() {
    setEvaluating(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/hr/applications/${app.id}/evaluate`, {
        method: "POST",
        headers: { "x-hr-key": hrKey },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      onPatch({
        ai_score: data.application.ai_score,
        ai_evaluation: data.application.ai_evaluation,
      });
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  }
  const nextStatus = STATUS_NEXT[app.status];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6"
      onClick={onClose}
    >
      <div
        className="flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#141418] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-tight text-white">{app.full_name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {app.jobs && <span className="text-xs text-white/55">{app.jobs.title}</span>}
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[app.status]}`}
              >
                {STATUS_LABEL[app.status]}
              </span>
              <span className="text-[10px] text-white/40">{timeAgo(app.created_at)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/50 hover:bg-white/5 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_340px]">
          {/* Left: actions + info + note */}
          <div className="space-y-3 overflow-y-auto px-5 py-4">
            {/* Actions */}
            <div className="flex flex-wrap gap-1.5">
              {nextStatus && (
                <button
                  onClick={() => onMove(nextStatus)}
                  disabled={saving}
                  className="rounded border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white/80 hover:bg-white/10 disabled:opacity-40 transition-colors"
                >
                  → {STATUS_LABEL[nextStatus]}
                </button>
              )}
              {app.status !== "rejected" && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={saving}
                  className="rounded border border-red-500/30 px-2.5 py-1 text-[11px] font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                >
                  ✕ Reject
                </button>
              )}
              {app.status === "rejected" && (
                <button
                  onClick={() => onMove("new")}
                  disabled={saving}
                  className="rounded border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white/60 hover:bg-white/10 disabled:opacity-40"
                >
                  ↺ Reopen
                </button>
              )}
              <button
                onClick={onDeleteApp}
                disabled={saving}
                className="ml-auto rounded border border-white/10 px-2.5 py-1 text-[11px] text-white/30 hover:border-red-500/40 hover:text-red-400 disabled:opacity-40 transition-colors"
                title="Delete application"
              >
                🗑 Delete
              </button>
            </div>

            {/* AI Evaluation */}
            <div className="space-y-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                  AI Evaluation
                </p>
                <button
                  onClick={() => void evaluate()}
                  disabled={evaluating}
                  className="rounded border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/10 disabled:opacity-40 transition-colors"
                >
                  {evaluating ? "Evaluating…" : app.ai_evaluation ? "↻ Re-evaluate" : "🤖 Evaluate"}
                </button>
              </div>
              {aiError && <p className="text-[11px] text-red-400">{aiError}</p>}
              {app.ai_evaluation && (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-sm font-bold ${scoreColor(app.ai_evaluation.score)}`}
                    >
                      {app.ai_evaluation.score}
                    </span>
                    <span className="text-xs font-bold text-white/70">
                      {VERDICT_LABEL[app.ai_evaluation.verdict] ?? app.ai_evaluation.verdict}
                    </span>
                  </div>
                  <ul className="space-y-0.5 text-[11px] text-green-300/80">
                    {app.ai_evaluation.strengths.map((s, i) => (
                      <li key={i}>+ {s}</li>
                    ))}
                  </ul>
                  <ul className="space-y-0.5 text-[11px] text-red-300/80">
                    {app.ai_evaluation.concerns.map((c, i) => (
                      <li key={i}>− {c}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <AppDetail app={app} hrKey={hrKey} comments={false} />

            {/* Note */}
            <div className="space-y-1 border-t border-white/8 pt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Note</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full rounded border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none"
                placeholder="Add a note…"
              />
              {note !== (app.admin_notes ?? "") && (
                <button
                  onClick={() => onSaveNote(note)}
                  disabled={saving}
                  className="rounded bg-amber-600 px-2.5 py-1 text-[10px] font-bold hover:bg-amber-500 disabled:opacity-40"
                >
                  Save note
                </button>
              )}
            </div>
          </div>

          {/* Right: comments */}
          <div className="overflow-y-auto border-t border-white/10 bg-white/[0.02] px-4 py-4 md:border-l md:border-t-0">
            <CommentThread appId={app.id} hrKey={hrKey} listMaxH="max-h-[52vh]" />
          </div>
        </div>

        {/* Reject modal (inside stopPropagation container) */}
        {showRejectModal && (
          <RejectModal
            appName={app.full_name}
            onConfirm={(reason) => {
              setShowRejectModal(false);
              onMove("rejected", reason);
            }}
            onCancel={() => setShowRejectModal(false)}
          />
        )}
      </div>
    </div>
  );
}

function AppCard({
  app,
  hrKey,
  onUpdate,
  onDelete,
}: {
  app: Application;
  hrKey: string;
  onUpdate: (id: string, patch: Partial<Application>) => void;
  onDelete: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [note, setNote] = useState(app.admin_notes ?? "");

  async function move(status: ApplicationStatus, rejection_reason?: string) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { status };
      if (rejection_reason !== undefined) body.rejection_reason = rejection_reason;
      // Clear rejection_reason when reopening
      if (status !== "rejected") body.rejection_reason = null;
      const res = await fetch(`/api/hr/applications/${app.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-hr-key": hrKey },
        body: JSON.stringify(body),
      });
      if (res.ok) onUpdate(app.id, { status, rejection_reason: status === "rejected" ? (rejection_reason ?? null) : null } as Partial<Application>);
    } finally {
      setSaving(false);
    }
  }

  async function deleteApp() {
    if (!confirm(`Delete application from "${app.full_name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/applications/${app.id}`, {
        method: "DELETE",
        headers: { "x-hr-key": hrKey },
      });
      if (res.ok) onDelete(app.id);
    } finally {
      setSaving(false);
    }
  }

  async function saveNote(newNote: string) {
    setSaving(true);
    try {
      await fetch(`/api/hr/applications/${app.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-hr-key": hrKey },
        body: JSON.stringify({ admin_notes: newNote }),
      });
      onUpdate(app.id, { admin_notes: newNote });
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
        <button
          onClick={() => setShowModal(true)}
          className="text-left text-sm font-semibold text-white leading-tight hover:text-amber-300 transition-colors"
        >
          {app.full_name}
        </button>
        <span className="text-[10px] text-white/40 shrink-0">{timeAgo(app.created_at)}</span>
      </div>

      {/* Job title */}
      {app.jobs && (
        <p className="text-xs text-white/55 truncate">{app.jobs.title}</p>
      )}

      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5">
        {app.ai_score != null && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${scoreColor(app.ai_score)}`}
            title={app.ai_evaluation ? VERDICT_LABEL[app.ai_evaluation.verdict] : undefined}
          >
            🤖 {app.ai_score}
          </span>
        )}
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

      {/* Rejection reason preview */}
      {app.status === "rejected" && app.rejection_reason && (
        <p className="text-[11px] text-red-400/70 italic truncate">
          ✕ {app.rejection_reason}
        </p>
      )}

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
              onClick={() => void saveNote(note)}
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
            onClick={() => setShowRejectModal(true)}
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
        <button
          onClick={deleteApp}
          disabled={saving}
          className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-white/30 hover:border-red-500/40 hover:text-red-400 transition-colors disabled:opacity-40"
          title="Delete application"
        >
          🗑
        </button>
      </div>

      {/* Candidate modal */}
      {showModal && (
        <CandidateModal
          app={app}
          hrKey={hrKey}
          saving={saving}
          onMove={(status, reason) => void move(status, reason)}
          onDeleteApp={() => void deleteApp()}
          onSaveNote={(n) => { setNote(n); void saveNote(n); }}
          onPatch={(patch) => onUpdate(app.id, patch)}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <RejectModal
          appName={app.full_name}
          onConfirm={(reason) => {
            setShowRejectModal(false);
            void move("rejected", reason);
          }}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
    </div>
  );
}

// ── Pipeline view ─────────────────────────────────────────────────────────────

function PipelineView({
  apps,
  hrKey,
  onUpdate,
  onDelete,
}: {
  apps: Application[];
  hrKey: string;
  onUpdate: (id: string, patch: Partial<Application>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                <AppCard key={app.id} app={app} hrKey={hrKey} onUpdate={onUpdate} onDelete={onDelete} />
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
  // Rejection reason stats
  const rejectionStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const app of apps) {
      if (app.status === "rejected" && app.rejection_reason) {
        const key = app.rejection_reason;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return [...map.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  }, [apps]);

  const totalRejected = apps.filter((a) => a.status === "rejected").length;
  const withReason = apps.filter((a) => a.status === "rejected" && a.rejection_reason).length;

  const rows = useMemo(() => {
    const map = new Map<string, Record<string, number>>();

    for (const app of apps) {
      const key = app.referred_by ?? "(direct)";
      if (!map.has(key)) {
        map.set(key, { total: 0, new: 0, reviewing: 0, phone_screening: 0, test: 0, interview: 0, offer: 0, rejected: 0 });
      }
      const row = map.get(key)!;
      row.total += 1;
      row[app.status] = (row[app.status] ?? 0) + 1;
    }

    return [...map.entries()]
      .map(([name, counts]) => ({ name, total: 0, new: 0, reviewing: 0, phone_screening: 0, test: 0, interview: 0, offer: 0, rejected: 0, ...counts }))
      .sort((a, b) => b.total - a.total);
  }, [apps]);

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-white/40">No applications yet.</p>;
  }

  return (
    <div className="space-y-6">
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/40">
            <th className="px-4 py-3 text-left">Referrer</th>
            <th className="px-3 py-3 text-center">Total</th>
            <th className="px-3 py-3 text-center">New</th>
            <th className="px-3 py-3 text-center">Reviewing</th>
            <th className="px-3 py-3 text-center">Phone</th>
            <th className="px-3 py-3 text-center">Test</th>
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
                <td className="px-3 py-3 text-center text-orange-300">{row.phone_screening || "—"}</td>
                <td className="px-3 py-3 text-center text-cyan-300">{row.test || "—"}</td>
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

    {/* Rejection Reasons Breakdown */}
    {totalRejected > 0 && (
      <div className="rounded-xl border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Rejection Reasons</h3>
          <span className="text-[10px] text-white/40">
            {withReason}/{totalRejected} rejected with reason ({totalRejected > 0 ? Math.round((withReason / totalRejected) * 100) : 0}%)
          </span>
        </div>

        {rejectionStats.length === 0 ? (
          <p className="text-xs text-white/30 italic">No rejection reasons recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {rejectionStats.map(({ reason, count }) => {
              const pct = totalRejected > 0 ? Math.round((count / totalRejected) * 100) : 0;
              return (
                <div key={reason} className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-white/70 truncate flex-1">{reason}</span>
                    <span className="shrink-0 text-xs font-bold text-red-300">
                      {count} <span className="text-white/30 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-red-500/50 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}
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

function JobImageUpload({
  currentUrl, hrKey, onUploaded,
}: {
  currentUrl: string; hrKey: string; onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await fetch("/api/hr/upload", {
        method: "POST",
        headers: { "x-hr-key": hrKey },
        body: data,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onUploaded(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-1 space-y-2">
      {/* Preview */}
      {currentUrl && (
        <div className="relative h-32 w-full overflow-hidden rounded-lg border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt="Job" className="h-full w-full object-cover" />
        </div>
      )}
      {/* Upload zone */}
      <div
        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/[0.03] px-4 py-3 transition-colors hover:border-amber-500/50 hover:bg-white/5"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
      >
        {uploading ? (
          <span className="text-xs text-white/50">Uploading...</span>
        ) : (
          <>
            <svg className="h-4 w-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-xs text-white/40">
              Drop image or <span className="text-amber-400/70 underline">browse</span>
            </span>
          </>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      <p className="text-[10px] text-white/25 mt-1">
        Recommended: 480 x 320 px (3:2 landscape). Image will be cropped to fit card on /careers.
      </p>
    </div>
  );
}

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
            <label className={labelCls}>Job Image</label>
            <JobImageUpload
              currentUrl={d.image_url}
              hrKey={hrKey}
              onUploaded={(url) => set("image_url", url)}
            />
            <input className={`${inputCls} mt-2`} value={d.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://cdn.tdgamestudio.com/… (or upload above)" />
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

const REFCODE_KEY = "tdg.hr.refcode";
const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://www.tdgamestudio.com";

function JobsView({ jobs, hrKey, onUpdate, onCreate, onDelete }: {
  jobs: Job[]; hrKey: string;
  onUpdate: (j: Job) => void; onCreate: (j: Job) => void; onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string>(() =>
    typeof window !== "undefined" ? (localStorage.getItem(REFCODE_KEY) ?? "") : ""
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function saveRefCode(val: string) {
    setRefCode(val);
    if (typeof window !== "undefined") {
      if (val) localStorage.setItem(REFCODE_KEY, val);
      else localStorage.removeItem(REFCODE_KEY);
    }
  }

  function copyLink(job: Job) {
    const slug = `/apply/${job.slug}`;
    const url = refCode
      ? `${BASE_URL}${slug}?ref=${encodeURIComponent(refCode)}`
      : `${BASE_URL}${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(job.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

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

      {/* Ref code banner */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <span className="text-xs font-bold text-amber-400/80">🔗 Your ref code:</span>
        <input
          value={refCode}
          onChange={(e) => saveRefCode(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
          placeholder="e.g. nam, linh, hr-team…"
          className="w-40 rounded-lg border border-amber-500/30 bg-transparent px-2.5 py-1.5 text-xs text-white placeholder:text-white/25 focus:border-amber-500/60 focus:outline-none"
        />
        {refCode && (
          <span className="text-[10px] text-white/40">
            Links will use <code className="text-amber-300/70">?ref={refCode}</code>
          </span>
        )}
        {!refCode && (
          <span className="text-[10px] text-white/30 italic">
            Enter your name to generate trackable apply links
          </span>
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

                {/* Apply link (open) */}
                <a href={`/apply/${job.slug}`} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/50 hover:text-white transition-colors"
                  title="Open apply page">
                  ↗
                </a>

                {/* Copy refer link */}
                <button
                  onClick={() => copyLink(job)}
                  title={refCode ? `Copy link with ?ref=${refCode}` : "Copy apply link (no ref code set)"}
                  className={`rounded-lg border px-3 py-1 text-[10px] font-bold transition-colors ${
                    copiedId === job.id
                      ? "border-green-500/40 bg-green-500/10 text-green-400"
                      : refCode
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        : "border-white/15 text-white/40 hover:bg-white/5"
                  }`}
                >
                  {copiedId === job.id ? "✓ Copied!" : "📋 Copy Link"}
                </button>

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

// ── Data view (filterable table) ─────────────────────────────────────────────

function DataView({
  apps,
  jobs,
  hrKey,
  onUpdate,
  onDelete,
}: {
  apps: Application[];
  jobs: Job[];
  hrKey: string;
  onUpdate: (id: string, patch: Partial<Application>) => void;
  onDelete: (id: string) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterJob, setFilterJob] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sources = useMemo(() => {
    const set = new Set<string>();
    for (const a of apps) if (a.source) set.add(a.source);
    return [...set].sort();
  }, [apps]);

  const workTypes = useMemo(() => {
    const set = new Set<string>();
    for (const a of apps) if (a.work_type) set.add(a.work_type);
    return [...set].sort();
  }, [apps]);

  const filtered = useMemo(() => {
    let list = apps;
    if (filterStatus !== "all") list = list.filter((a) => a.status === filterStatus);
    if (filterJob !== "all") list = list.filter((a) => a.job_id === filterJob);
    if (filterSource !== "all") list = list.filter((a) => a.source === filterSource);
    if (filterType !== "all") list = list.filter((a) => a.work_type === filterType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.full_name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.phone ?? "").toLowerCase().includes(q) ||
          (a.referred_by ?? "").toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [apps, filterStatus, filterJob, filterSource, filterType, search]);

  const selectCls = "rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white focus:border-amber-500/50 focus:outline-none";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone..."
          className="w-56 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/25 focus:border-amber-500/50 focus:outline-none"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
          <option value="all">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select value={filterJob} onChange={(e) => setFilterJob(e.target.value)} className={selectCls}>
          <option value="all">All Jobs</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectCls}>
          <option value="all">All Types</option>
          {workTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className={selectCls}>
          <option value="all">All Sources</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-[10px] text-white/40 ml-auto">{filtered.length} / {apps.length} applicants</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-white/30">No applicants match your filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/40">
                <th className="px-3 py-3 text-left">Name</th>
                <th className="px-3 py-3 text-left">Job</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-center">Type</th>
                <th className="px-3 py-3 text-left">Email</th>
                <th className="px-3 py-3 text-center">Source</th>
                <th className="px-3 py-3 text-center">Referrer</th>
                <th className="px-3 py-3 text-center">Date</th>
                <th className="px-3 py-3 text-center">Links</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, i) => (
                <>
                  <tr
                    key={app.id}
                    onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    className={`border-b border-white/5 cursor-pointer transition-colors hover:bg-white/[0.04] ${
                      i % 2 === 0 ? "" : "bg-white/[0.015]"
                    } ${expandedId === app.id ? "bg-amber-500/5" : ""}`}
                  >
                    <td className="px-3 py-2.5 font-medium text-white">{app.full_name}</td>
                    <td className="px-3 py-2.5 text-white/60 text-xs">{app.jobs?.title ?? "—"}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_COLOR[app.status]}`}>
                        {STATUS_LABEL[app.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-white/50">{app.work_type}</td>
                    <td className="px-3 py-2.5 text-xs text-white/50">{app.email}</td>
                    <td className="px-3 py-2.5 text-center text-xs text-white/40">{app.source ?? "—"}</td>
                    <td className="px-3 py-2.5 text-center">
                      {app.referred_by ? (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          {app.referred_by}
                        </span>
                      ) : <span className="text-xs text-white/25">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-white/40">
                      {new Date(app.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {app.cv_url && (
                          <a href={app.cv_url} target="_blank" rel="noopener noreferrer"
                            className="rounded border border-white/15 px-1.5 py-0.5 text-[9px] text-white/50 hover:text-white">CV</a>
                        )}
                        {app.portfolio_url && (
                          <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer"
                            className="rounded border border-white/15 px-1.5 py-0.5 text-[9px] text-white/50 hover:text-white">PF</a>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === app.id && (
                    <tr key={`${app.id}-detail`} className="bg-white/[0.02]">
                      <td colSpan={9} className="px-6 py-4">
                        <AppDetail app={app} hrKey={hrKey} />
                        {/* Quick actions */}
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                          {STATUS_NEXT[app.status] && (
                            <QuickAction app={app} hrKey={hrKey} targetStatus={STATUS_NEXT[app.status]!} onUpdate={onUpdate} />
                          )}
                          {app.status !== "rejected" && (
                            <QuickAction app={app} hrKey={hrKey} targetStatus="rejected" onUpdate={onUpdate} variant="reject" />
                          )}
                          {app.status === "rejected" && (
                            <QuickAction app={app} hrKey={hrKey} targetStatus="new" onUpdate={onUpdate} variant="reopen" />
                          )}
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete application from "${app.full_name}"? This cannot be undone.`)) return;
                              const res = await fetch(`/api/hr/applications/${app.id}`, {
                                method: "DELETE",
                                headers: { "x-hr-key": hrKey },
                              });
                              if (res.ok) onDelete(app.id);
                            }}
                            className="rounded border border-white/10 px-3 py-1 text-[10px] font-bold text-white/30 hover:border-red-500/40 hover:text-red-400 transition-colors ml-auto"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function QuickAction({
  app, hrKey, targetStatus, onUpdate, variant,
}: {
  app: Application; hrKey: string; targetStatus: ApplicationStatus;
  onUpdate: (id: string, patch: Partial<Application>) => void;
  variant?: "reject" | "reopen";
}) {
  const [saving, setSaving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  async function move(rejection_reason?: string) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { status: targetStatus };
      if (rejection_reason !== undefined) body.rejection_reason = rejection_reason;
      if (targetStatus !== "rejected") body.rejection_reason = null;
      const res = await fetch(`/api/hr/applications/${app.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-hr-key": hrKey },
        body: JSON.stringify(body),
      });
      if (res.ok) onUpdate(app.id, { status: targetStatus, rejection_reason: targetStatus === "rejected" ? (rejection_reason ?? null) : null } as Partial<Application>);
    } finally { setSaving(false); }
  }

  const cls = variant === "reject"
    ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
    : variant === "reopen"
      ? "border-white/20 text-white/60 hover:bg-white/10"
      : "border-white/20 text-white/80 hover:bg-white/10";

  const label = variant === "reject" ? "✕ Reject"
    : variant === "reopen" ? "↺ Reopen"
    : `→ ${STATUS_LABEL[targetStatus]}`;

  return (
    <>
      <button
        onClick={() => variant === "reject" ? setShowRejectModal(true) : void move()}
        disabled={saving}
        className={`rounded border px-3 py-1 text-[10px] font-bold transition-colors disabled:opacity-40 ${cls}`}
      >
        {saving ? "..." : label}
      </button>
      {showRejectModal && (
        <RejectModal
          appName={app.full_name}
          onConfirm={(reason) => {
            setShowRejectModal(false);
            void move(reason);
          }}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
    </>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

type View = "pipeline" | "kpi" | "jobs" | "data";

const HR_KEY_STORAGE = "tdg.hr.key";

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

  // Auto-login from localStorage on mount
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(HR_KEY_STORAGE) : null;
    if (!saved) return;
    setLoading(true);
    loadData(saved)
      .then(() => setHrKey(saved))
      .catch(() => localStorage.removeItem(HR_KEY_STORAGE)) // stale / key changed
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      localStorage.setItem(HR_KEY_STORAGE, inputKey);
    } catch {
      setAuthError("Invalid key. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    setHrKey("");
    setApps([]);
    setJobs([]);
    setInputKey("");
    localStorage.removeItem(HR_KEY_STORAGE);
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

  function deleteApp(id: string) {
    setApps((prev) => prev.filter((a) => a.id !== id));
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
              {(["pipeline", "data", "kpi", "jobs"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                    view === v ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {v === "pipeline" ? "⬛ Pipeline" : v === "data" ? "📋 Data" : v === "kpi" ? "📊 KPI" : "💼 Jobs"}
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

            {/* Sign out */}
            <button
              onClick={signOut}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/30 hover:border-red-500/30 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              Sign out
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
          <PipelineView apps={apps} hrKey={hrKey} onUpdate={updateApp} onDelete={deleteApp} />
        ) : view === "data" ? (
          <DataView apps={apps} jobs={jobs} hrKey={hrKey} onUpdate={updateApp} onDelete={deleteApp} />
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
