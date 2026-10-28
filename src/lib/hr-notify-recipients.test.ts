// node --test src/lib/hr-notify-recipients.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  allowedMentionsFor, candidateRecipients, discordTagFor, pushBatches, pushTargets, withTag, type RecipientStaff,
} from "./hr-notify-recipients.ts";
import { effectivePermissions, HR_ROLES, type HrRole, type PermissionKey } from "./hr-permissions.ts";

const staff: RecipientStaff[] = [
  { id: "b", role: "boss", disabled: false, discord_user_id: "100000000000000001" },
  { id: "h1", role: "hr", disabled: false, discord_user_id: "100000000000000002" },
  { id: "h2", role: "hr", disabled: false, discord_user_id: "100000000000000003" },
  { id: "hOff", role: "hr", disabled: true, discord_user_id: "100000000000000009" },
  { id: "l1", role: "leader", disabled: false, discord_user_id: "100000000000000004" },
  { id: "l2", role: "leader", disabled: false, discord_user_id: "100000000000000005" },
  { id: "a1", role: "accountant", disabled: false, discord_user_id: "100000000000000006" },
  { id: "h3", role: "hr", disabled: false, discord_user_id: null },
];
const base = { staff, assigneeId: "h1", jobLeaderId: "l1" };
const sorted = (r: { userIds: string[] }) => [...r.userIds].sort();

test("Sếp luôn nhận + người phụ trách + leader của job (đổi trạng thái thường)", () => {
  const r = candidateRecipients({ ...base, event: "status", newStatus: "interview" });
  assert.deepEqual(sorted(r), ["b", "h1", "l1"]);
  assert.equal(r.everyone, false);
});

test("HR không phụ trách không còn nhận tự động", () => {
  for (const event of ["comment", "note", "status", "test_review", "test_submitted", "new_application", "interview_schedule", "interview_remind"] as const) {
    const r = candidateRecipients({ ...base, event });
    assert.ok(!r.userIds.includes("h2"), event);
    assert.ok(!r.userIds.includes("h3"), event);
  }
});

test("Leader đúng job; leader job khác không nhận; job chưa có leader → không leader nào", () => {
  const r = candidateRecipients({ ...base, event: "comment" });
  assert.ok(r.userIds.includes("l1"));
  assert.ok(!r.userIds.includes("l2"));
  const none = candidateRecipients({ ...base, jobLeaderId: null, event: "comment" });
  assert.ok(!none.userIds.includes("l1") && !none.userIds.includes("l2"));
});

test("Leader nhận: comment, ghi chú, trạng thái, nhắc PV, đặt lịch, nộp bài, hồ sơ mới; không nhận chấm bài / giao hồ sơ", () => {
  for (const event of ["comment", "note", "status", "interview_remind", "interview_schedule", "test_submitted", "new_application"] as const) {
    assert.ok(candidateRecipients({ ...base, event }).userIds.includes("l1"), event);
  }
  assert.ok(!candidateRecipients({ ...base, event: "test_review" }).userIds.includes("l1"));
  assert.ok(!candidateRecipients({ ...base, event: "assigned" }).userIds.includes("l1"));
});

test("Kế toán chỉ nhận khi hồ sơ chuyển sang offer", () => {
  assert.ok(candidateRecipients({ ...base, event: "status", newStatus: "offer" }).userIds.includes("a1"));
  assert.ok(!candidateRecipients({ ...base, event: "status", newStatus: "interview" }).userIds.includes("a1"));
  assert.ok(!candidateRecipients({ ...base, event: "comment", newStatus: "offer" }).userIds.includes("a1"));
});

test("Người được @tag trong comment có mặt (kể cả HR không phụ trách); id lạ / khoá bị bỏ", () => {
  const r = candidateRecipients({ ...base, event: "comment", mentions: ["h2", "nope", "hOff"] });
  assert.deepEqual(sorted(r), ["b", "h1", "h2", "l1"]);
});

test("Người thực hiện bị loại (kể cả Sếp / người phụ trách / người được tag)", () => {
  assert.ok(!candidateRecipients({ ...base, event: "note", actorId: "b" }).userIds.includes("b"));
  assert.ok(!candidateRecipients({ ...base, event: "note", actorId: "h1" }).userIds.includes("h1"));
  const r = candidateRecipients({ ...base, event: "comment", mentions: ["h2"], actorId: "h2" });
  assert.ok(!r.userIds.includes("h2"));
});

test("Tài khoản khoá bị loại (Sếp khoá, leader khoá, kế toán khoá)", () => {
  const off = staff.map((u) => (["b", "l1", "a1"].includes(u.id) ? { ...u, disabled: true } : u));
  const r = candidateRecipients({ ...base, staff: off, event: "status", newStatus: "offer" });
  assert.deepEqual(sorted(r), ["h1"]);
});

