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

// GET /api/admin/team — trả về toàn bộ team (bao gồm inactive)
export async function GET(req: Request) {
  const err = requireAdmin(req);
  if (err) return err;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, title, photo, sort_order, active")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ team: data ?? [] });
}

// PUT /api/admin/team — replace toàn bộ team array
export async function PUT(req: Request) {
  const err = requireAdmin(req);
  if (err) return err;

  const body = await req.json();
  if (!Array.isArray(body.team))
    return NextResponse.json({ error: "body.team must be an array" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Xoá tất cả rows cũ rồi insert lại
  const { error: delErr } = await supabase
    .from("team_members")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (body.team.length === 0)
    return NextResponse.json({ ok: true, count: 0 });

  const rows = body.team.map(
    (m: { name: string; title: string; photo: string; sort_order?: number; active?: boolean }, idx: number) => ({
      name: m.name,
      title: m.title ?? "",
      photo: m.photo ?? "",
      sort_order: m.sort_order ?? idx,
      active: m.active ?? true,
    })
  );

  const { error: insErr } = await supabase.from("team_members").insert(rows);

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: rows.length });
}
