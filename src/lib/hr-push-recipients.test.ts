// node --test src/lib/hr-push-recipients.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { pushRecipientUserIds } from "./hr-push-recipients.ts";
import { effectivePermissions, HR_ROLES, type HrRole, type PermissionKey } from "./hr-permissions.ts";

const perms = new Map<HrRole, Set<PermissionKey>>(HR_ROLES.map((r) => [r, effectivePermissions(r, [])]));
const users = [
  { id: "boss1", role: "boss" as const, disabled: false },
  { id: "hr1", role: "hr" as const, disabled: false },
  { id: "leadA", role: "leader" as const, disabled: false },
  { id: "leadB", role: "leader" as const, disabled: false },
  { id: "acc1", role: "accountant" as const, disabled: false },
  { id: "hrOff", role: "hr" as const, disabled: true },
];

test("leader job A nhận nhắc PV job A, leader job B không", () => {
  const ids = pushRecipientUserIds(users, perms, "leadA");
  assert.ok(ids.includes("leadA"));
  assert.ok(!ids.includes("leadB"));
});

test("HR và boss nhận; kế toán không (mặc định); user khoá không", () => {
  const ids = pushRecipientUserIds(users, perms, "leadA");
  assert.ok(ids.includes("hr1"));
  assert.ok(ids.includes("boss1"));
  assert.ok(!ids.includes("acc1"));
  assert.ok(!ids.includes("hrOff"));
});

test("job không có leader → không leader nào nhận", () => {
  const ids = pushRecipientUserIds(users, perms, null);
  assert.ok(!ids.includes("leadA") && !ids.includes("leadB"));
});

test("vai bị thu push.receive thì không nhận", () => {
  const p = new Map(perms);
  p.set("hr", effectivePermissions("hr", [{ role: "hr", permission: "push.receive", allowed: false }]));
  assert.ok(!pushRecipientUserIds(users, p, null).includes("hr1"));
});