test("Chưa có người phụ trách → everyone + mọi HR chưa khoá (cùng Sếp, leader)", () => {
  const r = candidateRecipients({ ...base, assigneeId: null, event: "new_application" });
  assert.equal(r.everyone, true);
  assert.deepEqual(sorted(r), ["b", "h1", "h2", "h3", "l1"]);
  assert.ok(!r.userIds.includes("hOff"));
});

test("Người phụ trách bị khoá / không còn tồn tại → coi như chưa giao", () => {
  assert.equal(candidateRecipients({ ...base, assigneeId: "hOff", event: "comment" }).everyone, true);
  assert.equal(candidateRecipients({ ...base, assigneeId: "ghost", event: "comment" }).everyone, true);
});

test("Có người phụ trách → không everyone", () => {
  assert.equal(candidateRecipients({ ...base, event: "comment" }).everyone, false);
});

test("Giao hồ sơ: người mới nhận + Sếp, không everyone, loại người giao", () => {
  const r = candidateRecipients({ ...base, assigneeId: "h2", event: "assigned", actorId: "h1" });
  assert.deepEqual(sorted(r), ["b", "h2"]);
  assert.equal(r.everyone, false);
});

test("Không trùng id", () => {
  const r = candidateRecipients({ ...base, assigneeId: "l1", event: "comment", mentions: ["l1", "b"] });
  assert.deepEqual(sorted(r), ["b", "l1"]);
});

test("discordTagFor: tag người có Discord ID, allowed_mentions chỉ các id đó", () => {
  const d = discordTagFor({ userIds: ["b", "h1", "h3"], everyone: false }, staff);
  assert.equal(d.tag, "<@100000000000000001> <@100000000000000002>");
  assert.deepEqual(d.allowed_mentions, { parse: [], users: ["100000000000000001", "100000000000000002"] });
});

test("discordTagFor: không ai có ID, không cần everyone → không tag ai", () => {
  const d = discordTagFor({ userIds: ["h3"], everyone: false }, staff);
  assert.equal(d.tag, "");
  assert.deepEqual(d.allowed_mentions, { parse: [], users: [] });
});

test("discordTagFor: everyone → chỉ @everyone (không tag lẻ từng người) + parse everyone", () => {
  const d = discordTagFor({ userIds: ["b", "h1"], everyone: true }, staff);
  assert.equal(d.tag, "@everyone");
  assert.deepEqual(d.allowed_mentions, { parse: ["everyone"], users: [] });
  assert.equal(discordTagFor({ userIds: [], everyone: true }, []).tag, "@everyone");
});

test("discordTagFor: trùng Discord ID chỉ tag 1 lần; tài khoản khoá không tag", () => {
  const dup = [...staff, { id: "dup", role: "hr" as const, disabled: false, discord_user_id: "100000000000000002" }];
  assert.equal(discordTagFor({ userIds: ["h1", "dup"], everyone: false }, dup).tag, "<@100000000000000002>");
  assert.equal(discordTagFor({ userIds: ["hOff"], everyone: false }, staff).tag, "");
});

test("withTag: ghép tag + nội dung, không dư khoảng trắng", () => {
  assert.equal(withTag("", "hi"), "hi");
  assert.equal(withTag("<@1>", "hi"), "<@1> hi");
});

test("allowedMentionsFor: chỉ id được tag; @everyone giữ parse everyone", () => {
  assert.deepEqual(allowedMentionsFor("<@12345678901234567> <@12345678901234568> <@12345678901234567>"), {
    parse: [],
    users: ["12345678901234567", "12345678901234568"],
  });
  assert.deepEqual(allowedMentionsFor("@everyone"), { parse: ["everyone"], users: [] });
});

const perms = new Map<HrRole, Set<PermissionKey>>(HR_ROLES.map((r) => [r, effectivePermissions(r, [])]));
const statuses = [
  { key: "new", position: 10, kind: "open" as const },
  { key: "interview", position: 50, kind: "open" as const },
  { key: "offer", position: 60, kind: "won" as const },
  { key: "rejected", position: 70, kind: "lost" as const },
];

test("pushTargets: lọc quyền push.receive (kế toán mặc định không có) + khoá", () => {
  const ids = pushTargets(["b", "h1", "a1", "hOff"], staff, perms, { job_id: "j", status: "offer" }, statuses, "l1");
  assert.deepEqual(ids.sort(), ["b", "h1"]);
});

