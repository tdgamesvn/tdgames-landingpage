/**
 * Thông báo gắn với 1 ứng viên (Discord kênh HR + push app /hr).
 *
 * Người nhận theo 1 luật duy nhất `candidateRecipients` (src/lib/hr-notify-recipients.ts):
 * Sếp luôn; người phụ trách hồ sơ; Leader của job (một số sự kiện); Kế toán khi sang offer;
 * người được @tag; loại người thực hiện; chưa có người phụ trách → @everyone + mọi HR.
 * Gọi fire-and-forget — caller không await (hoặc await trong khối try riêng).
 */

import { discordNotify, type DiscordPayload } from "@/lib/discord-notify";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendHrPush } from "@/lib/hr-push";
import { candidatePushPayload, mentionPayload, restrictedPushPayload, type PushPayload } from "@/lib/hr-push-payload";
import {
  candidateRecipients, discordTagFor, pushBatches, pushTargets, withTag,
  type NotifyEvent, type RecipientStaff,
} from "@/lib/hr-notify-recipients";
import { effectivePermissions, HR_ROLES, type HrRole, type PermissionKey } from "@/lib/hr-permissions";
import type { ScopeInput } from "@/lib/hr-scope";
import { offerApprovalRecipients } from "@/lib/offer-letter-approval";

export type NotifyStaffCtx = {
  staff: (RecipientStaff & { display_name: string })[];
  perms: Map<HrRole, Set<PermissionKey>>;
  statuses: ScopeInput["statuses"];
};

/** Tài khoản + quyền theo vai + status pipeline. Lỗi đọc DB → null (Discord rơi về @everyone, không push). */
export async function loadNotifyStaff(): Promise<NotifyStaffCtx | null> {
  try {
    const supabase = getSupabaseAdmin();
    const [users, rp, st] = await Promise.all([
      supabase.from("hr_users").select("id, display_name, role, disabled, discord_user_id"),
      supabase.from("hr_role_permissions").select("role, permission, allowed"),
      supabase.from("application_statuses").select("key, position, kind"),
    ]);
    if (users.error || rp.error || st.error) return null;
    const staff = (users.data ?? [])
      .filter((u) => (HR_ROLES as readonly string[]).includes(u.role))
      .map((u) => ({
        id: String(u.id),
        display_name: String(u.display_name ?? ""),
        role: u.role as HrRole,
        disabled: !!u.disabled,
        discord_user_id: (u.discord_user_id as string | null) ?? null,
      }));
    const overrides = (rp.data ?? []).map((r) => ({ role: String(r.role), permission: String(r.permission), allowed: !!r.allowed }));
    const perms = new Map<HrRole, Set<PermissionKey>>(HR_ROLES.map((r) => [r, effectivePermissions(r, overrides)]));
    const statuses = (st.data ?? []).map((r) => ({
      key: String(r.key),
      position: Number(r.position),
      kind: r.kind as "open" | "won" | "lost",
    }));
    return { staff, perms, statuses };
  } catch {
    return null;
  }
}

export type NotifyApp = {
  id: string;
  full_name: string;
  job_id: string;
  status: string;
  offer_status: string | null;
  assignee_user_id: string | null;
  jobTitle: string | null;
  jobLeaderId: string | null;
};

type JobJoin = { title?: string | null; leader_user_id?: string | null };

/** Dựng NotifyApp từ 1 dòng applications có join `jobs(title, leader_user_id)`. */
export function toNotifyApp(row: Record<string, unknown>): NotifyApp {
  const j = row.jobs as JobJoin | JobJoin[] | null | undefined;
  const job = Array.isArray(j) ? j[0] : j;
  return {
    id: String(row.id),
    full_name: String(row.full_name ?? "Ứng viên"),
    job_id: String(row.job_id ?? ""),
    status: String(row.status ?? ""),
    offer_status: (row.offer_status as string | null | undefined) ?? null,
    assignee_user_id: (row.assignee_user_id as string | null | undefined) ?? null,
    jobTitle: job?.title ?? null,
    jobLeaderId: job?.leader_user_id ?? null,
  };
}

