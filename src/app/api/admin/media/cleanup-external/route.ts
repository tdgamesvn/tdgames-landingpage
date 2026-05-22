import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

const BAD_SNIPPETS = ["${", "`;"];
const MEDIA_EXT = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm", ".mov", ".svg"];

function looksLikeMediaUrl(url: string) {
  const lower = url.toLowerCase();
  if (BAD_SNIPPETS.some((s) => lower.includes(s))) return false;
  if (!(lower.startsWith("http://") || lower.startsWith("https://"))) return false;
  if (MEDIA_EXT.some((ext) => lower.includes(ext))) return true;
  if (lower.includes("player.vimeo.com")) return true;
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return true;
  return false;
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("media_assets")
    .select("id,original_url")
    .eq("source_type", "external");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const toDelete = (data ?? []).filter((r) => !looksLikeMediaUrl(r.original_url)).map((r) => r.id);

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase.from("media_assets").delete().in("id", toDelete);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: toDelete.length });
}
