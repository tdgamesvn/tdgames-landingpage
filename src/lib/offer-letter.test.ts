// node --test src/lib/offer-letter.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_OFFER_LETTER_DEFAULTS,
  addWorkingDays,
  buildOfferLetterData,
  formatDateVi,
  formatStartVi,
  formatVnd,
  mergeOfferLetter,
  offerFileName,
  offerTotal,
  sanitizeOfferLetter,
  sanitizeOfferLetterDefaults,
  validateOfferLetter,
  validateOfferLetterDefaults,
  validateOfferLetterLimits,
  vnDateString,
  type OfferLetterData,
} from "./offer-letter.ts";

const D = DEFAULT_OFFER_LETTER_DEFAULTS;

function sample(o: Partial<OfferLetterData> = {}): OfferLetterData {
  return {
    ...buildOfferLetterData(D, { candidateName: "Nguyễn Văn A", jobTitle: "2D Game Artist", today: new Date("2026-10-28T03:00:00Z") }),
    startDate: "2026-11-02",
    baseSalary: 10_000_000,
    ...o,
  };
}

test("mặc định: chép từ Word gốc", () => {
  assert.equal(D.startTime, "08:45");
  assert.deepEqual(D.allowanceNames, ["Xăng xe", "Điện thoại", "Ăn trưa", "Trang phục", "KPI", "Khác"]);
  assert.equal(D.location, "Văn phòng TD Games – Tầng 4, 505 Minh Khai, Hai Bà Trưng, Hà Nội");
  assert.equal(D.workingHours, "Từ thứ Hai đến thứ Sáu, 8:30 – 17:30");
  assert.equal(D.probationNote, "Thử việc 2 tháng (hưởng 100% lương)");
  assert.equal(D.otherBenefits.length, 5);
  assert.equal(D.documents.length, 3);
  assert.equal(D.schedule.length, 6);
  assert.deepEqual(D.schedule[0], { time: "8:45 – 9:00", task: "Ổn định vị trí, chuẩn bị bắt đầu" });
  assert.equal(D.signerTitle, "GIÁM ĐỐC");
  assert.equal(D.signerName, "Đặng Thế Toàn");
  assert.equal(validateOfferLetterDefaults(D), null);
});

test("buildOfferLetterData: phụ cấp tên từ mẫu, số tiền null; hạn xác nhận +3 ngày làm việc", () => {
  const b = buildOfferLetterData(D, { candidateName: " Lan ", jobTitle: "Unity Dev", today: new Date("2026-10-28T03:00:00Z") });
  assert.equal(b.candidateName, "Lan");
  assert.equal(b.jobTitle, "Unity Dev");
  assert.deepEqual(b.allowances.map((a) => a.amount), [null, null, null, null, null, null]);
  assert.deepEqual(b.allowances.map((a) => a.name), D.allowanceNames);
  assert.equal(b.baseSalary, null);
  assert.equal(b.startDate, "");
  assert.equal(b.startTime, "08:45");
  // Hạn xác nhận để trống — tính lúc soạn mail.
  assert.equal(b.confirmBy, "");
  assert.equal(b.location, D.location);
  assert.deepEqual(b.schedule, D.schedule);
  assert.notEqual(b.schedule, D.schedule); // bản sao, không dùng chung mảng
});

test("vnDateString: theo giờ Việt Nam", () => {
  assert.equal(vnDateString(new Date("2026-10-28T18:00:00Z")), "2026-10-29");
  assert.equal(vnDateString(new Date("2026-10-28T16:59:00Z")), "2026-10-28");
});

test("addWorkingDays: bỏ T7/CN", () => {
  assert.equal(addWorkingDays("2026-10-30", 1), "2026-11-02"); // T6 → T2
  assert.equal(addWorkingDays("2026-10-31", 1), "2026-11-02"); // T7 → T2
  assert.equal(addWorkingDays("2026-10-26", 3), "2026-10-29");
  assert.equal(addWorkingDays("2026-10-29", 3), "2026-11-03");
  assert.equal(addWorkingDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addWorkingDays("2026-10-28", 0), "2026-10-28");
});

