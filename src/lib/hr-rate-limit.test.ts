// node --test src/lib/hr-rate-limit.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { clientIp, createLimiter } from "./hr-rate-limit.ts";

test("chặn sau khi đạt hạn mức, mở lại khi hết cửa sổ", () => {
  let t = 0;
  const l = createLimiter(3, 1000, () => t);
  assert.equal(l.blocked("a"), false);
  assert.equal(l.hit("a"), true);
  assert.equal(l.hit("a"), true);
  assert.equal(l.hit("a"), true);
  assert.equal(l.blocked("a"), true);
  assert.equal(l.hit("a"), false);
  t = 1001;
  assert.equal(l.blocked("a"), false);
  assert.equal(l.count("a"), 0);
});

test("khoá độc lập theo key; reset xoá", () => {
  const l = createLimiter(1, 1000, () => 0);
  l.hit("a");
  assert.equal(l.blocked("a"), true);
  assert.equal(l.blocked("b"), false);
  l.reset("a");
  assert.equal(l.blocked("a"), false);
});

test("clientIp lấy phần tử đầu x-forwarded-for", () => {
  assert.equal(clientIp("1.2.3.4, 5.6.7.8"), "1.2.3.4");
  assert.equal(clientIp(null), "unknown");
  assert.equal(clientIp(""), "unknown");
});
