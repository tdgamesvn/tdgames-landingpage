// node --test src/lib/hr-staff-email.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildPasswordResetEmail, buildStaffInviteEmail } from "./hr-staff-email.ts";
import { textToHtml } from "./hr-email.ts";

const link = "https://tdgamestudio.com/hr/set-password?token=abc123";

test("mail mời: subject, link, tên, vai, hạn 7 ngày", () => {
  const m = buildStaffInviteEmail({ displayName: "Lan", roleLabel: "Leader", link, invitedBy: "Tony" });
  assert.ok(m.subject.includes("Mời bạn vào TD Games HR"));
  assert.ok(m.text.includes(link));
  assert.ok(m.text.includes("Lan"));
  assert.ok(m.text.includes("Leader"));
  assert.ok(m.text.includes("Tony"));
  assert.ok(m.text.includes("Link có hiệu lực 7 ngày"));
  assert.ok(!m.text.includes("undefined") && !m.subject.includes("undefined"));
});

test("mail reset: hạn 1 giờ, câu bỏ qua, không có undefined", () => {
  const m = buildPasswordResetEmail({ displayName: "Lan", link });
  assert.ok(m.text.includes(link));
  assert.ok(m.text.includes("Lan"));
  assert.ok(m.text.includes("1 giờ"));
  assert.ok(m.text.includes("Nếu bạn không yêu cầu, hãy bỏ qua email này."));
  assert.ok(!m.text.includes("undefined") && !m.subject.includes("undefined"));
});

test("tên/invitedBy rỗng vẫn không ra undefined", () => {
  const m = buildStaffInviteEmail({ displayName: "", roleLabel: "HR", link, invitedBy: "" });
  assert.ok(!m.text.includes("undefined"));
  assert.ok(!buildPasswordResetEmail({ displayName: "", link }).text.includes("undefined"));
});

test("textToHtml: footer mặc định giữ nguyên, footerNote tuỳ chọn", () => {
  assert.ok(textToHtml("Xin chào").includes("Bạn nhận email này vì đã ứng tuyển tại TD Games."));
  const h = textToHtml("Xin chào", { footerNote: "Bạn nhận email này vì được mời sử dụng TD Games HR." });
  assert.ok(h.includes("được mời sử dụng TD Games HR"));
  assert.ok(!h.includes("đã ứng tuyển"));
});

test("mail mời đọc tự nhiên cả khi có / không có người mời", () => {
  const a = buildStaffInviteEmail({ displayName: "Lan", roleLabel: "HR", link, invitedBy: "Tony" });
  assert.ok(a.text.includes("Tony đã mời bạn vào TD Games HR"));
  const b = buildStaffInviteEmail({ displayName: "Lan", roleLabel: "HR", link, invitedBy: "" });
  assert.ok(b.text.includes("Bạn được mời vào TD Games HR"));
  assert.ok(!b.text.includes("bạn vào"));
});
