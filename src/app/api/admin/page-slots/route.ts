import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function authCheck(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  return key === process.env.ADMIN_SECRET;
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const page = req.nextUrl.searchParams.get("page");
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("page_slots")
    .select("*")
    .order("page")
    .order("slot")
    .order("sort_order");
  if (page) query = query.eq("page", page);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slots: data });
}

export async function POST(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as {
    page: string; slot: string; url: string;
    thumb_url?: string; display_name?: string; display_label?: string;
    sort_order?: number; is_active?: boolean;
  };
  if (!body.page || !body.slot || !body.url) {
    return NextResponse.json({ error: "page, slot, url required" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("page_slots")
    .insert({ ...body, sort_order: body.sort_order ?? 0, is_active: body.is_active ?? true })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slot: data }, { status: 201 });
}
