# Bảng hoa hồng giới thiệu (refer) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** /hr tự sinh các khoản hoa hồng refer khi ứng viên nhận offer, tính đúng theo quy tắc (ghi đè người → job → mặc định công ty), nhắc đúng hạn; Phương xác nhận UV còn làm, Thảo đánh dấu đã chuyển khoản.

**Architecture:** Mọi luật (ai được hưởng, chọn quy tắc, chia mốc, cộng tháng, trạng thái, huỷ khi nghỉ, kiểm thao tác) nằm ở file thuần `src/lib/referral-commission.ts` có test `node --test`. I/O Supabase ở `src/lib/referral-store.ts` (server-only). Khoản được sinh trong PATCH hồ sơ khi `offer_status` → `accepted`, huỷ khi rời `accepted`; cron hằng ngày chuyển `upcoming → due` + nhắc; khi đọc cũng tự suy `due` (phòng cron lỗi). UI là tab mới "Hoa hồng" (`CommissionPanel.tsx`) + chèn vào JobsView / JobForm / OfferSection.

**Tech Stack:** Next.js 16 App Router route handlers, Supabase service role (`getSupabaseAdmin`), `node --test` cho lib thuần, React client `src/app/hr/_components`, GitHub Actions cron.

**Spec:** `docs/superpowers/specs/2026-10-29-referral-commission-design.md`

## Global Constraints

- Tiền VND số nguyên; chia % làm tròn **xuống** từng mốc, phần dư dồn vào mốc có `months` lớn nhất; `salary_multiple` cũng làm tròn xuống.
- Ngày dạng `YYYY-MM-DD` theo giờ VN (`vnDateKey`); cộng tháng kẹp cuối tháng (31/1 + 1 → 28/2).
- Mặc định công ty: `internal` = 2.000.000, mốc `{1 tháng, 50%}` + `{2 tháng, 50%}`; `external` = không có (→ "Chưa đặt mức").
- Hưởng: tài khoản vai `accountant` → `internal`; `hr`/`leader`/`boss` → không, trừ khi có referrer `hr_user_id` trỏ tới tài khoản đó; `work_type = 'freelancer'` → không sinh; referrer `active = false` → không sinh.
- Khoản `paid` không bao giờ bị huỷ/xoá/đổi số tiền (chỉ ghi chú). Nghỉ **đúng** ngày đến hạn = vẫn đủ mốc.
- Quyền: `referrals.view` d(hr ✓, leader ✗, accountant ✓); `referrals.manage` d(✓, ✗, ✗); `referrals.pay` d(✗, ✗, ✓); boss luôn đủ. Gác ở server bằng `requireHrUser(req, perm)`.
- Không trả lương (`baseSalary`) ra API nào ngoài luồng thư mời hiện có; chỉ trả số tiền hoa hồng. Discord không có số tiền.
- Quy tắc theo job chỉ qua route `/api/hr/referrals/job-rules/*` (cần `referrals.view`), **không** thêm cột vào `jobs` (GET `/api/hr/jobs` trả `*` cho Leader).
- Hồ sơ đã `accepted` trước khi deploy: không tự tính bù (chỉ khi bấm "Tính lại").
- Migration: `supabase/migrations/20261029000000_referral_commissions.sql`, RLS bật, không policy; controller áp prod qua Supabase MCP sau.
- Trước khi sửa symbol có sẵn (`HR_PERMISSIONS`, PATCH hồ sơ, `JobsView`, `JobForm`, `OfferSection`, `HRDashboard`): chạy GitNexus `impact`; trước mỗi commit: `detect_changes`.
- Copy UI tiếng Việt, token `--hr-*`, icon Lucide. Lib thuần import nội bộ có đuôi `.ts`.

## Review Focus

1. **Cộng tháng cuối tháng / năm nhuận / qua năm** (31/1, 31/10, 31/12 + 2, 31/1/2028) → Task 1 `addMonthsClamped`.
2. **Chia tiền lẻ** (1.000.001 chia 50/50; 10 chia 33/33/34; lịch nhập không theo thứ tự) → Task 1 `splitSchedule`.
3. **Mã ref khớp sai người**: mã HR/Sếp (không sinh), mã Kế toán `thaodtx` (internal), alias `mai-ha-headhunt` gõ hoa/có dấu cách (về referrer gộp), referrer ngừng hoạt động, referrer chưa phân loại → Task 2 `resolveBeneficiary`.
4. **Offer accepted → declined → accepted** sau khi mốc 1 đã trả: không sinh trùng mốc đã trả, không huỷ khoản đã trả; nghỉ đúng ngày đến hạn giữ mốc → Task 3 `planPayouts`, `cancelOnLeave`, `cancellableIds`.
5. **Sai người thao tác**: HR bấm "Đã chuyển khoản", Kế toán bấm "Xác nhận còn làm", sửa số tiền khoản đã trả, duyệt khoản "Chưa đặt mức", Leader có `referrals.*` → Task 4 `checkPayoutAction` + test quyền.

---

### Task 1: Lõi thuần — quy tắc, cộng tháng, chia mốc, trạng thái

**Files:**
- Create: `src/lib/referral-commission.ts`
- Test: `src/lib/referral-commission.test.ts`

**Interfaces — Produces:**
```ts
export type CommissionKind = "internal" | "external";
export type PayoutStatus = "upcoming" | "due" | "approved" | "paid" | "cancelled";
export type AmountIssue = "no_rule" | "no_salary";
export type ScheduleStep = { months: number; percent: number };
export type CommissionAmount = { type: "fixed"; vnd: number } | { type: "salary_multiple"; multiple: number };
export type CommissionRule = { amount: CommissionAmount; schedule: ScheduleStep[] };
export type DefaultRules = Record<CommissionKind, CommissionRule | null>;
export const REFERRAL_DEFAULTS_KEY = "referral_default_rules"; // app_settings key
export const DEFAULT_RULES: DefaultRules;
export function parseRule(v: unknown): CommissionRule | { error: string };
export function parseDefaultRules(v: unknown): DefaultRules;          // phần hỏng → DEFAULT_RULES[kind]
export function addMonthsClamped(ymd: string, n: number): string;
export function splitSchedule(total: number | null, schedule: ScheduleStep[]): { months: number; percent: number; amount: number | null }[];
export function computeAmount(rule: CommissionRule | null, baseSalary: number | null): { amount: number | null; issue: AmountIssue | null };
export function effectiveStatus(p: { status: PayoutStatus; due_date: string | null }, today: string): PayoutStatus;
export function milestoneLabel(months: number): string;               // 0 → "Ngay khi đi làm", n → `Đủ ${n} tháng`
```

