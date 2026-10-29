import "server-only";

import { fromFor, getHrEmailConfig, replyToFor, resolveCc, textToHtml, type CandidateEmailKind, type HrEmailConfig } from "./hr-email";
import { offerContactUser } from "./hr-email-templates";
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
    /** Ghi đè From / Reply-To mặc định (mail ứng viên: tên người support, trả lời về support + hiring@). */
    from?: string;
    replyTo?: string[];
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
        from: msg.from ?? cfg.from,
        reply_to: msg.replyTo && msg.replyTo.length ? msg.replyTo : cfg.replyTo,
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
  // Mail nội bộ: chân mail giữ hr@ (hiring@ dành cho ứng viên).
  const html = textToHtml(msg.text, {
    footerNote: "Bạn nhận email này vì được mời sử dụng TD Games HR.",
    footerEmail: "hr@tdgamestudio.com",
  });
  return sendViaResend(cfg, { to, subject: msg.subject, html, text: msg.text });
}

/**
 * CC / Reply-To / From cho 1 mail ứng viên (sếp chốt 2026-10-28): CC luôn hiring@ + người support
 * (+ Leader job ở mail PV / bài test, + Kế toán & Sếp ở offer); ứng viên trả lời → người support + hiring@;
 * From hiển thị tên người support.
 * Mail offer (sếp chốt 2026-10-29 — luồng offer chỉ Kế toán + Sếp): không CC người support; ứng viên trả lời
 * → người liên hệ offer + mọi Kế toán + hiring@; From/chữ ký = người liên hệ offer (như `offerContact`).
 */
export async function resolveCcForApplication(
  cfg: HrEmailConfig,
  kind: CandidateEmailKind,
  ctx: HrContext,
  app: { jobId: string | null; assigneeId: string | null },
): Promise<{
  cc: string[];
  ccPreview: string[];
  fixed: string[];
  replyTo: string[];
  from: string;
  /** Người support (đang hoạt động) — ký tên cuối mail. */
  support: { name: string; phone: string | null } | null;
}> {
  const supabase = getSupabaseAdmin();
  const { data: users, error } = await supabase.from("hr_users").select("id, email, role, disabled, display_name, phone, created_at");
  if (error) throw new Error(`resolveCc: ${error.message}`);
  let jobLeaderId: string | null = null;
  if (app.jobId) {
    const { data: job, error: jobErr } = await supabase.from("jobs").select("leader_user_id").eq("id", app.jobId).maybeSingle();
    if (jobErr) throw new Error(`resolveCc: ${jobErr.message}`);
    jobLeaderId = (job?.leader_user_id as string | null | undefined) ?? null;
  }
  const staff = (users ?? []).map((u) => ({
    id: String(u.id),
    email: String(u.email),
    role: u.role as HrRole,
    disabled: !!u.disabled,
    display_name: String(u.display_name ?? ""),
    phone: (u.phone as string | null) ?? null,
    created_at: (u.created_at as string | null) ?? null,
  }));
  const r = resolveCc(cfg, kind, staff, { assigneeId: app.assigneeId, jobLeaderId, senderEmail: ctx.user.email });
  if (kind === "offer") {
    const sender = staff.find((u) => u.id === ctx.user.id) ?? null;
    const contact = offerContactUser(sender, staff);
    const accountants = staff.filter((u) => u.role === "accountant" && !u.disabled);
    return {
      ...r,
      replyTo: replyToFor(cfg, contact ? [contact, ...accountants] : accountants),
      from: fromFor(cfg, contact?.display_name || null),
      support: contact?.display_name ? { name: contact.display_name, phone: contact.phone } : null,
    };
  }
  const assignee = app.assigneeId ? staff.find((u) => u.id === app.assigneeId) ?? null : null;
  return {
    ...r,
    replyTo: replyToFor(cfg, assignee),
    from: fromFor(cfg, assignee && !assignee.disabled ? assignee.display_name : null),
    support: assignee && !assignee.disabled && assignee.display_name ? { name: assignee.display_name, phone: assignee.phone } : null,
  };
}
