# HR: tài khoản + phân quyền theo vai — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay mật khẩu chung `x-hr-key` của `/hr` bằng tài khoản riêng (Sếp/HR/Leader/Kế toán), quyền theo vai sếp tự bật/tắt, phạm vi dữ liệu ép ở server, ghi đúng người làm, mail offer + tự CC nội bộ.

**Architecture:** Tài khoản, mật khẩu (scrypt), phiên và token mời/đặt lại **tự quản trong Postgres** (bảng `hr_*`), cookie httpOnly `hr_session` mang token ngẫu nhiên — mỗi request tra DB nên khoá tài khoản có hiệu lực ngay. Mọi route `/api/hr/*` đi qua `requireHrUser(req, perm)` → `HrContext { user, role, perms }`; dữ liệu ứng viên lọc phạm vi (`hr-scope.ts`) và gỡ field theo quyền (`redactApplication`) **trước khi trả JSON**. Danh sách quyền là một mảng trong code (`hr-permissions.ts`); DB chỉ lưu ô sếp đổi.

**Tech Stack:** Next.js 16 App Router route handlers, Supabase service role (`getSupabaseAdmin`), Node `crypto` (scrypt, randomBytes, sha256), Resend (`sendViaResend`), `node --test` cho test thuần, React client trong `src/app/hr/_components`.

**Spec:** `docs/superpowers/specs/2026-10-27-hr-accounts-permissions-design.md`

**Lệch spec (em quyết khi lập plan, báo sếp):** spec ghi "Supabase Auth". Plan dùng **tài khoản tự quản** vì: (1) link mời Supabase dựa trên OTP, hạn tối đa 24h — không làm được 7 ngày; (2) khoá tài khoản phải có hiệu lực ngay, Supabase JWT vẫn sống tới hết hạn; (3) không phải đụng cấu hình "Allow signups" của project Supabase dùng chung. Không có endpoint đăng ký nào tồn tại → không thể tự tạo tài khoản.

## Global Constraints

- Vai (key DB): `boss` (Sếp), `hr` (HR), `leader` (Leader), `accountant` (Kế toán). Nhãn UI tiếng Việt đúng như ngoặc.
- `boss` luôn toàn quyền, không tắt được; chỉ `boss` gọi được `/api/hr/users*` và `PUT /api/hr/permissions`.
- Không có route/trang tự đăng ký. Token mời hạn **7 ngày**, token quên mật khẩu hạn **1 giờ**, dùng một lần (`used_at`). Phiên hạn **30 ngày**.
- Quên mật khẩu luôn trả 200 `{ ok: true }` bất kể email tồn tại / bị khoá.
- Mật khẩu tối thiểu 8 ký tự.
- Mỗi job tối đa **1 Leader** (`jobs.leader_user_id`). Gán: `boss` hoặc `hr` (quyền `jobs.assign_leader`).
- Leader: chỉ ứng viên có `job_id` thuộc job mình phụ trách.
- Kế toán: ứng viên có status `position >= position('interview')` và `kind != 'lost'`, **hoặc** `offer_status IS NOT NULL`. Kế toán chỉ được đổi status `interview → offer` và đặt `offer_status`.
- Field bị cấm phải **không có trong JSON** trả về (không chỉ ẩn UI).
- Mail nhân viên (mời, đặt lại mật khẩu) gửi qua Resend từ `hr@`, **không** qua `resolveRecipient` (không bị chế độ test chặn).
- CC: chế độ test (`HR_EMAIL_MODE` ≠ `live`) không CC ai; người gửi không CC chính mình; gộp trùng.
- Mật khẩu chung cũ (`x-hr-key`) còn chạy như `boss` (tên hiển thị "Mật khẩu chung") **cho tới Task 12**; Task 12 chỉ làm sau khi sếp xác nhận.
- Cron dùng header `x-hr-cron-key` = env `HR_CRON_SECRET`, chỉ 2 route remind nhận.
- Migration mới: `supabase/migrations/20261027000000_hr_accounts.sql`, áp prod qua MCP `apply_migration` (như các lần trước), RLS bật, không policy.
- Copy UI tiếng Việt, styleguide TD Games Work v4 đang dùng trong `/hr` (biến CSS `hr-theme.css`, icon Lucide).
- Test thuần: `node --test src/lib/<file>.test.ts` (Node chạy TS trực tiếp như các test hiện có; import nội bộ có đuôi `.ts`).

## Review Focus

1. **Leader đổi ID trong URL** (`/api/hr/applications/<id ngoài phạm vi>/comments`, `/interviews/<id>`, `/submissions/<subId>`) → phải 404, không phải 403 lộ sự tồn tại. Test: Task 6 `loadScopedApplication` trả null ngoài phạm vi; Task 7 checklist curl.
2. **Cột mới thêm vào `applications` sau này** → Leader/Kế toán không được tự động thấy. Test: Task 5 `redactApplication` bỏ key lạ khi thiếu quyền.
3. **Tài khoản bị khoá giữa phiên** → request kế tiếp 401. Test: Task 2 `sessionUserIsActive`; Task 7 kiểm tay.
4. **Link mời bấm lần 2 / quá hạn / link quên mật khẩu của tài khoản bị khoá** → báo "Link không còn hiệu lực", không đổi mật khẩu. Test: Task 2 `isTokenUsable`.
5. **Sếp tự hạ vai / khoá chính mình, hoặc khoá Sếp cuối cùng** → 400. Test: Task 4 `validateUserChange`.

---

### Task 1: Migration + danh sách quyền

