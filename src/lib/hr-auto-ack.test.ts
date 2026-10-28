// node --test src/lib/hr-auto-ack.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { AUTO_ACK_HOURLY_CAP, AUTO_ACK_KEY, isAutoAckEnabled, isStrictAckEmail, sanitizeAckName, shouldSendAck } from "./hr-auto-ack.ts";
import { buildDraft, getHrEmailConfig, resolveRecipient, CANDIDATE_EMAIL_KINDS, KIND_LABEL } from "./hr-email.ts";
import { isSystemOnlyKind } from "./hr-email-base.ts";
import { KIND_VARS, validateTemplate, DEFAULT_TEMPLATES } from "./hr-email-templates.ts";

test("isAutoAckEnabled: chỉ 'off' là tắt; không có dòng = bật", () => {
  assert.equal(AUTO_ACK_KEY, "hr_auto_ack");
  assert.equal(isAutoAckEnabled(undefined), true);
  assert.equal(isAutoAckEnabled(null), true);
  assert.equal(isAutoAckEnabled("on"), true);
  assert.equal(isAutoAckEnabled(""), true);
  assert.equal(isAutoAckEnabled("off"), false);
  assert.equal(isAutoAckEnabled(" OFF "), false);
});

test("shouldSendAck", () => {
  const ok = { enabled: true, email: "a@b.co", recentCount: 0 };
  assert.deepEqual(shouldSendAck(ok), { send: true });
  assert.deepEqual(shouldSendAck({ ...ok, enabled: false }), { send: false, reason: "disabled" });
  assert.deepEqual(shouldSendAck({ ...ok, email: "sai" }), { send: false, reason: "invalid_email" });
  assert.deepEqual(shouldSendAck({ ...ok, email: null }), { send: false, reason: "invalid_email" });
  assert.deepEqual(shouldSendAck({ ...ok, recentCount: 1 }), { send: false, reason: "duplicate" });
});

test("loại application_received: nhãn, biến chung, chỉ hệ thống gửi", () => {
  assert.ok(CANDIDATE_EMAIL_KINDS.includes("application_received"));
  assert.equal(KIND_LABEL.application_received, "Cảm ơn ứng tuyển");
  assert.deepEqual(KIND_VARS.application_received, ["ten_ung_vien", "vi_tri", "chu_ky"]);
  assert.equal(isSystemOnlyKind("application_received"), true);
  assert.equal(isSystemOnlyKind("rejection"), false);
  const t = DEFAULT_TEMPLATES.application_received;
  assert.equal(validateTemplate("application_received", t.subject, t.body), null);
  assert.match(validateTemplate("application_received", "x {vong}", t.body) ?? "", /vong/);
});

test("mẫu mặc định render đúng văn bản sếp duyệt, test mode đổi tiêu đề", () => {
  const d = buildDraft({
    kind: "application_received",
    candidateName: "Lan",
    jobTitle: "2D Artist",
    support: { name: "Phương", phone: "0385456273" },
  });
  assert.equal(d.subject, "[TD Games] Đã nhận hồ sơ ứng tuyển — 2D Artist");
  assert.ok(d.text.startsWith("Chào Lan,\n\nCảm ơn bạn đã quan tâm và ứng tuyển vị trí 2D Artist tại TD Games."));
  assert.ok(d.text.includes("Chúc bạn một ngày tốt lành!\n\nTrân trọng,\nPhương — Phòng Nhân sự TD Games\n0385 456 273"));
  const r = resolveRecipient(getHrEmailConfig({}), "lan@x.vn", d.subject);
  assert.equal(r.testMode, true);
  assert.equal(r.subject, "[TEST → lan@x.vn] [TD Games] Đã nhận hồ sơ ứng tuyển — 2D Artist");
});

test("shouldSendAck: job không hoạt động, trần giờ", () => {
  const ok = { enabled: true, email: "a@b.co", recentCount: 0 };
  assert.deepEqual(shouldSendAck({ ...ok, jobActive: false }), { send: false, reason: "job_inactive" });
  assert.deepEqual(shouldSendAck({ ...ok, jobActive: true, hourlyCount: AUTO_ACK_HOURLY_CAP - 1 }), { send: true });
  assert.deepEqual(shouldSendAck({ ...ok, jobActive: true, hourlyCount: AUTO_ACK_HOURLY_CAP }), { send: false, reason: "hourly_cap" });
});

test("isStrictAckEmail", () => {
  assert.equal(isStrictAckEmail("lan.nguyen@gmail.com"), true);
  // "+tag" cho phép lách chống gửi trùng (cùng hộp thư, khác chuỗi) → không gửi ack tự động.
  assert.equal(isStrictAckEmail("lan.nguyen+x@gmail.com"), false);
  for (const bad of ["a@b.co,c@d.co", "a@b.co;c@d.co", "a@b.co c@d.co", "<a@b.co>", 'a"@b.co', "o'x@b.co", "a@b.co\n", " ", "", null, undefined, "x".repeat(250) + "@b.co"]) {
    assert.equal(isStrictAckEmail(bad as string), bad === "a@b.co\n" ? true : false, String(bad));
  }
});

test("sanitizeAckName", () => {
  assert.equal(sanitizeAckName("Nguyễn Văn A"), "Nguyễn Văn A");
  assert.equal(sanitizeAckName("Mary-Jane O'Neil"), "Mary-Jane O'Neil");
  // Allowlist: chỉ chữ cái (có dấu), khoảng trắng, gạch nối, nháy đơn — mọi ký tự khác → "bạn".
  for (const bad of ["Click http://evil.com", "www.x.vn", "a@b.co", "visit evil.xyz now", "promo.com", "evil。com", "Win $100", "Lan 2", "", "  "]) {
    assert.equal(sanitizeAckName(bad), "bạn", bad);
  }
  assert.equal(sanitizeAckName("An\u0000\n  Bình"), "An Bình");
  assert.equal(sanitizeAckName("x".repeat(100)), "bạn");
});
