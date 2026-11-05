# /hr Freelancer Pool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tab "Freelancer" riêng trên /hr: kho hồ sơ freelancer với 5 trạng thái, hạng, rate số VNĐ/giờ, cờ "Có vấn đề", lọc; freelancer rời bảng fulltime.

**Architecture:** Dữ liệu vẫn ở `applications` (`work_type='freelancer'`, `status='freelancer'` cố định), thêm 5 cột `freelance_*`/`rate_vnd_per_hour`. Luật thuần ở `src/lib/hr-freelance.ts` (có test node:test); API PATCH khoá status của freelancer; UI là component mới `FreelancerView.tsx` + chế độ freelancer trong `CandidateModal`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (service client), Tailwind v4, node:test (`node --test src/lib/*.test.ts`).

**Spec:** `docs/superpowers/specs/2026-11-05-hr-freelancer-pool-design.md`

## Global Constraints

- Không gửi mail mới/mail bù khi chuyển dữ liệu; đổi stage/hạng/rate/hình thức **không gửi mail**.
- Migration chỉ thêm (ADD COLUMN / ADD CONSTRAINT / INSERT … ON CONFLICT DO NOTHING / UPDATE) — không DROP (Telegram huỷ DROP).
- Stage: `new | talking | testing | collaborated | not_fit` → "Mới / Đang trao đổi / Đang test / Đã hợp tác / Chưa phù hợp".
- Hạng: `fresher | junior | middle | senior` → "Fresher / Junior / Middle / Senior".
- Rate hiển thị dạng `150.000đ/giờ`; chỉ người có `apps.view_salary` thấy/lọc/sửa rate.
- Fulltime (Pipeline/Data/KPI/Jobs/số "đang xử lý"/close-out/xếp hạng AI) bỏ qua `work_type='freelancer'`.
- Freelancer không bao giờ bị auto-reject; nhãn "Nộp trùng" vẫn gắn chéo.

## Review Focus

1. Đơn fulltime cũ có `status='freelancer'` (Lê Thị Kim Chi) → sau migration phải là freelancer, không kẹt ở bảng fulltime (Task 2 kiểm bằng SQL).
2. HR kéo/đổi status hồ sơ freelancer qua API cũ (PATCH `status`) → 400, không đổi (Task 4 test `checkFreelancePatch`).
3. Rate nhập "150.000", "150,000đ", "40 hours", "" → 150000 / 150000 / null / null (Task 1 test `parseRateVnd`).
4. Người không có `apps.view_salary` không nhận `rate_vnd_per_hour` từ API và không thấy cột/lọc rate (Task 4 redact + Task 6 UI ẩn).
5. Ứng viên freelancer từng bị reject fulltime cùng vị trí nộp lại → không auto-reject, vẫn "Nộp trùng" (Task 3 test `classifyDuplicate`).

---

### Task 1: Luật thuần `hr-freelance.ts`

**Files:** Create `src/lib/hr-freelance.ts`, `src/lib/hr-freelance.test.ts`

**Interfaces — Produces:**
- `FREELANCE_STAGES = ["new","talking","testing","collaborated","not_fit"] as const`, `type FreelanceStage`, `STAGE_LABEL: Record<FreelanceStage,string>`
- `FREELANCE_LEVELS = ["fresher","junior","middle","senior"] as const`, `type FreelanceLevel`, `LEVEL_LABEL`
- `isFreelanceApp(a: { work_type?: string | null }): boolean` (= `work_type === "freelancer"`)
- `parseRateVnd(v: unknown): number | null` — số nguyên ≥ 10_000 và ≤ 100_000_000; chuỗi: bỏ mọi ký tự không phải số (dấu . , đ VNĐ khoảng trắng) — nhưng nếu chuỗi chứa chữ cái khác "đ/vnd/vnđ" (vd "hours") → null.
- `formatRateVnd(n: number | null): string` → `"150.000đ/giờ"` hoặc `"—"`.
- `type FreelanceFilter = { jobId: string|null; level: FreelanceLevel|"none"|null; stage: FreelanceStage|null; rateMin: number|null; rateMax: number|null; collaborated: boolean; issue: boolean; jobNotOpen: boolean; q: string }`
- `filterFreelancers<T extends FreelanceRow>(rows: T[], f: FreelanceFilter): T[]` với `FreelanceRow = { job_id: string; full_name: string; email?: string|null; freelance_stage?: string|null; freelance_level?: string|null; rate_vnd_per_hour?: number|null; freelance_issue?: boolean|null; freelance_job_open?: boolean|null }` — rateMin/Max loại hàng rate null; q so không dấu, không hoa thường với tên/email; `collaborated` = stage `collaborated`.