**Files:**
- Create: `supabase/migrations/20261027000000_hr_accounts.sql`
- Create: `src/lib/hr-permissions.ts`
- Test: `src/lib/hr-permissions.test.ts`

**Interfaces:**
- Produces: `HR_ROLES`, `type HrRole = "boss"|"hr"|"leader"|"accountant"`, `ROLE_LABEL`, `HR_PERMISSIONS: readonly PermissionDef[]`, `type PermissionKey`, `effectivePermissions(role: HrRole, overrides: {role:string;permission:string;allowed:boolean}[]): Set<PermissionKey>`, `isPermissionKey(v: unknown): v is PermissionKey`.
- `PermissionDef = { key: string; label: string; group: string; defaults: Record<Exclude<HrRole,"boss">, boolean> }`.

Migration (một file, idempotent `IF NOT EXISTS`):
- `hr_users(id uuid pk default gen_random_uuid(), email text not null unique /* lưu lower-case */, display_name text not null, role text not null check (role in ('boss','hr','leader','accountant')), password_hash text, disabled boolean not null default false, created_at timestamptz default now(), last_login_at timestamptz)`
- `hr_sessions(token_hash text pk, user_id uuid not null references hr_users on delete cascade, expires_at timestamptz not null, created_at timestamptz default now())` + index `user_id`
- `hr_user_tokens(token_hash text pk, user_id uuid not null references hr_users on delete cascade, purpose text not null check (purpose in ('invite','reset')), expires_at timestamptz not null, used_at timestamptz, created_at timestamptz default now())`
- `hr_role_permissions(role text not null check (role in ('hr','leader','accountant')), permission text not null, allowed boolean not null, primary key (role, permission))`
- `jobs.leader_user_id uuid references hr_users(id) on delete set null`
- `applications.offer_status text check (offer_status in ('pending','accepted','declined'))`, `applications.offer_status_at timestamptz`
- `application_comments.author_user_id uuid references hr_users(id) on delete set null`
- `candidate_emails`: drop + re-add kind check thêm `'offer'`; `cc_emails text[] not null default '{}'`; `sent_by_user_id uuid references hr_users(id) on delete set null`
- `hr_push_subscriptions.user_id uuid references hr_users(id) on delete cascade`
- RLS enable trên 4 bảng mới, không policy.

Danh sách quyền (key → nhãn, mặc định HR/Leader/Kế toán) — copy đúng:

| key | label | hr | leader | accountant |
|---|---|---|---|---|
| `apps.view_contact` | Xem liên hệ (email, SĐT, LinkedIn, website) | ✓ | | ✓ |
| `apps.view_salary` | Xem lương mong muốn / rate | ✓ | | ✓ |
| `apps.view_ai` | Xem điểm & đánh giá AI, MBTI, xếp hạng | ✓ | | |
| `apps.view_notes` | Xem ghi chú nội bộ & lý do loại | ✓ | | |
| `apps.view_interviews` | Xem lịch PV | ✓ | ✓ | ✓ |
| `apps.view_interview_analysis` | Xem gỡ băng & phân tích ghi âm PV | ✓ | | |
| `apps.view_tests` | Xem bài test & bài nộp | ✓ | ✓ | |
| `apps.view_emails` | Xem lịch sử mail ứng viên | ✓ | | ✓ |
| `apps.comment` | Xem / viết comment | ✓ | ✓ | ✓ |
| `apps.review_test` | Chấm bài test | ✓ | ✓ | |
| `apps.edit` | Sửa hồ sơ / đổi trạng thái (mọi trạng thái) | ✓ | | |
| `apps.offer` | Chuyển Interview → Offer & ghi kết quả offer | ✓ | | ✓ |
| `apps.delete` | Xoá hồ sơ | ✓ | | |
| `interviews.manage` | Tạo / sửa lịch PV, upload & phân tích ghi âm | ✓ | | |
| `emails.send` | Gửi mail ứng viên (mời PV, bài test, báo trượt…) | ✓ | | |
| `emails.send_offer` | Gửi mail offer | ✓ | | ✓ |
| `jobs.manage` | Quản lý job, bài test, trạng thái pipeline, quy tắc xếp hạng | ✓ | | |
| `jobs.assign_leader` | Gán Leader cho job | ✓ | | |
| `ai.run` | Chạy AI chấm / xếp hạng / tìm kiếm AI | ✓ | | |
| `push.receive` | Nhận thông báo đẩy nhắc lịch PV | ✓ | ✓ | |

Xem hồ sơ cơ bản (tên, job, trạng thái, CV, portfolio) không phải quyền — ai đăng nhập cũng có trong phạm vi của mình.

- [ ] **Step 1: Write failing tests** `hr-permissions.test.ts`:
  - `effectivePermissions("boss", [{role:"boss",permission:"apps.delete",allowed:false}])` chứa **mọi** key trong `HR_PERMISSIONS`.
  - `effectivePermissions("leader", [])` có `apps.review_test`, không có `apps.view_salary`.
  - override `{role:"leader",permission:"apps.view_salary",allowed:true}` → leader có `apps.view_salary`; override cho role khác không ảnh hưởng.
  - override key lạ `"foo.bar"` bị bỏ qua (không ném, không có trong Set).
  - mọi `key` trong `HR_PERMISSIONS` là duy nhất và khớp `/^[a-z_]+\.[a-z_]+$/`.
- [ ] **Step 2:** `node --test src/lib/hr-permissions.test.ts` → FAIL (module không tồn tại).
- [ ] **Step 3:** Viết migration + `hr-permissions.ts` (thuần, không import server).
- [ ] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `feat(hr): schema tài khoản + danh sách quyền theo vai`.

