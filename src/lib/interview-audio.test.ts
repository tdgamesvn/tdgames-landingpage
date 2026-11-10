// node --test src/lib/interview-audio.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AUDIO_MAX_BYTES,
  allAudioKeys,
  appendPiece,
  audioFileError,
  audioPiecesOf,
  formatProgress,
  geminiAudioMime,
  isInterviewAudioKey,
  nextSegment,
  parsePieceInput,
  planParts,
  recordingFileName,
  segmentsOf,
  type AudioPiece,
} from "./interview-audio.ts";

const MB = 1024 * 1024;

test("file audio hợp lệ → không lỗi", () => {
  assert.equal(audioFileError({ size: 40 * MB, type: "audio/mpeg" }), null);
  assert.equal(audioFileError({ size: 40 * MB, type: "audio/x-m4a" }), null);
  assert.equal(audioFileError({ size: 40 * MB, type: "video/mp4" }), null);
  assert.equal(audioFileError({ size: AUDIO_MAX_BYTES, type: "audio/wav" }), null);
});

test("quá 100MB → báo ngay, nêu dung lượng", () => {
  const e = audioFileError({ size: 180 * MB, type: "audio/mpeg" });
  assert.ok(e && e.includes("180") && e.includes("100MB"), e ?? "");
});

test("không phải audio → báo ngay", () => {
  assert.ok(audioFileError({ size: MB, type: "video/quicktime" }));
  assert.ok(audioFileError({ size: MB, type: "" }));
  assert.ok(audioFileError({ size: MB, type: "application/pdf" }));
});

test("formatProgress", () => {
  assert.equal(formatProgress(20 * MB, 40 * MB), "50% · 20.0/40.0 MB");
  assert.equal(formatProgress(0, 0), "0%");
});

test("planParts: chia 5MB/phần, phần cuối nhận phần dư", () => {
  const parts = planParts(47.4 * MB, 5 * MB);
  assert.equal(parts.length, 10);
  assert.deepEqual(parts[0], { partNumber: 1, start: 0, end: 5 * MB });
  assert.equal(parts.at(-1)!.end, 47.4 * MB);
  // liền mạch, không chồng/không hở
  for (let i = 1; i < parts.length; i++) assert.equal(parts[i].start, parts[i - 1].end);
  assert.deepEqual(planParts(3 * MB, 5 * MB), [{ partNumber: 1, start: 0, end: 3 * MB }]);
  assert.deepEqual(planParts(0, 5 * MB), []);
});

test("isInterviewAudioKey chỉ nhận key do server tạo trong interviews/", () => {
  assert.equal(isInterviewAudioKey("interviews/2026/10/0ed0b1c2-1111-4222-8333-444455556666-pv.m4a"), true);
  for (const bad of ["cv/a.pdf", "interviews/../cv/a.pdf", "interviews/2026/10/x.m4a", "/interviews/2026/10/a", "", "interviews/2026/10/0ed0b1c2-1111-4222-8333-444455556666-a/../b"]) {
    assert.equal(isInterviewAudioKey(bad), false, bad);
  }
});

// ── Ghi âm trong app: nhiều mảnh / nhiều đoạn ───────────────────────────────

const K = (n: number) => `interviews/2026/11/0ed0b1c2-1111-4222-8333-44445555666${n}-rec.m4a`;
const U = (n: number) => `https://cdn.tdgamestudio.com/${K(n)}`;
const piece = (n: number, segment: number, duration_ms: number | null = 1000, at = `2026-11-10T10:0${n}:00Z`): AudioPiece => ({
  segment, key: K(n), url: U(n), bytes: 100 * n, mime: "audio/mp4", duration_ms, created_at: at,
});

test("audioPiecesOf: vòng cũ chỉ có audio_url → 1 mảnh đoạn 1", () => {
  const out = audioPiecesOf({ audio_url: U(0), audio_key: K(0), audio_bytes: 500 });
  assert.equal(out.length, 1);
  assert.deepEqual(
    { segment: out[0].segment, key: out[0].key, url: out[0].url, bytes: out[0].bytes, duration_ms: out[0].duration_ms },
    { segment: 1, key: K(0), url: U(0), bytes: 500, duration_ms: null },
  );
});

test("audioPiecesOf: có audio_pieces → dùng pieces, bỏ qua legacy", () => {
  const pieces = [piece(1, 1), piece(2, 2)];
  assert.deepEqual(audioPiecesOf({ audio_url: U(0), audio_key: K(0), audio_pieces: pieces }), pieces);
});

test("audioPiecesOf: không có gì → []", () => {
  assert.deepEqual(audioPiecesOf({}), []);
  assert.deepEqual(audioPiecesOf({ audio_url: null, audio_key: null, audio_pieces: [] }), []);
});

test("appendPiece: vòng cũ (legacy) → legacy thành đoạn 1, mảnh mới nối sau, cột cũ về null", () => {
  const r = appendPiece({ audio_url: U(0), audio_key: K(0), audio_bytes: 500 }, piece(1, 2));
  assert.equal(r.duplicate, false);
  if (r.duplicate) return;
  assert.deepEqual(r.update.audio_pieces.map((p) => [p.segment, p.key]), [[1, K(0)], [2, K(1)]]);
  assert.equal(r.update.audio_url, null);
  assert.equal(r.update.audio_key, null);
  assert.equal(r.update.audio_bytes, null);
});

