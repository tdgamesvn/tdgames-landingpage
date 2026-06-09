import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";


export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("media_assets")
    .select("id,source_type,kind,original_url,current_url,r2_url,status,updated_at")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const mapping = (data ?? []).map((item) => ({
    id: item.id,
    sourceType: item.source_type,
    kind: item.kind,
    from: item.original_url,
    to: item.current_url,
    r2Url: item.r2_url,
    updatedAt: item.updated_at,
  }));

  return NextResponse.json({ total: mapping.length, mapping });
}