---

### Task 2: Mật khẩu, token, phiên, `requireHrUser`

**Files:**
- Create: `src/lib/hr-crypto.ts` (thuần) + `src/lib/hr-crypto.test.ts`
- Create: `src/lib/hr-session.ts` (server-only)
- Modify: `src/lib/hr-auth.ts` — giữ `getHRSecret` (dùng cho legacy), `requireHR` thành wrapper `requireHrUser(req)` để route chưa chuyển vẫn chạy.

**Interfaces:**
- Consumes: `effectivePermissions`, `HrRole`, `PermissionKey` (Task 1).
- Produces:
  - `hashPassword(pw: string): Promise<string>` (format `scrypt$N$r$p$saltB64$hashB64`), `verifyPassword(pw: string, stored: string|null): Promise<boolean>` (timing-safe; `null` → false)
  - `newToken(): { token: string; hash: string }` (32 byte base64url; hash = sha256 hex), `hashToken(t: string): string`
  - `isTokenUsable(row: { expires_at: string; used_at: string|null }, now: Date): boolean`
  - `sessionUserIsActive(u: { disabled: boolean } | null): boolean`
  - `type HrContext = { user: { id: string|null; email: string; displayName: string }; role: HrRole; perms: Set<PermissionKey>; legacy: boolean }`
  - `getHrContext(req: Request): Promise<HrContext|null>` — cookie `hr_session` → `hr_sessions` join `hr_users` (chưa hết hạn, không disabled) → load `hr_role_permissions` → context. Không có cookie mà header `x-hr-key` khớp `getHRSecret()` → context `{ id:null, email:"", displayName:"Mật khẩu chung" }, role "boss", legacy:true`.
  - `requireHrUser(req: Request, perm?: PermissionKey): Promise<{ ctx: HrContext } | { response: NextResponse }>` — 401 khi null; 403 `{ error: "Bạn không có quyền làm việc này" }` khi thiếu perm.
  - `requireBoss(req): Promise<{ ctx } | { response }>` — 403 nếu `role !== "boss"`.
  - `createSession(userId: string): Promise<{ token: string; expires: Date }>`, `destroySession(token: string)`, `sessionCookie(token, expires)`/`clearSessionCookie()` → chuỗi `Set-Cookie` (`HttpOnly; Secure; SameSite=Lax; Path=/`).

- [ ] **Step 1: Failing tests** `hr-crypto.test.ts`: hash rồi verify đúng → true; sai mật khẩu → false; `verifyPassword("x", null)` → false; hai lần `hashPassword` cùng input khác chuỗi (salt); `hashToken(newToken().token) === newToken.hash` của chính nó; `isTokenUsable` false khi `used_at` có giá trị, false khi `expires_at < now`, true khi còn hạn và chưa dùng; `sessionUserIsActive({disabled:true})` false, `null` false.
- [ ] **Step 2:** Chạy → FAIL.
- [ ] **Step 3:** Viết `hr-crypto.ts`, `hr-session.ts`; đổi `requireHR(req)` thành `async (req) => { const r = await requireHrUser(req); return "response" in r ? r.response : null; }`.
- [ ] **Step 4:** Test PASS; `npm run typecheck` sạch.
- [ ] **Step 5:** Commit `feat(hr): phiên đăng nhập + requireHrUser (vẫn nhận mật khẩu chung)`.

---

### Task 3: API đăng nhập / mời / đặt mật khẩu + script tạo Sếp

**Files:**
- Create: `src/app/api/hr/auth/login/route.ts` (POST `{email,password}`)
- Create: `src/app/api/hr/auth/logout/route.ts` (POST)
- Create: `src/app/api/hr/auth/me/route.ts` (GET → `{ user, role, roleLabel, perms: string[], legacy }`)
- Create: `src/app/api/hr/auth/forgot/route.ts` (POST `{email}`)
- Create: `src/app/api/hr/auth/set-password/route.ts` (GET `?token=` → `{ valid, email, purpose }`; POST `{token,password}`)
- Create: `src/lib/hr-staff-email.ts` (thuần) + `src/lib/hr-staff-email.test.ts`
- Create: `scripts/hr-create-boss.mjs`

**Interfaces:**
- Consumes: Task 2 toàn bộ; `textToHtml`, `getHrEmailConfig` (`src/lib/hr-email.ts`), `sendViaResend` (`src/lib/hr-email-send.ts`).
- Produces: `buildStaffInviteEmail({ displayName, roleLabel, link, invitedBy }): { subject, text }`, `buildPasswordResetEmail({ displayName, link }): { subject, text }`; `issueToken(userId, purpose: "invite"|"reset"): Promise<string /* raw */>` (đặt trong `hr-session.ts`, xoá token cũ chưa dùng cùng purpose của user) ; `sendStaffEmail(to: string, msg: {subject,text}): Promise<{id}|{error}>` (gọi thẳng `sendViaResend` với `to` thật).
- Link: `${origin}/hr/set-password?token=<raw>` (origin từ `new URL(req.url).origin`, fallback `https://tdgamestudio.com`).

