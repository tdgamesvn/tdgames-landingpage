import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy để fetch Spine JSON file từ CDN về admin UI
 * Tránh CORS khi browser fetch trực tiếp từ cdn.tdgamestudio.com
 *
 * GET /api/admin/spine-json?url=<encoded-cdn-url>
 */
function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return NextResponse.json({ error: "url param required" }, { status: 400 });

  // Chỉ cho phép fetch từ CDN của project
  const allowed = ["cdn.tdgamestudio.com", "r2.dev", "r2.cloudflarestorage.com", "localhost"];
  const hostname = new URL(url).hostname;
  if (!allowed.some((h) => hostname.endsWith(h))) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return new NextResponse(text, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
