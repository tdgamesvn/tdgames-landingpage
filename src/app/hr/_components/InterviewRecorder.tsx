"use client";

/**
 * UI ghi âm PV trong app: thanh ghi, danh sách đoạn đã ghi, banner khôi phục bản trong máy.
 * Logic ghi: useInterviewRecorder.ts · lưu máy: recorder-store.ts · upload nền: recorder-queue.ts.
 */

import { useCallback, useEffect, useState } from "react";
import { Mic, Pause, Play, Square } from "lucide-react";
import type { InterviewSession } from "@/app/admin/_lib/types";
import { RECORD_TIMESLICE_MS, audioPiecesOf, formatClock, isOrphanPiece, segmentPlan, segmentsOf, type AudioPiece } from "@/lib/interview-audio";
import { flushPending, livePieceId, subscribeQueue, unsavedCount, type LocalPiece, type QueueState } from "./recorder-queue";
import { chunkCount, finishPiece, listPieces, removePiece, updatePiece, type StoredPiece } from "./recorder-store";
import {
  pauseRecording,
  resetRecorder,
  resumeRecording,
  stopRecording,
  useInterviewRecorder,
  useRecorderStatus,
} from "./useInterviewRecorder";

const BTN_REC =
  "inline-flex items-center gap-1 rounded border border-red-500/40 px-2.5 py-1 text-[11px] font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-40 transition-colors";
const BTN_PLAIN =
  "inline-flex items-center gap-1 rounded border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white/80 hover:bg-white/10 disabled:opacity-40 transition-colors";

export function RecordButton({ label = "Ghi âm", onClick, disabled }: { label?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={BTN_REC}>
      <Mic className="hr-ico" />
      {label}
    </button>
  );
}

/** Thanh ghi — hiện ở mục Phỏng vấn của đúng hồ sơ đang ghi. */
export function RecorderBar({ appId, sessions }: { appId: string; sessions: InterviewSession[] }) {
  const s = useInterviewRecorder();
  if (s.appId !== appId || s.status === "idle") return null;
  const round = sessions.find((x) => x.id === s.sessionId);
  const roundLabel = round ? (round.title ?? `Vòng ${round.round}`) : "Vòng PV";

  if (s.status === "denied") {
    return (
      <Notice onClose={resetRecorder} tone="red">
        Chưa được dùng micro. iPhone: Cài đặt › Safari (hoặc app /hr) › Micro → Cho phép, rồi mở lại app. Máy tính: bấm biểu
        tượng ổ khoá cạnh địa chỉ trang → Micro → Cho phép.
      </Notice>
    );
  }
  if (s.status === "unsupported") {
    return (
      <Notice onClose={resetRecorder} tone="red">
        Trình duyệt này không ghi âm được. Dùng Safari (iPhone) hoặc Chrome, bản mới.
      </Notice>
    );
  }
  if (s.status === "interrupted") {
    return (
      <Notice onClose={resetRecorder} tone="amber">
        Ghi âm {roundLabel} bị ngắt lúc {formatClock(s.interruptedAtMs ?? 0)} (khoá máy, chuyển app hoặc có cuộc gọi) — đã lưu
        phần trước. Bấm <b>Ghi tiếp</b> trong {roundLabel} để nối.
      </Notice>
    );
  }

  const recording = s.status === "recording";
  return (
    <div className="hr-group space-y-2 border border-red-500/30 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full bg-red-500 ${recording ? "animate-pulse" : "opacity-40"}`} />
        <span className="font-mono text-lg font-bold tabular-nums text-white">{formatClock(s.elapsedMs)}</span>
        <span className="text-[12px] text-white/55">
          {roundLabel} · Đoạn {s.segment}
          {s.status === "paused" && " · tạm dừng"}
          {s.status === "requesting" && " · đang mở micro…"}
          {s.status === "stopping" && " · đang lưu…"}
        </span>
        <div className="h-1.5 min-w-16 flex-1 overflow-hidden rounded bg-white/10">
          <div className="h-full bg-red-400 transition-[width] duration-200" style={{ width: `${Math.round(s.level * 100)}%` }} />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {recording && (
          <button onClick={pauseRecording} className={BTN_PLAIN}>
            <Pause className="hr-ico" />
            Tạm dừng
          </button>
        )}
        {s.status === "paused" && (
          <button onClick={resumeRecording} className={BTN_PLAIN}>
            <Play className="hr-ico" />
            Tiếp tục
          </button>
        )}
        <button onClick={() => void stopRecording()} disabled={!recording && s.status !== "paused"} className={BTN_REC}>
          <Square className="hr-ico" />
          Dừng & lưu
        </button>
      </div>
      {s.error && <p className="text-[11px] text-red-400">{s.error}</p>}
      <p className="text-[11px] text-white/45">
        Nhớ báo ứng viên là buổi PV được ghi âm. Đừng khoá màn hình hay chuyển app: iPhone sẽ ngắt ghi âm.
      </p>
    </div>
  );
}