- [ ] **Viết test fail** (`referral-commission.test.ts`, header `// node --test src/lib/referral-commission.test.ts`):
```ts
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
```
- [ ] **Chạy** `node --test src/lib/referral-commission.test.ts` → FAIL (module not found).
- [ ] **Implement** trong `referral-commission.ts`. Ghim giá trị: `DEFAULT_RULES = { internal: { amount: { type: "fixed", vnd: 2_000_000 }, schedule: [{ months: 1, percent: 50 }, { months: 2, percent: 50 }] }, external: null }`. `parseRule`: `vnd` nguyên 1..1_000_000_000; `multiple` số > 0, ≤ 12, làm tròn 2 chữ số; `schedule` 1..6 bước, `months` nguyên 0..36 không trùng, `percent` nguyên 1..100, tổng 100; trả lịch đã sắp tăng theo `months`; lỗi tiếng Việt (vd. "Tổng phần trăm phải bằng 100"). `addMonthsClamped`: tách chuỗi y/m/d, `m0 = m-1+n`, `y += floor(m0/12)`, ngày = `min(d, số ngày tháng đích)` (không dùng `Date` theo múi giờ máy). `splitSchedule`: sắp theo months, mỗi mốc `Math.floor(total*percent/100)`, mốc cuối = `total - tổng các mốc trước`. `computeAmount`: rule null → `no_rule`; `salary_multiple` + salary null/≤0 → `no_salary`; còn lại `Math.floor(multiple*salary)`.
- [ ] **Chạy lại** → PASS; `npx tsc --noEmit` sạch.
- [ ] **Commit** `feat(hr): lõi tính hoa hồng refer (quy tắc, chia mốc, cộng tháng)`.

---

### Task 2: Ai được hưởng + chọn quy tắc + mã chưa phân loại

**Files:**
- Modify: `src/lib/referral-commission.ts`
- Test: `src/lib/referral-commission.test.ts`

**Interfaces — Consumes:** `normalizeRefCode`, `resolveRefOwner` (`./hr-ref-codes.ts`); `HrRole` (`./hr-permissions.ts`).
**Produces:**
```ts
export type StaffLite = { id: string; role: HrRole; display_name: string; ref_codes: string[] | null };
export type ReferrerLite = { id: string; name: string; kind: CommissionKind | null; ref_codes: string[]; hr_user_id: string | null; active: boolean; rule: CommissionRule | null };
export type Beneficiary = { referrerId: string | null; hrUserId: string | null; name: string; kind: CommissionKind | null; override: CommissionRule | null };
export function resolveBeneficiary(code: unknown, staff: StaffLite[], referrers: ReferrerLite[]): Beneficiary | null;
export function pickRule(b: Beneficiary, jobRules: Partial<Record<CommissionKind, CommissionRule>>, defaults: DefaultRules): { rule: CommissionRule | null; source: "override" | "job" | "default" | null };
export function isCommissionable(app: { offer_status: string | null; work_type: string | null }): boolean;
export function approvedBaseSalary(row: { data: { baseSalary: number | null }; approval: { status: string } } | null): number | null;
export function unknownRefCodes(codes: (string | null)[], staff: StaffLite[], referrers: ReferrerLite[]): { code: string; count: number }[];
```

- [ ] **Viết test fail** (fixture: staff Thảo `{id:"u-thao", role:"accountant", ref_codes:["thaodtx"]}`, Phương `{id:"u-phuong", role:"hr", ref_codes:["phuongx"]}`, Toàn `{id:"u-toan", role:"boss", ref_codes:["toandt"]}`; referrers `r-maiha` external `["mai-ha","mai-ha-headhunt"]`, `r-cat` kind null `["cat-tuong"]`, `r-van` external `["thuy-van"]` active false):
```ts
test("resolveBeneficiary", () => {
  assert.deepEqual(resolveBeneficiary("thaodtx", staff, refs), { referrerId: null, hrUserId: "u-thao", name: "Thảo", kind: "internal", override: null });
  assert.equal(resolveBeneficiary("phuongx", staff, refs), null);
  assert.equal(resolveBeneficiary("toandt", staff, refs), null);
  assert.equal(resolveBeneficiary("Mai Ha Headhunt", staff, refs)?.referrerId, "r-maiha");
  assert.equal(resolveBeneficiary("thuy-van", staff, refs), null);           // ngừng hoạt động
  assert.equal(resolveBeneficiary("cat-tuong", staff, refs)?.kind, null);    // chưa phân loại
  assert.equal(resolveBeneficiary("khong-ai", staff, refs), null);
  const own: CommissionRule = { amount: { type: "fixed", vnd: 500_000 }, schedule: [{ months: 0, percent: 100 }] };
  const linked = [...refs, { id: "r-ph", name: "Phương", kind: null, ref_codes: [], hr_user_id: "u-phuong", active: true, rule: own }];
  assert.deepEqual(resolveBeneficiary("phuongx", staff, linked), { referrerId: "r-ph", hrUserId: "u-phuong", name: "Phương", kind: "internal", override: own });
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
```
- [ ] **Chạy** → FAIL (export thiếu).
- [ ] **Implement.** `resolveBeneficiary`: `c = normalizeRefCode(code)`; `owner = resolveRefOwner(c, staff)`; có owner → referrer `active && hr_user_id === owner.id` thì `{referrerId, hrUserId: owner.id, name: r.name, kind: r.kind ?? "internal", override: r.rule}`; không có mà `owner.role === "accountant"` → internal theo tài khoản; còn lại `null`. Không owner → referrer `hr_user_id === null` có mã khớp (normalize) và `active` → `{…, kind: r.kind, override: r.rule}`; khác → `null`. `isCommissionable` = `offer_status === "accepted" && work_type !== "freelancer"`. `unknownRefCodes` sắp `count` giảm dần rồi `code` tăng.
- [ ] **Chạy lại** → PASS.
- [ ] **Commit** `feat(hr): xác định người hưởng hoa hồng + chọn quy tắc`.

