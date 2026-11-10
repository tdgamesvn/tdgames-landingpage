// Mail xác nhận tự động cho khách gửi form báo giá (/api/leads) — phần thuần (test được).
// Sếp chốt 2026-11-10: gửi từ LEAD_OWNER_EMAIL, khách Reply về đó, BCC bản sao cho chủ hộp;
// mặc định chế độ test (chỉ LEAD_ACK_MODE=live mới gửi khách); trông như thư tay, không banner.
import { safeGreetingName } from "./chat-email.ts";
import { LEAD_OWNER_EMAIL } from "./leads.ts";

export type LeadAckConfig = {
  mode: "test" | "live";
  from: string;
  owner: string;
  apiKey: string | null;
};

export function getLeadAckConfig(env: Record<string, string | undefined>): LeadAckConfig {
  return {
    mode: env.LEAD_ACK_MODE === "live" ? "live" : "test",
    from: `"Toan Dang · TD Games Studio" <${LEAD_OWNER_EMAIL}>`,
    owner: LEAD_OWNER_EMAIL,
    apiKey: env.RESEND_API_KEY?.trim() || null,
  };
}

/** Test → gửi về hộp chủ (tiêu đề ghi rõ khách thật), không BCC. Live → gửi khách + BCC chủ hộp. */
export function leadAckEnvelope(cfg: LeadAckConfig, customerEmail: string, subject: string) {
  if (cfg.mode === "live") return { to: customerEmail, bcc: [cfg.owner], subject, testMode: false };
  return { to: cfg.owner, bcc: [] as string[], subject: `[TEST → ${customerEmail}] ${subject}`, testMode: true };
}

const VI_CHARS = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;

/** Khách viết tiếng Việt (có dấu) → mail tiếng Việt; còn lại tiếng Anh. */
export function isVietnamese(...texts: string[]): boolean {
  return texts.some((t) => VI_CHARS.test(t));
}

/** Dấu chấm mọi biến thể (ASCII, full-width, CJK, halfwidth, dấu chấm giữa…). */
const DOTS = ".。．｡․‥…·‧・܁܂۔";
/**
 * Token có "chữ/số + dấu chấm + chữ Latin/số" (tên miền kể cả IDN, IP, x.y), "://" hoặc "@" → coi là link.
 * Chấm cuối câu vẫn giữ; "。" giữa 2 chữ CJK là dấu câu (TLD luôn là chữ Latin/punycode).
 */
const LINKISH_TOKEN = new RegExp(`[\\p{L}\\p{N}-][${DOTS}][A-Za-z]|\\d[${DOTS}]\\d|:\\/\\/|@|^www`, "iu");
const QUOTE_MAX = 1500;

/** Token trông như link/tên miền/IP/email (sau NFKC) — dùng chung cho trích tin và kiểm mail AI. */
export function isLinkishToken(tok: string): boolean {
  return LINKISH_TOKEN.test(tok.normalize("NFKC"));
}

/**
 * Tin khách tự gõ được trích lại trong mail đi từ tên miền mình → bỏ mọi token trông như link/tên miền/IP
 * (chuẩn hoá NFKC trước, bắt cả dấu chấm Unicode) để form công khai không bị mượn gửi link lừa đảo tới
 * email người khác. Cắt độ dài, mỗi dòng thêm "> ".
 */
export function quoteMessage(message: string): string {
  let s = message
    .normalize("NFKC")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\S+/g, (tok) => (LINKISH_TOKEN.test(tok) ? "[link]" : tok)))
    .join("\n")
    .trim();
  if (s.length > QUOTE_MAX) s = `${s.slice(0, QUOTE_MAX).trimEnd()}…`;
  return s
    .split("\n")
    .map((l) => `> ${l}`.trimEnd())
    .join("\n");
}

export const LEAD_ACK_SIGNATURE = "Toan Dang\nTD Games Studio — 2D Art, Animation & VFX for Games";
export const LEAD_ACK_PORTFOLIO = "https://tdgamestudio.com/portfolio";

export const LEAD_ACK_FOOTER_EN =
  "You received this because this email address was entered in the contact form on tdgamestudio.com.";
export const LEAD_ACK_FOOTER_VI =
  "Anh/chị nhận email này vì địa chỉ này được nhập vào form liên hệ trên tdgamestudio.com.";

export function buildLeadAckEmail(lead: {
  name: string;
  service: string;
  message: string;
}): { subject: string; text: string; lang: "en" | "vi" } {
  const name = safeGreetingName(lead.name);
  const vi = isVietnamese(lead.name, lead.message);
  const other = lead.service === "Other";
  const quote = lead.message.trim() ? quoteMessage(lead.message) : "";

  if (vi) {
    const parts = [
      name ? `Chào ${name},` : "Chào anh/chị,",
      `Cảm ơn anh/chị đã liên hệ TD Games Studio. Tôi đã nhận được yêu cầu ${other ? "của anh/chị" : `về ${lead.service}`} và sẽ trực tiếp phản hồi trong vòng 1 ngày làm việc (giờ Việt Nam, GMT+7).`,
      "Để báo giá sát hơn, anh/chị có thể trả lời email này kèm những thông tin chưa gửi:\n- Ảnh hoặc link tham khảo phong cách art\n- Khối lượng dự kiến (số nhân vật, asset hoặc animation)\n- Deadline mong muốn",
      `Trong lúc chờ, anh/chị có thể xem các dự án gần đây của chúng tôi: ${LEAD_ACK_PORTFOLIO}`,
      `Hẹn sớm trao đổi,\n${LEAD_ACK_SIGNATURE}`,
      ...(quote ? [`---\nNội dung anh/chị đã gửi:\n${quote}`] : []),
      LEAD_ACK_FOOTER_VI,
    ];
    return { subject: "Đã nhận yêu cầu của anh/chị — TD Games Studio", text: parts.join("\n\n"), lang: "vi" };
  }

  const parts = [
    name ? `Hi ${name},` : "Hi there,",
    `Thanks for reaching out to TD Games Studio. I've received your request${other ? "" : ` for ${lead.service}`} and will get back to you personally within 1 business day (Vietnam time, GMT+7).`,
    "To help us prepare an accurate quote, feel free to reply to this email with anything you haven't shared yet:\n- Art style references (links or images)\n- Rough volume (number of characters, assets or animations)\n- Target deadline",
    `In the meantime, you can browse our recent work: ${LEAD_ACK_PORTFOLIO}`,
    `Talk soon,\n${LEAD_ACK_SIGNATURE}`,
    ...(quote ? [`---\nYour message:\n${quote}`] : []),
    LEAD_ACK_FOOTER_EN,
  ];
  return { subject: "We've received your request — TD Games Studio", text: parts.join("\n\n"), lang: "en" };
}

/**
 * Email chuẩn hoá để chống gửi trùng: chữ thường, bỏ "+tag"; Gmail bỏ dấu chấm và gộp googlemail.com
 * (a.b+x@GoogleMail.com ≡ ab@gmail.com — cùng một hộp thư).
 */
export function canonicalEmail(email: string): string {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 1) return e;
  let local = e.slice(0, at).split("+")[0];
  let domain = e.slice(at + 1);
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

/** Escape ký tự đặc biệt của ILIKE (% _ \) → so khớp email không phân biệt hoa thường mà không thành wildcard. */
export function ilikeExact(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}
