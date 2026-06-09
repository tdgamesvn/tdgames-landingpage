import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const { items } = await req.json() as { items: { id: number; sort_order: number }[] };
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  await Promise.all(
    items.map(({ id, sort_order }) =>
      supabase.from("page_slots").update({ sort_order }).eq("id", id)
    )
  );
  return NextResponse.json({ ok: true });
}