---

### Task 3: Lập kế hoạch khoản — sinh, tính lại, đổi ngày, nghỉ, rời offer

**Files:**
- Modify: `src/lib/referral-commission.ts`
- Test: `src/lib/referral-commission.test.ts`

**Interfaces — Produces:**
```ts
export type PayoutLite = { id: string; milestone_months: number; status: PayoutStatus; due_date: string | null };
export type PayoutDraft = { milestone_months: number; percent: number; amount: number | null; amount_issue: AmountIssue | null; due_date: string | null };
export function planPayouts(i: { existing: PayoutLite[]; rule: CommissionRule | null; baseSalary: number | null; startDate: string | null; leftDate: string | null; replaceOpen: boolean }): { deleteIds: string[]; inserts: PayoutDraft[] };
export function rescheduleDueDates(existing: PayoutLite[], startDate: string | null): { id: string; due_date: string | null }[];
export function cancelOnLeave(existing: PayoutLite[], leftDate: string): string[];
export function cancellableIds(existing: PayoutLite[]): string[];      // upcoming | due | approved
export function offerTransition(oldStatus: string | null, newStatus: string | null): "generate" | "cancel" | null;
```

- [ ] **Viết test fail:**
```ts
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
```
- [ ] **Chạy** → FAIL.
- [ ] **Implement.** `planPayouts`: `deleteIds = replaceOpen ? existing(status upcoming|due).id : []`; `taken = months của existing không cancelled và không trong deleteIds`; rule null → lịch `[{months:0, percent:100}]`; `computeAmount` → `splitSchedule`; mỗi mốc chưa taken: `due = startDate ? addMonthsClamped(startDate, months) : null`; bỏ nếu `leftDate && due && due > leftDate`. `rescheduleDueDates` trả dòng upcoming|due có ngày mới khác ngày cũ (route ghi kèm `status: "upcoming"`). `cancelOnLeave`: status ∉ {paid, cancelled}, `due_date !== null && due_date > leftDate`.
- [ ] **Chạy lại** → PASS.
- [ ] **Commit** `feat(hr): lập kế hoạch khoản hoa hồng (sinh, tính lại, nghỉ việc)`.

---

### Task 4: Quyền + kiểm thao tác khoản + kiểm dữ liệu người giới thiệu

**Files:**
- Modify: `src/lib/hr-permissions.ts`, `src/lib/hr-permissions.test.ts`, `src/lib/referral-commission.ts`, `src/lib/referral-commission.test.ts`

**Interfaces — Consumes:** `parseRefCodes`, `findRefConflict` (`./hr-ref-codes.ts`); `isValidDate` (`./offer-letter.ts`); `PermissionKey`.
**Produces:**
```ts
// hr-permissions.ts — thêm cuối HR_PERMISSIONS, group "Hoa hồng giới thiệu":
//   referrals.view   "Xem tab Hoa hồng & số tiền hoa hồng"                                   d(true, false, true)
//   referrals.manage "Quản lý người giới thiệu, mức hoa hồng, xác nhận còn làm / huỷ khoản"   d(true, false, false)
//   referrals.pay    "Đánh dấu đã chuyển khoản, sửa số tiền / hạn từng khoản"                 d(false, false, true)
export type PayoutAction =
  | { action: "approve" } | { action: "cancel"; reason: string } | { action: "pay"; paid_date: string }
  | { action: "edit"; amount?: number; due_date?: string | null; note?: string };
export function parsePayoutAction(v: unknown): PayoutAction | { error: string };
export function checkPayoutAction(perms: Set<PermissionKey>, p: { status: PayoutStatus; due_date: string | null; amount: number | null }, a: PayoutAction, today: string): string | null;
export type ReferrerInput = { name: string; kind: CommissionKind | null; ref_codes: string[]; hr_user_id: string | null; phone: string; email: string; bank_info: string; note: string; active: boolean; rule: CommissionRule | null };
export function parseReferrerInput(v: unknown, ctx: { staff: StaffLite[]; referrers: ReferrerLite[]; selfId: string | null }): ReferrerInput | { error: string; status: 400 | 409 };
```

