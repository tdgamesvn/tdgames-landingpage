/**
 * fix-template-behance-urls.mjs
 *
 * Finds portfolio project-data.ts files that use Behance CDN base-URL consts
 * (e.g. `const MW = "https://mir-s3-cdn-cf.behance.net/..."`)
 * and expands every template-literal reference to the full URL, then
 * replaces it with the migrated R2 URL from Supabase.
 *
 * Usage:
 *   node --env-file=.env.local scripts/fix-template-behance-urls.mjs           # dry-run
 *   node --env-file=.env.local scripts/fix-template-behance-urls.mjs --apply   # write files
 */

import fs from "node:fs/promises";
import { globSync } from "glob";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ACCESS_TOKEN
);

// ── 1. Load mapping original_url → r2_url from DB ────────────────────────────
const { data: assets, error } = await supabase
  .from("media_assets")
  .select("original_url, r2_url")
  .eq("source_type", "local_public")
  .like("original_url", "%mir-s3-cdn-cf%");

if (error) throw error;

const mapping = new Map(assets.map((a) => [a.original_url, a.r2_url]));
console.log(`\n📦 Loaded ${mapping.size} Behance→R2 mappings from DB\n`);

// ── 2. Find files with Behance const declarations ────────────────────────────
const files = globSync("src/app/portfolio/*/project-data.ts", { nodir: true });
const targets = [];
for (const f of files) {
  const src = await fs.readFile(f, "utf8");
  if (src.includes("mir-s3-cdn-cf")) targets.push(f);
}
console.log(`🔍 ${targets.length} files with Behance const URLs\n`);

let totalReplaced = 0;
let totalMissing = 0;

for (const file of targets) {
  let src = await fs.readFile(file, "utf8");
  const lines = src.split("\n");

  // Parse const declarations: const FOO = "https://mir-s3-cdn-cf..."
  const consts = new Map(); // name → base URL
  for (const line of lines) {
    const m = line.match(/^const\s+(\w+)\s*=\s*"(https:\/\/mir-s3-cdn-cf[^"]+)"/);
    if (m) consts.set(m[1], m[2]);
  }

  if (consts.size === 0) {
    console.log(`⏭  ${file} — no consts found, skipping`);
    continue;
  }

  let replaced = 0;
  let missing = 0;
  let next = src;

  // For each const, find template literals: `${CONSTNAME}/rest/of/path`
  for (const [name, base] of consts) {
    // Matches `${NAME}/anything` inside backtick strings
    const pattern = new RegExp(`\`\\$\\{${name}\\}([^\`"']+)\``, "g");
    next = next.replace(pattern, (_, suffix) => {
      const fullUrl = base + suffix;
      const r2 = mapping.get(fullUrl);
      if (r2) {
        replaced++;
        return `"${r2}"`;
      } else {
        missing++;
        console.warn(`  ⚠️  No mapping for: ${fullUrl}`);
        return `"${fullUrl}"`; // expand but keep Behance URL (needs manual fix)
      }
    });
  }

  // Remove now-unused const lines
  const usedConsts = new Set(
    [...consts.keys()].filter((name) => {
      // check if still referenced after replacement
      const pattern = new RegExp(`\\$\\{${name}\\}`);
      return pattern.test(next);
    })
  );

  if (replaced > 0) {
    // Remove const lines that are no longer needed
    next = next
      .split("\n")
      .filter((line) => {
        const m = line.match(/^const\s+(\w+)\s*=\s*"(https:\/\/mir-s3-cdn-cf[^"]+)"/);
        if (!m) return true;
        return usedConsts.has(m[1]); // keep if still used
      })
      .join("\n");
  }

  const changed = next !== src;
  console.log(
    `${changed ? "✏️ " : "✅"} ${file.replace("src/app/portfolio/", "")}` +
      ` — ${replaced} replaced, ${missing} missing`
  );

  if (APPLY && changed) {
    await fs.writeFile(file, next, "utf8");
  }

  totalReplaced += replaced;
  totalMissing += missing;
}

console.log(`\n${"─".repeat(50)}`);
console.log(`✅ Replaced : ${totalReplaced}`);
console.log(`⚠️  Missing  : ${totalMissing}`);
if (!APPLY) console.log(`\n▶  Re-run with --apply to write changes`);
