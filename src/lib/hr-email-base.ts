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

export const SIGNATURE = [
  "Trân trọng,",
  "TD Games Studio — Phòng Nhân sự",
  "https://tdgamestudio.com · hr@tdgamestudio.com",
].join("\n");

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
