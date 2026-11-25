/**
 * Đặt phòng họp TD Consulting (TDC) cho lịch PV Offline — chỉ chạy trên server.
 * Gọi 4 RPC room_ext_* qua REST của Supabase TDC bằng anon key (công khai) + mật mã riêng TDC_ROOM_KEY.
 * Mã tham chiếu (ref) = id buổi PV ⇒ gọi lặp không tạo booking thứ hai.
 * Spec: docs/superpowers/specs/2026-11-25-hr-tdc-room-booking-design.md
 */
import { getSupabaseAdmin } from "./supabase-admin";
import type { RoomAction, RoomState } from "./tdc-room-plan";

const TIMEOUT_MS = 8000;

export type TdcRoom = { id: string; name: string; location: string | null; capacity: number | null; free: boolean };
export type TdcBooking = { booking_id: string; room_id: string; room_name: string; start_at: string; end_at: string };

/** TDC báo phòng đã có lịch trong khung giờ. */
export class RoomBusyError extends Error {
  constructor() {
    super("Phòng đã có lịch trong khung giờ này. Vui lòng chọn giờ hoặc phòng khác.");
  }
}

/** Lỗi đầu vào TDC từ chối (giờ sai, phòng không còn dùng…) — không nên Thử lại y nguyên. */
export class RoomInputError extends Error {}

function env() {
  const url = process.env.TDC_SUPABASE_URL?.replace(/\/+$/, "");
  const anon = process.env.TDC_SUPABASE_ANON_KEY;
  const key = process.env.TDC_ROOM_KEY;
  return url && anon && key ? { url, anon, key } : null;
}

/** Thiếu env ⇒ tính năng ẩn hoàn toàn (form lịch như cũ). */
export function tdcRoomsEnabled(): boolean {
  return env() !== null;
}

const INPUT_ERRORS: Record<string, string> = {
  bad_time: "Khung giờ không hợp lệ hoặc đã qua",
  bad_room: "Phòng này không còn dùng bên TD Consulting",
  bad_ref: "Mã buổi PV không hợp lệ",
};

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const e = env();
  if (!e) throw new Error("Chưa cấu hình đặt phòng TDC");
  let res: Response;
  try {
    res = await fetch(`${e.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: e.anon,
        Authorization: `Bearer ${e.anon}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_key: e.key, ...args }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    throw new Error(
      err instanceof Error && err.name === "TimeoutError" ? "TD Consulting không phản hồi" : "Không kết nối được TD Consulting",
    );
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* để null */
  }
  if (!res.ok) {
    const msg = (data as { message?: string } | null)?.message ?? "";
    if (msg === "room_busy") throw new RoomBusyError();
    if (INPUT_ERRORS[msg]) throw new RoomInputError(INPUT_ERRORS[msg]);
    if (msg === "unauthorized") throw new Error("TD Consulting từ chối mật mã đặt phòng");
    throw new Error(`TD Consulting lỗi ${res.status}`);
  }
  return data as T;
}

export function listTdcRooms(start: string, end: string, ref: string | null) {
  return rpc<TdcRoom[]>("room_ext_rooms", { p_start: start, p_end: end, p_ref: ref });
}

export function upsertTdcRoom(i: { ref: string; roomId: string; start: string; end: string; title: string; booker: string }) {
  return rpc<TdcBooking>("room_ext_upsert", {
    p_ref: i.ref,
    p_room: i.roomId,
    p_start: i.start,
    p_end: i.end,
    p_title: i.title,
    p_booker: i.booker,
  });
}

export function cancelTdcRoom(ref: string) {
  return rpc<{ cancelled: number }>("room_ext_cancel", { p_ref: ref });
}

export async function getTdcRoom(ref: string) {
  return (await rpc<{ booking: TdcBooking | null }>("room_ext_get", { p_ref: ref })).booking;
}

export type RoomPatch = {
  room_id: string | null;
  room_name: string | null;
  room_booking_id: string | null;
  room_state: RoomState | null;
  room_error: string | null;
};

