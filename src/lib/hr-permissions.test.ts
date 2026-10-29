// node --test src/lib/hr-permissions.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  HR_PERMISSIONS,
  effectivePermissions,
  isPermissionKey,
} from "./hr-permissions.ts";

test("boss có mọi quyền, override bị bỏ qua", () => {
  const set = effectivePermissions("boss", [
    { role: "boss", permission: "apps.delete", allowed: false },
  ]);
  for (const p of HR_PERMISSIONS) assert.ok(set.has(p.key as never), p.key);
  assert.equal(set.size, HR_PERMISSIONS.length);
});

test("leader mặc định: chấm test được, không xem lương", () => {
  const set = effectivePermissions("leader", []);
  assert.ok(set.has("apps.review_test"));
  assert.ok(!set.has("apps.view_salary"));
});

test("override cấp quyền cho đúng vai", () => {
  const ov = [{ role: "leader", permission: "apps.view_salary", allowed: true }];
  assert.ok(effectivePermissions("leader", ov).has("apps.view_salary"));
  // override của leader không làm accountant mất quyền mặc định
  const acc = effectivePermissions("accountant", [
    { role: "leader", permission: "apps.view_salary", allowed: false },
  ]);
  assert.ok(acc.has("apps.view_salary"));
});

test("override thu hồi quyền mặc định", () => {
  const set = effectivePermissions("hr", [
    { role: "hr", permission: "apps.delete", allowed: false },
  ]);
  assert.ok(!set.has("apps.delete"));
});

test("override cho vai khác không ảnh hưởng", () => {
  const set = effectivePermissions("leader", [
    { role: "hr", permission: "apps.review_test", allowed: false },
  ]);
  assert.ok(set.has("apps.review_test"));
});

test("override key lạ bị bỏ qua", () => {
  const set = effectivePermissions("hr", [
    { role: "hr", permission: "foo.bar", allowed: true },
  ]);
  assert.ok(!(set as Set<string>).has("foo.bar"));
  assert.equal(isPermissionKey("foo.bar"), false);
  assert.equal(isPermissionKey("apps.edit"), true);
  assert.equal(isPermissionKey(42), false);
});

test("key duy nhất và đúng định dạng", () => {
  const keys = HR_PERMISSIONS.map((p) => p.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const k of keys) assert.match(k, /^[a-z_]+\.[a-z_]+$/);
});

test("referrals.*: HR xem+quản lý, Kế toán xem+trả, Leader không gì", () => {
  const hr = effectivePermissions("hr", []), acc = effectivePermissions("accountant", []), ld = effectivePermissions("leader", []);
  assert.ok(hr.has("referrals.view") && hr.has("referrals.manage") && !hr.has("referrals.pay"));
  assert.ok(acc.has("referrals.view") && acc.has("referrals.pay") && !acc.has("referrals.manage"));
  assert.ok(!ld.has("referrals.view") && !ld.has("referrals.manage") && !ld.has("referrals.pay"));
});
