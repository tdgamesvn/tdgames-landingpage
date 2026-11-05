// node --test src/lib/chat.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  canSeeAudience,
  emptyThreadIds,
  classifyAudience,
  cleanText,
  hashToken,
  isSafeLink,
  isWithinHours,
  newToken,
  nextThreadState,
  parseQuickReply,
  requiresEmail,
  shouldEmail,
  shouldPush,
} from "./chat.ts";
import { effectivePermissions } from "./hr-permissions.ts";

const at = (iso: string) => new Date(iso);
const ago = (now: Date, min: number) => new Date(now.getTime() - min * 60_000);

test("isWithinHours: 8:00–22:00 giờ VN", () => {
  assert.equal(isWithinHours(at("2026-11-05T00:59:00Z")), false); // 07:59 VN
  assert.equal(isWithinHours(at("2026-11-05T01:00:00Z")), true); // 08:00
  assert.equal(isWithinHours(at("2026-11-05T14:59:00Z")), true); // 21:59
  assert.equal(isWithinHours(at("2026-11-05T15:00:00Z")), false); // 22:00
});

test("requiresEmail chỉ ngoài giờ và chưa có email", () => {
  assert.equal(requiresEmail(at("2026-11-05T01:00:00Z"), false), false);
  assert.equal(requiresEmail(at("2026-11-05T15:30:00Z"), false), true);
  assert.equal(requiresEmail(at("2026-11-05T15:30:00Z"), true), false);
});

test("classifyAudience", () => {
  assert.equal(classifyAudience({ page: "/careers/2d-artist" }), "candidate");
  assert.equal(classifyAudience({ page: "/services" }), "client");
  assert.equal(classifyAudience({ page: null }), "client");
  assert.equal(classifyAudience({ page: "/services", quickReplyAudience: "candidate" }), "candidate");
  assert.equal(classifyAudience({ page: "/careers", current: "client" }), "client");
  assert.equal(classifyAudience({ page: "/services", current: "client", quickReplyAudience: "candidate" }), "candidate");
});

test("nextThreadState: nút có sẵn không gọi người", () => {
  assert.deepEqual(nextThreadState({ status: "answered", needsHuman: false }, "quick_reply"), {
    status: "answered",
    needsHuman: false,
  });
  assert.deepEqual(nextThreadState({ status: "closed", needsHuman: false }, "quick_reply"), {
    status: "closed",
    needsHuman: false,
  });
  assert.deepEqual(nextThreadState({ status: "closed", needsHuman: false }, "visitor_text"), {
    status: "open",
    needsHuman: true,
  });
  assert.deepEqual(nextThreadState({ status: "open", needsHuman: false }, "talk_to_person"), {
    status: "open",
    needsHuman: true,
  });
  assert.deepEqual(nextThreadState({ status: "open", needsHuman: true }, "staff_reply"), {
    status: "answered",
    needsHuman: false,
  });
  assert.deepEqual(nextThreadState({ status: "open", needsHuman: true }, "close"), {
    status: "closed",
    needsHuman: false,
  });
});

test("shouldPush: 1 lần / 5 phút / luồng", () => {
  const now = at("2026-11-05T05:00:00Z");
  assert.equal(shouldPush({ wasNeedsHuman: false, isNeedsHuman: true, lastPushAt: ago(now, 1), now }), false);
  assert.equal(shouldPush({ wasNeedsHuman: false, isNeedsHuman: true, lastPushAt: ago(now, 6), now }), true);
  assert.equal(shouldPush({ wasNeedsHuman: false, isNeedsHuman: true, lastPushAt: null, now }), true);
  assert.equal(shouldPush({ wasNeedsHuman: true, isNeedsHuman: true, lastPushAt: ago(now, 2), now }), false);
  assert.equal(shouldPush({ wasNeedsHuman: true, isNeedsHuman: true, lastPushAt: ago(now, 6), now }), true);
  assert.equal(shouldPush({ wasNeedsHuman: true, isNeedsHuman: true, lastPushAt: null, now }), true);
  assert.equal(shouldPush({ wasNeedsHuman: false, isNeedsHuman: false, lastPushAt: null, now }), false);
});

test("shouldEmail: có email, khách rời ≥2 phút, mail trước ≥10 phút", () => {
  const now = at("2026-11-05T05:00:00Z");
  assert.equal(shouldEmail({ hasEmail: false, lastVisitorSeenAt: null, lastEmailAt: null, now }), false);
  assert.equal(shouldEmail({ hasEmail: true, lastVisitorSeenAt: ago(now, 1), lastEmailAt: null, now }), false);
  assert.equal(shouldEmail({ hasEmail: true, lastVisitorSeenAt: ago(now, 3), lastEmailAt: ago(now, 5), now }), false);
  assert.equal(shouldEmail({ hasEmail: true, lastVisitorSeenAt: ago(now, 3), lastEmailAt: ago(now, 11), now }), true);
  assert.equal(shouldEmail({ hasEmail: true, lastVisitorSeenAt: null, lastEmailAt: null, now }), true);
});

