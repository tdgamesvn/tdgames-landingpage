import "server-only";

// Ứng viên trùng — phần đọc DB + gửi tin (luật thuần ở hr-duplicates.ts). Mọi lỗi ở đây không được làm hỏng nộp đơn.
import { discordNotify } from "@/lib/discord-notify";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendHrPush } from "@/lib/hr-push";
import { canViewApplication } from "@/lib/hr-comment-mentions";
import { candidateRecipients, discordTagFor, withTag } from "@/lib/hr-notify-recipients";
import type { NotifyStaffCtx } from "@/lib/hr-notify";
import { normalizeRefCode } from "@/lib/hr-ref-codes";
import { SITE_URL } from "@/lib/json-ld";
import {
  askHrToTellReferrerText,
  normalizeEmail,
  normalizePhone,
  referrerAutoRejectText,
  referrerTakenText,
  teamAutoRejectText,
  type DuplicateKind,
  type PriorApp,
} from "@/lib/hr-duplicates";

export const HR_URL = `${SITE_URL}/hr`;

const PRIOR_COLS =
  "id, job_id, email, phone, status, status_changed_at, created_at, referred_by, assignee_user_id, duplicate_kind, jobs(title)";

/**
 * Hồ sơ cũ khớp email hoặc SĐT (qua cột chuẩn hoá có index). 2 truy vấn `.eq` thay vì `.or(...)` để không phải
 * escape dấu phẩy/ngoặc trong email. Lỗi (vd. migration chưa áp) → null: caller nhận đơn như bình thường.
 */
export async function loadPriorApps(email: string, phone: string | null): Promise<PriorApp[] | null> {
  try {
    const supabase = getSupabaseAdmin();
    const e = normalizeEmail(email);
    const p = normalizePhone(phone);
    const [byEmail, byPhone, st] = await Promise.all([
      e ? supabase.from("applications").select(PRIOR_COLS).eq("email_norm", e) : Promise.resolve({ data: [], error: null }),
      p ? supabase.from("applications").select(PRIOR_COLS).eq("phone_norm", p) : Promise.resolve({ data: [], error: null }),
      supabase.from("application_statuses").select("key, kind"),
    ]);
    if (byEmail.error || byPhone.error || st.error) {
      console.error("[duplicates] đọc hồ sơ cũ lỗi:", byEmail.error ?? byPhone.error ?? st.error);
      return null;
    }
    const kinds = new Map((st.data ?? []).map((r) => [String(r.key), r.kind as PriorApp["status_kind"]]));
    const rows = new Map<string, Record<string, unknown>>();
    for (const r of [...(byEmail.data ?? []), ...(byPhone.data ?? [])] as Record<string, unknown>[]) rows.set(String(r.id), r);
    return [...rows.values()].map((r) => {
      const j = r.jobs as { title?: string | null } | { title?: string | null }[] | null;
      const job = Array.isArray(j) ? j[0] : j;
      return {
        id: String(r.id),
        job_id: String(r.job_id ?? ""),
        job_title: job?.title ?? null,
        email: String(r.email ?? ""),
        phone: (r.phone as string | null) ?? null,
        status: String(r.status ?? ""),
        status_kind: kinds.get(String(r.status)) ?? null,
        status_changed_at: (r.status_changed_at as string | null) ?? null,
        created_at: String(r.created_at),
        referred_by: (r.referred_by as string | null) ?? null,
        assignee_user_id: (r.assignee_user_id as string | null) ?? null,
        duplicate_kind: (r.duplicate_kind as DuplicateKind | null) ?? null,
      };
    });
  } catch (e) {
    console.error("[duplicates] đọc hồ sơ cũ lỗi:", e);
    return null;
  }
}

export type RefStaff = { id: string; ref_codes: string[] | null; disabled?: boolean };
export type RefReferrer = { id: string; name: string; ref_codes: string[] | null; hr_user_id: string | null; phone: string; email: string; active: boolean };

/** Người giới thiệu ngoài (bảng referrers). Lỗi → [] (mã lạ coi như "c:<mã>"). */
export async function loadReferrers(): Promise<RefReferrer[]> {
  const { data, error } = await getSupabaseAdmin().from("referrers").select("id, name, ref_codes, hr_user_id, phone, email, active");
  if (error) {
    console.error("[duplicates] đọc referrers lỗi:", error.message);
    return [];
  }
  return (data ?? []) as RefReferrer[];
}

/** Khoá chủ của mã ref: "u:<hr_user>" (tài khoản /hr, kể cả referrer gắn tài khoản) / "r:<referrer>" / "c:<mã>". */
export function ownerKeyFor(code: string | null, staff: RefStaff[], referrers: RefReferrer[]): string | null {
  const c = normalizeRefCode(code);
  if (!c) return null;
  const u = staff.find((s) => !s.disabled && (s.ref_codes ?? []).some((x) => normalizeRefCode(x) === c));
  if (u) return `u:${u.id}`;
  const r = referrers.find((x) => (x.ref_codes ?? []).some((y) => normalizeRefCode(y) === c));
  if (r) return r.hr_user_id ? `u:${r.hr_user_id}` : `r:${r.id}`;
  return `c:${c}`;
}

