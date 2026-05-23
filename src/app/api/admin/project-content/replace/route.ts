import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PORTFOLIO_DIR = path.join(process.cwd(), "src", "app", "portfolio");

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function isSafeSlug(slug: string) {
  return /^[a-z0-9][a-z0-9-]*$/.test(slug);
}

function isSafeUrl(url: string) {
  return /^https?:\/\//i.test(url) && !url.includes("\n") && !url.includes('"');
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i;
function detectKind(url: string): "image" | "video" | "gif" | "other" {
  if (VIDEO_EXT.test(url)) return "video";
  if (/\.gif(\?.*)?$/i.test(url)) return "gif";
  if (IMAGE_EXT.test(url)) return "image";
  return "other";
}

/**
 * Replace `oldUrl` with `newUrl` in `src/app/portfolio/<slug>/project-data.ts`.
 * Optionally also touches the `media_assets` row in Supabase that has
 * `current_url = oldUrl` (so the central library stays in sync).
 *
 * Strict matching: we replace `"oldUrl"` (with surrounding quotes) only — this
 * avoids accidentally rewriting a substring or a URL embedded inside a longer
 * string. Idempotent: returns 0 replacements if `oldUrl` is no longer present.
 */
export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  let body: { slug?: string; oldUrl?: string; newUrl?: string; updateDb?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { slug, oldUrl, newUrl } = body;
  const updateDb = body.updateDb !== false;

  if (!slug || !isSafeSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (!oldUrl || !isSafeUrl(oldUrl)) {
    return NextResponse.json({ error: "Invalid oldUrl" }, { status: 400 });
  }
  if (!newUrl || !isSafeUrl(newUrl)) {
    return NextResponse.json({ error: "Invalid newUrl" }, { status: 400 });
  }
  if (oldUrl === newUrl) {
    return NextResponse.json({ replacements: 0, dbUpdated: 0, note: "no-op (oldUrl == newUrl)" });
  }

  const filePath = path.join(PORTFOLIO_DIR, slug, "project-data.ts");
  let content: string;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch {
    return NextResponse.json({ error: `project-data.ts not found for ${slug}` }, { status: 404 });
  }

  const needle = `"${oldUrl}"`;
  if (!content.includes(needle)) {
    return NextResponse.json(
      { error: "oldUrl not present in this project-data.ts (perhaps already replaced)" },
      { status: 404 },
    );
  }
  const replaced = content.split(needle).join(`"${newUrl}"`);
  const replacements = (content.match(new RegExp(needle.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&"), "g")) || []).length;

  await fs.writeFile(filePath, replaced, "utf8");

  let dbUpdated = 0;
  if (updateDb) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: rows, error: selErr } = await supabase
        .from("media_assets")
        .select("id, kind")
        .eq("current_url", oldUrl);
      if (!selErr && rows && rows.length > 0) {
        const newKind = detectKind(newUrl);
        const { error: updErr } = await supabase
          .from("media_assets")
          .update({ current_url: newUrl, r2_url: newUrl, kind: newKind })
          .eq("current_url", oldUrl);
        if (!updErr) dbUpdated = rows.length;
      }
    } catch (e) {
      return NextResponse.json({
        replacements,
        dbUpdated: 0,
        warning: `source updated but DB update failed: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  return NextResponse.json({
    replacements,
    dbUpdated,
    file: path.relative(process.cwd(), filePath),
  });
}
