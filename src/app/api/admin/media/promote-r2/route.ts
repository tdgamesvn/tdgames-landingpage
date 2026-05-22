import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("media_assets")
    .select("id,r2_url")
    .eq("source_type", "local_public")
    .not("r2_url", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let updated = 0;
  for (const item of data ?? []) {
    const { error: updateError } = await supabase
      .from("media_assets")
      .update({ current_url: item.r2_url })
      .eq("id", item.id);

    if (!updateError) updated += 1;
  }

  return NextResponse.json({ updated, totalCandidates: (data ?? []).length });
}
