import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScope, jobInScope, type HrContext } from "@/lib/hr-session";
import { buildDraft, getHrEmailConfig, isValidEmail } from "@/lib/hr-email";
import { deliverCandidateEmail, resolveCcForApplication } from "@/lib/hr-email-send";
import {
  CLOSE_OUT_GAP_MS,
  TALENT_POOL_MISSING,
  TALENT_POOL_STATUS,
  closeOutCandidates,
  closeOutSkipReason,
  closeOutSummary,
  parseCloseOutBody,
  type CloseOutApp,
} from "@/lib/hr-close-out";
import { discordNotify } from "@/lib/discord-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

const APP_COLS = "id, job_id, status, full_name, email, created_at, offer_status, assignee_user_id";

/** Job trong phạm vi + trạng thái "Lưu hồ sơ" còn tồn tại; lỗi → response. */
async function loadJob(ctx: HrContext, jobId: string): Promise<{ title: string } | NextResponse> {
  let ok: boolean;
  try {
    ok = await jobInScope(ctx, jobId);
  } catch {
    return NextResponse.json({ error: "Không đọc được job" }, { status: 500 });
  }
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = getSupabaseAdmin();
  const [{ data: job, error: jobErr }, { data: pool, error: poolErr }] = await Promise.all([
    supabase.from("jobs").select("title").eq("id", jobId).maybeSingle(),
    supabase.from("application_statuses").select("key").eq("key", TALENT_POOL_STATUS).maybeSingle(),
  ]);
  if (jobErr || poolErr) return NextResponse.json({ error: (jobErr ?? poolErr)!.message }, { status: 500 });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!pool) return NextResponse.json({ error: TALENT_POOL_MISSING, code: "talent_pool_missing" }, { status: 409 });
  return { title: String(job.title ?? "") };
}

/** Mẫu `position_filled` HR đã sửa; lỗi đọc → mẫu mặc định (không chặn). */
async function loadTemplate(): Promise<{ subject: string; body: string } | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("hr_email_templates")
    .select("subject, body")
    .eq("kind", "position_filled")
    .maybeSingle();
  if (error) console.error("close-out: đọc hr_email_templates lỗi, dùng mẫu mặc định:", error.message);
  return data ? { subject: String(data.subject), body: String(data.body) } : null;
}

/**
 * Danh sách ứng viên đang mở của job (trong phạm vi) + xem trước mail "Vị trí đã tuyển đủ" + chế độ test/live.
 * `?exclude=<appId>` bỏ 1 hồ sơ (ứng viên vừa nhận offer).
 */
