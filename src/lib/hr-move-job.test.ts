// node --test src/lib/hr-move-job.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { escapeIlike, moveJobComment, moveJobDenial, type MoveJobCheck } from "./hr-move-job.ts";

const ok: MoveJobCheck = {
  role: "hr",
  canEdit: true,
  currentJobId: "j-art",
  targetJobId: "j-gd",
  targetExists: true,
  duplicateInTarget: false,
  openPayouts: 0,
};

test("HR/Sếp có quyền sửa → được đổi", () => {
  assert.equal(moveJobDenial(ok), null);
  assert.equal(moveJobDenial({ ...ok, role: "boss" }), null);
});

test("Leader / Kế toán / thiếu apps.edit → 403", () => {
  assert.equal(moveJobDenial({ ...ok, role: "leader" })?.status, 403);
  assert.equal(moveJobDenial({ ...ok, role: "accountant" })?.status, 403);
  assert.equal(moveJobDenial({ ...ok, canEdit: false })?.status, 403);
});

test("job đích không có / trùng job hiện tại → 400", () => {
  assert.equal(moveJobDenial({ ...ok, targetExists: false })?.status, 400);
  assert.equal(moveJobDenial({ ...ok, targetJobId: "j-art" })?.status, 400);
});

test("đã có hồ sơ ở job đích hoặc có hoa hồng → 409", () => {
  assert.equal(moveJobDenial({ ...ok, duplicateInTarget: true })?.status, 409);
  assert.equal(moveJobDenial({ ...ok, openPayouts: 1 })?.status, 409);
});

test("bình luận nêu 2 vị trí, chỉ nhắc AI khi có điểm cũ", () => {
  const withAi = moveJobComment("2D Game Artist", "Graphic Designer", true);
  assert.match(withAi, /2D Game Artist → Graphic Designer/);
  assert.match(withAi, /Chấm bằng AI/);
  assert.doesNotMatch(moveJobComment("A", "B", false), /AI/);
});

test("escapeIlike chặn ký tự đại diện", () => {
  assert.equal(escapeIlike("a_b%c\\d@x.com"), "a\\_b\\%c\\\\d@x.com");
  assert.equal(escapeIlike("hhamyyyy@gmail.com"), "hhamyyyy@gmail.com");
});