Hành vi:
- login: email lower-case; sai email/mật khẩu/bị khoá/chưa đặt mật khẩu → cùng một 401 `"Email hoặc mật khẩu không đúng"`. Thành công → `createSession`, cập nhật `last_login_at`, `Set-Cookie`.
- set-password POST: token hợp lệ (`isTokenUsable`), user không disabled, mật khẩu ≥ 8 → lưu hash, đánh `used_at`, **xoá mọi phiên cũ** của user, tạo phiên mới (đăng nhập luôn). Token hỏng → 400 `"Link không còn hiệu lực"`.
- forgot: user tồn tại + không disabled → `issueToken(reset)` + gửi mail; mọi trường hợp trả `{ ok: true }`.
- `scripts/hr-create-boss.mjs --email tony@tdgamestudio.com --name "Tony"`: upsert `hr_users` role boss, in ra link đặt mật khẩu (token invite) — chạy `node --env-file=.env.local` (cần network → `dangerouslyDisableSandbox`).

- [ ] **Step 1: Failing tests** `hr-staff-email.test.ts`: subject mời chứa `"Mời bạn vào TD Games HR"`; text chứa link, tên, nhãn vai, câu `"Link có hiệu lực 7 ngày"`; reset text chứa `"1 giờ"` và câu `"Nếu bạn không yêu cầu, hãy bỏ qua email này."`; không mail nào chứa chữ `undefined`.
- [ ] **Step 2:** FAIL. **Step 3:** Viết. **Step 4:** PASS + typecheck.
- [ ] **Step 5: Kiểm tay local** (`npm run dev`, DB prod sau khi migration Task 1 đã áp — xem Task 12 bước 1): chạy script tạo Sếp → mở link → đặt mật khẩu → `curl -b cookie /api/hr/auth/me` trả role `boss`; mở lại link → "Link không còn hiệu lực"; forgot với email lạ → 200.
- [ ] **Step 6:** Commit `feat(hr): đăng nhập, mời, quên/đặt mật khẩu`.

---

### Task 4: API quản lý tài khoản + bảng quyền (chỉ Sếp)

**Files:**
- Create: `src/app/api/hr/users/route.ts` (GET danh sách; POST `{email, display_name, role}` → tạo + gửi mời)
- Create: `src/app/api/hr/users/[id]/route.ts` (PATCH `{display_name?, role?, disabled?, resend_invite?}`)
- Create: `src/app/api/hr/permissions/route.ts` (GET `{ permissions: HR_PERMISSIONS, overrides }` — mọi user đăng nhập; PUT `{ role, permission, allowed }` — boss)
- Create: `src/lib/hr-users.ts` (thuần) + `src/lib/hr-users.test.ts`

**Interfaces:**
- Consumes: `requireBoss`, `issueToken`, `sendStaffEmail`, `buildStaffInviteEmail`, `isPermissionKey`.
- Produces: `validateUserChange(actor: { id: string|null }, target: { id: string; role: HrRole; disabled: boolean }, change: { role?: HrRole; disabled?: boolean }, activeBossCount: number): string | null` (null = OK, chuỗi = lỗi tiếng Việt).

Hành vi: khoá (`disabled:true`) → xoá mọi `hr_sessions` của user. Đổi vai khỏi `leader` → `jobs.leader_user_id` của user về null. GET users trả thêm `status`: `"active" | "invited" (chưa có password_hash) | "disabled"`. Email trùng → 409 `"Email đã có tài khoản"`. PUT permissions với role `boss` hoặc key lạ → 400. `allowed` bằng mặc định → xoá dòng override thay vì lưu.

- [ ] **Step 1: Failing tests** `validateUserChange`: actor tự khoá mình → lỗi; actor tự đổi vai khỏi boss → lỗi; khoá/hạ boss khác khi `activeBossCount === 1` → lỗi `"Phải còn ít nhất 1 tài khoản Sếp"`; đổi hr → leader → null; actor legacy (`id:null`) khoá boss khi còn 2 boss → null.
- [ ] **Step 2–4:** FAIL → viết → PASS + typecheck.
- [ ] **Step 5:** Commit `feat(hr): API tài khoản + bảng quyền cho Sếp`.

---

### Task 5: Phạm vi dữ liệu + gỡ field theo quyền (thuần)

**Files:**
- Create: `src/lib/hr-scope.ts` + `src/lib/hr-scope.test.ts`

**Interfaces:**
- Consumes: `HrContext`, `PermissionKey`.
- Produces:
  - `type ScopeInput = { role: HrRole; userId: string|null; leaderJobIds: string[]; statuses: { key: string; position: number; kind: "open"|"won"|"lost" }[] }`
  - `accountantStatusKeys(statuses): string[]` — status có `position >= position("interview")` và `kind !== "lost"` (không có `interview` → `[]`).
  - `inScope(s: ScopeInput, app: { job_id: string; status: string; offer_status?: string|null }): boolean`
  - `redactApplication<T extends Record<string, unknown>>(app: T, perms: Set<PermissionKey>): Partial<T>`
  - `redactInterview(row, perms)` — thiếu `apps.view_interview_analysis` thì bỏ `transcript`, `analysis*`, `ai_*`, `audio*`, `questions`.
  - `FIELD_GROUPS: Record<PermissionKey, string[]>` dùng bởi redact:
    - `apps.view_contact`: `email, phone, contact_channel, contact_handle, linkedin_url, website_url`
    - `apps.view_salary`: `expected_salary, rate_per_hour`
    - `apps.view_ai`: `ai_score, ai_evaluation, ai_profile, ai_profile_hash, ai_digest, ai_digest_hash, mbti_type, mbti_url` + mọi key bắt đầu `ai_` hoặc `rank`
    - `apps.view_notes`: `admin_notes, rejection_reason, blocked, block_reason, label`
    - `apps.view_interviews`: `interview_sessions`
    - `apps.view_tests`: `test_submissions, test_review, test_token, test_eta, test_eta_set_at`
    - Luôn giữ (`BASE_FIELDS`): `id, job_id, jobs, full_name, work_type, years_experience, cv_url, portfolio_url, available_from, status, offer_status, offer_status_at, created_at, updated_at`
  - Quy tắc: nếu `perms` chứa **mọi** key `apps.view_*` → trả nguyên `app`. Ngược lại chỉ giữ `BASE_FIELDS` + nhóm được phép; **key không thuộc nhóm nào bị bỏ**.

