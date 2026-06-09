import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET(request: Request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("spine_characters")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ characters: data ?? [] });
}

export async function POST(request: Request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, slug } = body;
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("spine_characters")
    .insert([{
      name:                body.name,
      slug:                body.slug,
      json_url:            body.json_url            ?? null,
      atlas_url:           body.atlas_url           ?? null,
      animations:          body.animations          ?? ["idle"],
      skin:                body.skin                ?? null,
      active:              body.active              ?? true,
      scale:               body.scale               ?? 1.0,
      offset_x:            body.offset_x            ?? 0,
      offset_y:            body.offset_y            ?? 0,
      premultiplied_alpha: body.premultiplied_alpha ?? true,
      mix_duration:        body.mix_duration        ?? 0.0,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ character: data }, { status: 201 });
}
