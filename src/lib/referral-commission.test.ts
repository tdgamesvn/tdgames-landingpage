// node --test src/lib/referral-commission.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_RULES,
  addMonthsClamped,
  cancelOnLeave,
  cancellableIds,
  offerTransition,
  planPayouts,
  rescheduleDueDates,
  type PayoutLite,
  approvedBaseSalary,
  isCommissionable,
  pickRule,
  resolveBeneficiary,
  unknownRefCodes,
  type ReferrerLite,
  type StaffLite,
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

const staff: StaffLite[] = [
  { id: "u-thao", role: "accountant", display_name: "Thảo", ref_codes: ["thaodtx"] },
  { id: "u-phuong", role: "hr", display_name: "Phương", ref_codes: ["phuongntm"] },
  { id: "u-toan", role: "boss", display_name: "Toàn", ref_codes: ["toandt"] },
];
const refs: ReferrerLite[] = [
  { id: "r-maiha", name: "Mai Hà", kind: "external", ref_codes: ["mai-ha", "mai-ha-headhunt"], hr_user_id: null, active: true, rule: null },
  { id: "r-cat", name: "Cát Tường", kind: null, ref_codes: ["cat-tuong"], hr_user_id: null, active: true, rule: null },
  { id: "r-van", name: "Thuỳ Vân", kind: "external", ref_codes: ["thuy-van"], hr_user_id: null, active: false, rule: null },
];

test("resolveBeneficiary", () => {
  assert.deepEqual(resolveBeneficiary("thaodtx", staff, refs), { referrerId: null, hrUserId: "u-thao", name: "Thảo", kind: "internal", override: null });
  assert.equal(resolveBeneficiary("phuongntm", staff, refs), null);
  assert.equal(resolveBeneficiary("toandt", staff, refs), null);
  assert.equal(resolveBeneficiary("Mai Ha Headhunt", staff, refs)?.referrerId, "r-maiha");
  assert.equal(resolveBeneficiary("thuy-van", staff, refs), null);           // ngừng hoạt động
  assert.equal(resolveBeneficiary("cat-tuong", staff, refs)?.kind, null);    // chưa phân loại
  assert.equal(resolveBeneficiary("khong-ai", staff, refs), null);
  const own: CommissionRule = { amount: { type: "fixed", vnd: 500_000 }, schedule: [{ months: 0, percent: 100 }] };
  const linked: ReferrerLite[] = [...refs, { id: "r-ph", name: "Phương", kind: null, ref_codes: [], hr_user_id: "u-phuong", active: true, rule: own }];
  assert.deepEqual(resolveBeneficiary("phuongntm", staff, linked), { referrerId: "r-ph", hrUserId: "u-phuong", name: "Phương", kind: "internal", override: own });
});
test("pickRule: ghi đè người > job > mặc định; chưa phân loại → null", () => {
  const job: CommissionRule = { amount: { type: "salary_multiple", multiple: 1 }, schedule: [{ months: 2, percent: 100 }] };
  const ext = { referrerId: "r-maiha", hrUserId: null, name: "Mai Hà", kind: "external" as const, override: null };
  assert.deepEqual(pickRule(ext, { external: job }, DEFAULT_RULES), { rule: job, source: "job" });
  assert.deepEqual(pickRule(ext, {}, DEFAULT_RULES), { rule: null, source: null });
  assert.deepEqual(pickRule({ ...ext, kind: "internal" }, {}, DEFAULT_RULES), { rule: DEFAULT_RULES.internal, source: "default" });
  assert.equal(pickRule({ ...ext, override: job }, {}, DEFAULT_RULES).source, "override");
  assert.deepEqual(pickRule({ ...ext, kind: null }, { external: job }, DEFAULT_RULES), { rule: null, source: null });
});
test("isCommissionable + approvedBaseSalary", () => {
  assert.equal(isCommissionable({ offer_status: "accepted", work_type: "fulltime" }), true);
  assert.equal(isCommissionable({ offer_status: "accepted", work_type: "freelancer" }), false);
  assert.equal(isCommissionable({ offer_status: "pending", work_type: "fulltime" }), false);
  assert.equal(approvedBaseSalary({ data: { baseSalary: 15_000_000 }, approval: { status: "approved" } }), 15_000_000);
  assert.equal(approvedBaseSalary({ data: { baseSalary: 15_000_000 }, approval: { status: "pending" } }), null);
  assert.equal(approvedBaseSalary(null), null);
});
test("unknownRefCodes: bỏ mã tài khoản + mã referrer (kể cả ngừng), gộp sau normalize", () => {
  assert.deepEqual(unknownRefCodes(["cat-tuong", "thaodtx", "dieu-anh", "Dieu Anh", null, "thuy-van", "freelancer"], staff, refs.filter((r) => r.id !== "r-cat")),
    [{ code: "dieu-anh", count: 2 }, { code: "cat-tuong", count: 1 }, { code: "freelancer", count: 1 }]);
});