const CLEARED: RoomPatch = { room_id: null, room_name: null, room_booking_id: null, room_state: null, room_error: null };

/**
 * Thực hiện hành động phòng, trả các cột cần ghi vào interview_sessions.
 * - Phòng bận ⇒ ném RoomBusyError (route trả 409, KHÔNG ghi gì — booking cũ giữ nguyên bên TDC);
 *   TDC từ chối đầu vào ⇒ ném RoomInputError (route trả 400).
 * - Lỗi mạng/TDC ⇒ không ném: trả room_state error/cancel_error để HR bấm Thử lại; lịch PV vẫn lưu.
 */
export async function applyRoomAction(
  action: RoomAction,
  i: {
    sessionId: string;
    start: string | null;
    end: string | null;
    title: string;
    booker: string;
    prevRoomName: string | null;
    prevBookingId: string | null;
  },
): Promise<RoomPatch | null> {
  if (action.kind === "none") return null;
  if (action.kind === "cancel") {
    try {
      await cancelTdcRoom(i.sessionId);
      return CLEARED;
    } catch (e) {
      return {
        room_id: null,
        room_name: i.prevRoomName,
        room_booking_id: i.prevBookingId,
        room_state: "cancel_error",
        room_error: e instanceof Error ? e.message : String(e),
      };
    }
  }
  try {
    const b = await upsertTdcRoom({
      ref: i.sessionId,
      roomId: action.roomId,
      start: i.start!,
      end: i.end!,
      title: i.title,
      booker: i.booker,
    });
    return { room_id: b.room_id, room_name: b.room_name, room_booking_id: b.booking_id, room_state: "booked", room_error: null };
  } catch (e) {
    if (e instanceof RoomBusyError || e instanceof RoomInputError) throw e;
    return {
      room_id: action.roomId,
      room_name: i.prevRoomName,
      room_booking_id: i.prevBookingId,
      room_state: "error",
      room_error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Trả phòng cho các buổi PV sắp bị xoá (xoá vòng / hồ sơ / job). Lỗi chỉ log — không chặn việc xoá. */
export async function releaseTdcRooms(rows: { id: string; room_state?: string | null; room_id?: string | null }[]) {
  const held = rows.filter((r) => r.room_state || r.room_id);
  if (held.length === 0 || !tdcRoomsEnabled()) {
    if (held.length) console.error("[tdc-rooms] chưa cấu hình — không trả được phòng cho", held.map((r) => r.id));
    return;
  }
  for (const r of held) {
    await cancelTdcRoom(r.id).catch((e) => console.error("[tdc-rooms] trả phòng thất bại", r.id, e));
  }
}

/** Trả phòng cho mọi buổi PV của hồ sơ / job sắp bị xoá (cascade xoá vòng PV là mất mã tham chiếu). */
export async function releaseTdcRoomsFor(f: { applicationId: string } | { jobId: string }) {
  const supabase = getSupabaseAdmin();
  let appIds: string[];
  if ("applicationId" in f) appIds = [f.applicationId];
  else {
    const { data, error } = await supabase.from("applications").select("id").eq("job_id", f.jobId);
    if (error) return console.error("[tdc-rooms] không đọc được hồ sơ của job", f.jobId, error.message);
    appIds = (data ?? []).map((r) => String(r.id));
  }
  if (appIds.length === 0) return;
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("id, room_id, room_state")
    .in("application_id", appIds)
    .or("room_state.not.is.null,room_id.not.is.null");
  if (error) return console.error("[tdc-rooms] không đọc được vòng PV để trả phòng", error.message);
  await releaseTdcRooms((data ?? []) as { id: string; room_id: string | null; room_state: string | null }[]);
}

/** Tiêu đề booking bên TDC — không chứa tên ứng viên. */
export function roomBookingTitle(jobTitle: string | null) {
  return `Phỏng vấn TD Games${jobTitle ? ` – ${jobTitle}` : ""}`;
}
