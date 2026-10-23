"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { JobTest, TestReview, TestSubmission } from "@/app/admin/_lib/types";
import { Check, ClipboardCheck, Clock, Link2, Paperclip, PenLine, X } from "lucide-react";

const LABEL = "text-[10px] font-bold uppercase tracking-wider text-white/35";
const INPUT =
  "w-full rounded border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none";
const BTN_AMBER =
  "rounded border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/10 disabled:opacity-40 transition-colors";
const BTN_PLAIN =
  "rounded border border-white/20 px-2 py-0.5 text-[10px] text-white/60 hover:bg-white/10 transition-colors";
const MAX_SIZE = 50 * 1024 * 1024;

function fmtSize(n: number | null) {
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    window.prompt("Copy:", text);
    return false;
  }
}

/**
 * Form thêm file/link — dùng chung cho đề test (job) và bài làm (ứng viên).
 * `endpoint` nhận multipart `file` hoặc JSON `{ url, title, note }`.
 */
function AddItemForm<T>({
  endpoint,
  hrKey,
  withTitle,
  onAdded,
}: {
  endpoint: string;
  hrKey: string;
  withTitle: boolean;
  onAdded: (item: T) => void;
}) {
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    setErr("");
    let init: RequestInit;
    if (mode === "file") {
      if (!file) return setErr("Chọn file trước");
      if (file.size > MAX_SIZE) return setErr("File quá 50 MB");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      fd.append("note", note);
      init = { method: "POST", headers: { "x-hr-key": hrKey }, body: fd };
    } else {
      if (!url.trim()) return setErr("Dán link trước");
      init = {
        method: "POST",
        headers: { "x-hr-key": hrKey, "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), title, note }),
      };
    }
    setBusy(true);
    try {
      const res = await fetch(endpoint, init);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      onAdded((json.test ?? json.submission) as T);
      setFile(null);
      setUrl("");
      setTitle("");
      setNote("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-white/15 p-2.5">
      <div className="flex gap-1.5">
        {(["file", "link"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
              mode === m ? "border-amber-500/50 bg-amber-500/10 text-amber-300" : "border-white/15 text-white/45"
            }`}
          >
            {m === "file" ? <><Paperclip className="hr-ico" />File (≤50MB)</> : <><Link2 className="hr-ico" />Link</>}
          </button>
        ))}
      </div>
      {mode === "file" ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) setFile(f);
          }}
          className={`flex cursor-pointer items-center justify-center rounded border px-3 py-3 text-[11px] transition-colors ${
            drag ? "border-amber-500/60 bg-amber-500/10 text-amber-200" : "border-white/10 text-white/50 hover:bg-white/5"
          }`}
        >
          {file ? `${file.name} · ${fmtSize(file.size)}` : "Kéo thả file vào đây hoặc bấm để chọn"}
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
      ) : (
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/…" className={INPUT} />
      )}
      {withTitle && (
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề (vd: Đề test Concept Art)" className={INPUT} />
      )}
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Ghi chú / hướng dẫn / deadline" className={INPUT} />
      {err && <p className="text-[11px] text-red-400">{err}</p>}
      <button onClick={() => void submit()} disabled={busy} className={BTN_AMBER}>
        {busy ? "Đang tải lên…" : "+ Thêm"}
      </button>
    </div>
  );
}

function ItemRow({
  icon,
  title,
  url,
  sub,
  note,
  onDelete,
}: {
  icon: ReactNode;
  title: string;
  url: string;
  sub: string;
  note: string | null;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-center gap-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-xs font-semibold text-white hover:text-amber-300">
          {icon}{title}
        </a>
        {sub && <span className="shrink-0 text-[10px] text-white/35">{sub}</span>}
        <button
          onClick={() => void copyText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
          className={BTN_PLAIN}
        >
          {copied ? <Check className="hr-ico-solo" /> : "Copy"}
        </button>
        <button onClick={onDelete} className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/30 hover:border-red-500/40 hover:text-red-400">
          <X className="hr-ico-solo" />
        </button>
      </div>
      {note && <p className="mt-1 whitespace-pre-wrap text-[11px] text-white/50">{note}</p>}
    </div>
  );
}

// ── Đề test của job (tab Jobs) ─────────────────────────────────────────────────
export function JobTestsPanel({ jobId, hrKey }: { jobId: string; hrKey: string }) {
  const [tests, setTests] = useState<JobTest[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/hr/jobs/${jobId}/tests`, { headers: { "x-hr-key": hrKey } })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.error) setErr(j.error);
        else setTests(j.tests);
      })
      .catch(() => alive && setErr("Không tải được"));
    return () => { alive = false; };
  }, [jobId, hrKey]);

  async function remove(t: JobTest) {
    if (!confirm(`Xoá "${t.title}"?`)) return;
    const res = await fetch(`/api/hr/job-tests/${t.id}`, { method: "DELETE", headers: { "x-hr-key": hrKey } });
    if (res.ok) setTests((l) => l?.filter((x) => x.id !== t.id) ?? null);
  }

  return (
    <div className="space-y-2">
      <p className={LABEL}><ClipboardCheck className="hr-ico" />Bài test của job</p>
      {err && <p className="text-[11px] text-red-400">{err}</p>}
      {tests === null && !err && <p className="text-[11px] text-white/30">Đang tải…</p>}
      {tests?.length === 0 && <p className="text-[11px] text-white/30">Chưa có bài test.</p>}
      {tests?.map((t) => (
        <ItemRow
          key={t.id}
          icon={t.kind === "file" ? <Paperclip className="hr-ico" /> : <Link2 className="hr-ico" />}
          title={t.title}
          url={t.url}
          sub={fmtSize(t.file_size)}
          note={t.note}
          onDelete={() => void remove(t)}
        />
      ))}
      <AddItemForm<JobTest>
        endpoint={`/api/hr/jobs/${jobId}/tests`}
        hrKey={hrKey}
        withTitle
        onAdded={(t) => setTests((l) => [...(l ?? []), t])}
      />
    </div>
  );
}