type NotifyDupInput = {
  kind: "auto_rejected" | "taken";
  app: { id: string; full_name: string; job_id: string; status: string; assignee_user_id: string | null };
  jobTitle: string;
  jobLeaderId: string | null;
  /** Người giới thiệu mới (B) — khoá chủ + mã đã nhập. */
  submittedOwnerKey: string | null;
  submittedCode: string | null;
  /** B là tài khoản /hr còn hoạt động (route đã tính) — sai thì đi đường nhờ HR báo tay. */
  bHasAccount: boolean;
  referrers: RefReferrer[];
  staffCtx: NotifyStaffCtx | null;
  /** auto_rejected: dd/mm/yyyy */
  prevAppliedAt?: string;
  reapplyFrom?: string;
  rejectedAt?: string;
  /** auto_rejected: mail từ chối đã gửi được chưa (tin team nói đúng). */
  mailSent?: boolean;
};

/**
 * Tin cho ứng viên trùng (spec §5): báo người giới thiệu mới B (có tài khoản → tag + push nếu xem được hồ sơ;
 * không → nhờ người phụ trách báo lại) và, khi auto-reject, 1 tin team không tag. Lỗi chỉ log.
 */
export async function notifyDuplicate(i: NotifyDupInput): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  const name = i.app.full_name || "Ứng viên";

  if (i.kind === "auto_rejected") {
    tasks.push(
      discordNotify("hr", {
        content: teamAutoRejectText({ name, jobTitle: i.jobTitle, rejectedAt: i.rejectedAt ?? "…", priorUrl: HR_URL, mailSent: !!i.mailSent, submittedCode: i.submittedCode }),
        allowed_mentions: { parse: [] },
      }),
    );
  }

  if (i.submittedOwnerKey) {
    const text =
      i.kind === "auto_rejected"
        ? referrerAutoRejectText({ name, jobTitle: i.jobTitle, reapplyFrom: i.reapplyFrom ?? "…" })
        : referrerTakenText({ name, jobTitle: i.jobTitle });
    const staff = i.staffCtx?.staff ?? [];
    const bId = i.submittedOwnerKey.startsWith("u:") ? i.submittedOwnerKey.slice(2) : null;
    const b = i.bHasAccount && bId ? staff.find((u) => u.id === bId && !u.disabled) : undefined;

    if (b) {
      const tag = b.discord_user_id ? `<@${b.discord_user_id}>` : "";
      tasks.push(
        discordNotify("hr", {
          content: withTag(tag, text),
          allowed_mentions: { parse: [], users: b.discord_user_id ? [b.discord_user_id] : [] },
        }),
      );
      // Push mở /hr — chỉ khi B xem được hồ sơ (sếp chốt: không xem được thì chỉ Discord, không link).
      if (i.staffCtx && canViewApplication(b, i.app, i.staffCtx.statuses, i.jobLeaderId)) {
        tasks.push(
          sendHrPush(
            { title: `🔁 ${name} — ứng viên bạn giới thiệu`, body: text.replace(/\*\*/g, ""), url: "/hr", tag: `hr-dup-${i.app.id}` },
            { userIds: [b.id] },
          ),
        );
      }
    } else {
      // Người ngoài / mã lạ → nhờ người phụ trách đơn mới (chưa giao → như luật cũ: @everyone + HR).
      const r = i.submittedOwnerKey.startsWith("r:") ? i.referrers.find((x) => `r:${x.id}` === i.submittedOwnerKey) : undefined;
      const contact = r ? [r.phone, r.email].map((s) => s?.trim()).filter(Boolean).join(" · ") || null : null;
      const rec = i.staffCtx
        ? candidateRecipients({ event: "assigned", staff: i.staffCtx.staff, assigneeId: i.app.assignee_user_id, jobLeaderId: null })
        : { userIds: [], everyone: true };
      // "assigned" không bao giờ everyone → tự thêm khi chưa có người phụ trách.
      const recipients = i.app.assignee_user_id ? { userIds: rec.userIds, everyone: false } : { userIds: rec.userIds, everyone: true };
      const { tag, allowed_mentions } = discordTagFor(recipients, staff);
      tasks.push(
        discordNotify("hr", {
          content: withTag(tag, askHrToTellReferrerText({ referrer: r?.name ?? i.submittedCode ?? "?", contact, base: text })),
          allowed_mentions,
        }),
      );
    }
  }

  const results = await Promise.allSettled(tasks);
  for (const r of results) if (r.status === "rejected") console.error("[duplicates] gửi tin lỗi:", r.reason);
}
