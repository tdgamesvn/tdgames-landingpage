import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data ?? [] });
}

export async function POST(request: Request) {
  const authError = await requireHR(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, type, location, level, salary, summary, description, categories,
    requirements, responsibilities, nice_to_have, skills, image_url, is_active } = body;

  if (!title || !type) {
    return NextResponse.json({ error: "title and type are required" }, { status: 400 });
  }

  // Auto-generate slug from title
  const slug = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .insert([{
      title, type, location: location ?? "", level: level ?? "",
      salary: salary ?? "", summary: summary ?? "", description: description ?? "",
      categories: categories ?? [], requirements: requirements ?? [],
      responsibilities: responsibilities ?? [], nice_to_have: nice_to_have ?? [],
      skills: skills ?? [], image_url: image_url ?? "",
      is_active: is_active ?? false,
      slug,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data }, { status: 201 });
}
