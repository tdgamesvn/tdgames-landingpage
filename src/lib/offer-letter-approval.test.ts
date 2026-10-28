// node --test src/lib/offer-letter-approval.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canReview, canSendOffer, canSubmit, nextApprovalOnSave, offerDataChanged, stableStringify,
  validateReviewInput, offerApprovalRecipients, isApprovalStatus,
} from "./offer-letter-approval.ts";
import { sanitizeOfferLetter } from "./offer-letter.ts";

test("nextApprovalOnSave: sếp lưu → approved dù trạng thái/dữ liệu thế nào", () => {
  for (const prev of ["draft", "pending", "approved", "changes_requested", null] as const) {
    for (const dataChanged of [true, false]) {
      assert.equal(nextApprovalOnSave({ actorRole: "boss", prevStatus: prev, dataChanged }), "approved");
    }
  }
});

test("nextApprovalOnSave: người khác — dữ liệu không đổi giữ nguyên trạng thái", () => {
  for (const prev of ["draft", "pending", "approved", "changes_requested"] as const) {
    assert.equal(nextApprovalOnSave({ actorRole: "accountant", prevStatus: prev, dataChanged: false }), prev);
  }
});

test("nextApprovalOnSave: người khác đổi dữ liệu → draft; thư mới (chưa có) → draft", () => {
  for (const prev of ["draft", "pending", "approved", "changes_requested"] as const) {
    assert.equal(nextApprovalOnSave({ actorRole: "hr", prevStatus: prev, dataChanged: true }), "draft");
  }
  assert.equal(nextApprovalOnSave({ actorRole: "hr", prevStatus: null, dataChanged: true }), "draft");
  assert.equal(nextApprovalOnSave({ actorRole: "hr", prevStatus: null, dataChanged: false }), "draft");
});

test("canSubmit / canReview / canSendOffer", () => {
  assert.equal(canSubmit("draft"), true);
  assert.equal(canSubmit("changes_requested"), true);
  assert.equal(canSubmit("pending"), false);
  assert.equal(canSubmit("approved"), false);
  assert.equal(canReview("boss", "pending"), true);
  assert.equal(canReview("boss", "draft"), false);
  assert.equal(canReview("hr", "pending"), false);
  assert.equal(canReview("accountant", "pending"), false);
  assert.equal(canSendOffer("approved"), true);
  for (const s of ["draft", "pending", "changes_requested", null] as const) assert.equal(canSendOffer(s), false);
});

test("stableStringify: thứ tự key không ảnh hưởng, mảng giữ thứ tự", () => {
  assert.equal(stableStringify({ b: 1, a: { d: 2, c: [3, { y: 1, x: 2 }] } }), stableStringify({ a: { c: [3, { x: 2, y: 1 }], d: 2 }, b: 1 }));
  assert.notEqual(stableStringify([1, 2]), stableStringify([2, 1]));
});

test("offerDataChanged: so sánh sau sanitize (key thừa / khoảng trắng không tính là đổi)", () => {
  const a = sanitizeOfferLetter({ candidateName: "An", jobTitle: "Dev", baseSalary: 1000000 });
  const b = sanitizeOfferLetter({ candidateName: " An ", jobTitle: "Dev", baseSalary: 1000000, junk: 1 });
  assert.equal(offerDataChanged(a, b), false);
  assert.equal(offerDataChanged(a, { ...a, baseSalary: 2000000 }), true);
  assert.equal(offerDataChanged(a, { ...a, allowances: [{ name: "x", amount: 1 }] }), true);
  assert.equal(offerDataChanged(null, a), true);
});

test("validateReviewInput", () => {
  assert.deepEqual(validateReviewInput({ decision: "approve" }), { ok: true, decision: "approve", note: "" });
  assert.deepEqual(validateReviewInput({ decision: "approve", note: " ok " }), { ok: true, decision: "approve", note: "ok" });
  assert.equal(validateReviewInput({ decision: "changes" }).ok, false);
  assert.equal(validateReviewInput({ decision: "changes", note: "   " }).ok, false);
  assert.equal(validateReviewInput({ decision: "changes", note: "x".repeat(501) }).ok, false);
  assert.deepEqual(validateReviewInput({ decision: "changes", note: "x".repeat(500) }), { ok: true, decision: "changes", note: "x".repeat(500) });
  assert.equal(validateReviewInput({ decision: "nope" }).ok, false);
  assert.equal(validateReviewInput(null).ok, false);
});

