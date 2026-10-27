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

test("textToHtml: dấu câu ngay sau URL không dính vào link", () => {
  const html = textToHtml("Link: https://tdgamestudio.com/test/abc. Hoặc (https://meet.google.com/x-y-z), nhé");
  assert.ok(html.includes('<a href="https://tdgamestudio.com/test/abc"'));
  assert.ok(html.includes('<a href="https://meet.google.com/x-y-z"'));
});

test("email design: header logo, footer địa chỉ, preheader ẩn", () => {
  const html = textToHtml("Chào A,\n\nCảm ơn bạn đã ứng tuyển.\n\nTrân trọng,\nTD Games Studio — Phòng Nhân sự");
  assert.ok(html.includes("https://cdn.tdgamestudio.com/landing/logoCompany/logo_td2.png"));
  assert.ok(html.includes("505 Minh Khai"));
  assert.ok(/display:none[^>]*>[^<]*Chào A/.test(html), "preheader");
});

test("email design: khối '- Nhãn: giá trị' thành bảng thông tin", () => {
  const html = textToHtml("Chào A,\n\n- Thời gian: 15:30, Thứ Hai 19/10/2026\n- Hình thức: Online qua Google Meet");
  assert.ok(/<td[^>]*>Thời gian<\/td>/.test(html));
  assert.ok(/<td[^>]*>15:30, Thứ Hai 19\/10\/2026<\/td>/.test(html));
});

test("email design: link Meet / bài test có nút bấm", () => {
  const meet = textToHtml("- Link tham gia: https://meet.google.com/abc-defg-hij");
  assert.ok(/<a href="https:\/\/meet\.google\.com\/abc-defg-hij"[^>]*>Tham gia Google Meet<\/a>/.test(meet));
  const t = textToHtml("Đề bài và chỗ nộp bài ở đây: https://tdgamestudio.com/test/tok123");
  assert.ok(/<a href="https:\/\/tdgamestudio\.com\/test\/tok123"[^>]*>Mở đề bài &amp; nộp bài<\/a>/.test(t));
});

test("mời PV: chưa có MBTI → kèm link trắc nghiệm TopCV + nút bấm", () => {
  const d = buildDraft({
    ...base,
    kind: "interview_invite",
    interview: { scheduledAt: at, mode: "offline", meetUrl: null, round: 1 },
    hasMbti: false,
  });
  assert.ok(d.text.includes("https://www.topcv.vn/mbti/lam-trac-nghiem"));
  assert.ok(d.text.includes("MBTI"));
  const html = textToHtml(d.text);
  assert.ok(/<a href="https:\/\/www\.topcv\.vn\/mbti\/lam-trac-nghiem"[^>]*>Làm trắc nghiệm MBTI<\/a>/.test(html));
});

test("mời PV: đã có MBTI → không nhắc làm lại; mail khác không có MBTI", () => {
  const d = buildDraft({
    ...base,
    kind: "interview_invite",
    interview: { scheduledAt: at, mode: "offline", meetUrl: null, round: 1 },
    hasMbti: true,
  });
  assert.ok(!d.text.includes("topcv.vn/mbti"));
  const r = buildDraft({ ...base, kind: "rejection", hasMbti: false });
  assert.ok(!r.text.includes("topcv.vn/mbti"));
});

// ── Task 8: mail offer + tự CC nội bộ ──

import { resolveCc, CC_ROLES, KIND_LABEL } from "./hr-email.ts";

test("offer: nháp chứa lương, ngày bắt đầu, tên job", () => {
  const d = buildDraft({
    kind: "offer",
    candidateName: "Lan",
    jobTitle: "Unity Dev",
    offer: { salary: "15.000.000đ", startDate: "01/11/2026" },
  });
  assert.ok(d.text.includes("15.000.000đ"));
  assert.ok(d.text.includes("01/11/2026"));
  assert.ok(d.text.includes("Unity Dev"));
  assert.ok(d.text.includes("Chào Lan,"));
  assert.equal(KIND_LABEL.offer, "Gửi offer");
});

test("offer: thiếu lương/ngày → giữ dòng với …", () => {
  const d = buildDraft({ kind: "offer", candidateName: "Lan", jobTitle: "Unity Dev" });
  assert.ok(d.text.includes("- Mức lương: …"));
  assert.ok(d.text.includes("- Ngày bắt đầu dự kiến: …"));
});

const staff = [
  { id: "b1", email: "Boss@td.com", role: "boss" as const, disabled: false },
  { id: "h1", email: "hr1@td.com", role: "hr" as const, disabled: false },
  { id: "h2", email: "hr2@td.com", role: "hr" as const, disabled: true },
  { id: "h3", email: "HR1@td.com", role: "hr" as const, disabled: false },
  { id: "a1", email: "acc@td.com", role: "accountant" as const, disabled: false },
  { id: "l1", email: "lead1@td.com", role: "leader" as const, disabled: false },
  { id: "l2", email: "lead2@td.com", role: "leader" as const, disabled: false },
];

test("resolveCc live + rejection: chỉ HR active, không trùng", () => {
  const r = resolveCc(liveCfg, "rejection", staff, "l1", "x@td.com");
  assert.deepEqual(r.ccPreview, ["hr1@td.com"]);
  assert.deepEqual(r.cc, ["hr1@td.com"]);
});

test("resolveCc offer: kế toán + HR + boss, không người gửi, không disabled", () => {
  const r = resolveCc(liveCfg, "offer", staff, null, "hr1@td.com");
  assert.deepEqual([...r.ccPreview].sort(), ["acc@td.com", "boss@td.com"]);
  const r2 = resolveCc(liveCfg, "offer", staff, null, "someone@td.com");
  assert.deepEqual([...r2.ccPreview].sort(), ["acc@td.com", "boss@td.com", "hr1@td.com"]);
  assert.ok(!r2.ccPreview.includes("hr2@td.com"));
});

test("resolveCc invite: có leader của job, không có leader khác", () => {
  const r = resolveCc(liveCfg, "interview_invite", staff, "l1", "x@td.com");
  assert.ok(r.ccPreview.includes("lead1@td.com"));
  assert.ok(!r.ccPreview.includes("lead2@td.com"));
  assert.ok(r.ccPreview.includes("hr1@td.com"));
  assert.deepEqual(resolveCc(liveCfg, "interview_invite", staff, null, "x@td.com").ccPreview, ["hr1@td.com"]);
});

test("resolveCc: leader bị disabled hoặc email sai bị loại", () => {
  const s = [
    { id: "l9", email: "l9@td.com", role: "leader" as const, disabled: true },
    { id: "h9", email: "not-an-email", role: "hr" as const, disabled: false },
  ];
  assert.deepEqual(resolveCc(liveCfg, "interview_invite", s, "l9", "").ccPreview, []);
});

test("resolveCc test mode: cc rỗng nhưng ccPreview đầy đủ", () => {
  const r = resolveCc(testCfg, "offer", staff, null, "");
  assert.deepEqual(r.cc, []);
  assert.deepEqual([...r.ccPreview].sort(), ["acc@td.com", "boss@td.com", "hr1@td.com"]);
});

test("CC_ROLES phủ mọi kind", () => {
  for (const k of CANDIDATE_EMAIL_KINDS) assert.ok(CC_ROLES[k].length > 0, k);
});

test("resolveCc: Sếp là Leader của job → được CC ở mail mời PV", () => {
  const r = resolveCc(liveCfg, "interview_invite", staff, "b1", "x@td.com");
  assert.deepEqual(r.ccPreview, ["boss@td.com", "hr1@td.com"]);
});
