import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  if (req.headers.get("x-admin-key") !== ADMIN_SECRET) return unauthorized();

  try {
    const supabase = getSupabaseAdmin();
    const { data, error, count } = await supabase
      .from("blog_posts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ posts: data ?? [], total: count ?? 0 });
  } catch (err) {
    console.error("[GET /api/admin/blog]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (req.headers.get("x-admin-key") !== ADMIN_SECRET) return unauthorized();

  try {
    const body = await req.json();
    const { slug, title, excerpt, tag, cover_image, content_md, published, author } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        slug,
        title,
        excerpt: excerpt ?? "",
        tag: tag ?? "Blog",
        cover_image: cover_image ?? "",
        content_md: content_md ?? "",
        published: published ?? false,
        author: author ?? "TD Games",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/blog]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
