import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify, nextFreeSlug, extractJson } from "@/lib/blog-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DRAFT_PROMPT = `You are the content editor of TD Games Studio — a Vietnam-based studio doing 2D game art, Spine animation and VFX outsourcing for game studios abroad.

Write a blog post for tdgamestudio.com. Readers are game developers and studio decision-makers who might hire us.

The CEO picked the topic and answered one question from real studio experience. That answer is the SPINE of the post — build around it, quote the specifics, do not water it down into generic advice. If the answer is short, still lead with it; never invent extra anecdotes, numbers, client names or case studies.

Rules:
- Write in ENGLISH (the site is English), even though the topic/notes are Vietnamese.
- 700-1100 words of Markdown. Start with the substance — no "In today's fast-paced games industry" intros.
- Voice: first-person plural ("we"), practical, specific, no hype, no emoji.
- Use ## subheads. Do NOT repeat the title as an H1 inside the body.
- End with one short paragraph on how TD Games works with clients on this — a soft close, not a sales pitch.
- No image markdown — covers are picked by hand from our own artwork.

Reply with ONLY a JSON object, no markdown fence, no prose:
{"title": "...", "excerpt": "1-2 sentence summary for listing cards", "tag": "Guide|Pipeline|2D Art|Animation|VFX|Insights", "content_md": "..."}`;

/** GET — danh sách chủ đề radar đã gợi ý (mới nhất trước). */
export async function GET(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_topics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ topics: data ?? [] });
  } catch (err) {
    console.error("[GET /api/admin/blog/topics]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** PATCH — đổi trạng thái chủ đề (dùng để bỏ qua chủ đề không thích). */
export async function PATCH(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { id, status } = await req.json();
    if (!id || !["new", "picked", "skipped"].includes(status)) {
      return NextResponse.json({ error: "id and valid status are required" }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("blog_topics").update({ status }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/admin/blog/topics]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST — AI dựng bản nháp từ chủ đề + ghi chú thật của CEO. Luôn lưu published: false. */
export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? "gpt-5.4-mini";
  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "AI_BASE_URL / AI_API_KEY not configured" }, { status: 500 });
  }

  const { id, ceo_note, answers } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  // Chấp nhận cả 2 đường: bộ hỏi-đáp từ khâu phỏng vấn, hoặc một ghi chú tự do
  // như trước. Gộp về cùng một chuỗi để chỗ dưới không phải phân biệt.
  const note = Array.isArray(answers)
    ? answers
        .filter((a) => a && String(a.a ?? "").trim())
        .map((a) => `**${String(a.q ?? "").trim()}**\n${String(a.a).trim()}`)
        .join("\n\n")
    : String(ceo_note ?? "");

  if (!note || note.trim().length < 40) {
    // Không có chất liệu thật thì bài sẽ là generic content — đúng thứ Google phạt.
    return NextResponse.json(
      { error: "Cần ít nhất 40 ký tự trải nghiệm thật để AI có cái mà dựng bài" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: topic, error: topicError } = await supabase
    .from("blog_topics")
    .select("*")
    .eq("id", id)
    .single();
  if (topicError || !topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

  const userPrompt = JSON.stringify({
    topic: topic.topic,
    why_us: topic.why,
    question_asked: topic.ask,
    ceo_answer: note,
    source_link: topic.source,
  });

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: DRAFT_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(280_000),
    });
  } catch {
    return NextResponse.json(
      { error: "AI backend unreachable (Mac tắt / cliproxyapi không chạy?)" },
      { status: 502 }
    );
  }
  if (!res.ok) return NextResponse.json({ error: `AI backend error ${res.status}` }, { status: 502 });

  const raw: string = (await res.json())?.choices?.[0]?.message?.content ?? "";
  let draft: { title: string; excerpt: string; tag: string; content_md: string };
  try {
    const p = extractJson(raw) as Record<string, unknown>;
    draft = {
      title: String(p.title ?? "").trim(),
      excerpt: String(p.excerpt ?? "").trim(),
      tag: String(p.tag ?? "Insights").trim(),
      content_md: String(p.content_md ?? "").trim(),
    };
    if (!draft.title || !draft.content_md) throw new Error("thiếu title/content");
  } catch {
    return NextResponse.json(
      { error: "AI trả output không đọc được", raw: raw.slice(0, 500) },
      { status: 502 }
    );
  }

  const base = slugify(draft.title);
  const { data: existing } = await supabase.from("blog_posts").select("slug").like("slug", `${base}%`);
  const slug = nextFreeSlug(base, (existing ?? []).map((r) => r.slug as string));

  const { data: post, error: insertError } = await supabase
    .from("blog_posts")
    .insert({
      slug,
      title: draft.title,
      excerpt: draft.excerpt,
      tag: draft.tag,
      cover_image: "", // sếp chọn artwork thật trong form — không dùng ảnh AI
      content_md: draft.content_md,
      published: false, // hardcode: AI không bao giờ tự đăng
      author: "TD Games",
    })
    .select()
    .single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await supabase
    .from("blog_topics")
    .update({ status: "drafted", ceo_note: note, post_id: post.id })
    .eq("id", id);

  return NextResponse.json({ post }, { status: 201 });
}
