# /hr Onboard người mới — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hồ sơ đã nhận offer có ngày đi làm hiển thị rõ, checklist onboard chung để tích, và nhắc Discord/push tự động trước – trong – hết tuần đầu.

**Architecture:** Logic thuần trong `src/lib/hr-onboarding.ts` (test bằng `node --test`), I/O trong `src/lib/hr-onboarding-store.ts`; bảng mới `hr_onboarding` + mẫu checklist ở `app_settings`. Ngày đi làm dùng chung `effectiveStartDate` của hoa hồng; sửa ngày qua một hàm dùng chung tách từ route hoa hồng. Nhắc chạy trong workflow 15 phút có sẵn.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (service client), Tailwind v4 token `--hr-*`, `node --test` cho lib thuần.

**Spec:** `docs/superpowers/specs/2026-11-18-hr-onboarding-design.md` (đọc cả spec — plan chỉ ghi quyết định cụ thể).

## Global Constraints

- **Không lộ lương**: không route/onboard field nào trả dữ liệu thư mời ngoài `startDate`; query `offer_letters` cho onboard chỉ được select `application_id, data->>startDate` (không bao giờ `data`).
- Đủ điều kiện = `offer_status === "accepted"` và `work_type !== "freelancer"` (null = đủ).
- Ngày theo giờ VN: `vnDateString`, `addWorkingDays` từ `src/lib/offer-letter.ts`. Không tính ngày lễ.
- Mẫu checklist: ≥ 1 mục, ≤ 30 mục, nhãn 1–200 ký tự, `stage ∈ before|day1|week1`, `leader: boolean`, id duy nhất.
- Nhắc chỉ gửi khi giờ VN ≥ 08:00; mỗi mốc 1 lần cho 1 `for_date`; không gửi bù mốc đã qua; mốc mà mọi mục giai đoạn đó đã tích → bỏ; nội dung nhắc không có lương.
- Route /hr theo khuôn hiện có: `requireHrUser(req, perm?)` (đã chặn cross-origin cho method ghi), `loadScopedApplication(ctx, id, cols)` → null = 404.
- Mọi lib test chạy: `node --test src/lib/<file>.test.ts`. Trước commit: `npx tsc --noEmit -p .` và `npx eslint <files>` sạch.
- GitNexus `impact` (repo `tdgames-landingpage`) trước khi sửa: `candidateRecipients`, `effectiveStartDate`/route PATCH referrals, `redactApplication`/`BASE_FIELDS`, GET `/api/hr/applications`, `EmailTemplatesPanel`, `OfferSection`. Báo HIGH/CRITICAL cho controller.

## Review Focus

1. **Đổi ngày đi làm sau khi đã nhắc mốc `before`** → mốc của ngày mới được nhắc lại (vì `for_date` khác); mốc đã qua của ngày cũ không gửi. Test: `dueReminders` (Task 1).
2. **Cron chết cả ngày / chạy trễ** → không gửi muộn mốc của ngày hôm qua. Test: `dueReminders` today ≠ stage date → [] (Task 1).
3. **Offer đổi khỏi `accepted` sau khi đã có checklist** → khối ẩn, cron bỏ qua, dữ liệu giữ; quay lại `accepted` hiện đúng tiến độ cũ. Test: E2E bước 4 (Task 7).
4. **Leader / Kế toán đọc danh sách pipeline** → field `onboarding` có, không có field thư mời/lương nào. Test: E2E bước 6 (Task 7) + kiểm select trong Task 4.
5. **Hai người tích gần như cùng lúc** → cả hai dấu tích còn. Test: `setItemDone` thuần (Task 1) + store dùng `updated_at` (Task 3) + E2E bước 3 bắn 2 PATCH song song (Task 7).

---

### Task 1: Logic thuần onboard

**Files:**
- Create: `src/lib/hr-onboarding.ts`
- Test: `src/lib/hr-onboarding.test.ts`

