import fs from "node:fs/promises";
import path from "node:path";
import { globSync } from "glob";

const API_URL = process.env.MAPPING_API_URL || "http://localhost:3000/api/admin/media/mapping";
const ADMIN_KEY = process.env.ADMIN_KEY;
const MAPPING_JSON = process.env.MAPPING_JSON; // injected by replace-run route (avoids self-HTTP call)
const APPLY = process.argv.includes("--apply");
const ROLLBACK = process.argv.includes("--rollback");
const BACKUP_FILE = path.join(process.cwd(), ".media-replace-backup.json");

const exts = ["ts", "tsx", "js", "jsx", "json", "md"];
const files = globSync(`src/**/*.+(${exts.join("|")})`, { nodir: true });

if (ROLLBACK) {
  const raw = await fs.readFile(BACKUP_FILE, "utf8");
  const backup = JSON.parse(raw);
  let restored = 0;
  for (const item of backup.files || []) {
    await fs.writeFile(path.join(process.cwd(), item.file), item.content, "utf8");
    restored += 1;
  }
  console.log(JSON.stringify({ mode: "rollback", restoredFiles: restored, backupFile: BACKUP_FILE }, null, 2));
  process.exit(0);
}

// Prefer injected mapping (no HTTP self-call needed) — fall back to HTTP fetch
let rawMapping;
if (MAPPING_JSON) {
  rawMapping = JSON.parse(MAPPING_JSON);
} else {
  if (!ADMIN_KEY) throw new Error("ADMIN_KEY is required");
  const res = await fetch(API_URL, {
    headers: { "x-admin-key": ADMIN_KEY },
  });
  if (!res.ok) throw new Error(`Failed to fetch mapping: ${res.status}`);
  const payload = await res.json();
  rawMapping = payload.mapping || [];
}

const mapping = rawMapping
  .filter((m) => typeof m.from === "string" && typeof m.to === "string" && m.from !== m.to)
  .sort((a, b) => b.from.length - a.from.length);

let changedFiles = 0;
let changedRefs = 0;
const backupFiles = [];

for (const file of files) {
  const abs = path.join(process.cwd(), file);
  const original = await fs.readFile(abs, "utf8");
  let next = original;

  for (const m of mapping) {
    if (next.includes(m.from)) {
      const parts = next.split(m.from);
      const replacements = parts.length - 1;
      if (replacements > 0) {
        changedRefs += replacements;
        next = parts.join(m.to);
      }
    }
  }

  if (next !== original) {
    changedFiles += 1;
    backupFiles.push({ file, content: original });
    if (APPLY) {
      await fs.writeFile(abs, next, "utf8");
    }
  }
}

if (APPLY && backupFiles.length > 0) {
  await fs.writeFile(BACKUP_FILE, JSON.stringify({ createdAt: new Date().toISOString(), files: backupFiles }, null, 2), "utf8");
}

console.log(JSON.stringify({
  mode: APPLY ? "apply" : "dry-run",
  filesScanned: files.length,
  changedFiles,
  changedRefs,
  backupFile: APPLY ? BACKUP_FILE : null,
}, null, 2));
