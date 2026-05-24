import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const supabase = getSupabaseAdmin();

    // Fetch post (service role bypasses RLS — we check published manually)
    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Increment views (fire-and-forget)
    void supabase
      .from("blog_posts")
      .update({ views: post.views + 1 })
      .eq("id", post.id);

    return NextResponse.json({ post });
  } catch (err) {
    console.error(`[GET /api/blog/${slug}]`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