- [ ] **Step 1: Failing tests:**
  - leader thấy app của `leaderJobIds`, không thấy job khác; `hr`/`boss` thấy mọi app.
  - accountant với status seed (new 10, reviewing 20, phone_screening 30, test 40, interview 50, offer 60 won, rejected 70 lost): thấy `interview`, `offer`; không thấy `test`; thấy `rejected` **chỉ khi** `offer_status: "declined"`; status mới `hired` position 65 kind won → thấy.
  - `redactApplication` với perms mặc định leader: còn `cv_url`, `test_review`, `interview_sessions`; mất `email`, `expected_salary`, `ai_profile`, `admin_notes`, và key lạ `some_future_column`.
  - perms đủ `apps.view_*` → giữ `some_future_column`.
- [ ] **Step 2–4:** FAIL → viết → PASS.
- [ ] **Step 5:** Commit `feat(hr): lọc phạm vi + gỡ field theo quyền`.

---

### Task 6: Chuyển các route đọc dữ liệu

**Files (Modify):** `src/app/api/hr/applications/route.ts`, `search/route.ts`, `jobs/route.ts` (GET), `statuses/route.ts` (GET), `jobs/[id]/ranking/route.ts` (GET), `ranking/rules/route.ts` (GET), `applications/[id]/comments/route.ts` (GET), `applications/[id]/emails/route.ts` (GET), `applications/[id]/emails/draft/route.ts`, `applications/[id]/interviews/route.ts` (GET), `applications/[id]/submissions/route.ts` (GET), `interviews/[id]/route.ts` (GET), `jobs/[id]/tests/route.ts` (GET)
- Modify: `src/lib/hr-session.ts` — thêm loader server.

**Interfaces:**
- Produces (trong `hr-session.ts`): `loadScope(ctx: HrContext): Promise<ScopeInput>` (đọc `application_statuses` + `jobs where leader_user_id = ctx.user.id`), `loadScopedApplication(ctx, appId: string, columns?: string): Promise<Record<string,unknown>|null>` — null nếu không tồn tại **hoặc** ngoài phạm vi (route trả 404 `"Not found"` cho cả hai).

Luật theo route (perm cần, ngoài đăng nhập):
- `applications` GET: lọc `inScope` rồi `redactApplication`, và `redactInterview` từng phần tử `interview_sessions`. Leader: thêm `.in("job_id", leaderJobIds)` ở query (không tải hết rồi lọc).
- `search` GET (quick): kết quả lọc `inScope` + redact. `search` POST (AI): perm `ai.run`, kết quả cũng lọc `inScope` + redact.
- `jobs` GET: leader chỉ nhận job mình; trả thêm `leader_user_id`. Accountant: mọi job (để hiện tên job).
- `jobs/[id]/ranking` GET, `ranking/rules` GET: `apps.view_ai`.
- comments GET: `apps.comment` + scoped app. emails GET + draft: `apps.view_emails` (draft kind `offer` cần `emails.send_offer`, kind khác cần `emails.send`).
- interviews GET (cả 2 route): `apps.view_interviews` + scoped + `redactInterview`.
- submissions GET, `jobs/[id]/tests` GET: `apps.view_tests` (+ scoped app / leader chỉ job mình).

- [ ] **Step 1:** Thay `requireHR` bằng `requireHrUser(req, perm)` + luật trên cho từng file.
- [ ] **Step 2:** `npm run typecheck && npm run lint` sạch; `node --test src/lib/*.test.ts` PASS.
- [ ] **Step 3: Kiểm tay** (sau Task 4 có thể tạo tài khoản test `leader` gán 1 job, `accountant`): `curl -b leader.cookie /api/hr/applications | jq '.applications[0] | keys'` không có `email`/`expected_salary`/`ai_profile`; số hồ sơ = số hồ sơ của job đó; `curl -b leader.cookie /api/hr/applications/<id job khác>/comments` → 404; accountant chỉ thấy interview/offer.
- [ ] **Step 4:** Commit `feat(hr): route đọc lọc phạm vi + ẩn field theo quyền`.

---

### Task 7: Chuyển các route ghi + ghi đúng người làm + offer

**Files (Modify):** `applications/[id]/route.ts` (PATCH, DELETE), `applications/[id]/comments/route.ts` (POST), `applications/[id]/evaluate`, `applications/[id]/interviews` (POST), `applications/[id]/submissions` (POST), `interviews/[id]/route.ts` (PATCH, DELETE), `interviews/[id]/analyze`, `interviews/[id]/questions`, `job-tests/[testId]`, `jobs/route.ts` (POST), `jobs/[id]/route.ts` (PATCH, DELETE), `jobs/[id]/tests` (POST), `jobs/[id]/ranking` (POST), `ranking/profiles`, `ranking/rules` (PUT), `statuses` (POST/PATCH/DELETE), `submissions/[subId]`, `upload/*`, `push/route.ts`
- Create: `src/lib/hr-app-patch.ts` (thuần) + test

**Interfaces:**
- Produces: `checkAppPatch(ctx: { role: HrRole; perms: Set<PermissionKey> }, oldStatus: string, body: Record<string, unknown>): string | null` — null = được phép; chuỗi lỗi tiếng Việt → route 403.

