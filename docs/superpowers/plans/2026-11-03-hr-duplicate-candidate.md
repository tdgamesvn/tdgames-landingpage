# Ứng viên trùng / nộp lại — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khi có đơn mới, /hr nhận ra người đã từng nộp. Nếu trùng email và nộp lại đúng vị trí đã bị reject trong 6 tháng thì tự reject và gửi mail lịch sự. Quyền giới thiệu giữ cho người giới thiệu đầu tiên trong 6 tháng. Người giới thiệu mới (B) được báo.

**Architecture:** Toàn bộ luật nằm trong `src/lib/hr-duplicates.ts`, gồm các hàm thuần có test `node --test`. `POST /api/applications` đọc các hồ sơ khớp qua 2 cột chuẩn hoá có index (`email_norm`, `phone_norm`), gọi luật, insert đơn kèm `duplicate_*`, rồi chạy nền các việc: gửi mail, báo B, báo team. Mail từ chối dùng lại đường gửi của auto-ack (`hr-auto-ack-send.ts`), chỉ tham số hoá theo kind.

**Tech Stack:** Next.js 16 App Router, Supabase Postgres (migration SQL), Resend, Discord webhook, `node --test` cho file `*.test.ts`.

**Spec:** `docs/superpowers/specs/2026-11-03-hr-duplicate-candidate-design.md`

## Global Constraints
- Cửa sổ = **6 tháng lịch**, tính theo ngày giờ Việt Nam (`Asia/Ho_Chi_Minh`).
- Chỉ **auto-reject khi khớp email** + cùng vị trí (cùng `job_id` hoặc tiêu đề job trim/lower giống hệt) + hồ sơ cũ `status = 'rejected'` + ngày trượt ≤ 6 tháng. Hồ sơ có `duplicate_kind = 'auto_rejected'` **không** được dùng làm mốc trượt. `talent_pool` không bao giờ gây auto-reject.
- Không so theo tên. Khớp chỉ qua SĐT thì chỉ ra `open_duplicate` hoặc `returning`.
- Mail, tin Discord và push gửi B **không** được chứa: người giới thiệu trước, lý do trượt, điểm, chữ "trượt".
- Lỗi khi tra trùng thì **vẫn nhận đơn như hiện nay**. Cột tuỳ chọn chỉ ghi khi có giá trị (theo mẫu `assignee_user_id` ở `applications/route.ts:87`).
- Tin cho team khi auto-reject: `discordNotify("hr", …)` **không tag**, `allowed_mentions: { parse: [] }`, không Telegram, không push.
- Mọi chữ hiển thị viết tiếng Việt có dấu, đúng giọng các mẫu mail hiện có.

## Review Focus
1. Email khác hoa thường hoặc có khoảng trắng (`" A@x.com "` so với `a@x.com`) phải khớp. Test ở Task 2.
2. SĐT dạng `+84 912 345 678`, `0912.345.678` và `84912345678` phải là một số; SĐT < 9 chữ số không bao giờ khớp. Test ở Task 2.
3. Nộp lại nhiều lần liên tiếp không được đẩy mốc 6 tháng ra xa: lần thứ 3 vẫn tính từ lần trượt thật. Test ở Task 2.
4. Hồ sơ bị reject → HR mở lại → reject lần nữa: mốc lấy `status_changed_at` mới nhất. Test ở Task 2.
5. Job đăng lại (bản ghi mới, tiêu đề `"2D Artist "` so với `"2d artist"`) được coi là cùng vị trí; job khác tiêu đề thì không. Test ở Task 2.

---

## File Structure
- Create `supabase/migrations/20261103000000_duplicate_candidates.sql`: cột mới, trigger, backfill, kind mail.
- Create `src/lib/hr-duplicates.ts` + `src/lib/hr-duplicates.test.ts`: luật thuần (chuẩn hoá, phân loại, người giới thiệu, nội dung tin).
- Modify `src/lib/hr-email-base.ts`, `src/lib/hr-email-templates.ts` (+ test): kind `duplicate_rejection`.
- Modify `src/lib/hr-auto-ack-send.ts`: thêm `sendDuplicateRejection`, dùng chung hàng đợi, trần và giới hạn IP.
- Create `src/lib/hr-duplicate-io.ts` (server-only): đọc hồ sơ khớp và người giới thiệu, chạy các thông báo.
- Modify `src/app/api/applications/route.ts`: nối luật vào luồng nộp đơn.
- Modify `src/lib/hr-scope.ts` (+ test), `src/app/api/hr/applications/route.ts`, `src/app/api/hr/applications/[id]/route.ts`: trả field mới và danh sách hồ sơ khác.
- Modify `src/app/hr/_components/HRDashboard.tsx` (`AppCard` ~1058, `CandidateModal` ~529): badge, mục "Hồ sơ khác", "Cần báo người giới thiệu".

