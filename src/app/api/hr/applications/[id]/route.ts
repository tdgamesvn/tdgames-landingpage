import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import { notifyApplicationUpdate } from "@/lib/hr-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Snapshot old values before update (for diff in notification)
  const { data: oldApp } = await supabase
    .from("applications")
    .select("full_name, status, admin_notes, rejection_reason, job_id")
    .eq("id", id)
    .single();

  const allowed: Record<string, unknown> = {};
  if ("status" in body) allowed.status = body.status;
  if ("admin_notes" in body) allowed.admin_notes = body.admin_notes;
  if ("rejection_reason" in body) allowed.rejection_reason = body.rejection_reason;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("applications")
    .update(allowed)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fire-and-forget Discord notification
  if (oldApp) {
    (async () => {
      try {
        await notifyApplicationUpdate(oldApp, allowed, body);
      } catch {
        // Silently ignore — DB update already succeeded
      }
    })();
  }

  return NextResponse.json({ application: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
