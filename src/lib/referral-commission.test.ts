// node --test src/lib/referral-commission.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { effectivePermissions, HR_ROLES } from "./hr-permissions.ts";
import type { RecipientStaff } from "./hr-notify-recipients.ts";
import {
  DEFAULT_RULES,
  checkPayoutAction,
  parsePayoutAction,
  parseReferrerInput,
  type ReferrerInput,
  addMonthsClamped,
  filterPayouts,
  hasLockedPayout,
  referrerAuditEntries,
  bankChangedRecent,
  referrerTotals,
  parseAppReferralPatch,
  payoutNeedsAttention,
  cancelOnLeave,
  cancellableIds,
  autoCancelIds,
  offerTransition,
  planPayouts,
  ruleKey,
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
  referralNotifyTargets,
  parseRule,
  splitSchedule,
  statusAfterDueEdit,
  statusAfterPayoutEdit,
  isSelfPayout,
  SELF_PAYOUT_MSG,
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
  const k = ruleKey(R);
  assert.deepEqual(planPayouts({ existing: [], rule: R, baseSalary: null, startDate: "2026-01-31", leftDate: null, replaceOpen: false }).inserts, [
    { milestone_months: 1, percent: 50, amount: 1_000_000, amount_issue: null, due_date: "2026-02-28", rule_key: k },
    { milestone_months: 2, percent: 50, amount: 1_000_000, amount_issue: null, due_date: "2026-03-31", rule_key: k }]);
});
test("planPayouts: nhận lại offer — không trùng mốc đã trả/đã duyệt, mốc đã huỷ được sinh lại", () => {
  const existing: PayoutLite[] = [{ id: "a", milestone_months: 1, status: "paid", due_date: "2026-02-28", rule_key: ruleKey(R) }, { id: "b", milestone_months: 2, status: "cancelled", due_date: "2026-03-31" }];
  const r = planPayouts({ existing, rule: R, baseSalary: null, startDate: "2026-01-31", leftDate: null, replaceOpen: false });
  assert.deepEqual(r.deleteIds, []);
  assert.deepEqual(r.inserts.map((x) => x.milestone_months), [2]);
});
test("planPayouts: không quy tắc → 1 dòng Chưa đặt mức; thiếu ngày → due_date null; thiếu lương", () => {
  assert.deepEqual(planPayouts({ existing: [], rule: null, baseSalary: null, startDate: null, leftDate: null, replaceOpen: false }).inserts,
    [{ milestone_months: 0, percent: 100, amount: null, amount_issue: "no_rule", due_date: null, rule_key: null }]);
  const sm: CommissionRule = { amount: { type: "salary_multiple", multiple: 1 }, schedule: [{ months: 2, percent: 100 }] };
  assert.equal(planPayouts({ existing: [], rule: sm, baseSalary: null, startDate: "2026-11-02", leftDate: null, replaceOpen: false }).inserts[0].amount_issue, "no_salary");
});
test("planPayouts: Tính lại xoá upcoming/due, giữ approved/paid; bỏ mốc sau ngày nghỉ", () => {
  const existing: PayoutLite[] = [{ id: "p", milestone_months: 0, status: "upcoming", due_date: null }, { id: "q", milestone_months: 1, status: "approved", due_date: "2026-02-28", rule_key: ruleKey(R) }];
  const r = planPayouts({ existing, rule: R, baseSalary: null, startDate: "2026-01-31", leftDate: "2026-03-30", replaceOpen: true });
  assert.deepEqual(r.deleteIds, ["p"]);
  assert.deepEqual(r.inserts, []);
  assert.equal(r.needsManual, false);   // mốc 1 đã approved; mốc 2 (31/3) sau ngày nghỉ 30/3
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

const HR = effectivePermissions("hr", []), ACC = effectivePermissions("accountant", []);
const due = { status: "upcoming" as const, due_date: "2026-11-01", amount: 1_000_000 };
test("checkPayoutAction", () => {
  assert.equal(checkPayoutAction(HR, due, { action: "approve" }, "2026-11-01", true), null);
  assert.ok(checkPayoutAction(ACC, due, { action: "approve" }, "2026-11-01", true));                       // Kế toán không xác nhận còn làm
  assert.ok(checkPayoutAction(HR, { ...due, due_date: "2026-12-01" }, { action: "approve" }, "2026-11-01", true)); // chưa đến hạn
  assert.ok(checkPayoutAction(HR, { ...due, amount: null }, { action: "approve" }, "2026-11-01", true));   // Chưa đặt mức
  assert.ok(checkPayoutAction(HR, { ...due, status: "approved" }, { action: "pay", paid_date: "2026-11-01" }, "2026-11-01", true));
  assert.equal(checkPayoutAction(ACC, { ...due, status: "approved" }, { action: "pay", paid_date: "2026-11-01" }, "2026-11-01", true), null);
  assert.ok(checkPayoutAction(ACC, { ...due, status: "approved" }, { action: "pay", paid_date: "2026-11-02" }, "2026-11-01", true)); // ngày tương lai
  assert.ok(checkPayoutAction(ACC, { ...due, status: "paid" }, { action: "edit", amount: 5 }, "2026-11-01", true));
  assert.equal(checkPayoutAction(ACC, { ...due, status: "paid" }, { action: "edit", note: "CK lần 2" }, "2026-11-01", true), null);
  assert.ok(checkPayoutAction(HR, { ...due, status: "paid" }, { action: "cancel", reason: "x" }, "2026-11-01", true));
  assert.ok(checkPayoutAction(HR, due, { action: "edit", amount: 5 }, "2026-11-01", true));                  // HR không sửa tiền
});
test("parsePayoutAction", () => {
  assert.ok("error" in parsePayoutAction({ action: "cancel", reason: "  " }));
  assert.ok("error" in parsePayoutAction({ action: "edit", amount: 1.5 }));
  assert.ok("error" in parsePayoutAction({ action: "pay", paid_date: "2026-02-30" }));
  assert.deepEqual(parsePayoutAction({ action: "approve", x: 1 }), { action: "approve" });
});
test("parseReferrerInput: trùng mã tài khoản/referrer → 409; gắn tài khoản không có mã riêng", () => {
  const base = { name: "Cát Tường", kind: "external", ref_codes: ["cat-tuong"] };
  assert.equal((parseReferrerInput({ ...base, ref_codes: ["ThaoDTX"] }, { staff, referrers: refs, selfId: null , actorIsBoss: true }) as { status: number }).status, 409);
  assert.equal((parseReferrerInput({ ...base, ref_codes: ["mai-ha"] }, { staff, referrers: refs, selfId: null , actorIsBoss: true }) as { status: number }).status, 409);
  assert.equal((parseReferrerInput({ ...base, ref_codes: ["cat-tuong"] }, { staff, referrers: refs, selfId: "r-cat" , actorIsBoss: true }) as ReferrerInput).ref_codes[0], "cat-tuong");
  assert.equal((parseReferrerInput({ name: "Phương", kind: "internal", ref_codes: ["x"], hr_user_id: "u-phuong" }, { staff, referrers: refs, selfId: null , actorIsBoss: true }) as { status: number }).status, 400);
  assert.equal((parseReferrerInput({ name: "", ref_codes: ["a"] }, { staff, referrers: refs, selfId: null , actorIsBoss: true }) as { status: number }).status, 400);
  assert.equal((parseReferrerInput({ name: "A", ref_codes: [] }, { staff, referrers: refs, selfId: null , actorIsBoss: true }) as { status: number }).status, 400); // không gắn tài khoản thì phải có ≥1 mã
});

test("computeAmount: số nguyên, không hụt 1 đồng do float", () => {
  const sm = (m: number): CommissionRule => ({ amount: { type: "salary_multiple", multiple: m }, schedule: [{ months: 2, percent: 100 }] });
  assert.equal(computeAmount(sm(0.29), 12_500_000).amount, 3_625_000);
  assert.equal(computeAmount(sm(0.41), 10_000_000).amount, 4_100_000);
  for (let c = 1; c <= 300; c++) {
    const exact = Number((BigInt(c) * BigInt(12_500_000)) / BigInt(100));
    assert.equal(computeAmount(sm(c / 100), 12_500_000).amount, exact, `multiple ${c / 100}`);
  }
});
test("addMonthsClamped: input sai định dạng → null", () => {
  assert.equal(addMonthsClamped("2026-01-31T00:00:00Z", 1), null);
  assert.equal(addMonthsClamped("2026-02-30", 1), null);
  assert.equal(addMonthsClamped("abc", 1), null);
});
test("planPayouts: placeholder đã trả → Tính lại không sinh, cần xử lý tay", () => {
  const existing: PayoutLite[] = [{ id: "ph", milestone_months: 0, status: "paid", due_date: null, rule_key: null, amount_issue: "no_rule", amount_edited: true }];
  const r = planPayouts({ existing, rule: R, baseSalary: null, startDate: "2026-01-31", leftDate: null, replaceOpen: true });
  assert.deepEqual(r.inserts, []);
  assert.equal(r.needsManual, true);
});
test("planPayouts: quy tắc đổi sau khi đã trả mốc 1 → không sinh, cần xử lý tay", () => {
  const existing: PayoutLite[] = [{ id: "a", milestone_months: 1, status: "paid", due_date: "2026-02-28", rule_key: ruleKey(R) }];
  const nu: CommissionRule = { amount: { type: "fixed", vnd: 3_000_000 }, schedule: [{ months: 2, percent: 100 }] };
  const r = planPayouts({ existing, rule: nu, baseSalary: null, startDate: "2026-01-31", leftDate: null, replaceOpen: false });
  assert.deepEqual(r.inserts, []);
  assert.equal(r.needsManual, true);
});
test("planPayouts: khoản đã trả bị sửa tay số tiền → cần xử lý tay", () => {
  const existing: PayoutLite[] = [{ id: "a", milestone_months: 1, status: "paid", due_date: "2026-02-28", rule_key: ruleKey(R), amount_edited: true }];
  const r = planPayouts({ existing, rule: R, baseSalary: null, startDate: "2026-01-31", leftDate: null, replaceOpen: false });
  assert.equal(r.needsManual, true);
  assert.deepEqual(r.inserts, []);
});
test("planPayouts: cùng quy tắc, offer huỷ rồi nhận lại sau khi mốc 1 đã trả → chỉ sinh mốc 2", () => {
  const existing: PayoutLite[] = [
    { id: "a", milestone_months: 1, status: "paid", due_date: "2026-02-28", rule_key: ruleKey(R) },
    { id: "b", milestone_months: 2, status: "cancelled", due_date: "2026-03-31", rule_key: ruleKey(R) }];
  const r = planPayouts({ existing, rule: R, baseSalary: null, startDate: "2026-01-31", leftDate: null, replaceOpen: false });
  assert.deepEqual(r.inserts.map((x) => x.milestone_months), [2]);
  assert.equal(r.needsManual, false);
});
test("planPayouts: có ngày nghỉ mà chưa có ngày đi làm → không sinh", () => {
  assert.deepEqual(planPayouts({ existing: [], rule: R, baseSalary: null, startDate: null, leftDate: "2026-01-01", replaceOpen: false }).inserts, []);
});
test("resolveBeneficiary: referrer gắn tài khoản bị ngừng → không hưởng, kể cả Kế toán", () => {
  const off: ReferrerLite[] = [{ id: "r-t", name: "Thảo", kind: null, ref_codes: [], hr_user_id: "u-thao", active: false, rule: null }];
  assert.equal(resolveBeneficiary("thaodtx", staff, off), null);
});
test("parseReferrerInput: gắn tài khoản → kind ép về internal", () => {
  const r = parseReferrerInput({ name: "Phương", kind: "external", hr_user_id: "u-phuong" }, { staff, referrers: refs, selfId: null , actorIsBoss: true }) as ReferrerInput;
  assert.equal(r.kind, "internal");
});

test("statusAfterDueEdit: đổi hạn → due/upcoming theo hôm nay; approved/paid giữ nguyên", () => {
  assert.equal(statusAfterDueEdit("due", "2026-12-01", "2026-11-01"), "upcoming");
  assert.equal(statusAfterDueEdit("upcoming", "2026-10-01", "2026-11-01"), "due");
  assert.equal(statusAfterDueEdit("upcoming", "2026-11-01", "2026-11-01"), "due");
  assert.equal(statusAfterDueEdit("due", null, "2026-11-01"), "upcoming");
  assert.equal(statusAfterDueEdit("approved", "2027-01-01", "2026-11-01"), "approved");
  assert.equal(statusAfterDueEdit("paid", "2027-01-01", "2026-11-01"), "paid");
});

test("planPayouts: needsManual + replaceOpen → không xoá gì", () => {
  const existing: PayoutLite[] = [
    { id: "p", milestone_months: 1, status: "paid", due_date: "2026-02-28", rule_key: "khac" },
    { id: "u", milestone_months: 2, status: "upcoming", due_date: "2026-03-31", rule_key: "khac" },
  ];
  const r = planPayouts({ existing, rule: R, baseSalary: null, startDate: "2026-01-31", leftDate: null, replaceOpen: true });
  assert.equal(r.needsManual, true);
  assert.deepEqual(r.deleteIds, []);
});
test("autoCancelIds: chỉ upcoming/due (không approved/paid/cancelled)", () => {
  const ps: PayoutLite[] = ["upcoming", "due", "approved", "paid", "cancelled"].map((status, i) => ({ id: `m${i}`, milestone_months: i, status: status as PayoutLite["status"], due_date: null }));
  assert.deepEqual(autoCancelIds(ps), ["m0", "m1"]);
  assert.deepEqual(cancellableIds(ps), ["m0", "m1", "m2"]);
});

test("filterPayouts + tổng theo bộ lọc", () => {
  const rows = [
    { status: "due" as const, amount: 1_000_000, due_date: "2026-11-02", job_id: "j1", referrer_id: "r-maiha", hr_user_id: null },
    { status: "approved" as const, amount: 500_000, due_date: "2026-10-30", job_id: "j2", referrer_id: null, hr_user_id: "u-thao" },
    { status: "due" as const, amount: null, due_date: "2026-11-05", job_id: "j1", referrer_id: "r-cat", hr_user_id: null },
    { status: "paid" as const, amount: 2_000_000, due_date: "2026-09-01", job_id: "j1", referrer_id: "r-maiha", hr_user_id: null }];
  assert.equal(filterPayouts(rows, { statuses: ["due", "approved"], beneficiaryKey: null, jobId: null, month: null }).total, 1_500_000);
  assert.equal(filterPayouts(rows, { statuses: ["due", "approved"], beneficiaryKey: "user:u-thao", jobId: null, month: null }).rows.length, 1);
  assert.equal(filterPayouts(rows, { statuses: [], beneficiaryKey: null, jobId: "j1", month: "2026-11" }).rows.length, 2);
  assert.deepEqual(referrerTotals(rows).get("r-maiha"), { paid: 2_000_000, outstanding: 1_000_000 });
  assert.deepEqual(referrerTotals(rows).get("user:u-thao"), { paid: 0, outstanding: 500_000 });
  assert.deepEqual(referrerTotals([{ status: "cancelled", amount: 5, referrer_id: "x", hr_user_id: null }]).get("x"), { paid: 0, outstanding: 0 });
});
test("parseAppReferralPatch", () => {
  assert.deepEqual(parseAppReferralPatch({ start_date: "2026-11-02" }), { start_date: "2026-11-02" });
  assert.deepEqual(parseAppReferralPatch({ left_date: null, recalc: true }), { left_date: null, recalc: true });
  assert.ok("error" in parseAppReferralPatch({ start_date: "02/11/2026" }));
  assert.ok("error" in parseAppReferralPatch({}));
  assert.ok("error" in parseAppReferralPatch({ recalc: false }));
  assert.ok("error" in parseAppReferralPatch({ referred_by: 5 }));
  assert.deepEqual(parseAppReferralPatch({ referred_by: "  " }), { referred_by: null });
  assert.deepEqual(parseAppReferralPatch({ referred_by: "Mai Ha" }), { referred_by: "mai-ha" });
});
test("payoutNeedsAttention: khoản approved mà offer không còn accepted", () => {
  assert.equal(payoutNeedsAttention("approved", "declined"), true);
  assert.equal(payoutNeedsAttention("approved", null), true);
  assert.equal(payoutNeedsAttention("approved", "accepted"), false);
  assert.equal(payoutNeedsAttention("paid", "declined"), false);
  assert.equal(payoutNeedsAttention("due", "declined"), false);
});

test("checkPayoutAction: offer không còn accepted → chặn duyệt/chuyển khoản, vẫn huỷ/ghi chú", () => {
  const appr = { ...due, status: "approved" as const };
  assert.equal(checkPayoutAction(HR, due, { action: "approve" }, "2026-11-01", false)?.code, "state");
  assert.equal(checkPayoutAction(ACC, appr, { action: "pay", paid_date: "2026-11-01" }, "2026-11-01", false)?.code, "state");
  assert.equal(checkPayoutAction(HR, appr, { action: "cancel", reason: "x" }, "2026-11-01", false), null);
  assert.equal(checkPayoutAction(ACC, appr, { action: "edit", note: "n" }, "2026-11-01", false), null);
});
test("checkPayoutAction: code forbidden vs state", () => {
  assert.equal(checkPayoutAction(ACC, due, { action: "approve" }, "2026-11-01", true)?.code, "forbidden");
  assert.equal(checkPayoutAction(HR, { ...due, amount: null }, { action: "approve" }, "2026-11-01", true)?.code, "state");
});
test("hasLockedPayout", () => {
  assert.equal(hasLockedPayout([{ status: "due" }, { status: "cancelled" }]), false);
  assert.equal(hasLockedPayout([{ status: "due" }, { status: "approved" }]), true);
  assert.equal(hasLockedPayout([{ status: "paid" }]), true);
});
test("referrerAuditEntries + bankChangedRecent", () => {
  const base = { bank_info: "VCB 1", ref_codes: ["a"], hr_user_id: null, kind: "external", active: true };
  const e = referrerAuditEntries(base, { ...base, bank_info: "TCB 2", ref_codes: ["a", "b"] }, { id: "u1", name: "Phương" }, "2026-11-01T00:00:00Z");
  assert.deepEqual(e.map((x) => x.field), ["bank_info", "ref_codes"]);
  assert.deepEqual(e[0], { at: "2026-11-01T00:00:00Z", by_user_id: "u1", by_name: "Phương", field: "bank_info", old: "VCB 1", new: "TCB 2" });
  assert.deepEqual(referrerAuditEntries(base, { ...base }, { id: null, name: "x" }, "t"), []);
  const now = Date.parse("2026-11-30T00:00:00Z");
  assert.equal(bankChangedRecent("2026-11-01T00:00:00Z", now), true);
  assert.equal(bankChangedRecent("2026-10-01T00:00:00Z", now), false);
  assert.equal(bankChangedRecent(null, now), false);
});

const nst: RecipientStaff[] = [
  { id: "u-phuong", role: "hr", disabled: false, discord_user_id: "1" }, { id: "u-dung", role: "hr", disabled: false, discord_user_id: null },
  { id: "u-thao", role: "accountant", disabled: false, discord_user_id: "2" }, { id: "u-toan", role: "boss", disabled: false, discord_user_id: "3" },
  { id: "u-lead", role: "leader", disabled: false, discord_user_id: "4" }];
const nperms = new Map(HR_ROLES.map((r) => [r, effectivePermissions(r, [])]));
test("referralNotifyTargets", () => {
  const t = (o: Partial<Parameters<typeof referralNotifyTargets>[0]> & { event: "due" | "approved" }) =>
    referralNotifyTargets({ staff: nst, perms: nperms, assigneeId: null, defaultAssigneeId: null, ...o });
  assert.deepEqual(t({ event: "due", assigneeId: "u-phuong" }), ["u-phuong"]);
  assert.deepEqual(t({ event: "due", assigneeId: "u-lead", defaultAssigneeId: "u-dung" }), ["u-dung"]);
  assert.deepEqual(t({ event: "due" }), ["u-phuong", "u-dung"]);
  assert.deepEqual(t({ event: "approved", assigneeId: "u-phuong" }), ["u-thao"]);
  const noAcc = nst.filter((u) => u.role !== "accountant");
  assert.deepEqual(t({ event: "approved", staff: noAcc }), ["u-toan"]);
  // Tài khoản khoá bị bỏ qua
  const locked = nst.map((u) => (u.id === "u-phuong" ? { ...u, disabled: true } : u));
  assert.deepEqual(t({ event: "due", staff: locked, assigneeId: "u-phuong", defaultAssigneeId: "u-dung" }), ["u-dung"]);
  assert.deepEqual(t({ event: "due", staff: nst.filter((u) => u.role !== "hr") }), ["u-toan"]);
});

test("parseDefaultRules: app_settings.value là TEXT — chuỗi JSON được đọc, JSON hỏng → mặc định", () => {
  const custom = { internal: { amount: { type: "fixed", vnd: 3_000_000 }, schedule: [{ months: 1, percent: 100 }] }, external: null };
  const r = parseDefaultRules(JSON.stringify(custom));
  assert.deepEqual(r.internal, custom.internal);
  assert.equal(r.external, null);
  assert.deepEqual(parseDefaultRules("{khong-phai-json"), DEFAULT_RULES);
  assert.deepEqual(parseDefaultRules(custom), r); // object (đã parse) vẫn nhận
});

test("isSelfPayout: gắn tài khoản, referrer gắn tài khoản, hoặc mã ref của chính mình", () => {
  const thao = { id: "u-thao", ref_codes: ["thaodtx"] };
  assert.equal(isSelfPayout({ hr_user_id: "u-thao" }, { referrerHrUserId: null, referredBy: null }, thao), true);
  assert.equal(isSelfPayout({ hr_user_id: null }, { referrerHrUserId: "u-thao", referredBy: null }, thao), true);
  assert.equal(isSelfPayout({ hr_user_id: null }, { referrerHrUserId: null, referredBy: "ThaoDTX" }, thao), true);
  assert.equal(isSelfPayout({ hr_user_id: "u-phuong" }, { referrerHrUserId: null, referredBy: "mai-ha" }, thao), false);
  assert.equal(isSelfPayout({ hr_user_id: null }, { referrerHrUserId: null, referredBy: null }, { id: null, ref_codes: [] }), false);
});

test("checkPayoutAction: không phải Sếp không duyệt/sửa/trả khoản của chính mình; Sếp được; huỷ vẫn được", () => {
  const BOSS = effectivePermissions("boss", []);
  const self = { boss: false, self: true };
  const appr = { ...due, status: "approved" as const };
  const d1 = checkPayoutAction(HR, due, { action: "approve" }, "2026-11-01", true, self);
  assert.deepEqual(d1, { code: "forbidden", message: SELF_PAYOUT_MSG });
  assert.equal(checkPayoutAction(ACC, appr, { action: "pay", paid_date: "2026-11-01" }, "2026-11-01", true, self)?.code, "forbidden");
  assert.equal(checkPayoutAction(ACC, appr, { action: "edit", amount: 50_000_000 }, "2026-11-01", true, self)?.code, "forbidden");
  assert.equal(checkPayoutAction(ACC, appr, { action: "edit", note: "x" }, "2026-11-01", true, self)?.code, "forbidden");
  assert.equal(checkPayoutAction(HR, due, { action: "cancel", reason: "x" }, "2026-11-01", true, self), null);
  assert.equal(checkPayoutAction(BOSS, due, { action: "approve" }, "2026-11-01", true, { boss: true, self: true }), null);
  assert.equal(checkPayoutAction(BOSS, appr, { action: "pay", paid_date: "2026-11-01" }, "2026-11-01", true, { boss: true, self: true }), null);
  assert.equal(checkPayoutAction(ACC, appr, { action: "pay", paid_date: "2026-11-01" }, "2026-11-01", true, { boss: false, self: false }), null);
});

test("statusAfterPayoutEdit: không phải Sếp sửa tiền khoản đã duyệt → due; Sếp giữ approved; đổi hạn như statusAfterDueEdit", () => {
  const e = (x: Partial<{ amountChanged: boolean; dueChanged: boolean; newDue: string | null; oldDue: string | null }>) =>
    ({ amountChanged: false, dueChanged: false, newDue: null, oldDue: "2026-11-01", ...x });
  assert.equal(statusAfterPayoutEdit("approved", e({ amountChanged: true }), false, "2026-11-01"), "due");
  assert.equal(statusAfterPayoutEdit("approved", e({ amountChanged: true }), true, "2026-11-01"), "approved");
  assert.equal(statusAfterPayoutEdit("approved", e({ amountChanged: true, dueChanged: true, newDue: "2026-12-01" }), false, "2026-11-01"), "upcoming");
  assert.equal(statusAfterPayoutEdit("approved", e({ dueChanged: true, newDue: "2026-12-01" }), false, "2026-11-01"), "approved");
  assert.equal(statusAfterPayoutEdit("due", e({ dueChanged: true, newDue: "2026-12-01" }), false, "2026-11-01"), "upcoming");
  assert.equal(statusAfterPayoutEdit("due", e({ amountChanged: true }), false, "2026-11-01"), "due");
  assert.equal(statusAfterPayoutEdit("paid", e({}), false, "2026-11-01"), "paid");
});

test("parseReferrerInput: gắn tài khoản / mức riêng chỉ Sếp (403), sửa trường khác giữ nguyên thì được", () => {
  const own = { amount: { type: "fixed", vnd: 500_000 }, schedule: [{ months: 0, percent: 100 }] };
  const ctx = { staff, referrers: refs, selfId: null, actorIsBoss: false };
  assert.equal((parseReferrerInput({ name: "Phương", hr_user_id: "u-phuong" }, ctx) as { status: number }).status, 403);
  assert.equal((parseReferrerInput({ name: "Mới", kind: "external", ref_codes: ["moi"], rule: own }, ctx) as { status: number }).status, 403);
  assert.equal((parseReferrerInput({ name: "Mới", kind: "external", ref_codes: ["moi"] }, ctx) as ReferrerInput).name, "Mới");
  // Sửa: giữ nguyên hr_user_id + mức riêng (kể cả lịch khác thứ tự) → được; đổi → 403
  const prev = { hr_user_id: "u-phuong", rule: own };
  const edit = { staff, referrers: refs, selfId: "r-ph", actorIsBoss: false, previous: prev };
  assert.equal((parseReferrerInput({ name: "Phương 2", hr_user_id: "u-phuong", rule: own }, edit) as ReferrerInput).name, "Phương 2");
  assert.equal((parseReferrerInput({ name: "Phương", hr_user_id: null, ref_codes: ["phuong-x"], rule: own }, edit) as { status: number }).status, 403);
  assert.equal((parseReferrerInput({ name: "Phương", hr_user_id: "u-phuong", rule: null }, edit) as { status: number }).status, 403);
  assert.equal((parseReferrerInput({ name: "Phương", hr_user_id: "u-phuong", rule: own }, { ...edit, actorIsBoss: true, previous: null }) as ReferrerInput).hr_user_id, "u-phuong");
});