---

### Task 1: Migration

**Files:**
- Create: `supabase/migrations/20261103000000_duplicate_candidates.sql`

**Interfaces:**
- Produces columns trên `public.applications`: `email_norm text` và `phone_norm text` (generated stored, có index); `status_changed_at timestamptz`; `duplicate_of uuid` (FK applications, `on delete set null`); `duplicate_kind text` (check `in ('auto_rejected','open_duplicate','returning')`); `referred_by_submitted text`; `referrer_notified_at timestamptz`; `referrer_notified_by text`. Kind mail `'duplicate_rejection'` hợp lệ ở `candidate_emails` và `hr_email_templates`.

- [ ] **Step 1: Đọc schema live trước khi viết.** Dùng `mcp__supabase__list_tables` (schema public, bảng `applications`, `candidate_emails`, `hr_email_templates`) và `\d` các CHECK `candidate_emails_kind_check` / `hr_email_templates_kind_check` qua `mcp__supabase__execute_sql` (chỉ SELECT từ `pg_constraint`). Repo đang lệch schema thật, nên phải ghi lại danh sách kind hiện có.
- [ ] **Step 2: Viết migration.**
  - `email_norm = lower(btrim(email))`.
  - `phone_norm`: bỏ ký tự không phải số; nếu bắt đầu bằng `84` và dài 11 chữ số thì đổi thành `'0' || substr(…,3)`; độ dài < 9 thì `null`.
  - Index trên cả 2 cột.
  - Trigger `BEFORE UPDATE OF status … WHEN (old.status IS DISTINCT FROM new.status)` set `status_changed_at = now()`.
  - Backfill hồ sơ đang `rejected` mà `status_changed_at is null`: lấy `max(created_at)` của `candidate_emails` có `kind='rejection'` của hồ sơ đó, không có thì `applications.created_at`.
  - Thêm `'duplicate_rejection'` vào 2 CHECK, giữ nguyên các kind đã ghi ở Step 1.
  - Thêm unique partial index `candidate_emails(application_id) where kind = 'duplicate_rejection'`.
  - Toàn bộ dùng `if not exists` / `drop constraint if exists` để chạy lại an toàn.
- [ ] **Step 3: Chạy thử trên DB.** Đây là DB production, nên **hỏi sếp trước khi `supabase db push`**. Sau khi áp, verify: `select phone_norm from applications where phone is not null limit 20` ra đúng dạng `0xxxxxxxxx`; `select count(*) from applications where status='rejected' and status_changed_at is null` = 0.
- [ ] **Step 4: Commit** `feat(hr): migration cột chống ứng viên trùng`.

### Task 2: Luật thuần `hr-duplicates.ts`

**Files:**
- Create: `src/lib/hr-duplicates.ts`, `src/lib/hr-duplicates.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const DUPLICATE_WINDOW_MONTHS = 6;
  export type DuplicateKind = "auto_rejected" | "open_duplicate" | "returning";
  export type PriorApp = {
    id: string; job_id: string; job_title: string | null; email: string; phone: string | null;
    status: string; status_kind: "open" | "won" | "lost" | null; status_changed_at: string | null;
    created_at: string; referred_by: string | null; assignee_user_id: string | null;
    duplicate_kind: DuplicateKind | null;
  };
  export function normalizeEmail(s: unknown): string | null;
  export function normalizePhone(s: unknown): string | null;            // khớp đúng luật SQL ở Task 1
  export function addMonthsVn(iso: string, months: number): string;      // trả YYYY-MM-DD (giờ VN)
  export function sameRole(a: { job_id: string; job_title: string | null }, b: { job_id: string; job_title: string | null }): boolean;
  export function classifyDuplicate(
    input: { email: string; phone: string | null; job_id: string; job_title: string | null; now: string },
    priors: PriorApp[],
  ): { kind: DuplicateKind; prior: PriorApp; rejectedAt: string | null; reapplyFrom: string | null } | null;
  export function firstReferral(input: { email: string; phone: string | null; now: string }, priors: PriorApp[]): PriorApp | null;
  ```
