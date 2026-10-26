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
  /** Hồ sơ đã có kết quả MBTI → mail mời PV không nhắc làm trắc nghiệm nữa. */
  hasMbti?: boolean;
};

/** Trắc nghiệm MBTI gửi ứng viên trước buổi PV (sếp chọn, 2026-10-26). */
export const MBTI_TEST_URL = "https://www.topcv.vn/mbti/lam-trac-nghiem";

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

// ── HTML mail (layout bảng, inline style — chạy được trên Gmail/Outlook/Apple Mail) ──

const LOGO_URL = "https://cdn.tdgamestudio.com/landing/logoCompany/logo_td2.png"; // icon cam + chữ trắng
const ACCENT = "#ea580c";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const URL_RE = /https?:\/\/[^\s<&]+(?:&amp;[^\s<&]+)*/g;

/** Dấu câu cuối câu ("…/abc." hoặc "(…)") không thuộc URL. */
function trimUrl(match: string) {
  return match.replace(/[.,;:!?)\]]+$/, "");
}

function linkLabel(url: string) {
  return /^https:\/\/maps\.app\.goo\.gl\//.test(url) ? "Xem trên Google Maps" : url;
}

/** Text đã escape → gắn <a>. Sau escape `"` thành &quot; nên URL không thoát được khỏi href. */
function linkify(escaped: string) {
  return escaped.replace(URL_RE, (match) => {
    const url = trimUrl(match);
    return `<a href="${url}" style="color:${ACCENT};text-decoration:underline">${linkLabel(url)}</a>${match.slice(url.length)}`;
  });
}

/** Link cần nút bấm nổi bật (Meet, trang nộp bài test). */
function ctaLabel(url: string): string | null {
  if (/^https:\/\/meet\.google\.com\//.test(url)) return "Tham gia Google Meet";
  if (/^https:\/\/(www\.)?tdgamestudio\.com\/test\//.test(url)) return "Mở đề bài &amp; nộp bài";
  if (url === MBTI_TEST_URL) return "Làm trắc nghiệm MBTI";
  return null;
}

function ctaButtons(escaped: string) {
  const urls = [...escaped.matchAll(URL_RE)].map((m) => trimUrl(m[0]));
  return urls
    .map((url) => [url, ctaLabel(url)] as const)
    .filter(([, label]) => label)
    .map(
      ([url, label]) =>
        `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 22px"><tr><td style="border-radius:8px;background:${ACCENT}"><a href="${url}" style="display:inline-block;padding:12px 24px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">${label}</a></td></tr></table>`,
    )
    .join("");
}

function infoTable(lines: string[]) {
  const rows = lines
    .map((line) => {
      const t = line.replace(/^-\s*/, "");
      const idx = t.indexOf(": ");
      if (idx === -1) return `<tr><td colspan="2" style="padding:10px 16px;color:#18181b">${linkify(t)}</td></tr>`;
      const label = t.slice(0, idx);
      const value = t.slice(idx + 2);
      return `<tr><td style="padding:10px 16px;width:120px;vertical-align:top;font-size:13px;color:#71717a;border-top:1px solid #f0f0f1">${label}</td><td style="padding:10px 16px;vertical-align:top;font-weight:600;color:#18181b;border-top:1px solid #f0f0f1">${linkify(value)}</td></tr>`;
    })
    .join("")
    // Dòng đầu không cần kẻ trên.
    .replace(/border-top:1px solid #f0f0f1/, "border-top:0").replace(/border-top:1px solid #f0f0f1/, "border-top:0");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#fafafa;border:1px solid #e4e4e7;border-radius:10px;border-collapse:separate">${rows}</table>`;
}

/** Text (HR có thể đã sửa) → HTML mail có thương hiệu. Escape hết rồi mới dựng thẻ. */
export function textToHtml(text: string): string {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const body = blocks
    .map((raw) => {
      const p = escapeHtml(raw);
      const lines = p.split("\n");
      if (lines.every((l) => /^-\s/.test(l))) return infoTable(lines) + ctaButtons(p);
      if (/^Trân trọng/i.test(p)) {
        const [first, name, ...rest] = lines;
        return `<p style="margin:28px 0 0;padding-top:18px;border-top:1px solid #e4e4e7;color:#52525b">${first}<br><strong style="color:#18181b">${name ?? ""}</strong>${rest.length ? `<br><span style="font-size:13px">${linkify(rest.join("<br>"))}</span>` : ""}</p>`;
      }
      return `<p style="margin:0 0 16px">${linkify(lines.join("<br>"))}</p>${ctaButtons(p)}`;
    })
    .join("\n");

  const preheader = escapeHtml(text.replace(/\s+/g, " ").trim().slice(0, 140));

  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>TD Games Studio</title></head>
<body style="margin:0;padding:0;background:#f4f4f5">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e4e4e7;border-radius:14px;overflow:hidden">
<tr><td style="background:#0a0a0a;padding:22px 32px"><img src="${LOGO_URL}" width="150" alt="TD Games Studio" style="display:block;border:0;width:150px;height:auto"></td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:${ACCENT}">&nbsp;</td></tr>
<tr><td style="padding:32px;font-family:${FONT};font-size:15px;line-height:1.65;color:#27272a">
${body}
</td></tr>
</table>
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px"><tr><td style="padding:18px 32px;font-family:${FONT};font-size:12px;line-height:1.6;color:#a1a1aa;text-align:center">
TD Games Studio · ${escapeHtml(OFFICE_ADDRESS)}<br>
<a href="https://tdgamestudio.com" style="color:#71717a;text-decoration:none">tdgamestudio.com</a> · <a href="mailto:hr@tdgamestudio.com" style="color:#71717a;text-decoration:none">hr@tdgamestudio.com</a><br>
Bạn nhận email này vì đã ứng tuyển tại TD Games.
</td></tr></table>
</td></tr></table>
</body></html>`;
}
