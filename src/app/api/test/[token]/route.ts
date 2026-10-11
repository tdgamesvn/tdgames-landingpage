import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { MAX_SUBMISSION_ITEMS, readSubmissionBatch } from "@/lib/hr-tests";
import { deleteFromR2 } from "@/lib/r2";
import { discordNotify } from "@/lib/discord-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

// Công khai: ai có token (HR gửi) là xem đề + nộp bài. Token 24 ký tự ngẫu nhiên.
async function findApp(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const { data } = await getSupabaseAdmin()
    .from("applications")
    .select("id, full_name, job_id, jobs(title)")
    .eq("test_token", token)
    .maybeSingle();
  return data as { id: string; full_name: string; job_id: string; jobs: { title: string } | null } | null;
}

export async function GET(_request: Request, { params }: Ctx) {
  const { token } = await params;
  const app = await findApp(token);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = getSupabaseAdmin();
  const [tests, subs] = await Promise.all([
    supabase
      .from("job_tests")
      .select("id, kind, title, url, file_name, file_size, note")
      .eq("job_id", app.job_id)
      .order("sort_order")
      .order("created_at"),
    supabase
      .from("test_submissions")
      .select("id, kind, url, file_name, file_size, note, created_at")
      .eq("application_id", app.id)
      .eq("submitted_by", "candidate")
      .order("created_at"),
  ]);

  return NextResponse.json({
    candidate: app.full_name,
    job: app.jobs?.title ?? "",
    tests: tests.data ?? [],
    submissions: subs.data ?? [],
    maxItems: MAX_SUBMISSION_ITEMS,
  });
}

export async function POST(request: Request, { params }: Ctx) {
  const { token } = await params;
  const app = await findApp(token);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = getSupabaseAdmin();
  // Nộp 1 lần duy nhất. Bài HR lưu hộ không tính. Muốn nộp lại → HR xoá bài cũ.
  const { count } = await supabase
    .from("test_submissions")
    .select("id", { count: "exact", head: true })
    .eq("application_id", app.id)
    .eq("submitted_by", "candidate");
  if ((count ?? 0) > 0)
    return NextResponse.json({ error: "You have already submitted — please contact HR to resubmit." }, { status: 409 });

  const parsed = await readSubmissionBatch(request, `test-submissions/${app.id}`);
  if ("error" in parsed) return parsed.error;
  const { items, note } = parsed;

  // Ghi chú lưu ở mục đầu tiên; insert 1 lệnh → hoặc lưu hết, hoặc không lưu gì.
  const rows = items.map((it, i) => ({
    application_id: app.id,
    kind: it.kind,
    url: it.url,
    r2_key: it.r2_key,
    file_name: it.file_name,
    file_size: it.file_size,
    note: i === 0 ? note : null,
    submitted_by: "candidate",
  }));
  const { data, error } = await supabase
    .from("test_submissions")
    .insert(rows)
    .select("id, kind, url, file_name, file_size, note, created_at");
  if (error) {
    void Promise.all(items.map((it) => deleteFromR2(it.r2_key)));
    return NextResponse.json({ error: "Could not save your submission" }, { status: 500 });
  }

  const list = items
    .map((it) => `${it.kind === "file" ? "📎" : "🔗"} ${it.file_name ? `[${it.file_name}](${it.url})` : it.url}`)
    .join("\n");
  void discordNotify("hr", {
    content: `@everyone 📝 **${app.full_name}** vừa nộp bài test (${items.length} mục)`,
    embeds: [
      {
        title: app.jobs?.title ? `Bài test — ${app.jobs.title}` : "Bài test",
        color: 0x06b6d4,
        fields: [
          { name: "Bài làm", value: list.slice(0, 1000) },
          ...(note ? [{ name: "Ghi chú", value: note.slice(0, 1000) }] : []),
        ],
      },
    ],
  }).catch(() => {});

  return NextResponse.json({ submissions: data ?? [] });
}
