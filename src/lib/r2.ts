import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

// ponytail: tham số tune thực tế từ bot tdgames-discord. gif/svg cố ý không match
// (mất animation / vector) — sharp là ĐƯỜNG LÙI khi bot chết, xem compressViaBot.
const COMPRESSIBLE = /^image\/(jpeg|png|webp|avif|tiff)$/;
const COMPRESS_MIN_BYTES = 400 * 1024;
const COMPRESS_MAX_WIDTH = 2400;

// Bot tdgames-discord (Mac, tailscale) có sẵn cwebp/gif2webp/ffmpeg — nén cả video
// và gif động, thứ sharp trong app không làm được. svg loại ra (vector).
const BOT_COMPRESSIBLE = /^(image\/(?!svg)|video\/)/;
const BOT_TIMEOUT_MS = 300_000;

/**
 * Nhờ bot nén. Trả null = không dùng được (chưa cấu hình / bot chết / nén không
 * nhỏ hơn) → caller tự lo đường lùi. Không bao giờ throw: bot ngủ không được
 * phép làm hỏng upload.
 * ponytail: HTTP thẳng qua tailscale thay vì đi vòng channel compressor-ai —
 * Discord giới hạn 10MB cả 2 chiều, video studio không lọt.
 */
async function compressViaBot(body: Buffer, contentType: string) {
  const base = process.env.COMPRESSOR_URL;
  if (!base || !BOT_COMPRESSIBLE.test(contentType) || body.length <= COMPRESS_MIN_BYTES) {
    return null;
  }

  try {
    const resp = await fetch(`${base.replace(/\/+$/, "")}/compress`, {
      method: "POST",
      headers: { "content-type": contentType },
      body: new Uint8Array(body),
      signal: AbortSignal.timeout(BOT_TIMEOUT_MS),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const out = Buffer.from(await resp.arrayBuffer());
    const outType = resp.headers.get("content-type") ?? "";
    if (!out.length || out.length >= body.length || !BOT_COMPRESSIBLE.test(outType)) return null;

    return { body: out, contentType: outType, ext: outType.startsWith("video/") ? ".mp4" : ".webp" };
  } catch (err) {
    console.warn("[r2] compressor bot không phản hồi, dùng đường lùi:", err);
    return null;
  }
}

function getR2Config() {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const accountId = process.env.R2_ACCOUNT_ID;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !accountId) {
    throw new Error("R2 env vars are required");
  }

  return { endpoint, bucket, accessKeyId, secretAccessKey, accountId };
}

function createR2Client() {
  const { endpoint, accessKeyId, secretAccessKey } = getR2Config();
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function r2PublicUrl(key: string) {
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "R2_PUBLIC_BASE_URL is required (e.g. https://tdgamestudio.com or https://pub-<id>.r2.dev)",
    );
  }
  const trimmed = baseUrl.replace(/\/+$/, "");
  return `${trimmed}/${cleanKey}`;
}

export async function uploadToR2(params: {
  key: string;
  body: Buffer;
  contentType: string;
  /** true = giữ nguyên bytes + tên file (spine atlas: .atlas tham chiếu cứng tên .png) */
  skipCompress?: boolean;
}) {
  let { key, body, contentType } = params;

  const bot = params.skipCompress ? null : await compressViaBot(body, contentType);
  if (bot) {
    body = bot.body;
    contentType = bot.contentType;
    key = key.replace(/\.[^./]+$/, "") + bot.ext;
  } else if (
    !params.skipCompress &&
    COMPRESSIBLE.test(contentType) &&
    body.length > COMPRESS_MIN_BYTES
  ) {
    const webp = await sharp(body)
      .rotate()
      .resize({ width: COMPRESS_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer();
    if (webp.length < body.length) {
      body = webp;
      contentType = "image/webp";
      key = key.replace(/\.[^./]+$/, "") + ".webp";
    }
  }

  const { bucket } = getR2Config();
  const r2Client = createR2Client();

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return {
    key,
    url: r2PublicUrl(key),
    size: body.length,
    contentType,
  };
}
