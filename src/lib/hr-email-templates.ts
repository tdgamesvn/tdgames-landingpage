/**
 * Mẫu mail ứng viên sửa được (thuần, không I/O): biến `{ten_bien}`, mẫu mặc định,
 * dựng biến từ DraftInput, render, kiểm tra khi lưu, dữ liệu mẫu cho xem trước.
 * Mẫu mặc định render ra đúng văn bản cũ của buildDraft (xem hr-email-templates.test.ts).
 */

import {
  KIND_LABEL,
  MBTI_TEST_URL,
  SIGNATURE,
  formatInterviewLong,
  whereLines,
  isCandidateKind,
  type CandidateEmailKind,
  type DraftInput,
} from "./hr-email-base.ts";

export type EmailTemplate = { subject: string; body: string };

export const COMMON_VARS = ["ten_ung_vien", "vi_tri", "chu_ky"];

export const KIND_VARS: Record<CandidateEmailKind, string[]> = {
  interview_invite: [...COMMON_VARS, "vong", "thoi_gian_pv", "hinh_thuc_pv", "doan_mbti"],
  interview_reschedule: [...COMMON_VARS, "vong", "thoi_gian_pv", "hinh_thuc_pv"],
  interview_cancel: [...COMMON_VARS, "cau_huy", "thoi_gian_cu"],
  test_assignment: [...COMMON_VARS, "link_bai_test"],
  rejection: [...COMMON_VARS],
  offer: [...COMMON_VARS, "muc_luong", "ngay_bat_dau"],
};

export const VAR_HELP: Record<string, string> = {
  ten_ung_vien: "Tên ứng viên (trống → “bạn”)",
  vi_tri: "Tên vị trí ứng tuyển",
  chu_ky: "Chữ ký TD Games Studio — Phòng Nhân sự",
  vong: "“ (vòng N)” khi từ vòng 2 trở đi, vòng 1 để trống",
  thoi_gian_pv: "Giờ phỏng vấn, kèm “(giờ Việt Nam)”; chưa có lịch → “(HR bổ sung)”",
  hinh_thuc_pv: "Các dòng hình thức, link Meet hoặc địa chỉ + bản đồ",
  doan_mbti: "Đoạn nhờ làm trắc nghiệm MBTI (trống nếu ứng viên đã có kết quả)",
  cau_huy: "Câu báo huỷ (có giờ cũ nếu biết)",
  thoi_gian_cu: "Giờ phỏng vấn cũ (trống nếu không biết)",
  link_bai_test: "Link đề bài & nộp bài",
  muc_luong: "Mức lương trong offer (trống → “…”)",
  ngay_bat_dau: "Ngày bắt đầu dự kiến (trống → “…”)",
};

