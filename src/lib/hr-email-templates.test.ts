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
  "hiring@tdgamestudio.com · https://tdgamestudio.com",
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
    case "application_received":
      subject = `[TD Games] Đã nhận hồ sơ ứng tuyển — ${job}`;
      body = [
        `Cảm ơn bạn đã quan tâm và ứng tuyển vị trí ${job} tại TD Games. Chúng mình đã nhận được hồ sơ của bạn.`,
        "Bộ phận tuyển dụng sẽ xem xét hồ sơ và phản hồi bạn sớm nhất có thể. Trong thời gian này, nếu cần bổ sung thông tin (CV, portfolio…) hoặc có câu hỏi, bạn cứ trả lời trực tiếp email này nhé.",
        "Chúc bạn một ngày tốt lành!",
      ];
      break;
    case "offer": {
      // Mẫu offer mới (2026-10-28, có thư mời PDF đính kèm) — thay đổi có chủ đích, không còn lương trong thân mail.
      const o = input.offer ?? null;
      const v = (s: string | undefined) => s?.trim() || "…";
      subject = `[TD Games] Thư mời nhận việc — ${job}`;
      const text = [
        `Xin chào ${name},`,
        `Thay mặt TD Games, cảm ơn bạn đã dành thời gian tham gia quá trình tuyển dụng. Sau quá trình cân nhắc kỹ, chúng tôi rất vui thông báo bạn đã vượt qua vòng phỏng vấn và được lựa chọn cho vị trí ${job}.`,
        [
          `- Chức danh: ${o?.title?.trim() || job}`,
          `- Ngày bắt đầu: ${o?.start?.trim() || v(o?.startDate)}`,
          `- Thời gian làm việc: ${v(o?.workingHours)}`,
          `- Địa điểm: ${v(o?.location)}`,
          "- Chế độ đãi ngộ: Xem chi tiết trong file đính kèm",
        ].join("\n"),
        `File đính kèm “${v(o?.fileName)}”: mức lương, phụ cấp, thời gian thử việc, phúc lợi, giấy tờ cần chuẩn bị và lịch trình ngày đầu đi làm.`,
        `Bạn vui lòng trả lời email này để xác nhận nhận offer trước ${v(o?.confirmBy)}. Nếu có câu hỏi về công việc, vị trí hay chế độ, bạn liên hệ:\n${o?.contact?.trim() || "Phòng Nhân sự · hiring@tdgamestudio.com"}`,
        "TD Games rất mong được chào đón bạn trở thành một phần của đội ngũ!",
        SIGNATURE_LEGACY,
      ].join("\n\n");
      return { subject, text };
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
const fullOffer = {
  title: "Họa sĩ 2D", start: "8:45, Thứ Hai 02/11/2026", workingHours: "T2–T6, 8:30 – 17:30", location: "VP TD Games",
  confirmBy: "Thứ Hai 02/11/2026", contact: "Ms. Thảo · 0964525584 · ketoan@td.vn", fileName: "Thư mời nhận việc - A.pdf",
};
for (const offer of [null, undefined, { startDate: "" }, { startDate: "01/12" }, {}, fullOffer, { ...fullOffer, title: " ", contact: "" }]) {
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
  assert.equal(validateTemplate("rejection", "Chào {ten_ung_vien}", "Xin chào {ten_ung_vien}, {vi_tri} {chu_ky} {} lẻ { nhé"), null);
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
    { kind: "offer", candidateName: "Lan", jobTitle: "Artist", offer: { startDate: "" } },
    { subject: "Offer {vi_tri} cho {ten_ung_vien}", body: "Hi {ten_ung_vien}: {muc_luong}, {ngay_bat_dau}\n\n{chu_ky}" },
  );
  assert.equal(d.subject, "Offer Artist cho Lan");
  // muc_luong luôn "…" (lương chỉ nằm trong PDF).
  assert.match(d.text, /^Hi Lan: …, …\n\nTrân trọng,/);
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
  assert.equal(Object.keys(templateVars(SAMPLE_DRAFT_INPUT("offer"))).length, 18);
});

test("validate: biến viết gần đúng bị từ chối, ngoặc lẻ vẫn được", () => {
  for (const bad of ["{ ten_ung_vien }", "{{ten_ung_vien}}", "{Ten_Ung_Vien}", "{ten ung vien}", "{ten_ung_vien }"]) {
    assert.match(validateTemplate("rejection", "Tiêu đề", `Chào ${bad}`) ?? "", /Viết biến đúng dạng \{ten_ung_vien\}/, bad);
    assert.match(validateTemplate("rejection", `T ${bad}`, "x") ?? "", /Viết biến đúng dạng/, bad);
  }
  assert.equal(validateTemplate("rejection", "T", "a { b } c"), "Viết biến đúng dạng {ten_ung_vien} (không dấu cách, không ngoặc kép, viết thường)");
  assert.equal(validateTemplate("rejection", "T", "dấu { lẻ, } lẻ, {} và {1+1}"), null);
});

test("validate: tiêu đề chỉ gồm biến/khoảng trắng bị từ chối", () => {
  assert.ok(validateTemplate("rejection", "{vi_tri}", "x"));
  assert.ok(validateTemplate("rejection", " {vi_tri} {ten_ung_vien} ", "x"));
  assert.equal(validateTemplate("rejection", "{vi_tri} | TD", "x"), null);
});

