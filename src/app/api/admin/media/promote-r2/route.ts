import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";


export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
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
