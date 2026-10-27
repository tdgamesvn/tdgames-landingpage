/**
 * Mail HR gửi ứng viên — phần thuần (không I/O): cấu hình, chọn người nhận,
 * mẫu nội dung tiếng Việt, dựng HTML từ text. Gửi thật ở `hr-email-send.ts`.
 *
 * Chế độ test là mặc định: chỉ `HR_EMAIL_MODE=live` mới gửi tới ứng viên.
 */

import { OFFICE_ADDRESS } from "./company-location.ts";
import {
  CANDIDATE_EMAIL_KINDS,
  KIND_LABEL,
  MBTI_TEST_URL,
  formatInterviewLong,
  isCandidateKind,
  type CandidateEmailKind,
  type DraftInput,
} from "./hr-email-base.ts";
import { DEFAULT_TEMPLATES, renderTemplate, templateVars, type EmailTemplate } from "./hr-email-templates.ts";
import type { HrRole } from "./hr-permissions.ts";

export { CANDIDATE_EMAIL_KINDS, KIND_LABEL, MBTI_TEST_URL, formatInterviewLong };
export type { CandidateEmailKind, DraftInput };

export const isCandidateEmailKind = isCandidateKind;

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

/** Vai được tự CC theo loại mail. "leader" = Leader của job ứng viên; vai khác = mọi tài khoản active vai đó. */
export const CC_ROLES: Record<CandidateEmailKind, ("hr" | "leader" | "accountant" | "boss")[]> = {
  interview_invite: ["hr", "leader"],
  interview_reschedule: ["hr", "leader"],
  interview_cancel: ["hr", "leader"],
  test_assignment: ["hr", "leader"],
  rejection: ["hr"],
  offer: ["accountant", "hr", "boss"],
};

/**
 * Danh sách CC nội bộ. `ccPreview` luôn đầy đủ (để UI hiển thị); `cc` thực gửi chỉ có ở chế độ live.
 * Loại người gửi + tài khoản disabled, lower-case, gộp trùng, bỏ email sai.
 */
export function resolveCc(
  cfg: HrEmailConfig,
  kind: CandidateEmailKind,
  staff: { email: string; role: HrRole; disabled: boolean; id: string }[],
  jobLeaderId: string | null,
  senderEmail: string,
): { cc: string[]; ccPreview: string[] } {
  const roles = CC_ROLES[kind];
  const sender = senderEmail.trim().toLowerCase();
  const out = new Set<string>();
  for (const u of staff) {
    if (u.disabled) continue;
    // "leader" = người được gán phụ trách job (vai Leader hoặc Sếp kiêm Leader); vai khác theo role.
    const isJobLeader = roles.includes("leader") && jobLeaderId !== null && u.id === jobLeaderId;
    // Sếp luôn được CC mọi mail ứng viên (sếp chốt 2026-10-27).
    const hit = u.role === "boss" || isJobLeader || (u.role !== "leader" && (roles as string[]).includes(u.role));
    if (!hit || !isValidEmail(u.email)) continue;
    const e = u.email.trim().toLowerCase();
    if (e !== sender) out.add(e);
  }
  const ccPreview = [...out];
  return { cc: cfg.mode === "live" ? ccPreview : [], ccPreview };
}

/** Dựng bản nháp từ mẫu (HR đã sửa trong DB) hoặc mẫu mặc định. */
export function buildDraft(input: DraftInput, template?: EmailTemplate | null): { subject: string; text: string } {
  return renderTemplate(template ?? DEFAULT_TEMPLATES[input.kind], templateVars(input));
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

// Header là ẢNH có sẵn nền #0a0a0a + logo (1200×272, co theo bề ngang; tỉ lệ như bản cũ trên điện thoại). Gmail chế độ tối đảo màu nền ô nhưng không
// đảo ảnh → nếu để nền bằng CSS + logo chữ trắng thì nền thành sáng và chữ logo biến mất.
const HEADER_URL = "https://cdn.tdgamestudio.com/landing/logoCompany/mail-header-dark-v2.png";
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
  if (/^https:\/\/(www\.)?tdgamestudio\.com\/hr\/set-password\?/.test(url)) return "Đặt mật khẩu";
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
      return `<tr><td style="padding:10px 16px;width:120px;white-space:nowrap;vertical-align:top;font-size:13px;color:#71717a;border-top:1px solid #f0f0f1">${label}</td><td style="padding:10px 16px;vertical-align:top;font-weight:600;color:#18181b;border-top:1px solid #f0f0f1">${linkify(value)}</td></tr>`;
    })
    .join("")
    // Dòng đầu không cần kẻ trên.
    .replace(/border-top:1px solid #f0f0f1/, "border-top:0").replace(/border-top:1px solid #f0f0f1/, "border-top:0");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#fafafa;border:1px solid #e4e4e7;border-radius:10px;border-collapse:separate">${rows}</table>`;
}

/** Text (HR có thể đã sửa) → HTML mail có thương hiệu. Escape hết rồi mới dựng thẻ. */
export function textToHtml(text: string, opts?: { footerNote?: string }): string {
  const footerNote = opts?.footerNote ?? "Bạn nhận email này vì đã ứng tuyển tại TD Games.";
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
<tr><td style="background:#0a0a0a;padding:0;line-height:0;font-size:0"><img src="${HEADER_URL}" width="600" alt="TD Games Studio" style="display:block;border:0;width:100%;max-width:600px;height:auto"></td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:${ACCENT}">&nbsp;</td></tr>
<tr><td style="padding:32px;font-family:${FONT};font-size:15px;line-height:1.65;color:#27272a">
${body}
</td></tr>
</table>
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px"><tr><td style="padding:18px 32px;font-family:${FONT};font-size:12px;line-height:1.6;color:#a1a1aa;text-align:center">
TD Games Studio · ${escapeHtml(OFFICE_ADDRESS)}<br>
<a href="https://tdgamestudio.com" style="color:#71717a;text-decoration:none">tdgamestudio.com</a> · <a href="mailto:hr@tdgamestudio.com" style="color:#71717a;text-decoration:none">hr@tdgamestudio.com</a><br>
${escapeHtml(footerNote)}
</td></tr></table>
</td></tr></table>
</body></html>`;
}
