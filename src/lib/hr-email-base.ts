/**
 * Phần dùng chung của mail ứng viên (thuần, không I/O): loại mail, nhãn, định dạng giờ,
 * dữ liệu đầu vào bản nháp, chữ ký, dòng địa điểm. Tách khỏi `hr-email.ts` để
 * `hr-email-templates.ts` dùng được mà không vòng import (hr-email → templates → base).
 */

import { GOOGLE_MAPS_URL, OFFICE_ADDRESS } from "./company-location.ts";

export const CANDIDATE_EMAIL_KINDS = [
  "interview_invite",
  "interview_reschedule",
  "interview_cancel",
  "test_assignment",
  "rejection",
  "offer",
] as const;

export type CandidateEmailKind = (typeof CANDIDATE_EMAIL_KINDS)[number];

export const KIND_LABEL: Record<CandidateEmailKind, string> = {
  interview_invite: "Mời phỏng vấn",
  interview_reschedule: "Đổi lịch phỏng vấn",
  interview_cancel: "Huỷ lịch phỏng vấn",
  test_assignment: "Gửi bài test",
  rejection: "Báo kết quả (không phù hợp)",
  offer: "Gửi offer",
};

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
  /** Người support của hồ sơ — ký tên cuối mail (tên + SĐT). Không có → chữ ký chung. */
  support?: { name: string; phone: string | null } | null;
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
  /**
   * Mail offer: các chuỗi đã định dạng từ thư mời nhận việc (trống → "…").
   * `startDate` là trường cũ; `start` (giờ + ngày đã định dạng) ưu tiên hơn cho `{ngay_bat_dau}`.
   * Không có lương: `{muc_luong}` còn hợp lệ (mẫu cũ) nhưng luôn ra “…” — lương chỉ nằm trong file PDF.
   */
  offer?: {
    startDate?: string;
    title?: string;
    start?: string;
    workingHours?: string;
    location?: string;
    confirmBy?: string;
    contact?: string;
    fileName?: string;
  } | null;
};

/** Trắc nghiệm MBTI gửi ứng viên trước buổi PV (sếp chọn, 2026-10-26). */
export const MBTI_TEST_URL = "https://www.topcv.vn/mbti/lam-trac-nghiem";

/** Hộp thư tuyển dụng — mail gửi ứng viên đi từ / ký bằng địa chỉ này (sếp chốt 2026-10-28; hr@ cho việc nội bộ). */
export const HIRING_EMAIL = "hiring@tdgamestudio.com";

/** "0385456273" → "0385 456 273"; số khác (vd. +84…) giữ nguyên. */
export function formatPhoneVi(phone: string): string {
  return /^0\d{9}$/.test(phone) ? `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}` : phone;
}

/** Chữ ký mail ứng viên: có người support → tên + SĐT; luôn kèm hiring@ + website. */
export function buildSignature(support: { name: string; phone: string | null } | null | undefined): string {
  const name = support?.name.trim();
  if (!name) return ["Trân trọng,", "TD Games Studio — Phòng Nhân sự", `${HIRING_EMAIL} · https://tdgamestudio.com`].join("\n");
  const contact = [support?.phone ? formatPhoneVi(support.phone) : null, HIRING_EMAIL, "https://tdgamestudio.com"]
    .filter(Boolean)
    .join(" · ");
  return ["Trân trọng,", `${name} — Phòng Nhân sự TD Games`, contact].join("\n");
}

export const SIGNATURE = buildSignature(null);

export function whereLines(i: NonNullable<DraftInput["interview"]>): string[] {
  if (i.mode === "online" && i.meetUrl) {
    return ["- Hình thức: Online qua Google Meet", `- Link tham gia: ${i.meetUrl}`];
  }
  return [
    "- Hình thức: Trực tiếp tại văn phòng TD Games",
    `- Địa chỉ: ${OFFICE_ADDRESS}`,
    `- Bản đồ: ${GOOGLE_MAPS_URL}`,
  ];
}


export function isCandidateKind(v: unknown): v is CandidateEmailKind {
  return typeof v === "string" && (CANDIDATE_EMAIL_KINDS as readonly string[]).includes(v);
}
