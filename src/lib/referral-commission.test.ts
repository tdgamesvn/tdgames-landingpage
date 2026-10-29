// node --test src/lib/referral-commission.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_RULES,
  addMonthsClamped,
  computeAmount,
  effectiveStatus,
  parseDefaultRules,
  parseRule,
  splitSchedule,
  type CommissionRule,
} from "./referral-commission.ts";

test("addMonthsClamped: kẹp cuối tháng, nhuận, qua năm", () => {
  assert.equal(addMonthsClamped("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonthsClamped("2028-01-31", 1), "2028-02-29");
  assert.equal(addMonthsClamped("2026-10-31", 1), "2026-11-30");
  assert.equal(addMonthsClamped("2026-12-31", 2), "2027-02-28");
  assert.equal(addMonthsClamped("2026-03-15", 0), "2026-03-15");
});
test("splitSchedule: làm tròn xuống, dư vào mốc cuối, sắp theo months", () => {
  assert.deepEqual(splitSchedule(2_000_000, DEFAULT_RULES.internal!.schedule).map((s) => s.amount), [1_000_000, 1_000_000]);
  assert.deepEqual(splitSchedule(1_000_001, [{ months: 2, percent: 50 }, { months: 1, percent: 50 }]),
    [{ months: 1, percent: 50, amount: 500_000 }, { months: 2, percent: 50, amount: 500_001 }]);
  assert.deepEqual(splitSchedule(10, [{ months: 0, percent: 33 }, { months: 1, percent: 33 }, { months: 2, percent: 34 }]).map((s) => s.amount), [3, 3, 4]);
  assert.deepEqual(splitSchedule(null, [{ months: 0, percent: 100 }]), [{ months: 0, percent: 100, amount: null }]);
});
test("computeAmount", () => {
  assert.deepEqual(computeAmount(DEFAULT_RULES.internal, null), { amount: 2_000_000, issue: null });
  const sm = (m: number): CommissionRule => ({ amount: { type: "salary_multiple", multiple: m }, schedule: [{ months: 2, percent: 100 }] });
  assert.deepEqual(computeAmount(sm(1), 15_000_000), { amount: 15_000_000, issue: null });
  assert.deepEqual(computeAmount(sm(0.5), 15_000_001), { amount: 7_500_000, issue: null });
  assert.deepEqual(computeAmount(sm(1), null), { amount: null, issue: "no_salary" });
  assert.deepEqual(computeAmount(null, 15_000_000), { amount: null, issue: "no_rule" });
});
test("parseRule: hợp lệ + lỗi", () => {
  assert.deepEqual(parseRule({ amount: { type: "fixed", vnd: 3_000_000 }, schedule: [{ months: 2, percent: 50 }, { months: 0, percent: 50 }] }),
    { amount: { type: "fixed", vnd: 3_000_000 }, schedule: [{ months: 0, percent: 50 }, { months: 2, percent: 50 }] });
  const bad = (schedule: unknown, amount: unknown = { type: "fixed", vnd: 1 }) => "error" in (parseRule({ amount, schedule }) as object);
  assert.ok(bad([{ months: 1, percent: 90 }]));                                   // tổng ≠ 100
  assert.ok(bad([{ months: 1, percent: 50.5 }, { months: 2, percent: 49.5 }]));   // % không nguyên
  assert.ok(bad([{ months: 1, percent: 50 }, { months: 1, percent: 50 }]));       // trùng mốc
  assert.ok(bad([{ months: -1, percent: 100 }]));
  assert.ok(bad([{ months: 1, percent: 100 }], { type: "fixed", vnd: 0 }));
  assert.ok(bad([{ months: 1, percent: 100 }], { type: "salary_multiple", multiple: 0 }));
});
test("effectiveStatus: upcoming tới hạn (≤ hôm nay) → due", () => {
  assert.equal(effectiveStatus({ status: "upcoming", due_date: "2026-11-29" }, "2026-11-29"), "due");
  assert.equal(effectiveStatus({ status: "upcoming", due_date: "2026-11-30" }, "2026-11-29"), "upcoming");
  assert.equal(effectiveStatus({ status: "upcoming", due_date: null }, "2030-01-01"), "upcoming");
  assert.equal(effectiveStatus({ status: "paid", due_date: "2026-01-01" }, "2026-11-29"), "paid");
});
test("parseDefaultRules: null/hỏng → mặc định", () => {
  assert.deepEqual(parseDefaultRules(null), DEFAULT_RULES);
  assert.equal(parseDefaultRules({ internal: { amount: { type: "fixed", vnd: 5 } } }).internal, DEFAULT_RULES.internal);
});
