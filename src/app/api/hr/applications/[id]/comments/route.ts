import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { notifyNewComment } from "@/lib/hr-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/hr/applications/:id/comments — list all comments for an application */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireHrUser(request, "apps.comment");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const app = await loadScopedApplication(auth.ctx, id).catch(() => undefined);
  if (app === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("application_comments")
    .select("*")
    .eq("application_id", id)
    .order("created_at", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ comments: data ?? [] });
}

/** POST /api/hr/applications/:id/comments — create a new comment */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireHrUser(request, "apps.comment");
  if ("response" in auth) return auth.response;
  const { ctx } = auth;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const scoped = await loadScopedApplication(ctx, id).catch(() => undefined);
  if (scoped === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!scoped) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { author_name?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Tên tác giả lấy từ tài khoản; author_name client gửi bị bỏ qua.
  const authorName = ctx.user.displayName;
  const content = (body.content ?? "").trim();

  if (!content)
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 },
    );

  // Insert comment
  const { data, error } = await supabase
    .from("application_comments")
    .insert({ application_id: id, author_name: authorName, author_user_id: ctx.user.id, content })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget Discord notification
  (async () => {
    try {
      // Fetch applicant name + job title for notification context
      const { data: app } = await supabase
        .from("applications")
        .select("full_name, job_id")
        .eq("id", id)
        .single();

      let jobTitle: string | undefined;
      if (app?.job_id) {
        const { data: job } = await supabase
          .from("jobs")
          .select("title")
          .eq("id", app.job_id)
          .single();
        jobTitle = job?.title ?? undefined;
      }

      await notifyNewComment(
        app?.full_name ?? "Unknown",
        authorName,
        content,
        jobTitle,
      );
    } catch {
      // Silently ignore — DB insert already succeeded
    }
  })();

  return NextResponse.json({ comment: data }, { status: 201 });
}
