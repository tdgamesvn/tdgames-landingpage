// After convert-gifs-to-mp4.mjs has produced .gif-to-mp4-map.json, this script
// rewrites every reference to those .gif URLs in `src/` and `public/site.json`
// (etc.) to the corresponding .mp4 URL.
//
// Usage:
//   node scripts/rewrite-gif-refs-to-mp4.mjs              (dry-run)
//   node scripts/rewrite-gif-refs-to-mp4.mjs --apply
//
// Safe — only replaces exact full URLs found in the mapping file.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const APPLY = process.argv.includes("--apply");

const MAP_PATH = path.join(ROOT, "scripts", ".gif-to-mp4-map.json");
const TARGET_DIRS = [
  path.join(ROOT, "src"),
  path.join(ROOT, "public"),
];
const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".mdx", ".md"]);

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let mapping;
try {
  mapping = JSON.parse(await fs.readFile(MAP_PATH, "utf8"));
} catch (e) {
  console.error(`Cannot read ${MAP_PATH}. Run convert-gifs-to-mp4.mjs first.`);
  console.error(e.message);
  process.exit(1);
}
const entries = Object.entries(mapping);
if (!entries.length) {
  console.log("Mapping file is empty — nothing to rewrite.");
  process.exit(0);
}
console.log(`Mode: ${APPLY ? "APPLY" : "dry-run"}  | mappings: ${entries.length}`);

const totalsByFile = new Map();
let totalReplacements = 0;

for (const dir of TARGET_DIRS) {
  try {
    await fs.access(dir);
  } catch {
    continue;
  }
  for await (const file of walk(dir)) {
    const ext = path.extname(file).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) continue;
    let content;
    try {
      content = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    let changed = content;
    let count = 0;
    for (const [gif, mp4] of entries) {
      if (!changed.includes(gif)) continue;
      const split = changed.split(gif);
      count += split.length - 1;
      changed = split.join(mp4);
    }
    if (count > 0) {
      totalsByFile.set(path.relative(ROOT, file), count);
      totalReplacements += count;
      if (APPLY) await fs.writeFile(file, changed, "utf8");
    }
  }
}

console.log(`\nFiles touched: ${totalsByFile.size}`);
console.log(`Replacements : ${totalReplacements}`);
for (const [file, n] of [...totalsByFile.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${file}`);
}
if (!APPLY) console.log("\n(dry-run) pass --apply to write changes.");