- [ ] **Step 1: Test** `parseRateVnd`: `"150000"`→150000, `"250.000 VNĐ"`→250000, `"150,000đ"`→150000, `150000`→150000, `"40 hours"`→null, `""`→null, `"5000"`→null, `null`→null. `formatRateVnd(150000)==="150.000đ/giờ"`, `formatRateVnd(null)==="—"`. `filterFreelancers`: 4 hàng mẫu, mỗi trường lọc 1 assert (job, level "none" = chưa gắn hạng, stage, rate 100000–200000 loại null, issue, jobNotOpen = `freelance_job_open===false`, q "ngoc anh" khớp "Nguyễn Hồ Ngọc Anh").
- [ ] **Step 2:** `node --test src/lib/hr-freelance.test.ts` → FAIL (module chưa có).
- [ ] **Step 3:** Implement các export trên (bỏ dấu dùng `normalize("NFD").replace(/\p{M}/gu,"")` + đ→d).
- [ ] **Step 4:** test → PASS.
- [ ] **Step 5:** Commit `feat(hr): luật thuần kho freelancer`.

### Task 2: Migration + chuyển dữ liệu

**Files:** Create `supabase/migrations/20261105000000_freelancer_pool.sql`

- [ ] **Step 1:** Viết migration:
  - `alter table applications add column if not exists freelance_stage text not null default 'new'`, `freelance_level text`, `rate_vnd_per_hour integer`, `freelance_issue boolean not null default false`, `freelance_job_open boolean`.
  - CHECK qua `do $$ … if not exists (select 1 from pg_constraint where conname=…) then alter table … add constraint … end if $$`: stage ∈ 5 giá trị; level null hoặc ∈ 4 giá trị; rate null hoặc 10000..100000000.
  - `insert into application_statuses (key,label,position,kind) values ('freelancer','Freelancer',67,'open') on conflict (key) do nothing` (kiểm cột thật của bảng trước khi viết; nếu có cột bắt buộc khác thì điền theo dòng hiện có trên prod).
  - Dữ liệu: `update applications set work_type='freelancer' where status='freelancer' and work_type<>'freelancer'` (Kim Chi); `update applications a set status='freelancer', freelance_stage='new', freelance_job_open = coalesce(j.accepts_freelance,false) or j.type='freelancer' from jobs j where j.id=a.job_id and a.work_type='freelancer'`; `rate_vnd_per_hour` = số từ `rate_per_hour` khi chuỗi chỉ gồm số/./,/khoảng trắng/đ/VNĐ và kết quả 10000..100000000 (regexp trong SQL, cùng luật `parseRateVnd`).
- [ ] **Step 2:** Áp qua `mcp__supabase__execute_sql` (không DROP).
- [ ] **Step 3:** Kiểm: `select full_name, work_type, status, freelance_stage, freelance_job_open, rate_vnd_per_hour from applications where work_type='freelancer'` → 5 dòng (4 cũ + Kim Chi), tất cả status freelancer; Đỗ Thạch Lam job_open=false; Tran Van Linh rate null; Đạt 250000; `select count(*) from applications where status='freelancer' and work_type<>'freelancer'` = 0. **Không có dòng candidate_emails mới.**
- [ ] **Step 4:** Commit `feat(hr): migration kho freelancer`.

### Task 3: Nộp đơn — vào kho freelancer, không auto-reject

**Files:** Modify `src/lib/hr-auto-ack.ts` (+test), `src/lib/hr-duplicates.ts` (+test), `src/lib/application-input.ts` (+test nếu có), `src/app/api/applications/route.ts`, `src/app/apply/[slug]/_client.tsx`

**Interfaces:**
- `freelanceIntake(workType, acceptsFreelance)` đổi thành trả `{ status: "freelancer"; jobOpen: boolean; ackKind: "freelance_received" | "freelance_not_open" } | null` (jobOpen=true → freelance_received).
- `classifyDuplicate(input & { work_type?: string | null }, priors)`: `work_type==="freelancer"` → bỏ nhánh auto_rejected (rơi xuống open_duplicate/returning).
- `sanitizeApplicationInput`: nhận `rate_vnd_per_hour` (dùng `parseRateVnd`); freelancer mà thiếu/không hợp lệ → `{ error: "Invalid rate_vnd_per_hour" }`. `rate_per_hour` (chữ) giữ là "Ghi chú về giá" tuỳ chọn.

