"use client";

/**
 * Ghi âm PV ngay trong app /hr — 1 bộ ghi duy nhất cho cả trang (module singleton) để modal hồ sơ,
 * nút Đăng xuất… đều biết đang ghi và dừng được.
 *
 * - MediaRecorder chốt file mỗi RECORD_PIECE_MS (thời gian ghi thật, không tính lúc tạm dừng) → mảnh
 *   upload nền (recorder-queue); chunk RECORD_TIMESLICE_MS ghi xuống IndexedDB (recorder-store).
 * - Mic bị hệ thống lấy (khoá máy / cuộc gọi đến / chuyển app iOS) → chốt đoạn, trạng thái "interrupted"
 *   để HR bấm Ghi tiếp; không chạy đồng hồ trên khoảng im lặng.
 * - Giữ màn hình sáng (Wake Lock) trong lúc ghi.
 */

import { useSyncExternalStore } from "react";
import {
  RECORD_BITRATE,
  RECORD_PIECE_MS,
  RECORD_TIMESLICE_MS,
  pickRecorderMime,
  shouldTreatAsInterrupted,
} from "@/lib/interview-audio";
import { flushPending, markLive } from "./recorder-queue";
import { appendChunk, finishPiece, startPiece } from "./recorder-store";

export type RecorderStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "paused"
  | "stopping"
  | "interrupted"
  | "denied"
  | "unsupported";

export type RecorderState = {
  status: RecorderStatus;
  appId: string | null;
  sessionId: string | null;
  segment: number | null;
  /** Tổng thời lượng: các đoạn đã có của vòng + đoạn đang ghi. */
  elapsedMs: number;
  /** Mức âm 0..1 — để HR thấy mic đang thu. */
  level: number;
  interruptedAtMs: number | null;
  error: string | null;
};

const IDLE: RecorderState = {
  status: "idle",
  appId: null,
  sessionId: null,
  segment: null,
  elapsedMs: 0,
  level: 0,
  interruptedAtMs: null,
  error: null,
};

let snap: RecorderState = IDLE;
const listeners = new Set<() => void>();

function emit(patch: Partial<RecorderState>) {
  snap = { ...snap, ...patch };
  for (const fn of listeners) fn();
}

// ── Phiên ghi hiện tại ───────────────────────────────────────────────────────

type Run = {
  userId: string;
  appId: string;
  sessionId: string;
  segment: number;
  baseMs: number;
  mime: string;
  stream: MediaStream;
  track: MediaStreamTrack;
  audioCtx: AudioContext | null;
  analyser: AnalyserNode | null;
  wakeLock: WakeLockSentinel | null;
  recorder: MediaRecorder | null;
  pieceId: string;
  chunkIdx: number;
  writes: Promise<void>;
  pieceActiveStart: number;
  /** Thời gian ghi thật đã cộng dồn (không tính lúc tạm dừng) + mốc bắt đầu chặng đang chạy. */
  activeAccum: number;
  runningSince: number | null;
  mutedSince: number | null;
  recorderError: boolean;
  rotating: boolean;
  timer: ReturnType<typeof setInterval> | null;
};

let run: Run | null = null;

const activeMs = (r: Run) => r.activeAccum + (r.runningSince === null ? 0 : performance.now() - r.runningSince);

async function openPiece(r: Run) {
  r.pieceId = crypto.randomUUID();
  r.chunkIdx = 0;
  r.recorderError = false;
  await startPiece({
    id: r.pieceId,
    userId: r.userId,
    appId: r.appId,
    sessionId: r.sessionId,
    segment: r.segment,
    mime: r.mime,
    startedAt: Date.now(),
  });
  markLive(r.pieceId);
  const rec = new MediaRecorder(r.stream, { mimeType: r.mime, audioBitsPerSecond: RECORD_BITRATE });
  const pieceId = r.pieceId;
  rec.ondataavailable = (e) => {
    if (!e.data.size) return;
    const idx = r.chunkIdx++;
    // Nối chuỗi để chunk xuống IndexedDB đúng thứ tự.
    r.writes = r.writes.then(() => appendChunk(pieceId, idx, e.data)).catch((err) => {
      console.error("[recorder] lưu chunk thất bại", err);
      emit({ error: "Bộ nhớ máy không lưu được phần ghi âm (có thể đầy) — đừng tắt app trước khi tải lên xong." });
    });
  };
  rec.onerror = () => {
    r.recorderError = true;
  };
  r.recorder = rec;
  r.pieceActiveStart = activeMs(r);
  rec.start(RECORD_TIMESLICE_MS);
}

