import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import { deleteFromR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Xoá bài làm (+ file R2). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ subId: string }> },
) {
  const authError = await requireHR(request);
  if (authError) return authError;
  const { subId } = await params;

  const { data, error } = await getSupabaseAdmin()
    .from("test_submissions")
    .delete()
    .eq("id", subId)
    .select("r2_key")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await deleteFromR2(data?.r2_key);
  return NextResponse.json({ ok: true });
}
