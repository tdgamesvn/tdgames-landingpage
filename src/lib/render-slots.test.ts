// node --test src/lib/render-slots.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { RenderSlots } from "./render-slots.ts";

const tick = () => new Promise((r) => setTimeout(r, 5));

test("tryAcquire: tối đa N toàn cục + 1/người, nhả ra thì lấy lại được", () => {
  const s = new RenderSlots(2);
  const a = s.tryAcquire("u1");
  assert.ok(a);
  assert.equal(s.tryAcquire("u1"), null, "cùng người đang có 1 bản → từ chối");
  const b = s.tryAcquire("u2");
  assert.ok(b);
  assert.equal(s.tryAcquire("u3"), null, "đủ 2 bản toàn server → từ chối");
  a!();
  assert.ok(s.tryAcquire("u3"));
  assert.equal(s.running, 2);
  a!(); // nhả 2 lần không làm sai bộ đếm
  assert.equal(s.running, 2);
});

test("acquire: không bị khoá theo người, chờ slot trống thay vì từ chối", async () => {
  const s = new RenderSlots(2);
  const p1 = s.tryAcquire("u1")!;
  const p2 = s.tryAcquire("u2")!;
  let got = false;
  const waiting = s.acquire("u1", 1000).then((rel) => {
    got = true;
    return rel;
  });
  await tick();
  assert.equal(got, false, "đang đủ 2 bản → phải chờ");
  p2();
  const rel = await waiting;
  assert.equal(got, true);
  assert.equal(s.running, 2);
  // Trong lúc gửi mail đang render, xem trước của chính người đó bị từ chối nhanh.
  assert.equal(s.tryAcquire("u1"), null);
  rel();
  p1();
  assert.equal(s.running, 0);
});

test("acquire: còn slot thì lấy ngay, kể cả người đó đang có bản xem trước", async () => {
  const s = new RenderSlots(2);
  const prev = s.tryAcquire("u1")!;
  const rel = await s.acquire("u1", 1000);
  assert.equal(s.running, 2);
  rel();
  prev();
  assert.equal(s.running, 0);
});

test("acquire: chờ quá hạn → vẫn chạy (vượt giới hạn tạm), không bao giờ từ chối", async () => {
  const s = new RenderSlots(1);
  const hold = s.tryAcquire("u1")!;
  const t0 = Date.now();
  const rel = await s.acquire("u2", 30);
  assert.ok(Date.now() - t0 >= 25);
  assert.equal(s.running, 2, "chạy vượt 1 bản sau khi hết hạn chờ");
  rel();
  hold();
  assert.equal(s.running, 0);
  assert.equal(s.waiting, 0);
});

test("acquire: hàng chờ theo thứ tự đến trước", async () => {
  const s = new RenderSlots(1);
  const hold = s.tryAcquire("x")!;
  const order: string[] = [];
  const a = s.acquire("a", 1000).then((r) => (order.push("a"), r));
  const b = s.acquire("b", 1000).then((r) => (order.push("b"), r));
  await tick();
  hold();
  const ra = await a;
  assert.deepEqual(order, ["a"]);
  ra();
  const rb = await b;
  assert.deepEqual(order, ["a", "b"]);
  rb();
  assert.equal(s.running, 0);
});
