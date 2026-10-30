/**
 * Mẫu mail ứng viên sửa được (thuần, không I/O): biến `{ten_bien}`, mẫu mặc định,
 * dựng biến từ DraftInput, render, kiểm tra khi lưu, dữ liệu mẫu cho xem trước.
 * Mẫu mặc định render ra đúng văn bản cũ của buildDraft (xem hr-email-templates.test.ts),
 * trừ `offer` (đổi có chủ đích 2026-10-28: thư mời nhận việc PDF đính kèm, thân mail không lộ lương).
 */

import {
  KIND_LABEL,
  MBTI_TEST_URL,
  buildSignature,
  HIRING_EMAIL,
  formatInterviewLong,
  holdReplyBy,
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
  offer: [
    ...COMMON_VARS,
    "chuc_danh", "ngay_bat_dau", "thoi_gian_lam_viec", "dia_diem", "han_xac_nhan", "nguoi_lien_he", "ten_file",
    "muc_luong",
  ],
  application_received: [...COMMON_VARS],
  on_hold: [...COMMON_VARS, "han_phan_hoi"],
  position_filled: [...COMMON_VARS],
};

/** Biến còn hợp lệ (mẫu cũ không lỗi) nhưng không gợi ý chèn trong tab Mẫu mail. */
export const HIDDEN_VARS: ReadonlySet<string> = new Set(["muc_luong"]);

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
  muc_luong: "Không còn dùng — luôn “…” (lương nằm trong file PDF)",
  ngay_bat_dau: "Giờ + ngày bắt đầu từ thư mời, vd “8:45, Thứ Hai 12/10/2026”",
  chuc_danh: "Chức danh trong thư mời (trống → tên vị trí)",
  thoi_gian_lam_viec: "Thời gian làm việc trong thư mời",
  dia_diem: "Địa điểm làm việc trong thư mời",
  han_xac_nhan: "Hạn xác nhận offer, vd “Thứ Sáu 30/10/2026”",
  nguoi_lien_he: "Người liên hệ: tên · SĐT · email (Kế toán/HR gửi → chính người đó; Sếp gửi → Kế toán)",
  ten_file: "Tên file thư mời nhận việc đính kèm (PDF)",
  han_phan_hoi: "Hạn TD Games phản hồi = ngày gửi + 14 ngày, vd “Thứ Sáu 13/11/2026”",
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
    subject: "[TD Games] Thư mời nhận việc — {vi_tri}",
    body: [
      "Xin chào {ten_ung_vien},",
      "Thay mặt TD Games, cảm ơn bạn đã dành thời gian tham gia quá trình tuyển dụng. Sau quá trình cân nhắc kỹ, chúng tôi rất vui thông báo bạn đã vượt qua vòng phỏng vấn và được lựa chọn cho vị trí {vi_tri}.",
      [
        "- Chức danh: {chuc_danh}",
        "- Ngày bắt đầu: {ngay_bat_dau}",
        "- Thời gian làm việc: {thoi_gian_lam_viec}",
        "- Địa điểm: {dia_diem}",
        "- Chế độ đãi ngộ: Xem chi tiết trong file đính kèm",
      ].join("\n"),
      "File đính kèm “{ten_file}”: mức lương, phụ cấp, thời gian thử việc, phúc lợi, giấy tờ cần chuẩn bị và lịch trình ngày đầu đi làm.",
      "Bạn vui lòng trả lời email này để xác nhận nhận offer trước {han_xac_nhan}. Nếu có câu hỏi về công việc, vị trí hay chế độ, bạn liên hệ:\n{nguoi_lien_he}",
      "TD Games rất mong được chào đón bạn trở thành một phần của đội ngũ!",
      "{chu_ky}",
    ].join("\n\n"),
  },
  application_received: {
    subject: "[TD Games] Đã nhận hồ sơ ứng tuyển — {vi_tri}",
    body: [
      "Chào {ten_ung_vien},",
      "Cảm ơn bạn đã quan tâm và ứng tuyển vị trí {vi_tri} tại TD Games. Chúng mình đã nhận được hồ sơ của bạn.",
      "Bộ phận tuyển dụng sẽ xem xét hồ sơ và phản hồi bạn sớm nhất có thể. Trong thời gian này, nếu cần bổ sung thông tin (CV, portfolio…) hoặc có câu hỏi, bạn cứ trả lời trực tiếp email này nhé.",
      "Nếu sau 14 ngày bạn chưa nhận được phản hồi, nghĩa là hồ sơ chưa phù hợp ở thời điểm này — TD Games vẫn lưu hồ sơ để liên hệ khi có cơ hội phù hợp.",
      "Chúc bạn một ngày tốt lành!",
      "{chu_ky}",
    ].join("\n\n"),
  },
  on_hold: {
    subject: "Hồ sơ ứng tuyển đang được xem xét — {vi_tri} | TD Games",
    body: [
      "Chào {ten_ung_vien},",
      "Cảm ơn bạn đã dành thời gian ứng tuyển vị trí {vi_tri} tại TD Games.",
      "Hiện vị trí này đang trong giai đoạn đánh giá hồ sơ. Chúng mình sẽ phản hồi kết quả cho bạn trước {han_phan_hoi}.",
      "Trong thời gian này, nếu có câu hỏi hoặc muốn bổ sung thông tin (CV, portfolio…), bạn cứ trả lời trực tiếp email này nhé.",
      "Chúc bạn một ngày tốt lành!",
      "{chu_ky}",
    ].join("\n\n"),
  },
  position_filled: {
    subject: "Thông tin vị trí ứng tuyển — {vi_tri} | TD Games",
    body: [
      "Chào {ten_ung_vien},",
      "Cảm ơn bạn đã dành thời gian quan tâm và ứng tuyển vị trí {vi_tri} tại TD Games.",
      "Chúng mình xin báo vị trí này đã tìm được ứng viên phù hợp ở thời điểm hiện tại. TD Games sẽ lưu hồ sơ của bạn và chủ động liên hệ khi có cơ hội phù hợp.",
      "Chúc bạn nhiều may mắn và thành công trên con đường sắp tới.",
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
    chu_ky: buildSignature(input.support),
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
    han_phan_hoi: input.replyBy?.trim() || holdReplyBy(new Date()),
    ...offerVars(input),
  };
}

