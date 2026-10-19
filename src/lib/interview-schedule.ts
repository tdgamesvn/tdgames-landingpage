/**
 * Lịch phỏng vấn — dùng chung cho API sửa vòng PV, cron nhắc trước giờ PV
 * và báo cáo HR buổi sáng. Giờ luôn hiển thị theo giờ Việt Nam, vì server
 * (VPS) chạy UTC.
 */

export type InterviewMode = "offline" | "online";

const VN_TZ = "Asia/Ho_Chi_Minh";

/** "15:30 T2 19/10" theo giờ VN. */
export function formatInterviewTime(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-GB", { timeZone: VN_TZ, hour: "2-digit", minute: "2-digit", hour12: false });
  const date = d.toLocaleDateString("en-GB", { timeZone: VN_TZ, day: "2-digit", month: "2-digit" });
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: VN_TZ, weekday: "short" }).format(d);
  const WEEKDAY: Record<string, string> = { Mon: "T2", Tue: "T3", Wed: "T4", Thu: "T5", Fri: "T6", Sat: "T7", Sun: "CN" };
  return `${time} ${WEEKDAY[wd] ?? wd} ${date}`;
}

/** Ngày (YYYY-MM-DD) theo giờ VN — để lọc "PV hôm nay". */
export function vnDateKey(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: VN_TZ });
}

/** Chỉ nhận link Google Meet (meet.google.com/...) — tránh dán nhầm link khác. */
export function isMeetUrl(url: string) {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" && u.hostname === "meet.google.com" && u.pathname.length > 1;
  } catch {
    return false;
  }
}

export function modeLabel(mode: string | null | undefined, meetUrl?: string | null) {
  if (mode === "online") return meetUrl ? `💻 Online — ${meetUrl}` : "💻 Online";
  if (mode === "offline") return "🏢 Offline tại văn phòng";
  return "Chưa chọn hình thức";
}
