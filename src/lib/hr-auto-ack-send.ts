import "server-only";

import { fromFor, getHrEmailConfig, replyToFor, resolveRecipient, buildDraft, textToHtml, type DraftInput } from "./hr-email";
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
type AckInput = {
  applicationId: string;
  jobId: string;
  email: string;
  fullName: string;
  assigneeId: string | null;
  ip: string;
};

// Chạy LẦN LƯỢT trong tiến trình (PM2 1 process): đếm trần giờ + đặt chỗ + gửi của mail trước xong rồi mới tới
// mail sau → nhiều đơn tới cùng lúc không vượt được trần (đếm rồi chèn không còn khe hở giữa các request).
let ackQueue: Promise<unknown> = Promise.resolve();

export function sendApplicationAck(app: AckInput): Promise<{ sent: boolean; reason?: string }> {
  const run = ackQueue.then(() => sendApplicationAckNow(app));
  ackQueue = run.catch(() => undefined);
  return run;
}

async function sendApplicationAckNow(app: AckInput): Promise<{ sent: boolean; reason?: string }> {
  const supabase = getSupabaseAdmin();
  const enabled = await readAutoAckEnabled();
  if (!enabled) return { sent: false, reason: "disabled" };

  const { data: job, error: jobErr } = await supabase.from("jobs").select("title, is_active").eq("id", app.jobId).maybeSingle();
  if (jobErr) throw new Error(`hr_auto_ack job: ${jobErr.message}`);
  const jobActive = !!job && job.is_active === true;

  const toEmail = app.email.trim();
  const since = new Date(Date.now() - AUTO_ACK_DEDUPE_HOURS * 3600_000).toISOString();
  // Cùng email trong 24 giờ qua, MỌI job (so lower-case trong JS, tránh ilike với `_`).
  const [recentRes, hourlyCount] = await Promise.all([
    supabase.from("candidate_emails").select("to_email").eq("kind", "application_received").gte("created_at", since),
    countAutoMailsLastHour(),
  ]);
  if (recentRes.error) throw new Error(`hr_auto_ack dedupe: ${recentRes.error.message}`);
  const recentCount = (recentRes.data ?? []).filter((r) => String(r.to_email).trim().toLowerCase() === toEmail.toLowerCase()).length;
  const decision = shouldSendAck({ enabled, email: toEmail, recentCount, jobActive, hourlyCount });
  if (!decision.send) {
    if (decision.reason === "hourly_cap") console.warn(`[auto-ack] chạm trần ${AUTO_ACK_HOURLY_CAP} mail/giờ — bỏ qua application ${app.applicationId}`);
    return { sent: false, reason: decision.reason };
  }
  return reserveAndSend({
    kind: "application_received",
    applicationId: app.applicationId,
    toEmail,
    ip: app.ip,
    supportUserId: app.assigneeId,
    input: { candidateName: sanitizeAckName(app.fullName), jobTitle: String(job?.title ?? "") },
  });
}

/** Mail tự động (ack + duplicate_rejection) trong 1 giờ qua — chung trần AUTO_ACK_HOURLY_CAP. */
async function countAutoMailsLastHour(): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from("candidate_emails")
    .select("id", { count: "exact", head: true })
    .in("kind", AUTO_MAIL_KINDS)
    .gte("created_at", new Date(Date.now() - 3600_000).toISOString());
  if (error) throw new Error(`hr_auto_ack cap: ${error.message}`);
  return count ?? 0;
}

const AUTO_MAIL_KINDS = ["application_received", "duplicate_rejection"] as const;

/**
 * Phần chung của mail tự động: giới hạn IP → mẫu + người support → đặt chỗ `candidate_emails` (index duy nhất
 * theo kind; 23505 = đã có mail → bỏ qua) → gửi Resend → lỗi thì xoá chỗ đặt; xong ghi resend_id.
 */
