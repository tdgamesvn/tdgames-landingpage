// node --test src/lib/hr-crypto.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  hashPassword,
  verifyPassword,
  newToken,
  hashToken,
  isTokenUsable,
  sessionUserIsActive,
  readCookie,
} from "./hr-crypto.ts";

test("hash rồi verify đúng → true", async () => {
  const h = await hashPassword("mat-khau-123");
  assert.ok(h.startsWith("scrypt$"));
  assert.equal(await verifyPassword("mat-khau-123", h), true);
});

test("sai mật khẩu → false", async () => {
  const h = await hashPassword("mat-khau-123");
  assert.equal(await verifyPassword("sai", h), false);
});

test("stored null hoặc hỏng → false", async () => {
  assert.equal(await verifyPassword("x", null), false);
  assert.equal(await verifyPassword("x", "rac"), false);
});

test("hai lần hash cùng input khác chuỗi (salt)", async () => {
  assert.notEqual(await hashPassword("abc12345"), await hashPassword("abc12345"));
});

test("hashToken khớp hash của newToken", () => {
  const t = newToken();
  assert.equal(hashToken(t.token), t.hash);
  assert.match(t.hash, /^[0-9a-f]{64}$/);
  assert.notEqual(newToken().token, t.token);
});

test("isTokenUsable", () => {
  const now = new Date("2026-10-27T00:00:00Z");
  assert.equal(isTokenUsable({ expires_at: "2026-10-28T00:00:00Z", used_at: "2026-10-26T00:00:00Z" }, now), false);
  assert.equal(isTokenUsable({ expires_at: "2026-10-26T00:00:00Z", used_at: null }, now), false);
  assert.equal(isTokenUsable({ expires_at: "2026-10-28T00:00:00Z", used_at: null }, now), true);
});

test("sessionUserIsActive", () => {
  assert.equal(sessionUserIsActive({ disabled: true }), false);
  assert.equal(sessionUserIsActive(null), false);
  assert.equal(sessionUserIsActive({ disabled: false }), true);
});

test("readCookie", () => {
  assert.equal(readCookie(null, "hr_session"), null);
  assert.equal(readCookie("a=1; hr_session=abc", "hr_session"), "abc");
  assert.equal(readCookie("xhr_session=bad; hr_session_x=bad2", "hr_session"), null);
  assert.equal(readCookie("hr_session=a=b==", "hr_session"), "a=b==");
  assert.equal(readCookie("hr_session=%E0%A4%A", "hr_session"), "%E0%A4%A");
  assert.equal(readCookie("hr_session=a%20b", "hr_session"), "a b");
});
