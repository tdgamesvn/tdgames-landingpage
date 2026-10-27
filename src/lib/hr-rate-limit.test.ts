// node --test src/lib/hr-rate-limit.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { clientIp, createLimiter } from "./hr-rate-limit.ts";

test("tryHit: N+1 lần liên tiếp → lần cuối false; mở lại khi hết cửa sổ", () => {
  let t = 0;
  const l = createLimiter(3, 1000, () => t);
  assert.equal(l.tryHit("a"), true);
  assert.equal(l.tryHit("a"), true);
  assert.equal(l.tryHit("a"), true);
  assert.equal(l.tryHit("a"), false);
  assert.equal(l.count("a"), 3);
  t = 1001;
  assert.equal(l.count("a"), 0);
  assert.equal(l.tryHit("a"), true);
});

test("khoá độc lập theo key; reset và undo", () => {
  const l = createLimiter(1, 1000, () => 0);
  assert.equal(l.tryHit("a"), true);
  assert.equal(l.tryHit("a"), false);
  assert.equal(l.tryHit("b"), true);
  l.undo("a");
  assert.equal(l.tryHit("a"), true);
  l.reset("a");
  assert.equal(l.count("a"), 0);
});

test("số key không vượt trần: xoá key cũ nhất", () => {
  const l = createLimiter(5, 1000, () => 0, 100);
  for (let i = 0; i < 1000; i++) {
    l.tryHit(`k${i}`);
    assert.ok(l.size() <= 100);
  }
  assert.equal(l.count("k0"), 0); // đã bị đẩy ra
  assert.equal(l.count("k999"), 1);
});

test("key hết hạn bị dọn khi vượt trần", () => {
  let t = 0;
  const l = createLimiter(5, 1000, () => t, 10);
  for (let i = 0; i < 10; i++) l.tryHit(`old${i}`);
  t = 2000;
  l.tryHit("new1");
  l.tryHit("new2");
  assert.ok(l.size() <= 10);
  assert.equal(l.count("new1"), 1);
});

test("clientIp: cf-connecting-ip > x-real-ip > x-forwarded-for cuối > unknown", () => {
  const h = (o: Record<string, string>) => new Headers(o);
  assert.equal(clientIp(h({ "cf-connecting-ip": "1.1.1.1", "x-real-ip": "2.2.2.2", "x-forwarded-for": "9.9.9.9, 3.3.3.3" })), "1.1.1.1");
  assert.equal(clientIp(h({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "9.9.9.9, 3.3.3.3" })), "2.2.2.2");
  assert.equal(clientIp(h({ "x-forwarded-for": "9.9.9.9, 3.3.3.3" })), "3.3.3.3");
  assert.equal(clientIp(h({})), "unknown");
});
