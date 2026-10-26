// node --test src/lib/hr-email.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildDraft,
  formatInterviewLong,
  getHrEmailConfig,
  isValidEmail,
  resolveRecipient,
  textToHtml,
  CANDIDATE_EMAIL_KINDS,
} from "./hr-email.ts";
import { GOOGLE_MAPS_URL } from "./company-location.ts";

const testCfg = getHrEmailConfig({});
const liveCfg = getHrEmailConfig({ HR_EMAIL_MODE: "live", RESEND_API_KEY: "re_x" });

test("config mặc định: chế độ test, gửi từ hr@, về tony@", () => {
  assert.deepEqual(testCfg, {
    mode: "test",
    from: "TD Games HR <hr@tdgamestudio.com>",
    replyTo: "hr@tdgamestudio.com",
    testTo: "tony@tdgamestudio.com",
    apiKey: null,
  });
});

test("chỉ đúng chuỗi 'live' mới bật gửi thật", () => {
  assert.equal(liveCfg.mode, "live");
  for (const v of ["LIVE", " live ", "true", "1", ""]) {
    assert.equal(getHrEmailConfig({ HR_EMAIL_MODE: v }).mode, "test", v);
  }
});

test("isValidEmail", () => {
  assert.equal(isValidEmail("a@b.co"), true);
  for (const v of ["", null, undefined, "abc", "a@b", "a b@c.com"]) {
    assert.equal(isValidEmail(v), false, String(v));
  }
});

test("chế độ test: gửi về hộp nội bộ, tiêu đề ghi email ứng viên", () => {
  assert.deepEqual(resolveRecipient(testCfg, "ung.vien@gmail.com", "Mời PV"), {
    to: "tony@tdgamestudio.com",
    subject: "[TEST → ung.vien@gmail.com] Mời PV",
    testMode: true,
  });
});

test("chế độ live: gửi tới ứng viên, tiêu đề giữ nguyên", () => {
  assert.deepEqual(resolveRecipient(liveCfg, "ung.vien@gmail.com", "Mời PV"), {
    to: "ung.vien@gmail.com",
    subject: "Mời PV",
    testMode: false,
  });
});

test("textToHtml escape HTML, tự gắn link, tách đoạn", () => {
  const html = textToHtml("<script>x</script>\n\nhttps://meet.google.com/abc-defg-hij");
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes('<a href="https://meet.google.com/abc-defg-hij"'));
  assert.ok((html.match(/<p[ >]/g) ?? []).length >= 2);
});

test("textToHtml không cho chèn thuộc tính qua URL", () => {
  const html = textToHtml('https://x.com/"onmouseover="alert(1)');
  assert.ok(!html.includes('"onmouseover'));
});

test("formatInterviewLong theo giờ VN", () => {
  assert.equal(formatInterviewLong("2026-10-19T08:30:00.000Z"), "15:30, Thứ Hai 19/10/2026");
});

const base = { candidateName: "Nguyễn Văn A", jobTitle: "Spine Animator" };
const at = "2026-10-19T08:30:00.000Z";

test("mời PV online có giờ + link Meet", () => {
  const d = buildDraft({
    ...base,
    kind: "interview_invite",
    interview: { scheduledAt: at, mode: "online", meetUrl: "https://meet.google.com/abc-defg-hij", round: 1 },
  });
  for (const s of ["Nguyễn Văn A", "Spine Animator", "15:30, Thứ Hai 19/10/2026", "https://meet.google.com/abc-defg-hij"]) {
    assert.ok(d.text.includes(s), s);
  }
  assert.ok(d.subject.includes("Spine Animator"));
});

test("mời PV offline có địa chỉ + Google Maps", () => {
  const d = buildDraft({
    ...base,
    kind: "interview_invite",
    interview: { scheduledAt: at, mode: "offline", meetUrl: null, round: 1 },
  });
  assert.ok(d.text.includes("505 Minh Khai"));
  assert.ok(d.text.includes(GOOGLE_MAPS_URL));
});

test("huỷ lịch ghi giờ cũ", () => {
  const d = buildDraft({ ...base, kind: "interview_cancel", prevScheduledAt: at });
  assert.ok(d.text.includes("15:30, Thứ Hai 19/10/2026"));
});

test("bài test có link nộp bài", () => {
  const d = buildDraft({ ...base, kind: "test_assignment", testUrl: "https://tdgamestudio.com/test/tok123" });
  assert.ok(d.text.includes("https://tdgamestudio.com/test/tok123"));
});

test("mọi loại mail: có chữ ký, không lọt undefined/null", () => {
  for (const kind of CANDIDATE_EMAIL_KINDS) {
    const d = buildDraft({
      ...base,
      kind,
      interview: { scheduledAt: at, mode: "offline", meetUrl: null, round: 2 },
      prevScheduledAt: at,
      testUrl: "https://tdgamestudio.com/test/tok123",
    });
    assert.ok(d.text.includes("Phòng Nhân sự"), kind);
    assert.ok(!/undefined|null/.test(d.text + d.subject), kind);
  }
});
