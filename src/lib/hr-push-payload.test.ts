// node --test src/lib/hr-push-payload.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { interviewReminderPayload, isPushSubscriptionInput, mentionPayload } from "./hr-push-payload.ts";

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

test("chỉ nhận endpoint của dịch vụ push chính thức (chặn SSRF)", () => {
  const keys = { p256dh: "a", auth: "b" };
  for (const endpoint of [
    "https://fcm.googleapis.com/fcm/send/abc",
    "https://web.push.apple.com/QGx",
    "https://updates.push.services.mozilla.com/wpush/v2/x",
    "https://wns2-par02p.notify.windows.com/w/?token=x",
  ]) {
    assert.equal(isPushSubscriptionInput({ endpoint, keys }), true, endpoint);
  }
  for (const endpoint of [
    "https://evil.com/x",
    "https://127.0.0.1/x",
    "https://169.254.169.254/latest",
    "https://fcm.googleapis.com.evil.com/x",
    "https://evilfcm.googleapis.com@evil.com/x",
    "https://localhost:3000/api",
  ]) {
    assert.equal(isPushSubscriptionInput({ endpoint, keys }), false, endpoint);
  }
});

test("mentionPayload: tiêu đề, body cắt 120, url, tag", () => {
  const p = mentionPayload({ authorName: "Toàn", candidateName: "Nguyễn A", content: "x".repeat(300), commentId: "c1", applicationId: "a1" });
  assert.equal(p.title, "💬 Toàn nhắc bạn");
  assert.ok(p.body.startsWith("Nguyễn A: xxx"));
  assert.equal(p.body.length, "Nguyễn A: ".length + 120);
  assert.ok(p.body.endsWith("…"));
  assert.equal(p.url, "/hr");
  assert.equal(p.tag, "hr-mention-c1");
  assert.equal(mentionPayload({ authorName: "T", candidateName: "N", content: "ngắn", commentId: "c", applicationId: "a" }).body, "N: ngắn");
});

test("mentionPayload: cắt theo code point, không làm vỡ emoji", () => {
  const p = mentionPayload({ authorName: "T", candidateName: "N", content: "😀".repeat(200), commentId: "c", applicationId: "a" });
  assert.equal(p.body, `N: ${"😀".repeat(119)}…`);
});

test("candidatePushPayload: tag hr-<event>-<appId>, url /hr, tiếng Việt ngắn", async () => {
  const { candidatePushPayload } = await import("./hr-push-payload.ts");
  const c = candidatePushPayload({ event: "comment", appId: "a1", candidateName: "Nguyễn A", actorName: "Toàn", text: "ok" });
  assert.equal(c.tag, "hr-comment-a1");
  assert.equal(c.url, "/hr");
  assert.equal(c.title, "💬 Toàn bình luận — Nguyễn A");
  assert.equal(c.body, "ok");

  const s = candidatePushPayload({ event: "status", appId: "a1", candidateName: "Nguyễn A", actorName: "Toàn", text: "Interview → Offer" });
  assert.equal(s.tag, "hr-status-a1");
  assert.ok(s.title.includes("Nguyễn A"));
  assert.ok(s.body.includes("Interview → Offer"));

  const n = candidatePushPayload({ event: "new_application", appId: "a2", candidateName: "B", jobTitle: "Spine Animator" });
  assert.equal(n.tag, "hr-new_application-a2");
  assert.ok(n.title.includes("B"));
  assert.ok(n.body.includes("Spine Animator"));

  const g = candidatePushPayload({ event: "assigned", appId: "a3", candidateName: "C", actorName: "Sếp", jobTitle: "2D Artist" });
  assert.equal(g.title, "👤 Sếp giao hồ sơ C cho bạn");
  assert.equal(g.tag, "hr-assigned-a3");
  const g2 = candidatePushPayload({ event: "assigned", appId: "a3", candidateName: "C", actorName: "Sếp", assigneeName: "Dung" });
  assert.equal(g2.title, "👤 Sếp giao hồ sơ C cho Dung");
});

test("candidatePushPayload: không có actor / job → không lộ undefined/null; body cắt 160 ký tự", async () => {
  const { candidatePushPayload } = await import("./hr-push-payload.ts");
  for (const event of ["comment", "note", "status", "test_review", "test_submitted", "new_application", "interview_schedule", "assigned"] as const) {
    const p = candidatePushPayload({ event, appId: "x", candidateName: "N" });
    assert.ok(!/undefined|null/.test(p.title + p.body), event);
    assert.ok(p.title.length > 0, event);
  }
  const long = candidatePushPayload({ event: "note", appId: "x", candidateName: "N", actorName: "T", text: "😀".repeat(300) });
  assert.equal(Array.from(long.body).length, 160);
  assert.ok(long.body.endsWith("…"));
});
