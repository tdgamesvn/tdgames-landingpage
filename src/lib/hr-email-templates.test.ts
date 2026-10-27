// node --test src/lib/hr-email-templates.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { buildDraft } from "./hr-email.ts";
import {
  CANDIDATE_EMAIL_KINDS,
  MBTI_TEST_URL,
  formatInterviewLong,
  type DraftInput,
} from "./hr-email-base.ts";
import { GOOGLE_MAPS_URL, OFFICE_ADDRESS } from "./company-location.ts";
import {
  DEFAULT_TEMPLATES,
  KIND_VARS,
  SAMPLE_DRAFT_INPUT,
  VAR_HELP,
  renderTemplate,
  templateVars,
  validateTemplate,
} from "./hr-email-templates.ts";

// Bản sao nguyên văn buildDraft cũ (trước khi có mẫu sửa được) để đối chiếu.
const SIGNATURE_LEGACY = [
  "Trân trọng,",
  "TD Games Studio — Phòng Nhân sự",
  "https://tdgamestudio.com · hr@tdgamestudio.com",
].join("\n");

function whereLinesLegacy(i: NonNullable<DraftInput["interview"]>): string[] {
  if (i.mode === "online" && i.meetUrl) {
    return ["- Hình thức: Online qua Google Meet", `- Link tham gia: ${i.meetUrl}`];
  }
  return [
    "- Hình thức: Trực tiếp tại văn phòng TD Games",
    `- Địa chỉ: ${OFFICE_ADDRESS}`,
    `- Bản đồ: ${GOOGLE_MAPS_URL}`,
  ];
}

function legacyBuildDraft(input: DraftInput): { subject: string; text: string } {
  const name = input.candidateName.trim() || "bạn";
  const job = input.jobTitle.trim() || "vị trí bạn ứng tuyển";
  const hello = `Chào ${name},`;
  const i = input.interview ?? null;
  const roundText = i && i.round > 1 ? ` (vòng ${i.round})` : "";

  let subject: string;
  let body: string[];

  switch (input.kind) {
    case "interview_invite":
      subject = `Thư mời phỏng vấn — ${job} | TD Games`;
      body = [
        `Cảm ơn bạn đã ứng tuyển vị trí ${job} tại TD Games. Chúng mình rất vui được mời bạn tham gia buổi phỏng vấn${roundText}:`,
        [
          i ? `- Thời gian: ${formatInterviewLong(i.scheduledAt)} (giờ Việt Nam)` : "- Thời gian: (HR bổ sung)",
          ...(i ? whereLinesLegacy(i) : []),
        ].join("\n"),
        ...(input.hasMbti
          ? []
          : [
              `Trước buổi phỏng vấn, bạn dành khoảng 10 phút làm giúp bài trắc nghiệm tính cách MBTI tại: ${MBTI_TEST_URL}\nLàm xong, bạn trả lời mail này kèm link (hoặc ảnh chụp) trang kết quả nhé.`,
            ]),
        "Bạn vui lòng trả lời mail này để xác nhận tham gia. Nếu khung giờ trên chưa phù hợp, cứ báo lại để chúng mình sắp xếp lịch khác nhé.",
      ];
      break;
    case "interview_reschedule":
      subject = `Thay đổi lịch phỏng vấn — ${job} | TD Games`;
      body = [
        `Lịch phỏng vấn${roundText} vị trí ${job} của bạn đã được cập nhật như sau:`,
        [
          i ? `- Thời gian mới: ${formatInterviewLong(i.scheduledAt)} (giờ Việt Nam)` : "- Thời gian mới: (HR bổ sung)",
          ...(i ? whereLinesLegacy(i) : []),
        ].join("\n"),
        "Xin lỗi bạn vì sự thay đổi này. Bạn vui lòng trả lời mail để xác nhận lịch mới giúp chúng mình nhé.",
      ];
      break;
    case "interview_cancel":
      subject = `Huỷ lịch phỏng vấn — ${job} | TD Games`;
      body = [
        input.prevScheduledAt
          ? `Buổi phỏng vấn vị trí ${job} vào lúc ${formatInterviewLong(input.prevScheduledAt)} đã được huỷ.`
          : `Buổi phỏng vấn vị trí ${job} đã được huỷ.`,
        "Chúng mình xin lỗi vì sự bất tiện này và sẽ liên hệ lại với bạn nếu có lịch mới.",
      ];
      break;
    case "test_assignment":
      subject = `Bài test — ${job} | TD Games`;
      body = [
        `Cảm ơn bạn đã quan tâm tới vị trí ${job} tại TD Games. Bước tiếp theo, chúng mình gửi bạn một bài test nhỏ.`,
        `Đề bài và chỗ nộp bài ở đây: ${input.testUrl ?? "(HR bổ sung link)"}`,
        "Khi mở link, bạn chọn giúp chúng mình ngày dự kiến nộp bài để tiện theo dõi. Nếu có câu hỏi về đề, cứ trả lời mail này nhé.",
      ];
      break;
    case "rejection":
      subject = `Kết quả ứng tuyển — ${job} | TD Games`;
      body = [
        `Cảm ơn bạn đã dành thời gian ứng tuyển vị trí ${job} tại TD Games.`,
        "Sau khi cân nhắc, chúng mình rất tiếc chưa thể tiếp tục cùng bạn ở thời điểm này. Hồ sơ của bạn sẽ được lưu lại và chúng mình sẽ liên hệ khi có vị trí phù hợp hơn.",
        "Chúc bạn nhiều thành công trên con đường sắp tới.",
      ];
      break;
    case "offer": {
      const salary = input.offer?.salary.trim() || "…";
      const startDate = input.offer?.startDate.trim() || "…";
      subject = `Thư mời làm việc — ${job} | TD Games`;
      body = [
        `Cảm ơn bạn đã dành thời gian tham gia phỏng vấn vị trí ${job} tại TD Games. Chúng tôi rất vui được gửi tới bạn lời mời làm việc:`,
        [`- Vị trí: ${job}`, `- Mức lương: ${salary}`, `- Ngày bắt đầu dự kiến: ${startDate}`].join("\n"),
        "Bạn vui lòng trả lời email này để xác nhận nhận offer, hoặc gửi lại bất kỳ câu hỏi nào — chúng tôi luôn sẵn sàng giải đáp.",
      ];
      break;
    }
  }

  return { subject, text: [hello, ...body, SIGNATURE_LEGACY].join("\n\n") };
}


