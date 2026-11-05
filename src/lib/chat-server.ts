import "server-only";

// Chat trên website — thao tác DB + chuông + mail. Luật thuần ở chat.ts.
import { getSupabaseAdmin } from "./supabase-admin";
import {
  CHAT_HOURS_DEFAULT,
  EMAIL_GAP_MINUTES,
  emptyThreadIds,
  PUSH_GAP_MINUTES,
  hashToken,
  isWithinHours,
  newToken,
  nextThreadState,
  shouldEmail,
  shouldPush,
  type ChatAudience,
  type ChatEvent,
  type ChatHours,
  type ChatKind,
  type ChatSender,
  type ChatStatus,
} from "./chat";
import { buildChatReplyEmail, CHAT_EMAIL_FOOTER, chatFrom } from "./chat-email";
import { effectivePermissions, HR_ROLES, type HrRole, type PermissionKey } from "./hr-permissions";
import { getHrEmailConfig, resolveRecipient, textToHtml } from "./hr-email";
import { sendViaResend } from "./hr-email-send";
import { sendHrPush } from "./hr-push";
import { SITE_URL } from "./json-ld";

export type ChatThreadRow = {
  id: string;
  last_preview: string | null;
  last_sender: string | null;
  audience: ChatAudience;
  status: ChatStatus;
  needs_human: boolean;
  name: string | null;
  email: string | null;
  country: string | null;
  user_agent: string | null;
  first_page: string | null;
  last_page: string | null;
  pages: string[];
  merged_into: string | null;
  lead_id: string | null;
  email_pending: boolean;
  last_visitor_seen_at: string | null;
  last_message_at: string;
  last_push_at: string | null;
  last_email_at: string | null;
  created_at: string;
};

export type ChatMessageRow = {
  id: string;
  thread_id: string;
  sender: ChatSender;
  staff_user_id: string | null;
  staff_name: string | null;
  kind: ChatKind;
  body: string;
  quick_reply_id: string | null;
  link_label: string | null;
  link_url: string | null;
  created_at: string;
};

export type QuickReplyRow = {
  id: string;
  label: string;
  audience: "client" | "candidate" | "any";
  answer: string;
  link_label: string | null;
  link_url: string | null;
  sort_order: number;
  active: boolean;
};

const THREAD_COLS =
  "id, last_preview, last_sender, audience, status, needs_human, name, email, country, user_agent, first_page, last_page, pages, merged_into, lead_id, email_pending, last_visitor_seen_at, last_message_at, last_push_at, last_email_at, created_at";
const MSG_COLS =
  "id, thread_id, sender, staff_user_id, staff_name, kind, body, quick_reply_id, link_label, link_url, created_at";
const EMAIL_LINK_DAYS = 30;
const RETENTION_MONTHS = 24;

const db = () => getSupabaseAdmin();

/** Dev: ép giờ trực bằng CHAT_FORCE_HOURS=online|offline (bỏ qua ở production). */
export async function chatOnline(now = new Date()): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") {
    if (process.env.CHAT_FORCE_HOURS === "online") return true;
    if (process.env.CHAT_FORCE_HOURS === "offline") return false;
  }
  return isWithinHours(now, await chatHours());
}

export async function chatHours(): Promise<ChatHours> {
  const { data } = await db().from("app_settings").select("value").eq("key", "chat_hours").maybeSingle();
  try {
    const v = JSON.parse(String(data?.value ?? ""));
    if (v && typeof v.tz === "string" && /^\d\d:\d\d$/.test(v.start) && /^\d\d:\d\d$/.test(v.end)) return v;
  } catch {
    /* mặc định */
  }
  return CHAT_HOURS_DEFAULT;
}

export async function chatWidgetEnabled(): Promise<boolean> {
  const { data } = await db().from("app_settings").select("value").eq("key", "chat_widget_enabled").maybeSingle();
  return String(data?.value ?? "true") !== "false";
}

export async function activeQuickReplies(): Promise<QuickReplyRow[]> {
  const { data } = await db()
    .from("chat_quick_replies")
    .select("id, label, audience, answer, link_label, link_url, sort_order, active")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as QuickReplyRow[];
}

