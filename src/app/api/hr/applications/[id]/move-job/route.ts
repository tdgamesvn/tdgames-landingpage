import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { redactApplication } from "@/lib/hr-scope";
import { loadPayouts } from "@/lib/referral-store";
import { escapeIlike, moveJobComment, moveJobDenial } from "@/lib/hr-move-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/hr/applications/:id/move-job  { job_id }
 * Đổi vị trí ứng tuyển: link test mở đề của job mới, AI chấm theo JD mới (xoá điểm cũ),
 * Leader job mới thấy hồ sơ. Giữ nguyên trạng thái, bình luận, bài nộp, mail đã gửi.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHrUser(request, "apps.edit");
  if ("response" in auth) return auth.response;
  const { ctx } = auth;
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const body = (await request.json().catch(() => null)) as { job_id?: unknown } | null;
  const targetJobId = typeof body?.job_id === "string" ? body.job_id : "";
  if (!UUID_RE.test(targetJobId)) return NextResponse.json({ error: "Thiếu vị trí mới" }, { status: 400 });

  const app = (await loadScopedApplication(ctx, id, "id, job_id, email, ai_score").catch(() => undefined)) as
    | { id: string; job_id: string; email: string | null; ai_score: number | null }
    | null
    | undefined;
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [jobsRes, dupRes] = await Promise.all([
    supabase.from("jobs").select("id, title").in("id", [app.job_id, targetJobId]),
    app.email
      ? supabase
          .from("applications")
          .select("id")
          .eq("job_id", targetJobId)
          .neq("id", id)
          .ilike("email", escapeIlike(app.email.trim()))
          .limit(1)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (jobsRes.error) return NextResponse.json({ error: jobsRes.error.message }, { status: 500 });
  if (dupRes.error) return NextResponse.json({ error: dupRes.error.message }, { status: 500 });
  const titleOf = new Map((jobsRes.data ?? []).map((j) => [String(j.id), String(j.title)]));

  let openPayouts: number;
  try {
    openPayouts = (await loadPayouts(id)).filter((p) => p.status !== "cancelled").length;
  } catch {
    return NextResponse.json({ error: "Không kiểm tra được khoản hoa hồng của hồ sơ" }, { status: 500 });
  }

  const denied = moveJobDenial({
    role: ctx.role,
    canEdit: ctx.perms.has("apps.edit"),
    currentJobId: String(app.job_id),
    targetJobId,
    targetExists: titleOf.has(targetJobId),
    duplicateInTarget: (dupRes.data ?? []).length > 0,
    openPayouts,
  });
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const { data, error } = await supabase
    .from("applications")
    .update({ job_id: targetJobId, ai_score: null, ai_evaluation: null })
    .eq("id", id)
    .select("*, jobs(title, slug)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ghi lại trong cột Bình luận — lỗi ở đây không làm hỏng việc đổi vị trí.
  const fromTitle = titleOf.get(String(app.job_id)) ?? "vị trí cũ";
  const toTitle = titleOf.get(targetJobId) ?? "vị trí mới";
  const { error: cErr } = await supabase.from("application_comments").insert({
    application_id: id,
    author_name: ctx.user.displayName,
    author_user_id: ctx.user.id,
    content: moveJobComment(fromTitle, toTitle, app.ai_score != null),
  });
  if (cErr) console.error("[move-job] không ghi được bình luận", id, cErr.message);

  return NextResponse.json({ application: redactApplication(data, ctx.perms) });
}
