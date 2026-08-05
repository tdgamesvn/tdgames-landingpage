import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABS = new Set(["art", "animation", "vfx"]);

// GET /api/admin/showreel — toàn bộ item (kể cả inactive)
export async function GET(req: Request) {
  const err = await requireAdmin(req);
  if (err) return err;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("showreel_items")
    .select("id, tab, category, title, url, thumbnail, kind, sort_order, active")
    .order("tab", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

type ItemInput = {
  tab?: string;
  category?: string;
  title?: string;
  url?: string;
  thumbnail?: string | null;
  kind?: string;
  sort_order?: number;
  active?: boolean;
};

// PUT /api/admin/showreel — replace toàn bộ list (giống /api/admin/team)
export async function PUT(req: Request) {
  const err = await requireAdmin(req);
  if (err) return err;

  const body = await req.json();
  if (!Array.isArray(body.items))
    return NextResponse.json({ error: "body.items must be an array" }, { status: 400 });

  // Validate trước khi xoá — nếu payload hỏng mà đã delete thì mất sạch dữ liệu.
  const rows: Record<string, unknown>[] = [];
  for (const [idx, it] of (body.items as ItemInput[]).entries()) {
    if (!it.url || typeof it.url !== "string")
      return NextResponse.json({ error: `item[${idx}]: url is required` }, { status: 400 });
    if (!TABS.has(String(it.tab)))
      return NextResponse.json({ error: `item[${idx}]: tab must be art|animation|vfx` }, { status: 400 });
    rows.push({
      tab: it.tab as string,
      category: (it.category ?? "").trim(),
      title: (it.title ?? "").trim(),
      url: it.url,
      thumbnail: it.thumbnail || null,
      kind: it.kind === "video" ? "video" : "image",
      sort_order: typeof it.sort_order === "number" ? it.sort_order : idx,
      active: it.active ?? true,
    });
  }

  const supabase = getSupabaseAdmin();
  const { error: delErr } = await supabase
    .from("showreel_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (rows.length === 0) return NextResponse.json({ ok: true, count: 0 });

  const { error: insErr } = await supabase.from("showreel_items").insert(rows);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: rows.length });
}