- [ ] **Viết test fail:**
```ts
// hr-permissions.test.ts
test("referrals.*: HR xem+quản lý, Kế toán xem+trả, Leader không gì", () => {
  const hr = effectivePermissions("hr", []), acc = effectivePermissions("accountant", []), ld = effectivePermissions("leader", []);
  assert.ok(hr.has("referrals.view") && hr.has("referrals.manage") && !hr.has("referrals.pay"));
  assert.ok(acc.has("referrals.view") && acc.has("referrals.pay") && !acc.has("referrals.manage"));
  assert.ok(!ld.has("referrals.view") && !ld.has("referrals.manage") && !ld.has("referrals.pay"));
});
// referral-commission.test.ts
const HR = effectivePermissions("hr", []), ACC = effectivePermissions("accountant", []);
const due = { status: "upcoming" as const, due_date: "2026-11-01", amount: 1_000_000 };
test("checkPayoutAction", () => {
  assert.equal(checkPayoutAction(HR, due, { action: "approve" }, "2026-11-01"), null);
  assert.ok(checkPayoutAction(ACC, due, { action: "approve" }, "2026-11-01"));                       // Kế toán không xác nhận còn làm
  assert.ok(checkPayoutAction(HR, { ...due, due_date: "2026-12-01" }, { action: "approve" }, "2026-11-01")); // chưa đến hạn
  assert.ok(checkPayoutAction(HR, { ...due, amount: null }, { action: "approve" }, "2026-11-01"));   // Chưa đặt mức
  assert.ok(checkPayoutAction(HR, { ...due, status: "approved" }, { action: "pay", paid_date: "2026-11-01" }, "2026-11-01"));
  assert.equal(checkPayoutAction(ACC, { ...due, status: "approved" }, { action: "pay", paid_date: "2026-11-01" }, "2026-11-01"), null);
  assert.ok(checkPayoutAction(ACC, { ...due, status: "approved" }, { action: "pay", paid_date: "2026-11-02" }, "2026-11-01")); // ngày tương lai
  assert.ok(checkPayoutAction(ACC, { ...due, status: "paid" }, { action: "edit", amount: 5 }, "2026-11-01"));
  assert.equal(checkPayoutAction(ACC, { ...due, status: "paid" }, { action: "edit", note: "CK lần 2" }, "2026-11-01"), null);
  assert.ok(checkPayoutAction(HR, { ...due, status: "paid" }, { action: "cancel", reason: "x" }, "2026-11-01"));
  assert.ok(checkPayoutAction(HR, due, { action: "edit", amount: 5 }, "2026-11-01"));                  // HR không sửa tiền
});
test("parsePayoutAction", () => {
  assert.ok("error" in parsePayoutAction({ action: "cancel", reason: "  " }));
  assert.ok("error" in parsePayoutAction({ action: "edit", amount: 1.5 }));
  assert.ok("error" in parsePayoutAction({ action: "pay", paid_date: "2026-02-30" }));
  assert.deepEqual(parsePayoutAction({ action: "approve", x: 1 }), { action: "approve" });
});
test("parseReferrerInput: trùng mã tài khoản/referrer → 409; gắn tài khoản không có mã riêng", () => {
  const base = { name: "Cát Tường", kind: "external", ref_codes: ["cat-tuong"] };
  assert.equal((parseReferrerInput({ ...base, ref_codes: ["ThaoDTX"] }, { staff, referrers: refs, selfId: null }) as { status: number }).status, 409);
  assert.equal((parseReferrerInput({ ...base, ref_codes: ["mai-ha"] }, { staff, referrers: refs, selfId: null }) as { status: number }).status, 409);
  assert.equal((parseReferrerInput({ ...base, ref_codes: ["cat-tuong"] }, { staff, referrers: refs, selfId: "r-cat" }) as ReferrerInput).ref_codes[0], "cat-tuong");
  assert.equal((parseReferrerInput({ name: "Phương", kind: "internal", ref_codes: ["x"], hr_user_id: "u-phuong" }, { staff, referrers: refs, selfId: null }) as { status: number }).status, 400);
  assert.equal((parseReferrerInput({ name: "", ref_codes: ["a"] }, { staff, referrers: refs, selfId: null }) as { status: number }).status, 400);
  assert.equal((parseReferrerInput({ name: "A", ref_codes: [] }, { staff, referrers: refs, selfId: null }) as { status: number }).status, 400); // không gắn tài khoản thì phải có ≥1 mã
});
```
- [ ] **Chạy** `node --test src/lib/hr-permissions.test.ts src/lib/referral-commission.test.ts` → FAIL.
- [ ] **Implement.** `checkPayoutAction` (lỗi tiếng Việt, null = được): `approve` cần `referrals.manage`, `effectiveStatus === "due"`, `amount !== null`; `cancel` cần `referrals.manage`, status ∉ {paid, cancelled}; `pay` cần `referrals.pay`, status `approved`, `paid_date ≤ today`; `edit` cần `referrals.pay`, status ≠ cancelled, status `paid` → chỉ `note`. `parsePayoutAction`: `reason` trim 1..500; `amount` nguyên 0..1_000_000_000; `due_date`/`paid_date` qua `isValidDate`; `note` ≤ 1000; key lạ bỏ qua. `parseReferrerInput`: `name` trim 1..120; `kind` ∈ {internal, external, null}; `ref_codes` qua `parseRefCodes`; `hr_user_id` khác null → phải là `staff.id`, `ref_codes` phải rỗng (400), không trùng referrer khác (409); null → ≥1 mã; xung đột `findRefConflict(codes, staff, null)` → 409 "Mã X đã thuộc tài khoản Y", `findRefConflict(codes, referrers, selfId)` → 409; text khác trim ≤ 500; `active` mặc định true; `rule` null hoặc `parseRule`.
- [ ] **Chạy lại** → PASS (cả `node --test src/lib/hr-scope.test.ts` vì `FIELD_GROUPS` sinh từ `HR_PERMISSIONS`).
- [ ] **Commit** `feat(hr): quyền referrals.* + kiểm thao tác khoản hoa hồng`.

---

### Task 5: Migration + store + sinh/huỷ khoản trong PATCH hồ sơ

**Files:**
- Create: `supabase/migrations/20261029000000_referral_commissions.sql`, `src/lib/referral-store.ts`
- Modify: `src/app/api/hr/applications/[id]/route.ts`

**Interfaces — Consumes:** Task 1–3; `loadOfferLetterRow` (`offer-letter-store.ts`); `isValidDate`.
**Produces:**
```sql
create table public.referrers (id uuid primary key default gen_random_uuid(), name text not null,
  kind text check (kind in ('internal','external')),            -- null = chưa phân loại
  ref_codes text[] not null default '{}', hr_user_id uuid unique references public.hr_users(id) on delete set null,
  phone text not null default '', email text not null default '', bank_info text not null default '', note text not null default '',
  active boolean not null default true, rule jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.referral_job_rules (job_id uuid references public.jobs(id) on delete cascade,
  kind text not null check (kind in ('internal','external')), rule jsonb not null, updated_by text, updated_at timestamptz not null default now(),
  primary key (job_id, kind));
create table public.referral_placements (application_id uuid primary key references public.applications(id) on delete cascade,
  start_date date, start_confirmed boolean not null default false, left_date date,
  history jsonb not null default '[]', updated_at timestamptz not null default now());
create table public.referral_payouts (id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  referrer_id uuid references public.referrers(id) on delete set null, hr_user_id uuid references public.hr_users(id) on delete set null,
  beneficiary_name text not null, beneficiary_kind text check (beneficiary_kind in ('internal','external')), job_id uuid,
  milestone_months int not null, percent int not null, amount bigint, amount_issue text check (amount_issue in ('no_rule','no_salary')),
  rule_snapshot jsonb, rule_source text, due_date date,
  status text not null default 'upcoming' check (status in ('upcoming','due','approved','paid','cancelled')),
  approved_by text, approved_at timestamptz, paid_by text, paid_date date, cancel_reason text, note text not null default '',
  edits jsonb not null default '[]', due_notified_at timestamptz, approved_notified_at timestamptz, created_at timestamptz not null default now());
create unique index referral_payouts_live_uniq on public.referral_payouts (application_id, milestone_months) where status <> 'cancelled';
create index referral_payouts_status_due_idx on public.referral_payouts (status, due_date);
-- + alter table … enable row level security cho cả 4 bảng (không policy).
```
```ts
// referral-store.ts ("server-only")
export type PayoutRow = { id: string; application_id: string; referrer_id: string | null; hr_user_id: string | null; beneficiary_name: string;
  beneficiary_kind: CommissionKind | null; job_id: string | null; milestone_months: number; percent: number; amount: number | null;
  amount_issue: AmountIssue | null; rule_source: string | null; due_date: string | null; status: PayoutStatus; approved_by: string | null;
  paid_by: string | null; paid_date: string | null; cancel_reason: string | null; note: string; edits: unknown[] };
export async function loadReferralBasics(): Promise<{ staff: StaffLite[]; referrers: ReferrerLite[]; defaults: DefaultRules }>;
export async function loadJobRules(jobId: string): Promise<Partial<Record<CommissionKind, CommissionRule>>>;
export async function loadPlacement(appId: string): Promise<{ start_date: string | null; start_confirmed: boolean; left_date: string | null; history: unknown[] } | null>;
export async function effectiveStartDate(appId: string): Promise<{ date: string | null; confirmed: boolean }>; // placement.start_date ?? offer data.startDate hợp lệ
export async function syncApplicationPayouts(appId: string, opts: { replaceOpen: boolean }): Promise<{ created: number; deleted: number; skipped: "not_commissionable" | "no_referrer" | null }>;
export async function setPayoutStatus(ids: string[], status: "cancelled", reason: string): Promise<number>;
```

