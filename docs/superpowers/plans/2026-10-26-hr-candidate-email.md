# HR Candidate Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HR gửi mail tiếng Việt cho ứng viên từ `/hr` qua Resend (`hr@tdgamestudio.com`), luôn qua hộp thoại xác nhận, mặc định chế độ test.

**Architecture:** Lib thuần `src/lib/hr-email.ts` (config, chọn người nhận, 5 mẫu mail, text→html) có unit test `node --test`. Lib server `src/lib/hr-email-send.ts` gọi Resend bằng `fetch` + ghi bảng `candidate_emails`. 2 route API dưới `/api/hr/applications/[id]/emails`. Client: 1 provider/hook `useCandidateMail()` bọc HRDashboard, hộp thoại `CandidateMailDialog`, nối vào mọi đường đổi status + ScheduleBlock, thêm nút "Gửi mail" + lịch sử trong CandidateModal.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (service client `getSupabaseAdmin`), Resend REST API, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-26-hr-candidate-email-design.md`

## Global Constraints

- From mặc định `TD Games HR <hr@tdgamestudio.com>`, Reply-To mặc định `hr@tdgamestudio.com`.
- `HR_EMAIL_MODE` chỉ đúng chuỗi `live` mới là live; mọi giá trị khác/thiếu ⇒ `test`.
- Test mode: gửi tới `HR_EMAIL_TEST_TO` (mặc định `tony@tdgamestudio.com`), subject tiền tố `[TEST → <email ứng viên>] `.
- Người nhận do **server** quyết định (từ `applications.email`), client không truyền địa chỉ.
- 5 kind: `interview_invite`, `interview_reschedule`, `interview_cancel`, `test_assignment`, `rejection`.
- Mail tiếng Việt, xưng "TD Games" – "bạn". Chữ ký: "TD Games Studio — Phòng Nhân sự", `https://tdgamestudio.com`, `hr@tdgamestudio.com`.
- Mail `rejection` KHÔNG chứa `rejection_reason`, `admin_notes`, điểm AI.
- Link test: `https://tdgamestudio.com/test/<test_token>`. Không ghi hạn nộp; nhắc ứng viên chọn ngày dự kiến nộp trên trang test.
- Offline: "505 Minh Khai, Hà Nội" + `GOOGLE_MAPS_URL`. Online: link Meet.
- Gọi Resend bằng `fetch`, không thêm dependency. `RESEND_API_KEY` chỉ ở server.
- UI theo class `hr-*` hiện có (`hr-theme.css`), icon `lucide-react`, đúng ở cả Sáng/Tối.
- DB là prod: khi test chỉ gửi ở test mode; không tạo/xoá dữ liệu ứng viên thật.

## Review Focus

1. Ứng viên có `email` rỗng/không hợp lệ → draft trả `error`, nút Gửi khoá, POST trả 400 (test ở Task 1 `isValidEmail`, Task 2 POST).
2. Body HR sửa có `<script>`/`<a>` → html sinh ra phải escape hết (test Task 1 `textToHtml`).
3. Env `HR_EMAIL_MODE="LIVE"`/`" live "`/`"true"` → vẫn là test (test Task 1 `getHrEmailConfig`).
4. Bấm "Không gửi" hoặc gửi lỗi → status/lịch PV đã lưu vẫn giữ nguyên, không rollback (kiểm tay Task 4).
5. Đổi status sang `test` khi job không có đề → không mở hộp thoại, chỉ báo nhỏ (Task 2 draft trả `error: "no_test"`, Task 4 xử lý).

---

### Task 1: Lib thuần — config, người nhận, mẫu mail, text→html

**Files:**
- Modify: `src/lib/company-location.ts` (thêm `OFFICE_ADDRESS = "505 Minh Khai, Hà Nội"`)
- Create: `src/lib/hr-email.ts`
- Test: `src/lib/hr-email.test.ts`

