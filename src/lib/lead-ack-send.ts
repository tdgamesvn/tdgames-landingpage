import "server-only";

import { buildLeadAckEmail, canonicalEmail, getLeadAckConfig, ilikeExact, leadAckEnvelope } from "./lead-ack-email";
import {
  ACK_SYSTEM_PROMPT,
  ackSendAt,
  buildAckUserMessage,
  composeAiAck,
  guardAckDraft,
  scheduledAtParam,
} from "./lead-ack-ai";
import { FALLBACK_MODEL } from "./chat-ai-core";
import { createLimiter } from "./hr-rate-limit";
import { getSupabaseAdmin } from "./supabase-admin";

export type LeadAckResult =
  | { status: "sent"; testMode: boolean; id: string; writer: "ai" | "template"; sendAt: string; note?: string }
  | { status: "skipped"; reason: "duplicate" | "ip_limited" | "rate_limited" }
  | { status: "error"; error: string };

type AckLead = { id: string; name: string; email: string; service: string; budget: string | null; message: string };

const HOUR = 60 * 60 * 1000;
const DEDUPE_MS = 24 * HOUR;
/** Chặn form công khai bị dùng làm máy gửi spam (PM2 1 process → giới hạn trong RAM là đủ). */
const globalLimiter = createLimiter(30, HOUR); // toàn site
const ipLimiter = createLimiter(3, HOUR); // mỗi IP
const emailLimiter = createLimiter(1, DEDUPE_MS); // mỗi hộp thư (email chuẩn hoá: +tag, chấm Gmail)
const RESEND = "https://api.resend.com/emails";

async function callModel(model: string, user: string): Promise<string> {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("AI_BASE_URL / AI_API_KEY chưa cấu hình");
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: ACK_SYSTEM_PROMPT },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`${model} HTTP ${res.status}`);
  const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return j.choices?.[0]?.message?.content ?? "";
}

/** AI viết (model chính → dự phòng); nháp không qua kiểm tra hoặc cả 2 model lỗi → mail mẫu. */
async function writeAck(lead: AckLead): Promise<{ subject: string; text: string; writer: "ai" | "template"; note?: string }> {
  const user = buildAckUserMessage(lead);
  const models = [...new Set([process.env.AI_MODEL || FALLBACK_MODEL, process.env.LEAD_ACK_FALLBACK_MODEL || FALLBACK_MODEL])];
  const notes: string[] = [];
  for (const model of models) {
    try {
      const g = guardAckDraft(await callModel(model, user));
      if ("draft" in g) return { ...composeAiAck(g.draft), writer: "ai", ...(notes.length ? { note: notes.join(" | ") } : {}) };
      notes.push(`${model}: ${g.reject}`);
    } catch (e) {
      notes.push(e instanceof Error ? e.message : String(e));
    }
  }
  return { ...buildLeadAckEmail(lead), writer: "template", note: notes.join(" | ") };
}

/**
 * Soạn (AI) + hẹn giờ gửi mail xác nhận cho 1 lead vừa lưu (4–7 phút sau lúc gửi form). Không throw.
 * Mỗi email tối đa 1 mail / 24 giờ (lead khác cùng email trong 24h — mọi nguồn — hoặc cùng hộp thư chuẩn hoá).
 * Lưu id Resend vào lead để /crm huỷ được trước giờ gửi. Gửi thẳng Resend REST, không qua `sendViaResend`.
 */
export async function sendLeadAck(lead: AckLead, ip: string, submittedAt: number = Date.now()): Promise<LeadAckResult> {
  const result = await scheduleAck(lead, ip, submittedAt);
  const row =
    result.status === "sent"
      ? { ack_email_id: result.id, ack_send_at: result.sendAt, ack_status: "scheduled", ack_writer: result.writer }
      : { ack_status: result.status };
  const { data: after, error } = await getSupabaseAdmin().from("leads").update(row).eq("id", lead.id).select("status").maybeSingle();
  // Sếp đã xử lý lead (đổi trạng thái / xoá) trong lúc AI đang viết → huỷ luôn mail vừa hẹn.
  if (result.status === "sent" && !error && (!after || after.status !== "new")) {
    await cancelResend(result.id);
    if (after) await getSupabaseAdmin().from("leads").update({ ack_status: "cancelled" }).eq("id", lead.id);
  }
  return result;
}

