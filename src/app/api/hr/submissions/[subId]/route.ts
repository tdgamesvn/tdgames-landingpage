import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { deleteFromR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Xoá bài làm (+ file R2). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ subId: string }> },
) {
  const auth = await requireHrUser(request, "apps.edit");
  if ("response" in auth) return auth.response;
  const { subId } = await params;

  // Bài làm thuộc hồ sơ ngoài phạm vi → 404.
  const { data: sub, error: subErr } = await getSupabaseAdmin()
    .from("test_submissions")
    .select("application_id")
    .eq("id", subId)
    .maybeSingle();
  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const app = await loadScopedApplication(auth.ctx, String(sub.application_id)).catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