**Interfaces:**
- Produces:
  - `type CandidateEmailKind = "interview_invite" | "interview_reschedule" | "interview_cancel" | "test_assignment" | "rejection"`
  - `const CANDIDATE_EMAIL_KINDS: readonly CandidateEmailKind[]`, `const KIND_LABEL: Record<CandidateEmailKind, string>` (nhãn tiếng Việt cho UI)
  - `type HrEmailConfig = { mode: "test" | "live"; from: string; replyTo: string; testTo: string; apiKey: string | null }`
  - `getHrEmailConfig(env: Record<string, string | undefined>): HrEmailConfig`
  - `isValidEmail(s: string | null | undefined): boolean`
  - `resolveRecipient(cfg: HrEmailConfig, candidateEmail: string, subject: string): { to: string; subject: string; testMode: boolean }`
  - `type DraftInput = { kind: CandidateEmailKind; candidateName: string; jobTitle: string; interview?: { scheduledAt: string; mode: "offline" | "online" | null; meetUrl: string | null; round: number } | null; prevScheduledAt?: string | null; testUrl?: string | null }`
  - `buildDraft(input: DraftInput): { subject: string; text: string }`
  - `textToHtml(text: string): string`
  - `formatInterviewLong(iso: string): string` — "15:30, Thứ Hai 19/10/2026" giờ VN
- Import nội bộ bằng đuôi `.ts` (`./interview-schedule.ts`, `./company-location.ts`) để `node --test` chạy được (tsconfig đã bật `allowImportingTsExtensions`).

- [ ] **Step 1: Viết test fail** — `src/lib/hr-email.test.ts` (dòng đầu `// node --test src/lib/hr-email.test.ts`), các test:
  - `getHrEmailConfig({})` → `mode "test"`, `from "TD Games HR <hr@tdgamestudio.com>"`, `replyTo "hr@tdgamestudio.com"`, `testTo "tony@tdgamestudio.com"`, `apiKey null`.
  - `getHrEmailConfig({HR_EMAIL_MODE:"live"}).mode === "live"`; với `"LIVE"`, `" live "`, `"true"` → `"test"`.
  - `isValidEmail("a@b.co")` true; `""`, `null`, `"abc"`, `"a@b"` false.
  - `resolveRecipient(testCfg, "ung.vien@gmail.com", "Mời PV")` → `{ to: "tony@tdgamestudio.com", subject: "[TEST → ung.vien@gmail.com] Mời PV", testMode: true }`; live cfg → `{ to: "ung.vien@gmail.com", subject: "Mời PV", testMode: false }`.
  - `textToHtml("<script>x</script>\n\nhttps://meet.google.com/abc-defg-hij")` không chứa `<script>`, chứa `&lt;script&gt;`, URL thành `<a href="https://meet.google.com/abc-defg-hij">`; 2 xuống dòng → đoạn `<p>` mới.
  - `formatInterviewLong("2026-10-19T08:30:00.000Z") === "15:30, Thứ Hai 19/10/2026"`.
  - `buildDraft` `interview_invite` online: text chứa tên ứng viên, tên job, `"15:30, Thứ Hai 19/10/2026"`, meet URL; offline: chứa `"505 Minh Khai, Hà Nội"` và `GOOGLE_MAPS_URL`.
  - `buildDraft` `interview_cancel` với `prevScheduledAt` → text chứa giờ cũ dạng dài.
  - `buildDraft` `test_assignment` với `testUrl` → text chứa URL.
  - `buildDraft` `rejection` → text không chứa `"undefined"`, không chứa `"null"`; mọi kind: text chứa `"Phòng Nhân sự"`.

- [ ] **Step 2: Chạy** `node --test src/lib/hr-email.test.ts` → FAIL (module chưa có).

- [ ] **Step 3: Implement `src/lib/hr-email.ts`** theo Interfaces. `textToHtml`: escape `& < > " '` trước, rồi linkify `https?://\S+`, đoạn tách bằng dòng trống → `<p>`, xuống dòng đơn → `<br>`; bọc trong khung html đơn giản (font sans, max-width 600px, không ảnh nền/gradient). Câu chữ 5 mẫu do implementer viết theo spec (tiêu đề gợi ý: "Thư mời phỏng vấn — <job> | TD Games", "Thay đổi lịch phỏng vấn — …", "Huỷ lịch phỏng vấn — …", "Bài test — <job> | TD Games", "Kết quả ứng tuyển — <job> | TD Games").

- [ ] **Step 4: Chạy** `node --test src/lib/hr-email.test.ts` → PASS; `npx tsc --noEmit` sạch.

- [ ] **Step 5: Commit** `feat(hr): lib mẫu mail ứng viên + chế độ test`

### Task 2: DB + server gửi + API