test("isApprovalStatus", () => {
  assert.equal(isApprovalStatus("pending"), true);
  assert.equal(isApprovalStatus("x"), false);
});

const staff = [
  { id: "b1", role: "boss" as const, disabled: false, discord_user_id: "11111111111111111" },
  { id: "b2", role: "boss" as const, disabled: false, discord_user_id: null },
  { id: "b3", role: "boss" as const, disabled: true, discord_user_id: "33333333333333333" },
  { id: "a1", role: "accountant" as const, disabled: false, discord_user_id: "22222222222222222" },
  { id: "h1", role: "hr" as const, disabled: false, discord_user_id: null },
];

test("offerApprovalRecipients submitted: mọi Sếp chưa khoá; có Discord ID → không everyone", () => {
  const r = offerApprovalRecipients({ kind: "submitted", staff, submitterId: "a1", assigneeId: "h1" });
  assert.deepEqual(r.userIds, ["b1", "b2"]);
  assert.equal(r.everyone, false);
});

test("offerApprovalRecipients submitted: không Sếp nào có Discord ID → everyone", () => {
  const r = offerApprovalRecipients({
    kind: "submitted",
    staff: staff.map((u) => ({ ...u, discord_user_id: u.role === "boss" ? null : u.discord_user_id })),
    submitterId: "a1",
    assigneeId: null,
  });
  assert.equal(r.everyone, true);
});

test("offerApprovalRecipients reviewed: người gửi + người support, không trùng, bỏ khoá, không everyone", () => {
  const r = offerApprovalRecipients({ kind: "reviewed", staff, submitterId: "a1", assigneeId: "h1", actorId: "b1" });
  assert.deepEqual(r.userIds, ["a1", "h1"]);
  assert.equal(r.everyone, false);
  const same = offerApprovalRecipients({ kind: "reviewed", staff, submitterId: "a1", assigneeId: "a1" });
  assert.deepEqual(same.userIds, ["a1"]);
  const none = offerApprovalRecipients({ kind: "reviewed", staff, submitterId: null, assigneeId: null });
  assert.deepEqual(none.userIds, []);
});

test("offerApprovalRecipients reviewed: loại người thực hiện (sếp duyệt thư tự gửi)", () => {
  const r = offerApprovalRecipients({ kind: "reviewed", staff, submitterId: "b1", assigneeId: "h1", actorId: "b1" });
  assert.deepEqual(r.userIds, ["h1"]);
});

import { sameVersion, previousReviewNote } from "./offer-letter-approval.ts";

test("sameVersion: so theo thời điểm, khác định dạng vẫn khớp; thiếu/sai → false", () => {
  assert.equal(sameVersion("2026-10-28T05:00:00.123+00:00", "2026-10-28T05:00:00.123Z"), true);
  assert.equal(sameVersion("2026-10-28T05:00:00.123Z", "2026-10-28T05:00:00.124Z"), false);
  assert.equal(sameVersion(undefined, "2026-10-28T05:00:00Z"), false);
  assert.equal(sameVersion("x", "2026-10-28T05:00:00Z"), false);
  assert.equal(sameVersion("2026-10-28T05:00:00Z", null), false);
});

test("previousReviewNote: chỉ khi draft, có ghi chú và Sếp phản hồi sau lần gửi", () => {
  const base = { status: "draft" as const, submitted_at: "2026-10-28T05:00:00Z", reviewed_at: "2026-10-28T06:00:00Z", review_note: "sửa lương" };
  assert.equal(previousReviewNote(base), "sửa lương");
  assert.equal(previousReviewNote({ ...base, reviewed_at: "2026-10-28T04:00:00Z" }), null);
  assert.equal(previousReviewNote({ ...base, status: "pending" as never }), null);
  assert.equal(previousReviewNote({ ...base, review_note: null }), null);
  assert.equal(previousReviewNote({ ...base, submitted_at: null }), "sửa lương");
});
