import "server-only";

import { fromFor, getHrEmailConfig, isValidEmail, replyToFor, resolveRecipient, buildDraft, textToHtml } from "./hr-email";
import { sendViaResend } from "./hr-email-send";
import { AUTO_ACK_DEDUPE_HOURS, AUTO_ACK_KEY, AUTO_ACK_SENT_BY, isAutoAckEnabled, shouldSendAck } from "./hr-auto-ack";
import { getSupabaseAdmin } from "./supabase-admin";

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
  jobTitle: string;
  assigneeId: string | null;
}): Promise<{ sent: boolean; reason?: string }> {
  const supabase = getSupabaseAdmin();
  const enabled = await readAutoAckEnabled();
  if (!enabled || !isValidEmail(app.email)) return { sent: false, reason: enabled ? "invalid_email" : "disabled" };

  const toEmail = app.email.trim();
  const since = new Date(Date.now() - AUTO_ACK_DEDUPE_HOURS * 3600_000).toISOString();
  const { data: recent, error: recentErr } = await supabase
    .from("candidate_emails")
    .select("to_email, applications!inner(job_id)")
    .eq("kind", "application_received")
    .eq("applications.job_id", app.jobId)
    .gte("created_at", since);
  if (recentErr) throw new Error(`hr_auto_ack dedupe: ${recentErr.message}`);
  const recentCount = (recent ?? []).filter((r) => String(r.to_email).trim().toLowerCase() === toEmail.toLowerCase()).length;
  const decision = shouldSendAck({ enabled, email: toEmail, recentCount });
  if (!decision.send) return { sent: false, reason: decision.reason };

  const cfg = getHrEmailConfig(process.env);
  if (!cfg.apiKey) return { sent: false, reason: "no_api_key" };

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
      candidateName: app.fullName,
      jobTitle: app.jobTitle,
      support: supportName ? { name: supportName, phone: active?.phone ?? null } : null,
    },
    tpl ? { subject: String(tpl.subject), body: String(tpl.body) } : null,
  );
  const r = resolveRecipient(cfg, toEmail, draft.subject);
  const html = textToHtml(draft.text);
  const sent = await sendViaResend(cfg, {
    to: r.to,
    subject: r.subject,
    html,
    text: draft.text,
    from: fromFor(cfg, supportName),
    replyTo: replyToFor(cfg, a ? { email: a.email, disabled: a.disabled } : null),
  });
  if ("error" in sent) throw new Error(`hr_auto_ack gửi thất bại: ${sent.error}`);

  const { error: insErr } = await supabase.from("candidate_emails").insert({
    application_id: app.applicationId,
    kind: "application_received",
    to_email: toEmail,
    sent_to: r.to,
    cc_emails: [],
    test_mode: r.testMode,
    subject: r.subject,
    body_text: draft.text,
    body_html: html,
    resend_id: sent.id,
    sent_by: AUTO_ACK_SENT_BY,
    sent_by_user_id: null,
  });
  if (insErr) throw new Error(`hr_auto_ack đã gửi nhưng không lưu lịch sử: ${insErr.message}`);
  return { sent: true };
}
