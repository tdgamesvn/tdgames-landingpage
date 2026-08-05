import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const revalidate = 60;

// GET /api/showreel — public: chỉ item active, sắp theo tab + sort_order
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("showreel_items")
    .select("id, tab, category, title, url, thumbnail, kind, sort_order")
    .eq("active", true)
    .order("tab", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}
