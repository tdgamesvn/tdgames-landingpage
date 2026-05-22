import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
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
