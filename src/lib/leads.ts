/** Shared giữa form public (contact-showcase-section) và API /api/leads. */

/**
 * ponytail: waitlist tool dùng chung bảng `leads` thay vì bảng riêng — chỉ có mỗi
 * cột email, không đáng một migration + một nguồn fetch thứ hai cho /crm.
 * `source` là thứ tách nó khỏi pipeline bán hàng ở CRMBoard.
 */
export const WAITLIST_SOURCE = "tool-waitlist";

/** Hộp thư nhận/ trả lời khách báo giá (sếp chốt 2026-11-10): mail xác nhận gửi từ đây, khách Reply về đây. */
export const LEAD_OWNER_EMAIL = "toan.dang@tdgamestudio.com";

/** Soạn mail trong Gmail đúng tài khoản LEAD_OWNER_EMAIL (không phụ thuộc app mail mặc định của máy). */
export function gmailComposeUrl(to: string, subject = "", body = ""): string {
  const q = new URLSearchParams({ authuser: LEAD_OWNER_EMAIL, view: "cm", fs: "1", to });
  if (subject) q.set("su", subject);
  if (body) q.set("body", body);
  return `https://mail.google.com/mail/?${q.toString()}`;
}

/** Mở các thư đã trao đổi với khách (mail xác nhận BCC + khách trả lời) trong Gmail. */
export function gmailThreadUrl(email: string): string {
  return `https://mail.google.com/mail/?authuser=${encodeURIComponent(LEAD_OWNER_EMAIL)}#search/${encodeURIComponent(email)}`;
}

export const LEAD_SERVICES = [
  "2D Art",
  "2D Animation",
  "2D VFX",
  "Other",
] as const;

export const LEAD_BUDGETS = [
  "Under $5k",
  "$5k – $20k",
  "$20k+",
  "Not sure yet",
] as const;

/** Kênh chat khách muốn được liên hệ — email hay bị bỏ qua. */
export const LEAD_CONTACT_CHANNELS = [
  "Telegram",
  "WhatsApp",
  "Discord",
  "Slack",
  "Facebook Messenger",
  "LINE",
  "WeChat",
  "Zalo",
  "Other",
] as const;

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "quoted",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  id: string;
  name: string;
  email: string;
  service: string;
  budget: string | null;
  contact_channel: string | null;
  contact_handle: string | null;
  message: string;
  source: string;
  status: LeadStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}
