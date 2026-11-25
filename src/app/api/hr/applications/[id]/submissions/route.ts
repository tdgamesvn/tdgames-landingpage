import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { newTestToken, readTestInput } from "@/lib/hr-tests";
import { needsTestChoice } from "@/lib/hr-test-pick";
import { deleteFromR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Bài làm của ứng viên + đề test của job + token link test (nếu đã tạo). */
export async function GET(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "apps.view_tests");
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const app = await loadScopedApplication(auth.ctx, id, "id, job_id, test_token, test_eta, test_eta_set_at, test_ids").catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [subs, tests] = await Promise.all([
    supabase.from("test_submissions").select("*").eq("application_id", id).order("created_at"),
    supabase.from("job_tests").select("*").eq("job_id", String(app.job_id)).order("sort_order").order("created_at"),
  ]);
  if (subs.error) return NextResponse.json({ error: subs.error.message }, { status: 500 });

  return NextResponse.json({
    submissions: subs.data ?? [],
    tests: tests.data ?? [],
    token: app.test_token as string | null,
    eta: app.test_eta as string | null,
    etaSetAt: app.test_eta_set_at as string | null,
    testIds: (app.test_ids as string[] | null) ?? null,
  });
}

/**
 * - JSON `{ action: "token" }` → tạo (hoặc trả lại) token cho link /test/<token>
 *   (job ≥ 2 đề mà chưa chọn đề → 409, HR phải chọn trước)
 * - JSON `{ action: "tests", test_ids: string[] }` → chọn đề gửi cho ứng viên này ([] = bỏ chọn)
 * - multipart file / JSON `{ url, note }` → HR lưu hộ bài làm
 */
export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireHrUser(request, "apps.edit");
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const app = await loadScopedApplication(auth.ctx, id, "id, job_id, test_token, test_ids").catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isJson = (request.headers.get("content-type") ?? "").includes("application/json");
  if (isJson) {
    const body = (await request.clone().json().catch(() => ({}))) as Record<string, unknown>;
    if (body.action === "tests" || body.action === "token") {
      const { data: jobTests, error: testsErr } = await supabase.from("job_tests").select("id").eq("job_id", String(app.job_id));
      if (testsErr) return NextResponse.json({ error: testsErr.message }, { status: 500 });
      const tests = jobTests ?? [];

      if (body.action === "tests") {
        const raw = Array.isArray(body.test_ids) ? body.test_ids : null;
        if (!raw || raw.some((x) => typeof x !== "string")) {
          return NextResponse.json({ error: "test_ids phải là danh sách id đề test" }, { status: 400 });
        }
        const ids = [...new Set(raw as string[])];
        if (ids.some((x) => !tests.some((t) => t.id === x))) {
          return NextResponse.json({ error: "Có đề không thuộc job của ứng viên này" }, { status: 400 });
        }
        const testIds = ids.length ? ids : null;
        const { error } = await supabase.from("applications").update({ test_ids: testIds }).eq("id", id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ testIds });
      }

      if (needsTestChoice(tests, app.test_ids as string[] | null)) {
        return NextResponse.json(
          { error: "Job có nhiều bài test — tick chọn bài gửi cho ứng viên này trước." },
          { status: 409 },
        );
      }
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