Luật:
- PATCH application: có `apps.edit` → như cũ. Không có `apps.edit`: chỉ được key `test_review` (cần `apps.review_test`), `offer_status` (cần `apps.offer`), `status` **chỉ khi** `apps.offer` và `oldStatus === "interview"` và `body.status === "offer"`. Key khác → lỗi.
- `offer_status` hợp lệ: `pending|accepted|declined|null`; set `offer_status_at = now()`. Chuyển status sang `offer` mà `offer_status` đang null → set `pending`.
- `test_review.reviewer` = `ctx.user.displayName` (bỏ giá trị client gửi); thêm `reviewer_id: ctx.user.id`.
- Comment POST: `author_name = ctx.user.displayName`, `author_user_id = ctx.user.id`; bỏ yêu cầu `author_name` từ body.
- DELETE application: `apps.delete`. evaluate: `ai.run`. interviews POST/PATCH/DELETE, analyze, questions, upload audio: `interviews.manage`. submissions POST/DELETE, upload: `apps.edit`.
- jobs POST/DELETE, job-tests, jobs tests POST, statuses mutations, ranking rules PUT, ranking POST/profiles: `jobs.manage` (ranking POST/profiles: `ai.run`).
- jobs PATCH: body có `leader_user_id` → cần `jobs.assign_leader`, giá trị phải là user `role = 'leader'` chưa khoá hoặc null; key khác → `jobs.manage`.
- Mọi route có `appId`/`interviewId`/`subId` → resolve về application và `loadScopedApplication`; ngoài phạm vi → 404.
- push POST subscribe: cần `push.receive`, lưu `user_id = ctx.user.id` (legacy → null).

- [ ] **Step 1: Failing tests** `checkAppPatch`: accountant `{status:"offer"}` từ `interview` → null; accountant `{status:"offer"}` từ `test` → lỗi; accountant `{status:"rejected"}` → lỗi; accountant `{offer_status:"accepted"}` → null; leader `{test_review:{…}}` → null; leader `{admin_notes:"x"}` → lỗi; hr bất kỳ → null.
- [ ] **Step 2–4:** FAIL → viết helper + sửa routes → PASS, typecheck + lint sạch; `grep -rn "requireHR(" src/app/api/hr` chỉ còn 2 route remind (Task 9).
- [ ] **Step 5: Kiểm tay:** leader PATCH `admin_notes` → 403; accountant chuyển hồ sơ interview → offer → `offer_status` = pending; comment lưu đúng tên tài khoản; khoá tài khoản leader trong lúc đang có phiên → request kế tiếp 401.
- [ ] **Step 6:** Commit `feat(hr): route ghi kiểm quyền, ghi người làm, offer_status`.

---

### Task 8: Mail offer + tự CC nội bộ

**Files:**
- Modify: `src/lib/hr-email.ts`, `src/lib/hr-email.test.ts`, `src/lib/hr-email-send.ts`, `src/app/api/hr/applications/[id]/emails/route.ts`, `.../emails/draft/route.ts`

**Interfaces:**
- Consumes: `HrContext`, `requireHrUser`, `loadScopedApplication`.
- Produces:
  - `CANDIDATE_EMAIL_KINDS` thêm `"offer"`, `KIND_LABEL.offer = "Gửi offer"`; `DraftInput.offer?: { salary: string; startDate: string } | null`; `buildDraft` cho `offer`.
  - `CC_ROLES: Record<CandidateEmailKind, ("hr"|"leader"|"accountant"|"boss")[]>`: invite/reschedule/cancel/test_assignment → `["hr","leader"]`; rejection → `["hr"]`; offer → `["accountant","hr","boss"]`. `"leader"` = Leader của job ứng viên, các vai khác = mọi tài khoản active vai đó.
  - `resolveCc(cfg: HrEmailConfig, kind, staff: { email: string; role: HrRole; disabled: boolean; id: string }[], jobLeaderId: string|null, senderEmail: string): { cc: string[]; ccPreview: string[] }` — `cc = []` khi `cfg.mode !== "live"`; `ccPreview` luôn là danh sách sẽ CC; loại người gửi, loại disabled, lower-case + gộp trùng, `isValidEmail`.
  - `sendViaResend` nhận thêm `cc?: string[]` (bỏ key khi rỗng).
- Draft GET trả thêm `cc_preview: string[]`. POST nhận `cc?: string[]` = danh sách người gửi giữ lại; server chỉ chấp nhận **tập con** của `ccPreview` (ngăn client CC địa chỉ lạ), ở test mode vẫn không CC. Ghi `cc_emails` (danh sách thực CC), `sent_by = displayName`, `sent_by_user_id`. Perm: kind `offer` → `emails.send_offer`, kind khác → `emails.send`.

Mẫu mail offer (copy, builder giữ giọng các mẫu cũ trong file):
```
Chào {candidateName},

Cảm ơn bạn đã dành thời gian tham gia phỏng vấn vị trí {jobTitle} tại TD Games. Chúng tôi rất vui được gửi tới bạn lời mời làm việc:

- Vị trí: {jobTitle}
- Mức lương: {salary}
- Ngày bắt đầu dự kiến: {startDate}

Bạn vui lòng trả lời email này để xác nhận nhận offer, hoặc gửi lại bất kỳ câu hỏi nào — chúng tôi luôn sẵn sàng giải đáp.
```
(+ chữ ký như các mẫu khác. Trường `salary`/`startDate` để trống → giữ dòng với `"…"` để người gửi điền trong hộp thoại.)

