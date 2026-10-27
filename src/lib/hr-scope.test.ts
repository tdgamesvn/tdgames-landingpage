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

test("leader giữ message, mất referred_by/source", () => {
  const a = { ...app, message: "m", available_hours_per_week: 20, referred_by: "r", source: "s" };
  const out = redactApplication(a, effectivePermissions("leader", []));
  assert.ok("message" in out && "available_hours_per_week" in out);
  assert.ok(!("referred_by" in out) && !("source" in out));
});

test("có view_ai thì giữ key ai_* / rank* lạ", () => {
  const out = redactApplication(app, new Set<PermissionKey>(["apps.view_ai"]));
  assert.ok("ai_custom" in out && "rank_score" in out && !("email" in out));
});

test("đủ apps.view_* → nguyên bản", () => {
  const perms = new Set(HR_PERMISSIONS.map((p) => p.key).filter((k) => k.startsWith("apps.view_")));
  assert.ok("some_future_column" in redactApplication(app, perms));
});

test("redactInterview với đủ cột thật", () => {
  const row = {
    id: "i", application_id: "a", round: 1, title: "t", questions: [], audio_url: "u", audio_key: "k",
    audio_bytes: 1, transcript: "x", transcript_source: "s", evaluation: {}, score: 1,
    created_at: "c", updated_at: "u", scheduled_at: "t", mode: "online", meet_url: "m",
    reminded_at: "r", analysis_status: "done", analysis_error: "e", analysis_started_at: "s", future: 1,
  };
  const no = redactInterview(row, new Set<PermissionKey>(["apps.view_interviews"]));
  assert.deepEqual(Object.keys(no).sort(), [
    "analysis_status", "application_id", "created_at", "id", "meet_url", "mode",
    "reminded_at", "round", "scheduled_at", "title", "updated_at",
  ]);
  assert.equal(redactInterview(row, new Set<PermissionKey>(["apps.view_interview_analysis"])), row);
});

test("redactApplication gỡ nested interview_sessions và jobs", () => {
  const a = {
    id: "a", job_id: "j1", status: "new",
    jobs: { id: "j1", title: "T", slug: "t", leader_user_id: "u", secret: 1 },
    interview_sessions: [{ id: "i", scheduled_at: "t", meet_url: "m", transcript: "x", questions: [1], score: 5 }],
  };
  const perms = effectivePermissions("leader", []);
  const out = redactApplication(a, perms) as typeof a;
  assert.deepEqual(out.jobs, { id: "j1", title: "T", slug: "t" });
  assert.deepEqual(out.interview_sessions, [{ id: "i", scheduled_at: "t", meet_url: "m" }]);
  const noIv = new Set<PermissionKey>(["apps.view_tests"]);
  assert.ok(!("interview_sessions" in redactApplication(a, noIv)));
  assert.equal(a.interview_sessions[0].transcript, "x");
});

test("kế toán: status đảo thứ tự theo position; thiếu interview + offer_status vẫn thấy", () => {
  const acc = { ...base, role: "accountant" as const };
  const shuffled = [...statuses].reverse();
  assert.deepEqual(accountantStatusKeys(shuffled).sort(), ["interview", "offer"]);
  const noIv = statuses.filter((s) => s.key !== "interview");
  const s2 = { ...acc, statuses: noIv };
  assert.equal(inScope(s2, { job_id: "j", status: "offer" }), false);
  assert.equal(inScope(s2, { job_id: "j", status: "offer", offer_status: "accepted" }), true);
});

// ── redactEmailRow ──
import { redactEmailRow } from "./hr-scope.ts";

const allPerms = new Set<PermissionKey>(HR_PERMISSIONS.map((p) => p.key));
const without = (...ks: PermissionKey[]) => new Set<PermissionKey>([...allPerms].filter((k) => !ks.includes(k)));

const mailRow = {
  id: "m1", kind: "test_assignment", to_email: "c@x.com", sent_to: "tony@td.com", cc_emails: ["a@td.com"],
  subject: "[TEST → c@x.com] Bài test", body_text: "Link: https://tdgamestudio.com/test/abc123_-X. Hết",
  body_html: '<a href="https://tdgamestudio.com/test/abc123_-X">m</a>',
};

test("redactEmailRow: đủ quyền → nguyên bản", () => {
  assert.deepEqual(redactEmailRow(mailRow, allPerms), mailRow);
});

test("redactEmailRow: thiếu view_contact → gỡ địa chỉ + subject [TEST]", () => {
  const r = redactEmailRow(mailRow, without("apps.view_contact")) as Record<string, unknown>;
  assert.ok(!("to_email" in r) && !("sent_to" in r) && !("cc_emails" in r));
  assert.equal(r.subject, "[TEST] Bài test");
  assert.equal(r.body_text, mailRow.body_text);
});

test("redactEmailRow: thiếu view_tests → che token trong test_assignment", () => {
  const r = redactEmailRow(mailRow, without("apps.view_tests")) as Record<string, string>;
  assert.equal(r.body_text, "Link: https://tdgamestudio.com/test/…. Hết");
  assert.equal(r.body_html, '<a href="https://tdgamestudio.com/test/…">m</a>');
  assert.equal(r.to_email, "c@x.com");
  const other = redactEmailRow({ ...mailRow, kind: "rejection" }, without("apps.view_tests"));
  assert.equal(other.body_text, mailRow.body_text);
});

test("redactEmailRow: email ứng viên chứa ']' vẫn gỡ hết địa chỉ khỏi subject", () => {
  const r = redactEmailRow(
    { ...mailRow, kind: "rejection", subject: '[TEST → "a]b"@x.com] Kết quả ứng tuyển' },
    without("apps.view_contact"),
  ) as Record<string, unknown>;
  assert.equal(r.subject, "[TEST] Kết quả ứng tuyển");
});
