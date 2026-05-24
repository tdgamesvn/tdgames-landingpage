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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Only allow updating status and admin_notes
  const allowedFields: Record<string, unknown> = {};
  if ("status" in body) allowedFields.status = body.status;
  if ("admin_notes" in body) allowedFields.admin_notes = body.admin_notes;

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json(
      { error: "No updatable fields provided. Allowed: status, admin_notes" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("applications")
    .update(allowedFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json({ application: data });
}