/** Đọc hồ sơ để tính người nhận. Chưa áp migration assignee → đọc lại không có cột đó (coi như chưa giao). */
export async function loadNotifyApp(appId: string): Promise<NotifyApp | null> {
  try {
    const supabase = getSupabaseAdmin();
    const cols = "id, full_name, job_id, status, offer_status, jobs(title, leader_user_id)";
    let res = await supabase.from("applications").select(`${cols}, assignee_user_id`).eq("id", appId).maybeSingle();
    if (res.error) res = await supabase.from("applications").select(cols).eq("id", appId).maybeSingle();
    if (res.error || !res.data) return null;
    return toNotifyApp(res.data as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

export type CandidateMessage = {
  /** Nội dung Discord (tag tự thêm vào đầu). */
  content: string;
  embeds?: DiscordPayload["embeds"];
  /** Push cho người nhận (lọc push.receive + phạm vi). null/undefined = sự kiện không push. */
  push?: PushPayload | null;
  /** Push riêng cho người được @tag (comment) — thay `push` cho họ. */
  mentionPush?: PushPayload | null;
  /**
   * Quyền cần để xem nội dung push (vd. apps.view_notes cho ghi chú). Người nhận thiếu quyền vẫn được báo
   * nhưng nhận bản `pushRestricted` (mặc định body chung chung "Có cập nhật mới ở hồ sơ …").
   * Discord là kênh chung → nội dung không lọc theo quyền (như trước).
   */
  pushPerm?: PermissionKey | null;
  pushRestricted?: PushPayload | null;
};

export type CandidateRule = {
  event: NotifyEvent;
  actorId?: string | null;
  newStatus?: string | null;
  mentions?: string[];
};

/**
 * Gửi 1 thông báo ứng viên theo luật người nhận. `app`/`staffCtx` null (lỗi đọc DB) → Discord @everyone,
 * không push (fail closed). Discord và push độc lập: một bên lỗi không chặn bên kia. Trả số push đã gửi.
 */
export async function dispatchCandidateNotify(
  rule: CandidateRule,
  app: NotifyApp | null,
  staffCtx: NotifyStaffCtx | null,
  msg: CandidateMessage,
): Promise<{ pushed: number }> {
  const ok = app && staffCtx;
  const rec = ok
    ? candidateRecipients({
        event: rule.event,
        staff: staffCtx.staff,
        assigneeId: app.assignee_user_id,
        jobLeaderId: app.jobLeaderId,
        newStatus: rule.newStatus,
        mentions: rule.mentions,
        actorId: rule.actorId,
      })
    : { userIds: [], everyone: true };
  const { tag, allowed_mentions } = discordTagFor(rec, staffCtx?.staff ?? []);

  const tasks: Promise<unknown>[] = [
    discordNotify("hr", { allowed_mentions, content: withTag(tag, msg.content), embeds: msg.embeds }),
  ];
  if (ok && msg.push) {
    // Người phụ trách + người được @tag nhận trực tiếp (không xét push.receive); còn lại theo vai.
    const direct = [...(app.assignee_user_id ? [app.assignee_user_id] : []), ...(rule.mentions ?? [])];
    const targets = pushTargets(rec.userIds, staffCtx.staff, staffCtx.perms, app, staffCtx.statuses, app.jobLeaderId, direct);
    const batches = pushBatches({
      targets,
      staff: staffCtx.staff,
      perms: staffCtx.perms,
      perm: msg.pushPerm ?? null,
      push: msg.push,
      restricted: msg.pushRestricted ?? restrictedPushPayload(msg.push, app.full_name),
      mentionIds: rule.mentions,
      mentionPush: msg.mentionPush,
      mentionRestricted: msg.mentionPush ? restrictedPushPayload(msg.mentionPush, app.full_name) : null,
    });
    for (const b of batches) tasks.push(sendHrPush(b.payload, { userIds: b.userIds }));
  }
  const results = await Promise.allSettled(tasks);
  let pushed = 0;
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[hr-notify] ${rule.event} ${i === 0 ? "Discord" : "push"} lỗi:`, r.reason);
    else if (i > 0) pushed += (r.value as { sent?: number })?.sent ?? 0;
  });
  return { pushed };
}

/** Đọc hồ sơ + tài khoản rồi gửi. `build` nhận tên ứng viên / job (đọc từ DB) để dựng nội dung. */
export async function notifyCandidate(
  appId: string,
  rule: CandidateRule,
  build: (a: { name: string; jobTitle: string | null; app: NotifyApp | null; staff: NotifyStaffCtx | null }) => CandidateMessage,
): Promise<{ pushed: number }> {
  const [app, staffCtx] = await Promise.all([loadNotifyApp(appId), loadNotifyStaff()]);
  const msg = build({ name: app?.full_name ?? "Ứng viên", jobTitle: app?.jobTitle ?? null, app, staff: staffCtx });
  return dispatchCandidateNotify(rule, app, staffCtx, msg);
}

/** Comment mới trên hồ sơ. Người được @tag nhận push "X nhắc bạn", người nhận khác nhận push comment. */
export async function notifyNewComment(i: {
  appId: string;
  commentId: string;
  authorName: string;
  actorId: string | null;
  content: string;
  mentions: string[];
}): Promise<void> {
  const truncated = i.content.length > 500 ? i.content.slice(0, 497) + "..." : i.content;
  await notifyCandidate(i.appId, { event: "comment", actorId: i.actorId, mentions: i.mentions }, ({ name, jobTitle }) => {
    const fields: { name: string; value: string; inline?: boolean }[] = [{ name: "Author", value: i.authorName, inline: true }];
    if (jobTitle) fields.push({ name: "Position", value: jobTitle, inline: true });
    fields.push({ name: "Comment", value: truncated, inline: false });
    return {
      content: `💬 **${name}** — new comment by ${i.authorName}`,
      embeds: [
        {
          title: `💬 Comment — ${name}`,
          color: 0x8b5cf6, // purple to distinguish from note (amber)
          fields,
          timestamp: new Date().toISOString(),
          footer: { text: "HR Dashboard" },
        },
      ],
      push: candidatePushPayload({ event: "comment", appId: i.appId, candidateName: name, actorName: i.authorName, jobTitle, text: i.content }),
      pushPerm: "apps.comment",
      mentionPush: mentionPayload({
        authorName: i.authorName,
        candidateName: name,
        content: i.content,
        commentId: i.commentId,
        applicationId: i.appId,
      }),
    };
  });
}

interface OldApp {
  full_name: string | null;
  status: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  job_id: string | null;
  assignee_user_id?: string | null;
}

/**
 * Thông báo khi hồ sơ được sửa (đổi trạng thái, ghi chú, chấm bài test, giao người phụ trách).
 * Gọi SAU khi DB update thành công, fire-and-forget. `meta.actorId` null = admin (ADMIN_SECRET).
 */
export async function notifyApplicationUpdate(
  oldApp: OldApp,
  updates: Record<string, unknown>,
  body: Record<string, unknown>,
  meta: { appId: string; actorId: string | null; actorName: string | null },
): Promise<void> {
  const statusChanged = "status" in updates && updates.status !== oldApp.status;
  const notesChanged = "admin_notes" in updates && updates.admin_notes !== oldApp.admin_notes;
  const review = updates.test_review as
    | { verdict: string; score: number; comment: string; reviewer: string }
    | null
    | undefined;
  const newAssignee = "assignee_user_id" in updates ? ((updates.assignee_user_id as string | null) ?? null) : undefined;
  const assigned = newAssignee !== undefined && newAssignee !== null && newAssignee !== (oldApp.assignee_user_id ?? null);
  const noteText = notesChanged && updates.admin_notes ? String(updates.admin_notes) : "";
  if (!statusChanged && !noteText.trim() && !review && !assigned) return;

  // Đọc 1 lần cho mọi thông báo của lần sửa này (hồ sơ đã ở trạng thái mới).
  const [app, staffCtx] = await Promise.all([loadNotifyApp(meta.appId), loadNotifyStaff()]);
  const name = app?.full_name ?? oldApp.full_name ?? "Unknown";
  const jobTitle = app?.jobTitle ?? "";
  const actorName = meta.actorName;
  const send = (rule: Omit<CandidateRule, "actorId">, msg: CandidateMessage) =>
    dispatchCandidateNotify({ ...rule, actorId: meta.actorId }, app, staffCtx, msg);

  // ── Status change notification ──────────────────────────────
  if (statusChanged) {
    const oldStatus = oldApp.status ?? "unknown";
    const newStatus = String(updates.status);
    const isRejected = newStatus === "rejected";
    const reason = isRejected ? String(updates.rejection_reason ?? body.rejection_reason ?? "") : "";
    const emoji = isRejected ? "❌" : newStatus === "offer" ? "🎉" : "📋";
    const color = isRejected ? 0xef4444 : newStatus === "offer" ? 0x22c55e : 0x3b82f6;

    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: "Status", value: `\`${oldStatus}\` → \`${newStatus}\``, inline: true },
    ];
    if (jobTitle) fields.push({ name: "Position", value: jobTitle, inline: true });
    if (actorName) fields.push({ name: "By", value: actorName, inline: true });
    if (isRejected && reason) fields.push({ name: "Reason", value: reason, inline: false });

    await send(
      // Chuyển sang Offer → báo thêm Kế toán (người soạn + gửi mail offer).
      { event: "status", newStatus },
      {
        content: `${emoji} **${name}** — status updated`,
        embeds: [
          {
            title: `${emoji} ${isRejected ? "Rejected" : newStatus === "offer" ? "Offer!" : "Status Update"} — ${name}`,
            color,
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: "HR Dashboard" },
          },
        ],
        push: candidatePushPayload({
          event: "status",
          appId: meta.appId,
          candidateName: name,
          actorName,
          jobTitle,
          text: `${oldStatus} → ${newStatus}${actorName ? ` (${actorName})` : ""}`,
        }),
      },
    );
  }

  // ── Admin note notification ────────────────────────────────
  if (noteText.trim()) {
    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: "Note", value: noteText.length > 500 ? noteText.slice(0, 497) + "..." : noteText, inline: false },
    ];
    if (jobTitle) fields.push({ name: "Position", value: jobTitle, inline: true });
    await send(
      { event: "note" },
      {
        content: `💬 **${name}** — note updated`,
        embeds: [
          {
            title: `💬 Note — ${name}`,
            color: 0xf59e0b,
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: "HR Dashboard" },
          },
        ],
        push: candidatePushPayload({ event: "note", appId: meta.appId, candidateName: name, actorName, jobTitle, text: noteText }),
        pushPerm: "apps.view_notes",
      },
    );
  }

  // ── Leader chấm bài test ───────────────────────────────────
  if (review) {
    const verdicts: Record<string, { label: string; emoji: string; color: number }> = {
      pass: { label: "Đạt", emoji: "✅", color: 0x22c55e },
      consider: { label: "Cân nhắc", emoji: "🤔", color: 0xf59e0b },
      fail: { label: "Không đạt", emoji: "❌", color: 0xef4444 },
    };
    const v = verdicts[review.verdict] ?? verdicts.consider;
    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: "Kết luận", value: `${v.emoji} ${v.label}`, inline: true },
      { name: "Điểm", value: `${review.score}/10`, inline: true },
      { name: "Người chấm", value: review.reviewer, inline: true },
    ];
    if (jobTitle) fields.push({ name: "Position", value: jobTitle, inline: true });
    if (review.comment)
      fields.push({
        name: "Nhận xét",
        value: review.comment.length > 1000 ? review.comment.slice(0, 997) + "..." : review.comment,
        inline: false,
      });
    await send(
      { event: "test_review" },
      {
        content: `📝 **${name}** — ${review.reviewer} đã chấm bài test: ${v.emoji} ${v.label} (${review.score}/10)`,
        embeds: [
          {
            title: `📝 Chấm bài test — ${name}`,
            color: v.color,
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: "HR Dashboard" },
          },
        ],
        push: candidatePushPayload({
          event: "test_review",
          appId: meta.appId,
          candidateName: name,
          actorName: review.reviewer,
          jobTitle,
          text: `${v.label} (${review.score}/10)`,
        }),
        pushPerm: "apps.view_tests",
      },
    );
  }

  // ── Giao người phụ trách → báo người mới nhận ─────────────
  if (assigned) {
    const assigneeName = staffCtx?.staff.find((u) => u.id === newAssignee)?.display_name ?? "người phụ trách mới";
    const who = actorName ?? "Admin";
    const payload = (forOthers: boolean) =>
      candidatePushPayload({
        event: "assigned",
        appId: meta.appId,
        candidateName: name,
        actorName: who,
        jobTitle,
        assigneeName: forOthers ? assigneeName : null,
      });
    await send(
      // mentions = người mới nhận → nhận bản "… cho bạn"; Sếp nhận bản "… cho <tên>".
      { event: "assigned", mentions: [newAssignee] },
      {
        content: `👤 **${who}** giao hồ sơ **${name}** cho ${assigneeName}`,
        embeds: jobTitle ? [{ title: `👤 Người phụ trách — ${name}`, color: 0x64748b, fields: [{ name: "Position", value: jobTitle, inline: true }] }] : undefined,
        push: payload(true),
        mentionPush: payload(false),
      },
    );
  }
}

