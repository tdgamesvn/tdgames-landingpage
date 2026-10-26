// node --test src/lib/interview-audio.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { AUDIO_MAX_BYTES, audioFileError, formatProgress } from "./interview-audio.ts";

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
