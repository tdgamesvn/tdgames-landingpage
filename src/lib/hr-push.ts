import "server-only";

import webpush from "web-push";
import { getSupabaseAdmin } from "./supabase-admin";
import type { PushPayload } from "./hr-push-payload";

/** Khoá VAPID — tạo bằng `npx web-push generate-vapid-keys`. Thiếu thì push tắt êm. */
export function getVapid() {
  const publicKey = process.env.HR_PUSH_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.HR_PUSH_VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject: process.env.HR_PUSH_SUBJECT?.trim() || "mailto:hr@tdgamestudio.com" };
}

type SubRow = { id: string; endpoint: string; p256dh: string; auth: string };

/**
 * Gửi 1 thông báo tới mọi thiết bị đã bật (hoặc chỉ 1 endpoint nếu truyền `onlyEndpoint`).
 * Endpoint trình duyệt báo hết hạn (404/410) thì xoá. Không throw.
 */
export async function sendHrPush(
  payload: PushPayload,
  onlyEndpoint?: string,
): Promise<{ sent: number; failed: number; removed: number; disabled?: true }> {
  const vapid = getVapid();
  if (!vapid) return { sent: 0, failed: 0, removed: 0, disabled: true };

  const supabase = getSupabaseAdmin();
  let q = supabase.from("hr_push_subscriptions").select("id, endpoint, p256dh, auth");
  if (onlyEndpoint) q = q.eq("endpoint", onlyEndpoint);
  const { data } = await q;
  const subs = (data ?? []) as SubRow[];

  const body = JSON.stringify(payload);
  const ok: string[] = [];
  const gone: string[] = [];
  let failed = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
          vapidDetails: vapid,
          TTL: 60 * 60,
          urgency: "high",
          topic: payload.tag.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) || undefined,
        });
        ok.push(s.id);
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.id);
        else failed++;
      }
    }),
  );

  if (gone.length) await supabase.from("hr_push_subscriptions").delete().in("id", gone);
  if (ok.length) {
    await supabase.from("hr_push_subscriptions").update({ last_success_at: new Date().toISOString() }).in("id", ok);
  }
  return { sent: ok.length, failed, removed: gone.length };
}
