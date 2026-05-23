/**
 * migrate-behance-to-r2.mjs
 *
 * Downloads external (Behance) media assets and uploads them to Cloudflare R2.
 * Vimeo / YouTube are intentionally skipped — they stay on their platforms.
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-behance-to-r2.mjs            # dry-run
 *   node --env-file=.env.local scripts/migrate-behance-to-r2.mjs --apply    # real run
 *
 * After --apply succeeds, run the URL-replace script to patch source files:
 *   ADMIN_KEY=<secret> node scripts/replace-media-urls.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import path from "node:path";

// ─── Config ──────────────────────────────────────────────────────────────────

const APPLY = process.argv.includes("--apply");

/** Hosts to skip — videos stay on their platform */
const SKIP_HOSTS = [
  "player.vimeo.com",
  "vimeo.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "i.ytimg.com",
  "vumbnail.com",
];

/** ms to wait between downloads (be polite to Behance) */
const DELAY_MS = 300;

// ─── Env validation ──────────────────────────────────────────────────────────

const env = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_ACCESS_TOKEN,
  R2_ENDPOINT: process.env.R2_ENDPOINT,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
};

const missing = Object.entries(env)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length) {
  console.error(`❌ Missing env vars: ${missing.join(", ")}`);
  console.error("   Run: node --env-file=.env.local scripts/migrate-behance-to-r2.mjs");
  process.exit(1);
}

// ─── Clients ─────────────────────────────────────────────────────────────────

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

const r2 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function r2PublicUrl(key) {
  return `https://pub-${env.R2_ACCOUNT_ID}.r2.dev/${key}`;
}

function extFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    // Some Behance URLs have no extension but are images
    return ext || ".jpg";
  } catch {
    return ".jpg";
  }
}

function contentTypeFromExt(ext) {
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };
  return map[ext] ?? "application/octet-stream";
}

function shouldSkip(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SKIP_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return true;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`\n🚀 Behance → R2 migration (${APPLY ? "APPLY" : "DRY-RUN"})\n`);

// 1. Fetch all un-migrated external assets
const { data: assets, error: fetchError } = await supabase
  .from("media_assets")
  .select("id, original_url, kind")
  .eq("source_type", "external")
  .is("r2_key", null)
  .order("created_at", { ascending: true });

if (fetchError) {
  console.error("❌ Supabase fetch error:", fetchError.message);
  process.exit(1);
}

const toMigrate = (assets ?? []).filter((a) => !shouldSkip(a.original_url));
const skipped = (assets ?? []).length - toMigrate.length;

console.log(`📋 External assets total : ${(assets ?? []).length}`);
console.log(`⏭️  Skipped (Vimeo/YT)   : ${skipped}`);
console.log(`🎯 To migrate (Behance)  : ${toMigrate.length}\n`);

if (toMigrate.length === 0) {
  console.log("✅ Nothing to migrate.");
  process.exit(0);
}

// 2. Process each asset
let migrated = 0;
let failed = 0;
const failures = [];

for (let i = 0; i < toMigrate.length; i++) {
  const asset = toMigrate[i];
  const url = asset.original_url;
  const ext = extFromUrl(url);
  const hash = crypto.createHash("md5").update(url).digest("hex").slice(0, 16);
  const r2Key = `landing/behance/${hash}${ext}`;
  const r2Url = r2PublicUrl(r2Key);

  const prefix = `[${i + 1}/${toMigrate.length}]`;

  if (!APPLY) {
    console.log(`${prefix} DRY-RUN: ${url.slice(0, 80)}...`);
    console.log(`           → ${r2Url}`);
    migrated++;
    continue;
  }

  try {
    // Download
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TDGamesBot/1.0; +https://tdgamestudio.com)",
        "Accept": "image/*,*/*",
      },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0) throw new Error("Empty response body");

    // Upload to R2
    await r2.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: r2Key,
        Body: buffer,
        ContentType: contentTypeFromExt(ext),
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    // Update Supabase
    const { error: updateError } = await supabase
      .from("media_assets")
      .update({
        r2_key: r2Key,
        r2_url: r2Url,
        current_url: r2Url,
        source_type: "local_public",
        updated_at: new Date().toISOString(),
      })
      .eq("id", asset.id);

    if (updateError) throw new Error(`DB update: ${updateError.message}`);

    console.log(`${prefix} ✓ ${url.slice(0, 70)}`);
    console.log(`${"".padStart(prefix.length + 1)} → ${r2Url}`);
    migrated++;

    await sleep(DELAY_MS);
  } catch (err) {
    console.error(`${prefix} ✗ ${url.slice(0, 70)}`);
    console.error(`${"".padStart(prefix.length + 1)}   Error: ${err.message}`);
    failures.push({ url, error: err.message });
    failed++;
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log("\n─────────────────────────────────────────");
console.log(`✅ Migrated : ${migrated}`);
console.log(`❌ Failed   : ${failed}`);

if (failures.length > 0) {
  console.log("\nFailed URLs:");
  for (const f of failures) {
    console.log(`  - ${f.url}`);
    console.log(`    ${f.error}`);
  }
}

if (APPLY && migrated > 0) {
  console.log(`
─────────────────────────────────────────
📝 Next step — replace URLs in source code:

   ADMIN_KEY=<your-admin-secret> \\
   MAPPING_API_URL=http://localhost:3000/api/admin/media/mapping \\
   node scripts/replace-media-urls.mjs --apply

   (Dev server must be running: npm run dev)
`);
}

if (!APPLY) {
  console.log(`
─────────────────────────────────────────
👆 Dry-run complete. To actually migrate:

   node --env-file=.env.local scripts/migrate-behance-to-r2.mjs --apply
`);
}