- [ ] **Không có test thuần mới** (I/O). Logic đã test ở Task 1–4; store chỉ đọc → gọi hàm thuần → ghi.
- [ ] **Implement migration** đúng SQL trên.
- [ ] **Implement store.** `syncApplicationPayouts`: đọc `applications(offer_status, work_type, referred_by, job_id)`; `!isCommissionable` → skipped; `resolveBeneficiary` null → skipped `no_referrer`; `pickRule(b, loadJobRules(job_id), defaults)`; lương chỉ đọc khi `rule.amount.type === "salary_multiple"` = `approvedBaseSalary(loadOfferLetterRow(appId))`; `effectiveStartDate`; `planPayouts`; xoá `deleteIds` (`.in("id", …).in("status", ["upcoming","due"])`); insert từng dòng kèm snapshot `{ referrer_id, hr_user_id, beneficiary_name, beneficiary_kind, job_id, rule_snapshot, rule_source }`, lỗi `23505` bỏ qua (chống sinh trùng song song). Tạo `referral_placements` nếu chưa có (`upsert … ignoreDuplicates`). `setPayoutStatus` luôn kèm `.in("status", ["upcoming","due","approved"])` (không bao giờ chạm `paid`). Hàm throw khi lỗi DB.
- [ ] **Sửa PATCH** `applications/[id]/route.ts` (chạy `impact` trước): sau update thành công, nếu `"offer_status" in allowed` → `offerTransition(oldApp.offer_status, allowed.offer_status)`; `generate` → `await syncApplicationPayouts(id, { replaceOpen: false })`; `cancel` → đọc khoản của hồ sơ → `setPayoutStatus(cancellableIds(rows), "cancelled", "Offer không còn ở Đã nhận")`. Bọc try/catch + `console.error`, **không** làm hỏng response PATCH.
- [ ] **Chạy** `npx tsc --noEmit` và `npx eslint src/lib/referral-store.ts "src/app/api/hr/applications/[id]/route.ts"` → sạch; `node --test src/lib/*.test.ts` → PASS.
- [ ] **Commit** `feat(hr): bảng hoa hồng — migration + sinh/huỷ khoản khi đổi kết quả offer`.

---

### Task 6: API tab Hoa hồng

**Files:**
- Create: `src/app/api/hr/referrals/route.ts` (GET), `src/app/api/hr/referrals/defaults/route.ts` (PUT), `src/app/api/hr/referrals/referrers/route.ts` (GET, POST), `src/app/api/hr/referrals/referrers/[id]/route.ts` (PATCH), `src/app/api/hr/referrals/job-rules/[jobId]/route.ts` (GET, PUT), `src/app/api/hr/referrals/payouts/[id]/route.ts` (PATCH), `src/app/api/hr/referrals/applications/[id]/route.ts` (GET, PATCH)
- Modify: `src/lib/referral-commission.ts`, `src/lib/referral-commission.test.ts`, `src/lib/referral-store.ts`

