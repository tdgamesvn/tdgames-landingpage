// node --test src/lib/hr-scope.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { accountantStatusKeys, inScope, redactApplication, redactInterview } from "./hr-scope.ts";
import type { ScopeInput } from "./hr-scope.ts";
import { HR_PERMISSIONS, effectivePermissions } from "./hr-permissions.ts";
import type { PermissionKey } from "./hr-permissions.ts";

const statuses: ScopeInput["statuses"] = [
  { key: "new", position: 10, kind: "open" },
  { key: "reviewing", position: 20, kind: "open" },
  { key: "phone_screening", position: 30, kind: "open" },
  { key: "test", position: 40, kind: "open" },
  { key: "interview", position: 50, kind: "open" },
  { key: "offer", position: 60, kind: "won" },
  { key: "rejected", position: 70, kind: "lost" },
];
const base = { userId: "u1", leaderJobIds: ["j1"], statuses };

test("leader chỉ thấy job của mình; hr/boss thấy hết", () => {
  const leader = { ...base, role: "leader" as const };
  assert.equal(inScope(leader, { job_id: "j1", status: "new" }), true);
  assert.equal(inScope(leader, { job_id: "j2", status: "new" }), false);
  for (const role of ["hr", "boss"] as const) {
    assert.equal(inScope({ ...base, role }, { job_id: "jx", status: "new" }), true);
  }
});

test("kế toán: interview/offer thấy, test không, rejected chỉ khi có offer_status", () => {
  const acc = { ...base, role: "accountant" as const };
  assert.deepEqual(accountantStatusKeys(statuses), ["interview", "offer"]);
  assert.equal(inScope(acc, { job_id: "j", status: "interview" }), true);
  assert.equal(inScope(acc, { job_id: "j", status: "offer" }), true);
  assert.equal(inScope(acc, { job_id: "j", status: "test" }), false);
  assert.equal(inScope(acc, { job_id: "j", status: "rejected" }), false);
  assert.equal(inScope(acc, { job_id: "j", status: "rejected", offer_status: "declined" }), true);
  const withHired = [...statuses, { key: "hired", position: 65, kind: "won" as const }];
  assert.equal(inScope({ ...acc, statuses: withHired }, { job_id: "j", status: "hired" }), true);
  assert.deepEqual(accountantStatusKeys(statuses.filter((s) => s.key !== "interview")), []);
});

const app = {
  id: "a", job_id: "j1", full_name: "A", cv_url: "cv", status: "new",
  email: "e", expected_salary: 1, ai_profile: "p", ai_custom: 1, rank_score: 2, admin_notes: "n",
  test_review: { x: 1 }, interview_sessions: [], some_future_column: 1,
};

test("redactApplication leader mặc định", () => {
  const perms = effectivePermissions("leader", []);
  const before = JSON.stringify(app);
  const out = redactApplication(app, perms);
  assert.ok("cv_url" in out && "test_review" in out && "interview_sessions" in out);
  for (const k of ["email", "expected_salary", "ai_profile", "ai_custom", "rank_score", "admin_notes", "some_future_column"]) {
    assert.ok(!(k in out), k);
  }
  assert.equal(JSON.stringify(app), before);
});

test("có view_ai thì giữ key ai_* / rank* lạ", () => {
  const out = redactApplication(app, new Set<PermissionKey>(["apps.view_ai"]));
  assert.ok("ai_custom" in out && "rank_score" in out && !("email" in out));
});

test("đủ apps.view_* → nguyên bản", () => {
  const perms = new Set(HR_PERMISSIONS.map((p) => p.key).filter((k) => k.startsWith("apps.view_")));
  assert.ok("some_future_column" in redactApplication(app, perms));
});

test("redactInterview", () => {
  const row = { id: "i", application_id: "a", scheduled_at: "t", transcript: "x", evaluation: {}, score: 1, audio_url: "u", questions: [], future: 1 };
  const no = redactInterview(row, new Set<PermissionKey>(["apps.view_interviews"]));
  assert.deepEqual(Object.keys(no), ["id", "application_id", "scheduled_at"]);
  assert.equal(redactInterview(row, new Set<PermissionKey>(["apps.view_interview_analysis"])), row);
});
