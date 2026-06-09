import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type ProjectRow = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  slug: string;
  category: string;
  created_at: string;
  updated_at: string;
};

function toProjectPayload(row: ProjectRow) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? "",
    image: row.image,
    slug: row.slug,
    category: row.category,
    createdAt: row.created_at,
  };
}

function getAdminKey(req: Request) {
  return req.headers.get("x-admin-key");
}


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = Number.parseInt(searchParams.get("limit") ?? "12", 10);
    const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);

    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 12;
    const safeOffset = Number.isFinite(offset) ? Math.max(offset, 0) : 0;

    const supabaseAdmin = getSupabaseAdmin();

    let query = supabaseAdmin
      .from("projects")
      .select("id,title,subtitle,image,slug,category,created_at,updated_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total = count ?? 0;
    const projects = (data ?? []).map((row) => toProjectPayload(row as ProjectRow));

    return NextResponse.json({
      projects,
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + safeLimit < total,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const supabaseAdmin = getSupabaseAdmin();

  try {
    const body = await request.json();
    const payload = {
      title: body.title,
      subtitle: body.subtitle ?? "",
      image: body.image,
      slug: body.slug,
      category: body.category,
    };

    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert(payload)
      .select("id,title,subtitle,image,slug,category,created_at,updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ project: toProjectPayload(data as ProjectRow) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const supabaseAdmin = getSupabaseAdmin();

  try {
    const body = await request.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") updates.title = body.title;
    if (typeof body.subtitle === "string") updates.subtitle = body.subtitle;
    if (typeof body.image === "string") updates.image = body.image;
    if (typeof body.slug === "string") updates.slug = body.slug;
    if (typeof body.category === "string") updates.category = body.category;

    const { data, error } = await supabaseAdmin
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select("id,title,subtitle,image,slug,category,created_at,updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ project: toProjectPayload(data as ProjectRow) });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const supabaseAdmin = getSupabaseAdmin();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("projects").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