**Interfaces — Produces (lib):**
```ts
export type PayoutFilter = { statuses: PayoutStatus[]; beneficiaryKey: string | null; jobId: string | null; month: string | null }; // month "YYYY-MM" theo due_date
export function beneficiaryKey(p: { referrer_id: string | null; hr_user_id: string | null }): string; // referrer_id ?? `user:${hr_user_id}`
export function filterPayouts<T extends { status: PayoutStatus; amount: number | null; due_date: string | null; job_id: string | null; referrer_id: string | null; hr_user_id: string | null }>(rows: T[], f: PayoutFilter): { rows: T[]; total: number };
export function referrerTotals(rows: { status: PayoutStatus; amount: number | null; referrer_id: string | null; hr_user_id: string | null }[]): Map<string, { paid: number; outstanding: number }>; // outstanding = upcoming|due|approved
export function parseAppReferralPatch(v: unknown): { referred_by?: string | null; start_date?: string | null; left_date?: string | null; recalc?: true } | { error: string };
```
**Produces (HTTP, mọi route `requireHrUser`):**
- `GET /api/hr/referrals` (`referrals.view`) → `{ today, payouts: PayoutView[], referrers: (ReferrerLite & { phone, email, bank_info, note, totals: { paid, outstanding } })[], unknownCodes: { code, count }[], defaults: DefaultRules }`; `PayoutView = PayoutRow & { status: effectiveStatus, label: milestoneLabel, due_estimated: boolean, candidate_name, job_title }` (không có lương).
- `PUT /api/hr/referrals/defaults` (`referrals.manage`) body `{ internal: rule|null, external: rule|null }` → lưu `app_settings[REFERRAL_DEFAULTS_KEY]`.
- `GET /api/hr/referrals/referrers` (`referrals.view`) → `{ referrers: { id, name, kind, ref_codes, active }[] }`; `POST` (`referrals.manage`) body ReferrerInput → 201 `{ referrer }`; `PATCH …/[id]` gộp bản cũ + body rồi `parseReferrerInput(selfId = id)`.
- `GET|PUT /api/hr/referrals/job-rules/[jobId]` (`view` | `manage`) body/response `{ internal: CommissionRule | null, external: CommissionRule | null }` (null = xoá dòng).
- `PATCH /api/hr/referrals/payouts/[id]` body `PayoutAction` → `parsePayoutAction` → `checkPayoutAction(ctx.perms, row, a, vnDateKey(new Date()))` (403 nếu thiếu quyền, 400 lỗi trạng thái) → ghi có điều kiện `.eq("status", row.status)` (0 dòng → 409 "Khoản vừa được người khác cập nhật"); `approve` ghi `approved_by/at`; `pay` ghi `paid_by, paid_date`; `cancel` ghi `cancel_reason`; `edit` append `edits` `{ at, by, by_user_id, field, old, new }`, sửa amount thì `amount_issue = null`. Trả `{ payout: PayoutView }`.
- `GET /api/hr/referrals/applications/[id]` (`referrals.view`, `loadScopedApplication` → 404) → `{ referred_by, beneficiary: { name, kind } | null, payoutCount, start: { date, confirmed }, left_date }`.
- `PATCH /api/hr/referrals/applications/[id]` (`referrals.manage`) body `parseAppReferralPatch`: `referred_by` → normalize, update `applications.referred_by`, append `history` `{ at, by, field: "referred_by", old, new }`, rồi `syncApplicationPayouts(replaceOpen: true)`; `start_date` → placement `start_date`, `start_confirmed = v !== null`, rồi `rescheduleDueDates` (ghi `due_date`, `status: "upcoming"`); `left_date` → placement + `setPayoutStatus(cancelOnLeave(rows, v), "cancelled", "UV nghỉ ngày dd/mm/yyyy")`; `recalc` → `syncApplicationPayouts(replaceOpen: true)`. Trả như GET.

- [ ] **Viết test fail:**
```ts
test("filterPayouts + tổng theo bộ lọc", () => {
  const rows = [
    { status: "due" as const, amount: 1_000_000, due_date: "2026-11-02", job_id: "j1", referrer_id: "r-maiha", hr_user_id: null },
    { status: "approved" as const, amount: 500_000, due_date: "2026-10-30", job_id: "j2", referrer_id: null, hr_user_id: "u-thao" },
    { status: "due" as const, amount: null, due_date: "2026-11-05", job_id: "j1", referrer_id: "r-cat", hr_user_id: null },
    { status: "paid" as const, amount: 2_000_000, due_date: "2026-09-01", job_id: "j1", referrer_id: "r-maiha", hr_user_id: null }];
  assert.equal(filterPayouts(rows, { statuses: ["due", "approved"], beneficiaryKey: null, jobId: null, month: null }).total, 1_500_000);
  assert.equal(filterPayouts(rows, { statuses: ["due", "approved"], beneficiaryKey: "user:u-thao", jobId: null, month: null }).rows.length, 1);
  assert.equal(filterPayouts(rows, { statuses: [], beneficiaryKey: null, jobId: "j1", month: "2026-11" }).rows.length, 2); // statuses [] = mọi trạng thái
  assert.deepEqual(referrerTotals(rows).get("r-maiha"), { paid: 2_000_000, outstanding: 1_000_000 });
});
test("parseAppReferralPatch", () => {
  assert.deepEqual(parseAppReferralPatch({ start_date: "2026-11-02" }), { start_date: "2026-11-02" });
  assert.deepEqual(parseAppReferralPatch({ left_date: null, recalc: true }), { left_date: null, recalc: true });
  assert.ok("error" in parseAppReferralPatch({ start_date: "02/11/2026" }));
  assert.ok("error" in parseAppReferralPatch({}));
  assert.deepEqual(parseAppReferralPatch({ referred_by: "  " }), { referred_by: null });
});
```
- [ ] **Chạy** → FAIL.
- [ ] **Implement** lib + 7 route theo Interfaces (`runtime = "nodejs"`, `dynamic = "force-dynamic"`, lỗi DB → 500 như route hiện có). `unknownCodes` = `unknownRefCodes` trên `applications.referred_by` (select chỉ cột này).
- [ ] **Chạy** test → PASS; `npx tsc --noEmit`; `npx eslint src/app/api/hr/referrals src/lib/referral-*.ts` → sạch.
- [ ] **Commit** `feat(hr): API bảng hoa hồng (khoản, người giới thiệu, quy tắc, hồ sơ)`.

---

### Task 7: Cron hằng ngày + thông báo

**Files:**
- Create: `src/app/api/hr/referrals/cron/route.ts`
- Modify: `src/lib/referral-commission.ts`, `src/lib/referral-commission.test.ts`, `src/lib/hr-notify.ts`, `src/app/api/hr/referrals/payouts/[id]/route.ts`, `.github/workflows/hr-remind.yml`

**Interfaces — Consumes:** `RecipientStaff`, `discordTagFor`, `withTag` (`hr-notify-recipients.ts`); `loadNotifyStaff`, `sendHrPush`, `discordNotify`; `requireCronOrHr`; `DEFAULT_ASSIGNEE_KEY`; `vnDateKey`.
**Produces:**
```ts
export function referralNotifyTargets(i: { event: "due" | "approved"; staff: RecipientStaff[]; perms: Map<HrRole, Set<PermissionKey>>; assigneeId: string | null; defaultAssigneeId: string | null }): string[];
// hr-notify.ts
export async function notifyReferralPayouts(event: "due" | "approved", rows: { application_id: string; candidate_name: string; assignee_user_id: string | null; amount_issue: AmountIssue | null }[]): Promise<void>;
// GET /api/hr/referrals/cron → { today, movedToDue: number, notifiedDue: number, notifiedApproved: number }
```

