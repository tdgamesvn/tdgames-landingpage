import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";


export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const sourceType = searchParams.get("sourceType");

  let query = supabase
    .from("media_assets")
    .select("id,kind,source_type,original_url,current_url,r2_key,r2_url,status,label,used_by,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (sourceType) query = query.eq("source_type", sourceType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const id = body.id;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.current_url === "string") updates.current_url = body.current_url;
  if (typeof body.status === "string") updates.status = body.status;
  if (typeof body.label === "string") updates.label = body.label || null;
  // body.label = "" → removes label (set null); body.label = "about-hero" → sets label

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("media_assets")
    .update(updates)
    .eq("id", id)
    .select("id,kind,source_type,original_url,current_url,r2_key,r2_url,status,label,used_by,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}