export const DEFAULT_TEMPLATES: Record<CandidateEmailKind, EmailTemplate> = {
  interview_invite: {
    subject: "Thư mời phỏng vấn — {vi_tri} | TD Games",
    body: [
      "Chào {ten_ung_vien},",
      "Cảm ơn bạn đã ứng tuyển vị trí {vi_tri} tại TD Games. Chúng mình rất vui được mời bạn tham gia buổi phỏng vấn{vong}:",
      "- Thời gian: {thoi_gian_pv}\n{hinh_thuc_pv}",
      "{doan_mbti}",
      "Bạn vui lòng trả lời mail này để xác nhận tham gia. Nếu khung giờ trên chưa phù hợp, cứ báo lại để chúng mình sắp xếp lịch khác nhé.",
      "{chu_ky}",
    ].join("\n\n"),
  },
  interview_reschedule: {
    subject: "Thay đổi lịch phỏng vấn — {vi_tri} | TD Games",
    body: [
      "Chào {ten_ung_vien},",
      "Lịch phỏng vấn{vong} vị trí {vi_tri} của bạn đã được cập nhật như sau:",
      "- Thời gian mới: {thoi_gian_pv}\n{hinh_thuc_pv}",
      "Xin lỗi bạn vì sự thay đổi này. Bạn vui lòng trả lời mail để xác nhận lịch mới giúp chúng mình nhé.",
      "{chu_ky}",
    ].join("\n\n"),
  },
  interview_cancel: {
    subject: "Huỷ lịch phỏng vấn — {vi_tri} | TD Games",
    body: [
      "Chào {ten_ung_vien},",
      "{cau_huy}",
      "Chúng mình xin lỗi vì sự bất tiện này và sẽ liên hệ lại với bạn nếu có lịch mới.",
      "{chu_ky}",
    ].join("\n\n"),
  },
  test_assignment: {
    subject: "Bài test — {vi_tri} | TD Games",
    body: [
      "Chào {ten_ung_vien},",
      "Cảm ơn bạn đã quan tâm tới vị trí {vi_tri} tại TD Games. Bước tiếp theo, chúng mình gửi bạn một bài test nhỏ.",
      "Đề bài và chỗ nộp bài ở đây: {link_bai_test}",
      "Khi mở link, bạn chọn giúp chúng mình ngày dự kiến nộp bài để tiện theo dõi. Nếu có câu hỏi về đề, cứ trả lời mail này nhé.",
      "{chu_ky}",
    ].join("\n\n"),
  },
  rejection: {
    subject: "Kết quả ứng tuyển — {vi_tri} | TD Games",
    body: [
      "Chào {ten_ung_vien},",
      "Cảm ơn bạn đã dành thời gian ứng tuyển vị trí {vi_tri} tại TD Games.",
      "Sau khi cân nhắc, chúng mình rất tiếc chưa thể tiếp tục cùng bạn ở thời điểm này. Hồ sơ của bạn sẽ được lưu lại và chúng mình sẽ liên hệ khi có vị trí phù hợp hơn.",
      "Chúc bạn nhiều thành công trên con đường sắp tới.",
      "{chu_ky}",
    ].join("\n\n"),
  },
  offer: {
    subject: "Thư mời làm việc — {vi_tri} | TD Games",
    body: [
      "Chào {ten_ung_vien},",
      "Cảm ơn bạn đã dành thời gian tham gia phỏng vấn vị trí {vi_tri} tại TD Games. Chúng tôi rất vui được gửi tới bạn lời mời làm việc:",
      "- Vị trí: {vi_tri}\n- Mức lương: {muc_luong}\n- Ngày bắt đầu dự kiến: {ngay_bat_dau}",
      "Bạn vui lòng trả lời email này để xác nhận nhận offer, hoặc gửi lại bất kỳ câu hỏi nào — chúng tôi luôn sẵn sàng giải đáp.",
      "{chu_ky}",
    ].join("\n\n"),
  },
};

/** Giá trị biến cho một bản nháp. Có đủ mọi biến; biến không thuộc loại thì validate đã chặn khi lưu. */
export function templateVars(input: DraftInput): Record<string, string> {
  const i = input.interview ?? null;
  return {
    ten_ung_vien: input.candidateName.trim() || "bạn",
    vi_tri: input.jobTitle.trim() || "vị trí bạn ứng tuyển",
    chu_ky: SIGNATURE,
    vong: i && i.round > 1 ? ` (vòng ${i.round})` : "",
    thoi_gian_pv: i ? `${formatInterviewLong(i.scheduledAt)} (giờ Việt Nam)` : "(HR bổ sung)",
    hinh_thuc_pv: i ? whereLines(i).join("\n") : "",
    doan_mbti: input.hasMbti
      ? ""
      : `Trước buổi phỏng vấn, bạn dành khoảng 10 phút làm giúp bài trắc nghiệm tính cách MBTI tại: ${MBTI_TEST_URL}\nLàm xong, bạn trả lời mail này kèm link (hoặc ảnh chụp) trang kết quả nhé.`,
    thoi_gian_cu: input.prevScheduledAt ? formatInterviewLong(input.prevScheduledAt) : "",
    cau_huy: input.prevScheduledAt
      ? `Buổi phỏng vấn vị trí ${input.jobTitle.trim() || "vị trí bạn ứng tuyển"} vào lúc ${formatInterviewLong(input.prevScheduledAt)} đã được huỷ.`
      : `Buổi phỏng vấn vị trí ${input.jobTitle.trim() || "vị trí bạn ứng tuyển"} đã được huỷ.`,
    link_bai_test: input.testUrl ?? "(HR bổ sung link)",
    muc_luong: input.offer?.salary.trim() || "…",
    ngay_bat_dau: input.offer?.startDate.trim() || "…",
  };
}