/** Chốt mảnh hiện tại: lấy nốt dữ liệu, đánh dấu chờ upload, đẩy hàng đợi. */
async function closePiece(r: Run) {
  const rec = r.recorder;
  r.recorder = null;
  if (rec && rec.state !== "inactive") {
    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      try {
        rec.stop();
      } catch {
        resolve();
      }
    });
  }
  await r.writes;
  await finishPiece(r.pieceId, Math.round(activeMs(r) - r.pieceActiveStart));
  markLive(null);
  void flushPending(r.userId);
}

async function acquireWakeLock(r: Run) {
  try {
    if (document.visibilityState === "visible" && "wakeLock" in navigator) {
      r.wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch {
    r.wakeLock = null; // không có / bị từ chối — UI vẫn nhắc đừng khoá màn hình
  }
}

function teardown(r: Run) {
  if (r.timer) clearInterval(r.timer);
  r.stream.getTracks().forEach((t) => t.stop());
  void r.audioCtx?.close().catch(() => {});
  void r.wakeLock?.release().catch(() => {});
  document.removeEventListener("visibilitychange", onVisibility);
  window.removeEventListener("beforeunload", onBeforeUnload);
  run = null;
}

function onBeforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
}

function onVisibility() {
  const r = run;
  if (!r || document.visibilityState !== "visible") return;
  // iOS: chuyển app / khoá máy → recorder chết hoặc mic câm; quay lại thì chốt đoạn.
  if (r.track.readyState === "ended" || (r.recorder && r.recorder.state === "inactive" && !r.rotating)) {
    void interrupt();
    return;
  }
  if (!r.wakeLock || r.wakeLock.released) void acquireWakeLock(r);
}

function tick() {
  const r = run;
  if (!r) return;
  const now = performance.now();
  if (
    (snap.status === "recording" || snap.status === "paused") &&
    shouldTreatAsInterrupted({
      trackEnded: r.track.readyState === "ended",
      mutedForMs: r.mutedSince === null ? 0 : now - r.mutedSince,
      recorderError: r.recorderError,
    })
  ) {
    void interrupt();
    return;
  }
  let level = 0;
  if (r.analyser && snap.status === "recording") {
    const buf = new Uint8Array(r.analyser.fftSize);
    r.analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += ((v - 128) / 128) ** 2;
    level = Math.min(1, Math.sqrt(sum / buf.length) * 3);
  }
  emit({ elapsedMs: r.baseMs + activeMs(r), level });

  if (snap.status === "recording" && !r.rotating && activeMs(r) - r.pieceActiveStart >= RECORD_PIECE_MS) {
    r.rotating = true;
    void (async () => {
      try {
        await closePiece(r);
        if (run === r && snap.status === "recording") await openPiece(r);
      } catch (e) {
        console.error("[recorder] đổi mảnh thất bại", e);
        r.recorderError = true;
      } finally {
        r.rotating = false;
      }
    })();
  }
}

// ── API ──────────────────────────────────────────────────────────────────────

export async function startRecording(opts: {
  userId: string;
  appId: string;
  sessionId: string;
  segment: number;
  baseMs: number;
}): Promise<void> {
  if (run) throw new Error("Đang ghi âm một buổi khác — dừng trước đã.");
  const base = { ...IDLE, appId: opts.appId, sessionId: opts.sessionId, segment: opts.segment, elapsedMs: opts.baseMs };

  if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    emit({ ...base, status: "unsupported" });
    return;
  }
  const mime = pickRecorderMime((m) => MediaRecorder.isTypeSupported(m));
  if (!mime) {
    emit({ ...base, status: "unsupported" });
    return;
  }

  // AudioContext tạo ngay trong cú bấm (iOS chặn nếu tạo sau await).
  let audioCtx: AudioContext | null = null;
  try {
    audioCtx = new AudioContext();
  } catch {
    audioCtx = null;
  }

  emit({ ...base, status: "requesting" });
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
    });
  } catch (e) {
    void audioCtx?.close().catch(() => {});
    const name = e instanceof DOMException ? e.name : "";
    if (name === "NotAllowedError" || name === "SecurityError") emit({ status: "denied" });
    else emit({ status: "idle", error: `Không mở được micro: ${e instanceof Error ? e.message : String(e)}` });
    return;
  }

  const track = stream.getAudioTracks()[0];
  let analyser: AnalyserNode | null = null;
  try {
    if (audioCtx) {
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      void audioCtx.resume().catch(() => {});
    }
  } catch {
    analyser = null; // vạch mức âm chỉ là phụ
  }

  const r: Run = {
    ...opts,
    mime,
    stream,
    track,
    audioCtx,
    analyser,
    wakeLock: null,
    recorder: null,
    pieceId: "",
    chunkIdx: 0,
    writes: Promise.resolve(),
    pieceActiveStart: 0,
    activeAccum: 0,
    runningSince: performance.now(),
    mutedSince: null,
    recorderError: false,
    rotating: false,
    timer: null,
  };
  run = r;
  track.onended = () => void interrupt();
  track.onmute = () => {
    r.mutedSince ??= performance.now();
  };
  track.onunmute = () => {
    r.mutedSince = null;
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("beforeunload", onBeforeUnload);

  try {
    await openPiece(r);
  } catch (e) {
    teardown(r);
    emit({ status: "idle", error: `Không bắt đầu ghi được: ${e instanceof Error ? e.message : String(e)}` });
    return;
  }
  await acquireWakeLock(r);
  r.timer = setInterval(tick, 250);
  emit({ status: "recording" });
}

