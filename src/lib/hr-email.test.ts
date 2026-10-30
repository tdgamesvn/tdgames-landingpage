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
    hiring: "hiring@tdgamestudio.com",
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
  assert.ok(html.includes("https://cdn.tdgamestudio.com/landing/logoCompany/mail-header-dark-v2.png"));
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

import { resolveCc, replyToFor, fromFor, KIND_LABEL } from "./hr-email.ts";

test("offer: nháp có chức danh, ngày bắt đầu, tên job; không lộ lương", () => {
  const d = buildDraft({
    kind: "offer",
    candidateName: "Lan",
    jobTitle: "Unity Dev",
    offer: { start: "8:45, Thứ Hai 02/11/2026" },
  });
  assert.ok(!/\d{1,3}(\.\d{3}){2}/.test(d.text)); // không có số tiền
  assert.ok(d.text.includes("8:45, Thứ Hai 02/11/2026"));
  assert.ok(d.text.includes("Unity Dev"));
  assert.ok(d.text.includes("Xin chào Lan,"));
  assert.equal(KIND_LABEL.offer, "Gửi offer");
});

test("offer: thiếu dữ liệu thư mời → giữ dòng với …", () => {
  const d = buildDraft({ kind: "offer", candidateName: "Lan", jobTitle: "Unity Dev" });
  assert.ok(d.text.includes("- Chức danh: Unity Dev"));
  assert.ok(d.text.includes("- Ngày bắt đầu: …"));
});

const staff = [
  { id: "b1", email: "Boss@td.com", role: "boss" as const, disabled: false },
  { id: "h1", email: "hr1@td.com", role: "hr" as const, disabled: false },
  { id: "h2", email: "hr2@td.com", role: "hr" as const, disabled: true },
  { id: "h3", email: "hr3@td.com", role: "hr" as const, disabled: false },
  { id: "a1", email: "acc@td.com", role: "accountant" as const, disabled: false },
  { id: "l1", email: "lead1@td.com", role: "leader" as const, disabled: false },
  { id: "l2", email: "lead2@td.com", role: "leader" as const, disabled: false },
];
const HIRING = "hiring@tdgamestudio.com";

// Luật CC (sếp chốt 2026-10-28): luôn hiring@ + người support; mời/đổi/huỷ PV + bài test thêm Leader job;
// offer thêm Kế toán + Sếp. Không CC toàn bộ HR, không CC Sếp ngoài offer.
test("resolveCc rejection: chỉ hiring@ + người support (không HR khác, không Sếp)", () => {
  const r = resolveCc(liveCfg, "rejection", staff, { assigneeId: "h3", jobLeaderId: "l1", senderEmail: "x@td.com" });
  assert.deepEqual(r.ccPreview, [HIRING, "hr3@td.com"]);
  assert.deepEqual(r.cc, r.ccPreview);
  assert.deepEqual(r.fixed, [HIRING]);
});

test("resolveCc on_hold / position_filled: như rejection — hiring@ + người support, không Leader", () => {
  for (const kind of ["on_hold", "position_filled"] as const) {
    const r = resolveCc(liveCfg, kind, staff, { assigneeId: "h3", jobLeaderId: "l1", senderEmail: "x@td.com" });
    assert.deepEqual(r.ccPreview, [HIRING, "hr3@td.com"], kind);
  }
});

test("resolveCc: người support là người gửi → không CC lại; chưa có support → chỉ hiring@", () => {
  assert.deepEqual(resolveCc(liveCfg, "rejection", staff, { assigneeId: "h3", jobLeaderId: null, senderEmail: "HR3@td.com" }).ccPreview, [HIRING]);
  assert.deepEqual(resolveCc(liveCfg, "rejection", staff, { assigneeId: null, jobLeaderId: null, senderEmail: "" }).ccPreview, [HIRING]);
});

test("resolveCc mời PV / đổi / huỷ / bài test: thêm Leader của job (không leader khác)", () => {
  for (const kind of ["interview_invite", "interview_reschedule", "interview_cancel", "test_assignment"] as const) {
    const r = resolveCc(liveCfg, kind, staff, { assigneeId: "h1", jobLeaderId: "l1", senderEmail: "x@td.com" });
    assert.deepEqual(r.ccPreview, [HIRING, "hr1@td.com", "lead1@td.com"], kind);
  }
  // Sếp kiêm Leader job → được CC ở mail mời PV.
  const b = resolveCc(liveCfg, "interview_invite", staff, { assigneeId: null, jobLeaderId: "b1", senderEmail: "" });
  assert.deepEqual(b.ccPreview, [HIRING, "boss@td.com"]);
});

