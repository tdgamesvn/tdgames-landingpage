import { writeFileSync } from "node:fs";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-auth";
import {
  slugify,
  nextFreeSlug,
  extractJson,
  findAiImages,
  applyAiImages,
  IMAGE_RULES,
  COVER_RULES,
} from "@/lib/blog-ai";
import { generateAiImage } from "@/lib/ai-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Số ảnh trong bài, bốc ngẫu nhiên phía server.
 *
 * Để AI tự quyết ("0 to 4, as many as the post needs") thì bài nào cũng ra kịch
 * trần — LLM luôn chọn max khi được cho một khoảng. Bốc số trước rồi bắt nó viết
 * đúng số đó mới thật sự có bài ít bài nhiều.
 * ponytail: nghiêng về 2-3 vì bài 700-1100 chữ nhét 4 ảnh là loãng. Không bao giờ
 * bốc 0 — bài trắng ảnh giữa loạt bài có ảnh trông như bị lỗi.
 */
/**
 * Đánh dấu "đang dựng bài" cho deploy script đọc.
 *
 * 2026-08-07: deploy chạy đúng lúc AI đang viết → `pm2 restart` giết request,
 * bài mất trắng, client chờ 4 phút rồi báo fail. `.github/workflows/deploy.yml`
 * chờ lock này trước khi đụng vào app.
 *
 * ponytail: lock tự hết hạn theo mtime (deploy bỏ qua nếu cũ hơn maxDuration),
 * KHÔNG unlink — khỏi phải bọc try/finally quanh cả handler chỉ để xoá một file.
 * Giá phải trả: deploy có thể chờ thừa vài phút sau khi bài đã dựng xong.
 */
const DRAFT_LOCK = "/tmp/tdgames-blog-draft.lock";

const IMAGE_COUNT_POOL = [1, 2, 2, 2, 3, 3, 3, 4];
const pickImageCount = () => IMAGE_COUNT_POOL[Math.floor(Math.random() * IMAGE_COUNT_POOL.length)];

const draftPrompt = (imageCount: number) => `You are the content editor of TD Games Studio — a Vietnam-based studio doing 2D game art, Spine animation and VFX outsourcing for game studios abroad.

Write a blog post for tdgamestudio.com. Readers are game developers and studio decision-makers who might hire us.

The CEO picked the topic and answered one question from real studio experience. That answer is the SPINE of the post — build around it, quote the specifics, do not water it down into generic advice. If the answer is short, still lead with it; never invent extra anecdotes, numbers, client names or case studies.

Rules:
- Write in ENGLISH (the site is English), even though the topic/notes are Vietnamese.
- NEVER quote the CEO's Vietnamese words verbatim. Readers are foreign studios and cannot read Vietnamese. Translate the substance into English prose and state it as our own practice ("We include two revision rounds"), not as a quoted saying. No blockquote of the raw note.
- 700-1100 words of Markdown. Start with the substance — no "In today's fast-paced games industry" intros.
- Voice: first-person plural ("we"), practical, specific, no hype, no emoji.
- Use ## subheads, phrased as a concrete claim ("Revision rounds cost more than the unit price"), never "Introduction" or "Conclusion". Do NOT repeat the title as an H1 inside the body.

Formatting (the site renders full Markdown — use it, a wall of grey paragraphs looks lazy):
- Paragraphs of 2-4 sentences. Break up anything longer.
- Exactly one Markdown table where the post compares options, criteria or trade-offs. Keep it to 2-3 columns and 4-7 rows.
- One bullet list of short, scannable items (max 7). Not every section needs one.
- Bold the key term once per section, at most. Never bold a whole sentence.
- One short blockquote (>) carrying the single most important takeaway, IN ENGLISH, written as our own statement.
- No horizontal rules, no nested lists, no headings deeper than ###.
- End with one short paragraph on how TD Games works with clients on this — a soft close, not a sales pitch.
- Illustrations: insert EXACTLY ${imageCount} in-post image${imageCount === 1 ? "" : "s"} — not more, not fewer. This number is fixed for this post; do not add one because a section feels bare. Spread them across the post's strongest sections, never two next to each other and never one before the first subhead. Each on its own line as: ![short alt text, max 8 words](ai:IMAGE PROMPT)
- With only ${imageCount} slot${imageCount === 1 ? "" : "s"}, spend ${imageCount === 1 ? "it" : "them"} on the section${imageCount === 1 ? "" : "s"} where a picture explains something words struggle with. Sections that are pure argument or numbers do not get one.

${IMAGE_RULES}

${COVER_RULES}

Reply with ONLY a JSON object, no markdown fence, no prose:
{"title": "...", "excerpt": "1-2 sentence summary for listing cards", "tag": "Guide|Pipeline|2D Art|Animation|VFX|Insights", "cover_prompt": "cover image prompt — same style as the in-post images, a subject none of them use, one centred focal subject that still reads when cropped to a square thumbnail", "content_md": "the markdown, containing exactly ${imageCount} ![alt](ai:prompt) image(s)"}`;

/**
 * Dùng khi sếp bấm "AI tự viết" — không có chất liệu thật nào từ CEO.
 * Bài vẫn phải đăng được, nên siết chặt: cấm bịa số liệu và case study.
 */