// ── Mail offer mới + người liên hệ ──
import { offerContact } from "./hr-email-templates.ts";

test("offer: mẫu mới không lộ lương, có biến thư mời", () => {
  const d = buildDraft({ ...SAMPLE_DRAFT_INPUT("offer"), offer: fullOffer });
  assert.equal(d.subject, "[TD Games] Thư mời nhận việc — 2D Game Artist");
  assert.ok(!d.text.includes("20.000.000"));
  assert.ok(d.text.includes("- Chức danh: Họa sĩ 2D"));
  assert.ok(d.text.includes("- Ngày bắt đầu: 8:45, Thứ Hai 02/11/2026"));
  assert.ok(d.text.includes("File đính kèm “Thư mời nhận việc - A.pdf”"));
  assert.ok(d.text.includes("trước Thứ Hai 02/11/2026."));
  assert.ok(d.text.includes("liên hệ:\nMs. Thảo · 0964525584 · ketoan@td.vn"));
  for (const v of ["chuc_danh", "ngay_bat_dau", "thoi_gian_lam_viec", "dia_diem", "han_xac_nhan", "nguoi_lien_he", "ten_file", "muc_luong"]) {
    assert.ok(KIND_VARS.offer.includes(v), v);
  }
  // muc_luong vẫn dùng được trong mẫu tuỳ chỉnh
  assert.equal(validateTemplate("offer", "Offer", "Lương {muc_luong} {ten_file}"), null);
});

const u = (o: Partial<{ role: string; display_name: string; email: string; phone: string | null; disabled: boolean; created_at: string }>) => ({
  role: "accountant", display_name: "Ms. Thảo (Đào Thị Xuân Thảo)", email: "ketoan@tdconsulting.vn", phone: "0964525584",
  disabled: false, created_at: "2026-10-01T00:00:00Z", ...o,
});

test("offerContact: Kế toán/HR gửi → chính người đó", () => {
  assert.equal(offerContact(u({}), []), "Ms. Thảo (Đào Thị Xuân Thảo) · 0964525584 · ketoan@tdconsulting.vn");
  assert.equal(offerContact(u({ role: "hr", display_name: "HR Phương", phone: null, email: "hr@td.vn" }), [u({})]), "HR Phương · hr@td.vn");
  assert.equal(offerContact(u({ role: "hr", display_name: " ", phone: " ", email: "hr@td.vn" }), []), "hr@td.vn");
});

test("offerContact: Sếp gửi → kế toán đầu tiên chưa khoá theo created_at", () => {
  const boss = u({ role: "boss", display_name: "Toàn", email: "tony@td.vn" });
  const accs = [
    u({ display_name: "KT mới", created_at: "2026-10-20T00:00:00Z" }),
    u({ display_name: "KT cũ khoá", created_at: "2026-01-01T00:00:00Z", disabled: true }),
    u({ display_name: "KT cũ", created_at: "2026-05-01T00:00:00Z", phone: "" }),
    u({ role: "hr", display_name: "HR sớm nhất", created_at: "2025-01-01T00:00:00Z" }),
  ];
  assert.equal(offerContact(boss, accs), "KT cũ · ketoan@tdconsulting.vn");
});

test("offerContact: không có kế toán → Phòng Nhân sự", () => {
  const boss = u({ role: "boss" });
  assert.equal(offerContact(boss, []), "Phòng Nhân sự · hiring@tdgamestudio.com");
  assert.equal(offerContact(null, [u({ disabled: true })]), "Phòng Nhân sự · hiring@tdgamestudio.com");
  // Leader (nếu được cấp quyền) cũng đi nhánh kế toán
  assert.equal(offerContact(u({ role: "leader" }), [u({ display_name: "KT" })]), "KT · 0964525584 · ketoan@tdconsulting.vn");
});

test("chữ ký {chu_ky}: có người support → tên + SĐT + hiring@; không có → chữ ký chung hiring@", async () => {
  const { buildSignature } = await import("./hr-email-base.ts");
  assert.equal(
    buildSignature({ name: "Nguyễn Thị Minh Phương", phone: "0385456273" }),
    "Trân trọng,\nNguyễn Thị Minh Phương — Phòng Nhân sự TD Games\n0385 456 273 · hiring@tdgamestudio.com · https://tdgamestudio.com",
  );
  assert.equal(
    buildSignature({ name: "Nguyễn Thị Minh Phương", phone: null }),
    "Trân trọng,\nNguyễn Thị Minh Phương — Phòng Nhân sự TD Games\nhiring@tdgamestudio.com · https://tdgamestudio.com",
  );
  assert.equal(buildSignature(null), "Trân trọng,\nTD Games Studio — Phòng Nhân sự\nhiring@tdgamestudio.com · https://tdgamestudio.com");
  const d = buildDraft({ kind: "rejection", candidateName: "Lan", jobTitle: "Dev", support: { name: "Thuỳ Dung", phone: "+84336828903" } });
  assert.ok(d.text.endsWith("Thuỳ Dung — Phòng Nhân sự TD Games\n+84336828903 · hiring@tdgamestudio.com · https://tdgamestudio.com"));
});
