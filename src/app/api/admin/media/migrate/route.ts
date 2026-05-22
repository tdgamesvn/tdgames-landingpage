import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readFile } from "node:fs/promises";

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

const MEDIA_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm", ".mov", ".svg"]);

async function listFiles(dir: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, rel);
    if (!entry.isFile()) return [];
    if (!MEDIA_EXT.has(path.extname(entry.name).toLowerCase())) return [];
    return [rel.split(path.sep).join("/")];
  }));
  return nested.flat();
}

function kindFromPath(p: string) {
  const ext = path.extname(p).toLowerCase();
  if (ext === ".gif") return "gif";
  if ([".mp4", ".webm", ".mov"].includes(ext)) return "video";
  if ([".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(ext)) return "image";
  return "other";
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const publicDir = path.join(process.cwd(), "public");
  const relPaths = await listFiles(publicDir);
  const supabase = getSupabaseAdmin();

  const migrated: Array<{ path: string; url: string }> = [];

  for (const relPath of relPaths) {
    const fullPath = path.join(publicDir, relPath);
    const body = await readFile(fullPath);
    const key = `landing/${relPath}`;
    const uploaded = await uploadToR2({ key, body, contentType: "application/octet-stream" });

    const originalUrl = `/${relPath}`;
    const payload = {
      kind: kindFromPath(relPath),
      source_type: "local_public",
      original_url: originalUrl,
      current_url: uploaded.url,
      r2_key: uploaded.key,
      r2_url: uploaded.url,
      status: "active",
      used_by: [],
    };

    const { error } = await supabase.from("media_assets").upsert(payload, { onConflict: "original_url" });
    if (!error) {
      migrated.push({ path: relPath, url: uploaded.url });
    }
  }

  return NextResponse.json({ migratedCount: migrated.length, migrated });
}
