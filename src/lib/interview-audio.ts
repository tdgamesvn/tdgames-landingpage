/**
 * Ghi âm PV — luật dùng chung cho client (báo lỗi ngay khi chọn file, khỏi tải 100MB
 * lên rồi mới bị từ chối) và route /api/hr/upload/audio.
 */

export const AUDIO_MAX_BYTES = 100 * 1024 * 1024; // ~3 tiếng mp3 64kbps; nginx cho 120M

// m4a/mp3/wav/ogg + ghi màn hình Meet/Zoom (mp4/webm)
export const AUDIO_TYPE_RE = /^(audio\/|video\/(mp4|webm)$)/;

const MB = 1024 * 1024;

export function audioFileError(f: { size: number; type: string }): string | null {
  if (f.size > AUDIO_MAX_BYTES) {
    return `File ${(f.size / MB).toFixed(0)}MB vượt trần 100MB — xuất lại mp3/m4a bitrate thấp hơn (64–96kbps) rồi tải lên.`;
  }
  if (!AUDIO_TYPE_RE.test(f.type)) {
    return `Chỉ nhận file audio (mp3/m4a/wav/ogg) hoặc mp4/webm — file này là "${f.type || "không rõ"}"`;
  }
  return null;
}

export function formatProgress(loaded: number, total: number): string {
  if (!total) return "0%";
  const pct = Math.min(100, Math.round((loaded / total) * 100));
  return `${pct}% · ${(loaded / MB).toFixed(1)}/${(total / MB).toFixed(1)} MB`;
}

/** Upload chia phần (R2 multipart): mọi phần trừ phần cuối phải ≥ 5 MiB. */
export const AUDIO_PART_BYTES = 5 * 1024 * 1024;

export function planParts(size: number, partSize = AUDIO_PART_BYTES) {
  const parts: { partNumber: number; start: number; end: number }[] = [];
  for (let start = 0, n = 1; start < size; start += partSize, n++) {
    parts.push({ partNumber: n, start, end: Math.min(size, start + partSize) });
  }
  return parts;
}

/** Key do server sinh: interviews/YYYY/MM/<uuid>-<tên đã sanitize>. Chặn ghi đè file khác trên R2. */
export function isInterviewAudioKey(key: string): boolean {
  return /^interviews\/\d{4}\/\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[a-z0-9._-]+$/.test(key) && !key.includes("..");
}

// ── Ghi âm trong app: 1 vòng PV = nhiều mảnh, gom theo đoạn ────────────────
// Recorder tự chốt file mỗi RECORD_PIECE_MS (upload nền, crash chỉ mất phần dở của mảnh cuối).
// Đoạn = giữa 2 lần bị ngắt / bấm Dừng — thứ HR nhìn thấy. Mảnh là chi tiết nội bộ.

export const RECORD_PIECE_MS = 5 * 60_000;
export const RECORD_TIMESLICE_MS = 5_000;
export const RECORD_BITRATE = 48_000;

export type AudioPiece = {
  segment: number;
  key: string;
  url: string;
  bytes: number;
  mime: string;
  duration_ms: number | null;
  created_at: string;
};

export type AudioRow = {
  audio_url?: string | null;
  audio_key?: string | null;
  audio_bytes?: number | null;
  audio_pieces?: AudioPiece[] | null;
};

/** Danh sách mảnh của vòng PV. Vòng cũ (chỉ có audio_url, upload tay) = 1 mảnh đoạn 1. */
export function audioPiecesOf(row: AudioRow): AudioPiece[] {
  if (row.audio_pieces && row.audio_pieces.length > 0) return row.audio_pieces;
  if (!row.audio_url) return [];
  return [
    {
      segment: 1,
      key: row.audio_key ?? "",
      url: row.audio_url,
      bytes: row.audio_bytes ?? 0,
      mime: "",
      duration_ms: null,
      created_at: "",
    },
  ];
}

/** Mọi key R2 của vòng (legacy + mảnh) — để dọn khi Ghi lại / thay file / xoá vòng. */
export function allAudioKeys(row: AudioRow): string[] {
  const keys = [row.audio_key, ...(row.audio_pieces ?? []).map((p) => p.key)];
  return [...new Set(keys.filter((k): k is string => typeof k === "string" && isInterviewAudioKey(k)))];
}

export function nextSegment(pieces: AudioPiece[]): number {
  return pieces.reduce((m, p) => Math.max(m, p.segment), 0) + 1;
}

export function segmentsOf(pieces: AudioPiece[]): { segment: number; pieces: AudioPiece[]; duration_ms: number }[] {
  const sorted = [...pieces].sort((a, b) => a.segment - b.segment || a.created_at.localeCompare(b.created_at));
  const out: { segment: number; pieces: AudioPiece[]; duration_ms: number }[] = [];
  for (const p of sorted) {
    let seg = out.at(-1);
    if (!seg || seg.segment !== p.segment) out.push((seg = { segment: p.segment, pieces: [], duration_ms: 0 }));
    seg.pieces.push(p);
    seg.duration_ms += p.duration_ms ?? 0;
  }
  return out;
}

type PieceUpdate = {
  audio_pieces: AudioPiece[];
  audio_url: null;
  audio_key: null;
  audio_bytes: null;
  transcript?: null;
  transcript_source?: null;
};

/**
 * Gắn 1 mảnh vào vòng. Key đã có → duplicate (client upload lại sau timeout).
 * Transcript máy gỡ không còn đủ → xoá để lần Phân tích sau gỡ lại; transcript dán tay giữ.
 */
export function appendPiece(
  row: AudioRow & { transcript_source?: string | null },
  piece: AudioPiece,
): { duplicate: true } | { duplicate: false; update: PieceUpdate } {
  const current = audioPiecesOf(row);
  if (current.some((p) => p.key === piece.key)) return { duplicate: true };
  const update: PieceUpdate = {
    audio_pieces: [...current, piece],
    audio_url: null,
    audio_key: null,
    audio_bytes: null,
  };
  if (row.transcript_source === "gemini" || row.transcript_source === "whisper") {
    update.transcript = null;
    update.transcript_source = null;
  }
  return { duplicate: false, update };
}
