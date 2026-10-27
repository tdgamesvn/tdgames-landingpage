import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, jobInScope } from "@/lib/hr-session";
import { deleteFromR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ testId: string }> };

/** Sửa tiêu đề / ghi chú / thứ tự đề test. */
export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "jobs.manage");
  if ("response" in auth) return auth.response;
  const { testId } = await params;

  // Đề test thuộc job ngoài phạm vi (Leader chỉ job mình) → 404.
  const { data: owner, error: ownerErr } = await getSupabaseAdmin().from("job_tests").select("job_id").eq("id", testId).maybeSingle();
  if (ownerErr) return NextResponse.json({ error: ownerErr.message }, { status: 500 });
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const inScopeJob = await jobInScope(auth.ctx, String(owner.job_id)).catch(() => undefined);
  if (inScopeJob === undefined) return NextResponse.json({ error: "Không đọc được job" }, { status: 500 });
  if (!inScopeJob) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title.trim().slice(0, 200);
  if (typeof body.note === "string") patch.note = body.note.trim().slice(0, 2000) || null;
  if (typeof body.sort_order === "number") patch.sort_order = Math.trunc(body.sort_order);
  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from("job_tests")
    .update(patch)
    .eq("id", testId)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ test: data });
}

/** Xoá đề test (+ file trên R2 nếu có). */
export async function DELETE(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "jobs.manage");
  if ("response" in auth) return auth.response;
  const { testId } = await params;

  // Đề test thuộc job ngoài phạm vi (Leader chỉ job mình) → 404.
  const { data: owner, error: ownerErr } = await getSupabaseAdmin().from("job_tests").select("job_id").eq("id", testId).maybeSingle();
  if (ownerErr) return NextResponse.json({ error: ownerErr.message }, { status: 500 });
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const inScopeJob = await jobInScope(auth.ctx, String(owner.job_id)).catch(() => undefined);
  if (inScopeJob === undefined) return NextResponse.json({ error: "Không đọc được job" }, { status: 500 });
  if (!inScopeJob) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await getSupabaseAdmin()
    .from("job_tests")
    .delete()
    .eq("id", testId)
    .select("r2_key")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await deleteFromR2(data?.r2_key);
  return NextResponse.json({ ok: true });
}
