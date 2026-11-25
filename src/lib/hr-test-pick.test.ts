// node --test src/lib/hr-test-pick.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { needsTestChoice, pickTestsForApplication } from "./hr-test-pick.ts";

const A = { id: "a" };
const B = { id: "b" };
const C = { id: "c" };

test("chưa chọn → tất cả đề (link cũ không đổi)", () => {
  assert.deepEqual(pickTestsForApplication([A, B], null), [A, B]);
  assert.deepEqual(pickTestsForApplication([A, B], []), [A, B]);
});

test("đã chọn → chỉ đề đã chọn, giữ thứ tự của job", () => {
  assert.deepEqual(pickTestsForApplication([A, B, C], ["c", "a"]), [A, C]);
});

test("đề đã chọn bị xoá hết → quay về tất cả", () => {
  assert.deepEqual(pickTestsForApplication([A, B], ["x"]), [A, B]);
});

test("job 0–1 đề không bắt chọn", () => {
  assert.equal(needsTestChoice([], null), false);
  assert.equal(needsTestChoice([A], null), false);
});

test("job ≥ 2 đề: chưa chọn / chọn id đã xoá → bắt chọn; chọn đề còn → không", () => {
  assert.equal(needsTestChoice([A, B], null), true);
  assert.equal(needsTestChoice([A, B], ["x"]), true);
  assert.equal(needsTestChoice([A, B], ["b"]), false);
});