async function reserveAndSend(i: {
  kind: (typeof AUTO_MAIL_KINDS)[number];
  applicationId: string;
  toEmail: string;
  ip: string;
  supportUserId: string | null;
  input: Omit<DraftInput, "kind" | "support">;
}): Promise<{ sent: boolean; reason?: string }> {
  const supabase = getSupabaseAdmin();
  if (!ackIpLimiter.tryHit(i.ip)) return { sent: false, reason: "ip_limit" };

  const cfg = getHrEmailConfig(process.env);
  if (!cfg.apiKey) {
    ackIpLimiter.undo(i.ip);
    return { sent: false, reason: "no_api_key" };
  }

  const [{ data: tpl, error: tplErr }, supportRes] = await Promise.all([
    supabase.from("hr_email_templates").select("subject, body").eq("kind", i.kind).maybeSingle(),
    i.supportUserId
      ? supabase.from("hr_users").select("display_name, phone, email, disabled").eq("id", i.supportUserId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (tplErr) {
    ackIpLimiter.undo(i.ip);
    throw new Error(`hr_auto_ack template: ${tplErr.message}`);
  }
  if (supportRes.error) {
    ackIpLimiter.undo(i.ip);
    throw new Error(`hr_auto_ack assignee: ${supportRes.error.message}`);
  }
  const a = supportRes.data as { display_name: string | null; phone: string | null; email: string; disabled: boolean } | null;
  const active = a && !a.disabled ? a : null;
  const supportName = active?.display_name?.trim() || null;

  const draft = buildDraft(
    { ...i.input, kind: i.kind, support: supportName ? { name: supportName, phone: active?.phone ?? null } : null },
    tpl ? { subject: String(tpl.subject), body: String(tpl.body) } : null,
  );
  const r = resolveRecipient(cfg, i.toEmail, draft.subject);
  const html = textToHtml(draft.text);
  const { data: row, error: insErr } = await supabase
    .from("candidate_emails")
    .insert({
      application_id: i.applicationId,
      kind: i.kind,
      to_email: i.toEmail,
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
    ackIpLimiter.undo(i.ip);
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

type DuplicateRejectionInput = {
  applicationId: string;
  jobId: string;
  email: string;
  fullName: string;
  /** Người phụ trách hồ sơ cũ — ký tên, From, Reply-To. */
  supportUserId: string | null;
  ip: string;
  /** dd/mm/yyyy */
  prevAppliedAt: string;
  /** dd/mm/yyyy */
  reapplyFrom: string;
  referrerName: string | null;
};

/**
 * Mail "Đã ứng tuyển trước đó" cho đơn bị tự động từ chối (nộp lại đúng vị trí trong 6 tháng sau khi bị reject).
 * Chung công tắc + trần/giờ + giới hạn IP + hàng đợi với mail ack; gửi cả khi job đã đóng.
 */
export function sendDuplicateRejection(app: DuplicateRejectionInput): Promise<{ sent: boolean; reason?: string }> {
  const run = ackQueue.then(() => sendDuplicateRejectionNow(app));
  ackQueue = run.catch(() => undefined);
  return run;
}

async function sendDuplicateRejectionNow(app: DuplicateRejectionInput): Promise<{ sent: boolean; reason?: string }> {
  const enabled = await readAutoAckEnabled();
  const { data: job, error: jobErr } = await getSupabaseAdmin().from("jobs").select("title").eq("id", app.jobId).maybeSingle();
  if (jobErr) throw new Error(`hr_auto_ack job: ${jobErr.message}`);
  const toEmail = app.email.trim();
  const decision = shouldSendAck({ enabled, email: toEmail, recentCount: 0, hourlyCount: await countAutoMailsLastHour() });
  if (!decision.send) return { sent: false, reason: decision.reason };
  return reserveAndSend({
    kind: "duplicate_rejection",
    applicationId: app.applicationId,
    toEmail,
    ip: app.ip,
    supportUserId: app.supportUserId,
    input: {
      candidateName: sanitizeAckName(app.fullName),
      jobTitle: String(job?.title ?? ""),
      duplicate: { prevAppliedAt: app.prevAppliedAt, reapplyFrom: app.reapplyFrom, referrerName: app.referrerName },
    },
  });
}
