import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

// GET /api/admin/footer
export async function GET(req: Request) {
  const err = requireAdmin(req);
  if (err) return err;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "footer")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ footer: data?.value ?? {} });
}

// PUT /api/admin/footer
export async function PUT(req: Request) {
  const err = requireAdmin(req);
  if (err) return err;

  const body = await req.json();
  if (!body.footer || typeof body.footer !== "object")
    return NextResponse.json({ error: "body.footer must be an object" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("site_config")
    .upsert({ key: "footer", value: body.footer, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
