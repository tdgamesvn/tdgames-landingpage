import "server-only";

import { fromFor, getHrEmailConfig, replyToFor, resolveRecipient, buildDraft, textToHtml } from "./hr-email";
import { sendViaResend } from "./hr-email-send";
import {
  AUTO_ACK_DEDUPE_HOURS,
  AUTO_ACK_HOURLY_CAP,
  AUTO_ACK_IP_MAX,
  AUTO_ACK_KEY,
  AUTO_ACK_SENT_BY,
  isAutoAckEnabled,
  sanitizeAckName,
  shouldSendAck,
} from "./hr-auto-ack";
import { createLimiter } from "./hr-rate-limit";
import { getSupabaseAdmin } from "./supabase-admin";

/** Tối đa 3 mail ack / IP / 24 giờ (in-memory, 1 process PM2). */
const ackIpLimiter = createLimiter(AUTO_ACK_IP_MAX, AUTO_ACK_DEDUPE_HOURS * 3600_000);

export async function readAutoAckEnabled(): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin().from("app_settings").select("value").eq("key", AUTO_ACK_KEY).maybeSingle();
  if (error) throw new Error(`hr_auto_ack: ${error.message}`);
  return isAutoAckEnabled(data?.value);
}

/**
 * Gửi mail "Cảm ơn ứng tuyển" cho hồ sơ vừa nộp. Chạy nền (after()) — nhà gọi bắt lỗi chỉ để log.
 * Không CC ai; chữ ký / From / Reply-To theo người support (assignee vừa giao).
 */
export async function sendApplicationAck(app: {
  applicationId: string;
  jobId: string;
  email: string;
  fullName: string;
  assigneeId: string | null;
  ip: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const supabase = getSupabaseAdmin();
  const enabled = await readAutoAckEnabled();
  if (!enabled) return { sent: false, reason: "disabled" };

  const { data: job, error: jobErr } = await supabase.from("jobs").select("title, is_active").eq("id", app.jobId).maybeSingle();
  if (jobErr) throw new Error(`hr_auto_ack job: ${jobErr.message}`);
  const jobActive = !!job && job.is_active === true;

  const toEmail = app.email.trim();
  const now = Date.now();
  const since = new Date(now - AUTO_ACK_DEDUPE_HOURS * 3600_000).toISOString();
  const sinceHour = new Date(now - 3600_000).toISOString();
  // Cùng email trong 24 giờ qua, MỌI job (so lower-case trong JS, tránh ilike với `_`).
  const [recentRes, hourRes] = await Promise.all([
    supabase.from("candidate_emails").select("to_email").eq("kind", "application_received").gte("created_at", since),
    supabase
      .from("candidate_emails")
      .select("id", { count: "exact", head: true })
      .eq("kind", "application_received")
      .gte("created_at", sinceHour),
  ]);
  if (recentRes.error) throw new Error(`hr_auto_ack dedupe: ${recentRes.error.message}`);
  if (hourRes.error) throw new Error(`hr_auto_ack cap: ${hourRes.error.message}`);
  const recentCount = (recentRes.data ?? []).filter((r) => String(r.to_email).trim().toLowerCase() === toEmail.toLowerCase()).length;
  const hourlyCount = hourRes.count ?? 0;
  const decision = shouldSendAck({ enabled, email: toEmail, recentCount, jobActive, hourlyCount });
  if (!decision.send) {
    if (decision.reason === "hourly_cap") console.warn(`[auto-ack] chạm trần ${AUTO_ACK_HOURLY_CAP} mail/giờ — bỏ qua application ${app.applicationId}`);
    return { sent: false, reason: decision.reason };
  }
  if (!ackIpLimiter.tryHit(app.ip)) return { sent: false, reason: "ip_limit" };

  const cfg = getHrEmailConfig(process.env);
  if (!cfg.apiKey) {
    ackIpLimiter.undo(app.ip);
    return { sent: false, reason: "no_api_key" };
  }

  const [{ data: tpl, error: tplErr }, assigneeRes] = await Promise.all([
    supabase.from("hr_email_templates").select("subject, body").eq("kind", "application_received").maybeSingle(),
    app.assigneeId
      ? supabase.from("hr_users").select("display_name, phone, email, disabled").eq("id", app.assigneeId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (tplErr) throw new Error(`hr_auto_ack template: ${tplErr.message}`);
  if (assigneeRes.error) throw new Error(`hr_auto_ack assignee: ${assigneeRes.error.message}`);
  const a = assigneeRes.data as { display_name: string | null; phone: string | null; email: string; disabled: boolean } | null;
  const active = a && !a.disabled ? a : null;
  const supportName = active?.display_name?.trim() || null;

  const draft = buildDraft(
    {
      kind: "application_received",
      candidateName: sanitizeAckName(app.fullName),
      jobTitle: String(job?.title ?? ""),
      support: supportName ? { name: supportName, phone: active?.phone ?? null } : null,
    },
    tpl ? { subject: String(tpl.subject), body: String(tpl.body) } : null,
  );
  const r = resolveRecipient(cfg, toEmail, draft.subject);
  const html = textToHtml(draft.text);
  // Đặt chỗ trước khi gửi: insert dòng chờ (resend_id null); xung đột index duy nhất (23505) → có đơn khác đã gửi → bỏ qua.
  const { data: row, error: insErr } = await supabase
    .from("candidate_emails")
    .insert({
      application_id: app.applicationId,
      kind: "application_received",
      to_email: toEmail,
      sent_to: r.to,
      cc_emails: [],
      test_mode: r.testMode,
      subject: r.subject,
      body_text: draft.text,
      body_html: html,
      resend_id: null,
      sent_by: AUTO_ACK_SENT_BY,
      sent_by_user_id: null,
    })
    .select("id")
    .single();
  if (insErr) {
    ackIpLimiter.undo(app.ip);
    if (insErr.code === "23505") return { sent: false, reason: "duplicate" };
    throw new Error(`hr_auto_ack không đặt chỗ được: ${insErr.message}`);
  }

  const sent = await sendViaResend(cfg, {
    to: r.to,
    subject: r.subject,
    html,
    text: draft.text,
    from: fromFor(cfg, supportName),
    replyTo: replyToFor(cfg, a ? { email: a.email, disabled: a.disabled } : null),
  });
  if ("error" in sent) {
    await supabase.from("candidate_emails").delete().eq("id", row.id);
    throw new Error(`hr_auto_ack gửi thất bại: ${sent.error}`);
  }
  const { error: updErr } = await supabase.from("candidate_emails").update({ resend_id: sent.id }).eq("id", row.id);
  if (updErr) throw new Error(`hr_auto_ack đã gửi nhưng không ghi được resend_id: ${updErr.message}`);
  return { sent: true };
}
