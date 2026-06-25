import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notifyApplicationUpdate } from "@/lib/hr-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request);
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

  // Only allow updating status, admin_notes, rejection_reason
  const allowedFields: Record<string, unknown> = {};
  if ("status" in body) allowedFields.status = body.status;
  if ("admin_notes" in body) allowedFields.admin_notes = body.admin_notes;
  if ("rejection_reason" in body) allowedFields.rejection_reason = body.rejection_reason;

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json(
      { error: "No updatable fields provided. Allowed: status, admin_notes, rejection_reason" },
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

  // Fire-and-forget Discord notification
  if (oldApp) {
    (async () => {
      try {
        await notifyApplicationUpdate(oldApp, allowedFields, body);
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
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