**Interfaces:**
- Produces:
  - `type OnboardStage = "before" | "day1" | "week1"`
  - `type OnboardTemplateItem = { id: string; label: string; stage: OnboardStage; leader: boolean }`
  - `type OnboardItem = OnboardTemplateItem & { done_at: string | null; done_by_user_id: string | null; done_by_name: string | null }`
  - `type OnboardReminded = Partial<Record<OnboardStage, { at: string; for_date: string }>>`
  - `const ONBOARD_STAGES: readonly OnboardStage[]` = `["before","day1","week1"]`; `const STAGE_LABEL: Record<OnboardStage,string>` = Trước ngày đi làm / Ngày đầu / Cuối tuần đầu
  - `const DEFAULT_ONBOARDING_TEMPLATE: OnboardTemplateItem[]` — 9 mục đúng bảng spec, id cố định: `confirm-date, notify-team, prepare-seat, accounts, welcome, contract, documents, leader-guide, week1-checkin`; chỉ `leader-guide` có `leader: true`
  - `sanitizeOnboardingTemplate(input: unknown): OnboardTemplateItem[]` — giữ mục hợp lệ (object có label string), trim, stage sai → bỏ mục, leader không phải `true` → false, id thiếu → `crypto.randomUUID()`
  - `validateOnboardingTemplate(items: OnboardTemplateItem[]): string | null` — lỗi tiếng Việt theo Global Constraints
  - `isOnboardingEligible(app: { offer_status: string | null; work_type: string | null }): boolean`
  - `itemsFromTemplate(t: OnboardTemplateItem[]): OnboardItem[]`
  - `onboardingProgress(items: OnboardItem[]): { done: number; total: number }`
  - `prevWorkingDay(date: string): string` (YYYY-MM-DD; T2 → T6 trước; ngày sai → trả nguyên)
  - `reminderDates(startDate: string): Record<OnboardStage, string>` — before = `prevWorkingDay`, day1 = start, week1 = `addWorkingDays(start, 4)`
  - `dueReminders(i: { startDate: string | null; items: OnboardItem[]; reminded: OnboardReminded; todayVn: string; minutesVn: number }): OnboardStage[]`
  - `canTickItem(i: { role: HrRole; perms: Set<PermissionKey>; isJobLeader: boolean; item: OnboardTemplateItem }): boolean` — boss hoặc có `onboard.edit` → true; role `leader` + `isJobLeader` + `item.leader` + có `onboard.view` → true; còn lại false
  - `setItemDone(items: OnboardItem[], itemId: string, done: boolean, actor: { id: string; name: string }, nowIso: string): OnboardItem[] | null` — null nếu không có id; bỏ tích → 3 field done_* = null; chỉ đổi đúng 1 mục
  - `onboardingCardState(i: { startDate: string | null; items: OnboardItem[]; todayVn: string }): "done" | "overdue" | "active"` — done khi mọi mục đã tích; overdue khi có ngày và `todayVn > reminderDates(start).week1` mà chưa xong

- [ ] **Step 1: Viết test thất bại** — `src/lib/hr-onboarding.test.ts`:

```ts
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
```

(`canTickItem` dùng `onboard.view`/`onboard.edit` — Task 2 thêm key; nếu chạy Task 1 trước Task 2, tsc báo lỗi kiểu `PermissionKey` — controller làm Task 2 trước Task 1, hoặc gộp commit. **Thứ tự thực thi: Task 2 → Task 1.**)

- [ ] **Step 2:** `node --test src/lib/hr-onboarding.test.ts` → FAIL (module chưa có).
- [ ] **Step 3:** Viết `src/lib/hr-onboarding.ts` theo Interfaces (thuần, import kiểu từ `hr-permissions.ts`, ngày từ `offer-letter.ts` bằng đuôi `.ts` như các lib test khác). `dueReminders`: `minutesVn < 480` → []; với mỗi stage: có ngày, `reminderDates(start)[stage] === todayVn`, `reminded[stage]?.for_date !== startDate`, còn ≥ 1 mục chưa tích của stage.
- [ ] **Step 4:** `node --test src/lib/hr-onboarding.test.ts` → PASS; `npx tsc --noEmit -p .` sạch.
- [ ] **Step 5:** Commit `feat(hr): logic thuần onboard (checklist, mốc nhắc, quyền tích)`.

### Task 2: Migration, quyền, sự kiện thông báo, field danh sách