test("appendPiece: key đã có trong vòng → duplicate (upload thử lại không gắn 2 lần)", () => {
  assert.deepEqual(appendPiece({ audio_pieces: [piece(1, 1)] }, piece(1, 1)), { duplicate: true });
  assert.deepEqual(appendPiece({ audio_url: U(0), audio_key: K(0) }, { ...piece(1, 1), key: K(0), url: U(0) }), { duplicate: true });
});

test("appendPiece: transcript máy gỡ bị xoá, transcript dán tay giữ nguyên", () => {
  for (const src of ["gemini", "whisper"]) {
    const r = appendPiece({ audio_pieces: [piece(1, 1)], transcript_source: src }, piece(2, 2));
    assert.ok(!r.duplicate && r.update.transcript === null && r.update.transcript_source === null, src);
  }
  const manual = appendPiece({ audio_pieces: [piece(1, 1)], transcript_source: "manual" }, piece(2, 2));
  assert.ok(!manual.duplicate && !("transcript" in manual.update) && !("transcript_source" in manual.update));
});

test("allAudioKeys: gộp legacy + mảnh, bỏ key sai định dạng, không trùng", () => {
  const keys = allAudioKeys({
    audio_key: K(0),
    audio_pieces: [piece(1, 1), piece(1, 1), { ...piece(2, 1), key: "cv/evil.pdf" }],
  });
  assert.deepEqual(keys.sort(), [K(0), K(1)].sort());
  assert.deepEqual(allAudioKeys({}), []);
});

test("segmentsOf: gom theo đoạn, cộng thời lượng (null = 0), giữ thứ tự", () => {
  const segs = segmentsOf([piece(3, 2, 500), piece(1, 1, 1000), piece(2, 1, null)]);
  assert.deepEqual(segs.map((s) => [s.segment, s.pieces.map((p) => p.key), s.duration_ms]), [
    [1, [K(1), K(2)], 1000],
    [2, [K(3)], 500],
  ]);
});

test("nextSegment: rỗng → 1, không thì max + 1", () => {
  assert.equal(nextSegment([]), 1);
  assert.equal(nextSegment([piece(1, 1), piece(2, 3)]), 4);
});

test("parsePieceInput: hợp lệ → mảnh (bỏ ;codecs ở mime)", () => {
  const pub = (k: string) => `https://cdn.tdgamestudio.com/${k}`;
  const r = parsePieceInput(
    { key: K(1), url: U(1), bytes: 2048, mime: "audio/webm;codecs=opus", duration_ms: 300000, segment: 2 },
    pub,
    "2026-11-10T10:00:00.000Z",
  );
  assert.deepEqual(r, {
    piece: { segment: 2, key: K(1), url: U(1), bytes: 2048, mime: "audio/webm", duration_ms: 300000, created_at: "2026-11-10T10:00:00.000Z" },
  });
});

test("parsePieceInput: từ chối key lạ / url không khớp / segment, bytes, mime, duration sai", () => {
  const pub = (k: string) => `https://cdn.tdgamestudio.com/${k}`;
  const ok = { key: K(1), url: U(1), bytes: 2048, mime: "audio/mp4", duration_ms: null, segment: 1 };
  const bad = [
    { ...ok, key: "cv/a.pdf", url: pub("cv/a.pdf") },
    { ...ok, url: "https://evil.example/x.m4a" },
    { ...ok, segment: 0 },
    { ...ok, segment: 1.5 },
    { ...ok, bytes: 0 },
    { ...ok, bytes: AUDIO_MAX_BYTES + 1 },
    { ...ok, mime: "application/pdf" },
    { ...ok, duration_ms: -1 },
    null,
  ];
  for (const b of bad) assert.ok("error" in parsePieceInput(b, pub, "x"), JSON.stringify(b));
  assert.ok("piece" in parsePieceInput(ok, pub, "x"));
});

test("geminiAudioMime: bỏ ;codecs, chữ thường; rỗng → audio/mpeg (spike 2026-11-10: Gemini nhận audio/mp4 cả MP4 phân mảnh, audio/webm)", () => {
  assert.equal(geminiAudioMime("audio/webm;codecs=opus"), "audio/webm");
  assert.equal(geminiAudioMime("Audio/MP4"), "audio/mp4");
  assert.equal(geminiAudioMime(""), "audio/mpeg");
  assert.equal(geminiAudioMime("audio/mpeg"), "audio/mpeg");
});

test("recordingFileName: rec-<yyyymmdd-hhmm giờ VN>-s<đoạn>.<đuôi theo mime>", () => {
  const at = Date.parse("2026-11-10T03:05:00Z"); // 10:05 giờ VN
  assert.equal(recordingFileName("audio/mp4", at, 2), "rec-20261110-1005-s2.m4a");
  assert.equal(recordingFileName("audio/webm;codecs=opus", at, 1), "rec-20261110-1005-s1.webm");
  assert.equal(recordingFileName("audio/ogg", at, 1), "rec-20261110-1005-s1.ogg");
  assert.equal(recordingFileName("", at, 1), "rec-20261110-1005-s1.audio");
});
