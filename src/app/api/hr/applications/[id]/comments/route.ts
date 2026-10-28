import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedApplication } from "@/lib/hr-session";
import { notifyNewComment } from "@/lib/hr-notify";
import { loadMentionableMembers } from "@/lib/hr-comment-members";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MENTIONS = 20;

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

  // Vai của người viết (không lộ email): join hr_users theo author_user_id.
  const authorIds = [...new Set((data ?? []).map((c) => c.author_user_id).filter((v): v is string => !!v))];
  const roleById = new Map<string, string>();
  if (authorIds.length) {
    const { data: users } = await supabase.from("hr_users").select("id, role").in("id", authorIds);
    for (const u of users ?? []) roleById.set(String(u.id), String(u.role));
  }
  // Tên người được tag (độc lập với phạm vi/khoá hiện tại) để client vẫn tô màu @Tên.
  const mentionIds = [...new Set((data ?? []).flatMap((c) => (Array.isArray(c.mentions) ? (c.mentions as string[]) : [])))];
  const mentionNames: Record<string, string> = {};
  if (mentionIds.length) {
    const { data: us } = await supabase.from("hr_users").select("id, display_name").in("id", mentionIds);
    for (const u of us ?? []) mentionNames[String(u.id)] = String(u.display_name);
  }
  const comments = (data ?? []).map((c) => ({
    ...c,
    mentions: Array.isArray(c.mentions) ? c.mentions : [],
    author_role: c.author_user_id ? (roleById.get(c.author_user_id) ?? null) : null,
  }));

  return NextResponse.json({ comments, mention_names: mentionNames });
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

  const scoped = await loadScopedApplication(ctx, id, "job_id, status, offer_status").catch(() => undefined);
  if (scoped === undefined) return NextResponse.json({ error: "Không đọc được hồ sơ" }, { status: 500 });
  if (!scoped) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { author_name?: string; content?: string; mentions?: unknown };
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

  // Chỉ giữ id thuộc danh sách có thể tag của hồ sơ này (id lạ bỏ êm), tối đa 20.
  let mentions: string[] = [];
  if (Array.isArray(body.mentions) && body.mentions.length) {
    const wanted = [...new Set(body.mentions.filter((v): v is string => typeof v === "string" && UUID_RE.test(v)))];
    if (wanted.length) {
      try {
        const allowed = new Set((await loadMentionableMembers(scoped)).map((m) => m.id));
        mentions = wanted.filter((v) => allowed.has(v) && v !== ctx.user.id).slice(0, MAX_MENTIONS);
      } catch {
        mentions = []; // không đọc được danh sách → bỏ tag, vẫn lưu comment
      }
    }
  }

  // Insert comment (không gửi cột mentions khi rỗng → vẫn chạy được trước khi áp migration)
  const { data, error } = await supabase
    .from("application_comments")
    .insert({
      application_id: id,
      author_name: authorName,
      author_user_id: ctx.user.id,
      content,
      ...(mentions.length ? { mentions } : {}),
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget: Discord + push theo luật người nhận (Sếp, người phụ trách, Leader job, người được tag).
  void notifyNewComment({
    appId: id,
    commentId: String(data.id),
    authorName,
    actorId: ctx.user.id,
    content,
    mentions,
  }).catch((e) => console.error("[hr-comments] notify lỗi:", e));

  return NextResponse.json({ comment: data }, { status: 201 });
}