const T0 = "2026-11-02T08:30:00.000Z";
const iv = (o: object = {}) => ({ scheduledAt: T0, mode: "online" as const, meetUrl: "https://meet.google.com/abc", round: 1, ...o });
const cases: DraftInput[] = [];
for (const hasMbti of [true, false, undefined]) {
  for (const interview of [iv(), iv({ round: 2 }), iv({ mode: "offline", meetUrl: null }), iv({ mode: "online", meetUrl: null }), null]) {
    for (const kind of ["interview_invite", "interview_reschedule"] as const) {
      cases.push({ kind, candidateName: "Nguyễn Văn A", jobTitle: "2D Artist", interview, hasMbti });
    }
  }
}
for (const prevScheduledAt of [T0, null, undefined]) {
  cases.push({ kind: "interview_cancel", candidateName: "A", jobTitle: "Dev", prevScheduledAt });
}
for (const testUrl of ["https://tdgamestudio.com/test/x", null, undefined]) {
  cases.push({ kind: "test_assignment", candidateName: "A", jobTitle: "Dev", testUrl });
}
cases.push({ kind: "rejection", candidateName: "A", jobTitle: "Dev" });
for (const offer of [null, undefined, { salary: "", startDate: "" }, { salary: " 20tr ", startDate: "01/12" }]) {
  cases.push({ kind: "offer", candidateName: "A", jobTitle: "Dev", offer });
}
for (const kind of CANDIDATE_EMAIL_KINDS) {
  cases.push({ kind, candidateName: "  ", jobTitle: "" });
}

test("mẫu mặc định render giống hệt buildDraft cũ cho mọi input mẫu", () => {
  assert.ok(cases.length > 40);
  for (const c of cases) {
    assert.deepEqual(buildDraft(c), legacyBuildDraft(c), JSON.stringify(c));
  }
});

