// Sinh ảnh AI + đẩy lên R2 + ghi media_assets. Tách khỏi route để luồng dựng
// blog (api/admin/blog/topics) gọi thẳng, không phải tự fetch endpoint của mình.
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { uploadToR2 } from "@/lib/r2";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// DECISIONS 2026-07-31 + phụ lục 2026-08-01: TD Games bán dịch vụ artist vẽ tay
// → ảnh AI chỉ được dùng làm nền/trừu tượng/sơ đồ. Cấm character & art asset.
export const BANNED =
  /\b(character|nhân vật|portrait|chân dung|mascot|creature|quái|anime|chibi|waifu|hero|knight|warrior|girl|boy|man|woman|người|face|mặt)\b/i;
const STYLE_SUFFIX =
  ", abstract background artwork, no characters, no people, no creatures, no faces";

export const SIZES = new Set(["1024x1024", "1536x1024", "1024x1536"]);

export type AiImageResult = { url: string; key: string } | { error: string; status: number };

export async function generateAiImage(prompt: string, size = "1536x1024"): Promise<AiImageResult> {
  if (!prompt) return { error: "prompt is required", status: 400 };
  if (BANNED.test(prompt)) {
    return {
      error:
        "Ảnh AI chỉ dùng cho nền/trừu tượng/sơ đồ. Character và art asset phải do artist vẽ (DECISIONS 2026-07-31).",
      status: 400,
    };
  }

  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  if (!baseUrl || !apiKey) {
    return { error: "AI_BASE_URL / AI_API_KEY chưa cấu hình", status: 500 };
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl.replace(/\/+$/, "")}/images/generations`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.AI_IMAGE_MODEL || "gpt-image-2",
        prompt: prompt + STYLE_SUFFIX,
        n: 1,
        size: SIZES.has(size) ? size : "1536x1024",
      }),
      // generate mất ~30-60s; chặn ở 120s để một call treo không ăn hết
      // maxDuration 300s của route dựng bài (nó còn phải chờ 3 ảnh song song).
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    return { error: "Image API không gọi được (AI backend chết / timeout)", status: 502 };
  }

  if (!res.ok) {
    const detail = await res.text();
    return { error: `Image API ${res.status}: ${detail.slice(0, 300)}`, status: 502 };
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (typeof b64 !== "string") return { error: "Image API không trả b64_json", status: 502 };

  // Backend PHỚT LỜ `size`: xin 1536x1024 (ngang) vẫn trả 1122x1402 (dọc) —
  // cover blog dọc là vỡ layout. Crop về đúng tỉ lệ; `withoutEnlargement` để
  // không phóng to ảnh gốc cho mờ, chỉ cắt bớt.
  const [w, h] = (SIZES.has(size) ? size : "1536x1024").split("x").map(Number);
  let png = Buffer.from(b64, "base64");
  try {
    png = await sharp(png).resize(w, h, { fit: "cover", withoutEnlargement: true }).png().toBuffer();
  } catch (e) {
    console.error("[ai-image] crop lỗi, dùng ảnh gốc", e);
  }

  // uploadToR2 tự nén sang WebP + đổi key .png → .webp
  const now = new Date();
  const key = `ai/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.png`;
  const uploaded = await uploadToR2({ key, body: png, contentType: "image/png" });

  const { error } = await getSupabaseAdmin().from("media_assets").insert({
    kind: "image",
    source_type: "external",
    original_url: uploaded.url,
    current_url: uploaded.url,
    r2_key: uploaded.key,
    r2_url: uploaded.url,
    ai_prompt: prompt,
  });
  // ponytail: ảnh đã nằm trên R2 và dùng được — hỏng row bookkeeping thì log,
  // không vứt ảnh đi.
  if (error) console.error("[ai-image] media_assets insert failed", error.message, uploaded.url);

  return { url: uploaded.url, key: uploaded.key };
}