async function scheduleAck(lead: AckLead, ip: string, submittedAt: number): Promise<LeadAckResult> {
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

  const mail = await writeAck(lead);
  const env = leadAckEnvelope(cfg, lead.email.trim(), mail.subject);
  const sendAt = ackSendAt(submittedAt);
  const scheduledAt = scheduledAtParam(sendAt, Date.now());
  try {
    const res = await fetch(RESEND, {
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
        ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok || !data.id) {
      undo();
      return { status: "error", error: data.message ?? `Resend HTTP ${res.status}` };
    }
    return {
      status: "sent",
      testMode: env.testMode,
      id: data.id,
      writer: mail.writer,
      sendAt: scheduledAt ?? new Date().toISOString(),
      ...(mail.note ? { note: mail.note } : {}),
    };
  } catch (e) {
    undo();
    return { status: "error", error: e instanceof Error ? e.message : "Không gọi được Resend" };
  }
}

/**
 * Huỷ mail xác nhận còn đang hẹn giờ của 1 lead (đổi trạng thái / bấm Huỷ / xoá lead trong /crm). Không throw.
 * - "cancelled": đã huỷ (hoặc Resend báo không còn hẹn giờ mà chưa tới giờ gửi — coi như đã huỷ).
 * - "too_late": đã qua giờ gửi. "none": lead không có mail hẹn.
 */
export async function cancelLeadAck(leadId: string): Promise<"cancelled" | "too_late" | "none" | "error"> {
  const db = getSupabaseAdmin();
  const { data: lead } = await db.from("leads").select("ack_email_id, ack_send_at, ack_status").eq("id", leadId).maybeSingle();
  if (!lead?.ack_email_id || lead.ack_status !== "scheduled") return "none";
  if (lead.ack_send_at && new Date(lead.ack_send_at).getTime() <= Date.now()) return "too_late";
  const r = await cancelResend(lead.ack_email_id);
  if (r === "cancelled") await db.from("leads").update({ ack_status: "cancelled" }).eq("id", leadId);
  return r;
}

async function cancelResend(id: string): Promise<"cancelled" | "too_late" | "error"> {
  const apiKey = getLeadAckConfig(process.env).apiKey;
  if (!apiKey) return "error";
  try {
    const res = await fetch(`${RESEND}/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
    // 422 "Email is not scheduled" = đã gửi (vừa tới giờ) hoặc đã huỷ trước đó.
    if (res.status === 422) return "too_late";
    return res.ok ? "cancelled" : "error";
  } catch {
    return "error";
  }
}

/** Dòng hiển thị trong thông báo Discord. */
export function leadAckLabel(r: LeadAckResult): string {
  if (r.status === "sent") {
    const at = new Date(r.sendAt).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });
    const who = r.writer === "ai" ? "AI viết" : `mail mẫu${r.note ? ` (AI: ${r.note.slice(0, 120)})` : ""}`;
    return `${r.testMode ? "🧪 test → hộp sếp" : "✅ gửi khách"} · hẹn ${at} · ${who} · huỷ được trong /crm`;
  }
  if (r.status === "skipped")
    return r.reason === "duplicate" ? "⏭ bỏ qua (đã gửi trong 24h)" : r.reason === "ip_limited" ? "⏭ bỏ qua (IP quá 3 mail/giờ)" : "⏭ bỏ qua (quá 30 mail/giờ)";
  return `❌ lỗi: ${r.error.slice(0, 200)}`;
}