test("pushTargets: lọc phạm vi xem hồ sơ (leader job khác không nhận)", () => {
  const ids = pushTargets(["l1", "l2"], staff, perms, { job_id: "j", status: "new" }, statuses, "l1");
  assert.deepEqual(ids, ["l1"]);
});

test("pushTargets: vai bị thu push.receive thì không nhận; kế toán được bật + trong phạm vi thì nhận", () => {
  const p = new Map(perms);
  p.set("hr", effectivePermissions("hr", [{ role: "hr", permission: "push.receive", allowed: false }]));
  p.set("accountant", effectivePermissions("accountant", [{ role: "accountant", permission: "push.receive", allowed: true }]));
  assert.deepEqual(pushTargets(["h1", "a1"], staff, p, { job_id: "j", status: "offer" }, statuses, null), ["a1"]);
  assert.deepEqual(pushTargets(["a1"], staff, p, { job_id: "j", status: "new" }, statuses, null), []);
});

test("pushTargets: người phụ trách / người được tag (direct) nhận dù vai không có push.receive, vẫn phải xem được hồ sơ", () => {
  const p = new Map(perms);
  p.set("hr", effectivePermissions("hr", [{ role: "hr", permission: "push.receive", allowed: false }]));
  const app = { job_id: "j", status: "new" };
  // h1 (direct) vẫn nhận; h2 (broadcast) không; kế toán direct nhưng ngoài phạm vi → không.
  assert.deepEqual(pushTargets(["h1", "h2", "a1"], staff, p, app, statuses, "l1", ["h1", "a1"]), ["h1"]);
  // direct bị khoá → không.
  assert.deepEqual(pushTargets(["hOff"], staff, p, app, statuses, "l1", ["hOff"]), []);
  // kế toán direct + trong phạm vi (offer) → nhận dù mặc định không có push.receive.
  assert.deepEqual(pushTargets(["a1"], staff, perms, { job_id: "j", status: "offer" }, statuses, null, ["a1"]), ["a1"]);
});

const full = { title: "T", body: "nội dung nhạy cảm", url: "/hr", tag: "hr-note-x" };
const restricted = { title: "T", body: "Có cập nhật mới ở hồ sơ N — mở /hr để xem", url: "/hr", tag: "hr-note-x" };
const mFull = { title: "M", body: "N: @ai đó", url: "/hr", tag: "hr-mention-c" };
const mRestricted = { title: "M", body: "Có cập nhật mới ở hồ sơ N — mở /hr để xem", url: "/hr", tag: "hr-mention-c" };

test("pushBatches: thiếu quyền field → bản chung chung; đủ quyền → bản đầy đủ", () => {
  const p = new Map(perms);
  p.set("hr", effectivePermissions("hr", [{ role: "hr", permission: "apps.view_notes", allowed: false }]));
  const out = pushBatches({ targets: ["b", "h1", "l1"], staff, perms: p, perm: "apps.view_notes", push: full, restricted });
  assert.deepEqual(out, [
    { payload: full, userIds: ["b"] },
    { payload: restricted, userIds: ["h1", "l1"] },
  ]);
});

test("pushBatches: không yêu cầu quyền → ai cũng bản đầy đủ; nhóm rỗng bị bỏ", () => {
  assert.deepEqual(pushBatches({ targets: ["b", "l1"], staff, perms, perm: null, push: full, restricted }), [
    { payload: full, userIds: ["b", "l1"] },
  ]);
  assert.deepEqual(pushBatches({ targets: [], staff, perms, perm: "apps.view_notes", push: full, restricted }), []);
});

test("pushBatches: người được tag nhận bản mention (đầy đủ / chung chung theo quyền), người khác bản thường", () => {
  const p = new Map(perms);
  p.set("leader", effectivePermissions("leader", [{ role: "leader", permission: "apps.comment", allowed: false }]));
  const out = pushBatches({
    targets: ["b", "h1", "l1", "h2"],
    staff,
    perms: p,
    perm: "apps.comment",
    push: full,
    restricted,
    mentionIds: ["h2", "l1"],
    mentionPush: mFull,
    mentionRestricted: mRestricted,
  });
  assert.deepEqual(out, [
    { payload: mFull, userIds: ["h2"] },
    { payload: mRestricted, userIds: ["l1"] },
    { payload: full, userIds: ["b", "h1"] },
  ]);
});

test("pushBatches: leader mặc định không có apps.view_notes → ghi chú ra bản chung chung", () => {
  const out = pushBatches({ targets: ["l1"], staff, perms, perm: "apps.view_notes", push: full, restricted });
  assert.deepEqual(out, [{ payload: restricted, userIds: ["l1"] }]);
});
