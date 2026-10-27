// node --test src/lib/hr-comment-mentions.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  foldVi, mentionableUsers, splitMentions, filterMembers, keptMentionIds, relativeTimeVi, avatarColorIndex,
} from "./hr-comment-mentions.ts";

const statuses = [
  { key: "new", position: 10, kind: "open" as const },
  { key: "interview", position: 50, kind: "open" as const },
  { key: "offer", position: 60, kind: "won" as const },
  { key: "rejected", position: 70, kind: "lost" as const },
];
const users = [
  { id: "b", display_name: "Sếp", role: "boss" as const, disabled: false },
  { id: "h", display_name: "Phương", role: "hr" as const, disabled: false },
  { id: "l1", display_name: "Leader Một", role: "leader" as const, disabled: false },
  { id: "l2", display_name: "Leader Hai", role: "leader" as const, disabled: false },
  { id: "a", display_name: "Kế Toán", role: "accountant" as const, disabled: false },
  { id: "x", display_name: "Đã khoá", role: "hr" as const, disabled: true },
];

test("foldVi bỏ dấu, đ→d, hạ chữ", () => {
  assert.equal(foldVi("Toàn Đặng"), "toan dang");
});

test("mentionableUsers: boss+hr luôn; leader chỉ của job; kế toán theo phạm vi; bỏ khoá", () => {
  const ids = (app: { job_id: string; status: string; offer_status?: string | null }, lead: string | null) =>
    mentionableUsers(users, app, statuses, lead).map((u) => u.id);
  assert.deepEqual(ids({ job_id: "j", status: "new" }, "l1"), ["b", "h", "l1"]);
  assert.deepEqual(ids({ job_id: "j", status: "interview" }, null), ["b", "h", "a"]);
  assert.deepEqual(ids({ job_id: "j", status: "rejected", offer_status: "declined" }, "l2"), ["b", "h", "l2", "a"]);
  assert.deepEqual(ids({ job_id: "j", status: "rejected" }, null), ["b", "h"]);
});

test("filterMembers: bỏ dấu khi khớp", () => {
  const m = [{ id: "1", display_name: "Toàn Đặng" }, { id: "2", display_name: "Phương" }];
  assert.deepEqual(filterMembers(m, "toan").map((x) => x.id), ["1"]);
  assert.deepEqual(filterMembers(m, "").map((x) => x.id), ["1", "2"]);
  assert.deepEqual(filterMembers(m, "zzz"), []);
});

test("keptMentionIds: chỉ giữ id có @Tên còn trong nội dung, không trùng", () => {
  const m = [{ id: "1", display_name: "Toàn" }, { id: "2", display_name: "Phương" }];
  assert.deepEqual(keptMentionIds("ok @Toàn xem giúp @Toàn", ["1", "2", "1"], m), ["1"]);
  assert.deepEqual(keptMentionIds("không tag", ["1"], m), []);
});

test("splitMentions: tên dài trước, nhiều lần, không khớp giữa chữ", () => {
  assert.deepEqual(splitMentions("hi @An Binh và @An, @An", ["An", "An Binh"]), [
    { text: "hi " },
    { text: "@An Binh", mention: true },
    { text: " và " },
    { text: "@An", mention: true },
    { text: ", " },
    { text: "@An", mention: true },
  ]);
  assert.deepEqual(splitMentions("@Anh và mail a@An", ["An"]), [{ text: "@Anh và mail a@An" }]);
  assert.deepEqual(splitMentions("không có", []), [{ text: "không có" }]);
  assert.deepEqual(splitMentions("", ["An"]), []);
});

test("splitMentions: ký tự regex trong tên an toàn", () => {
  assert.deepEqual(splitMentions("@A.B x", ["A.B"]), [{ text: "@A.B", mention: true }, { text: " x" }]);
  assert.deepEqual(splitMentions("@AxB", ["A.B"]), [{ text: "@AxB" }]);
});

test("relativeTimeVi", () => {
  const now = new Date("2026-10-27T12:00:00+07:00").getTime();
  const ago = (ms: number) => new Date(now - ms).toISOString();
  assert.equal(relativeTimeVi(ago(20_000), now), "vừa xong");
  assert.equal(relativeTimeVi(ago(5 * 60_000), now), "5 phút trước");
  assert.equal(relativeTimeVi(ago(3 * 3600_000), now), "3 giờ trước");
  assert.equal(relativeTimeVi(ago(30 * 3600_000), now), "hôm qua");
  assert.equal(relativeTimeVi(ago(3 * 86400_000), now), "3 ngày trước");
  assert.equal(relativeTimeVi("2026-10-01T08:05:00+07:00", now), "01/10/2026 08:05");
});

test("avatarColorIndex ổn định, trong khoảng", () => {
  assert.equal(avatarColorIndex("abc", 8), avatarColorIndex("abc", 8));
  assert.ok(avatarColorIndex("Toàn", 8) >= 0 && avatarColorIndex("Toàn", 8) < 8);
});