function Notice({ children, onClose, tone }: { children: React.ReactNode; onClose: () => void; tone: "red" | "amber" }) {
  return (
    <div
      className={`hr-group flex items-start gap-2 px-4 py-3 text-[12px] ${tone === "red" ? "border border-red-500/30 text-red-200" : "border border-amber-500/30 text-amber-100"}`}
    >
      <p className="flex-1">{children}</p>
      <button onClick={onClose} className="text-white/40 hover:text-white/80" aria-label="Đóng">
        ×
      </button>
    </div>
  );
}

/** Phát lần lượt các mảnh của 1 đoạn trong 1 trình phát. */
function SegmentPlayer({ pieces }: { pieces: AudioPiece[] }) {
  const [idx, setIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const cur = pieces[Math.min(idx, pieces.length - 1)];
  return (
    <audio
      key={cur.key || cur.url}
      controls
      src={cur.url}
      className="w-full"
      preload="none"
      autoPlay={autoplay}
      onEnded={() => {
        if (idx < pieces.length - 1) {
          setAutoplay(true);
          setIdx(idx + 1);
        } else {
          setAutoplay(false);
          setIdx(0);
        }
      }}
    />
  );
}

export function SegmentList({ session }: { session: InterviewSession }) {
  const segs = segmentsOf(audioPiecesOf(session));
  if (segs.length === 1 && segs[0].duration_ms === 0) return <SegmentPlayer pieces={segs[0].pieces} />;
  return (
    <div className="space-y-1.5">
      {segs.map((g) => (
        <div key={g.segment} className="space-y-0.5">
          <p className="text-[11px] text-white/55">
            Đoạn {g.segment}
            {g.duration_ms > 0 && ` · ${formatClock(g.duration_ms)}`}
          </p>
          <SegmentPlayer pieces={g.pieces} />
        </div>
      ))}
    </div>
  );
}

/** Đoạn kế tiếp + mốc đồng hồ cho Ghi tiếp — gồm cả mảnh của vòng còn trong máy chưa lên server. */
export function planFor(session: InterviewSession, local: LocalPiece[]) {
  return segmentPlan(
    audioPiecesOf(session),
    local.filter((l) => l.sessionId === session.id),
  );
}

/** Trạng thái hàng đợi (mảnh trong máy chờ tải lên) cho component cần biết. */
export function useQueueState(): QueueState {
  const [q, setQ] = useState<QueueState>({ pending: 0, uploading: null, error: null, local: [] });
  useEffect(() => subscribeQueue(setQ), []);
  return q;
}

/** Trạng thái hàng đợi upload — "đang tải lên", lỗi + Thử lại. */
export function QueueStatus({ userKey }: { userKey: string }) {
  const [q, setQ] = useState<QueueState>({ pending: 0, uploading: null, error: null, local: [] });
  useEffect(() => subscribeQueue(setQ), []);
  if (q.error) {
    return (
      <p className="text-[11px] text-red-400">
        Chưa tải được ghi âm lên ({q.error}) — bản ghi vẫn nằm trong máy, tự thử lại sau.{" "}
        <button className="underline" onClick={() => void flushPending(userKey)}>
          Thử lại ngay
        </button>
      </p>
    );
  }
  if (q.uploading || q.pending > 0) {
    return <p className="text-[11px] text-white/50">Đang tải ghi âm lên… còn {Math.max(q.pending, 1)} phần</p>;
  }
  return null;
}

type Orphan = StoredPiece & { estMs: number };

/**
 * Bản ghi còn trong máy của hồ sơ này mà chưa lưu: app tắt giữa chừng ("recording" không phải mảnh đang
 * ghi) hoặc vòng PV gốc đã bị xoá ("needs_target"). HR chọn Lưu vào vòng PV / Bỏ.
 */
export function RecoveryBanner({
  userKey,
  appId,
  sessions,
  ensureTarget,
}: {
  userKey: string;
  appId: string;
  sessions: InterviewSession[];
  /** Vòng PV để gắn bản ghi khi vòng gốc không còn — mới nhất, chưa có thì tạo. */
  ensureTarget: () => Promise<InterviewSession | null>;
}) {
  const rec = useRecorderStatus();
  const [items, setItems] = useState<Orphan[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  // Đọc lại khi bộ ghi đổi trạng thái (vừa dừng / bị ngắt), danh sách vòng đổi, hoặc sau Lưu/Bỏ.
  useEffect(() => {
    let alive = true;
    (async () => {
      let next: Orphan[] = [];
      try {
        const all = await listPieces({ userId: userKey, appId });
        const live = livePieceId();
        const now = Date.now();
        const orphans = all.filter((p) => isOrphanPiece(p, live, now));
        next = await Promise.all(
          orphans.map(async (p) => ({ ...p, estMs: p.duration_ms ?? (await chunkCount(p.id)) * RECORD_TIMESLICE_MS })),
        );
      } catch {
        // không có IndexedDB (trình duyệt riêng tư…) — không có gì để khôi phục
      }
      if (alive) setItems(next);
    })();
    return () => {
      alive = false;
    };
  }, [userKey, appId, rec.status, sessions.length, version]);

  // Mảnh tab khác đang ghi mà tab đó chết → sau ~30s im mới thành mồ côi; xét lại định kỳ.
  useEffect(() => {
    const t = setInterval(() => setVersion((v) => v + 1), 15_000);
    return () => clearInterval(t);
  }, []);

  if (items.length === 0) return null;
  const recActive = rec.status === "requesting" || rec.status === "recording" || rec.status === "paused" || rec.status === "stopping";
  const totalMs = items.reduce((n, p) => n + p.estMs, 0);
  const when = new Date(items[0].startedAt).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });

  async function save() {
    setBusy(true);
    setError(null);
    try {
      let target: InterviewSession | null = null;
      for (const p of items) {
        const alive = p.state !== "needs_target" && sessions.some((s) => s.id === p.sessionId);
        if (alive) {
          await finishPiece(p.id, p.estMs);
          continue;
        }
        target ??= await ensureTarget();
        if (!target) throw new Error("Không có vòng PV để lưu vào");
        await updatePiece(p.id, {
          sessionId: target.id,
          segment: planFor(target, []).next,
          state: "pending",
          duration_ms: p.estMs,
        });
      }
      await flushPending(userKey);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function discard() {
    if (!confirm(`Bỏ bản ghi chưa lưu (${formatClock(totalMs)})? Xoá rồi không lấy lại được.`)) return;
    for (const p of items) await removePiece(p.id);
    reload();
  }

  return (
    <div className="hr-group space-y-1.5 border border-amber-500/30 px-4 py-3">
      <p className="text-[12px] text-amber-100">
        Có bản ghi âm chưa lưu trên máy này (~{formatClock(totalMs)}, lúc {when}).
      </p>
      <div className="flex gap-1.5">
        <button onClick={save} disabled={busy || recActive} className={BTN_REC}>
          {busy ? "Đang lưu…" : "Lưu vào vòng PV"}
        </button>
        <button onClick={discard} disabled={busy} className={BTN_PLAIN}>
          Bỏ
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Nút nhỏ ở thanh công cụ /hr: "N bản ghi chưa lưu" trên máy này (của người đang đăng nhập).
 * Mở /hr là đẩy luôn hàng đợi — bản ghi dừng lúc mất mạng tự lên khi có mạng.
 */
export function UnsavedRecordingsBadge({ userKey }: { userKey: string }) {
  const rec = useInterviewRecorder();
  const [q, setQ] = useState<QueueState>({ pending: 0, uploading: null, error: null, local: [] });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (userKey) void flushPending(userKey).catch(() => {});
  }, [userKey]);
  useEffect(() => subscribeQueue(setQ), []);
  useEffect(() => {
    let alive = true;
    if (userKey) {
      void unsavedCount(userKey)
        .then((n) => alive && setCount(n))
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [userKey, q.pending, q.uploading, rec.status]);

  const recActive = rec.status === "recording" || rec.status === "paused" || rec.status === "stopping";
  if (recActive) {
    // Luôn thấy đang ghi + dừng được, kể cả khi hồ sơ đang ghi đã đóng / lọc mất khỏi danh sách.
    return (
      <button
        onClick={() => void stopRecording()}
        disabled={rec.status === "stopping"}
        title="Đang ghi âm PV — bấm để dừng và lưu"
        className="hr-toolbar-btn whitespace-nowrap text-[12px] text-red-300"
      >
        <span className={`h-2 w-2 rounded-full bg-red-500 ${rec.status === "recording" ? "animate-pulse" : ""}`} />
        {formatClock(rec.elapsedMs)} · Dừng
      </button>
    );
  }
  if (count === 0) return null;
  return (
    <button
      onClick={() => void flushPending(userKey)}
      title="Bản ghi âm PV còn trong máy, chưa lên server. Bấm để tải lên; bản ghi dở (app tắt giữa chừng) mở hồ sơ ứng viên để Lưu/Bỏ."
      className="hr-toolbar-btn whitespace-nowrap text-[12px] text-amber-300"
    >
      <Mic className="hr-ico" />
      {count} bản ghi chưa lưu
    </button>
  );
}