**Files:**
- Create: `supabase/migrations/20261026000000_candidate_emails.sql`
- Create: `src/lib/hr-email-send.ts` (`import "server-only"`)
- Create: `src/app/api/hr/applications/[id]/emails/route.ts` (GET lịch sử, POST gửi)
- Create: `src/app/api/hr/applications/[id]/emails/draft/route.ts` (GET draft)
- Modify: `src/app/admin/_lib/types.ts` (thêm `CandidateEmail`)
- Modify: `.agent/meta/SCHEMA.md`, `.agent/meta/API.md`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - Bảng `candidate_emails` đúng cột trong spec, `kind` check 5 giá trị, index `(application_id, created_at desc)`, RLS bật, không policy (chỉ service role).
  - `type CandidateEmail = { id; application_id; interview_id: string | null; kind: CandidateEmailKind; to_email; sent_to; test_mode: boolean; subject; body_text; body_html; resend_id: string | null; sent_by: string | null; created_at }`
  - `sendViaResend(cfg: HrEmailConfig, msg: { to: string; subject: string; html: string; text: string }): Promise<{ id: string } | { error: string }>` — POST `https://api.resend.com/emails` với `from`, `reply_to`, `to: [to]`.
  - `GET /api/hr/applications/[id]/emails/draft?kind=&interview_id=&prev_scheduled_at=` → `200 { to, subject, text, mode, test_to, last_sent_at: string | null }` hoặc `200 { error: "no_email" | "no_test" | "no_schedule", message }`; kind sai → 400.
  - `POST /api/hr/applications/[id]/emails` body `{ kind, interview_id?: string | null, subject: string, text: string, sent_by?: string | null }` → `200 { email: CandidateEmail }`; lỗi Resend → `502 { error }`; email ứng viên không hợp lệ → 400; thiếu `RESEND_API_KEY` → 500 `"RESEND_API_KEY chưa cấu hình"`.
  - `GET /api/hr/applications/[id]/emails` → `{ emails: CandidateEmail[] }` mới nhất trước.

- [ ] **Step 1: Migration** — viết SQL, áp lên prod bằng `npx supabase db push` (sandbox off). Verify: `npx supabase migration list` có `20261026000000` ở cả Local và Remote.

- [ ] **Step 2: Implement `sendViaResend` + 3 handler.** Mọi handler gọi `requireHR` trước. Draft: lấy application (`email, full_name, job_id, test_token, jobs(title)`); `test_assignment` → kiểm job có ≥1 `job_tests` (không có ⇒ `no_test`), tạo `test_token` bằng `newTestToken()` nếu chưa có (giống `action:"token"` ở `submissions/route.ts`); `interview_*` → đọc `interview_sessions` theo `interview_id` và `application_id` (invite/reschedule thiếu `scheduled_at` ⇒ `no_schedule`). POST: subject cắt 200 ký tự, text cắt 10 000 ký tự, html = `textToHtml(text)`, `resolveRecipient`, gửi, chỉ insert khi có `id`. `last_sent_at` = `created_at` mới nhất cùng kind.

- [ ] **Step 3: Kiểm bằng curl trên dev** (`npm run dev`, header `x-hr-key`): draft của 1 ứng viên thật cho từng kind có dữ liệu → JSON đúng, `mode: "test"`; GET history → `{ emails: [] }`; POST với `kind:"bogus"` → 400. **Chưa POST gửi thật ở bước này.**

- [ ] **Step 4: `npx tsc --noEmit` + `npm run lint`** sạch. Cập nhật SCHEMA.md + API.md.

- [ ] **Step 5: Commit** `feat(hr): bảng candidate_emails + API draft/gửi mail ứng viên`

### Task 3: Hộp thoại + provider

**Files:**
- Create: `src/app/hr/_components/CandidateMailDialog.tsx` (export `CandidateMailProvider`, `useCandidateMail`)
- Modify: `src/app/hr/_components/HRDashboard.tsx` — bọc nội dung `HRDashboard` bằng `<CandidateMailProvider hrKey={hrKey}>`

**Interfaces:**
- Consumes: API Task 2, `KIND_LABEL` Task 1, `CandidateEmail` type.
- Produces:
  - `useCandidateMail(): { prompt(req: MailPromptRequest): void; lastSentAt: number }` — `lastSentAt` tăng mỗi lần gửi xong để lịch sử reload.
  - `type MailPromptRequest = { appId: string; candidateName: string; kind: CandidateEmailKind; interviewId?: string | null; prevScheduledAt?: string | null }`
