import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, jobInScope } from "@/lib/hr-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cột HR được sửa (không id / slug / created_at / updated_at).
const EDITABLE_JOB_COLUMNS = [
  "title", "type", "location", "level", "salary", "rate_per_hour", "summary", "description",
  "categories", "requirements", "responsibilities", "nice_to_have", "skills", "image_url", "is_active",
  "leader_user_id",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Quyền theo key: leader_user_id cần jobs.assign_leader, key khác cần jobs.manage.
  const auth = await requireHrUser(request);
  if ("response" in auth) return auth.response;
  const { ctx } = auth;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const unknownKey = Object.keys(body).find((k) => !(EDITABLE_JOB_COLUMNS as readonly string[]).includes(k));
  if (unknownKey) return NextResponse.json({ error: `Không được sửa trường ${unknownKey}` }, { status: 400 });
  const keys = Object.keys(body);
  const hasLeader = "leader_user_id" in body;
  const hasOther = keys.some((k) => k !== "leader_user_id");
  if (hasLeader && !ctx.perms.has("jobs.assign_leader")) {
    return NextResponse.json({ error: "Bạn không có quyền gán Leader" }, { status: 403 });
  }
  if ((hasOther || !hasLeader) && !ctx.perms.has("jobs.manage")) {
    return NextResponse.json({ error: "Bạn không có quyền làm việc này" }, { status: 403 });
  }

  const inScopeJob = await jobInScope(ctx, id).catch(() => undefined);
  if (inScopeJob === undefined) return NextResponse.json({ error: "Không đọc được job" }, { status: 500 });
  if (!inScopeJob) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = getSupabaseAdmin();

  // Gán Leader: phải là tài khoản vai leader chưa khoá, hoặc null để bỏ gán.
  if (hasLeader && body.leader_user_id !== null) {
    const target = typeof body.leader_user_id === "string" ? body.leader_user_id : "";
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);
    const { data: u, error: uErr } = isUuid
      ? await supabase.from("hr_users").select("role, disabled").eq("id", target).maybeSingle()
      : { data: null, error: null };
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
    if (!u || u.role !== "leader" || u.disabled) {
      return NextResponse.json({ error: "Leader phải là tài khoản vai Leader đang hoạt động" }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("jobs")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ job: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireHrUser(request, "jobs.manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const inScopeJob = await jobInScope(auth.ctx, id).catch(() => undefined);
  if (inScopeJob === undefined) return NextResponse.json({ error: "Không đọc được job" }, { status: 500 });
  if (!inScopeJob) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
