// node --test src/lib/tdc-room-plan.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { defaultEndsAt, planRoomAction, roomTimeError, type RoomSnapshot } from "./tdc-room-plan.ts";

const A = "2026-12-01T03:30:00.000Z";
const B = "2026-12-01T04:30:00.000Z";
const none: RoomSnapshot = { scheduled_at: null, ends_at: null, mode: null, room_id: null, room_state: null };
const booked: RoomSnapshot = { scheduled_at: A, ends_at: B, mode: "offline", room_id: "r1", room_state: "booked" };

test("lịch mới chọn phòng → đặt", () => {
  assert.deepEqual(planRoomAction(none, { ...booked, room_state: null }), { kind: "upsert", roomId: "r1" });
});

test("không đổi gì → không gọi TDC", () => {
  assert.deepEqual(planRoomAction(booked, { ...booked, scheduled_at: "2026-12-01T03:30:00Z" }), { kind: "none" });
});

test("đổi giờ / đổi giờ kết thúc / đổi phòng → sửa booking", () => {
  assert.equal(planRoomAction(booked, { ...booked, scheduled_at: "2026-12-01T05:00:00Z", ends_at: "2026-12-01T06:00:00Z" }).kind, "upsert");
  assert.equal(planRoomAction(booked, { ...booked, ends_at: "2026-12-01T05:00:00Z" }).kind, "upsert");
  assert.deepEqual(planRoomAction(booked, { ...booked, room_id: "r2" }), { kind: "upsert", roomId: "r2" });
});

test("lỗi lần trước → lưu lại thì thử đặt lại", () => {
  assert.equal(planRoomAction({ ...booked, room_state: "error" }, { ...booked, room_state: "error" }).kind, "upsert");
});

test("chuyển online / huỷ lịch / bỏ chọn phòng → trả phòng", () => {
  assert.equal(planRoomAction(booked, { ...booked, mode: "online", room_id: null }).kind, "cancel");
  assert.equal(planRoomAction(booked, { ...booked, mode: "online" }).kind, "cancel");
  assert.equal(planRoomAction(booked, none).kind, "cancel");
  assert.equal(planRoomAction(booked, { ...booked, room_id: null }).kind, "cancel");
  assert.equal(planRoomAction({ ...booked, room_state: "cancel_error", room_id: null }, none).kind, "cancel");
});

test("chưa từng có phòng → không gọi TDC", () => {
  assert.equal(planRoomAction(none, { ...booked, room_id: null, room_state: null }).kind, "none");
  assert.equal(planRoomAction(none, none).kind, "none");
});

test("kiểm khung giờ", () => {
  const now = new Date("2026-12-01T00:00:00Z").getTime();
  assert.equal(roomTimeError(A, B, now), null);
  assert.match(roomTimeError(A, null, now)!, /kết thúc/);
  assert.match(roomTimeError(B, A, now)!, /sau giờ bắt đầu/);
  assert.match(roomTimeError(A, "2026-12-02T05:00:00Z", now)!, /24/);
  assert.match(roomTimeError(A, B, new Date("2026-12-01T05:00:00Z").getTime())!, /đã qua/);
  assert.equal(defaultEndsAt(A), B);
});