**Files:**
- Create: `supabase/migrations/20261118000000_hr_onboarding.sql`
- Modify: `src/lib/hr-permissions.ts` (thêm 3 quyền, nhóm mới "Onboard người mới"), `src/lib/hr-notify-recipients.ts` (`NotifyEvent` + `LEADER_EVENTS` thêm `"onboard_remind"`), `src/lib/hr-scope.ts` (`BASE_FIELDS` thêm `"onboarding"`)
- Test: `src/lib/hr-notify-recipients.test.ts`, `src/lib/hr-permissions.test.ts` (nếu có; không có thì thêm test vào `hr-scope.test.ts`)

**Interfaces:**
- Produces: `PermissionKey` có `"onboard.view" | "onboard.edit" | "onboard.template"` với defaults `d(true,true,true)`, `d(true,false,true)`, `d(true,false,false)`; nhãn đúng bảng spec. `NotifyEvent` có `"onboard_remind"`. Bảng:

```sql
create table if not exists public.hr_onboarding (
  application_id uuid primary key references public.applications(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  reminded jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hr_onboarding enable row level security;  -- chỉ service role đọc/ghi, như các bảng /hr khác
```

- [ ] **Step 1:** Test thất bại: `candidateRecipients({ event: "onboard_remind", … jobLeaderId: "l1", assigneeId: "h1" })` gồm boss + h1 + l1; `effectivePermissions("leader", [])` có `onboard.view`, không có `onboard.edit`; `effectivePermissions("accountant", [])` có `onboard.edit`, không `onboard.template`; `redactApplication({ id: "a", onboarding: { done: 1 } }, new Set())` giữ `onboarding`.
- [ ] **Step 2:** Chạy các test đó → FAIL.
- [ ] **Step 3:** Sửa 3 file lib + viết migration.
- [ ] **Step 4:** Test PASS + tsc sạch. Controller áp migration lên prod qua Supabase MCP `apply_migration` (chỉ CREATE — an toàn) **trước khi deploy bất kỳ code nào đọc bảng**.
- [ ] **Step 5:** Commit `feat(hr): bảng hr_onboarding + quyền onboard.* + sự kiện onboard_remind`.

### Task 3: Store onboard + tách hàm đổi ngày đi làm

**Files:**
- Create: `src/lib/hr-onboarding-store.ts` (`import "server-only"`)
- Modify: `src/lib/referral-store.ts` (thêm `applyStartDateChange`), `src/app/api/hr/referrals/applications/[id]/route.ts` (khối `if (patch.start_date !== undefined) {…}` + khối áp lại huỷ mốc khi đổi ngày → gọi `applyStartDateChange`; hành vi không đổi)

**Interfaces:**
- Consumes: Task 1 kiểu + `itemsFromTemplate`, `sanitizeOnboardingTemplate`, `DEFAULT_ONBOARDING_TEMPLATE`, `onboardingProgress`.
- Produces:
  - `applyStartDateChange(appId: string, date: string | null): Promise<void>` (referral-store) — đúng chuỗi việc route referrals đang làm khi có `start_date`: `savePlacement(start_date, start_confirmed = date !== null)` → dời hạn khoản (`rescheduleDueDates` + `statusAfterDueEdit`, xoá `due_notified_at`) → nếu placement có `left_date` hợp lệ thì `cancelOnLeave`.
  - `loadOnboardingTemplate(): Promise<{ items: OnboardTemplateItem[]; saved: boolean }>` — `app_settings` key `hr_onboarding_checklist` (value JSON text, như `loadOfferDefaults`); sai JSON/rỗng sau sanitize → DEFAULT.
  - `saveOnboardingTemplate(items: OnboardTemplateItem[]): Promise<void>`; `resetOnboardingTemplate(): Promise<void>` (xoá key).
  - `type OnboardingRow = { items: OnboardItem[]; reminded: OnboardReminded; updated_at: string }`
  - `ensureOnboarding(appId: string): Promise<OnboardingRow>` — insert `items = itemsFromTemplate(template)` on conflict do nothing (`upsert(..., { onConflict: "application_id", ignoreDuplicates: true })`), rồi đọc lại.
  - `updateOnboardingItems(appId: string, mutate: (items: OnboardItem[]) => OnboardItem[] | null): Promise<OnboardingRow | "not_found" | "conflict">` — đọc → mutate (null → "not_found") → `update … eq("updated_at", old)` set `updated_at = now()`; 0 dòng → đọc lại + áp lại 1 lần; vẫn 0 → "conflict".
  - `markReminded(appId: string, stage: OnboardStage, forDate: string): Promise<void>` — merge vào `reminded` (đọc–ghi; cron chạy tuần tự nên không cần khoá).
  - `loadOnboardingSummaries(appIds: string[]): Promise<Map<string, { start_date: string | null; confirmed: boolean; done: number; total: number }>>` — 3 query theo lô: `referral_placements(application_id,start_date,start_confirmed)`, `offer_letters` select **`application_id, start:data->>startDate`**, `hr_onboarding(application_id, items)`; chưa có dòng onboard → done 0 / total = độ dài mẫu hiện tại. Ngày: placement hợp lệ trước, rồi thư mời (giống `effectiveStartDate`).