const VAR_RE = /\{([a-zA-Z0-9_]+)\}/g;

function fill(s: string, vars: Record<string, string>): string {
  return s.replace(VAR_RE, (m, k: string) => (Object.hasOwn(vars, k) ? vars[k] : m));
}

/** Thay `{x}` bằng vars[x] (một lượt, giá trị không bị thay tiếp); biến không có giữ nguyên chữ. */
export function renderTemplate(tpl: EmailTemplate, vars: Record<string, string>): { subject: string; text: string } {
  const subject = fill(tpl.subject, vars).replace(/\s*\n\s*/g, " ").trim();
  const text = fill(tpl.body, vars)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { subject, text };
}

/** Lỗi tiếng Việt (nêu tên biến) hoặc null nếu mẫu hợp lệ. */
export function validateTemplate(kind: string, subject: string, body: string): string | null {
  if (!isCandidateKind(kind)) return "Loại mẫu không hợp lệ";
  if (typeof subject !== "string" || subject.trim().length < 1 || subject.length > 200) {
    return "Tiêu đề phải từ 1 đến 200 ký tự";
  }
  if (typeof body !== "string" || body.trim().length < 1 || body.length > 10000) {
    return "Nội dung phải từ 1 đến 10000 ký tự";
  }
  if (subject.replace(VAR_RE, "").trim().length < 1) return "Tiêu đề cần có chữ cố định, không chỉ gồm biến";
  const allowed = new Set(KIND_VARS[kind]);
  const nearMiss = "Viết biến đúng dạng {ten_ung_vien} (không dấu cách, không ngoặc kép, viết thường)";
  for (const text of [subject, body]) {
    if (/\{\{|\}\}/.test(text)) return nearMiss;
    for (const m of text.matchAll(/\{([^{}\n]*)\}/g)) {
      if (!/^[a-zA-Z0-9_]+$/.test(m[1]) && /^\s*[\p{L}_][\p{L}\p{N}_ ]*$/u.test(m[1].trimEnd())) return nearMiss;
      if (/[A-Z]/.test(m[1]) && /^[a-zA-Z0-9_]+$/.test(m[1])) return nearMiss;
    }
    for (const m of text.matchAll(VAR_RE)) {
      if (!allowed.has(m[1])) return `Biến {${m[1]}} không dùng được trong mẫu ${KIND_LABEL[kind]}`;
    }
  }
  return null;
}

/** Dữ liệu mẫu cho xem trước trong tab "Mẫu mail". */
export function SAMPLE_DRAFT_INPUT(kind: CandidateEmailKind): DraftInput {
  const base: DraftInput = { kind, candidateName: "Nguyễn Văn A", jobTitle: "2D Game Artist" };
  const interview = {
    scheduledAt: "2026-11-02T08:30:00.000Z",
    mode: "online" as const,
    meetUrl: "https://meet.google.com/abc-defg-hij",
    round: 1,
  };
  switch (kind) {
    case "interview_invite":
    case "interview_reschedule":
      return { ...base, interview, hasMbti: false };
    case "interview_cancel":
      return { ...base, prevScheduledAt: "2026-11-02T08:30:00.000Z" };
    case "test_assignment":
      return { ...base, testUrl: "https://tdgamestudio.com/test/mau-xem-truoc" };
    case "offer":
      return { ...base, offer: { salary: "15.000.000 VND/tháng", startDate: "01/12/2026" } };
    default:
      return base;
  }
}