const AUTO_SUFFIX = `

NO CEO INPUT FOR THIS POST. Write from the topic alone.
- Use industry-standard practice and reasoning that any experienced 2D game art outsourcing studio could stand behind.
- NEVER invent numbers, prices, turnaround times, percentages, client names, project names, team sizes, incidents or case studies. Not one.
- Where a specific figure would normally go, write the trade-off or the range-free principle instead ("pricing depends on asset complexity and revision policy"), not a made-up figure.
- Keep the same structure, formatting and image rules above.`;

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

/**
 * PATCH — cập nhật chủ đề: đổi trạng thái (bỏ qua), hoặc lưu buổi phỏng vấn /
 * ghi chú đang viết dở. Client autosave sau mỗi lần gõ → sếp trả lời nhiều hôm,
 * thoát ra vào lại vẫn còn nguyên.
 */
export async function PATCH(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { id, status, interview, ceo_note } = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const patch: Record<string, unknown> = {};
    if (status !== undefined) {
      if (!["new", "picked", "skipped"].includes(status)) {
        return NextResponse.json({ error: "invalid status" }, { status: 400 });
      }
      patch.status = status;
    }
    if (interview !== undefined) patch.interview = interview;
    if (ceo_note !== undefined) patch.ceo_note = String(ceo_note);
    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: "nothing to update" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("blog_topics").update(patch).eq("id", id);
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

  const { id, ceo_note, answers, auto } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  // Chấp nhận cả 2 đường: bộ hỏi-đáp từ khâu phỏng vấn, hoặc một ghi chú tự do
  // như trước. Gộp về cùng một chuỗi để chỗ dưới không phải phân biệt.
  const note = Array.isArray(answers)
    ? answers
        .filter((a) => a && String(a.a ?? "").trim())
        .map((a) => `**${String(a.q ?? "").trim()}**\n${String(a.a).trim()}`)
        .join("\n\n")
    : String(ceo_note ?? "");

  // auto = sếp không bổ sung gì, giao AI toàn quyền viết từ chủ đề.
  if (!auto && (!note || note.trim().length < 40)) {
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

  const wantImages = pickImageCount();
  console.log(`[blog draft] bốc ${wantImages} ảnh cho "${topic.topic}"`);
  try {
    writeFileSync(DRAFT_LOCK, new Date().toISOString());
  } catch {
    /* không ghi được lock thì vẫn dựng bài — deploy chỉ mất lớp chắn */
  }

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
          { role: "system", content: draftPrompt(wantImages) + (note.trim() ? "" : AUTO_SUFFIX) },
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
  let draft: {
    title: string;
    excerpt: string;
    tag: string;
    content_md: string;
    cover_prompt: string;
  };
  try {
    const p = extractJson(raw) as Record<string, unknown>;
    draft = {
      title: String(p.title ?? "").trim(),
      excerpt: String(p.excerpt ?? "").trim(),
      tag: String(p.tag ?? "Insights").trim(),
      content_md: String(p.content_md ?? "").trim(),
      cover_prompt: String(p.cover_prompt ?? "").trim(),
    };
    if (!draft.title || !draft.content_md) throw new Error("thiếu title/content");
  } catch {
    return NextResponse.json(
      { error: "AI trả output không đọc được", raw: raw.slice(0, 500) },
      { status: 502 }
    );
  }

  // Sinh cover + ảnh trong bài song song. Sếp replace lại ở form /admin nếu
  // không ưng. Ảnh nào lỗi thì bỏ ảnh đó — không bao giờ vứt cả bài đã viết.
  // Cắt theo đúng số đã bốc: AI thỉnh thoảng vẫn nhét dư một ảnh dù prompt nói
  // EXACTLY. Ảnh dư KHÔNG render nhưng vẫn phải đưa xuống applyAiImages với
  // url=null, không thì placeholder ![alt](ai:prompt) nằm nguyên trong bài.
  const found = findAiImages(draft.content_md);
  const inline = found.slice(0, wantImages);
  const extra = found.slice(wantImages);
  const [cover, ...images] = await Promise.all([
    draft.cover_prompt ? generateAiImage(draft.cover_prompt, "1536x1024", { noText: true }) : null,
    ...inline.map((img) => generateAiImage(img.prompt, "1536x1024")),
  ]);
  const imageErrors: string[] = [];
  const url = (r: Awaited<ReturnType<typeof generateAiImage>> | null) => {
    if (!r) return null;
    if ("error" in r) {
      imageErrors.push(r.error);
      return null;
    }
    return r.url;
  };
  const coverUrl = url(cover);
  draft.content_md = applyAiImages(
    draft.content_md,
    [
      ...inline.map((img, i) => ({ raw: img.raw, url: url(images[i]) })),
      ...extra.map((img) => ({ raw: img.raw, url: null })),
    ],
    draft.title,
  );
  if (imageErrors.length) console.error("[blog draft] ảnh AI lỗi:", imageErrors);

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
      cover_image: coverUrl ?? "", // ảnh AI nền/trừu tượng; sếp replace ở form nếu muốn artwork thật
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

  return NextResponse.json({ post, imageErrors }, { status: 201 });
}
