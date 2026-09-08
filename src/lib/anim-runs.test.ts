// node --test src/lib/anim-runs.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { toRuns, expandRuns } from "./anim-runs.ts";

const SEQ = ["breathe", "breathe", "breathe", "levelup", "breathe", "walk", "walk"];

test("gộp mục liên tiếp trùng tên, giữ nguyên thứ tự", () => {
  assert.deepEqual(toRuns(SEQ), [
    { name: "breathe", count: 3 },
    { name: "levelup", count: 1 },
    { name: "breathe", count: 1 },
    { name: "walk", count: 2 },
  ]);
  assert.deepEqual(toRuns([]), []);
});

test("expand là nghịch đảo của toRuns", () => {
  assert.deepEqual(expandRuns(toRuns(SEQ)), SEQ);
});

test("đổi chỗ 2 nhóm cùng tên thành kề nhau thì lần gộp sau nhập làm một", () => {
  // ["a","a","b","a"] → đưa "b" xuống cuối → 3 con "a" phải gộp thành ×3
  const runs = toRuns(["a", "a", "b", "a"]);
  [runs[1], runs[2]] = [runs[2], runs[1]];
  assert.deepEqual(expandRuns(runs), ["a", "a", "a", "b"]);
  assert.deepEqual(toRuns(expandRuns(runs)), [
    { name: "a", count: 3 },
    { name: "b", count: 1 },
  ]);
});

test("count bẩn không sinh mảng rỗng hay vô hạn", () => {
  assert.deepEqual(expandRuns([{ name: "a", count: 0 }]), ["a"]);
  assert.deepEqual(expandRuns([{ name: "a", count: 2.7 }]), ["a", "a"]);
});