export async function threadForToken(token: string | null | undefined): Promise<ChatThreadRow | null> {
  if (!token || token.length < 20 || token.length > 100) return null;
  const { data, error } = await db().from("chat_threads").select(THREAD_COLS).eq("visitor_token_hash", hashToken(token)).maybeSingle();
  // Lỗi DB ≠ không có luồng: ném lỗi để route trả 5xx, tránh tạo luồng mới đè mất mã khách.
  if (error) throw new Error(`threadForToken: ${error.message}`);
  return (data as ChatThreadRow | null) ?? null;
}

export async function threadById(id: string): Promise<ChatThreadRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db().from("chat_threads").select(THREAD_COLS).eq("id", id).maybeSingle();
  return (data as ChatThreadRow | null) ?? null;
}

export async function createThread(args: {
  page: string | null;
  userAgent: string | null;
  country: string | null;
  audience: ChatAudience;
}): Promise<{ thread: ChatThreadRow; token: string }> {
  const token = newToken();
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from("chat_threads")
    .insert({
      visitor_token_hash: hashToken(token),
      audience: args.audience,
      user_agent: args.userAgent?.slice(0, 300) ?? null,
      country: args.country,
      first_page: args.page,
      last_page: args.page,
      pages: args.page ? [args.page] : [],
      last_visitor_seen_at: now,
    })
    .select(THREAD_COLS)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Không tạo được luồng chat");
  return { thread: data as ChatThreadRow, token };
}

/** Tin của luồng theo thứ tự thời gian. Không có `after` → 500 tin MỚI nhất (luồng rất dài vẫn thấy tin cuối). */
export async function listMessages(threadId: string, after?: string | null): Promise<ChatMessageRow[]> {
  let q = db().from("chat_messages").select(MSG_COLS).eq("thread_id", threadId).order("created_at", { ascending: false }).limit(500);
  if (after && !Number.isNaN(Date.parse(after))) q = q.gt("created_at", after);
  const { data, error } = await q;
  if (error) throw new Error(`listMessages: ${error.message}`);
  return ((data ?? []) as ChatMessageRow[]).reverse();
}

export async function touchVisitor(threadId: string, page?: string | null, pages?: string[]): Promise<void> {
  const patch: Record<string, unknown> = { last_visitor_seen_at: new Date().toISOString() };
  if (page) {
    patch.last_page = page;
    if (pages) patch.pages = [...pages.filter((p) => p !== page), page].slice(-5);
  }
  await db().from("chat_threads").update(patch).eq("id", threadId);
}

async function insertMessages(rows: Partial<ChatMessageRow>[]): Promise<ChatMessageRow[]> {
  const { data, error } = await db().from("chat_messages").insert(rows).select(MSG_COLS);
  if (error) throw new Error(error.message);
  const out = ((data ?? []) as ChatMessageRow[]).sort((a, b) => a.created_at.localeCompare(b.created_at));
  // Preview cho danh sách chat: tin khách bấm nút → hiện nhãn nút, không phải câu trả lời có sẵn.
  // (Chỉ tin nhắn / nút khách bấm — dòng hệ thống "để lại email" & câu trả lời có sẵn không đè preview.)
  const shown = [...out].reverse().find((m) => m.kind === "text" || m.kind === "quick_reply");
  if (shown) {
    const { error: e2 } = await db()
      .from("chat_threads")
      .update({ last_preview: shown.body.slice(0, 200), last_sender: shown.sender })
      .eq("id", shown.thread_id);
    if (e2) console.error("[chat] cập nhật preview lỗi:", e2.message);
  }
  return out;
}

/** Cập nhật luồng; lỗi → ném (route trả 5xx thay vì để tin đã lưu mà trạng thái luồng sai). */
async function updateThread(id: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await db().from("chat_threads").update(patch).eq("id", id);
  if (error) throw new Error(`updateThread: ${error.message}`);
}

