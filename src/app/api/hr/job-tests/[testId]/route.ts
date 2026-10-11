import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import { deleteFromR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ testId: string }> };

/** Sửa tiêu đề / ghi chú / thứ tự đề test. */
export async function PATCH(request: Request, { params }: Ctx) {
  const authError = await requireHR(request);
  if (authError) return authError;
  const { testId } = await params;

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
  const authError = await requireHR(request);
  if (authError) return authError;
  const { testId } = await params;

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