- [ ] **Viết test fail:**
```ts
const st: RecipientStaff[] = [
  { id: "u-phuong", role: "hr", disabled: false, discord_user_id: "1" }, { id: "u-dung", role: "hr", disabled: false, discord_user_id: null },
  { id: "u-thao", role: "accountant", disabled: false, discord_user_id: "2" }, { id: "u-toan", role: "boss", disabled: false, discord_user_id: "3" },
  { id: "u-lead", role: "leader", disabled: false, discord_user_id: "4" }];
const perms = new Map(HR_ROLES.map((r) => [r, effectivePermissions(r, [])]));
test("referralNotifyTargets", () => {
  assert.deepEqual(referralNotifyTargets({ event: "due", staff: st, perms, assigneeId: "u-phuong", defaultAssigneeId: null }), ["u-phuong"]);
  assert.deepEqual(referralNotifyTargets({ event: "due", staff: st, perms, assigneeId: "u-lead", defaultAssigneeId: "u-dung" }), ["u-dung"]); // Leader không có referrals.manage
  assert.deepEqual(referralNotifyTargets({ event: "due", staff: st, perms, assigneeId: null, defaultAssigneeId: null }), ["u-phuong", "u-dung"]);
  assert.deepEqual(referralNotifyTargets({ event: "approved", staff: st, perms, assigneeId: "u-phuong", defaultAssigneeId: null }), ["u-thao"]);
  const noAcc = st.filter((u) => u.role !== "accountant");
  assert.deepEqual(referralNotifyTargets({ event: "approved", staff: noAcc, perms, assigneeId: null, defaultAssigneeId: null }), ["u-toan"]);
});
```
- [ ] **Chạy** → FAIL.
- [ ] **Implement.** `referralNotifyTargets`: chỉ tài khoản chưa khoá; `due` → assignee nếu vai có `referrals.manage`, không thì default assignee (cùng điều kiện), không thì mọi `hr` có `referrals.manage`, rỗng → mọi `boss`; `approved` → mọi `accountant` có `referrals.pay`, rỗng → mọi `boss`. `notifyReferralPayouts`: gom người nhận theo từng dòng, mỗi event 1 tin Discord (`due` → kênh `hr`; `approved` → `offer` nếu có `DISCORD_WEBHOOK_OFFER`, không thì `hr`), **không** `@everyone`, **không** số tiền: `💰 {n} khoản hoa hồng đến hạn — xác nhận UV còn làm: {tên, …} · /hr › Hoa hồng` (thêm "· {k} khoản chưa đặt mức" nếu có `amount_issue`) / `💸 {n} khoản hoa hồng chờ chuyển khoản: {tên, …}`; push trực tiếp `sendHrPush({ title, body, url: "/hr", tag: "hr-referral-{event}" }, { userIds })` (không xét `push.receive`). Lỗi chỉ log. Cron route: `requireCronOrHr`; `today = vnDateKey(new Date())`; update `status='due'` where `status='upcoming' and due_date <= today`; chọn `due` + `due_notified_at is null` (join `applications(full_name, assignee_user_id)`) → notify → set `due_notified_at`; tương tự `approved` / `approved_notified_at`. PATCH payout `approve` thành công → gọi ngay `notifyReferralPayouts("approved", …)` + set `approved_notified_at` (cron là lưới an toàn). Workflow: thêm step thứ 2 trong job `remind` curl `GET https://tdgamestudio.com/api/hr/referrals/cron` với `x-hr-cron-key`, fail nếu ≠ 200.
- [ ] **Chạy** test → PASS; `npx tsc --noEmit`; `npx eslint src/app/api/hr/referrals/cron src/lib/hr-notify.ts`.
- [ ] **Commit** `feat(hr): cron nhắc hoa hồng đến hạn + báo Kế toán khoản chờ trả`.

---

### Task 8: Tab "Hoa hồng" (CommissionPanel)

**Files:**
- Create: `src/app/hr/_components/CommissionPanel.tsx`
- Modify: `src/app/hr/_components/HRDashboard.tsx` (`View` thêm `"referrals"`, nhãn "Hoa hồng", hiện khi `can("referrals.view")`, render `<CommissionPanel />`)

**Interfaces — Consumes:** API Task 6; `filterPayouts`, `beneficiaryKey`, `milestoneLabel`, `parseRule`, `DEFAULT_RULES` (import không đuôi `.ts` từ `@/lib/referral-commission` như client hiện có); `useHrSession().can`.
**Produces:**
```ts
export default function CommissionPanel(): JSX.Element;
export function RuleEditor(p: { value: CommissionRule | null; onChange: (v: CommissionRule | null) => void; allowEmpty: boolean; disabled?: boolean }): JSX.Element; // fixed VND | hệ số lương + danh sách mốc {tháng, %}, báo lỗi parseRule tại chỗ
```

- [ ] **Không thêm unit test** (lọc/tổng đã test ở `filterPayouts`). Kiểm bằng tay ở bước chạy.
- [ ] **Implement** 3 mục con:
  - **Khoản**: lọc trạng thái (chip đa chọn, mặc định `due` + `approved`), người giới thiệu, job, tháng (`YYYY-MM`); dòng tổng `filterPayouts(...).total`; cột: người giới thiệu (+ loại), ứng viên, job, mốc, số tiền (`amount_issue` → "Chưa đặt mức" / "Thiếu lương"), ngày đến hạn (+ "dự kiến" khi `due_estimated`, "chưa có ngày" khi null), trạng thái VN (Sắp tới / Đến hạn / Chờ trả / Đã trả / Đã huỷ). Hành động: `referrals.manage` → "Xác nhận còn làm" (`approve`), "Huỷ (UV đã nghỉ)" (prompt lý do); `referrals.pay` → "Đã chuyển khoản" (chọn ngày, mặc định hôm nay), "Sửa" (số tiền / hạn / ghi chú; khoản đã trả chỉ ghi chú). Hiện lỗi API tại dòng.
  - **Người giới thiệu**: bảng tên, loại ("Chưa phân loại" khi null), mã (mã đầu in đậm), đã trả / còn phải trả, nút copy link `${origin}/careers?ref={mã chính}`, thêm/sửa (form đủ trường spec + `RuleEditor` mức riêng + chọn tài khoản `hr_user_id` khi `referrals.manage`). Khối **"Mã chưa phân loại"** từ `unknownCodes`: mỗi mã có "Thêm người mới" (điền sẵn tên = mã) và "Gộp vào…" (PATCH referrer append mã).
  - **Cài đặt**: `RuleEditor` cho mặc định `internal` / `external` (`allowEmpty` cho external), lưu qua `PUT /defaults`; chỉ sửa được khi `referrals.manage`.
