import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { MAX_SUBMISSION_ITEMS, readSubmissionBatch } from "@/lib/hr-tests";
import { deleteFromR2 } from "@/lib/r2";
import { notifyCandidate } from "@/lib/hr-notify";
import { candidatePushPayload } from "@/lib/hr-push-payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

// Công khai: ai có token (HR gửi) là xem đề + nộp bài. Token 24 ký tự ngẫu nhiên.
async function findApp(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const { data } = await getSupabaseAdmin()
    .from("applications")
    .select("id, full_name, job_id, test_eta, jobs(title)")
    .eq("test_token", token)
    .maybeSingle();
  return data as {
    id: string;
    full_name: string;
    job_id: string;
    test_eta: string | null;
    jobs: { title: string } | null;
  } | null;
}

const MAX_ETA_DAYS = 60;

/** Ứng viên chốt thời gian dự kiến nộp bài — 1 lần, phải trước khi nộp bài. */
async function setEta(app: NonNullable<Awaited<ReturnType<typeof findApp>>>, raw: unknown) {
  if (app.test_eta)
    return NextResponse.json({ error: "Expected time already set — please contact HR to change it." }, { status: 409 });
  const eta = typeof raw === "string" ? new Date(raw) : null;
  if (!eta || Number.isNaN(eta.getTime()))
    return NextResponse.json({ error: "Please pick a valid date and time." }, { status: 400 });
  const now = Date.now();
  if (eta.getTime() < now - 5 * 60_000)
    return NextResponse.json({ error: "The expected time must be in the future." }, { status: 400 });
  if (eta.getTime() > now + MAX_ETA_DAYS * 86_400_000)
    return NextResponse.json({ error: `Please pick a time within ${MAX_ETA_DAYS} days.` }, { status: 400 });

  const iso = eta.toISOString();
  // .is(null) → chống 2 request đua nhau ghi đè.
  const { data, error } = await getSupabaseAdmin()
    .from("applications")
    .update({ test_eta: iso, test_eta_set_at: new Date().toISOString() })
    .eq("id", app.id)
    .is("test_eta", null)
    .select("id");
  if (error) return NextResponse.json({ error: "Could not save — please try again." }, { status: 500 });
  if (!data?.length)
    return NextResponse.json({ error: "Expected time already set — please contact HR to change it." }, { status: 409 });

  const unix = Math.floor(eta.getTime() / 1000);
  // Ứng viên tự đặt (không có người thực hiện). Chỉ Discord, không push.
  void notifyCandidate(app.id, { event: "test_eta" }, () => ({
    content: `⏰ **${app.full_name}** hẹn nộp bài test lúc <t:${unix}:F> (<t:${unix}:R>)`,
    embeds: app.jobs?.title ? [{ title: `Bài test — ${app.jobs.title}`, color: 0xf59e0b }] : undefined,
  })).catch(() => {});

  return NextResponse.json({ eta: iso });
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
    eta: app.test_eta,
    tests: tests.data ?? [],
    submissions: subs.data ?? [],
    maxItems: MAX_SUBMISSION_ITEMS,
  });
}

export async function POST(request: Request, { params }: Ctx) {
  const { token } = await params;
  const app = await findApp(token);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if ((request.headers.get("content-type") ?? "").includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (body.action === "eta") return setEta(app, body.eta);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (!app.test_eta)
    return NextResponse.json({ error: "Please set your expected submission time first." }, { status: 409 });

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
  // Người nhận: Sếp, người phụ trách, Leader của job (chưa giao → @everyone + HR). Ứng viên nộp → không có actor.
  void notifyCandidate(app.id, { event: "test_submitted" }, ({ jobTitle }) => ({
    content: `📝 **${app.full_name}** vừa nộp bài test (${items.length} mục)`,
    embeds: [
      {
        title: app.jobs?.title ? `Bài test — ${app.jobs.title}` : "Bài test",
        color: 0x06b6d4,
        fields: [
          { name: "Bài làm", value: list.slice(0, 1000) },
          ...(app.test_eta
            ? [{ name: "Hẹn nộp", value: `<t:${Math.floor(new Date(app.test_eta).getTime() / 1000)}:F>` }]
            : []),
          ...(note ? [{ name: "Ghi chú", value: note.slice(0, 1000) }] : []),
        ],
      },
    ],
    push: candidatePushPayload({
      event: "test_submitted",
      appId: app.id,
      candidateName: app.full_name,
      jobTitle: jobTitle ?? app.jobs?.title ?? null,
      text: `${items.length} mục — chờ chấm`,
    }),
  })).catch(() => {});

  return NextResponse.json({ submissions: data ?? [] });
}