test("token ngẫu nhiên, hash sha256 hex", () => {
  const a = newToken();
  const b = newToken();
  assert.notEqual(a, b);
  assert.ok(a.length >= 43);
  assert.match(a, /^[A-Za-z0-9_-]+$/);
  assert.equal(hashToken(a).length, 64);
  assert.equal(hashToken(a), hashToken(a));
});

test("canSeeAudience theo quyền chat.*", () => {
  assert.equal(canSeeAudience(new Set(["chat.candidates"]), "client"), false);
  assert.equal(canSeeAudience(new Set(["chat.candidates"]), "candidate"), true);
  assert.equal(canSeeAudience(new Set(["chat.clients"]), "client"), true);
});

test("quyền chat mặc định: HR thấy ứng viên, không thấy khách; boss có đủ", () => {
  const hr = effectivePermissions("hr", []);
  assert.equal(hr.has("chat.candidates"), true);
  assert.equal(hr.has("chat.clients"), false);
  assert.equal(hr.has("chat.manage"), false);
  const leader = effectivePermissions("leader", []);
  assert.equal(leader.has("chat.candidates"), false);
  const boss = effectivePermissions("boss", []);
  assert.ok(boss.has("chat.clients") && boss.has("chat.candidates") && boss.has("chat.manage"));
});

test("cleanText", () => {
  assert.equal(cleanText("  a\u0000b \n", 10), "ab");
  assert.equal(cleanText("dòng 1\ndòng 2", 50), "dòng 1\ndòng 2");
  assert.equal(cleanText("   ", 10), null);
  assert.equal(cleanText(42, 10), null);
  assert.equal(cleanText("x".repeat(2500), 2000)?.length, 2000);
});

test("isSafeLink", () => {
  assert.equal(isSafeLink("/careers"), true);
  assert.equal(isSafeLink("https://tdgamestudio.com/contact"), true);
  assert.equal(isSafeLink("//evil.com"), false);
  assert.equal(isSafeLink("/\\evil.com"), false); // trình duyệt hiểu "/\" = "//"
  assert.equal(isSafeLink("javascript:alert(1)"), false);
  assert.equal(isSafeLink("http://x.com"), false);
  assert.equal(isSafeLink(""), false);
});

test("parseQuickReply: tạo mới cần đủ nhãn + câu trả lời; link phải an toàn", () => {
  assert.deepEqual(parseQuickReply({ label: "Q", answer: "A" }, true), {
    row: { label: "Q", answer: "A", audience: "any", link_label: null, link_url: null },
  });
  assert.ok("error" in parseQuickReply({ label: "", answer: "A" }, true));
  assert.ok("error" in parseQuickReply({ label: "Q" }, true));
  assert.ok("error" in parseQuickReply({ label: "x".repeat(61), answer: "A" }, true));
  assert.ok("error" in parseQuickReply({ label: "Q", answer: "A", linkUrl: "javascript:alert(1)", linkLabel: "x" }, true));
  assert.ok("error" in parseQuickReply({ label: "Q", answer: "A", linkUrl: "/careers" }, true)); // thiếu nhãn link
  assert.ok("error" in parseQuickReply({ label: "Q", answer: "A", audience: "boss" }, true));
  const r = parseQuickReply({ label: "Q", answer: "A", audience: "candidate", linkUrl: "/careers", linkLabel: "Jobs", sortOrder: 5, active: false }, true);
  assert.deepEqual(r, {
    row: { label: "Q", answer: "A", audience: "candidate", link_label: "Jobs", link_url: "/careers", sort_order: 5, active: false },
  });
});

test("parseQuickReply: sửa — chỉ trường gửi lên", () => {
  assert.deepEqual(parseQuickReply({ active: false }, false), { row: { active: false } });
  assert.deepEqual(parseQuickReply({ sortOrder: 20 }, false), { row: { sort_order: 20 } });
  assert.deepEqual(parseQuickReply({ linkUrl: "", linkLabel: "" }, false), { row: { link_url: null, link_label: null } });
  assert.ok("error" in parseQuickReply({}, false));
});

test("emptyThreadIds: chỉ luồng có count 0; thiếu count / lỗi → không xoá gì (C1)", () => {
  assert.deepEqual(
    emptyThreadIds([
      { id: "a", chat_messages: [{ count: 0 }] },
      { id: "b", chat_messages: [{ count: 3 }] },
    ]),
    ["a"],
  );
  assert.deepEqual(emptyThreadIds([{ id: "a", chat_messages: [{ count: 0 }] }, { id: "b" }]), []);
  assert.deepEqual(emptyThreadIds([{ id: "a", chat_messages: [] }]), []);
  assert.deepEqual(emptyThreadIds(null), []);
});
