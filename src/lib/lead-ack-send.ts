import "server-only";

import { buildLeadAckEmail, getLeadAckConfig, ilikeExact, leadAckEnvelope } from "./lead-ack-email";
import { createLimiter } from "./hr-rate-limit";
import { WAITLIST_SOURCE } from "./leads";
import { getSupabaseAdmin } from "./supabase-admin";

export type LeadAckResult =
  | { status: "sent"; testMode: boolean; id: string }
  | { status: "skipped"; reason: "duplicate" | "rate_limited" }
  | { status: "error"; error: string };

/** Chặn form công khai bị dùng làm máy gửi spam (đổi email liên tục): tối đa 30 mail xác nhận/giờ toàn site. */
const globalLimiter = createLimiter(30, 60 * 60 * 1000);
const DEDUPE_MS = 24 * 60 * 60 * 1000;

/**
 * Gửi mail xác nhận cho 1 lead vừa lưu. Không throw. Mỗi email nhận tối đa 1 mail / 24 giờ
 * (lead cũ cùng email trong 24h → bỏ qua; lead vẫn lưu bình thường).
 * Gửi thẳng Resend REST, không qua `sendViaResend` (hàm dùng chung mail HR, cần BCC + chỉ text).
 */
export async function sendLeadAck(lead: {
  id: string;
  name: string;
  email: string;
  service: string;
  message: string;
}): Promise<LeadAckResult> {
  const cfg = getLeadAckConfig(process.env);
  if (!cfg.apiKey) return { status: "error", error: "RESEND_API_KEY chưa cấu hình" };

  const since = new Date(Date.now() - DEDUPE_MS).toISOString();
  const { count, error: qErr } = await getSupabaseAdmin()
    .from("leads")
    .select("id", { count: "exact", head: true })
    .ilike("email", ilikeExact(lead.email.trim()))
    .gt("created_at", since)
    .neq("id", lead.id)
    // Lead từ chat / waitlist không được gửi xác nhận → không tính.
    .not("source", "in", `("chat","${WAITLIST_SOURCE}")`);
  if (qErr) return { status: "error", error: `dedupe: ${qErr.message}` };
  if ((count ?? 0) > 0) return { status: "skipped", reason: "duplicate" };
  if (!globalLimiter.tryHit("all")) return { status: "skipped", reason: "rate_limited" };

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
      globalLimiter.undo("all");
      return { status: "error", error: data.message ?? `Resend HTTP ${res.status}` };
    }
    return { status: "sent", testMode: env.testMode, id: data.id };
  } catch (e) {
    globalLimiter.undo("all");
    return { status: "error", error: e instanceof Error ? e.message : "Không gọi được Resend" };
  }
}

/** Dòng hiển thị trong thông báo Discord. */
export function leadAckLabel(r: LeadAckResult): string {
  if (r.status === "sent") return r.testMode ? "🧪 test → hộp sếp" : "✅ đã gửi khách";
  if (r.status === "skipped") return r.reason === "duplicate" ? "⏭ bỏ qua (đã gửi trong 24h)" : "⏭ bỏ qua (quá 30 mail/giờ)";
  return `❌ lỗi: ${r.error.slice(0, 200)}`;
}
