import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Danh sách phiên PV của một ứng viên. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const { id } = await params;
  const { data, error } = await getSupabaseAdmin()
    .from("interview_sessions")
    .select("*")
    .eq("application_id", id)
    .order("round", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data ?? [] });
}

/** Tạo vòng PV mới. Round tự tăng theo vòng lớn nhất đang có. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: app } = await supabase
    .from("applications")
    .select("id")
    .eq("id", id)
    .single();
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}) as Record<string, unknown>);

  const { data: last } = await supabase
    .from("interview_sessions")
    .select("round")
    .eq("application_id", id)
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle();

  const round = last ? last.round + 1 : 1;

  const { data, error } = await supabase
    .from("interview_sessions")
    .insert({
      application_id: id,
      round,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : `Vòng ${round}`,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}