test("formatVnd / formatStartVi / formatDateVi", () => {
  assert.equal(formatVnd(12_560_000), "12.560.000 VND");
  assert.equal(formatVnd(0), "0 VND");
  assert.equal(formatVnd(999), "999 VND");
  assert.equal(formatVnd(5_310_000.4), "5.310.000 VND");
  assert.equal(formatStartVi("2026-10-12", "08:45"), "8:45, Thứ Hai 12/10/2026");
  assert.equal(formatStartVi("2026-10-12", "13:00"), "13:00, Thứ Hai 12/10/2026");
  assert.equal(formatStartVi("2026-10-12", ""), "Thứ Hai 12/10/2026");
  assert.equal(formatStartVi("", "08:45"), "");
  assert.equal(formatDateVi("2026-10-30"), "Thứ Sáu 30/10/2026");
  assert.equal(formatDateVi("2026-11-01"), "Chủ Nhật 01/11/2026");
  assert.equal(formatDateVi("abc"), "");
});

test("offerTotal: lương cơ bản + phụ cấp có số", () => {
  const d = sample({ baseSalary: 7_000_000, allowances: [{ name: "Xăng xe", amount: 500_000 }, { name: "KPI", amount: null }, { name: "Ăn trưa", amount: 60_000 }] });
  assert.equal(offerTotal(d), 7_560_000);
  assert.equal(offerTotal(sample({ baseSalary: null, allowances: [] })), 0);
});

test("validateOfferLetter: bắt buộc tên, chức danh, ngày bắt đầu, lương cơ bản", () => {
  assert.equal(validateOfferLetter(sample()), null);
  assert.match(validateOfferLetter(sample({ candidateName: "  " })) ?? "", /tên ứng viên/i);
  assert.match(validateOfferLetter(sample({ jobTitle: "" })) ?? "", /chức danh/i);
  assert.match(validateOfferLetter(sample({ startDate: "" })) ?? "", /ngày bắt đầu/i);
  assert.match(validateOfferLetter(sample({ startDate: "2026-02-30" })) ?? "", /ngày bắt đầu/i);
  assert.match(validateOfferLetter(sample({ baseSalary: null })) ?? "", /lương cơ bản/i);
  assert.match(validateOfferLetter(sample({ baseSalary: 0 })) ?? "", /lương cơ bản/i);
  assert.match(validateOfferLetter(sample({ startTime: "25:00" })) ?? "", /giờ bắt đầu/i);
});

test("validateOfferLetter: giới hạn số tiền, danh sách, độ dài", () => {
  assert.ok(validateOfferLetter(sample({ baseSalary: 1e10 + 1 })));
  // Hạn xác nhận không được sau ngày bắt đầu (startDate mẫu = 2026-11-02).
  assert.match(validateOfferLetter(sample({ confirmBy: "2026-11-03" })) ?? "", /Hạn xác nhận/);
  assert.equal(validateOfferLetter(sample({ confirmBy: "2026-11-02" })), null);
  assert.equal(validateOfferLetter(sample({ baseSalary: 1e10 })), null);
  assert.ok(validateOfferLetter(sample({ allowances: [{ name: "X", amount: -1 }] })));
  assert.ok(validateOfferLetter(sample({ allowances: [{ name: "", amount: 100 }] })));
  assert.equal(validateOfferLetter(sample({ allowances: [{ name: "X", amount: 0 }] })), null);
  assert.ok(validateOfferLetter(sample({ otherBenefits: Array(16).fill("a") })));
  assert.equal(validateOfferLetter(sample({ otherBenefits: Array(15).fill("a") })), null);
  assert.ok(validateOfferLetter(sample({ schedule: Array(16).fill({ time: "1", task: "a" }) })));
  assert.ok(validateOfferLetter(sample({ allowances: Array(16).fill({ name: "a", amount: 1 }) })));
  assert.ok(validateOfferLetter(sample({ jobTitle: "x".repeat(301) })));
  assert.equal(validateOfferLetter(sample({ jobTitle: "x".repeat(300) })), null);
  assert.ok(validateOfferLetter(sample({ documents: ["x".repeat(301)] })));
  assert.ok(validateOfferLetter(sample({ schedule: [{ time: "1", task: "x".repeat(301) }] })));
  assert.equal(validateOfferLetter(sample({ intro: "x".repeat(1500) })), null);
  assert.ok(validateOfferLetter(sample({ intro: "x".repeat(1501) })));
  assert.ok(validateOfferLetter(sample({ confirmBy: "30/10/2026" })));
  assert.equal(validateOfferLetter(sample({ confirmBy: "" })), null);
});

