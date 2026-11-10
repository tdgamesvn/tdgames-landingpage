"use client";

/**
 * Bản dự phòng ghi âm PV trong máy (IndexedDB `hr-recorder`).
 * Recorder lưu chunk mỗi 5s → app crash / đóng tab / mất mạng vẫn còn bản ghi.
 * Chỉ xoá sau khi server xác nhận đã gắn mảnh vào vòng PV (recorder-queue).
 *
 * state:
 *  - "recording": đang ghi (hoặc app chết giữa chừng → mồ côi, chờ HR bấm Lưu/Bỏ)
 *  - "pending":   mảnh đã chốt, chờ upload
 *  - "needs_target": vòng PV gốc đã bị xoá — HR chọn Lưu vào vòng khác / Bỏ
 */

export type StoredPiece = {
  id: string;
  userId: string;
  appId: string;
  sessionId: string;
  segment: number;
  mime: string;
  startedAt: number;
  duration_ms: number | null;
  state: "recording" | "pending" | "needs_target";
  /** Lần cuối ghi chunk — tab khác đang ghi thì mới đây, mảnh mồ côi (app chết) thì im lâu. */
  lastChunkAt?: number;
  /** Đã lên R2 nhưng chưa gắn vào vòng PV — gửi lại không upload lần nữa. */
  uploaded?: { key: string; url: string; bytes: number };
};

const DB = "hr-recorder";
const PIECES = "pieces";
const CHUNKS = "chunks";

let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      d.createObjectStore(PIECES, { keyPath: "id" });
      d.createObjectStore(CHUNKS); // key [pieceId, idx]
    };
    req.onsuccess = () => {
      const d = req.result;
      // WebKit hay mất kết nối IndexedDB sau khi app chạy nền → lần sau mở lại, đừng giữ kết nối chết.
      d.onclose = () => {
        dbPromise = null;
      };
      d.onversionchange = () => {
        d.close();
        dbPromise = null;
      };
      resolve(d);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error("Không mở được bộ nhớ máy (IndexedDB)"));
    };
  });
  return dbPromise;
}

async function run<T>(
  stores: string[],
  mode: IDBTransactionMode,
  fn: (tx: IDBTransaction) => IDBRequest<T> | void,
): Promise<T | undefined> {
  try {
    return await runOnce(stores, mode, fn);
  } catch {
    // Kết nối hỏng (InvalidStateError / "Connection to Indexed Database server lost") → mở lại, thử 1 lần.
    dbPromise = null;
    return runOnce(stores, mode, fn);
  }
}

async function runOnce<T>(
  stores: string[],
  mode: IDBTransactionMode,
  fn: (tx: IDBTransaction) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const tx = (await db()).transaction(stores, mode);
  const req = fn(tx);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(req ? req.result : undefined);
    tx.onerror = () => reject(tx.error ?? new Error("Lỗi bộ nhớ máy"));
    tx.onabort = () => reject(tx.error ?? new Error("Bộ nhớ máy huỷ ghi (có thể đầy)"));
  });
}

const chunkRange = (pieceId: string) => IDBKeyRange.bound([pieceId, 0], [pieceId, Infinity]);

export async function startPiece(meta: Omit<StoredPiece, "state" | "duration_ms">): Promise<void> {
  await run([PIECES], "readwrite", (tx) => {
    tx.objectStore(PIECES).put({ ...meta, state: "recording", duration_ms: null } satisfies StoredPiece);
  });
}

export async function appendChunk(pieceId: string, idx: number, blob: Blob): Promise<void> {
  await run([PIECES, CHUNKS], "readwrite", (tx) => {
    tx.objectStore(CHUNKS).put(blob, [pieceId, idx]);
    const pieces = tx.objectStore(PIECES);
    const get = pieces.get(pieceId);
    get.onsuccess = () => {
      if (get.result) pieces.put({ ...get.result, lastChunkAt: Date.now() });
    };
  });
}

/** Ghi lại toàn bộ chunk của mảnh (bản trong RAM) — khi lưu từng chunk từng hỏng giữa chừng. */
export async function rewriteChunks(pieceId: string, blobs: Blob[]): Promise<void> {
  await run([CHUNKS], "readwrite", (tx) => {
    const store = tx.objectStore(CHUNKS);
    store.delete(chunkRange(pieceId));
    blobs.forEach((b, i) => store.put(b, [pieceId, i]));
  });
}

export async function updatePiece(pieceId: string, patch: Partial<Omit<StoredPiece, "id">>): Promise<void> {
  await run([PIECES], "readwrite", (tx) => {
    const store = tx.objectStore(PIECES);
    const get = store.get(pieceId);
    get.onsuccess = () => {
      if (get.result) store.put({ ...get.result, ...patch });
    };
  });
}

export async function finishPiece(pieceId: string, duration_ms: number | null): Promise<void> {
  await updatePiece(pieceId, { state: "pending", duration_ms });
}

export async function listPieces(filter: { userId?: string; appId?: string } = {}): Promise<StoredPiece[]> {
  const all = ((await run([PIECES], "readonly", (tx) => tx.objectStore(PIECES).getAll())) ?? []) as StoredPiece[];
  return all
    .filter((p) => (!filter.userId || p.userId === filter.userId) && (!filter.appId || p.appId === filter.appId))
    .sort((a, b) => a.startedAt - b.startedAt);
}

/** Ghép chunk theo thứ tự — chunk của 1 lần MediaRecorder nối lại là 1 file. */
export async function pieceBlob(pieceId: string, mime: string): Promise<Blob> {
  const chunks = ((await run([CHUNKS], "readonly", (tx) => tx.objectStore(CHUNKS).getAll(chunkRange(pieceId)))) ??
    []) as Blob[];
  return new Blob(chunks, { type: mime });
}

export async function chunkCount(pieceId: string): Promise<number> {
  return (await run([CHUNKS], "readonly", (tx) => tx.objectStore(CHUNKS).count(chunkRange(pieceId)))) ?? 0;
}

export async function removePiece(pieceId: string): Promise<void> {
  await run([PIECES, CHUNKS], "readwrite", (tx) => {
    tx.objectStore(PIECES).delete(pieceId);
    tx.objectStore(CHUNKS).delete(chunkRange(pieceId));
  });
}