- `classifyDuplicate` chọn theo thứ tự ưu tiên ở spec §2. `prior` = hồ sơ quan trọng nhất (§3). `rejectedAt` = `status_changed_at` (fallback `created_at`) của hồ sơ gây auto-reject. `reapplyFrom = addMonthsVn(rejectedAt, 6)`. Hàm tự lọc `priors` theo email/phone đã chuẩn hoá, nên caller được phép truyền dư.
- `firstReferral` = hồ sơ khớp (email hoặc SĐT) **sớm nhất** có `referred_by` khác rỗng và `created_at` ≥ now − 6 tháng.

- [ ] **Step 1: Viết test fail** (`node --test src/lib/hr-duplicates.test.ts`), mỗi test một ý:
  - `normalizeEmail(" A@X.com ") === "a@x.com"`; `normalizeEmail("") === null`.
  - `normalizePhone("+84 912 345 678") === "0912345678"`; `"0912.345.678"` và `"84912345678"` cũng ra `"0912345678"`; `normalizePhone("12345") === null`.
  - `addMonthsVn("2026-05-02T20:00:00Z", 6) === "2026-11-03"` (20:00Z là ngày 03/05 giờ VN).
  - `sameRole`: cùng id → true; khác id, tiêu đề `"2D Artist "`/`"2d artist"` → true; khác tiêu đề → false.
  - auto-reject: email khớp, cùng job, `rejected` cách 2 tháng → `kind "auto_rejected"`, `reapplyFrom` = rejectedAt + 6 tháng.
  - Khớp chỉ SĐT + rejected cùng job 2 tháng → `"returning"`, không phải auto_rejected.
  - Rejected cách 7 tháng → `"returning"`.
  - Cũ `talent_pool` (status_kind lost) cùng job, 1 tháng → `"returning"`.
  - Cùng job, status_kind `open` → `"open_duplicate"`.
  - Khác job, rejected 1 tháng → `"returning"`.
  - Review Focus 3: priors = [rejected thật cách 5 tháng, auto_rejected cách 1 tháng] → vẫn auto_rejected, `rejectedAt` = mốc 5 tháng.
  - Review Focus 4: rejected với `status_changed_at` cách 1 tháng (created 8 tháng) → auto_rejected.
  - Không khớp → `null`.
  - `firstReferral`: 2 hồ sơ có ref (A cách 3 tháng, C cách 1 tháng) → A; hồ sơ có ref cách 7 tháng → null.
- [ ] **Step 2: Chạy, thấy FAIL** (module chưa có).
- [ ] **Step 3: Implement** các hàm trên. Không import server, đuôi import `.ts` như các lib thuần khác.
- [ ] **Step 4: Chạy, thấy PASS.**
- [ ] **Step 5: Commit** `feat(hr): luật nhận diện ứng viên trùng`.

### Task 3: Mẫu mail `duplicate_rejection`

**Files:**
- Modify: `src/lib/hr-email-base.ts:10-38` và `DraftInput` (~65), `src/lib/hr-email-templates.ts` (`KIND_VARS`, `VAR_HELP`, `DEFAULT_TEMPLATES`, `templateVars`, `SAMPLE_DRAFT_INPUT`), test `src/lib/hr-email-templates.test.ts`

**Interfaces:**
- Produces: kind `"duplicate_rejection"` nằm trong `CANDIDATE_EMAIL_KINDS` và `SYSTEM_ONLY_EMAIL_KINDS`, label `"Đã ứng tuyển trước đó (tự động)"`. `DraftInput.duplicate?: { prevAppliedAt: string; reapplyFrom: string; referrerName: string | null }`, ngày đã định dạng `dd/mm/yyyy`.
- Biến: `ngay_ung_tuyen_truoc`, `ngay_duoc_nop_lai`, `cau_gioi_thieu`. Biến cuối là cả câu `"Lần trước bạn ứng tuyển qua giới thiệu của {tên}."` hoặc rỗng.

