"use client";

/**
 * Hàng đợi upload mảnh ghi âm PV — singleton, sống ngoài modal hồ sơ (đóng modal giữa
 * chừng vẫn tải tiếp). Tuần tự theo thời điểm ghi: R2 (uploadAudioChunked) → gắn vào vòng
 * PV (POST audio-pieces) → xoá bản trong máy. Lỗi → giữ bản máy, thử lại khi có mạng /
 * 20s sau / mảnh kế tiếp / HR bấm.
 */

import type { InterviewSession } from "@/app/admin/_lib/types";
import { recordingFileName } from "@/lib/interview-audio";
import { hrFetch } from "./HrSession";
import { listPieces, pieceBlob, removePiece, updatePiece, type StoredPiece } from "./recorder-store";
import { uploadAudioChunked } from "./upload-audio";

export type QueueState = { pending: number; uploading: string | null; error: string | null };

const RETRY_MS = 20_000;

let state: QueueState = { pending: 0, uploading: null, error: null };
let running: Promise<void> | null = null;
let again = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let live: string | null = null;
let lastUser: string | null = null;
const listeners = new Set<(s: QueueState) => void>();
const sessionListeners = new Set<(s: InterviewSession) => void>();

function emit(patch: Partial<QueueState>) {
  state = { ...state, ...patch };
  for (const fn of listeners) fn(state);
}

export function subscribeQueue(fn: (s: QueueState) => void): () => void {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

/** Vòng PV vừa được gắn thêm mảnh — InterviewPanel cập nhật thẻ không cần tải lại. */
export function subscribeSessions(fn: (s: InterviewSession) => void): () => void {
  sessionListeners.add(fn);
  return () => sessionListeners.delete(fn);
}

/** Mảnh recorder đang ghi — queue không đụng, banner khôi phục không coi là mồ côi. */
export function markLive(pieceId: string | null) {
  live = pieceId;
}

export function livePieceId() {
  return live;
}

async function sendOne(p: StoredPiece): Promise<"done" | "gone"> {
  let up = p.uploaded;
  if (!up) {
    const blob = await pieceBlob(p.id, p.mime);
    if (blob.size === 0) return "done"; // mảnh rỗng (dừng ngay khi vừa bấm) — bỏ
    const file = new File([blob], recordingFileName(p.mime, p.startedAt, p.segment), { type: p.mime });
    const out = await uploadAudioChunked(file, () => {});
    up = { key: out.key, url: out.url, bytes: out.bytes };
    await updatePiece(p.id, { uploaded: up });
  }
  const res = await hrFetch(`/api/hr/interviews/${p.sessionId}/audio-pieces`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...up, mime: p.mime, duration_ms: p.duration_ms, segment: p.segment }),
  });
  if (res.status === 404) return "gone";
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  if (data.session) for (const fn of sessionListeners) fn(data.session);
  return "done";
}

async function loop(userId: string) {
  for (;;) {
    const pending = (await listPieces({ userId })).filter((p) => p.state === "pending" && p.id !== live);
    emit({ pending: pending.length });
    const p = pending[0];
    if (!p) return;
    emit({ uploading: p.id });
    const outcome = await sendOne(p);
    if (outcome === "gone") await updatePiece(p.id, { state: "needs_target" });
    else await removePiece(p.id);
    emit({ uploading: null, error: null });
  }
}

/** Tải các mảnh đã chốt của người này lên. Gọi nhiều lần cùng lúc → chạy 1 vòng, xong chạy bù. */
export function flushPending(userId: string): Promise<void> {
  lastUser = userId;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        await loop(userId);
      } while (again);
    } catch (e) {
      emit({ uploading: null, error: e instanceof Error ? e.message : "Tải lên thất bại" });
      retryTimer = setTimeout(() => void flushPending(userId), RETRY_MS);
    } finally {
      running = null;
    }
  })();
  return running;
}

/** Số bản trong máy chưa lưu của người này (mảnh chờ + mồ côi + mất vòng), trừ mảnh đang ghi. */
export async function unsavedCount(userId: string): Promise<number> {
  return (await listPieces({ userId })).filter((p) => p.id !== live).length;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    if (lastUser) void flushPending(lastUser);
  });
}