- [ ] **Step 1: Test** `freelanceIntake("freelancer", true)` → `{status:"freelancer", jobOpen:true, ackKind:"freelance_received"}`, `(…, false)` → jobOpen false + `freelance_not_open`; fulltime → null. `classifyDuplicate` với prior rejected cùng job: fulltime → `auto_rejected`; freelancer → `returning` (prior lost). sanitize: freelancer + `rate_vnd_per_hour:"150.000"` → data.rate_vnd_per_hour 150000; freelancer thiếu rate → error; fulltime bỏ qua rate.
- [ ] **Step 2:** chạy test → FAIL.
- [ ] **Step 3:** Implement; route: insert `status:'freelancer', freelance_stage:'new', freelance_job_open: freelance.jobOpen, status_changed_at`; truyền `work_type` vào `classifyDuplicate`; dòng 🧩 = `"🧩 Freelancer → tab Freelancer"` + `" (job chưa mở freelance)"` khi `!jobOpen`. Form apply: ô "Hourly Rate (VND/hour) *" thành `type="text" inputMode="numeric"`, gửi `rate_vnd_per_hour`; thêm ô tuỳ chọn "Price notes (per asset / per project…)" → `rate_per_hour`.
- [ ] **Step 4:** `node --test src/lib/*.test.ts` → PASS; `npx tsc --noEmit` không lỗi mới.
- [ ] **Step 5:** Commit `feat(hr): đơn freelancer vào kho freelancer, không auto-reject`.

### Task 4: API — sửa trường freelancer, khoá status, đổi hình thức, redact

**Files:** Create logic trong `src/lib/hr-freelance.ts` (+test); Modify `src/lib/hr-scope.ts`, `src/app/api/hr/applications/[id]/route.ts`, `src/app/api/hr/jobs/[id]/close-out/route.ts`, `src/app/api/hr/jobs/[id]/ranking/route.ts`, `src/app/admin/_lib/types.ts`

**Interfaces — Produces:**
- `checkFreelancePatch(old: { work_type: string; status: string }, body: Record<string, unknown>): string | null` — lỗi khi: đơn freelancer có `status` trong body; đơn fulltime đặt `status:"freelancer"`; key `freelance_*`/`rate_vnd_per_hour` trên đơn fulltime; stage/level/rate/issue sai giá trị; `convert_work_type` ∉ {"freelancer","fulltime"} hoặc trùng hình thức hiện tại.
- `freelancePatchFields(body, ctx: { jobOpen: boolean }): Record<string, unknown>` — map `freelance_stage`, `freelance_level` (""/null → null), `rate_vnd_per_hour` (qua parseRateVnd, ""→null), `freelance_issue`; `convert_work_type:"freelancer"` → `{work_type:"freelancer", status:"freelancer", freelance_stage:"new", freelance_job_open: jobOpen}`; `"fulltime"` → `{work_type:"fulltime", status:"new"}`.
- `Application` type thêm `freelance_stage?, freelance_level?, rate_vnd_per_hour?: number|null, freelance_issue?, freelance_job_open?`.

- [ ] **Step 1: Test** `checkFreelancePatch`: freelancer + `{status:"rejected"}` → lỗi; fulltime + `{status:"freelancer"}` → lỗi; freelancer + `{freelance_stage:"talking"}` → null; `{freelance_stage:"x"}` → lỗi; fulltime + `{freelance_level:"junior"}` → lỗi; freelancer + `{convert_work_type:"fulltime"}` → null; freelancer + `{convert_work_type:"freelancer"}` → lỗi. `freelancePatchFields` cho 2 chiều convert như trên.
- [ ] **Step 2:** FAIL → **Step 3:** implement; PATCH route: select thêm `work_type, job_id`; gọi `checkFreelancePatch` (400) sau `checkAppPatch`; quyền: các key mới coi như sửa hồ sơ (`checkAppPatch` không có `apps.edit` đã chặn key lạ — giữ), thêm: `rate_vnd_per_hour` cần `apps.view_salary` (403); jobOpen đọc từ jobs khi convert. Bỏ qua `notifyApplicationUpdate` cho key freelancer (không mail; Discord chỉ khi status đổi — giữ hành vi hiện có). `hr-scope.ts`: thêm `rate_vnd_per_hour` vào nhóm `apps.view_salary`, `freelance_issue` vào `apps.view_notes`. close-out + ranking: lọc `work_type <> 'freelancer'` khi đọc applications.
- [ ] **Step 4:** test + tsc → PASS.
- [ ] **Step 5:** Commit `feat(hr): API kho freelancer — sửa stage/hạng/rate, khoá status, đổi hình thức`.

### Task 5: Bảng fulltime bỏ freelancer

**Files:** Modify `src/app/hr/_components/HRDashboard.tsx` (HrWorkspace ~3445–3590, PipelineView ~1569)