test("validateOfferLetterLimits: bỏ qua trường bắt buộc (cho xem trước bản nháp)", () => {
  assert.equal(validateOfferLetterLimits(sample({ baseSalary: null, startDate: "", jobTitle: "" })), null);
  assert.ok(validateOfferLetterLimits(sample({ intro: "x".repeat(1501) })));
});

test("sanitizeOfferLetter: ép kiểu an toàn", () => {
  const s = sanitizeOfferLetter({
    candidateName: "  Lan ",
    jobTitle: 5,
    baseSalary: "12.000.000",
    allowances: [{ name: "Xăng", amount: "500000" }, { name: "KPI", amount: "" }, "rác", { name: "Khác", amount: -5 }, null],
    otherBenefits: ["a", 3, "b"],
    schedule: [{ time: "8:00", task: "x" }, { time: 1 }],
    startDate: "2026-11-02",
    startTime: "8:45",
    __proto__x: 1,
  });
  assert.equal(s.candidateName, "Lan");
  assert.equal(s.jobTitle, "");
  assert.equal(s.baseSalary, 12_000_000);
  assert.deepEqual(s.allowances, [{ name: "Xăng", amount: 500_000 }, { name: "KPI", amount: null }, { name: "Khác", amount: -5 }]);
  assert.deepEqual(s.otherBenefits, ["a", "b"]);
  assert.deepEqual(s.schedule, [{ time: "8:00", task: "x" }, { time: "", task: "" }]);
  assert.equal(s.startTime, "08:45");
  assert.equal(s.documents.length, 0);
  assert.ok(!("__proto__x" in s));
  const empty = sanitizeOfferLetter(null);
  assert.equal(empty.candidateName, "");
  assert.equal(empty.baseSalary, null);
  assert.deepEqual(empty.allowances, []);
  assert.equal(sanitizeOfferLetter({ baseSalary: "abc" }).baseSalary, null);
  assert.equal(sanitizeOfferLetter({ baseSalary: Infinity }).baseSalary, null);
  // Chuỗi tiền: chỉ nhóm 3 số bằng . hoặc khoảng trắng, hoặc toàn chữ số.
  for (const [s, v] of [["12 000 000", 12_000_000], ["5000", 5000], ["1.000", 1000], ["12,000,000", null], ["1.00", null], ["-5", null], ["1e9", null], ["", null]] as const) {
    assert.equal(sanitizeOfferLetter({ baseSalary: s }).baseSalary, v, s);
  }
});

test("mergeOfferLetter: dữ liệu đã lưu đè mặc định, trường thiếu lấy từ mặc định", () => {
  const built = sample();
  assert.deepEqual(mergeOfferLetter(null, built), built);
  const m = mergeOfferLetter({ baseSalary: 9_000_000, computer: "Máy cá nhân" }, built);
  assert.equal(m.baseSalary, 9_000_000);
  assert.equal(m.computer, "Máy cá nhân");
  assert.equal(m.location, built.location);
  assert.equal(m.candidateName, built.candidateName);
  // Đã lưu trống thì vẫn giữ trống (người dùng cố ý xoá)
  assert.equal(mergeOfferLetter({ workEmail: "" }, built).workEmail, "");
});

test("offerFileName: bỏ ký tự cấm", () => {
  assert.equal(offerFileName("Nguyễn Văn A"), "Thư mời nhận việc - Nguyễn Văn A.pdf");
  assert.equal(offerFileName(' A/B\\C:*?"<>|  D '), "Thư mời nhận việc - A B C D.pdf");
  assert.equal(offerFileName("   "), "Thư mời nhận việc - Ứng viên.pdf");
  assert.ok(offerFileName("x".repeat(500)).length < 140);
});

test("sanitizeOfferLetterDefaults: thiếu → mặc định công ty", () => {
  assert.deepEqual(sanitizeOfferLetterDefaults(null), D);
  const s = sanitizeOfferLetterDefaults({ location: "VP mới", allowanceNames: ["A", 1, "B"] });
  assert.equal(s.location, "VP mới");
  assert.deepEqual(s.allowanceNames, ["A", "B"]);
  assert.equal(s.closing, D.closing);
  assert.ok(validateOfferLetterDefaults({ ...D, startTime: "8h" }));
  assert.ok(validateOfferLetterDefaults({ ...D, documents: Array(16).fill("a") }));
});

import { offerDraftFields } from "./offer-letter.ts";

