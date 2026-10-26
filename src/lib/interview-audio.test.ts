// node --test src/lib/interview-audio.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { AUDIO_MAX_BYTES, audioFileError, formatProgress, isInterviewAudioKey, planParts } from "./interview-audio.ts";

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
