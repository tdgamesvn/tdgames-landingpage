// node --test src/lib/render-slots.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { RenderSlots } from "./render-slots.ts";

const tick = () => new Promise((r) => setTimeout(r, 5));

test("tryAcquire: tối đa N toàn cục + 1/người, nhả ra thì lấy lại được", () => {
  const s = new RenderSlots({ max: 2 });
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

test("acquire: không bị khoá xem trước theo người, chờ slot trống thay vì từ chối", async () => {
  const s = new RenderSlots({ max: 2 });
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
  assert.ok(rel);
  assert.equal(s.running, 2);
  // Trong lúc việc chờ đang render, xem trước của chính người đó bị từ chối nhanh.
  assert.equal(s.tryAcquire("u1"), null);
  rel!();
  p1();
  assert.equal(s.running, 0);
});

test("acquire: còn slot thì lấy ngay, kể cả người đó đang có bản xem trước", async () => {
  const s = new RenderSlots({ max: 2 });
  const prev = s.tryAcquire("u1")!;
  const rel = await s.acquire("u1", 1000);
  assert.ok(rel);
  assert.equal(s.running, 2);
  rel!();
  prev();
  assert.equal(s.running, 0);
});

test("acquire: mỗi người tối đa 2 việc chờ (đang chờ + đang chạy), nhả ra thì được thêm", async () => {
  const s = new RenderSlots({ max: 1 });
  const r1 = await s.acquire("u1", 1000); // chạy
  const w2 = s.acquire("u1", 1000); // chờ
  assert.equal(await s.acquire("u1", 1000), null, "việc thứ 3 của cùng người → từ chối");
  assert.ok(await s.acquire("u2", 50).then((r) => (r?.(), true)), "người khác vẫn được xếp hàng");
  r1!();
  const r2 = await w2;
  assert.ok(r2);
  const r3 = s.acquire("u1", 1000); // còn 1 việc → được xếp hàng
  r2!();
  (await r3)!();
  assert.equal(s.running, 0);
  assert.equal(s.waiting, 0);
});

test("acquire: hàng chờ toàn cục tối đa maxQueue", async () => {
  const s = new RenderSlots({ max: 1, maxQueue: 2 });
  const hold = s.tryAcquire("x")!;
  const a = s.acquire("a", 1000);
  const b = s.acquire("b", 1000);
  assert.equal(s.waiting, 2);
  assert.equal(await s.acquire("c", 1000), null, "hàng chờ đầy → từ chối");
  hold();
  (await a)!();
  (await b)!();
  assert.equal(s.running, 0);
});

test("acquire: hết hạn chờ → chạy nếu còn trong mức vượt (max + 2), quá thì từ chối", async () => {
  const s = new RenderSlots({ max: 1, maxOverrun: 2 });
  const hold = s.tryAcquire("x")!;
  const t0 = Date.now();
  const r1 = await s.acquire("u1", 30);
  assert.ok(Date.now() - t0 >= 25);
  assert.ok(r1, "running 1 < 3 → chạy vượt");
  const r2 = await s.acquire("u2", 30);
  assert.ok(r2, "running 2 < 3 → chạy vượt");
  assert.equal(s.running, 3);
  assert.equal(await s.acquire("u3", 30), null, "running 3 = max + 2 → từ chối, không vượt vô hạn");
  assert.equal(s.waiting, 0);
  // Bị từ chối do hết hạn không giữ chỗ việc chờ của người đó.
  r1!();
  r2!();
  hold();
  assert.ok(await s.acquire("u3", 30).then((r) => (r?.(), r !== null)));
  assert.equal(s.running, 0);
});

test("acquire: hàng chờ theo thứ tự đến trước", async () => {
  const s = new RenderSlots({ max: 1 });
  const hold = s.tryAcquire("x")!;
  const order: string[] = [];
  const a = s.acquire("a", 1000).then((r) => (order.push("a"), r));
  const b = s.acquire("b", 1000).then((r) => (order.push("b"), r));
  await tick();
  hold();
  const ra = await a;
  assert.deepEqual(order, ["a"]);
  ra!();
  const rb = await b;
  assert.deepEqual(order, ["a", "b"]);
  rb!();
  assert.equal(s.running, 0);
});