- [ ] **Step 1:** GitNexus `impact` cho `effectiveStartDate` + route PATCH referrals; ghi blast radius vào báo cáo.
- [ ] **Step 2:** Tách `applyStartDateChange` và cho route referrals gọi nó; chạy `node --test src/lib/referral-commission.test.ts` → vẫn PASS (không đổi logic thuần).
- [ ] **Step 3:** Viết `hr-onboarding-store.ts` theo Interfaces.
- [ ] **Step 4:** `npx tsc --noEmit -p .` + eslint sạch. (Store là I/O — kiểm bằng E2E Task 7.)
- [ ] **Step 5:** Commit `feat(hr): store onboard + applyStartDateChange dùng chung với hoa hồng`.

### Task 4: API onboard + mẫu checklist + field danh sách

**Files:**
- Create: `src/app/api/hr/applications/[id]/onboarding/route.ts`, `src/app/api/hr/onboarding-template/route.ts`
- Modify: `src/app/api/hr/applications/route.ts`

**Interfaces:**
- Consumes: Task 1, Task 3.
- Produces (JSON client dùng ở Task 6):
  - `GET /api/hr/applications/[id]/onboarding` (`onboard.view`; hồ sơ qua `loadScopedApplication(ctx, id, "id, job_id, offer_status, work_type")`) → không đủ điều kiện: `{ eligible: false }`; đủ: `{ eligible: true, start: { date: string | null; confirmed: boolean }, items: OnboardItem[], progress: { done, total }, reminded: OnboardReminded, can: { edit: boolean; tickIds: string[] } }` (`tickIds` = id các mục `canTickItem` true; `isJobLeader` = `ctx.role === "leader"` và job của hồ sơ thuộc `leaderJobIds` của scope).
  - `PATCH` cùng URL, body đúng 1 trong 2: `{ item_id: string, done: boolean }` (403 nếu `!canTickItem`; 404 mục lạ; 409 conflict) hoặc `{ start_date: "YYYY-MM-DD" | null }` (`onboard.edit` hoặc boss; ngày sai → 400; gọi `applyStartDateChange`). Không đủ điều kiện → 409 `"Hồ sơ chưa nhận offer"`. Trả lại đúng shape của GET.
  - `GET /api/hr/onboarding-template` (`onboard.view`) → `{ items, saved, builtin: DEFAULT_ONBOARDING_TEMPLATE }`; `PUT` (`onboard.template`) body `{ items }` → sanitize + validate (400 kèm lỗi) → lưu; `DELETE` (`onboard.template`) → về mặc định.
  - `GET /api/hr/applications`: nếu `ctx.perms.has("onboard.view")`, với các hồ sơ `isOnboardingEligible` gắn `onboarding: { start_date, confirmed, done, total }` từ `loadOnboardingSummaries` (lỗi → log + bỏ field).

- [ ] **Step 1:** GitNexus `impact` GET applications route; báo cáo.
- [ ] **Step 2:** Viết 2 route mới + sửa route danh sách.
- [ ] **Step 3:** tsc + eslint sạch; `npm run build` (ngoài sandbox nếu vấp Google Fonts) → OK.
- [ ] **Step 4:** Commit `feat(hr): API onboard (xem/tích/sửa ngày) + mẫu checklist + tiến độ trên danh sách`.

### Task 5: Nhắc việc onboard

**Files:**
- Create: `src/app/api/hr/onboarding/remind/route.ts`
- Modify: `src/lib/hr-push-payload.ts` (thêm `onboardingReminderPayload`), `.github/workflows/hr-interview-remind.yml` (thêm bước)
- Test: `src/lib/hr-push-payload.test.ts`

