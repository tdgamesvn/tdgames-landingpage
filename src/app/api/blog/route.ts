import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error, count } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, tag, cover_image, published, views, author, created_at", { count: "exact" })
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ posts: data ?? [], total: count ?? 0 });
  } catch (err) {
    console.error("[GET /api/blog]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
