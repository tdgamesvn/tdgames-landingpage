// node --test src/lib/ai-fetch-error.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { aiFetchErrorMessage } from "./ai-fetch-error.ts";

test("hết thời gian chờ → báo AI trả lời quá lâu, không đổ cho Mac tắt", async () => {
  // fetch hết giờ ném đúng signal.reason (DOMException "TimeoutError") — dựng thẳng, khỏi cần mạng.
  const signal = AbortSignal.timeout(1);
  await new Promise((r) => setTimeout(r, 20));
  const err = signal.reason;
  assert.equal(err?.name, "TimeoutError");
  const msg = aiFetchErrorMessage(err, 90_000);
  assert.match(msg, /quá lâu/);
  assert.match(msg, /90 giây/);
  assert.doesNotMatch(msg, /Mac tắt/);
});

test("lỗi mạng thật → vẫn báo không kết nối được", () => {
  const msg = aiFetchErrorMessage(new TypeError("fetch failed"), 90_000);
  assert.match(msg, /unreachable/);
});
