import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedInterview } from "@/lib/hr-session";
import { redactInterview } from "@/lib/hr-scope";
import { r2PublicUrl } from "@/lib/r2";
import { appendPiece, parsePieceInput } from "@/lib/interview-audio";
import { audioKeyUsedElsewhere } from "@/lib/interview-audio-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Gắn 1 mảnh ghi âm (ghi trong app /hr) vào vòng PV.
 * Body `{ key, url, bytes, mime, duration_ms, segment }` — file đã upload R2 qua /api/hr/upload/audio/multipart.
 * Client gửi mảnh tuần tự (recorder-queue) nên đọc–ghi jsonb không đua nhau; gửi lại cùng key → 200, không gắn 2 lần.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireHrUser(request, "interviews.manage");
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const owned = await loadScopedInterview(auth.ctx, id).catch(() => undefined);
  if (owned === undefined) return NextResponse.json({ error: "Không đọc được phiên PV" }, { status: 500 });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = parsePieceInput(await request.json().catch(() => null), r2PublicUrl, new Date().toISOString());
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const used = await audioKeyUsedElsewhere(supabase, parsed.piece.key, id).catch((e: Error) => e);
  if (used instanceof Error) return NextResponse.json({ error: used.message }, { status: 500 });
  if (used) return NextResponse.json({ error: "Ghi âm này đã gắn cho phiên khác" }, { status: 400 });

  const { data: row, error: readErr } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (readErr || !row) return NextResponse.json({ error: readErr?.message ?? "Not found" }, { status: readErr ? 500 : 404 });

  const next = appendPiece(row, parsed.piece);
  if (next.duplicate) {
    return NextResponse.json({ session: redactInterview(row as Record<string, unknown>, auth.ctx.perms) });
  }

  const { data, error } = await supabase
    .from("interview_sessions")
    .update(next.update)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: redactInterview(data as Record<string, unknown>, auth.ctx.perms) });
}
