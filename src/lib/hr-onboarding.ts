// Logic thuần (không I/O) cho khối Onboard người mới trong /hr.
import type { HrRole, PermissionKey } from "./hr-permissions.ts";
import { addWorkingDays, isValidDate } from "./offer-letter.ts";

const SHORT_WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export type OnboardStage = "before" | "day1" | "week1";
export type OnboardTemplateItem = { id: string; label: string; stage: OnboardStage; leader: boolean };
export type OnboardItem = OnboardTemplateItem & {
  done_at: string | null;
  done_by_user_id: string | null;
  done_by_name: string | null;
};
export type OnboardReminded = Partial<Record<OnboardStage, { at: string; for_date: string }>>;

export const ONBOARD_STAGES: readonly OnboardStage[] = ["before", "day1", "week1"];
export const STAGE_LABEL: Record<OnboardStage, string> = {
  before: "Trước ngày đi làm",
  day1: "Ngày đầu",
  week1: "Cuối tuần đầu",
};

export const DEFAULT_ONBOARDING_TEMPLATE: OnboardTemplateItem[] = [
  { id: "confirm-date", stage: "before", leader: false, label: "Nhắn/gọi xác nhận lại ngày giờ đi làm với ứng viên" },
  { id: "notify-team", stage: "before", leader: false, label: "Báo Leader & team ngày người mới vào" },
  { id: "prepare-seat", stage: "before", leader: false, label: "Chuẩn bị chỗ ngồi, máy tính, thiết bị (màn hình, wacom…)" },
  { id: "accounts", stage: "before", leader: false, label: "Tạo tài khoản: email công việc, Discord, công cụ team dùng" },
  { id: "welcome", stage: "day1", leader: false, label: "Đón, giới thiệu công ty & team (training hội nhập)" },
  { id: "contract", stage: "day1", leader: false, label: "Ký hợp đồng (CTV / thử việc / chính thức)" },
  { id: "documents", stage: "day1", leader: false, label: "Nhận giấy tờ (bản sao CCCD…)" },
  { id: "leader-guide", stage: "day1", leader: true, label: "Leader hướng dẫn quy trình & giao việc đầu tiên" },
  { id: "week1-checkin", stage: "week1", leader: false, label: "Hỏi thăm cảm nhận / khó khăn của bạn mới" },
];

export function sanitizeOnboardingTemplate(input: unknown): OnboardTemplateItem[] {
  if (!Array.isArray(input)) return [];
  const out: OnboardTemplateItem[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.label !== "string") continue;
    if (!ONBOARD_STAGES.includes(r.stage as OnboardStage)) continue;
    const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : crypto.randomUUID();
    out.push({ id, label: r.label.trim(), stage: r.stage as OnboardStage, leader: r.leader === true });
  }
  return out;
}

export function validateOnboardingTemplate(items: OnboardTemplateItem[]): string | null {
  if (items.length === 0) return "Checklist phải có ít nhất 1 mục";
  if (items.length > 30) return "Checklist tối đa 30 mục";
  const ids = new Set<string>();
  for (const it of items) {
    if (!it.label.trim()) return "Tên mục không được để trống";
    if (it.label.length > 200) return "Tên mục tối đa 200 ký tự";
    if (ids.has(it.id)) return "Có mục bị trùng mã";
    ids.add(it.id);
  }
  return null;
}

export function isOnboardingEligible(app: { offer_status: string | null; work_type: string | null }): boolean {
  return app.offer_status === "accepted" && app.work_type !== "freelancer";
}

export function itemsFromTemplate(t: OnboardTemplateItem[]): OnboardItem[] {
  return t.map((x) => ({ ...x, done_at: null, done_by_user_id: null, done_by_name: null }));
}

export function onboardingProgress(items: OnboardItem[]): { done: number; total: number } {
  return { done: items.filter((x) => x.done_at !== null).length, total: items.length };
}

export function prevWorkingDay(date: string): string {
  if (!isValidDate(date)) return date;
  const d = new Date(`${date}T00:00:00Z`);
  do {
    d.setUTCDate(d.getUTCDate() - 1);
  } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString().slice(0, 10);
}

export function reminderDates(startDate: string): Record<OnboardStage, string> {
  return { before: prevWorkingDay(startDate), day1: startDate, week1: addWorkingDays(startDate, 4) };
}

export function dueReminders(i: {
  startDate: string | null;
  items: OnboardItem[];
  reminded: OnboardReminded;
  todayVn: string;
  minutesVn: number;
}): OnboardStage[] {
  if (!i.startDate || i.minutesVn < 480) return [];
  const dates = reminderDates(i.startDate);
  return ONBOARD_STAGES.filter(
    (s) =>
      dates[s] === i.todayVn &&
      i.reminded[s]?.for_date !== i.startDate &&
      i.items.some((x) => x.stage === s && x.done_at === null),
  );
}

export function canTickItem(i: {
  role: HrRole;
  perms: Set<PermissionKey>;
  isJobLeader: boolean;
  item: OnboardTemplateItem;
}): boolean {
  if (i.role === "boss" || i.perms.has("onboard.edit")) return true;
  return i.role === "leader" && i.isJobLeader && i.item.leader && i.perms.has("onboard.view");
}

export function setItemDone(
  items: OnboardItem[],
  itemId: string,
  done: boolean,
  actor: { id: string; name: string },
  nowIso: string,
): OnboardItem[] | null {
  if (!items.some((x) => x.id === itemId)) return null;
  return items.map((x) =>
    x.id !== itemId
      ? x
      : done
        ? { ...x, done_at: nowIso, done_by_user_id: actor.id, done_by_name: actor.name }
        : { ...x, done_at: null, done_by_user_id: null, done_by_name: null },
  );
}

export function onboardingCardState(i: {
  startDate: string | null;
  items: OnboardItem[];
  todayVn: string;
}): "done" | "overdue" | "active" {
  if (i.items.length > 0 && i.items.every((x) => x.done_at !== null)) return "done";
  if (i.startDate && i.todayVn > reminderDates(i.startDate).week1) return "overdue";
  return "active";
}

/** "T2 23/11" cho thẻ ứng viên; ngày sai → "". */
export function shortDateVi(date: string): string {
  if (!isValidDate(date)) return "";
  const d = new Date(`${date}T00:00:00Z`);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${SHORT_WEEKDAY[d.getUTCDay()]} ${dd}/${mm}`;
}
