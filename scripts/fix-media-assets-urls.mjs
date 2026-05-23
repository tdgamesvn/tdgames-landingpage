// Fix media_assets URLs in Supabase that point to the broken
// pub-{accountId}.r2.dev/{bucket}/{key} pattern produced by older migrate
// scripts. Rewrites them to use the configured R2_PUBLIC_BASE_URL (custom
// domain or correct r2.dev URL).
//
// Usage:
//   node --env-file=.env.local scripts/fix-media-assets-urls.mjs           (dry-run)
//   node --env-file=.env.local scripts/fix-media-assets-urls.mjs --apply   (execute)

import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");

const env = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_ACCESS_TOKEN,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
};
const missing = Object.entries(env).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error("Missing env:", missing.join(", "));
  process.exit(1);
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
const PUBLIC_BASE = env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");

// Patterns we want to rewrite. Order matters: longer (with bucket prefix) first.
const BAD_PATTERNS = [
  // pub-{accountId}.r2.dev/{bucket}/landing/...  (bug from old migrate scripts)
  new RegExp(
    `https?:\\/\\/pub-${env.R2_ACCOUNT_ID}\\.r2\\.dev\\/${env.R2_BUCKET}\\/landing\\/`,
    "g",
  ),
  // pub-{accountId}.r2.dev/landing/...           (bug — uses account id)
  new RegExp(`https?:\\/\\/pub-${env.R2_ACCOUNT_ID}\\.r2\\.dev\\/landing\\/`, "g"),
  // pub-<anything>.r2.dev/landing/...            (any other r2.dev — normalize to custom domain)
  /https?:\/\/pub-[a-z0-9]+\.r2\.dev\/landing\//g,
];

const REPLACEMENT = `${PUBLIC_BASE}/landing/`;

function rewrite(url) {
  if (!url) return url;
  let out = url;
  for (const re of BAD_PATTERNS) out = out.replace(re, REPLACEMENT);
  return out;
}

const { data: rows, error } = await supabase
  .from("media_assets")
  .select("id, kind, current_url, r2_url, original_url");
if (error) {
  console.error("Failed to load media_assets:", error.message);
  process.exit(1);
}

let touched = 0;
let unchanged = 0;
const sample = [];

for (const row of rows) {
  const newCurrent = rewrite(row.current_url);
  const newR2 = rewrite(row.r2_url);
  const changed = newCurrent !== row.current_url || newR2 !== row.r2_url;
  if (!changed) {
    unchanged++;
    continue;
  }
  touched++;
  if (sample.length < 5) {
    sample.push({ id: row.id, was: row.current_url, now: newCurrent });
  }
  if (APPLY) {
    const { error: updErr } = await supabase
      .from("media_assets")
      .update({ current_url: newCurrent, r2_url: newR2 })
      .eq("id", row.id);
    if (updErr) {
      console.error(`✗ ${row.id}: ${updErr.message}`);
      touched--;
    }
  }
}

console.log(`\nTotal rows: ${rows.length}`);
console.log(`Need rewrite: ${touched}`);
console.log(`Unchanged:    ${unchanged}`);
console.log("\nSample:");
for (const s of sample) {
  console.log(`  ${s.id}`);
  console.log(`    was: ${s.was}`);
  console.log(`    now: ${s.now}`);
}
if (!APPLY) {
  console.log("\n(dry-run) Pass --apply to write changes.");
}
