import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import { newTestToken, readTestInput } from "@/lib/hr-tests";
import { deleteFromR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Bài làm của ứng viên + đề test của job + token link test (nếu đã tạo). */
export async function GET(request: Request, { params }: Ctx) {
  const authError = await requireHR(request);
  if (authError) return authError;
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: app } = await supabase
    .from("applications")
    .select("id, job_id, test_token, test_eta, test_eta_set_at")
    .eq("id", id)
    .maybeSingle();
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [subs, tests] = await Promise.all([
    supabase.from("test_submissions").select("*").eq("application_id", id).order("created_at"),
    supabase.from("job_tests").select("*").eq("job_id", app.job_id).order("sort_order").order("created_at"),
  ]);
  if (subs.error) return NextResponse.json({ error: subs.error.message }, { status: 500 });

  return NextResponse.json({
    submissions: subs.data ?? [],
    tests: tests.data ?? [],
    token: app.test_token as string | null,
    eta: app.test_eta as string | null,
    etaSetAt: app.test_eta_set_at as string | null,
  });
}

/**
 * - JSON `{ action: "token" }` → tạo (hoặc trả lại) token cho link /test/<token>
 * - multipart file / JSON `{ url, note }` → HR lưu hộ bài làm
 */
export async function POST(request: Request, { params }: Ctx) {
  const authError = await requireHR(request);
  if (authError) return authError;
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: app } = await supabase
    .from("applications")
    .select("id, test_token")
    .eq("id", id)
    .maybeSingle();
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isJson = (request.headers.get("content-type") ?? "").includes("application/json");
  if (isJson) {
    const body = (await request.clone().json().catch(() => ({}))) as Record<string, unknown>;
    if (body.action === "token") {
      if (app.test_token) return NextResponse.json({ token: app.test_token });
      const token = newTestToken();
      const { error } = await supabase.from("applications").update({ test_token: token }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ token });
    }
  }

  const parsed = await readTestInput(request, `test-submissions/${id}`);
  if ("error" in parsed) return parsed.error;
  const { kind, url, r2_key, file_name, file_size, note } = parsed.input;

  const { data, error } = await supabase
    .from("test_submissions")
    .insert({ application_id: id, kind, url, r2_key, file_name, file_size, note, submitted_by: "hr" })
    .select()
    .single();
  if (error) {
    void deleteFromR2(r2_key);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ submission: data });
}
