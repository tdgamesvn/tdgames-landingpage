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

test("đầy key còn hiệu lực: key mới bị từ chối, key cũ vẫn đếm đúng", () => {
  const l = createLimiter(2, 1000, () => 0, 100);
  for (let i = 0; i < 100; i++) assert.equal(l.tryHit(`k${i}`), true);
  assert.equal(l.size(), 100);
  assert.equal(l.tryHit("moi"), false); // fail closed
  assert.equal(l.size(), 100);
  assert.equal(l.count("moi"), 0);
  assert.equal(l.tryHit("k0"), true); // key cũ vẫn đếm
  assert.equal(l.tryHit("k0"), false); // đạt hạn mức 2
  assert.equal(l.count("k0"), 2);
  assert.equal(l.count("k99"), 1); // không bị xoá
});

test("key hết hạn được dọn để nhường chỗ cho key mới", () => {
  let t = 0;
  const l = createLimiter(5, 1000, () => t, 10);
  for (let i = 0; i < 10; i++) l.tryHit(`old${i}`);
  t = 2000;
  assert.equal(l.tryHit("new1"), true);
  assert.equal(l.tryHit("new2"), true);
  assert.ok(l.size() <= 10);
  assert.equal(l.count("new1"), 1);
});

test("clientIp: x-real-ip (nginx ghi đè, đã giải CF) > cf-connecting-ip > x-forwarded-for cuối > unknown", () => {
  const h = (o: Record<string, string>) => new Headers(o);
  // Header cf-connecting-ip do client gửi thẳng tới origin giả được; x-real-ip do nginx đặt thì không.
  assert.equal(clientIp(h({ "cf-connecting-ip": "1.1.1.1", "x-real-ip": "2.2.2.2", "x-forwarded-for": "9.9.9.9, 3.3.3.3" })), "2.2.2.2");
  assert.equal(clientIp(h({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "9.9.9.9, 3.3.3.3" })), "1.1.1.1");
  assert.equal(clientIp(h({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "9.9.9.9, 3.3.3.3" })), "2.2.2.2");
  assert.equal(clientIp(h({ "x-forwarded-for": "9.9.9.9, 3.3.3.3" })), "3.3.3.3");
  assert.equal(clientIp(h({})), "unknown");
});
