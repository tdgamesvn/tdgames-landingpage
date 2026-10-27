import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import { requireHrUser, loadScope } from "@/lib/hr-session";
import { readTestInput } from "@/lib/hr-tests";
import { deleteFromR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Danh sách đề test của job. */
export async function GET(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "apps.view_tests");
  if ("response" in auth) return auth.response;
  const { id } = await params;

  // Leader chỉ xem đề của job mình; ngoài phạm vi → 404.
  if (auth.ctx.role === "leader") {
    const scope = await loadScope(auth.ctx).catch(() => null);
    if (!scope) return NextResponse.json({ error: "Không đọc được phạm vi dữ liệu" }, { status: 500 });
    if (!scope.leaderJobIds.includes(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("job_tests")
    .select("*")
    .eq("job_id", id)
    .order("sort_order")
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tests: data ?? [] });
}

/** Thêm đề test: multipart (file) hoặc JSON `{ url, title, note }`. */
export async function POST(request: Request, { params }: Ctx) {
  const authError = await requireHR(request);
  if (authError) return authError;
  const { id } = await params;

  const supabase = getSupabaseAdmin();
  const { data: job } = await supabase.from("jobs").select("id").eq("id", id).maybeSingle();
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const parsed = await readTestInput(request, `job-tests/${id}`);
  if ("error" in parsed) return parsed.error;

  const { data, error } = await supabase
    .from("job_tests")
    .insert({ job_id: id, ...parsed.input })
    .select()
    .single();
  if (error) {
    void deleteFromR2(parsed.input.r2_key);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ test: data });
}
