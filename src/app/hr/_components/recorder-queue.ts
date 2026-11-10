"use client";

/**
 * Hàng đợi upload mảnh ghi âm PV — singleton, sống ngoài modal hồ sơ (đóng modal giữa
 * chừng vẫn tải tiếp). Tuần tự theo thời điểm ghi: R2 (uploadAudioChunked) → gắn vào vòng
 * PV (POST audio-pieces) → xoá bản trong máy. Lỗi → giữ bản máy, thử lại khi có mạng /
 * 20s sau / mảnh kế tiếp / HR bấm.
 *
 * Nhiều tab /hr trên cùng máy: Web Locks khoá chung → chỉ 1 tab tải tại 1 thời điểm (không upload trùng).
 */

import type { InterviewSession } from "@/app/admin/_lib/types";
import { isOrphanPiece, recordingFileName } from "@/lib/interview-audio";
import { hrFetch } from "./HrSession";
import { listPieces, pieceBlob, removePiece, updatePiece, type StoredPiece } from "./recorder-store";
import { uploadAudioChunked } from "./upload-audio";

/** Mảnh còn trong máy chờ tải lên — UI tính đoạn kế tiếp / khoá Ghi lại theo vòng. */
export type LocalPiece = { sessionId: string; segment: number; duration_ms: number | null };
export type QueueState = { pending: number; uploading: string | null; error: string | null; local: LocalPiece[] };

const RETRY_MS = 20_000;
const POST_TIMEOUT_MS = 60_000;
const LOCK = "hr-recorder-queue";

let state: QueueState = { pending: 0, uploading: null, error: null, local: [] };
let running: Promise<void> | null = null;
let again = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let live: string | null = null;
let lastUser: string | null = null;
const listeners = new Set<(s: QueueState) => void>();
const sessionListeners = new Set<(s: InterviewSession) => void>();
/** Mảnh chỉ còn trong RAM (IndexedDB hỏng hẳn) — tải lên trước, không sống qua tải lại trang. */
const memPieces = new Map<string, { piece: StoredPiece; blob: Blob }>();

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

/** IndexedDB không lưu được mảnh → giữ trong RAM, tải lên ngay (mất nếu tắt app trước khi lên). */
export function enqueueMemoryPiece(piece: StoredPiece, blob: Blob) {
  memPieces.set(piece.id, { piece: { ...piece, state: "pending" }, blob });
}

async function sendOne(p: StoredPiece, memBlob?: Blob): Promise<"done" | "gone"> {
  let up = p.uploaded;
  if (!up) {
    const blob = memBlob ?? (await pieceBlob(p.id, p.mime));
    if (blob.size === 0) return "done"; // mảnh rỗng (dừng ngay khi vừa bấm) — bỏ
    const file = new File([blob], recordingFileName(p.mime, p.startedAt, p.segment), { type: p.mime });
    const out = await uploadAudioChunked(file, () => {});
    up = { key: out.key, url: out.url, bytes: out.bytes };
    if (memBlob) memPieces.set(p.id, { piece: { ...p, uploaded: up }, blob: memBlob });
    else await updatePiece(p.id, { uploaded: up });
  }
  const res = await hrFetch(`/api/hr/interviews/${p.sessionId}/audio-pieces`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...up, mime: p.mime, duration_ms: p.duration_ms, segment: p.segment }),
    signal: AbortSignal.timeout(POST_TIMEOUT_MS),
  });
  if (res.status === 404) return "gone";
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  if (data.session) for (const fn of sessionListeners) fn(data.session);
  return "done";
}

async function loop(userId: string) {
  for (;;) {
    // Đổi người (đăng xuất / người khác đăng nhập) → dừng, không tải bản của người cũ dưới phiên người mới.
    if (lastUser !== userId) return;
    const mem = [...memPieces.values()].filter((m) => m.piece.userId === userId);
    const stored = (await listPieces({ userId })).filter((p) => p.state === "pending" && p.id !== live);
    const pending = [...mem.map((m) => m.piece), ...stored];
    emit({
      pending: pending.length,
      local: pending.map((p) => ({ sessionId: p.sessionId, segment: p.segment, duration_ms: p.duration_ms })),
    });
    const p = pending[0];
    if (!p) return;
    emit({ uploading: p.id });
    const m = memPieces.get(p.id);
    const outcome = await sendOne(p, m?.blob);
    if (m) {
      memPieces.delete(p.id);
      if (outcome === "gone") console.warn("[recorder] vòng PV đã bị xoá, bản ghi chỉ còn trong RAM — bỏ", p.id);
    } else if (outcome === "gone") await updatePiece(p.id, { state: "needs_target" });
    else await removePiece(p.id);
    emit({ uploading: null, error: null });
  }
}

/** Khoá chung giữa các tab (Web Locks); trình duyệt cũ không có thì chạy thẳng. */
function withLock(fn: () => Promise<void>): Promise<void> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  return locks ? locks.request(LOCK, fn).then(() => {}) : fn();
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
        await withLock(() => loop(userId));
      } while (again && lastUser === userId);
    } catch (e) {
      emit({ uploading: null, error: e instanceof Error ? e.message : "Tải lên thất bại" });
      retryTimer = setTimeout(() => {
        if (lastUser === userId) void flushPending(userId);
      }, RETRY_MS);
    } finally {
      running = null;
    }
  })();
  return running;
}

/** Đăng xuất: quên người dùng — không để lần thử lại / sự kiện "online" tải bản của người cũ dưới phiên người sau. */
export function resetQueueUser() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  lastUser = null;
  emit({ pending: 0, uploading: null, error: null, local: [] });
}

/** Số bản trong máy chưa lưu của người này: chờ tải + mồ côi + mất vòng (không tính mảnh tab nào đó đang ghi). */
export async function unsavedCount(userId: string): Promise<number> {
  const now = Date.now();
  const stored = (await listPieces({ userId })).filter((p) => p.state === "pending" || isOrphanPiece(p, live, now));
  return stored.length + [...memPieces.values()].filter((m) => m.piece.userId === userId).length;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    if (lastUser) void flushPending(lastUser);
  });
}
