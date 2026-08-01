import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { uploadToR2 } from "@/lib/r2";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// DECISIONS 2026-07-31: TD Games bán dịch vụ artist vẽ tay → ảnh AI chỉ được
// dùng làm nền/trừu tượng/sơ đồ khái niệm. Cấm character & art asset.
const BANNED =
  /\b(character|nhân vật|portrait|chân dung|mascot|creature|quái|anime|chibi|waifu|hero|knight|warrior|girl|boy|man|woman|người|face|mặt)\b/i;
const STYLE_SUFFIX =
  ", abstract background artwork, no characters, no people, no creatures, no faces";

const SIZES = new Set(["1024x1024", "1536x1024", "1024x1536"]);

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const size = SIZES.has(body.size) ? body.size : "1536x1024";

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }
  if (BANNED.test(prompt)) {
    return NextResponse.json(
      {
        error:
          "Ảnh AI chỉ dùng cho nền/trừu tượng/sơ đồ. Character và art asset phải do artist vẽ (DECISIONS 2026-07-31).",
      },
      { status: 400 },
    );
  }

  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "AI_BASE_URL / AI_API_KEY chưa cấu hình" }, { status: 500 });
  }

  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/images/generations`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.AI_IMAGE_MODEL || "gpt-image-2",
      prompt: prompt + STYLE_SUFFIX,
      n: 1,
      size,
    }),
    // ponytail: generate mất ~30-60s, để Next tự timeout mặc định
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json(
      { error: `Image API ${res.status}: ${detail.slice(0, 300)}` },
      { status: 502 },
    );
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (typeof b64 !== "string") {
    return NextResponse.json({ error: "Image API không trả b64_json" }, { status: 502 });
  }

  // gpt-image-2 trả PNG ~2MB → uploadToR2 tự nén sang WebP + đổi key .png → .webp
  const now = new Date();
  const key = `ai/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.png`;
  const uploaded = await uploadToR2({
    key,
    body: Buffer.from(b64, "base64"),
    contentType: "image/png",
  });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("media_assets").insert({
    kind: "image",
    source_type: "external",
    original_url: uploaded.url,
    current_url: uploaded.url,
    r2_key: uploaded.key,
    r2_url: uploaded.url,
    ai_prompt: prompt,
  });
  if (error) {
    return NextResponse.json({ error: `Đã lên R2 nhưng lưu DB lỗi: ${error.message}`, url: uploaded.url }, { status: 500 });
  }

  return NextResponse.json({ url: uploaded.url, key: uploaded.key });
}
