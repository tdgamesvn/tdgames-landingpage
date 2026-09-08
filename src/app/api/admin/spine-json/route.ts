import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy để fetch Spine JSON file từ CDN về admin UI
 * Tránh CORS khi browser fetch trực tiếp từ cdn.tdgamestudio.com
 *
 * GET /api/admin/spine-json?url=<encoded-cdn-url>
 */

export async function GET(request: Request) {
  const authError = await requireAdmin(request);
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

  // ?check=1 → chỉ hỏi file còn tồn tại không (dùng cho texture .png, khỏi tải cả file)
  if (searchParams.get("check")) {
    try {
      const res = await fetch(url, { method: "HEAD", cache: "no-store" });
      return NextResponse.json({ ok: res.ok, status: res.status });
    } catch {
      return NextResponse.json({ ok: false, status: 0 });
    }
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
