/**
 * migrate-hardcoded-behance.mjs
 *
 * Finds hardcoded "https://mir-s3-cdn-cf.behance.net/project_modules/..." strings
 * in portfolio project-data.ts files, downloads from Behance, uploads to R2,
 * inserts mapping to Supabase, then replaces URLs in source.
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-hardcoded-behance.mjs           # dry-run
 *   node --env-file=.env.local scripts/migrate-hardcoded-behance.mjs --apply   # migrate + replace
 */

import fs from "node:fs/promises";
import crypto from "node:crypto";
import { globSync } from "glob";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const APPLY = process.argv.includes("--apply");
const DELAY_MS = 400;

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

const R2_PUBLIC_BASE = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
if (!R2_PUBLIC_BASE) {
  throw new Error("R2_PUBLIC_BASE_URL is required");
}

// ── 1. Collect all hardcoded Behance project_modules URLs from source ─────────
const files = globSync("src/app/portfolio/*/project-data.ts", { nodir: true });
const urlToFiles = new Map(); // url → Set of file paths

for (const file of files) {
  const src = await fs.readFile(file, "utf8");
  const matches = src.matchAll(/"(https:\/\/mir-s3-cdn-cf\.behance\.net\/project_modules\/[^"]+)"/g);
  for (const [, url] of matches) {
    if (!urlToFiles.has(url)) urlToFiles.set(url, new Set());
    urlToFiles.get(url).add(file);
  }
}

const allUrls = [...urlToFiles.keys()];
console.log(`\n🔍 Found ${allUrls.length} unique hardcoded Behance URLs in ${files.filter(f => {
  const s = urlToFiles.values(); return true;
}).length} files\n`);

// ── 2. Check which are already in Supabase ────────────────────────────────────
const { data: existing, error: dbErr } = await supabase
  .from("media_assets")
  .select("original_url, r2_url")
  .like("original_url", "%mir-s3-cdn-cf%");

if (dbErr) {
  console.error("Supabase error:", dbErr.message);
  process.exit(1);
}

const dbMap = new Map((existing || []).map(a => [a.original_url, a.r2_url]));
console.log(`📦 Already in DB: ${dbMap.size} Behance mappings`);

const missing = allUrls.filter(u => !dbMap.has(u));
const alreadyMapped = allUrls.filter(u => dbMap.has(u));
console.log(`✅ Already mapped: ${alreadyMapped.length}`);
console.log(`⬇️  Need migration: ${missing.length}\n`);

if (!APPLY) {
  console.log("URLs to migrate (first 10):");
  missing.slice(0, 10).forEach(u => console.log(" ", u));
  if (missing.length > 10) console.log(`  ... and ${missing.length - 10} more`);

  // Also preview which files would be updated
  const filesToUpdate = new Set();
  for (const url of allUrls) {
    if (urlToFiles.has(url)) for (const f of urlToFiles.get(url)) filesToUpdate.add(f);
  }
  console.log(`\n📝 Files to update: ${filesToUpdate.size}`);
  for (const f of filesToUpdate) {
    const r2Count = [...urlToFiles.keys()].filter(u => dbMap.has(u) && urlToFiles.get(u).has(f)).length;
    const migrateCount = [...urlToFiles.keys()].filter(u => !dbMap.has(u) && urlToFiles.get(u).has(f)).length;
    console.log(`   ${f.replace("src/app/portfolio/", "")} — ${r2Count} already R2, ${migrateCount} to migrate`);
  }

  console.log(`\n▶  Re-run with --apply to migrate and replace URLs`);
  process.exit(0);
}

// ── 3. Migrate missing: download → R2 → Supabase ─────────────────────────────
let ok = 0, fail = 0;

for (const [i, url] of missing.entries()) {
  process.stdout.write(`[${i + 1}/${missing.length}] `);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "image/*,*/*" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) throw new Error("Empty response");

    const extMatch = url.match(/\.(gif|png|jpg|jpeg|webp)(\?|$)/i);
    const ext = (extMatch?.[1] ?? "png").toLowerCase();
    const hash = crypto.createHash("md5").update(buf).digest("hex").slice(0, 16);
    const key = `landing/behance/${hash}.${ext}`;
    const r2Url = `${R2_PUBLIC_BASE}/${key}`;

    const ctMap = { gif: "image/gif", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: buf,
      ContentType: ctMap[ext] ?? "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    }));

    await supabase.from("media_assets").upsert({
      kind: ext === "gif" ? "gif" : "image",
      source_type: "local_public",
      original_url: url,
      current_url: r2Url,
      r2_key: key,
      r2_url: r2Url,
      status: "active",
    }, { onConflict: "original_url", ignoreDuplicates: false });

    dbMap.set(url, r2Url);
    console.log(`✓ ${url.split("/").slice(-1)[0]} → ${r2Url.split("/").slice(-1)[0]}`);
    ok++;
  } catch (e) {
    console.log(`✗ FAILED: ${url.split("/").slice(-1)[0]} — ${e.message}`);
    fail++;
  }

  if (i < missing.length - 1) await new Promise(r => setTimeout(r, DELAY_MS));
}

console.log(`\n${"─".repeat(55)}`);
console.log(`✅ Migrated: ${ok}  ❌ Failed: ${fail}`);

// ── 4. Replace URLs in source files ──────────────────────────────────────────
console.log(`\n📝 Replacing URLs in source files...\n`);

let filesUpdated = 0;
let urlsReplaced = 0;

for (const file of files) {
  let src = await fs.readFile(file, "utf8");
  if (!src.includes("mir-s3-cdn-cf")) continue;

  let next = src;
  let count = 0;

  for (const [behanceUrl, r2Url] of dbMap) {
    if (!next.includes(behanceUrl)) continue;
    // Replace all occurrences (both in string literals and backtick templates)
    next = next.replaceAll(`"${behanceUrl}"`, `"${r2Url}"`);
    next = next.replaceAll(`\`${behanceUrl}\``, `"${r2Url}"`);
    if (next !== src || count > 0) count++;
  }

  // Count actual replacements
  const replacedCount = (src.match(/mir-s3-cdn-cf/g) || []).length - (next.match(/mir-s3-cdn-cf/g) || []).length;

  if (next !== src) {
    await fs.writeFile(file, next, "utf8");
    filesUpdated++;
    urlsReplaced += replacedCount;
    const label = file.replace("src/app/portfolio/", "").replace("/project-data.ts", "");
    console.log(`  ✏️  ${label} — ${replacedCount} URLs replaced`);
  }
}

console.log(`\n✅ Files updated: ${filesUpdated}, URLs replaced: ${urlsReplaced}`);

// ── 5. Summary ────────────────────────────────────────────────────────────────
const remaining = [];
for (const file of files) {
  const s = await fs.readFile(file, "utf8");
  const count = (s.match(/mir-s3-cdn-cf\.behance\.net\/project_modules/g) || []).length;
  if (count > 0) remaining.push(`${file.replace("src/app/portfolio/", "")}: ${count} remaining`);
}

if (remaining.length) {
  console.log(`\n⚠️  Still have Behance URLs (failed downloads):`);
  remaining.forEach(r => console.log("  ", r));
} else {
  console.log(`\n🎉 All project_modules Behance URLs migrated!`);
}