/**
 * Thông báo duyệt thư mời nhận việc (Discord tag + push). KHÔNG đưa lương vào nội dung.
 * - submitted: tới mọi Sếp ("📝 X gửi thư mời … chờ duyệt"); không Sếp nào có Discord ID → @everyone.
 * - reviewed: tới người gửi duyệt + người support (Sếp đã duyệt / yêu cầu sửa kèm ghi chú).
 * Fire-and-forget: lỗi chỉ ghi log, không ảnh hưởng thao tác chính.
 */
export async function notifyOfferApproval(i: {
  kind: "submitted" | "reviewed";
  appId: string;
  actorId: string | null;
  actorName: string;
  /** reviewed: người đã gửi duyệt (submitted_by_user_id). */
  submitterId?: string | null;
  decision?: "approve" | "changes";
  note?: string;
}): Promise<void> {
  const [app, staffCtx] = await Promise.all([loadNotifyApp(i.appId), loadNotifyStaff()]);
  const name = app?.full_name ?? "Ứng viên";
  const who = app?.jobTitle ? `${name} (${app.jobTitle})` : name;
  let content: string;
  let title: string;
  let body: string;
  if (i.kind === "submitted") {
    content = `📝 ${i.actorName} gửi thư mời nhận việc của ${who} chờ duyệt`;
    title = `📝 ${i.actorName} gửi thư mời chờ duyệt — ${name}`;
    body = app?.jobTitle ?? "Mở /hr để duyệt";
  } else if (i.decision === "approve") {
    content = `✅ Sếp đã duyệt thư mời nhận việc của ${who} — có thể gửi mail offer`;
    title = `✅ Sếp đã duyệt thư mời — ${name}`;
    body = "Có thể gửi mail offer";
  } else {
    const note = (i.note ?? "").trim();
    content = `✏️ Sếp yêu cầu sửa thư mời nhận việc của ${who}: ${note}`;
    title = `✏️ Sếp yêu cầu sửa thư mời — ${name}`;
    body = note.length > 160 ? `${note.slice(0, 157)}...` : note;
  }
  const rec = staffCtx
    ? offerApprovalRecipients({
        kind: i.kind,
        staff: staffCtx.staff,
        submitterId: i.submitterId ?? null,
        assigneeId: app?.assignee_user_id ?? null,
        actorId: i.actorId,
      })
    : { userIds: [], everyone: i.kind === "submitted" };
  const { tag, allowed_mentions } = discordTagFor(rec, staffCtx?.staff ?? []);
  const tasks: Promise<unknown>[] = [discordNotify("hr", { allowed_mentions, content: withTag(tag, content) })];
  if (app && staffCtx && rec.userIds.length) {
    // Người nhận chủ động (Sếp / người gửi / người support) → luôn nhận push, vẫn cần xem được hồ sơ.
    const targets = pushTargets(rec.userIds, staffCtx.staff, staffCtx.perms, app, staffCtx.statuses, app.jobLeaderId, rec.userIds);
    tasks.push(sendHrPush({ title, body, url: "/hr", tag: `hr-offer_approval-${i.appId}` }, { userIds: targets }));
  }
  const results = await Promise.allSettled(tasks);
  results.forEach((r, idx) => {
    if (r.status === "rejected") console.error(`[hr-notify] offer_${i.kind} ${idx === 0 ? "Discord" : "push"} lỗi:`, r.reason);
  });
}
