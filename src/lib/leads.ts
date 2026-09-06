/** Shared giữa form public (contact-showcase-section) và API /api/leads. */

/**
 * ponytail: waitlist tool dùng chung bảng `leads` thay vì bảng riêng — chỉ có mỗi
 * cột email, không đáng một migration + một nguồn fetch thứ hai cho /crm.
 * `source` là thứ tách nó khỏi pipeline bán hàng ở CRMBoard.
 */
export const WAITLIST_SOURCE = "tool-waitlist";

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
  message: string;
  source: string;
  status: LeadStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}
