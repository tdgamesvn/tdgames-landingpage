// Migrate portfolio cover images from Behance CDN to R2 + custom domain.
// Usage:
//   node --env-file=.env.local scripts/migrate-portfolio-covers.mjs           (dry-run)
//   node --env-file=.env.local scripts/migrate-portfolio-covers.mjs --apply   (execute)

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";

const APPLY = process.argv.includes("--apply");

const env = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_ACCESS_TOKEN,
  R2_ENDPOINT: process.env.R2_ENDPOINT,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
};
const missing = Object.entries(env).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error("Missing env:", missing.join(", "));
  process.exit(1);
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const PUBLIC_BASE = env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");

function extFromUrl(url) {
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return ext || ".jpg";
}

function contentTypeFromExt(ext) {
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

const { data: rows, error } = await supabase
  .from("projects")
  .select("id, title, slug, image")
  .like("image", "%behance.net%");

if (error) {
  console.error("Supabase fetch failed:", error.message);
  process.exit(1);
}

console.log(`▶  Found ${rows.length} project(s) with Behance image.\n`);
if (!APPLY) {
  console.log("(dry-run — pass --apply to execute)\n");
}

let ok = 0;
let fail = 0;

for (const [i, row] of rows.entries()) {
  const idx = `[${i + 1}/${rows.length}]`;
  console.log(`${idx} ${row.title}`);
  console.log(`        from : ${row.image}`);
  const ext = extFromUrl(row.image);
  const key = `landing/portfolio-covers/${row.slug}${ext}`;
  const newUrl = `${PUBLIC_BASE}/${key}`;
  console.log(`        to   : ${newUrl}`);

  if (!APPLY) {
    console.log("");
    continue;
  }

  try {
    const res = await fetch(row.image);
    if (!res.ok) throw new Error(`download ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await s3.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: buf,
        ContentType: contentTypeFromExt(ext),
      }),
    );
    const { error: updErr } = await supabase
      .from("projects")
      .update({ image: newUrl })
      .eq("id", row.id);
    if (updErr) throw new Error(`db update: ${updErr.message}`);
    console.log(`        ✓ uploaded ${buf.length} bytes & DB updated\n`);
    ok++;
  } catch (e) {
    console.log(`        ✗ ${e.message}\n`);
    fail++;
  }
}

if (APPLY) {
  console.log(`Done. ok=${ok} fail=${fail}`);
}
