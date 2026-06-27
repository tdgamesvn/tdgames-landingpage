import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import { notifyNewComment } from "@/lib/hr-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/hr/applications/:id/comments — list all comments for an application */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

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
  const authError = await requireHR(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  let body: { author_name?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const authorName = (body.author_name ?? "").trim();
  const content = (body.content ?? "").trim();

  if (!authorName)
    return NextResponse.json(
      { error: "author_name is required" },
      { status: 400 },
    );
  if (!content)
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 },
    );

  // Insert comment
  const { data, error } = await supabase
    .from("application_comments")
    .insert({ application_id: id, author_name: authorName, content })
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
