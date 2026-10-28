// node --test src/lib/hr-ref-codes.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { autoAssigneeFor, canonicalRefCode, findRefConflict, normalizeRefCode, parseRefCodes, resolveRefOwner } from "./hr-ref-codes.ts";

test("normalizeRefCode: bỏ dấu, đ→d, lowercase, khoảng trắng/gạch dưới → -", () => {
  assert.equal(normalizeRefCode("minh-phương"), "minh-phuong");
  assert.equal(normalizeRefCode("Thuỳ Dung"), "thuy-dung");
  assert.equal(normalizeRefCode("Đặng_Thế Toàn"), "dang-the-toan");
  assert.equal(normalizeRefCode("ĐĐ"), "dd");
  assert.equal(normalizeRefCode("PhuongHR"), "phuonghr");
});

test("normalizeRefCode: chỉ giữ [a-z0-9-], gộp --, trim -", () => {
  assert.equal(normalizeRefCode("  --a!!b--__c  -- "), "ab-c");
  assert.equal(normalizeRefCode("a - b"), "a-b");
  assert.equal(normalizeRefCode("mai-ha (headhunt)"), "mai-ha-headhunt");
  assert.equal(normalizeRefCode("x2026"), "x2026");
});

test("normalizeRefCode: rỗng / chỉ ký tự lạ / không phải chuỗi → null", () => {
  assert.equal(normalizeRefCode(""), null);
  assert.equal(normalizeRefCode("   "), null);
  assert.equal(normalizeRefCode("!!!---"), null);
  assert.equal(normalizeRefCode(null), null);
  assert.equal(normalizeRefCode(undefined), null);
  assert.equal(normalizeRefCode(42), null);
});

const users = [
  { id: "p", ref_codes: ["minh-phuong", "phuong-hr", "phuonghr"] },
  { id: "d", ref_codes: ["thuy-dung", "dung"] },
  { id: "t", ref_codes: ["toan-dang", "toan"] },
  { id: "x", ref_codes: [] },
];

test("resolveRefOwner: khớp bất kỳ mã nào sau normalize", () => {
  assert.equal(resolveRefOwner("Minh Phương", users)?.id, "p");
  assert.equal(resolveRefOwner("phuong_hr", users)?.id, "p");
  assert.equal(resolveRefOwner("DUNG", users)?.id, "d");
  assert.equal(resolveRefOwner("toan", users)?.id, "t");
});

test("resolveRefOwner: không khớp / rỗng → null; mã lưu chưa chuẩn vẫn khớp", () => {
  assert.equal(resolveRefOwner("cat-tuong", users), null);
  assert.equal(resolveRefOwner("", users), null);
  assert.equal(resolveRefOwner(null, users), null);
  assert.equal(resolveRefOwner("thuy van", users), null);
  assert.equal(resolveRefOwner("minh-phuong", [{ id: "q", ref_codes: ["Minh Phương"] }])?.id, "q");
});

test("canonicalRefCode: mã chính = phần tử đầu (đã normalize)", () => {
  assert.equal(canonicalRefCode(users[1]), "thuy-dung");
  assert.equal(canonicalRefCode({ ref_codes: ["Minh Phương", "x"] }), "minh-phuong");
  assert.equal(canonicalRefCode(users[3]), null);
  assert.equal(canonicalRefCode({ ref_codes: null }), null);
});

test("parseRefCodes: normalize, bỏ trùng/rỗng, giữ thứ tự", () => {
  assert.deepEqual(parseRefCodes(["Minh Phương", "minh-phuong", "", "Phuong HR"]), ["minh-phuong", "phuong-hr"]);
  assert.deepEqual(parseRefCodes([]), []);
  assert.deepEqual(parseRefCodes(null), []);
});

test("parseRefCodes: sai kiểu / quá 10 mã / mã dài quá 40 → lỗi tiếng Việt", () => {
  assert.ok("error" in (parseRefCodes("abc") as object));
  assert.ok("error" in (parseRefCodes([1, 2]) as object));
  const eleven = Array.from({ length: 11 }, (_, i) => `ma-${i}`);
  assert.ok("error" in (parseRefCodes(eleven) as object));
  assert.deepEqual(parseRefCodes(eleven.slice(0, 10)), eleven.slice(0, 10));
  assert.ok("error" in (parseRefCodes(["a".repeat(41)]) as object));
  assert.deepEqual(parseRefCodes(["a".repeat(40)]), ["a".repeat(40)]);
});

test("findRefConflict: mã thuộc tài khoản khác → trả mã + chủ; của chính mình thì bỏ qua", () => {
  const all = [
    { id: "p", display_name: "Phương", ref_codes: ["minh-phuong", "phuonghr"] },
    { id: "d", display_name: "Dung", ref_codes: ["thuy-dung", "dung"] },
  ];
  assert.deepEqual(findRefConflict(["new", "dung"], all, "p"), { code: "dung", owner: all[1] });
  assert.equal(findRefConflict(["dung", "thuy-dung"], all, "d"), null);
  assert.equal(findRefConflict(["khac"], all, null), null);
  assert.deepEqual(findRefConflict(["phuonghr"], all, null)?.owner.id, "p");
});

const st = [
  { key: "new", position: 10, kind: "open" as const },
  { key: "interview", position: 50, kind: "open" as const },
  { key: "offer", position: 60, kind: "won" as const },
];

test("autoAssigneeFor: chủ mã xem được hồ sơ mới (status new) → giao; không xem được → null", () => {
  const app = { job_id: "j1", status: "new" };
  assert.equal(autoAssigneeFor({ id: "h", role: "hr" }, app, st, null), "h");
  assert.equal(autoAssigneeFor({ id: "b", role: "boss" }, app, st, null), "b");
  assert.equal(autoAssigneeFor({ id: "l", role: "leader" }, app, st, "l"), "l");
  assert.equal(autoAssigneeFor({ id: "l", role: "leader" }, app, st, "other"), null);
  assert.equal(autoAssigneeFor({ id: "a", role: "accountant" }, app, st, null), null);
  assert.equal(autoAssigneeFor(null, app, st, null), null);
});