**Interfaces:**
- Consumes: Task 1 `dueReminders`, `reminderDates`, `STAGE_LABEL`; Task 3 `ensureOnboarding`, `markReminded`; `effectiveStartDate`; `dispatchCandidateNotify`, `loadNotifyStaff`, `toNotifyApp`.
- Produces: `onboardingReminderPayload(i: { stage: OnboardStage; appId: string; candidateName: string; startDate: string; pending: string[] }): PushPayload` — tag `hr-onboard-<stage>-<appId>`, url `/hr`, title: before `"Mai có người mới đi làm"`, day1 `"Hôm nay có người mới đi làm"`, week1 `"Hết tuần đầu của người mới"`; body bắt đầu bằng tên ứng viên + ngày (`formatDateVi`), rồi "còn N việc", cắt ≤160.

- [ ] **Step 1:** Test thất bại cho `onboardingReminderPayload`: tag/title đúng từng stage; body chứa tên + "Thứ Hai 23/11/2026" + "còn 2 việc"; body không chứa chữ số kiểu tiền (`/\d{1,3}(\.\d{3}){2}/` không khớp).
- [ ] **Step 2:** Chạy → FAIL. **Step 3:** Viết payload → PASS.
- [ ] **Step 4:** Route `GET` (`requireCronOrHr`): giờ VN = `now + 7h`; lấy `applications` có `offer_status = 'accepted'`, `work_type` khác freelancer (lọc bằng `isOnboardingEligible`), kèm `jobs(title, leader_user_id)`; mỗi hồ sơ: `effectiveStartDate` → không có ngày bỏ qua → `ensureOnboarding` → `dueReminders` → mỗi stage: `dispatchCandidateNotify({ event: "onboard_remind" }, app, staffCtx, { content, embeds, push, pushPerm: "onboard.view" })` rồi `markReminded`. Discord: content `🗓 **Onboard** — <tên> · <STAGE_LABEL>`; embed title `<tên> — <job>`, field "Ngày đi làm" (`formatDateVi`, thêm " (dự kiến)" nếu chưa xác nhận), field "Còn chưa xong" = danh sách nhãn chưa tích của stage (≤ 10 dòng). Trả `{ checked, sent, pushed }`.
- [ ] **Step 5:** Workflow: thêm bước `🧑‍💼 Trigger onboarding remind endpoint` gọi `/api/hr/onboarding/remind` với `if: ${{ !cancelled() }}`, cùng khuôn curl/exit như bước PV.
- [ ] **Step 6:** tsc + eslint + test sạch. Commit `feat(hr): nhắc onboard Discord/push (trước 1 ngày làm việc, ngày đầu, hết tuần đầu)`.

### Task 6: Giao diện

**Files:**
- Create: `src/app/hr/_components/OnboardingSection.tsx`, `src/app/hr/_components/OnboardingTemplatePanel.tsx`
- Modify: `src/app/hr/_components/HRDashboard.tsx` (kiểu `Application` thêm `onboarding?: { start_date: string | null; confirmed: boolean; done: number; total: number } | null`; thẻ: thêm badge cạnh badge "Chờ duyệt offer" ~dòng 1530; hồ sơ: render `<OnboardingSection>` ngay sau `<OfferSection>`), `src/app/hr/_components/EmailTemplatesPanel.tsx` (thanh tab thêm "Checklist onboard" khi `can("onboard.template")`; đổi `letterOpen: boolean` thành `special: null | "letter" | "onboarding"`, giữ confirm khi đang sửa dở)

**Interfaces:**
- Consumes: Task 4 JSON; Task 1 `STAGE_LABEL`, `ONBOARD_STAGES`, `onboardingCardState`, `reminderDates`; `formatDateVi`, `vnDateString`.
- Produces: `OnboardingSection({ app, onProgress }: { app: Application; onProgress: (o: Application["onboarding"]) => void })` — gọi `onProgress` sau mỗi PATCH để thẻ cập nhật ngay; `OnboardingTemplatePanel({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void })`.

