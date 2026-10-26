import "server-only";

import type { HrEmailConfig } from "./hr-email";

/** Gửi 1 mail qua Resend REST API. Không throw — trả `{ error }` để route báo lại HR. */
export async function sendViaResend(
  cfg: HrEmailConfig,
  msg: { to: string; subject: string; html: string; text: string },
): Promise<{ id: string } | { error: string }> {
  if (!cfg.apiKey) return { error: "RESEND_API_KEY chưa cấu hình" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: cfg.from,
        reply_to: cfg.replyTo,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok || !data.id) return { error: data.message ?? `Resend HTTP ${res.status}` };
    return { id: data.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không gọi được Resend" };
  }
}