- Hành vi: `prompt` gọi draft; nếu `error === "no_test"` hiện toast nhỏ "Job chưa có đề test — chưa gửi mail" (không mở hộp thoại); lỗi khác hiện trong hộp thoại, khoá nút Gửi. Hộp thoại: dải cảnh báo nổi bật khi `mode === "test"` ("Chế độ test — mail sẽ gửi về <test_to>, KHÔNG tới ứng viên"), dòng Người nhận, input Tiêu đề, textarea Nội dung, cảnh báo "Đã gửi <loại> lúc …" nếu `last_sent_at`, nút **Gửi** / **Không gửi**. `sent_by` đọc localStorage `tdg.hr.comment.author`. Gửi lỗi giữ nguyên nội dung. Esc/nút X = Không gửi.

- [ ] **Step 1: Implement** provider + dialog (dùng lại kiểu modal/nút `hr-*` của `RejectModal`).
- [ ] **Step 2: `npx tsc --noEmit` + `npm run lint`** sạch.
- [ ] **Step 3: Commit** `feat(hr): hộp thoại xác nhận gửi mail ứng viên`

### Task 4: Nối các điểm kích hoạt + nút thủ công + lịch sử

**Files:**
- Modify: `src/app/hr/_components/HRDashboard.tsx` — sau khi PATCH OK ở `AppCard.move` (~L999), `CandidateModalHost.move` (~L1278), `PipelineView.moveTo` (~L1368), `QuickAction.move` (~L2393): nếu status mới là `test` → `prompt({kind:"test_assignment"})`, `rejected` → `prompt({kind:"rejection"})`. Gom vào 1 helper `promptForStatus(mail, app, status)` dùng chung.
- Modify: `src/app/hr/_components/HRDashboard.tsx` `CandidateModal` — nút "Gửi mail" (menu 4 kind: invite/reschedule cần chọn vòng có lịch, mờ nếu không có; không có cancel) + mục "Mail đã gửi" (reload theo `lastSentAt`; badge TEST; bấm mở nội dung text).
- Modify: `src/app/hr/_components/InterviewPanel.tsx` `ScheduleBlock` — cần `appId`, `candidateName` (truyền từ `InterviewPanel` props; thêm prop `candidateName` ở render L787). `submit()` OK: trước đó `scheduled_at` null → `interview_invite`; khác giờ/mode/meet → `interview_reschedule`; không đổi → không hiện. `clear()` OK → `interview_cancel` với `prevScheduledAt` = giờ cũ.

**Interfaces:**
- Consumes: `useCandidateMail` Task 3.

- [ ] **Step 1: Implement** các điểm nối. Prompt chỉ gọi khi PATCH thành công; không bao giờ rollback status/lịch vì mail.
- [ ] **Step 2: `npx tsc --noEmit` + `npm run lint` + `npm run build`** sạch.
- [ ] **Step 3: Kiểm tay trên dev bằng Playwright** (local `.env.local` thêm `RESEND_API_KEY`, KHÔNG set `HR_EMAIL_MODE`), chọn 1 ứng viên có sẵn, KHÔNG tạo dữ liệu mới:
  - Mở hồ sơ → "Gửi mail" → "Mời phỏng vấn" (ứng viên đã có lịch) → dải TEST hiện, người nhận = email ứng viên → Gửi → lịch sử có dòng TEST; sếp nhận mail ở tony@ với subject `[TEST → …]`.
  - Lặp với "Gửi bài test" (job có đề) — link `/test/<token>` mở được.
  - Đổi status sang `rejected` rồi bấm **Không gửi** → status vẫn Rejected sau reload; sau đó đưa ứng viên về status cũ.
  - Ứng viên job chưa có đề → kéo sang Test → chỉ hiện toast, rồi đưa về status cũ.
- [ ] **Step 4: Commit** `feat(hr): mời PV/đổi lịch/huỷ lịch/bài test/báo trượt gửi mail từ /hr`

### Task 5: Env + deploy (chờ sếp duyệt trên local)

- [ ] **Step 1:** Trên VPS `/opt/tdgames-landingpage/.env.local` (hoặc file env PM2 đang dùng — kiểm `pm2 env`): thêm `RESEND_API_KEY`, KHÔNG thêm `HR_EMAIL_MODE` (⇒ test). `pm2 restart tdgames-landingpage --update-env`.
- [ ] **Step 2:** `git push origin main` → CI. Verify: `curl` draft trên prod trả `mode:"test"`.
- [ ] **Step 3:** Ghi LOG/TASKS/DECISIONS (quyết định: env `HR_EMAIL_MODE` là công tắc gửi thật). Hướng dẫn bật thật: thêm `HR_EMAIL_MODE=live` + restart.
