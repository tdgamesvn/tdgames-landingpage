import path from "node:path";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { globSync } from "glob";

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

const BAD_SNIPPETS = ["${", "`;", "@", "localhost", "127.0.0.1"];
const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"];
const VIDEO_EXT = [".mp4", ".webm", ".mov"];
const ALLOWED_HOSTS = [
  "images.unsplash.com",
  "cdn.jsdelivr.net",
  "raw.githubusercontent.com",
  "player.vimeo.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "i.ytimg.com",
  "vumbnail.com",
];

function classifyExternalUrl(input: string) {
  const value = input.trim();
  const lower = value.toLowerCase();
  if (BAD_SNIPPETS.some((s) => lower.includes(s))) return null;
  if (!(lower.startsWith("http://") || lower.startsWith("https://"))) return null;

  let host = "";
  try {
    host = new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }

  if (!ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return null;

  if (VIDEO_EXT.some((ext) => lower.includes(ext)) || host.includes("vimeo") || host.includes("youtube") || host === "youtu.be") {
    return "video";
  }

  if (lower.includes(".gif")) return "gif";
  if (IMAGE_EXT.some((ext) => lower.includes(ext))) return "image";

  return null;
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const cwd = process.cwd();
  const found = new Map<string, Set<string>>();
  const regex = /https?:\/\/[^"'\s)]+/g;

  const filePaths = globSync("src/**/*.{ts,tsx}", { nodir: true });

  for (const filePath of filePaths) {
    const abs = path.join(cwd, filePath);
    const content = await readFile(abs, "utf8");
    const matches = content.match(regex) ?? [];
    for (const url of matches) {
      if (!found.has(url)) found.set(url, new Set<string>());
      found.get(url)!.add(filePath);
    }
  }

  const supabase = getSupabaseAdmin();
  const inserted: string[] = [];

  for (const [url, usedBy] of found.entries()) {
    const kind = classifyExternalUrl(url);
    if (!kind) continue;

    const payload = {
      kind,
      source_type: "external",
      original_url: url,
      current_url: url,
      r2_key: null,
      r2_url: null,
      status: "active",
      used_by: Array.from(usedBy),
    };

    const { error } = await supabase.from("media_assets").upsert(payload, { onConflict: "original_url" });
    if (!error) {
      inserted.push(url);
    }
  }

  return NextResponse.json({ scanned: inserted.length, urls: inserted });
}
