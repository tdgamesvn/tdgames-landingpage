/**
 * Thông báo đẩy (Web Push) cho app PWA /hr — phần thuần: dựng nội dung, kiểm subscription.
 * Gửi thật ở `hr-push.ts` (server-only, cần khoá VAPID).
 */

import { formatInterviewTime } from "./interview-schedule.ts";

export type PushPayload = { title: string; body: string; url: string; tag: string };

export function interviewReminderPayload(i: {
  candidateName: string;
  jobTitle: string | null;
  roundTitle: string;
  scheduledAt: string;
  mode: "offline" | "online" | null;
  meetUrl: string | null;
  minutes: number;
  interviewId: string;
  applicationId: string;
}): PushPayload {
  const where = i.mode === "online" ? "Online (Google Meet)" : "Tại văn phòng";
  const job = i.jobTitle ? ` · ${i.jobTitle}` : "";
  return {
    title: `⏰ Sắp PV — ${i.candidateName} (~${i.minutes} phút)`,
    body: `${formatInterviewTime(i.scheduledAt)} · ${i.roundTitle}${job}\n${where}`,
    url: "/hr",
    // Cùng tag → thông báo mới thay thế cái cũ của cùng vòng PV, không chồng nhiều cái.
    tag: `interview-${i.interviewId}`,
  };
}

export type PushSubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

// Server sẽ POST tới endpoint → chỉ nhận host của dịch vụ push chính thức (chặn SSRF).
const PUSH_HOSTS = ["fcm.googleapis.com", "web.push.apple.com"];
const PUSH_HOST_SUFFIXES = [".push.apple.com", ".push.services.mozilla.com", ".notify.windows.com"];

function isPushServiceUrl(raw: string) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || u.username || u.password || u.port) return false;
    const h = u.hostname.toLowerCase();
    return PUSH_HOSTS.includes(h) || PUSH_HOST_SUFFIXES.some((s) => h.endsWith(s));
  } catch {
    return false;
  }
}

export function isPushSubscriptionInput(v: unknown): v is PushSubscriptionInput {
  if (!v || typeof v !== "object") return false;
  const s = v as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  return (
    typeof s.endpoint === "string" &&
    s.endpoint.length < 2000 &&
    isPushServiceUrl(s.endpoint) &&
    typeof s.keys?.p256dh === "string" &&
    typeof s.keys?.auth === "string"
  );
}