test("resolveCc offer: hiring@ + Kế toán + Sếp; KHÔNG người support, không Leader; bỏ người gửi + tài khoản khoá", () => {
  const r = resolveCc(liveCfg, "offer", staff, { assigneeId: "h1", jobLeaderId: "l1", senderEmail: "acc@td.com" });
  assert.deepEqual(r.ccPreview, [HIRING, "boss@td.com"]);
  const r2 = resolveCc(liveCfg, "offer", staff, { assigneeId: "h2", jobLeaderId: null, senderEmail: "x@td.com" });
  assert.deepEqual(r2.ccPreview, [HIRING, "acc@td.com", "boss@td.com"]);
});

test("resolveCc test mode: cc rỗng nhưng ccPreview đầy đủ", () => {
  const r = resolveCc(testCfg, "offer", staff, { assigneeId: "h1", jobLeaderId: null, senderEmail: "" });
  assert.deepEqual(r.cc, []);
  assert.deepEqual(r.ccPreview, [HIRING, "acc@td.com", "boss@td.com"]);
});

test("replyToFor: người support (active) + hiring@; không có → hiring@", () => {
  assert.deepEqual(replyToFor(liveCfg, { email: "HR1@td.com", disabled: false }), ["hr1@td.com", HIRING]);
  assert.deepEqual(replyToFor(liveCfg, { email: "hr2@td.com", disabled: true }), [HIRING]);
  assert.deepEqual(replyToFor(liveCfg, null), [HIRING]);
});

test("replyToFor danh sách (mail offer → Kế toán): bỏ khoá, gộp trùng, luôn thêm hiring@", () => {
  assert.deepEqual(
    replyToFor(liveCfg, [
      { email: "Acc@td.com", disabled: false },
      { email: "acc@td.com", disabled: false },
      { email: "acc2@td.com", disabled: true },
    ]),
    ["acc@td.com", HIRING],
  );
  assert.deepEqual(replyToFor(liveCfg, []), [HIRING]);
});

test("fromFor (mail ứng viên): gửi từ hiring@, tên người support · TD Games; không có → TD Games Tuyển dụng", () => {
  assert.equal(fromFor(liveCfg, "Nguyễn Thị Minh Phương"), '"Nguyễn Thị Minh Phương · TD Games" <hiring@tdgamestudio.com>');
  assert.equal(fromFor(liveCfg, null), '"TD Games Tuyển dụng" <hiring@tdgamestudio.com>');
  assert.equal(fromFor(liveCfg, 'A "B" <c@x>\r\n'), '"A B c@x · TD Games" <hiring@tdgamestudio.com>');
});

test("textToHtml: header là ảnh banner nền tối (không mất logo khi Gmail đảo màu ở chế độ tối)", () => {
  const html = textToHtml("Chào bạn");
  assert.ok(html.includes("https://cdn.tdgamestudio.com/landing/logoCompany/mail-header-dark-v2.png"));
  assert.ok(!html.includes("logo_td2.png"));
});

test("textToHtml: link đặt mật khẩu /hr thành nút 'Đặt mật khẩu'", () => {
  const html = textToHtml("Bấm link:\n\nhttps://tdgamestudio.com/hr/set-password?token=abc_DEF-123");
  assert.ok(html.includes(">Đặt mật khẩu</a>"));
  assert.ok(html.includes('href="https://tdgamestudio.com/hr/set-password?token=abc_DEF-123"'));
});

test("textToHtml: chân mail ứng viên ghi hiring@; mail nội bộ truyền footerEmail hr@", () => {
  assert.ok(textToHtml("Chào bạn").includes("mailto:hiring@tdgamestudio.com"));
  assert.ok(!textToHtml("Chào bạn").includes("hr@tdgamestudio.com\""));
  const staff = textToHtml("Chào bạn", { footerEmail: "hr@tdgamestudio.com" });
  assert.ok(staff.includes("mailto:hr@tdgamestudio.com"));
});