const R = DEFAULT_RULES.internal!;
test("planPayouts: sinh 2 mốc theo ngày đi làm", () => {
  assert.deepEqual(planPayouts({ existing: [], rule: R, baseSalary: null, startDate: "2026-01-31", leftDate: null, replaceOpen: false }).inserts, [
    { milestone_months: 1, percent: 50, amount: 1_000_000, amount_issue: null, due_date: "2026-02-28" },
    { milestone_months: 2, percent: 50, amount: 1_000_000, amount_issue: null, due_date: "2026-03-31" }]);
});
test("planPayouts: nhận lại offer — không trùng mốc đã trả/đã duyệt, mốc đã huỷ được sinh lại", () => {
  const existing: PayoutLite[] = [{ id: "a", milestone_months: 1, status: "paid", due_date: "2026-02-28" }, { id: "b", milestone_months: 2, status: "cancelled", due_date: "2026-03-31" }];
  const r = planPayouts({ existing, rule: R, baseSalary: null, startDate: "2026-01-31", leftDate: null, replaceOpen: false });
  assert.deepEqual(r.deleteIds, []);
  assert.deepEqual(r.inserts.map((x) => x.milestone_months), [2]);
});
test("planPayouts: không quy tắc → 1 dòng Chưa đặt mức; thiếu ngày → due_date null; thiếu lương", () => {
  assert.deepEqual(planPayouts({ existing: [], rule: null, baseSalary: null, startDate: null, leftDate: null, replaceOpen: false }).inserts,
    [{ milestone_months: 0, percent: 100, amount: null, amount_issue: "no_rule", due_date: null }]);
  const sm: CommissionRule = { amount: { type: "salary_multiple", multiple: 1 }, schedule: [{ months: 2, percent: 100 }] };
  assert.equal(planPayouts({ existing: [], rule: sm, baseSalary: null, startDate: "2026-11-02", leftDate: null, replaceOpen: false }).inserts[0].amount_issue, "no_salary");
});
test("planPayouts: Tính lại xoá upcoming/due, giữ approved/paid; bỏ mốc sau ngày nghỉ", () => {
  const existing: PayoutLite[] = [{ id: "p", milestone_months: 0, status: "upcoming", due_date: null }, { id: "q", milestone_months: 1, status: "approved", due_date: "2026-02-28" }];
  const r = planPayouts({ existing, rule: R, baseSalary: null, startDate: "2026-01-31", leftDate: "2026-03-30", replaceOpen: true });
  assert.deepEqual(r.deleteIds, ["p"]);
  assert.deepEqual(r.inserts, []);   // mốc 1 đã approved; mốc 2 (31/3) sau ngày nghỉ 30/3
});
test("cancelOnLeave: nghỉ đúng ngày đến hạn vẫn giữ; không đụng paid/cancelled/chưa có ngày", () => {
  const ps: PayoutLite[] = [
    { id: "m1", milestone_months: 1, status: "due", due_date: "2026-02-28" },
    { id: "m2", milestone_months: 2, status: "upcoming", due_date: "2026-03-31" },
    { id: "m3", milestone_months: 3, status: "paid", due_date: "2026-04-30" },
    { id: "m4", milestone_months: 4, status: "upcoming", due_date: null }];
  assert.deepEqual(cancelOnLeave(ps, "2026-02-28"), ["m2"]);
  assert.deepEqual(cancellableIds(ps), ["m1", "m2", "m4"]);
});
test("rescheduleDueDates: chỉ upcoming/due, chỉ dòng đổi ngày", () => {
  const ps: PayoutLite[] = [{ id: "x", milestone_months: 1, status: "upcoming", due_date: null }, { id: "y", milestone_months: 2, status: "approved", due_date: "2026-03-31" }];
  assert.deepEqual(rescheduleDueDates(ps, "2026-01-31"), [{ id: "x", due_date: "2026-02-28" }]);
});
test("offerTransition", () => {
  assert.equal(offerTransition("pending", "accepted"), "generate");
  assert.equal(offerTransition(null, "accepted"), "generate");
  assert.equal(offerTransition("accepted", "declined"), "cancel");
  assert.equal(offerTransition("accepted", null), "cancel");
  assert.equal(offerTransition("accepted", "accepted"), null);
  assert.equal(offerTransition("pending", "declined"), null);
});
