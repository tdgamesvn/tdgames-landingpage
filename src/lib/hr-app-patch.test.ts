// node --test src/lib/hr-app-patch.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { checkAppPatch } from "./hr-app-patch.ts";
import { effectivePermissions } from "./hr-permissions.ts";

const ctx = (role: "boss" | "hr" | "leader" | "accountant") => ({ role, perms: effectivePermissions(role, []) });

test("kế toán: interview → offer được phép", () => {
  assert.equal(checkAppPatch(ctx("accountant"), "interview", { status: "offer" }), null);
});
test("kế toán: offer từ trạng thái khác interview bị chặn", () => {
  assert.ok(checkAppPatch(ctx("accountant"), "test", { status: "offer" }));
});
test("kế toán: đổi sang rejected bị chặn", () => {
  assert.ok(checkAppPatch(ctx("accountant"), "interview", { status: "rejected" }));
});
test("kế toán: offer_status được phép", () => {
  assert.equal(checkAppPatch(ctx("accountant"), "offer", { offer_status: "accepted" }), null);
});
test("kế toán: key khác bị chặn", () => {
  assert.ok(checkAppPatch(ctx("accountant"), "offer", { offer_status: "accepted", admin_notes: "x" }));
});
test("leader: test_review được phép", () => {
  assert.equal(checkAppPatch(ctx("leader"), "test", { test_review: { score: 5 } }), null);
});
test("leader: admin_notes bị chặn", () => {
  assert.ok(checkAppPatch(ctx("leader"), "test", { admin_notes: "x" }));
});
test("leader: offer_status bị chặn (không có apps.offer)", () => {
  assert.ok(checkAppPatch(ctx("leader"), "offer", { offer_status: "pending" }));
});
test("hr/boss: mọi key đều được", () => {
  assert.equal(checkAppPatch(ctx("hr"), "new", { status: "rejected", admin_notes: "x", foo: 1 }), null);
  assert.equal(checkAppPatch(ctx("boss"), "new", { status: "rejected" }), null);
});
test("leader: {status:offer} bị chặn", () => {
  assert.ok(checkAppPatch(ctx("leader"), "interview", { status: "offer" }));
});
test("kế toán: interview → offer kèm offer_status declined được phép", () => {
  assert.equal(checkAppPatch(ctx("accountant"), "interview", { status: "offer", offer_status: "declined" }), null);
});
test("kế toán: test_review bị chặn (không có apps.review_test)", () => {
  assert.ok(checkAppPatch(ctx("accountant"), "offer", { test_review: { score: 5 } }));
});
test("kế toán: offer_status khi hồ sơ chưa ở offer bị chặn", () => {
  assert.ok(checkAppPatch(ctx("accountant"), "interview", { offer_status: "accepted" }));
});
