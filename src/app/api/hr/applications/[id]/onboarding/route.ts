import { NextResponse } from "next/server";
import { requireHrUser, loadScopedApplication, loadScope, type HrContext } from "@/lib/hr-session";
import { canTickItem, isOnboardingEligible, onboardingProgress, setItemDone } from "@/lib/hr-onboarding";
import { ensureOnboarding, updateOnboardingItems, type OnboardingRow } from "@/lib/hr-onboarding-store";
import { applyStartDateChange, effectiveStartDate } from "@/lib/referral-store";
import { isValidDate } from "@/lib/offer-letter";
import { readJsonBody } from "@/lib/offer-letter-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const COLUMNS = "id, job_id, offer_status, work_type";
const FORBIDDEN = "Bạn không có quyền làm việc này";

async function isJobLeader(ctx: HrContext, jobId: unknown): Promise<boolean> {
  if (ctx.role !== "leader") return false;
  const scope = await loadScope(ctx);
  return scope.leaderJobIds.includes(String(jobId));
}

async function buildPayload(ctx: HrContext, appId: string, jobLeader: boolean, row: OnboardingRow) {
  const start = await effectiveStartDate(appId);
  const canEdit = ctx.role === "boss" || ctx.perms.has("onboard.edit");
  return {
    eligible: true as const,
    start: { date: start.date, confirmed: start.confirmed },
    items: row.items,
    progress: onboardingProgress(row.items),
    reminded: row.reminded,
    can: {
      edit: canEdit,
      tickIds: row.items
        .filter((item) => canTickItem({ role: ctx.role, perms: ctx.perms, isJobLeader: jobLeader, item }))
        .map((item) => item.id),
    },
  };
}

/** Checklist onboard + ngày đi làm của hồ sơ (chỉ hồ sơ đã nhận offer, không phải freelancer). */
export async function GET(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "onboard.view");
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  const { id } = await params;
  try {
    const app = await loadScopedApplication(ctx, id, COLUMNS);
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!isOnboardingEligible({ offer_status: (app.offer_status as string | null) ?? null, work_type: (app.work_type as string | null) ?? null })) {
      return NextResponse.json({ eligible: false });
    }
    const jobLeader = await isJobLeader(ctx, app.job_id);
    const row = await ensureOnboarding(id);
    return NextResponse.json(await buildPayload(ctx, id, jobLeader, row));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không đọc được onboard" }, { status: 500 });
  }
}

/** Tích/bỏ tích 1 mục (`{item_id, done}`) hoặc đổi ngày đi làm (`{start_date}`). */
export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "onboard.view");
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  const { id } = await params;
  const body = await readJsonBody(request);
  if ("response" in body) return body.response;
  const b = body.data;
  if (!b || typeof b !== "object" || Array.isArray(b)) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  const rec = b as Record<string, unknown>;
  const keys = Object.keys(rec);
  const isTick = keys.length === 2 && typeof rec.item_id === "string" && typeof rec.done === "boolean";
  const isStart =
    keys.length === 1 && "start_date" in rec && (rec.start_date === null || typeof rec.start_date === "string");
  if (!isTick && !isStart) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  if (isStart && rec.start_date !== null && !isValidDate(rec.start_date as string)) {
    return NextResponse.json({ error: "Ngày đi làm không hợp lệ" }, { status: 400 });
  }

  try {
    const app = await loadScopedApplication(ctx, id, COLUMNS);
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!isOnboardingEligible({ offer_status: (app.offer_status as string | null) ?? null, work_type: (app.work_type as string | null) ?? null })) {
      return NextResponse.json({ error: "Hồ sơ chưa nhận offer" }, { status: 409 });
    }
    const jobLeader = await isJobLeader(ctx, app.job_id);

    if (isStart) {
      if (!(ctx.role === "boss" || ctx.perms.has("onboard.edit"))) {
        return NextResponse.json({ error: FORBIDDEN }, { status: 403 });
      }
      await applyStartDateChange(id, rec.start_date as string | null);
    } else {
      const current = await ensureOnboarding(id);
      const item = current.items.find((x) => x.id === rec.item_id);
      if (!item) return NextResponse.json({ error: "Không tìm thấy mục" }, { status: 404 });
      if (!canTickItem({ role: ctx.role, perms: ctx.perms, isJobLeader: jobLeader, item })) {
        return NextResponse.json({ error: FORBIDDEN }, { status: 403 });
      }
      const actor = { id: ctx.user.id ?? ctx.user.email, name: ctx.user.displayName };
      const nowIso = new Date().toISOString();
      const result = await updateOnboardingItems(id, (items) =>
        setItemDone(items, rec.item_id as string, rec.done as boolean, actor, nowIso),
      );
      if (result === "not_found") return NextResponse.json({ error: "Không tìm thấy mục" }, { status: 404 });
      if (result === "conflict") {
        return NextResponse.json({ error: "Vừa có người khác cập nhật, tải lại rồi thử lại" }, { status: 409 });
      }
    }
    const row = await ensureOnboarding(id);
    return NextResponse.json(await buildPayload(ctx, id, jobLeader, row));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Không cập nhật được onboard" }, { status: 500 });
  }
}
