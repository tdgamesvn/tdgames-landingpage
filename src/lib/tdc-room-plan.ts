/**
 * Quyết định thuần cho việc đặt phòng họp TDC theo lịch PV (không gọi mạng).
 * Spec: docs/superpowers/specs/2026-11-25-hr-tdc-room-booking-design.md
 */

export type RoomState = "booked" | "error" | "cancel_error";

export type RoomSnapshot = {
  scheduled_at: string | null;
  ends_at: string | null;
  mode: string | null;
  room_id: string | null;
  room_state: RoomState | null;
};

export type RoomAction = { kind: "none" } | { kind: "upsert"; roomId: string } | { kind: "cancel" };

const sameTime = (a: string | null, b: string | null) =>
  (a ? new Date(a).getTime() : null) === (b ? new Date(b).getTime() : null);

/** Giờ kết thúc mặc định khi HR chưa chọn: +60 phút. */
export const DEFAULT_ROOM_MINUTES = 60;

export function defaultEndsAt(scheduledAt: string): string {
  return new Date(new Date(scheduledAt).getTime() + DEFAULT_ROOM_MINUTES * 60_000).toISOString();
}

/** Phòng mong muốn sau khi lưu: chỉ khi có lịch Offline và đã chọn phòng. */
export function wantedRoom(s: Pick<RoomSnapshot, "scheduled_at" | "mode" | "room_id">): string | null {
  return s.scheduled_at && s.mode === "offline" && s.room_id ? s.room_id : null;
}

/** So trạng thái cũ ↔ mới → cần đặt/sửa, trả phòng, hay không làm gì. */
export function planRoomAction(prev: RoomSnapshot, next: RoomSnapshot): RoomAction {
  const want = wantedRoom(next);
  if (want) {
    const unchanged =
      prev.room_state === "booked" &&
      prev.room_id === want &&
      sameTime(prev.scheduled_at, next.scheduled_at) &&
      sameTime(prev.ends_at, next.ends_at);
    return unchanged ? { kind: "none" } : { kind: "upsert", roomId: want };
  }
  // Không còn cần phòng: chỉ trả khi trước đó có giữ/đang thử giữ phòng.
  return prev.room_state || prev.room_id ? { kind: "cancel" } : { kind: "none" };
}

/** Kiểm khung giờ trước khi gửi TDC (TDC cũng kiểm lại). Trả câu lỗi tiếng Việt hoặc null. */
export function roomTimeError(scheduledAt: string | null, endsAt: string | null, now = Date.now()): string | null {
  if (!scheduledAt) return "Chưa có giờ PV";
  if (!endsAt) return "Chọn giờ kết thúc để đặt phòng";
  const s = new Date(scheduledAt).getTime();
  const e = new Date(endsAt).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return "Giờ không hợp lệ";
  if (e <= s) return "Giờ kết thúc phải sau giờ bắt đầu";
  if (e - s > 24 * 3600_000) return "Khung giờ đặt phòng tối đa 24 tiếng";
  if (s < now - 5 * 60_000) return "Không đặt phòng cho giờ đã qua";
  return null;
}