- [ ] **Step 1: Failing tests** thêm vào `hr-email.test.ts`: `buildDraft({kind:"offer",…, offer:{salary:"15.000.000đ",startDate:"01/11/2026"}})` chứa cả hai giá trị và tên job; `resolveCc` live + rejection → chỉ email HR active; offer → kế toán + HR + boss, không có người gửi, không trùng, không có user disabled; invite với `jobLeaderId` → có email leader đó, không có leader khác; test mode → `cc: []` nhưng `ccPreview` đầy đủ.
- [ ] **Step 2–4:** FAIL → viết → PASS (cả 19 test cũ vẫn PASS).
- [ ] **Step 5:** Commit `feat(hr): mail offer + tự CC nội bộ theo loại mail`.

---

### Task 9: Cron secret + thông báo đẩy theo người

**Files:**
- Modify: `src/app/api/hr/remind/route.ts`, `src/app/api/hr/interviews/remind/route.ts`, `.github/workflows/hr-remind.yml`, `.github/workflows/hr-interview-remind.yml`, `src/lib/hr-push.ts`
- Create: `src/lib/hr-push-recipients.ts` (thuần) + test

**Interfaces:**
- Produces: `requireCronOrHr(req): Promise<NextResponse|null>` (trong `hr-session.ts`: header `x-hr-cron-key === process.env.HR_CRON_SECRET` (non-empty) → OK; không thì `requireHrUser(req, "jobs.manage")`); `pushRecipientUserIds(users: {id; role; disabled}[], perms: Map<HrRole, Set<PermissionKey>>, jobLeaderId: string|null): string[]` — có `push.receive`, chưa khoá; vai `leader` chỉ khi `id === jobLeaderId`; `sendHrPush(payload, opts?: { onlyEndpoint?: string; userIds?: string[] })` — `userIds` có → `.in("user_id", userIds)`; subscription `user_id` null chỉ nhận khi gọi bằng `onlyEndpoint`.
- Workflow: header `-H "x-hr-cron-key: ${{ secrets.HR_CRON_SECRET }}"`.

- [ ] **Step 1: Failing tests** `pushRecipientUserIds`: leader job A nhận nhắc PV job A, leader job B không; HR nhận; accountant không (mặc định); user disabled không.
- [ ] **Step 2–4:** FAIL → viết → PASS + typecheck.
- [ ] **Step 5:** Commit `feat(hr): cron dùng HR_CRON_SECRET, push nhắc PV theo người`.

---

### Task 10: UI đăng nhập, đặt mật khẩu, phiên cookie, ẩn theo quyền

**Files:**
- Create: `src/app/hr/set-password/page.tsx` (client: đọc `?token`, GET kiểm tra → form mật khẩu + nhập lại → POST → chuyển `/hr`; token hỏng → "Link không còn hiệu lực. Nhờ Sếp gửi lại lời mời hoặc dùng Quên mật khẩu.")
- Create: `src/app/hr/_components/HrSession.tsx` — `HrSessionProvider`, `useHrSession(): { me: Me|null; can(p: PermissionKey): boolean; signOut(): Promise<void> }`
- Modify: `src/app/hr/_components/HRDashboard.tsx` (đăng nhập ~2533–2610, `CommentThread` ~332–470), `CandidateSearch.tsx`, `InterviewPanel.tsx`, `TestsPanel.tsx`, `RankingPanel.tsx`, `StatusManager.tsx`, `PushToggle.tsx`, `CandidateMailDialog.tsx`, `upload-audio.ts`

**Interfaces:**
- Consumes: `/api/hr/auth/*` (Task 3), `HR_PERMISSIONS` keys.
- `type Me = { user: { id: string|null; email: string; displayName: string }; role: HrRole; roleLabel: string; perms: string[]; legacy: boolean }`

Hành vi:
- Mở `/hr` → GET `/api/hr/auth/me`; 401 → form **Email + Mật khẩu** + link "Quên mật khẩu?" (form nhập email → "Nếu email có tài khoản, link đặt lại đã được gửi."). Giữ ô "Mật khẩu chung" dạng link nhỏ "Đăng nhập bằng mật khẩu chung" **chỉ tới Task 12** (gửi `x-hr-key` như cũ).
- Bỏ prop `hrKey` khỏi fetch (cookie tự đi, `credentials: "same-origin"`); trong giai đoạn legacy, một wrapper `hrFetch(url, init)` trong `HrSession.tsx` thêm `x-hr-key` nếu đang đăng nhập bằng mật khẩu chung. Mọi `fetch("/api/hr…")` đổi sang `hrFetch`.
- Toolbar: tên + vai người đăng nhập, nút Đăng xuất.
- Bỏ ô nhập tên comment + `COMMENT_AUTHOR_KEY`; tên chấm bài lấy từ server (TestsPanel không gửi `reviewer`).
- Ẩn theo `can()`: nút gửi mail (`emails.send`), xoá hồ sơ (`apps.delete`), sửa trạng thái/ghi chú (`apps.edit`), kéo thả pipeline (`apps.edit`, hoặc `apps.offer` chỉ cho thẻ interview → cột Offer), tab Jobs/quản lý trạng thái (`jobs.manage`), Ranking/AI (`apps.view_ai`/`ai.run`), InterviewPanel quản lý (`interviews.manage`), PushToggle (`push.receive`). Field không có trong JSON thì không render khối đó (không hiện ô trống "undefined").