test("offerDraftFields: chuỗi đã định dạng cho mail; hạn trống → +3 ngày làm việc", () => {
  const d = sample({ startDate: "2026-10-12", confirmBy: "2026-10-30" });
  assert.deepEqual(offerDraftFields(d, "KT · 09 · kt@x", new Date("2026-10-28T03:00:00Z")).fields, {
    title: "2D Game Artist",
    start: "8:45, Thứ Hai 12/10/2026",
    workingHours: D.workingHours,
    location: D.location,
    confirmBy: "Thứ Sáu 30/10/2026",
    contact: "KT · 09 · kt@x",
    fileName: "Thư mời nhận việc - Nguyễn Văn A.pdf",
  });
  assert.equal(offerDraftFields(sample({ confirmBy: "", startDate: "2026-11-16" }), "", new Date("2026-10-30T03:00:00Z")).fields.confirmBy, "Thứ Tư 04/11/2026");
  // Ngày bắt đầu 02/11 sớm hơn +3 ngày làm việc (04/11) → kẹp về 01/11.
  assert.equal(offerDraftFields(sample({ confirmBy: "" }), "", new Date("2026-10-30T03:00:00Z")).fields.confirmBy, "Chủ Nhật 01/11/2026");
  assert.equal(offerDraftFields(d, "", new Date("2026-10-28T03:00:00Z")).notice, null);
});

import { resolveConfirmBy } from "./offer-letter.ts";

test("resolveConfirmBy: trống → +3 ngày làm việc; đã qua → tính lại + notice; hôm nay vẫn giữ", () => {
  const now = new Date("2026-10-28T03:00:00Z"); // T4 28/10 giờ VN
  assert.deepEqual(resolveConfirmBy("", now), { date: "2026-11-02", notice: null });
  assert.deepEqual(resolveConfirmBy("2026-10-28", now), { date: "2026-10-28", notice: null });
  assert.deepEqual(resolveConfirmBy("2026-10-30", now), { date: "2026-10-30", notice: null });
  assert.deepEqual(resolveConfirmBy("2026-10-27", now), {
    date: "2026-11-02",
    notice: "Hạn xác nhận đã qua — đã tự đổi thành Thứ Hai 02/11/2026",
  });
  // Ranh giới ngày theo giờ VN: 17:30 UTC 27/10 = 00:30 28/10 VN → 27/10 đã qua.
  assert.ok(resolveConfirmBy("2026-10-27", new Date("2026-10-27T17:30:00Z")).notice);
});

test("resolveConfirmBy: hạn tự tính không vượt ngày bắt đầu", () => {
  const now = new Date("2026-10-28T03:00:00Z"); // T4 28/10; +3 ngày làm việc = T2 02/11
  // Ngày bắt đầu xa → giữ +3 ngày làm việc.
  assert.equal(resolveConfirmBy("", now, "2026-11-16").date, "2026-11-02");
  // Đúng bằng ngày bắt đầu vẫn được (≤ ngày bắt đầu).
  assert.equal(resolveConfirmBy("", now, "2026-11-02").date, "2026-11-02");
  // Ngày bắt đầu sớm hơn +3 ngày làm việc → ngày bắt đầu − 1.
  assert.equal(resolveConfirmBy("", now, "2026-10-31").date, "2026-10-30");
  // … nhưng không trước hôm nay.
  assert.equal(resolveConfirmBy("", now, "2026-10-29").date, "2026-10-28");
  // Ngày bắt đầu là hôm nay hoặc đã qua → hôm nay.
  assert.equal(resolveConfirmBy("", now, "2026-10-28").date, "2026-10-28");
  assert.equal(resolveConfirmBy("", now, "2026-10-01").date, "2026-10-28");
  // Hạn đã lưu đã qua → tính lại, cũng bị kẹp, notice báo ngày sau khi kẹp.
  assert.deepEqual(resolveConfirmBy("2026-10-20", now, "2026-10-31"), {
    date: "2026-10-30",
    notice: "Hạn xác nhận đã qua — đã tự đổi thành Thứ Sáu 30/10/2026",
  });
  // Hạn đã lưu còn hiệu lực → giữ nguyên (validate đã bắt ≤ ngày bắt đầu khi lưu).
  assert.equal(resolveConfirmBy("2026-10-29", now, "2026-10-31").date, "2026-10-29");
  // Ngày bắt đầu sai/trống → không kẹp.
  assert.equal(resolveConfirmBy("", now, "abc").date, "2026-11-02");
});