export async function GET(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "apps.edit");
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  const { id } = await params;
  const job = await loadJob(ctx, id);
  if (job instanceof NextResponse) return job;

  const { data: apps, error } = await getSupabaseAdmin().from("applications").select(APP_COLS).eq("job_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let scope;
  try {
    scope = await loadScope(ctx);
  } catch {
    return NextResponse.json({ error: "Không đọc được phạm vi dữ liệu" }, { status: 500 });
  }
  const exclude = new URL(request.url).searchParams.get("exclude");
  const candidates = closeOutCandidates((apps ?? []) as unknown as CloseOutApp[], { jobId: id, scope, excludeId: exclude });

  const cfg = getHrEmailConfig(process.env);
  const preview = buildDraft({ kind: "position_filled", candidateName: "", jobTitle: job.title }, await loadTemplate());
  return NextResponse.json({
    job: { id, title: job.title },
    candidates,
    preview: { subject: preview.subject, text: preview.text },
    mode: cfg.mode,
    test_to: cfg.testTo,
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * `{ application_ids, send_mail }`: (tuỳ chọn) gửi mail `position_filled` lần lượt qua đúng pipeline gửi mail
 * hồ sơ, rồi chuyển hồ sơ sang "Lưu hồ sơ". Không bắn thông báo đổi trạng thái từng hồ sơ — chỉ 1 dòng Discord tóm tắt.
 */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "apps.edit");
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  const { id } = await params;

  const parsed = parseCloseOutBody(await request.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { ids, sendMail } = parsed;
  if (sendMail && !ctx.perms.has("emails.send")) {
    return NextResponse.json({ error: "Bạn không có quyền gửi mail ứng viên" }, { status: 403 });
  }
  const job = await loadJob(ctx, id);
  if (job instanceof NextResponse) return job;
  const cfg = getHrEmailConfig(process.env);
  if (sendMail && !cfg.apiKey) return NextResponse.json({ error: "RESEND_API_KEY chưa cấu hình" }, { status: 500 });

  const supabase = getSupabaseAdmin();
  const { data: rows, error } = await supabase.from("applications").select(APP_COLS).in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let scope;
  try {
    scope = await loadScope(ctx);
  } catch {
    return NextResponse.json({ error: "Không đọc được phạm vi dữ liệu" }, { status: 500 });
  }
  const byId = new Map(((rows ?? []) as unknown as (CloseOutApp & { assignee_user_id: string | null })[]).map((r) => [r.id, r]));
  const openKeys = scope.statuses.filter((s) => s.kind === "open").map((s) => s.key);
  const template = sendMail ? await loadTemplate() : null;

  const results: { id: string; name: string; mailed: boolean; moved: boolean; error?: string }[] = [];
  let sentAny = false;
  for (const appId of ids) {
    const app = byId.get(appId);
    const skip = closeOutSkipReason(app, { jobId: id, scope });
    if (skip || !app) {
      results.push({ id: appId, name: (app?.full_name ?? "").trim(), mailed: false, moved: false, error: skip ?? "Không tìm thấy hồ sơ" });
      continue;
    }
    const name = (app.full_name ?? "").trim();
    let mailed = false;
    const notes: string[] = [];

    if (sendMail) {
      if (!isValidEmail(app.email)) {
        notes.push("Không có email");
      } else {
        if (sentAny) await sleep(CLOSE_OUT_GAP_MS);
        sentAny = true;
        try {
          const resolved = await resolveCcForApplication(cfg, "position_filled", ctx, {
            jobId: app.job_id,
            assigneeId: app.assignee_user_id ?? null,
          });
          const draft = buildDraft(
            { kind: "position_filled", candidateName: name, jobTitle: job.title, support: resolved.support },
            template,
          );
          const sent = await deliverCandidateEmail(cfg, ctx, {
            applicationId: app.id,
            kind: "position_filled",
            candidateEmail: app.email as string,
            subject: draft.subject,
            text: draft.text,
            cc: resolved.cc,
            from: resolved.from,
            replyTo: resolved.replyTo,
          });
          if ("error" in sent) {
            // Chưa báo được ứng viên → giữ nguyên trạng thái để HR xử lý lại.
            results.push({ id: appId, name, mailed: false, moved: false, error: `Gửi mail thất bại: ${sent.error}` });
            continue;
          }
          mailed = true;
          if (sent.warning) notes.push(sent.warning);
        } catch (e) {
          results.push({ id: appId, name, mailed: false, moved: false, error: e instanceof Error ? e.message : "Gửi mail thất bại" });
          continue;
        }
      }
    }

    // Như PATCH hồ sơ: chỉ ghi cột status (updated_at do trigger). Chặn ghi đè nếu ai đó vừa chuyển hồ sơ đi.
    const { data: moved, error: moveErr } = await supabase
      .from("applications")
      .update({ status: TALENT_POOL_STATUS })
      .eq("id", app.id)
      .in("status", openKeys)
      .select("id");
    const ok = !moveErr && (moved?.length ?? 0) > 0;
    if (moveErr) notes.push(`Không chuyển được trạng thái: ${moveErr.message}`);
    else if (!ok) notes.push("Hồ sơ vừa được chuyển trạng thái khác — không đổi");
    results.push({ id: appId, name, mailed, moved: ok, ...(notes.length ? { error: notes.join("; ") } : {}) });
  }

  const mailedCount = results.filter((r) => r.mailed).length;
  const movedCount = results.filter((r) => r.moved).length;
  if (mailedCount || movedCount) {
    // 1 dòng tóm tắt, kênh hr, không @everyone / không tag. Lỗi chỉ ghi log.
    void discordNotify("hr", {
      allowed_mentions: { parse: [] },
      content: closeOutSummary({ actor: ctx.user.displayName, job: job.title, mailed: mailedCount, moved: movedCount }),
    }).catch((e) => console.error("[close-out] Discord lỗi:", e));
  }
  return NextResponse.json({ results });
}