- [ ] **Chạy** `npx tsc --noEmit`; `npx eslint src/app/hr/_components/CommissionPanel.tsx src/app/hr/_components/HRDashboard.tsx`; `npm run dev`, đăng nhập Sếp: tab hiện, đổi bộ lọc tổng đổi theo; đăng nhập Leader (hoặc tắt `referrals.view` cho HR): tab không hiện và `GET /api/hr/referrals` → 403.
- [ ] **Commit** `feat(hr): tab Hoa hồng — khoản, người giới thiệu, cài đặt`.

---

### Task 9: Chèn vào Jobs / form job / khối Offer + cập nhật memory

**Files:**
- Modify: `src/app/hr/_components/HRDashboard.tsx` (`JobsView`, `JobForm`, `OfferSection`), `src/app/hr/_components/CommissionPanel.tsx`
- Modify: `.agent/meta/TASKS.md`, `.agent/meta/LOG.md`, `.agent/meta/DECISIONS.md`, `.agent/meta/API.md`, `.agent/meta/SCHEMA.md`

**Interfaces — Produces (trong `CommissionPanel.tsx`):**
```ts
export function JobRulesFields(p: { jobId: string | null }): JSX.Element | null;   // null khi !can("referrals.view")
export function ReferralOfferBlock(p: { appId: string; offerStatus: string | null }): JSX.Element | null;
```

- [ ] **Không thêm unit test** (UI). Chạy `impact` cho `JobsView`, `JobForm`, `OfferSection` trước khi sửa.
- [ ] **Implement:**
  - `JobsView` ô "Tạo link cho headhunter": khi `can("referrals.view")` thêm `<datalist>` từ `GET /api/hr/referrals/referrers` (hiện "Tên — mã", chỉ referrer `active`, giá trị = mã chính); vẫn gõ tự do. Copy Link với mã không có trong danh sách và `can("referrals.manage")` → `POST /api/hr/referrals/referrers { name: mã, kind: null, ref_codes: [mã] }` (409 bỏ qua) + dòng nhắc "đã thêm vào danh sách, chưa phân loại".
  - `JobForm`: sau phần advanced, `<JobRulesFields jobId={id ?? null} />` — 2 `RuleEditor` (Nội bộ / Freelancer–headhunter, `allowEmpty` = "dùng mặc định công ty" / "chưa đặt"); job mới → "Lưu job trước rồi đặt mức hoa hồng"; lưu riêng bằng nút trong khối (`PUT job-rules`), chỉ sửa khi `referrals.manage`.
  - `OfferSection`: khi `can("referrals.view")` và `offerStatus === "accepted"` (hoặc đã có khoản), render `ReferralOfferBlock`: "Người giới thiệu: {tên} ({Nội bộ|Headhunter|Chưa phân loại}) · Hoa hồng: {n} mốc" hoặc "không có"; ngày đi làm thực tế (input date, nhãn "dự kiến từ thư mời" khi chưa xác nhận), ngày nghỉ, sửa mã người giới thiệu, nút "Tính lại" (confirm: "Các khoản chưa duyệt sẽ được tính lại theo quy tắc hiện tại") — các ô sửa chỉ khi `referrals.manage`.
  - Memory: TASKS (Done), LOG (entry hôm nay: Task / Work Done / Result / Next Step — gồm "controller áp migration 20261029000000 qua MCP; Phương phân loại mã lần đầu"), DECISIONS (quyết định ở mục Ambiguities bên dưới), API.md (route mới), SCHEMA.md (4 bảng mới).
- [ ] **Chạy** `npx tsc --noEmit`; `npx eslint src/app/hr/_components`; `node --test src/lib/*.test.ts` → PASS; `npm run build` thành công. Kiểm tay trên dev (sau khi migration có trên DB dev/prod): hồ sơ fulltime ref `thaodtx` → Offer "Đã nhận" → 2 khoản 1.000.000; đổi sang "Từ chối" → 2 khoản "Đã huỷ"; hồ sơ ref `phuongx`/mã Sếp → không khoản; freelancer → không khoản.
- [ ] **`detect_changes({ scope: "compare", base_ref: "main" })`** → chỉ symbol dự kiến.
- [ ] **Commit** `feat(hr): chọn người giới thiệu ở Jobs, quy tắc theo job, khối hoa hồng trên Offer`.

---

## Quyết định khi lập plan (ghi DECISIONS.md)

- Ngày đi làm thực tế / ngày nghỉ lưu ở bảng riêng `referral_placements` (không thêm cột `applications` → không đụng `redactApplication`).
- Quy tắc theo job ở bảng `referral_job_rules`, mặc định công ty ở `app_settings.referral_default_rules`.
- Không có quy tắc (external chưa đặt, referrer chưa phân loại) → 1 dòng giữ chỗ mốc 0 / 100% `amount_issue = no_rule`; đặt mức xong bấm "Tính lại" (xoá mọi khoản `upcoming`/`due` của hồ sơ, giữ `approved`/`paid`, sinh mốc còn thiếu). Hoặc Sếp/Kế toán nhập tay số tiền.
- `salary_multiple` làm tròn xuống đồng.
- Đổi ngày đi làm chỉ dời khoản `upcoming`/`due`; khoản `approved` giữ ngày.
- Đổi người giới thiệu của hồ sơ → tự "Tính lại".
- Cron chạy cùng workflow `hr-remind.yml` (T2–T6, 9h VN); cuối tuần UI vẫn tự hiện "Đến hạn", tin nhắc tới sáng thứ Hai. Khoản `approved` báo Kế toán ngay khi Phương xác nhận, cron là lưới an toàn.
- Nhắc "đến hạn": người phụ trách nếu có `referrals.manage`, không thì người support mặc định, không thì mọi HR; Kế toán nhận push trực tiếp (không cần `push.receive`).
- Tài khoản Kế toán bị khoá vẫn được hưởng (như người giới thiệu nội bộ đã nghỉ).
