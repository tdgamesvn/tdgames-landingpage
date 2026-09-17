import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import { deleteFromR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sửa phiên PV: gắn file ghi âm, dán transcript tay, đổi tên vòng, sửa câu hỏi. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowed: Record<string, unknown> = {};
  for (const k of ["title", "audio_url", "audio_key", "audio_bytes", "transcript", "questions"]) {
    if (k in body) allowed[k] = body[k];
  }
  // Transcript dán tay thì đánh dấu nguồn để sau soi lại biết không phải máy gỡ.
  if ("transcript" in body) allowed.transcript_source = "manual";

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Thay file ghi âm thì phải nhớ key cũ để dọn — nếu không, bản ghi bị thay
  // nằm lại vĩnh viễn trên CDN công khai dù không còn ai trỏ tới.
  let oldAudioKey: string | null = null;
  if ("audio_key" in allowed) {
    const { data: prev } = await supabase
      .from("interview_sessions")
      .select("audio_key")
      .eq("id", id)
      .single();
    if (prev?.audio_key && prev.audio_key !== allowed.audio_key) {
      oldAudioKey = prev.audio_key;
    }
  }

  const { data, error } = await supabase
    .from("interview_sessions")
    .update(allowed)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Dọn sau khi DB đã đổi xong — hỏng bước này chỉ để lại rác, không mất dữ liệu.
  if (oldAudioKey) await deleteFromR2(oldAudioKey);

  return NextResponse.json({ session: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireHR(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  // Lấy key TRƯỚC khi xoá dòng — xoá xong là mất đường tìm lại file trên R2.
  const { data: prev } = await supabase
    .from("interview_sessions")
    .select("audio_key")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("interview_sessions").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ghi âm phỏng vấn là dữ liệu riêng tư — HR bấm xoá thì phải biến mất khỏi CDN
  // luôn, không chỉ khuất khỏi giao diện.
  if (prev?.audio_key) await deleteFromR2(prev.audio_key);

  return NextResponse.json({ ok: true });
}