- [ ] **Step 1:** Viết `HrSession.tsx`, trang set-password, đổi đăng nhập.
- [ ] **Step 2:** Đổi toàn bộ fetch sang `hrFetch`; `grep -rn "x-hr-key" src/app/hr` chỉ còn trong `HrSession.tsx`.
- [ ] **Step 3:** `npm run typecheck && npm run lint && npm run build` sạch.
- [ ] **Step 4: Kiểm trên trình duyệt (Playwright MCP, `npm run dev`):** đăng nhập Sếp → thấy đủ; đăng nhập leader test → chỉ job mình, không thấy lương/AI/nút gửi mail, chấm bài hiện đúng tên; accountant → chỉ cột Interview/Offer, kéo Interview → Offer được, kéo sang cột khác bị chặn; đăng xuất → về form. Chụp màn hình gửi sếp.
- [ ] **Step 5:** Commit `feat(hr): đăng nhập tài khoản trên /hr + ẩn chức năng theo quyền`.

---

### Task 11: UI Tài khoản & quyền, gán Leader, offer, CC

**Files:**
- Create: `src/app/hr/_components/AccountsPanel.tsx` (tab "Tài khoản & quyền", chỉ `role === "boss"`)
- Modify: `HRDashboard.tsx` (thêm view `"accounts"`; ô chọn Leader trong khu Jobs; khối Offer trong hồ sơ), `CandidateMailDialog.tsx`

Hành vi:
- AccountsPanel: bảng tài khoản (tên, email, vai, trạng thái Đang dùng / Chờ đặt mật khẩu / Đã khoá, lần đăng nhập cuối); "Thêm tài khoản" (email, tên, vai) → "Đã gửi lời mời tới …"; mỗi dòng: đổi vai, Khoá/Mở khoá (xác nhận), "Gửi lại lời mời" (khi chờ đặt mật khẩu). Lỗi server hiện nguyên văn.
- Bảng quyền: hàng = `HR_PERMISSIONS` gom theo `group`, cột = HR / Leader / Kế toán, ô checkbox; ô khác mặc định có chấm cam nhỏ + nút "Về mặc định". Cột Sếp hiện "Toàn quyền" (không tích được). Lưu từng ô ngay (PUT), lỗi → hoàn tác ô.
- Jobs: dropdown "Leader phụ trách" (tài khoản vai leader chưa khoá + "Chưa gán"), hiện khi `can("jobs.assign_leader")`.
- Hồ sơ ở status `offer` (hoặc có `offer_status`): khối "Offer" với 3 nút Chờ trả lời / Đã nhận / Từ chối (`apps.offer`) + nút "Gửi mail offer" (`emails.send_offer`) mở `CandidateMailDialog` kind `offer` có 2 ô Mức lương / Ngày bắt đầu điền vào nháp.
- CandidateMailDialog: dòng "CC:" với chip từng email (bấm × để bỏ) từ `cc_preview`; test mode hiện "Chế độ test — khi bật thật sẽ CC: …" và không gửi CC; lịch sử mail hiện CC.

- [ ] **Step 1:** Viết AccountsPanel + nối API Task 4.
- [ ] **Step 2:** Leader dropdown, khối Offer, CC trong hộp thoại.
- [ ] **Step 3:** typecheck + lint + build sạch.
- [ ] **Step 4: Kiểm trên trình duyệt:** Sếp tạo tài khoản leader (email test của sếp) → mail mời tới; tắt `apps.view_tests` của Leader → leader reload không còn bài test; bật lại "Về mặc định"; gán leader cho 1 job; hộp thoại mời PV hiện CC HR + leader; offer hiện CC kế toán + HR + Sếp.
- [ ] **Step 5:** Commit `feat(hr): tab Tài khoản & quyền, gán Leader, offer, CC mail`.

---

### Task 12: Triển khai + gỡ mật khẩu chung

**Bước A — triển khai (làm ngay sau Task 11, cần sếp OK deploy):**
- [ ] Áp migration prod: MCP `apply_migration` với nội dung `20261027000000_hr_accounts.sql`; `list_tables` thấy 4 bảng `hr_*`.
- [ ] Set env VPS + GitHub secret: `HR_CRON_SECRET` (random 32 byte) — VPS `/opt/tdgames-landingpage/.env.local` + `gh secret set HR_CRON_SECRET`; `pm2 restart` sau deploy.
- [ ] `git push origin main` → `gh run watch` success.
- [ ] Chạy `scripts/hr-create-boss.mjs` cho tony@ → gửi link đặt mật khẩu cho sếp qua Telegram.
- [ ] Verify prod: `curl https://tdgamestudio.com/api/hr/auth/me` → 401; `curl -H "x-hr-key: …" /api/hr/applications` vẫn 200 (legacy); `gh workflow run hr-remind.yml` → success.
- [ ] Cập nhật `.agent/meta/LOG.md`, `TASKS.md`, `DECISIONS.md` (tài khoản tự quản thay Supabase Auth; phạm vi + redact ở server), `API.md`, `SCHEMA.md`.

**Bước B — gỡ mật khẩu chung (CHỈ khi sếp báo đã tạo xong tài khoản cho mọi người):**
- [ ] Xoá nhánh legacy trong `getHrContext`, link "mật khẩu chung" trong UI, `hrFetch` thêm header; `requireHR` xoá hẳn; `getHRSecret` xoá nếu không còn ai dùng (`grep`).
- [ ] typecheck + lint + build; deploy; `curl -H "x-hr-key: …" /api/hr/applications` → 401.
- [ ] Commit `chore(hr): gỡ mật khẩu chung x-hr-key`.
