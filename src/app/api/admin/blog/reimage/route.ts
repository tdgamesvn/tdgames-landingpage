import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { extractJson, findMarkdownImages, IMAGE_RULES, COVER_RULES } from "@/lib/blog-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST — soạn lại prompt ảnh cho một bài đã có, KHÔNG render.
 *
 * Cố tình tách làm 2 bước (route này trả prompt, client tự gọi
 * /api/admin/generate-image cho từng ảnh): render 4 ảnh trong một request mất
 * 3-4 phút, mà Cloudflare cắt kết nối ở 100s. Tách ra thì mỗi request ~30-60s,
 * không cần polling, lại hiện được tiến độ "đang render 2/4".
 */
export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? "gpt-5.4-mini";
  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "AI_BASE_URL / AI_API_KEY not configured" }, { status: 500 });
  }

  const { title, excerpt, content_md, cover = true } = await req.json();
  if (!content_md) return NextResponse.json({ error: "content_md is required" }, { status: 400 });

  const existing = findMarkdownImages(String(content_md));

  const system = `You are the art director of TD Games Studio — a Vietnam-based studio doing 2D game art, Spine animation and VFX outsourcing.

A blog post already exists. Your job is to write BETTER image prompts for it. Read the post, look at where each image sits, and brief an illustrator for that exact spot.

${IMAGE_RULES}

${COVER_RULES}

The post currently has ${existing.length} in-post image slot(s), listed below in order with their current alt text and the markdown around them. Write one fresh prompt per slot, in the SAME order. Also write a new alt text (max 8 words, plain description of what the image shows).

Reply with ONLY a JSON object, no markdown fence, no prose:
{"cover_prompt": "prompt for the cover image, same style as the rest, subject none of the in-post images use", "images": [{"alt": "...", "prompt": "..."}]}
The "images" array MUST have exactly ${existing.length} item(s).`;

  // Đưa cả bài + vị trí từng ảnh để AI biết ảnh đó minh hoạ đoạn nào.
  const userPrompt = JSON.stringify({
    title,
    excerpt,
    content_md,
    slots: existing.map((img, i) => ({ index: i, current_alt: img.alt })),
  });

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8, // cao hơn lúc dựng bài: sếp bấm render lại là đang muốn khác đi
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch {
    return NextResponse.json({ error: "AI backend unreachable" }, { status: 502 });
  }
  if (!res.ok) return NextResponse.json({ error: `AI backend error ${res.status}` }, { status: 502 });

  const raw: string = (await res.json())?.choices?.[0]?.message?.content ?? "";
  try {
    const p = extractJson(raw) as { cover_prompt?: string; images?: { alt?: string; prompt?: string }[] };
    // Ghép prompt mới với `raw` markdown cũ ngay tại server — client chỉ việc
    // replace chuỗi, không phải tự dò lại vị trí ảnh và lệch index.
    const images = existing.map((img, i) => ({
      raw: img.raw,
      alt: String(p.images?.[i]?.alt ?? img.alt ?? "").trim(),
      prompt: String(p.images?.[i]?.prompt ?? "").trim(),
    }));
    return NextResponse.json({
      cover_prompt: cover ? String(p.cover_prompt ?? "").trim() : "",
      images: images.filter((x) => x.prompt),
    });
  } catch {
    return NextResponse.json(
      { error: "AI trả output không đọc được", raw: raw.slice(0, 500) },
      { status: 502 },
    );
  }
}
