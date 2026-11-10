import "server-only";

import { buildLeadAckEmail, canonicalEmail, getLeadAckConfig, ilikeExact, leadAckEnvelope } from "./lead-ack-email";
import { createLimiter } from "./hr-rate-limit";
import { getSupabaseAdmin } from "./supabase-admin";

export type LeadAckResult =
  | { status: "sent"; testMode: boolean; id: string }
  | { status: "skipped"; reason: "duplicate" | "ip_limited" | "rate_limited" }
  | { status: "error"; error: string };

const HOUR = 60 * 60 * 1000;
const DEDUPE_MS = 24 * HOUR;
/** Chặn form công khai bị dùng làm máy gửi spam (PM2 1 process → giới hạn trong RAM là đủ). */
const globalLimiter = createLimiter(30, HOUR); // toàn site
const ipLimiter = createLimiter(3, HOUR); // mỗi IP
const emailLimiter = createLimiter(1, DEDUPE_MS); // mỗi hộp thư (email chuẩn hoá: +tag, chấm Gmail)

/**
 * Gửi mail xác nhận cho 1 lead vừa lưu. Không throw. Mỗi email nhận tối đa 1 mail / 24 giờ
 * (có lead khác cùng email trong 24h — mọi nguồn — hoặc cùng hộp thư chuẩn hoá → bỏ qua; lead vẫn lưu).
 * Gửi thẳng Resend REST, không qua `sendViaResend` (hàm dùng chung mail HR, cần BCC + chỉ text).
 */
export async function sendLeadAck(
  lead: { id: string; name: string; email: string; service: string; message: string },
  ip: string,
): Promise<LeadAckResult> {
  const cfg = getLeadAckConfig(process.env);
  if (!cfg.apiKey) return { status: "error", error: "RESEND_API_KEY chưa cấu hình" };

  const since = new Date(Date.now() - DEDUPE_MS).toISOString();
  const { count, error: qErr } = await getSupabaseAdmin()
    .from("leads")
    .select("id", { count: "exact", head: true })
    .ilike("email", ilikeExact(lead.email.trim()))
    .gt("created_at", since)
    .neq("id", lead.id);
  if (qErr) return { status: "error", error: `dedupe: ${qErr.message}` };
  const box = canonicalEmail(lead.email);
  if ((count ?? 0) > 0 || emailLimiter.count(box) > 0) return { status: "skipped", reason: "duplicate" };
  if (ipLimiter.count(ip) >= 3) return { status: "skipped", reason: "ip_limited" };
  if (!globalLimiter.tryHit("all")) return { status: "skipped", reason: "rate_limited" };
  emailLimiter.tryHit(box);
  ipLimiter.tryHit(ip);
  const undo = () => {
    globalLimiter.undo("all");
    emailLimiter.undo(box);
    ipLimiter.undo(ip);
  };

  const mail = buildLeadAckEmail(lead);
  const env = leadAckEnvelope(cfg, lead.email.trim(), mail.subject);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: cfg.from,
        reply_to: [cfg.owner],
        to: [env.to],
        ...(env.bcc.length ? { bcc: env.bcc } : {}),
        subject: env.subject,
        // Chỉ text: trông như thư tay (sếp chốt), Gmail tự gắn link.
        text: mail.text,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok || !data.id) {
      undo();
      return { status: "error", error: data.message ?? `Resend HTTP ${res.status}` };
    }
    return { status: "sent", testMode: env.testMode, id: data.id };
  } catch (e) {
    undo();
    return { status: "error", error: e instanceof Error ? e.message : "Không gọi được Resend" };
  }
}

/** Dòng hiển thị trong thông báo Discord. */
export function leadAckLabel(r: LeadAckResult): string {
  if (r.status === "sent") return r.testMode ? "🧪 test → hộp sếp" : "✅ đã gửi khách";
  if (r.status === "skipped") return r.reason === "duplicate" ? "⏭ bỏ qua (đã gửi trong 24h)" : r.reason === "ip_limited" ? "⏭ bỏ qua (IP quá 3 mail/giờ)" : "⏭ bỏ qua (quá 30 mail/giờ)";
  return `❌ lỗi: ${r.error.slice(0, 200)}`;
}
