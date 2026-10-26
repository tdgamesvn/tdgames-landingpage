// node --test src/lib/hr-push-payload.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { interviewReminderPayload, isPushSubscriptionInput } from "./hr-push-payload.ts";

const base = {
  candidateName: "Nguyễn Văn A",
  jobTitle: "Spine Animator",
  roundTitle: "Vòng 1",
  scheduledAt: "2026-10-19T08:30:00.000Z",
  minutes: 45,
  interviewId: "iv-1",
  applicationId: "app-1",
};

test("nhắc PV online: tên, số phút, giờ VN, Meet", () => {
  const p = interviewReminderPayload({ ...base, mode: "online", meetUrl: "https://meet.google.com/abc-defg-hij" });
  assert.equal(p.title, "⏰ Sắp PV — Nguyễn Văn A (~45 phút)");
  assert.ok(p.body.includes("15:30 T2 19/10"));
  assert.ok(p.body.includes("Spine Animator"));
  assert.ok(p.body.includes("Online"));
  assert.equal(p.url, "/hr");
  assert.equal(p.tag, "interview-iv-1");
});

test("nhắc PV offline: ghi tại văn phòng, không có undefined/null", () => {
  const p = interviewReminderPayload({ ...base, mode: "offline", meetUrl: null });
  assert.ok(p.body.includes("văn phòng"));
  assert.ok(!/undefined|null/.test(p.title + p.body));
});

test("isPushSubscriptionInput chỉ nhận endpoint https + đủ khoá", () => {
  const ok = { endpoint: "https://fcm.googleapis.com/fcm/send/x", keys: { p256dh: "a", auth: "b" } };
  assert.equal(isPushSubscriptionInput(ok), true);
  assert.equal(isPushSubscriptionInput({ ...ok, endpoint: "http://evil/x" }), false);
  assert.equal(isPushSubscriptionInput({ ...ok, keys: { p256dh: "a" } }), false);
  assert.equal(isPushSubscriptionInput(null), false);
  assert.equal(isPushSubscriptionInput("x"), false);
});
