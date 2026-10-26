// node --test src/lib/gemini-sse.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { geminiRetryDelayMs, textFromGeminiSse } from "./gemini-sse.ts";

const ev = (t: string) => `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: t }] } }] })}\r\n\r\n`;

test("ghép text từ nhiều event SSE theo thứ tự", () => {
  assert.equal(textFromGeminiSse(ev("[00:01] Người phỏng vấn: Chào ") + ev("bạn.\n") + ev("[00:05] Ứng viên: Dạ")), "[00:01] Người phỏng vấn: Chào bạn.\n[00:05] Ứng viên: Dạ");
});

test("bỏ qua dòng rác, event không có text, [DONE]", () => {
  const raw = ": keep-alive\n\n" + ev("A") + `data: ${JSON.stringify({ usageMetadata: {} })}\n\n` + "data: [DONE]\n\n" + ev("B");
  assert.equal(textFromGeminiSse(raw), "AB");
});

test("lỗi trong stream → ném lỗi có message", () => {
  assert.throws(() => textFromGeminiSse(`data: ${JSON.stringify({ error: { code: 429, message: "quota" } })}\n\n`), /429.*quota/);
});

test("geminiRetryDelayMs: 429/500/503 thử lại tăng dần, lỗi khác hoặc hết lượt → null", () => {
  assert.equal(geminiRetryDelayMs(503, 1), 20_000);
  assert.equal(geminiRetryDelayMs(429, 2), 40_000);
  assert.equal(geminiRetryDelayMs(500, 3), 60_000);
  assert.equal(geminiRetryDelayMs(503, 4), null);
  assert.equal(geminiRetryDelayMs(400, 1), null);
  assert.equal(geminiRetryDelayMs(404, 1), null);
});
