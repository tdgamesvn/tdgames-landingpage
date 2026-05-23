// One-shot migration: rewrite every `https://cdn.tdgamestudio.com/landing/...`
// reference to `https://cdn.tdgamestudio.com/landing/...` so that the apex
// + www can be freed up to point at the VPS Next.js app while the assets
// keep being served by Cloudflare R2 on a dedicated subdomain.
//
// Touches:
//   1. Source files under src/, public/, scripts/ (.ts/.tsx/.js/.jsx/.json/.md/.mdx)
//   2. Supabase `media_assets` rows (current_url + r2_url)
//
// Usage:
//   node --env-file=.env.local scripts/migrate-to-cdn-subdomain.mjs           (dry-run)
//   node --env-file=.env.local scripts/migrate-to-cdn-subdomain.mjs --apply   (write)

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const APPLY = process.argv.includes("--apply");

const OLD = "https://cdn.tdgamestudio.com/landing/";
const NEW = "https://cdn.tdgamestudio.com/landing/";

const env = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_ACCESS_TOKEN,
};
const missing = Object.entries(env).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error("Missing env:", missing.join(", "));
  process.exit(1);
}

console.log(`Mode: ${APPLY ? "APPLY" : "dry-run"}`);
console.log(`Rewrite: ${OLD}  →  ${NEW}\n`);

// ──────────────────────────────────────────── 1. Files under src/, public/, scripts/

const TARGET_DIRS = [
  path.join(ROOT, "src"),
  path.join(ROOT, "public"),
  path.join(ROOT, "scripts"),
];
const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".mdx"]);

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const filesByCount = new Map();
let totalReplacements = 0;

for (const dir of TARGET_DIRS) {
  try { await fs.access(dir); } catch { continue; }
  for await (const file of walk(dir)) {
    if (!ALLOWED_EXT.has(path.extname(file).toLowerCase())) continue;
    let content;
    try { content = await fs.readFile(file, "utf8"); } catch { continue; }
    if (!content.includes(OLD)) continue;
    const split = content.split(OLD);
    const count = split.length - 1;
    filesByCount.set(path.relative(ROOT, file), count);
    totalReplacements += count;
    if (APPLY) await fs.writeFile(file, split.join(NEW), "utf8");
  }
}

console.log(`── Source files ──`);
console.log(`Files touched: ${filesByCount.size}`);
console.log(`Replacements : ${totalReplacements}`);
for (const [file, n] of [...filesByCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`  ${String(n).padStart(4)}  ${file}`);
}
if (filesByCount.size > 20) console.log(`  … +${filesByCount.size - 20} more`);

// ──────────────────────────────────────────── 2. Supabase media_assets

console.log(`\n── Supabase media_assets ──`);
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
const { data: rows, error } = await supabase
  .from("media_assets")
  .select("id, current_url, r2_url");
if (error) {
  console.error("DB query failed:", error.message);
  process.exit(1);
}

let dbTouched = 0;
let dbUnchanged = 0;
const sample = [];
for (const row of rows) {
  const newCurrent = row.current_url ? row.current_url.split(OLD).join(NEW) : row.current_url;
  const newR2 = row.r2_url ? row.r2_url.split(OLD).join(NEW) : row.r2_url;
  const changed = newCurrent !== row.current_url || newR2 !== row.r2_url;
  if (!changed) { dbUnchanged++; continue; }
  dbTouched++;
  if (sample.length < 3) sample.push({ id: row.id, was: row.current_url, now: newCurrent });
  if (APPLY) {
    const { error: updErr } = await supabase
      .from("media_assets")
      .update({ current_url: newCurrent, r2_url: newR2 })
      .eq("id", row.id);
    if (updErr) {
      console.error(`  ✗ ${row.id}: ${updErr.message}`);
      dbTouched--;
    }
  }
}
console.log(`Total rows : ${rows.length}`);
console.log(`Need rewrite: ${dbTouched}`);
console.log(`Unchanged   : ${dbUnchanged}`);
for (const s of sample) {
  console.log(`  ${s.id}`);
  console.log(`    was: ${s.was}`);
  console.log(`    now: ${s.now}`);
}

if (!APPLY) console.log(`\n(dry-run) pass --apply to write changes.`);
