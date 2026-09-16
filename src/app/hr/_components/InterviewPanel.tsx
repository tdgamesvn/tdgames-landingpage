"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InterviewSession } from "@/app/admin/_lib/types";

const LABEL = "text-[10px] font-bold uppercase tracking-wider text-white/35";
const CARD = "rounded-lg border border-white/10 bg-white/[0.03] p-3";
const BTN_AMBER =
  "rounded border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/10 disabled:opacity-40 transition-colors";
const BTN_PLAIN =
  "rounded border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white/80 hover:bg-white/10 disabled:opacity-40 transition-colors";
const BTN_RED =
  "rounded border border-red-500/30 px-2.5 py-1 text-[11px] font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors";
const TEXTAREA =
  "w-full rounded border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none";
const ERR = "text-[11px] text-red-400";

function scoreColor(s: number) {
  if (s >= 75) return "border-green-500/40 bg-green-500/10 text-green-400";
  if (s >= 50) return "border-yellow-500/40 bg-yellow-500/10 text-yellow-400";
  return "border-red-500/40 bg-red-500/10 text-red-400";
}

const VERDICT_LABEL: Record<string, string> = {
  strong_yes: "Strong Yes",
  yes: "Yes",
  maybe: "Maybe",
  no: "No",
};

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "độ tin cậy cao",
  medium: "độ tin cậy vừa",
  low: "độ tin cậy thấp",
};