- [ ] **Step 1:** GitNexus `impact` `OfferSection`, `EmailTemplatesPanel`; báo cáo.
- [ ] **Step 2:** Badge thẻ: chỉ khi `app.onboarding` có; nội dung `🗓 Đi làm <T2 23/11> · <done>/<total>` (ngày null → `🗓 Chưa có ngày đi làm`); state `done` → `✅ Đã onboard`; `overdue` → màu cảnh báo (token danger); `confirmed === false` → title "dự kiến từ thư mời".
- [ ] **Step 3:** `OnboardingSection`: ẩn khi `eligible === false`; đầu khối: ngày đi làm (`formatDateVi`) + nhãn "dự kiến từ thư mời" nếu chưa xác nhận; `can.edit` → ô date + Lưu + nút "Về ngày trên thư mời" (PATCH `start_date: null`); 3 nhóm theo `ONBOARD_STAGES`, mỗi mục checkbox (disabled nếu id không thuộc `can.tickIds`), nhãn "Leader" cho `leader: true`, dòng phụ `"<done_by_name> · <HH:MM DD/MM>"`; lỗi 409 → tải lại + báo "Vừa có người khác cập nhật, đã tải lại".
- [ ] **Step 4:** `OnboardingTemplatePanel`: danh sách mục (ô nhãn, select giai đoạn, checkbox "Leader tích được", nút lên/xuống/xoá), "Thêm mục", Lưu (PUT) / Về mặc định (DELETE, confirm); dirty → `onDirtyChange(true)`; dòng chú thích "Sửa mẫu chỉ áp cho người onboard sau, không đổi người đang onboard."
- [ ] **Step 5:** tsc + eslint + `npm run build` sạch. Kiểm Playwright local (`npm run dev`, đăng nhập tài khoản trợ lý bằng creds `.env.local` — xem memory hr-assistant-account): hồ sơ thử accepted hiện khối + tích + thẻ đổi số; tab Mẫu mail có "Checklist onboard"; Sáng/Tối, 1440 + 390px.
- [ ] **Step 6:** Commit `feat(hr): UI onboard — thẻ, khối Onboard trong hồ sơ, mẫu checklist`.

### Task 7: E2E trên prod sau deploy + ghi nhớ

**Files:**
- Modify: `.agent/meta/LOG.md`, `.agent/meta/TASKS.md`, `.agent/meta/API.md`, `.agent/meta/SCHEMA.md`

- [ ] **Step 1:** Migration đã áp (Task 2). `npx gitnexus detect-changes` / MCP `detect_changes({scope:"compare", base_ref:"origin/main"})` → chỉ phạm vi onboard + route referrals + danh sách. Push → CI deploy → `gh run watch` success.
- [ ] **Step 2:** Tạo dữ liệu thử trên prod bằng tài khoản trợ lý: 1 job thử ẩn + 1 hồ sơ "ZZ Test Onboard (tạm)" (insert qua service client, KHÔNG gửi mail), `offer_status = 'accepted'`, placement `start_date` = ngày làm việc kế tiếp. GET onboarding → 9 mục, `eligible: true`.
- [ ] **Step 3:** Bắn 2 PATCH tích 2 mục khác nhau song song → GET thấy cả 2 đã tích (Review Focus 5).
- [ ] **Step 4:** PATCH `offer_status` hồ sơ thử → `declined` → GET `{ eligible: false }`, cron bỏ qua; đổi lại `accepted` → tiến độ 2/9 còn nguyên (Review Focus 3).
- [ ] **Step 5:** Gọi `/api/hr/onboarding/remind` với `x-hr-cron-key` (lấy từ VPS `.env.local` qua `tailscale ssh root@vps6core`) khi hôm nay là ngày mốc `before` của hồ sơ thử → `sent ≥ 1`, Discord kênh HR có tin, không có số tiền; gọi lần 2 → `sent: 0`.
- [ ] **Step 6:** Đăng nhập một tài khoản Leader/Kế toán tạm (boss tạm theo memory hr-admin-ops nếu cần, đặt role tương ứng) → GET `/api/hr/applications`: hồ sơ thử có `onboarding`, không có key nào chứa lương/thư mời (Review Focus 4). Leader PATCH mục không phải leader → 403.
- [ ] **Step 7:** Dọn: xoá hồ sơ thử (cascade `hr_onboarding`), placement, job thử, tài khoản tạm; kiểm còn 0. Cập nhật LOG/TASKS/API/SCHEMA; commit `chore(meta): onboard người mới — deploy + E2E`.
