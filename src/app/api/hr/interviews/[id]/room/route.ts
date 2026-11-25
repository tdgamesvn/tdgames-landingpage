import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireHrUser, loadScopedInterview } from "@/lib/hr-session";
import { redactInterview } from "@/lib/hr-scope";
import { roomTimeError, wantedRoom, type RoomAction } from "@/lib/tdc-room-plan";
import {
  RoomBusyError,
  RoomInputError,
  applyRoomAction,
  getTdcRoom,
  listTdcRooms,
  roomBookingTitle,
  tdcRoomsEnabled,
} from "@/lib/tdc-rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLS = "id, application_id, scheduled_at, ends_at, mode, room_id, room_name, room_booking_id, room_state";

/**
 * Phòng họp TDC của 1 buổi PV.
 * - `?start=&end=` → danh sách phòng + trống/bận (phòng chính buổi này đang giữ không tính bận).
 * - `?check=1`     → kiểm booking còn bên TDC không (người TDC có thể tự huỷ); mất → room_state = error.
 * Chưa cấu hình env TDC → `{ enabled: false }` (giao diện ẩn phần chọn phòng).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHrUser(request, "interviews.manage");
  if ("response" in auth) return auth.response;
  if (!tdcRoomsEnabled()) return NextResponse.json({ enabled: false });

  const { id } = await params;
  const row = await loadScopedInterview(auth.ctx, id, COLS).catch(() => undefined);
  if (row === undefined) return NextResponse.json({ error: "Không đọc được phiên PV" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(request.url);
  if (url.searchParams.get("check")) {
    if (row.room_state !== "booked") return NextResponse.json({ enabled: true, changed: false });
    const booking = await getTdcRoom(id).catch(() => undefined);
    if (booking !== null) return NextResponse.json({ enabled: true, changed: false }); // còn, hoặc TDC lỗi → để yên
    const { data, error } = await getSupabaseAdmin()
      .from("interview_sessions")
      .update({ room_state: "error", room_booking_id: null, room_error: "Phòng đã bị huỷ bên TD Consulting" })
      .eq("id", id)
      .eq("room_state", "booked")
      .select()
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      enabled: true,
      changed: !!data,
      session: data ? redactInterview(data as Record<string, unknown>, auth.ctx.perms) : undefined,
    });
  }

  const start = new Date(url.searchParams.get("start") ?? "");
  const end = new Date(url.searchParams.get("end") ?? "");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Khung giờ không hợp lệ" }, { status: 400 });
  }
  try {
    const rooms = await listTdcRooms(start.toISOString(), end.toISOString(), id);
    return NextResponse.json({ enabled: true, rooms });
  } catch (e) {
    return NextResponse.json({ enabled: true, error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

/** Thử lại: đặt lại phòng (room_state = error) hoặc trả lại phòng (cancel_error). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireHrUser(request, "interviews.manage");
  if ("response" in auth) return auth.response;
  if (!tdcRoomsEnabled()) return NextResponse.json({ error: "Chưa bật đặt phòng TD Consulting" }, { status: 400 });

  const { id } = await params;
  const row = await loadScopedInterview(auth.ctx, id, COLS).catch(() => undefined);
  if (row === undefined) return NextResponse.json({ error: "Không đọc được phiên PV" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const s = row as {
    application_id: string;
    scheduled_at: string | null;
    ends_at: string | null;
    mode: string | null;
    room_id: string | null;
    room_name: string | null;
    room_booking_id: string | null;
    room_state: string | null;
  };
  if (s.room_state !== "error" && s.room_state !== "cancel_error") {
    return NextResponse.json({ error: "Không có việc phòng nào cần thử lại" }, { status: 400 });
  }
  const want = s.room_state === "error" ? wantedRoom(s) : null;
  const action: RoomAction = want ? { kind: "upsert", roomId: want } : { kind: "cancel" };
  if (action.kind === "upsert") {
    const err = roomTimeError(s.scheduled_at, s.ends_at);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }

  let jobTitle: string | null = null;
  if (action.kind === "upsert") {
    const { data } = await getSupabaseAdmin().from("applications").select("jobs(title)").eq("id", s.application_id).maybeSingle();
    const jobs = (data as { jobs?: { title?: string | null } | { title?: string | null }[] | null } | null)?.jobs;
    jobTitle = (Array.isArray(jobs) ? jobs[0] : jobs)?.title ?? null;
  }

  let patch;
  try {
    patch = await applyRoomAction(action, {
      sessionId: id,
      start: s.scheduled_at,
      end: s.ends_at,
      title: roomBookingTitle(jobTitle),
      booker: auth.ctx.user.displayName,
      prevRoomName: s.room_name,
      prevBookingId: s.room_booking_id,
    });
  } catch (e) {
    if (e instanceof RoomBusyError) return NextResponse.json({ error: e.message, code: "room_busy" }, { status: 409 });
    if (e instanceof RoomInputError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("interview_sessions")
    .update(patch ?? {})
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: redactInterview(data as Record<string, unknown>, auth.ctx.perms) });
}