/** Bộ câu hỏi → text để dán vào Notion/giấy mang đi PV. */
function questionsToText(s: InterviewSession) {
  const lines: string[] = [s.title ?? `Vòng ${s.round}`, ""];
  for (const g of s.questions?.groups ?? []) {
    lines.push(`## ${g.topic}`);
    g.questions.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.q}`);
      if (q.why) lines.push(`   → vì sao hỏi: ${q.why}`);
      if (q.green_flag) lines.push(`   ✓ tốt: ${q.green_flag}`);
      if (q.red_flag) lines.push(`   ✗ lo: ${q.red_flag}`);
    });
    lines.push("");
  }
  return lines.join("\n");
}

function SessionCard({
  session,
  hrKey,
  onChange,
  onDelete,
}: {
  session: InterviewSession;
  hrKey: string;
  onChange: (s: InterviewSession) => void;
  onDelete: () => void;
}) {
  const [busy, setBusy] = useState<null | "questions" | "upload" | "analyze" | "save">(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState(session.transcript ?? "");
  const [showTranscript, setShowTranscript] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Phân tích xong server trả transcript đã gỡ băng — đồng bộ lại ô soạn thảo.
  // Set state trong lúc render (pattern "adjusting state on prop change" của React),
  // không dùng useEffect: effect sẽ gây thêm một vòng render thừa.
  const [syncedFrom, setSyncedFrom] = useState(session.transcript);
  if (session.transcript !== syncedFrom) {
    setSyncedFrom(session.transcript);
    setTranscript(session.transcript ?? "");
  }

  const call = useCallback(
    async (kind: "questions" | "analyze" | "save" | "upload", run: () => Promise<Response>) => {
      setBusy(kind);
      setError(null);
      try {
        const res = await run();
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        if (data.session) onChange(data.session);
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Thất bại");
        return null;
      } finally {
        setBusy(null);
      }
    },
    [onChange],
  );

  const genQuestions = () =>
    call("questions", () =>
      fetch(`/api/hr/interviews/${session.id}/questions`, {
        method: "POST",
        headers: { "x-hr-key": hrKey },
      }),
    );

  const analyze = () =>
    call("analyze", () =>
      fetch(`/api/hr/interviews/${session.id}/analyze`, {
        method: "POST",
        headers: { "x-hr-key": hrKey },
      }),
    );

  const saveTranscript = () =>
    call("save", () =>
      fetch(`/api/hr/interviews/${session.id}`, {
        method: "PATCH",
        headers: { "x-hr-key": hrKey, "content-type": "application/json" },
        body: JSON.stringify({ transcript }),
      }),
    );

  async function uploadAudio(file: File) {
    setBusy("upload");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/hr/upload/audio", {
        method: "POST",
        headers: { "x-hr-key": hrKey },
        body: fd,
      });
      const json = await up.json();
      if (!up.ok) throw new Error(json.error ?? "Upload thất bại");

      const res = await fetch(`/api/hr/interviews/${session.id}`, {
        method: "PATCH",
        headers: { "x-hr-key": hrKey, "content-type": "application/json" },
        body: JSON.stringify({
          audio_url: json.url,
          audio_key: json.key,
          audio_bytes: json.bytes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lưu ghi âm thất bại");
      onChange(data.session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload thất bại");
    } finally {
      setBusy(null);
    }
  }

  async function copyQuestions() {
    try {
      await navigator.clipboard.writeText(questionsToText(session));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Trình duyệt chặn clipboard");
    }
  }

  const ev = session.evaluation;
  const canAnalyze = Boolean(session.audio_url || transcript.trim());

  return (
    <div className={`${CARD} space-y-3`}>
      {/* Header vòng */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white/85">
            {session.title ?? `Vòng ${session.round}`}
          </span>
          {session.score != null && (
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${scoreColor(session.score)}`}
            >
              {session.score}
            </span>
          )}
        </div>
        <button onClick={onDelete} className={BTN_RED} disabled={busy !== null}>
          Xoá vòng
        </button>
      </div>

      {error && <p className={ERR}>{error}</p>}

      {/* ── Câu hỏi PV ── */}
      <div className="space-y-1.5 border-t border-white/8 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className={LABEL}>Câu hỏi phỏng vấn</span>
          <div className="flex gap-1.5">
            {session.questions && (
              <button onClick={copyQuestions} className={BTN_PLAIN} disabled={busy !== null}>
                {copied ? "✓ Đã copy" : "Copy"}
              </button>
            )}
            <button onClick={genQuestions} className={BTN_AMBER} disabled={busy !== null}>
              {busy === "questions"
                ? "Đang soạn…"
                : session.questions
                  ? "↻ Soạn lại"
                  : "🎯 Sinh câu hỏi"}
            </button>
          </div>
        </div>

        {session.questions?.groups.map((g) => (
          <div key={g.topic} className="space-y-1 pt-1">
            <p className="text-[11px] font-bold text-amber-300/90">{g.topic}</p>
            <ol className="space-y-1.5">
              {g.questions.map((q, i) => (
                <li key={i} className="text-[11px] leading-relaxed text-white/80">
                  <span className="text-white/40">{i + 1}.</span> {q.q}
                  {q.why && <p className="pl-4 text-[10px] italic text-white/40">→ {q.why}</p>}
                  {q.green_flag && (
                    <p className="pl-4 text-[10px] text-green-300/70">✓ {q.green_flag}</p>
                  )}
                  {q.red_flag && <p className="pl-4 text-[10px] text-red-300/70">✗ {q.red_flag}</p>}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {/* ── Ghi âm ── */}
      <div className="space-y-1.5 border-t border-white/8 pt-3">
        <span className={LABEL}>Ghi âm buổi PV</span>

        {session.audio_url ? (
          <audio controls src={session.audio_url} className="w-full" preload="none" />
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) uploadAudio(f);
            }}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/[0.03] px-4 py-3 transition-colors hover:border-amber-500/50 hover:bg-white/5"
          >
            <span className="text-[11px] text-white/45">
              {busy === "upload" ? "Đang tải lên…" : "Kéo thả hoặc bấm chọn mp3 / m4a / wav (≤100MB)"}
            </span>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,.m4a,.mp3,.wav,.ogg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadAudio(f);
            e.target.value = "";
          }}
        />

        <button
          onClick={() => setShowTranscript((v) => !v)}
          className="text-[10px] text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
        >
          {showTranscript ? "Ẩn transcript" : "Transcript"}
          {session.transcript ? ` (${session.transcript_source ?? "?"})` : " — chưa có, có thể dán tay"}
        </button>

        {showTranscript && (
          <div className="space-y-1.5">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={8}
              placeholder="Dán transcript buổi PV vào đây nếu không dùng gỡ băng tự động…"
              className={TEXTAREA}
            />
            {transcript !== (session.transcript ?? "") && (
              <button onClick={saveTranscript} className={BTN_PLAIN} disabled={busy !== null}>
                {busy === "save" ? "Đang lưu…" : "Lưu transcript"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Phân tích sau PV ── */}
      <div className="space-y-1.5 border-t border-white/8 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className={LABEL}>Phân tích sau phỏng vấn</span>
          <button onClick={analyze} className={BTN_AMBER} disabled={busy !== null || !canAnalyze}>
            {busy === "analyze"
              ? "Đang phân tích…"
              : ev
                ? "↻ Phân tích lại"
                : "🔍 Phân tích"}
          </button>
        </div>

        {!canAnalyze && (
          <p className="text-[10px] text-white/35">
            Cần file ghi âm hoặc transcript trước khi phân tích.
          </p>
        )}

        {ev && (
          <div className="space-y-1.5 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-sm font-bold ${scoreColor(ev.score)}`}
              >
                {ev.score}
              </span>
              <span className="text-xs font-bold text-white/85">
                {VERDICT_LABEL[ev.verdict] ?? ev.verdict}
              </span>
              <span
                className={`text-[10px] font-bold ${ev.fit_confirmed ? "text-green-400" : "text-red-400"}`}
              >
                {ev.fit_confirmed ? "✓ Phù hợp — đã xác nhận" : "✗ Chưa xác nhận phù hợp"}
              </span>
              <span className="text-[10px] text-white/35">
                {CONFIDENCE_LABEL[ev.confidence] ?? ev.confidence}
              </span>
            </div>

            {ev.prior_score != null && ev.prior_score !== ev.score && (
              <p className="text-[10px] text-white/45">
                Hồ sơ {ev.prior_score} → sau PV {ev.score}{" "}
                <span className={ev.score >= ev.prior_score ? "text-green-400" : "text-red-400"}>
                  ({ev.score >= ev.prior_score ? "+" : ""}
                  {ev.score - ev.prior_score})
                </span>
                {ev.score_delta_reason && ` — ${ev.score_delta_reason}`}
              </p>
            )}

            {ev.summary && <p className="text-[11px] leading-relaxed text-white/75">{ev.summary}</p>}

            {ev.evidence.length > 0 && (
              <ul className="space-y-0.5 text-[11px] text-green-300/80">
                {ev.evidence.map((s, i) => (
                  <li key={i}>+ {s}</li>
                ))}
              </ul>
            )}
            {ev.red_flags.length > 0 && (
              <ul className="space-y-0.5 text-[11px] text-red-300/80">
                {ev.red_flags.map((s, i) => (
                  <li key={i}>− {s}</li>
                ))}
              </ul>
            )}
            {ev.follow_ups.length > 0 && (
              <ul className="space-y-0.5 text-[11px] text-amber-300/70">
                {ev.follow_ups.map((s, i) => (
                  <li key={i}>→ {s}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterviewPanel({
  appId,
  hrKey,
}: {
  appId: string;
  hrKey: string;
}) {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/hr/applications/${appId}/interviews`, {
          headers: { "x-hr-key": hrKey },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        if (alive) setSessions(data.sessions);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Không tải được vòng PV");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [appId, hrKey]);

  async function addRound() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/hr/applications/${appId}/interviews`, {
        method: "POST",
        headers: { "x-hr-key": hrKey, "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSessions((prev) => [...prev, data.session]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được vòng PV");
    } finally {
      setCreating(false);
    }
  }

  async function removeRound(id: string) {
    if (!confirm("Xoá vòng PV này? Câu hỏi, transcript và đánh giá sẽ mất.")) return;
    const prev = sessions;
    setSessions((s) => s.filter((x) => x.id !== id)); // optimistic
    try {
      const res = await fetch(`/api/hr/interviews/${id}`, {
        method: "DELETE",
        headers: { "x-hr-key": hrKey },
      });
      if (!res.ok) throw new Error();
    } catch {
      setSessions(prev);
      setError("Xoá thất bại");
    }
  }

  return (
    <div className="space-y-2 border-t border-white/8 pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className={LABEL}>Phỏng vấn</span>
        <button onClick={addRound} className={BTN_PLAIN} disabled={creating}>
          {creating ? "Đang tạo…" : "+ Thêm vòng PV"}
        </button>
      </div>

      {error && <p className={ERR}>{error}</p>}
      {loading && <p className="text-[11px] text-white/35">Đang tải…</p>}

      {!loading && sessions.length === 0 && (
        <p className="text-[11px] text-white/35">
          Chưa có vòng PV nào. Bấm “+ Thêm vòng PV” để AI soạn câu hỏi dựa trên JD và CV.
        </p>
      )}

      {sessions.map((s) => (
        <SessionCard
          key={s.id}
          session={s}
          hrKey={hrKey}
          onChange={(next) => setSessions((prev) => prev.map((x) => (x.id === next.id ? next : x)))}
          onDelete={() => removeRound(s.id)}
        />
      ))}
    </div>
  );
}