- [ ] **Step 1: Test fail.** `buildDraft({kind:"duplicate_rejection", …, duplicate:{prevAppliedAt:"02/09/2026", reapplyFrom:"02/03/2027", referrerName:"Mai Hà"}}, null).text` chứa `"02/09/2026"`, `"02/03/2027"`, `"Mai Hà"`, và **không** chứa `"trượt"`; với `referrerName: null` thì không có chữ "giới thiệu"; `isSystemOnlyKind("duplicate_rejection") === true`; `validateTemplate("duplicate_rejection", DEFAULT…subject, DEFAULT…body) === null`.
- [ ] **Step 2: Chạy, thấy FAIL.**
- [ ] **Step 3: Thêm kind và mẫu mặc định.** Ý của mẫu: cảm ơn → "bạn đã ứng tuyển vị trí {vi_tri} ngày {ngay_ung_tuyen_truoc} và đã nhận kết quả từ chúng mình" → `{cau_gioi_thieu}` → "bạn có thể ứng tuyển lại vị trí này từ ngày {ngay_duoc_nop_lai}" → "có thắc mắc bạn cứ trả lời mail này" → `{chu_ky}`. Chú ý: `EmailTemplatesPanel` liệt kê kind tự động, nên kiểm tra panel vẫn chạy với kind system-only.
- [ ] **Step 4: Chạy test email cũ + mới, thấy PASS** (`node --test src/lib/hr-email*.test.ts`).
- [ ] **Step 5: Commit** `feat(hr): mẫu mail từ chối do đã ứng tuyển trước`.

### Task 4: Gửi mail từ chối tự động

**Files:**
- Modify: `src/lib/hr-auto-ack-send.ts`

**Interfaces:**
- Consumes: kind và `DraftInput.duplicate` ở Task 3.
- Produces: `sendDuplicateRejection(i: { applicationId: string; jobId: string; email: string; fullName: string; supportUserId: string | null; ip: string; prevAppliedAt: string; reapplyFrom: string; referrerName: string | null }): Promise<{ sent: boolean; reason?: string }>`.

- [ ] **Step 1: Tách phần chung** của `sendApplicationAckNow` (hàng đợi `ackQueue`, kiểm tra bật auto-ack, trần/giờ, giới hạn IP, đặt chỗ `candidate_emails` rồi gửi, xoá khi lỗi, ghi `resend_id`) thành một hàm nội bộ nhận `kind` + `DraftInput`. Trần/giờ đếm **cả 2 kind**. Dedupe 24h chỉ áp cho `application_received`. Đặt chỗ dựa vào unique index của từng kind (Task 1). `sendApplicationAck` giữ nguyên chữ ký và hành vi.
- [ ] **Step 2: `sendDuplicateRejection`** dùng phần chung. Support = `supportUserId` (người phụ trách hồ sơ cũ) cho chữ ký/From/Reply-To theo `replyToFor`; template từ `hr_email_templates` (kind mới), fallback mặc định. Gửi kể cả khi job đã đóng (khác ack).
- [ ] **Step 3: Verify** `node --test src/lib/hr-auto-ack.test.ts src/lib/hr-email*.test.ts` PASS và `npx tsc --noEmit -p .` không lỗi mới.
- [ ] **Step 4: Commit** `feat(hr): gửi mail từ chối tự động cho đơn nộp lại`.

### Task 5: Nội dung tin báo (thuần)

**Files:**
- Modify: `src/lib/hr-duplicates.ts`, `src/lib/hr-duplicates.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function referrerChanged(submittedOwnerKey: string | null, firstOwnerKey: string | null): boolean; // so chủ, null → false khi first null
  export function teamAutoRejectText(i: { name: string; jobTitle: string; rejectedAt: string; priorUrl: string }): string;
  export function referrerAutoRejectText(i: { name: string; jobTitle: string; prevAppliedAt: string; reapplyFrom: string }): string;
  export function referrerTakenText(i: { name: string; jobTitle: string }): string;   // đơn không reject nhưng quyền thuộc người trước
  export function askHrToTellReferrerText(i: { referrer: string; contact: string | null; base: string }): string;
  export function duplicateNoticeLine(i: { kind: DuplicateKind; jobTitle: string; statusLabel: string; date: string }): string; // dòng thêm vào tin đơn mới
  ```
  "Owner key" = `"u:"+hr_users.id` / `"r:"+referrers.id` / `"c:"+mã` khi không khớp ai (Task 6 tính).
