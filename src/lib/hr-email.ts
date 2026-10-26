/**
 * Mail HR gửi ứng viên — phần thuần (không I/O): cấu hình, chọn người nhận,
 * mẫu nội dung tiếng Việt, dựng HTML từ text. Gửi thật ở `hr-email-send.ts`.
 *
 * Chế độ test là mặc định: chỉ `HR_EMAIL_MODE=live` mới gửi tới ứng viên.
 */

import { GOOGLE_MAPS_URL, OFFICE_ADDRESS } from "./company-location.ts";

export const CANDIDATE_EMAIL_KINDS = [
  "interview_invite",
  "interview_reschedule",
  "interview_cancel",
  "test_assignment",
  "rejection",
] as const;

export type CandidateEmailKind = (typeof CANDIDATE_EMAIL_KINDS)[number];

export const KIND_LABEL: Record<CandidateEmailKind, string> = {
  interview_invite: "Mời phỏng vấn",
  interview_reschedule: "Đổi lịch phỏng vấn",
  interview_cancel: "Huỷ lịch phỏng vấn",
  test_assignment: "Gửi bài test",
  rejection: "Báo kết quả (không phù hợp)",
};

export function isCandidateEmailKind(v: unknown): v is CandidateEmailKind {
  return typeof v === "string" && (CANDIDATE_EMAIL_KINDS as readonly string[]).includes(v);
}

export type HrEmailConfig = {
  mode: "test" | "live";
  from: string;
  replyTo: string;
  testTo: string;
  apiKey: string | null;
};

export function getHrEmailConfig(env: Record<string, string | undefined>): HrEmailConfig {
  return {
    mode: env.HR_EMAIL_MODE === "live" ? "live" : "test",
    from: env.HR_EMAIL_FROM?.trim() || "TD Games HR <hr@tdgamestudio.com>",
    replyTo: env.HR_EMAIL_REPLY_TO?.trim() || "hr@tdgamestudio.com",
    testTo: env.HR_EMAIL_TEST_TO?.trim() || "tony@tdgamestudio.com",
    apiKey: env.RESEND_API_KEY?.trim() || null,
  };
}

export function isValidEmail(s: string | null | undefined): boolean {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/** Người nhận do server quyết: chế độ test luôn đổi `to` về hộp nội bộ. */
export function resolveRecipient(cfg: HrEmailConfig, candidateEmail: string, subject: string) {
  if (cfg.mode === "live") return { to: candidateEmail, subject, testMode: false };
  return { to: cfg.testTo, subject: `[TEST → ${candidateEmail}] ${subject}`, testMode: true };
}

const VN_TZ = "Asia/Ho_Chi_Minh";
const WEEKDAY_LONG: Record<string, string> = {
  Mon: "Thứ Hai", Tue: "Thứ Ba", Wed: "Thứ Tư", Thu: "Thứ Năm", Fri: "Thứ Sáu", Sat: "Thứ Bảy", Sun: "Chủ Nhật",
};

/** "15:30, Thứ Hai 19/10/2026" theo giờ VN. */
export function formatInterviewLong(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-GB", { timeZone: VN_TZ, hour: "2-digit", minute: "2-digit", hour12: false });
  const date = d.toLocaleDateString("en-GB", { timeZone: VN_TZ, day: "2-digit", month: "2-digit", year: "numeric" });
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: VN_TZ, weekday: "short" }).format(d);
  return `${time}, ${WEEKDAY_LONG[wd] ?? wd} ${date}`;
}

export type DraftInput = {
  kind: CandidateEmailKind;
  candidateName: string;
  jobTitle: string;
  interview?: {
    scheduledAt: string;
    mode: "offline" | "online" | null;
    meetUrl: string | null;
    round: number;
  } | null;
  prevScheduledAt?: string | null;
  testUrl?: string | null;
};

const SIGNATURE = [
  "Trân trọng,",
  "TD Games Studio — Phòng Nhân sự",
  "https://tdgamestudio.com · hr@tdgamestudio.com",
].join("\n");

function whereLines(i: NonNullable<DraftInput["interview"]>): string[] {
  if (i.mode === "online" && i.meetUrl) {
    return ["- Hình thức: Online qua Google Meet", `- Link tham gia: ${i.meetUrl}`];
  }
  return [
    "- Hình thức: Trực tiếp tại văn phòng TD Games",
    `- Địa chỉ: ${OFFICE_ADDRESS}`,
    `- Bản đồ: ${GOOGLE_MAPS_URL}`,
  ];
}

export function buildDraft(input: DraftInput): { subject: string; text: string } {
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
          ...(i ? whereLines(i) : []),
        ].join("\n"),
        "Bạn vui lòng trả lời mail này để xác nhận tham gia. Nếu khung giờ trên chưa phù hợp, cứ báo lại để chúng mình sắp xếp lịch khác nhé.",
      ];
      break;
    case "interview_reschedule":
      subject = `Thay đổi lịch phỏng vấn — ${job} | TD Games`;
      body = [
        `Lịch phỏng vấn${roundText} vị trí ${job} của bạn đã được cập nhật như sau:`,
        [
          i ? `- Thời gian mới: ${formatInterviewLong(i.scheduledAt)} (giờ Việt Nam)` : "- Thời gian mới: (HR bổ sung)",
          ...(i ? whereLines(i) : []),
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
  }

  return { subject, text: [hello, ...body, SIGNATURE].join("\n\n") };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Text (HR có thể đã sửa) → HTML an toàn: escape hết rồi mới gắn link. */
export function textToHtml(text: string): string {
  const paras = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const html = escapeHtml(p)
        // Sau escape, `"` thành &quot; nên URL không thể thoát khỏi thuộc tính href.
        .replace(/https?:\/\/[^\s<&]+(?:&amp;[^\s<&]+)*/g, (url) => `<a href="${url}" style="color:#ea580c">${url}</a>`)
        .replace(/\n/g, "<br>");
      return `<p style="margin:0 0 14px">${html}</p>`;
    })
    .join("\n");
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff"><div style="max-width:600px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937">\n${paras}\n</div></body></html>`;
}
