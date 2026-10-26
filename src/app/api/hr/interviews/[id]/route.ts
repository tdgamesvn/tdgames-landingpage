import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHR } from "@/lib/hr-auth";
import { deleteFromR2 } from "@/lib/r2";
import { discordNotify } from "@/lib/discord-notify";
import { formatInterviewTime, isMeetUrl, modeLabel } from "@/lib/interview-schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function notifySchedule(s: {
  application_id: string;
  title: string | null;
  round: number;
  scheduled_at: string | null;
  mode: string | null;
  meet_url: string | null;
}) {
  const { data: app } = await getSupabaseAdmin()
    .from("applications")
    .select("full_name, jobs(title)")
    .eq("id", s.application_id)
    .single();
  const jobs = app?.jobs as { title: string } | { title: string }[] | null | undefined;
  const jobTitle = Array.isArray(jobs) ? jobs[0]?.title : jobs?.title;
  const round = s.title ?? `Vòng ${s.round}`;

  await discordNotify("hr", {
    embeds: [
      {
        title: s.scheduled_at ? `🗓 Lịch PV — ${app?.full_name ?? "?"}` : `🗓 Huỷ lịch PV — ${app?.full_name ?? "?"}`,
        color: s.mode === "online" ? 0x3b82f6 : 0xf59e0b,
        fields: [
          { name: "Vị trí", value: `${jobTitle ?? "?"} · ${round}`, inline: true },
          ...(s.scheduled_at
            ? [
                { name: "Thời gian", value: formatInterviewTime(s.scheduled_at), inline: true },
                { name: "Hình thức", value: modeLabel(s.mode, s.meet_url) },
              ]
            : []),
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "tdgamestudio.com/hr" },
      },
    ],
  });
}

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

  const supabase = getSupabaseAdmin();

  // ── Lịch PV: giờ hẹn + hình thức. Online bắt buộc có link Meet; offline thì bỏ link.
  const scheduleKeys = ["scheduled_at", "mode", "meet_url"].filter((k) => k in body);
  let scheduleChanged = false;
  if (scheduleKeys.length > 0) {
    const { data: prev } = await supabase
      .from("interview_sessions")
      .select("scheduled_at, mode, meet_url")
      .eq("id", id)
      .single();
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let scheduledAt = prev.scheduled_at as string | null;
    if ("scheduled_at" in body) {
      if (body.scheduled_at === null || body.scheduled_at === "") scheduledAt = null;
      else {
        const d = new Date(String(body.scheduled_at));
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json({ error: "Giờ PV không hợp lệ" }, { status: 400 });
        }
        scheduledAt = d.toISOString();
      }
    }

    let mode = prev.mode as string | null;
    if ("mode" in body) {
      if (body.mode !== null && body.mode !== "offline" && body.mode !== "online") {
        return NextResponse.json({ error: "Hình thức PV phải là offline hoặc online" }, { status: 400 });
      }
      mode = body.mode as string | null;
    }

    let meetUrl = prev.meet_url as string | null;
    if ("meet_url" in body) {
      meetUrl = typeof body.meet_url === "string" && body.meet_url.trim() ? body.meet_url.trim() : null;
    }
    if (mode === "online") {
      if (!meetUrl) {
        return NextResponse.json({ error: "PV online phải có link Google Meet" }, { status: 400 });
      }
      if (!isMeetUrl(meetUrl)) {
        return NextResponse.json({ error: "Link phải là Google Meet (https://meet.google.com/…)" }, { status: 400 });
      }
    } else {
      meetUrl = null; // offline / chưa chọn → không giữ link cũ kẻo nhắc nhầm
    }

    scheduleChanged =
      scheduledAt !== (prev.scheduled_at ? new Date(prev.scheduled_at).toISOString() : null) ||
      mode !== prev.mode ||
      meetUrl !== prev.meet_url;

    Object.assign(allowed, { scheduled_at: scheduledAt, mode, meet_url: meetUrl });
    // Đổi lịch → nhắc lại theo thông tin mới.
    if (scheduleChanged) allowed.reminded_at = null;
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
  }

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

  // Báo kênh HR khi đặt/đổi lịch — lỗi Discord không được làm hỏng việc lưu.
  if (scheduleChanged) {
    try {
      await notifySchedule(data);
    } catch (e) {
      console.error("[interviews] discord notify failed", e);
    }
  }

  return NextResponse.json({ session: data });
}

/** 1 vòng PV — client hỏi lại khi đang phân tích nền (analysis_status = "running"). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireHR(request);
  if (authError) return authError;
  const { id } = await params;
  const { data, error } = await getSupabaseAdmin().from("interview_sessions").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
