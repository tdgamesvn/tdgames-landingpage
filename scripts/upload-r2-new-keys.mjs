// Đẩy file tĩnh (ảnh OG, poster, video nén lại) lên R2 với KEY MỚI — không bao giờ ghi đè:
// key đã tồn tại → bỏ qua và báo lỗi (CDN cache immutable, ghi đè cùng key không ăn ngay
// mà còn làm lệch bản đang cache). Muốn thay file thì đặt key mới (v2, v3…) rồi trỏ code sang.
//
//   node --env-file=.env.local scripts/upload-r2-new-keys.mjs <file>=<key> ...           # dry-run
//   node --env-file=.env.local scripts/upload-r2-new-keys.mjs <file>=<key> ... --apply   # upload
//
// Cache-Control: public, max-age=31536000, immutable. Content-Type theo đuôi file.

import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const pairs = args.filter((a) => a.includes("=")).map((a) => {
  const i = a.indexOf("=");
  return [a.slice(0, i), a.slice(i + 1).replace(/^\/+/, "")];
});
if (!pairs.length) throw new Error("Thiếu <file>=<key>");

const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm" };

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
    return true;
  } catch (e) {
    if (e?.$metadata?.httpStatusCode === 404 || e?.name === "NotFound") return false;
    throw e;
  }
}

let failed = 0;
for (const [file, key] of pairs) {
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) throw new Error(`Không rõ Content-Type: ${file}`);
  const body = await readFile(file);
  if (await exists(key)) {
    console.error(`✗ ${key} đã tồn tại — KHÔNG ghi đè, đặt key mới`);
    failed++;
    continue;
  }
  console.log(`${APPLY ? "↑" : "·"} ${key}  ${body.length} B  ${type}`);
  if (!APPLY) continue;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}
if (failed) process.exitCode = 1;