- [ ] **Step 1: Test fail.** `referrerAutoRejectText` chứa tên, vị trí, 2 ngày, và **không** chứa `"trượt"`, không chứa tên người giới thiệu trước (hàm không nhận tham số này). `teamAutoRejectText` bắt đầu bằng `"🔁 Tự động từ chối"`. `referrerChanged("u:1","u:1") === false`, `("u:2","u:1") === true`, `(null,"u:1") === true` (tự nộp không mã, vẫn chuyển cho A theo sếp chốt), `("u:2", null) === false`.
- [ ] **Step 2–4:** chạy FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(hr): nội dung tin báo ứng viên trùng`.

### Task 6: Nối vào luồng nộp đơn

**Files:**
- Create: `src/lib/hr-duplicate-io.ts` (`import "server-only"`)
- Modify: `src/app/api/applications/route.ts`

**Interfaces:**
- Consumes: Task 2, 4, 5.
- Produces:
  - `loadPriorApps(email: string, phone: string | null): Promise<PriorApp[] | null>`: query `.or("email_norm.eq.X,phone_norm.eq.Y")` kèm `jobs(title)` và kind của status. Lỗi thì trả `null`. Giá trị đưa vào `.or` phải escape được dấu phẩy, ngoặc, chấm (hoặc chạy 2 query `.eq` song song rồi gộp, nên ưu tiên cách này).
  - `ownerKeyFor(code: string | null, staff, referrers): string | null`.
  - `notifyDuplicate(i): Promise<void>`: chạy nền các tin ở spec §5.

- [ ] **Step 1: Trong `POST`, sau `sanitizeApplicationInput` và trước insert:**
  - Gọi `loadPriorApps`, rồi `classifyDuplicate` + `firstReferral`.
  - Nếu có người giới thiệu đầu tiên và `referrerChanged(...)` thì `input.referred_by` = mã của người đầu tiên, `referred_by_submitted` = mã đã nhập (null nếu không nhập). Đặt bước này **trước** khối tính assignee hiện có, để assignee theo đúng người đầu tiên.
  - Nếu `prior.assignee_user_id` còn hoạt động và `assignable(...)` thì đó là assignee.
  - Auto-reject: thêm `status: "rejected"`, `rejection_reason` (chữ ở spec §3), `duplicate_of`, `duplicate_kind`. Mọi cột mới chỉ thêm khi có giá trị.
- [ ] **Step 2: Sau insert:**
  - auto_rejected: **không** gọi `sendApplicationAck`; gọi `sendDuplicateRejection` trong `after()`; **bỏ** Telegram và `notifyCandidate(new_application)`; gọi `notifyDuplicate`.
  - Loại khác: giữ luồng cũ, Telegram và Discord thêm `duplicateNoticeLine`. `open_duplicate` đổi tiêu đề Discord thành "🔁 Nộp trùng — đang xử lý ở hồ sơ cũ".
  - Khi `referrerChanged`: gọi `notifyDuplicate` để báo B.
- [ ] **Step 3: `notifyDuplicate` theo spec §5 và quyết định 3 của sếp:**
  - B có tài khoản chưa khoá: Discord tag `<@discord_id>`, `allowed_mentions.users = [id]`. Push qua `sendHrPush` **chỉ khi** `canViewApplication(B, app, …)`; không xem được thì Discord không kèm link.
  - B không có tài khoản: tag người phụ trách đơn mới bằng `askHrToTellReferrerText` (chưa giao thì theo `discordTagFor` như cũ).
  - Tin team: `discordNotify("hr", { content, allowed_mentions: { parse: [] } })`.
  - Mọi lỗi chỉ `console.error`.
- [ ] **Step 4: Verify** `npx tsc --noEmit -p .` và `npm run lint` không lỗi mới.
- [ ] **Step 5: Commit** `feat(hr): tự từ chối đơn nộp lại + giữ quyền giới thiệu 6 tháng`.

### Task 7: API /hr trả dữ liệu trùng

**Files:**
- Modify: `src/lib/hr-scope.ts:36-51` (+ `src/lib/hr-scope.test.ts`), `src/app/api/hr/applications/[id]/route.ts`, route PATCH tương ứng

**Interfaces:**
- Produces:
  - `BASE_FIELDS` thêm `duplicate_of`, `duplicate_kind`.
  - `apps.view_notes` thêm `referred_by_submitted`, `referrer_notified_at`, `referrer_notified_by`.
  - GET `[id]` trả thêm `related: { id, job_title, status, created_at, ai_score }[]` (khớp email_norm/phone_norm, trừ chính nó, chỉ hồ sơ người xem `canViewApplication`) và `related_hidden: number`.
  - PATCH `[id]` nhận `{ referrer_notified: true }`, cần quyền `apps.view_notes`, ghi `referrer_notified_at = now()` và `referrer_notified_by = tên người bấm`.
- [ ] **Step 1: Test fail ở `hr-scope.test.ts`:** người không có `apps.view_notes` thì `redactApplication` bỏ `referred_by_submitted`, giữ `duplicate_kind`.
- [ ] **Step 2–3: Implement → PASS.** `related` dùng chung `normalizeEmail`/`normalizePhone`.
- [ ] **Step 4: Commit** `feat(hr): API trả hồ sơ khác của cùng ứng viên`.

### Task 8: Giao diện /hr

**Files:**
- Modify: `src/app/hr/_components/HRDashboard.tsx` (`AppCard` ~1058, `CandidateModal` ~529), `src/app/admin/_lib/types.ts` (`Application` thêm field mới, optional)

- [ ] **Step 1: Badge trên `AppCard`:** `auto_rejected` → "Tự động từ chối"; `open_duplicate` → "Nộp trùng"; `returning` → "Ứng viên cũ". Dùng style badge đang có trên card.
- [ ] **Step 2: Modal:**
  - Mục "Hồ sơ khác của người này" từ `related`, bấm vào mở hồ sơ đó bằng cơ chế mở modal hiện có; `related_hidden > 0` thì hiện "+N hồ sơ bạn không có quyền xem".
  - Khi `referred_by_submitted` có giá trị và `referrer_notified_at` null: hiện dòng "Cần báo người giới thiệu: {mã}" + nút "Đã báo" (gọi PATCH ở Task 7). Đã báo thì hiện "Đã báo bởi X lúc …".
- [ ] **Step 3: Bộ lọc "Cần báo người giới thiệu"** cạnh các bộ lọc hiện có (client-side trên danh sách đã tải).
- [ ] **Step 4: Verify:**
  - `npm run lint` và `npm run build` OK.
  - Chạy dev rồi dùng Playwright ở 1280px và 390px: mở 1 hồ sơ có `duplicate_kind`, thấy badge, mục hồ sơ khác, nút Đã báo hoạt động.
- [ ] **Step 5: Commit** `feat(hr): badge + hồ sơ khác + nhắc báo người giới thiệu`.

### Task 9: Kiểm thử đầu cuối và ghi memory

- [ ] **Step 1:** Trên dev, `HR_EMAIL_MODE` ở chế độ test. Nộp 2 đơn bằng email test của sếp (dạng `tony+dup@…` thì auto-ack bỏ qua, nên dùng email test thật không có `+`), cùng job, có mã ref khác nhau. HR reject đơn 1 rồi nộp đơn 2. Kiểm:
  - Đơn 2 `rejected`, `duplicate_kind = 'auto_rejected'`, `referred_by` = mã đơn 1.
  - Mail `duplicate_rejection` ghi trong `candidate_emails`, không có mail `application_received`.
  - Tin Discord không tag.
- [ ] **Step 2:** Nộp đơn 3 cùng email, job khác → `returning`, có ack, Discord có dòng "Đã từng ứng tuyển".
- [ ] **Step 3:** Xoá 3 hồ sơ test qua API /hr (theo memory: không DELETE bằng MCP).
- [ ] **Step 4:** `npx gitnexus detect-changes`, cập nhật `.agent/meta/LOG.md`, `TASKS.md`, `DECISIONS.md` (luật 6 tháng + quyền giới thiệu), `SCHEMA.md` (cột mới).
- [ ] **Step 5:** Commit và hỏi sếp trước khi `git push origin main` (CI tự deploy).