/** Tin của khách: text / gọi người / bấm câu có sẵn (ghi kèm câu trả lời có sẵn). Cập nhật trạng thái + chuông. */
export async function addVisitorMessage(
  thread: ChatThreadRow,
  args: {
    event: Extract<ChatEvent, "visitor_text" | "talk_to_person" | "quick_reply">;
    body: string;
    quickReply?: QuickReplyRow | null;
    audience?: ChatAudience;
    page?: string | null;
  },
): Promise<ChatMessageRow[]> {
  const now = new Date();
  const rows: Partial<ChatMessageRow>[] = [];
  if (args.event === "quick_reply" && args.quickReply) {
    const qr = args.quickReply;
    rows.push({ thread_id: thread.id, sender: "visitor", kind: "quick_reply", body: qr.label, quick_reply_id: qr.id });
    rows.push({
      thread_id: thread.id,
      sender: "system",
      kind: "canned_answer",
      body: qr.answer,
      quick_reply_id: qr.id,
      link_label: qr.link_label,
      link_url: qr.link_url,
    });
  } else {
    rows.push({ thread_id: thread.id, sender: "visitor", kind: "text", body: args.body });
  }
  // Thứ tự ổn định khi insert cùng lúc: dời created_at từng dòng 1ms.
  rows.forEach((r, i) => (r.created_at = new Date(now.getTime() + i).toISOString()));
  const inserted = await insertMessages(rows);

  const next = nextThreadState({ status: thread.status, needsHuman: thread.needs_human }, args.event);
  const push =
    args.event !== "quick_reply" &&
    shouldPush({
      wasNeedsHuman: thread.needs_human,
      isNeedsHuman: next.needsHuman,
      lastPushAt: thread.last_push_at ? new Date(thread.last_push_at) : null,
      now,
    });
  const audience = args.audience ?? thread.audience;
  const patch: Record<string, unknown> = {
    status: next.status,
    needs_human: next.needsHuman,
    audience,
    last_message_at: now.toISOString(),
    last_visitor_seen_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
  if (args.page) {
    patch.last_page = args.page;
    patch.pages = [...(thread.pages ?? []).filter((p) => p !== args.page), args.page].slice(-5);
  }
  await updateThread(thread.id, patch);

  if (push && (await claimSlot(thread.id, "last_push_at", PUSH_GAP_MINUTES, now))) {
    const who = thread.name || thread.email || `Visitor #${thread.id.slice(-4)}`;
    const flag = countryFlag(thread.country);
    await notifyStaff(audience, {
      title: `${audience === "client" ? "Khách" : "Ứng viên"} cần người: ${who}${flag ? ` ${flag}` : ""}`,
      body: args.body.slice(0, 140),
      url: `/hr?view=chat&thread=${thread.id}`,
      tag: `chat-${thread.id}`,
    });
  }
  return inserted;
}

export async function setContact(thread: ChatThreadRow, name: string | null, email: string): Promise<void> {
  const now = new Date().toISOString();
  await db()
    .from("chat_threads")
    .update({ name: name ?? thread.name, email: email.toLowerCase(), updated_at: now })
    .eq("id", thread.id);
  await insertMessages([
    { thread_id: thread.id, sender: "system", kind: "contact_form", body: `${name ? `${name} · ` : ""}${email.toLowerCase()}` },
  ]);
}

export async function addStaffReply(
  thread: ChatThreadRow,
  staff: { id: string | null; displayName: string },
  body: string,
  aiDraftId?: string | null,
): Promise<ChatMessageRow> {
  const now = new Date();
  const [msg] = await insertMessages([
    { thread_id: thread.id, sender: "staff", staff_user_id: staff.id, staff_name: staff.displayName || "TD Games", kind: "text", body },
  ]);
  const next = nextThreadState({ status: thread.status, needsHuman: thread.needs_human }, "staff_reply");
  await updateThread(thread.id, {
    status: next.status,
    needs_human: next.needsHuman,
    last_message_at: now.toISOString(),
    updated_at: now.toISOString(),
    email_pending: !!thread.email,
  });
  // Đánh dấu nháp AI: gửi từ nháp → sent (+ có sửa không); gửi tay → các nháp đang chờ hết hiệu lực.
  const { data: pending } = await db()
    .from("chat_ai_drafts")
    .select("id, answer")
    .eq("thread_id", thread.id)
    .in("status", ["pending", "failed"]);
  for (const d of pending ?? []) {
    const used = d.id === aiDraftId;
    await db()
      .from("chat_ai_drafts")
      .update({
        status: used ? "sent" : "superseded",
        edited: used ? body.trim() !== String(d.answer ?? "").trim() : null,
        decided_by: staff.id,
        decided_at: now.toISOString(),
      })
      .eq("id", d.id);
  }
  if (thread.email) await flushThreadEmail({ ...thread, email_pending: true }, now);
  return msg;
}

/** Gửi gộp các câu trả lời của staff sau lần mail trước, nếu đủ điều kiện. Trả true nếu đã gửi. */
async function flushThreadEmail(thread: ChatThreadRow, now: Date): Promise<boolean> {
  if (!thread.email || !thread.email_pending) return false;
  const ok = shouldEmail({
    hasEmail: true,
    lastVisitorSeenAt: thread.last_visitor_seen_at ? new Date(thread.last_visitor_seen_at) : null,
    lastEmailAt: thread.last_email_at ? new Date(thread.last_email_at) : null,
    now,
  });
  if (!ok) return false;
  const since = thread.last_email_at ?? thread.created_at;
  const { data: staffMsgs } = await db()
    .from("chat_messages")
    .select("body, staff_name, created_at")
    .eq("thread_id", thread.id)
    .eq("sender", "staff")
    .gt("created_at", since)
    .order("created_at", { ascending: true });
  // Khách đã thấy tin mới nhất (seen sau tin cuối) → không cần mail.
  const replies = (staffMsgs ?? []).filter(
    (m) => !thread.last_visitor_seen_at || m.created_at > thread.last_visitor_seen_at,
  );
  if (!replies.length) {
    await db().from("chat_threads").update({ email_pending: false }).eq("id", thread.id);
    return false;
  }
  // Giành suất gửi trước (2 trả lời liền nhau / cron chạy cùng lúc → chỉ 1 mail).
  if (!(await claimSlot(thread.id, "last_email_at", EMAIL_GAP_MINUTES, now))) return false;
  const staffName = String(replies[replies.length - 1].staff_name ?? "TD Games");
  const linkToken = newToken();
  const mail = buildChatReplyEmail({
    visitorName: thread.name,
    staffName,
    replies: replies.map((r) => String(r.body)),
    resumeUrl: `${SITE_URL}/?chat=${linkToken}`,
  });
  const cfg = getHrEmailConfig(process.env);
  const rcpt = resolveRecipient(cfg, thread.email, mail.subject);
  const res = await sendViaResend(cfg, {
    to: rcpt.to,
    subject: rcpt.subject,
    text: `${mail.text}\n\n${CHAT_EMAIL_FOOTER}`,
    html: textToHtml(mail.text, {
      footerNote: CHAT_EMAIL_FOOTER,
      footerEmail: thread.audience === "client" ? "info@tdgamestudio.com" : undefined,
    }),
    from: chatFrom(cfg, thread.audience, staffName),
    replyTo: [thread.audience === "client" ? "info@tdgamestudio.com" : cfg.hiring],
  });
  if ("error" in res) {
    console.error("[chat] gửi mail lỗi:", res.error);
    // Trả suất để cron thử lại lần sau.
    await db().from("chat_threads").update({ last_email_at: thread.last_email_at }).eq("id", thread.id);
    return false;
  }
  await db()
    .from("chat_threads")
    .update({
      email_pending: false,
      email_link_token_hash: hashToken(linkToken),
      email_link_expires_at: new Date(now.getTime() + EMAIL_LINK_DAYS * 86_400_000).toISOString(),
    })
    .eq("id", thread.id);
  return true;
}

/** Giành "suất" theo cột thời gian: cập nhật = now chỉ khi cột null hoặc cũ hơn `gapMin` phút. true = giành được. */
async function claimSlot(threadId: string, col: "last_push_at" | "last_email_at", gapMin: number, now: Date): Promise<boolean> {
  const cutoff = new Date(now.getTime() - gapMin * 60_000).toISOString();
  const { data, error } = await db()
    .from("chat_threads")
    .update({ [col]: now.toISOString() })
    .eq("id", threadId)
    .or(`${col}.is.null,${col}.lt.${cutoff}`)
    .select("id");
  return !error && !!data?.length;
}

export async function flushPendingEmails(now = new Date()): Promise<number> {
  const { data } = await db().from("chat_threads").select(THREAD_COLS).eq("email_pending", true).limit(50);
  let sent = 0;
  for (const t of (data ?? []) as ChatThreadRow[]) if (await flushThreadEmail(t, now)) sent++;
  return sent;
}

export async function purgeOld(now = new Date()): Promise<number> {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
  const { data } = await db().from("chat_threads").delete().lt("last_message_at", cutoff.toISOString()).select("id");
  // Luồng rỗng (mở ô chat rồi đóng, không tin nào) quá 1 ngày → xoá. Đếm tin bằng embed count trong CÙNG
  // truy vấn (không giới hạn 1000 dòng); lỗi / thiếu đếm → không xoá gì.
  const dayAgo = new Date(now.getTime() - 86_400_000).toISOString();
  const { data: old, error: oldErr } = await db()
    .from("chat_threads")
    .select("id, chat_messages(count)")
    .lt("created_at", dayAgo)
    .lt("last_message_at", dayAgo)
    .limit(200);
  let empty = 0;
  const drop = oldErr ? [] : emptyThreadIds(old as { id: string; chat_messages?: { count: number }[] }[] | null);
  if (drop.length) {
    const { data: gone } = await db().from("chat_threads").delete().in("id", drop).select("id");
    empty = (gone ?? []).length;
  }
  return (data ?? []).length + empty;
}

/** Link "Continue the conversation": còn hạn → cấp mã khách mới cho trình duyệt này. */
export async function resumeFromEmailToken(t: string): Promise<{ thread: ChatThreadRow; token: string } | null> {
  if (!t || t.length < 20 || t.length > 100) return null;
  const { data } = await db()
    .from("chat_threads")
    .select(`${THREAD_COLS}, email_link_expires_at`)
    .eq("email_link_token_hash", hashToken(t))
    .maybeSingle();
  if (!data || !data.email_link_expires_at || Date.parse(data.email_link_expires_at) < Date.now()) return null;
  const token = newToken();
  // Link dùng 1 lần: điều kiện theo đúng hash cũ → 2 request đồng thời chỉ 1 cái thắng.
  const { data: won } = await db()
    .from("chat_threads")
    .update({ visitor_token_hash: hashToken(token), email_link_token_hash: null, email_link_expires_at: null })
    .eq("id", data.id)
    .eq("email_link_token_hash", hashToken(t))
    .select("id");
  if (!won?.length) return null;
  return { thread: data as unknown as ChatThreadRow, token };
}

/** Người nhận chuông: có quyền chat theo loại luồng + push.receive, tài khoản không khoá. */
export async function chatRecipients(audience: ChatAudience): Promise<string[]> {
  return pushRecipientsWith(audience === "client" ? "chat.clients" : "chat.candidates");
}

/** Người nhận chuông có quyền `need` + push.receive, tài khoản không khoá. */
export async function pushRecipientsWith(need: PermissionKey): Promise<string[]> {
  const [users, rp] = await Promise.all([
    db().from("hr_users").select("id, role, disabled"),
    db().from("hr_role_permissions").select("role, permission, allowed"),
  ]);
  if (users.error || rp.error) return [];
  const overrides = (rp.data ?? []).map((r) => ({ role: String(r.role), permission: String(r.permission), allowed: !!r.allowed }));
  return (users.data ?? [])
    .filter((u) => !u.disabled && (HR_ROLES as readonly string[]).includes(u.role))
    .filter((u) => {
      const p = effectivePermissions(u.role as HrRole, overrides);
      return p.has(need) && p.has("push.receive");
    })
    .map((u) => String(u.id));
}

async function notifyStaff(audience: ChatAudience, payload: { title: string; body: string; url: string; tag: string }) {
  try {
    const ids = await chatRecipients(audience);
    if (ids.length) await sendHrPush(payload, { userIds: ids });
  } catch (e) {
    console.error("[chat] push lỗi:", e);
  }
}

export function countryFlag(cc: string | null): string {
  if (!cc || !/^[A-Z]{2}$/.test(cc) || cc === "XX" || cc === "T1") return "";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
