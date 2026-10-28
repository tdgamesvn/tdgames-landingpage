import "server-only";

import { getHrEmailConfig, resolveCc, textToHtml, type CandidateEmailKind, type HrEmailConfig } from "./hr-email";
import { getSupabaseAdmin } from "./supabase-admin";
import type { HrContext } from "./hr-session";
import type { HrRole } from "./hr-permissions";

/** Gửi 1 mail qua Resend REST API. Không throw — trả `{ error }` để route báo lại HR. */
export async function sendViaResend(
  cfg: HrEmailConfig,
  msg: {
    to: string;
    subject: string;
    html: string;
    text: string;
    cc?: string[];
    /** File đính kèm, `content` = base64. */
    attachments?: { filename: string; content: string }[];
  },
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
        ...(msg.cc && msg.cc.length ? { cc: msg.cc } : {}),
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        ...(msg.attachments && msg.attachments.length ? { attachments: msg.attachments } : {}),
      }),
      // Có file đính kèm (PDF vài trăm KB) → cho thêm thời gian upload.
      signal: AbortSignal.timeout(msg.attachments?.length ? 30_000 : 15_000),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok || !data.id) return { error: data.message ?? `Resend HTTP ${res.status}` };
    return { id: data.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không gọi được Resend" };
  }
}

/** Mail cho nhân viên (mời, đặt lại mật khẩu): gửi thẳng tới `to` thật, không qua chế độ test. */
export async function sendStaffEmail(
  to: string,
  msg: { subject: string; text: string },
): Promise<{ id: string } | { error: string }> {
  const cfg = getHrEmailConfig(process.env);
  const html = textToHtml(msg.text, { footerNote: "Bạn nhận email này vì được mời sử dụng TD Games HR." });
  return sendViaResend(cfg, { to, subject: msg.subject, html, text: msg.text });
}

/** CC nội bộ cho 1 mail: đọc tài khoản staff + Leader của job. */
export async function resolveCcForApplication(
  cfg: HrEmailConfig,
  kind: CandidateEmailKind,
  ctx: HrContext,
  jobId: string | null,
): Promise<{ cc: string[]; ccPreview: string[] }> {
  const supabase = getSupabaseAdmin();
  const { data: users, error } = await supabase.from("hr_users").select("id, email, role, disabled");
  if (error) throw new Error(`resolveCc: ${error.message}`);
  let jobLeaderId: string | null = null;
  if (jobId) {
    const { data: job, error: jobErr } = await supabase.from("jobs").select("leader_user_id").eq("id", jobId).maybeSingle();
    if (jobErr) throw new Error(`resolveCc: ${jobErr.message}`);
    jobLeaderId = (job?.leader_user_id as string | null | undefined) ?? null;
  }
  const staff = (users ?? []).map((u) => ({
    id: String(u.id),
    email: String(u.email),
    role: u.role as HrRole,
    disabled: !!u.disabled,
  }));
  return resolveCc(cfg, kind, staff, jobLeaderId, ctx.user.email);
}
