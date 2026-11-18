import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_ONBOARDING_TEMPLATE,
  ONBOARD_STAGES,
  canTickItem,
  dueReminders,
  isOnboardingEligible,
  itemsFromTemplate,
  onboardingCardState,
  onboardingProgress,
  prevWorkingDay,
  reminderDates,
  sanitizeOnboardingTemplate,
  setItemDone,
  shortDateVi,
  validateOnboardingTemplate,
} from "./hr-onboarding.ts";
import type { PermissionKey } from "./hr-permissions.ts";

// node --test src/lib/hr-onboarding.test.ts
test("DEFAULT: 9 mục, chỉ leader-guide cho Leader, 4/4/1 theo giai đoạn", () => {
  assert.equal(DEFAULT_ONBOARDING_TEMPLATE.length, 9);
  assert.deepEqual(DEFAULT_ONBOARDING_TEMPLATE.filter((x) => x.leader).map((x) => x.id), ["leader-guide"]);
  assert.deepEqual(ONBOARD_STAGES.map((s) => DEFAULT_ONBOARDING_TEMPLATE.filter((x) => x.stage === s).length), [4, 4, 1]);
  assert.equal(validateOnboardingTemplate(DEFAULT_ONBOARDING_TEMPLATE), null);
});
test("validate: rỗng / >30 / nhãn trống / nhãn >200 / id trùng → lỗi", () => {
  const one = DEFAULT_ONBOARDING_TEMPLATE[0];
  assert.ok(validateOnboardingTemplate([]));
  assert.ok(validateOnboardingTemplate(Array.from({ length: 31 }, (_, i) => ({ ...one, id: `x${i}` }))));
  assert.ok(validateOnboardingTemplate([{ ...one, label: "" }]));
  assert.ok(validateOnboardingTemplate([{ ...one, label: "a".repeat(201) }]));
  assert.ok(validateOnboardingTemplate([one, { ...one }]));
});
test("sanitize: stage sai bị bỏ, leader chỉ true mới true, id thiếu được sinh", () => {
  const r = sanitizeOnboardingTemplate([{ label: " A ", stage: "day1", leader: "yes" }, { label: "B", stage: "later" }, "x"]);
  assert.equal(r.length, 1);
  assert.equal(r[0].label, "A"); assert.equal(r[0].leader, false); assert.ok(r[0].id.length > 0);
});
test("eligible: accepted + không freelancer (null vẫn đủ)", () => {
  assert.equal(isOnboardingEligible({ offer_status: "accepted", work_type: null }), true);
  assert.equal(isOnboardingEligible({ offer_status: "accepted", work_type: "freelancer" }), false);
  assert.equal(isOnboardingEligible({ offer_status: "pending", work_type: "fulltime" }), false);
});
test("ngày: prevWorkingDay + reminderDates (T2 23/11/2026, T4 25/11)", () => {
  assert.equal(prevWorkingDay("2026-11-23"), "2026-11-20");
  assert.deepEqual(reminderDates("2026-11-23"), { before: "2026-11-20", day1: "2026-11-23", week1: "2026-11-27" });
  assert.equal(reminderDates("2026-11-25").week1, "2026-12-01");
});
test("dueReminders: trước 8:00 không gửi; đúng ngày mốc mới gửi; không gửi bù", () => {
  const items = itemsFromTemplate(DEFAULT_ONBOARDING_TEMPLATE);
  const base = { startDate: "2026-11-23", items, reminded: {} };
  assert.deepEqual(dueReminders({ ...base, todayVn: "2026-11-20", minutesVn: 7 * 60 + 59 }), []);
  assert.deepEqual(dueReminders({ ...base, todayVn: "2026-11-20", minutesVn: 8 * 60 }), ["before"]);
  assert.deepEqual(dueReminders({ ...base, todayVn: "2026-11-23", minutesVn: 600 }), ["day1"]);
  assert.deepEqual(dueReminders({ ...base, todayVn: "2026-11-24", minutesVn: 600 }), []); // day1 đã qua → bỏ
  assert.deepEqual(dueReminders({ ...base, startDate: null, todayVn: "2026-11-20", minutesVn: 600 }), []);
});
test("dueReminders: đã nhắc cho đúng ngày → thôi; đổi ngày đi làm → nhắc lại theo ngày mới", () => {
  const items = itemsFromTemplate(DEFAULT_ONBOARDING_TEMPLATE);
  const reminded = { before: { at: "x", for_date: "2026-11-23" } };
  assert.deepEqual(dueReminders({ startDate: "2026-11-23", items, reminded, todayVn: "2026-11-20", minutesVn: 600 }), []);
  assert.deepEqual(dueReminders({ startDate: "2026-11-24", items, reminded, todayVn: "2026-11-23", minutesVn: 600 }), ["before"]);
});
test("dueReminders: giai đoạn đã tích đủ → bỏ mốc đó", () => {
  let items = itemsFromTemplate(DEFAULT_ONBOARDING_TEMPLATE);
  for (const it of items.filter((x) => x.stage === "before")) items = setItemDone(items, it.id, true, { id: "u", name: "P" }, "t")!;
  assert.deepEqual(dueReminders({ startDate: "2026-11-23", items, reminded: {}, todayVn: "2026-11-20", minutesVn: 600 }), []);
});
test("setItemDone: chỉ đổi 1 mục, bỏ tích xoá người/giờ, id lạ → null", () => {
  const items = itemsFromTemplate(DEFAULT_ONBOARDING_TEMPLATE);
  const a = setItemDone(items, "welcome", true, { id: "u1", name: "Phương" }, "2026-11-23T02:00:00Z")!;
  assert.equal(a.find((x) => x.id === "welcome")!.done_by_name, "Phương");
  assert.equal(onboardingProgress(a).done, 1);
  const b = setItemDone(setItemDone(a, "contract", true, { id: "u2", name: "Thảo" }, "t2")!, "welcome", false, { id: "u1", name: "Phương" }, "t3")!;
  assert.equal(b.find((x) => x.id === "welcome")!.done_at, null);
  assert.equal(b.find((x) => x.id === "contract")!.done_by_name, "Thảo");
  assert.equal(setItemDone(items, "nope", true, { id: "u", name: "x" }, "t"), null);
});
test("canTickItem: boss/onboard.edit mọi mục; Leader chỉ mục leader của job mình", () => {
  const leaderItem = DEFAULT_ONBOARDING_TEMPLATE.find((x) => x.leader)!;
  const other = DEFAULT_ONBOARDING_TEMPLATE[0];
  const view = new Set(["onboard.view"] as PermissionKey[]);
  assert.equal(canTickItem({ role: "boss", perms: new Set(), isJobLeader: false, item: other }), true);
  assert.equal(canTickItem({ role: "hr", perms: new Set(["onboard.view", "onboard.edit"] as PermissionKey[]), isJobLeader: false, item: other }), true);
  assert.equal(canTickItem({ role: "leader", perms: view, isJobLeader: true, item: leaderItem }), true);
  assert.equal(canTickItem({ role: "leader", perms: view, isJobLeader: true, item: other }), false);
  assert.equal(canTickItem({ role: "leader", perms: view, isJobLeader: false, item: leaderItem }), false);
});
test("onboardingCardState: done / overdue sau week1 / active", () => {
  const items = itemsFromTemplate(DEFAULT_ONBOARDING_TEMPLATE);
  assert.equal(onboardingCardState({ startDate: "2026-11-23", items, todayVn: "2026-11-27" }), "active");
  assert.equal(onboardingCardState({ startDate: "2026-11-23", items, todayVn: "2026-11-30" }), "overdue");
  const all = items.reduce((acc, it) => setItemDone(acc, it.id, true, { id: "u", name: "x" }, "t")!, items);
  assert.equal(onboardingCardState({ startDate: "2026-11-23", items: all, todayVn: "2026-11-30" }), "done");
});
test("shortDateVi: thứ viết tắt + dd/mm; ngày sai → chuỗi rỗng", () => {
  assert.equal(shortDateVi("2026-11-23"), "T2 23/11");
  assert.equal(shortDateVi("2026-11-28"), "T7 28/11");
  assert.equal(shortDateVi("2026-11-29"), "CN 29/11");
  assert.equal(shortDateVi("2026-02-30"), "");
});