test("mẫu mặc định chỉ dùng biến của loại đó + validate hợp lệ", () => {
  for (const k of CANDIDATE_EMAIL_KINDS) {
    assert.equal(validateTemplate(k, DEFAULT_TEMPLATES[k].subject, DEFAULT_TEMPLATES[k].body), null, k);
    for (const v of KIND_VARS[k]) assert.ok(VAR_HELP[v], `thiếu VAR_HELP ${v}`);
  }
});

test("validate: biến lạ → lỗi nêu tên biến", () => {
  assert.equal(
    validateTemplate("interview_invite", "Tiêu đề", "Chào {abc}"),
    "Biến {abc} không dùng được trong mẫu Mời phỏng vấn",
  );
  assert.match(validateTemplate("offer", "Tiêu đề {zzz}", "ok") ?? "", /\{zzz\}/);
});

test("validate: biến của loại khác → lỗi", () => {
  assert.match(validateTemplate("rejection", "T", "Lương {muc_luong}") ?? "", /\{muc_luong\}.*Báo kết quả/);
  assert.match(validateTemplate("offer", "T", "{doan_mbti}") ?? "", /\{doan_mbti\}/);
});

test("validate: độ dài tiêu đề / nội dung", () => {
  assert.ok(validateTemplate("offer", "", "x"));
  assert.ok(validateTemplate("offer", "   ", "x"));
  assert.ok(validateTemplate("offer", "x".repeat(201), "x"));
  assert.equal(validateTemplate("offer", "x".repeat(200), "x"), null);
  assert.ok(validateTemplate("offer", "x", ""));
  assert.ok(validateTemplate("offer", "x", "x".repeat(10001)));
  assert.equal(validateTemplate("offer", "x", "x".repeat(10000)), null);
  assert.ok(validateTemplate("khac", "x", "x"));
});

test("validate: mẫu hợp lệ → null; dấu ngoặc nhọn thường không bị coi là biến", () => {
  assert.equal(validateTemplate("rejection", "Chào {ten_ung_vien}", "Xin chào {ten_ung_vien}, {vi_tri} {chu_ky} {} { a b }"), null);
});

test("renderTemplate: thay đúng biến, biến không có giữ nguyên, không thay lồng", () => {
  const out = renderTemplate(
    { subject: "Offer {vi_tri}", body: "Lương {muc_luong} / {ngay_bat_dau} / {khong_co}" },
    { vi_tri: "Dev", muc_luong: "{vi_tri}", ngay_bat_dau: "01/12" },
  );
  assert.equal(out.subject, "Offer Dev");
  assert.equal(out.text, "Lương {vi_tri} / 01/12 / {khong_co}");
});

test("buildDraft với mẫu tuỳ chỉnh", () => {
  const d = buildDraft(
    { kind: "offer", candidateName: "Lan", jobTitle: "Artist", offer: { salary: "20tr", startDate: "" } },
    { subject: "Offer {vi_tri} cho {ten_ung_vien}", body: "Hi {ten_ung_vien}: {muc_luong}, {ngay_bat_dau}\n\n{chu_ky}" },
  );
  assert.equal(d.subject, "Offer Artist cho Lan");
  assert.match(d.text, /^Hi Lan: 20tr, …\n\nTrân trọng,/);
});

test("không có ≥3 newline liên tiếp, không khoảng trắng đầu/cuối (biến rỗng)", () => {
  for (const c of cases) {
    const { text } = buildDraft(c);
    assert.doesNotMatch(text, /\n{3,}/);
    assert.equal(text, text.trim());
  }
  const t = renderTemplate({ subject: "s", body: "\n\nA\n\n{doan_mbti}\n\n\n\nB\n\n" }, { doan_mbti: "" });
  assert.equal(t.text, "A\n\nB");
});

test("SAMPLE_DRAFT_INPUT: render sạch, không còn biến chưa thay", () => {
  for (const k of CANDIDATE_EMAIL_KINDS) {
    const s = SAMPLE_DRAFT_INPUT(k);
    assert.equal(s.kind, k);
    const d = buildDraft(s);
    assert.doesNotMatch(d.subject + d.text, /\{[a-z_]+\}/, k);
    assert.match(d.text, /Nguyễn Văn A/);
  }
  assert.equal(Object.keys(templateVars(SAMPLE_DRAFT_INPUT("offer"))).length, 12);
});
