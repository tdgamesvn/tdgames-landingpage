/**
 * migrate-missing-behance.mjs
 *
 * Scans portfolio project-data.ts files for template-literal Behance URLs
 * that are NOT yet in Supabase, downloads them and uploads to R2.
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-missing-behance.mjs           # dry-run
 *   node --env-file=.env.local scripts/migrate-missing-behance.mjs --apply   # real run
 */

import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { globSync } from "glob";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const APPLY = process.argv.includes("--apply");
const DELAY_MS = 300;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ACCESS_TOKEN
);
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// ── 1. Load existing mappings to know what's already done ─────────────────────
const { data: existing } = await supabase
  .from("media_assets")
  .select("original_url")
  .like("original_url", "%mir-s3-cdn-cf%");

const done = new Set((existing || []).map((a) => a.original_url));
console.log(`\n📦 Already migrated: ${done.size} Behance assets\n`);

// ── 2. Extract all template-literal Behance URLs from source files ─────────────
const files = globSync("src/app/portfolio/*/project-data.ts", { nodir: true });
const missing = new Set();

for (const file of files) {
  const src = await fs.readFile(file, "utf8");
  // Parse const declarations
  const consts = new Map();
  for (const line of src.split("\n")) {
    const m = line.match(/^const\s+(\w+)\s*=\s*"(https:\/\/mir-s3-cdn-cf[^"]+)"/);
    if (m) consts.set(m[1], m[2]);
  }
  // Find template literals and expand
  for (const [name, base] of consts) {
    const pattern = new RegExp(`\`\\$\\{${name}\\}([^\`"']+)\``, "g");
    let match;
    while ((match = pattern.exec(src)) !== null) {
      const fullUrl = base + match[1];
      if (!done.has(fullUrl)) missing.add(fullUrl);
    }
  }
}

console.log(`🔍 Found ${missing.size} Behance URLs not yet in DB\n`);
if (missing.size === 0) {
  console.log("✅ Nothing to do!");
  process.exit(0);
}

if (!APPLY) {
  console.log("URLs to migrate (first 10):");
  [...missing].slice(0, 10).forEach((u) => console.log(" ", u));
  if (missing.size > 10) console.log(`  ... and ${missing.size - 10} more`);
  console.log("\n▶  Re-run with --apply to migrate");
  process.exit(0);
}

// ── 3. Download → upload → insert for each missing URL ────────────────────────
let ok = 0, fail = 0;

const r2PublicBase = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
if (!r2PublicBase) {
  throw new Error("R2_PUBLIC_BASE_URL is required");
}

for (const [i, url] of [...missing].entries()) {
  process.stdout.write(`[${i + 1}/${missing.size}] `);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buf = Buffer.from(await res.arrayBuffer());
    const ext = (url.match(/\.(gif|png|jpg|jpeg|webp)(\?|$)/i)?.[1] ?? "png").toLowerCase();
    const hash = crypto.createHash("md5").update(buf).digest("hex").slice(0, 16);
    const key = `landing/behance/${hash}.${ext}`;
    const r2Url = `${r2PublicBase}/${key}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: buf,
      ContentType: res.headers.get("content-type") ?? `image/${ext}`,
    }));

    await supabase.from("media_assets").insert({
      kind: ext === "gif" ? "gif" : "image",
      source_type: "local_public",
      original_url: url,
      current_url: r2Url,
      r2_key: key,
      r2_url: r2Url,
      status: "active",
    });

    console.log(`✓ ${url.split("/").slice(-1)[0]}\n   → ${r2Url}`);
    ok++;
  } catch (e) {
    console.log(`✗ FAILED: ${url}\n  ${e.message}`);
    fail++;
  }

  if (i < missing.size - 1) await new Promise((r) => setTimeout(r, DELAY_MS));
}

console.log(`\n${"─".repeat(50)}`);
console.log(`✅ Migrated : ${ok}`);
console.log(`❌ Failed   : ${fail}`);
console.log(`\n▶  Next: node --env-file=.env.local scripts/fix-template-behance-urls.mjs --apply`);
