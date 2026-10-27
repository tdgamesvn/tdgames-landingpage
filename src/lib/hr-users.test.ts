// node --test src/lib/hr-users.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { parseDiscordId, validateUserChange } from "./hr-users.ts";

const boss = (id: string) => ({ id, role: "boss" as const, disabled: false });

test("tự khoá mình → lỗi", () => {
  assert.ok(validateUserChange({ id: "a" }, boss("a"), { disabled: true }, 2));
});
test("tự đổi vai khỏi boss → lỗi", () => {
  assert.ok(validateUserChange({ id: "a" }, boss("a"), { role: "hr" }, 2));
});
test("khoá boss khác khi chỉ còn 1 boss → lỗi", () => {
  assert.equal(
    validateUserChange({ id: "x" }, boss("b"), { disabled: true }, 1),
    "Phải còn ít nhất 1 tài khoản Sếp",
  );
});
test("hạ boss khác khi chỉ còn 1 boss → lỗi", () => {
  assert.equal(
    validateUserChange({ id: null }, boss("b"), { role: "leader" }, 1),
    "Phải còn ít nhất 1 tài khoản Sếp",
  );
});
test("đổi hr → leader → null", () => {
  assert.equal(
    validateUserChange({ id: "a" }, { id: "h", role: "hr", disabled: false }, { role: "leader" }, 1),
    null,
  );
});
test("actor legacy khoá boss khi còn 2 boss → null", () => {
  assert.equal(validateUserChange({ id: null }, boss("b"), { disabled: true }, 2), null);
});

test("parseDiscordId: nhận ID số 17–20 chữ số, cả dạng mention <@…> / <@!…>", () => {
  assert.equal(parseDiscordId("123456789012345678"), "123456789012345678");
  assert.equal(parseDiscordId("  <@123456789012345678> "), "123456789012345678");
  assert.equal(parseDiscordId("<@!12345678901234567>"), "12345678901234567");
});

test("parseDiscordId: rỗng/null → null (xoá), sai định dạng → 'invalid'", () => {
  assert.equal(parseDiscordId(""), null);
  assert.equal(parseDiscordId(null), null);
  assert.equal(parseDiscordId("toan.dang"), "invalid");
  assert.equal(parseDiscordId("1234"), "invalid");
  assert.equal(parseDiscordId("123456789012345678901"), "invalid");
  assert.equal(parseDiscordId(123), "invalid");
});