- [ ] **Step 1:** Trong `HrWorkspace`: `const fulltimeApps = useMemo(() => apps.filter((a) => !isFreelanceApp(a)), [apps])`; truyền cho PipelineView/DataView/KPIView/JobsView và `activeCount`. PipelineView ẩn cột key `freelancer`. CandidateSearch giữ nguyên (tìm cả freelancer, mở modal chung).
- [ ] **Step 2:** tsc + lint file → sạch. Commit `feat(hr): bảng fulltime bỏ hồ sơ freelancer`.

### Task 6: Tab Freelancer + modal chế độ freelancer

**Files:** Create `src/app/hr/_components/FreelancerView.tsx` (FreelancerView + FreelanceControls); Modify `HRDashboard.tsx` (View type, views, segmented label "Freelancer", render, CandidateModal header), `CandidateMailDialog.tsx` (prop/điều kiện ẩn `on_hold`, `position_filled`, `rejection` khi `work_type==="freelancer"`)

**Interfaces — Consumes:** Task 1 exports; PATCH body của Task 4 (`freelance_stage`, `freelance_level`, `rate_vnd_per_hour`, `freelance_issue`, `convert_work_type`).
**Produces:** `FreelancerView({ apps, jobs, onOpen }: { apps: Application[]; jobs: Job[]; onOpen: (id: string) => void })`, `FreelanceControls({ app, onPatch }: { app: Application; onPatch: (p: Partial<Application>) => void })`.

- [ ] **Step 1:** View `"freelancers"` đặt ngay sau `"pipeline"` trong `views` (cùng điều kiện như pipeline). FreelancerView: chip đếm theo stage (bấm = lọc), hàng lọc (job, hạng gồm "Chưa gắn hạng", rate từ–đến [chỉ khi `can("apps.view_salary")`], tick Có vấn đề / Job chưa mở freelance / Đã hợp tác, ô tìm), bảng: Tên (+ nhãn Nộp trùng/Có vấn đề/Job chưa mở freelance), Job, Hạng, Rate, Giờ/tuần, Portfolio (link), Trạng thái, Ngày nộp, Support (AssigneeBadge nếu export được, không thì tên từ StaffContext). Màn < 768px: thẻ dọc. Bấm hàng → `onOpen(id)` (= `setSearchOpenId`). Lọc dùng `filterFreelancers`. Rỗng → "Chưa có hồ sơ freelancer phù hợp bộ lọc."
- [ ] **Step 2:** CandidateModal: nếu `isFreelanceApp(app)` → thay StatusMenu/next/Reject bằng `<FreelanceControls>` (select stage, select hạng, ô rate [view_salary], tick Có vấn đề; PATCH ngay khi đổi, lỗi hiện dòng đỏ), facts "Rate / giờ" = `formatRateVnd(rate_vnd_per_hour)` + ghi chú giá (`rate_per_hour`) nếu có. MoreMenu (khi `apps.edit`) thêm "Chuyển sang fulltime" / "Chuyển sang freelancer" (confirm "Không gửi mail cho ứng viên.") → PATCH `convert_work_type`, cập nhật app từ response.
- [ ] **Step 3:** Mail menu ẩn 3 loại trên cho freelancer.
- [ ] **Step 4:** tsc + lint → sạch. Commit `feat(hr): tab Freelancer + modal chế độ freelancer`.

### Task 7: E2E + deploy

- [ ] **Step 1:** Dev local (DB prod, mail test – kiểm `.env.local` không có `HR_EMAIL_MODE=live`): nộp 1 đơn freelancer job có nhận + 1 job chưa nhận (email `zz-flp-*@example.com`, tên "ZZ Freelancer Pool Test (tạm)") → status freelancer, stage new, job_open đúng, rate số; mail test về tony@.
- [ ] **Step 2:** Đăng nhập /hr (boss tạm theo memory hr-admin-ops-no-shared-key), Playwright 1280 + 390: tab Freelancer có 5+2 hồ sơ, lọc rate/hạng/job chưa mở chạy; đổi stage/hạng/rate/issue lưu được; Pipeline không còn freelancer + không còn cột Freelancer; convert 1 hồ sơ test sang fulltime rồi về lại.
- [ ] **Step 3:** Xoá hồ sơ ZZ + mail + tài khoản tạm (service client), kiểm còn 0.
- [ ] **Step 4:** `detect_changes`, cập nhật LOG/TASKS, merge ff main, `git push --no-verify` (pre-push vấp WIP company-profile), `gh run watch` → success, smoke prod (/hr 200, /careers 200, POST /api/applications {} 400).
