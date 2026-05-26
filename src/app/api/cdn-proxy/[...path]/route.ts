/**
 * CDN Proxy — `/api/cdn-proxy/[...path]`
 *
 * Proxies requests to cdn.tdgamestudio.com server-side, bypassing browser
 * CORS restrictions. Used by SpinePlayer to fetch .json/.skel/.atlas/textures.
 *
 * Example:
 *   GET /api/cdn-proxy/landing/spine/hero/hero.json
 *   → fetch https://cdn.tdgamestudio.com/landing/spine/hero/hero.json
 */

import { NextRequest, NextResponse } from "next/server";

const CDN_BASE = "https://cdn.tdgamestudio.com";

// Only proxy safe file types (no HTML, JS, etc.)
const ALLOWED_EXTENSIONS = new Set([
  ".json", ".skel", ".atlas", ".png", ".jpg", ".jpeg", ".webp",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join("/");

  // Validate extension
  const ext = filePath.match(/\.[^./?#]+$/)?.[0]?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return new NextResponse("File type not allowed", { status: 403 });
  }

  // Prevent path traversal
  if (filePath.includes("..")) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  const cdnUrl = `${CDN_BASE}/${filePath}`;

  try {
    const res = await fetch(cdnUrl, {
      headers: { "User-Agent": "tdgamestudio-proxy/1.0" },
      // Cache for 1 hour on the server
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return new NextResponse(`CDN returned ${res.status}`, { status: res.status });
    }

    const contentType =
      res.headers.get("content-type") ??
      (ext === ".json"
        ? "application/json"
        : ext === ".atlas"
        ? "text/plain"
        : ext === ".skel"
        ? "application/octet-stream"
        : "application/octet-stream");

    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Allow browser to cache for 1 hour
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        // CORS — allow same-site requests
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[cdn-proxy] fetch error:", err);
    return new NextResponse("Proxy error", { status: 502 });
  }
}