const HR_FALLBACK_CONTACT = `Phòng Nhân sự · ${HIRING_EMAIL}`;

function offerVars(input: DraftInput): Record<string, string> {
  const o = input.offer ?? null;
  const v = (s: string | undefined) => s?.trim() || "…";
  return {
    // Không còn dùng: lương chỉ nằm trong file PDF, thân mail không bao giờ có số.
    muc_luong: "…",
    ngay_bat_dau: o?.start?.trim() || v(o?.startDate),
    chuc_danh: o?.title?.trim() || input.jobTitle.trim() || "vị trí bạn ứng tuyển",
    thoi_gian_lam_viec: v(o?.workingHours),
    dia_diem: v(o?.location),
    han_xac_nhan: v(o?.confirmBy),
    nguoi_lien_he: o?.contact?.trim() || HR_FALLBACK_CONTACT,
    ten_file: v(o?.fileName),
  };
}

export type OfferContactUser = {
  role: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  disabled?: boolean;
  created_at?: string | null;
};

function contactLine(u: OfferContactUser): string {
  return [u.display_name, u.phone, u.email].map((x) => (x ?? "").trim()).filter(Boolean).join(" · ");
}

/**
 * Người liên hệ trong mail offer: người gửi là Kế toán/HR → chính người đó; vai khác (Sếp…) →
 * tài khoản Kế toán đầu tiên chưa khoá (theo created_at); không có → Phòng Nhân sự.
 * Định dạng "{tên} · {SĐT} · {email}", bỏ phần trống.
 */
export function offerContact(sender: OfferContactUser | null, users: OfferContactUser[]): string {
  const u = offerContactUser(sender, users);
  return (u && contactLine(u)) || HR_FALLBACK_CONTACT;
}

/** Tài khoản đứng tên liên hệ của mail offer (luật như `offerContact`); không có → null. */
export function offerContactUser<T extends OfferContactUser>(sender: T | null, users: T[]): T | null {
  if (sender && (sender.role === "accountant" || sender.role === "hr") && contactLine(sender)) return sender;
  return (
    users
      .filter((u) => u.role === "accountant" && !u.disabled)
      .sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")))
      .find((u) => !!contactLine(u)) ?? null
  );
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
  const base: DraftInput = {
    kind,
    candidateName: "Nguyễn Văn A",
    jobTitle: "2D Game Artist",
    support: { name: "Nguyễn Thị Minh Phương", phone: "0385456273" },
  };
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
    case "on_hold":
      return { ...base, replyBy: "Thứ Sáu 13/11/2026" };
    case "offer":
      return {
        ...base,
        offer: {
          title: "2D Game Artist",
          start: "8:45, Thứ Ba 01/12/2026",
          workingHours: "Từ thứ Hai đến thứ Sáu, 8:30 – 17:30",
          location: "Văn phòng TD Games – Tầng 4, 505 Minh Khai, Hai Bà Trưng, Hà Nội",
          confirmBy: "Thứ Sáu 27/11/2026",
          contact: "Ms. Thảo (Đào Thị Xuân Thảo) · 0964525584 · ketoan@tdconsulting.vn",
          fileName: "Thư mời nhận việc - Nguyễn Văn A.pdf",
        },
      };
    default:
      return base;
  }
}