// ── Bài test + bài làm của ứng viên (Candidate modal) ─────────────────────────
const VERDICTS: { key: TestReview["verdict"]; label: string; cls: string }[] = [
  { key: "pass", label: "Đạt", cls: "border-green-500/40 bg-green-500/15 text-green-300" },
  { key: "consider", label: "Cân nhắc", cls: "border-yellow-500/40 bg-yellow-500/15 text-yellow-300" },
  { key: "fail", label: "Không đạt", cls: "border-red-500/40 bg-red-500/15 text-red-300" },
];

/** Leader chấm bài test ngay trong /hr. Tên người chấm lấy theo tên đang dùng để comment. */
function LeaderReview({
  appId,
  hrKey,
  review,
  onReview,
}: {
  appId: string;
  hrKey: string;
  review: TestReview | null;
  onReview: (r: TestReview | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [verdict, setVerdict] = useState<TestReview["verdict"] | null>(review?.verdict ?? null);
  const [score, setScore] = useState<number | null>(review?.score ?? null);
  const [comment, setComment] = useState(review?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(payload: Record<string, unknown> | null) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/hr/applications/${appId}`, {
        method: "PATCH",
        headers: { "x-hr-key": hrKey, "content-type": "application/json" },
        body: JSON.stringify({ test_review: payload }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      onReview(j.application?.test_review ?? null);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setBusy(false);
    }
  }

  function startEdit() {
    setVerdict(review?.verdict ?? null);
    setScore(review?.score ?? null);
    setComment(review?.comment ?? "");
    setError(null);
    setEditing(true);
  }

  const v = VERDICTS.find((x) => x.key === review?.verdict);

  if (!editing) {
    return (
      <div className="space-y-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className={LABEL}>Leader chấm bài</p>
          <button onClick={startEdit} className={BTN_AMBER}>
            {review ? "Sửa đánh giá" : <><PenLine className="hr-ico" />Chấm bài</>}
          </button>
        </div>
        {review ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {v && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${v.cls}`}>{v.label}</span>}
              <span className="text-sm font-bold text-white/90">{review.score}/10</span>
              <span className="text-[10px] text-white/35">
                {review.reviewer} · {new Date(review.reviewed_at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
              </span>
            </div>
            {review.comment && <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-white/70">{review.comment}</p>}
          </>
        ) : (
          <p className="text-[11px] text-white/35">Chưa chấm. AI sẽ dùng đánh giá này khi chấm lại hồ sơ.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-amber-500/25 bg-white/[0.03] p-2.5">
      <p className={LABEL}>Leader chấm bài</p>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-1.5">
        {VERDICTS.map((x) => (
          <button
            key={x.key}
            onClick={() => setVerdict(x.key)}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
              verdict === x.key ? x.cls : "border-white/15 text-white/50 hover:bg-white/5"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-[10px] text-white/40">Điểm</span>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setScore(n)}
            className={`h-6 w-6 rounded text-[11px] font-bold transition-colors ${
              score === n ? "bg-amber-500/80 text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        placeholder="Nhận xét: điểm mạnh, điểm cần cải thiện, có hợp style dự án không…"
        className={INPUT}
      />
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            const reviewer = localStorage.getItem("tdg.hr.comment.author") ?? "";
            void save({ verdict, score, comment, reviewer });
          }}
          disabled={busy || !verdict || !score}
          className={BTN_AMBER}
        >
          {busy ? "Đang lưu…" : "Lưu đánh giá"}
        </button>
        <button onClick={() => setEditing(false)} disabled={busy} className={BTN_PLAIN}>
          Thôi
        </button>
        {review && (
          <button
            onClick={() => confirm("Xoá đánh giá của Leader?") && void save(null)}
            disabled={busy}
            className="ml-auto text-[10px] text-red-400/70 hover:text-red-300"
          >
            Xoá đánh giá
          </button>
        )}
      </div>
    </div>
  );
}

export function SubmissionsPanel({
  appId,
  hrKey,
  review = null,
  onReview,
}: {
  appId: string;
  hrKey: string;
  review?: TestReview | null;
  onReview?: (r: TestReview | null) => void;
}) {
  const [subs, setSubs] = useState<TestSubmission[]>([]);
  const [tests, setTests] = useState<JobTest[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [eta, setEta] = useState<{ at: string; setAt: string | null; overdue: boolean } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/hr/applications/${appId}/submissions`, { headers: { "x-hr-key": hrKey } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j) return;
        setSubs(j.submissions);
        setTests(j.tests);
        setToken(j.token);
        // "Quá hạn" tính 1 lần lúc mở modal (Date.now trong render bị lint cấm).
        setEta(j.eta ? { at: j.eta, setAt: j.etaSetAt, overdue: Date.now() > new Date(j.eta).getTime() } : null);
        setLoaded(true);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [appId, hrKey]);

  async function copyTestLink() {
    let t = token;
    if (!t) {
      const res = await fetch(`/api/hr/applications/${appId}/submissions`, {
        method: "POST",
        headers: { "x-hr-key": hrKey, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "token" }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.token) return alert(j.error ?? "Không tạo được link");
      t = j.token as string;
      setToken(t);
    }
    await copyText(`${window.location.origin}/test/${t}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function remove(s: TestSubmission) {
    if (!confirm("Xoá bài làm này?")) return;
    const res = await fetch(`/api/hr/submissions/${s.id}`, { method: "DELETE", headers: { "x-hr-key": hrKey } });
    if (res.ok) setSubs((l) => l.filter((x) => x.id !== s.id));
  }

  if (!loaded) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <h4 className="hr-section-title">Bài test {subs.length > 0 && <span className="font-normal text-white/50">{subs.length} bài nộp</span>}</h4>
        <button onClick={() => void copyTestLink()} className={BTN_AMBER} title="Link cho ứng viên xem đề + nộp bài">
          {copied ? <><Check className="hr-ico" />Đã copy</> : <><Link2 className="hr-ico" />Copy link test</>}
        </button>
      </div>

      {(() => {
        const candidateSubs = subs.filter((s) => s.submitted_by === "candidate");
        if (!eta) {
          return token && candidateSubs.length === 0 ? (
            <p className="text-[11px] text-white/30"><Clock className="hr-ico" />Ứng viên chưa hẹn thời gian nộp bài.</p>
          ) : null;
        }
        const due = new Date(eta.at);
        const firstSub = candidateSubs[0] ? new Date(candidateSubs[0].created_at) : null;
        const late = firstSub ? firstSub > due : eta.overdue;
        const fmt = (d: Date) =>
          d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
        return (
          <p className="text-[11px] text-white/60">
            <Clock className="hr-ico" />Hẹn nộp: <span className="font-semibold text-amber-300">{fmt(due)}</span>
            {late && (
              <span className="ml-1.5 rounded bg-red-500/20 px-1.5 py-0.5 text-red-300">
                {firstSub ? "nộp trễ" : "quá hạn"}
              </span>
            )}
            {firstSub && !late && (
              <span className="ml-1.5 rounded bg-green-500/20 px-1.5 py-0.5 text-green-300">đúng hẹn</span>
            )}
            {eta.setAt && <span className="text-white/30"> · chốt lúc {fmt(new Date(eta.setAt))}</span>}
          </p>
        );
      })()}

      {tests.length === 0 ? (
        <p className="text-[11px] text-white/30">Job này chưa có đề test — thêm ở tab Jobs.</p>
      ) : (
        <p className="text-[11px] text-white/45">
          Đề: {tests.map((t, i) => (
            <span key={t.id}>
              {i > 0 && " · "}
              <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-amber-300/80 hover:underline">{t.title}</a>
            </span>
          ))}
        </p>
      )}

      {subs.map((s) => (
        <ItemRow
          key={s.id}
          icon={s.kind === "file" ? <Paperclip className="hr-ico" /> : <Link2 className="hr-ico" />}
          title={s.file_name ?? s.url}
          url={s.url}
          sub={`${s.submitted_by === "hr" ? "HR lưu" : "Ứng viên nộp"} · ${new Date(s.created_at).toLocaleDateString("vi-VN")}${s.file_size ? ` · ${fmtSize(s.file_size)}` : ""}`}
          note={s.note}
          onDelete={() => void remove(s)}
        />
      ))}

      {(subs.length > 0 || review) && onReview && (
        <LeaderReview appId={appId} hrKey={hrKey} review={review} onReview={onReview} />
      )}

      {showAdd ? (
        <AddItemForm<TestSubmission>
          endpoint={`/api/hr/applications/${appId}/submissions`}
          hrKey={hrKey}
          withTitle={false}
          onAdded={(s) => { setSubs((l) => [...l, s]); setShowAdd(false); }}
        />
      ) : (
        <button onClick={() => setShowAdd(true)} className={BTN_PLAIN}>+ HR lưu bài làm</button>
      )}
    </section>
  );
}