export function pauseRecording() {
  const r = run;
  if (!r || snap.status !== "recording" || r.rotating) return;
  r.recorder?.pause();
  r.activeAccum = activeMs(r);
  r.runningSince = null;
  emit({ status: "paused", level: 0 });
}

export function resumeRecording() {
  const r = run;
  if (!r || snap.status !== "paused") return;
  r.recorder?.resume();
  r.runningSince = performance.now();
  emit({ status: "recording" });
}

async function finish(next: Partial<RecorderState>) {
  const r = run;
  if (!r || (snap.status !== "recording" && snap.status !== "paused")) return;
  r.activeAccum = activeMs(r);
  r.runningSince = null;
  emit({ status: "stopping", level: 0, elapsedMs: r.baseMs + r.activeAccum });
  if (r.timer) clearInterval(r.timer);
  r.timer = null;
  // Đang đổi mảnh dở → đợi xong rồi mới chốt mảnh mới.
  while (r.rotating) await new Promise((res) => setTimeout(res, 50));
  try {
    await closePiece(r);
  } catch (e) {
    console.error("[recorder] chốt mảnh thất bại", e);
  }
  teardown(r);
  emit(next);
}

export function stopRecording(): Promise<void> {
  return finish({ ...IDLE });
}

function interrupt(): Promise<void> {
  const r = run;
  const at = r ? r.baseMs + activeMs(r) : 0;
  return finish({ status: "interrupted", interruptedAtMs: at, level: 0 });
}

/** Bỏ thông báo "bị ngắt" / "bị từ chối" / lỗi → về nghỉ. */
export function resetRecorder() {
  if (run) return;
  emit({ ...IDLE });
}

export function isRecordingActive(): boolean {
  return run !== null;
}

export function stopActiveRecording(): Promise<void> {
  return stopRecording();
}

export function useInterviewRecorder(): RecorderState {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => snap,
    () => IDLE,
  );
}
