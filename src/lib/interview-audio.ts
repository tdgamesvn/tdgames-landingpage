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
