# Website Chat (giai đoạn 1, không AI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ô chat trên mọi trang public (nút câu hỏi có sẵn + chat với người thật) và tab "Chat" trong /hr để sếp/HR trả lời trên điện thoại.

**Architecture:** 3 bảng Supabase mới (`chat_threads`, `chat_messages`, `chat_quick_replies`) truy cập qua API server bằng service role. Luật thuần (giờ trực, phân loại, chuyển trạng thái, token) ở `src/lib/chat.ts` có test `node --test`; thao tác DB + thông báo ở `src/lib/chat-server.ts`. Phía khách: widget client tải lười trong root layout, polling. Phía app: view `chat` mới trong `HRDashboard`, dùng `requireHrUser` + quyền `chat.*`.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, Supabase JS, Resend (qua `sendViaResend`), web-push (qua `sendHrPush`), `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-05-website-chat-design.md`

## Global Constraints

- Giai đoạn 1 KHÔNG có AI: không gọi model, không gợi ý. Chỉ chừa `sender='ai'` và `app_settings.chat_ai_enabled=false`.
- Giờ trực: `{"tz":"Asia/Ho_Chi_Minh","start":"08:00","end":"22:00"}`, mọi ngày. Ngoài giờ: gửi tin cho người thật bắt buộc email.
- Widget tiếng Anh; app tiếng Việt. Không render HTML từ nội dung khách (chỉ text, link chỉ ở `link_url` của câu có sẵn, phải là `/…` hoặc `https://`).
- Không hiện widget ở `/admin*`, `/hr*`, `/crm*`, `/company-profile` khi đang Slides, khi in (`@media print`).
- Mã khách: ngẫu nhiên ≥ 32 byte base64url; DB chỉ lưu sha256. Không có token đúng → 404 (không lộ tồn tại luồng).
- Chuông: gửi khi luồng chuyển sang cần người, tối đa 1 lần/5 phút/luồng, chỉ cho user có quyền chat tương ứng **và** `push.receive`.
- Email khách: tối đa 1 mail/10 phút/luồng; chỉ khi luồng có email và khách không thấy trong 2 phút; luồng ứng viên From `fromFor(cfg, staffName)` (hiring@), luồng khách From `"<Tên> · TD Games" <info@tdgamestudio.com>`; đi qua `resolveRecipient` (HR_EMAIL_MODE test → tony@). Footer: "You received this because this address was entered in the chat on tdgamestudio.com".
- Link email: token riêng, hết hạn 30 ngày, thay mới mỗi lần gửi.
- Giới hạn: tin ≤ 2000 ký tự, tên ≤ 80, email hợp lệ (`isValidEmail`); rate limit IP 30 tin/10 phút, tạo luồng 10/giờ/IP.
- Giữ dữ liệu 24 tháng từ `last_message_at` rồi xoá (cron).
- Migration chỉ thêm (không DROP) — áp bằng `execute_sql`/apply_migration; file trong `supabase/migrations/`.
- Không thêm dependency mới.

## Review Focus

1. Khách A biết/đoán `thread id` (uuid) gọi API công khai → phải 404, API công khai CHỈ nhận token khách, không nhận thread id. → test ở Task 3 (`threadForToken` trả null với token sai) + kiểm E2E Task 8.
2. HR (chỉ `chat.candidates`) gọi `/api/hr/chat/threads/<id luồng khách>` → 404. → test `canSeeAudience` Task 1 + E2E Task 8.
3. Khách bấm nút câu hỏi có sẵn liên tục → KHÔNG thành "cần người", KHÔNG rung chuông. → test `nextThreadState` Task 1.
4. Ngoài giờ gửi tin không email → 400 `email_required`, widget hiện ô email. → test `requiresEmail` Task 1 + E2E.
5. Khách nhắn 10 tin liên tiếp → chỉ 1 push (5 phút). → test `shouldPush` Task 1.

---

### Task 1: Migration + luật thuần `src/lib/chat.ts` + quyền `chat.*`

**Files:**
- Create: `supabase/migrations/20261105100000_website_chat.sql`
- Create: `src/lib/chat.ts`, `src/lib/chat.test.ts`
- Modify: `src/lib/hr-permissions.ts` (thêm 3 quyền, nhóm "Chat"), test quyền hiện có nếu đếm số quyền

**Interfaces — Produces:**
- `type ChatAudience = "client" | "candidate"`; `type ChatStatus = "open" | "answered" | "closed"`; `type ChatSender = "visitor" | "staff" | "system" | "ai"`; `type ChatKind = "text" | "quick_reply" | "canned_answer" | "contact_form"`
- `CHAT_HOURS_DEFAULT = { tz: "Asia/Ho_Chi_Minh", start: "08:00", end: "22:00" }`
- `isWithinHours(now: Date, hours = CHAT_HOURS_DEFAULT): boolean`
- `requiresEmail(now: Date, hasEmail: boolean, hours?): boolean` — true khi ngoài giờ và chưa có email
- `classifyAudience(input: { page: string | null; quickReplyAudience?: "client" | "candidate" | "any" | null; current?: ChatAudience | null }): ChatAudience` — quick reply `candidate` → candidate; đã có current → giữ (trừ khi quick reply candidate); page bắt đầu `/careers` → candidate; còn lại client
- `nextThreadState(prev: { status: ChatStatus; needsHuman: boolean }, event: "visitor_text" | "talk_to_person" | "quick_reply" | "staff_reply" | "close"): { status: ChatStatus; needsHuman: boolean }` — visitor_text/talk_to_person → `{open, true}`; quick_reply → giữ needsHuman, status closed→open; staff_reply → `{answered, false}`; close → `{closed, false}`
- `shouldPush(args: { wasNeedsHuman: boolean; isNeedsHuman: boolean; lastPushAt: Date | null; now: Date }): boolean` — gọi mỗi khi khách gửi tin text/talk_to_person. `isNeedsHuman` false → false; `wasNeedsHuman` false → true; còn lại true chỉ khi `lastPushAt` null hoặc ≥ 5 phút trước.
- `shouldEmail(args: { hasEmail: boolean; lastVisitorSeenAt: Date | null; lastEmailAt: Date | null; now: Date }): boolean` — email && (seen null hoặc ≥ 2 phút) && (lastEmail null hoặc ≥ 10 phút)
- `newToken(): string` (randomBytes(32) base64url), `hashToken(t: string): string` (sha256 hex)
- `canSeeAudience(perms: Set<string>, a: ChatAudience): boolean` — client ↔ `chat.clients`, candidate ↔ `chat.candidates`
- `cleanText(s: unknown, max: number): string | null` — trim, bỏ ký tự điều khiển (giữ \n), rỗng → null, cắt max
- `isSafeLink(url: string): boolean` — `/` (không `//`) hoặc `https://`
- Quyền: `chat.candidates` (d(true,false,false)), `chat.clients` (d(false,false,false)), `chat.manage` (d(false,false,false)), group `"Chat"`

**Migration** (bảng theo spec §8 + `lead_id uuid references leads(id) on delete set null`, `email_link_expires_at`, `last_push_at`, `last_email_at`, `email_pending boolean default false`; check constraints cho các enum; index `(needs_human, last_message_at desc)`, `(email)`, `(visitor_token_hash)` unique, `chat_messages(thread_id, created_at)`; RLS enable, không policy; `insert into app_settings` 3 key nếu chưa có (`on conflict do nothing`)).

- [ ] **Step 1: Viết `src/lib/chat.test.ts`** — các test:
  - `isWithinHours`: 2026-11-05T00:59Z (07:59 VN) false; 01:00Z (08:00) true; 14:59Z (21:59) true; 15:00Z (22:00) false.
  - `requiresEmail(01:00Z,false)` false; `requiresEmail(15:30Z,false)` true; `requiresEmail(15:30Z,true)` false.
  - `classifyAudience({page:"/careers/2d-artist"})` candidate; `({page:"/services"})` client; `({page:"/services",quickReplyAudience:"candidate"})` candidate; `({page:"/careers",current:"client"})` client.
  - `nextThreadState({status:"answered",needsHuman:false},"quick_reply")` → `{status:"answered",needsHuman:false}`; `({status:"closed",needsHuman:false},"visitor_text")` → `{open,true}`; staff_reply → `{answered,false}`.
  - `shouldPush`: false→true luôn true; true→true lastPush 2 phút trước false; 6 phút trước true; isNeedsHuman false → false.
  - `shouldEmail`: không email false; seen 1 phút trước false; seen 3 phút + lastEmail 5 phút false; seen 3 + lastEmail 11 true.
  - `hashToken(newToken())` dài 64; hai `newToken()` khác nhau, độ dài ≥ 43.
  - `canSeeAudience(new Set(["chat.candidates"]),"client")` false.
  - `cleanText("  a\u0000b \n", 10)` = `"ab"`? → chốt: bỏ ký tự điều khiển trừ `\n`, trim ⇒ `"ab"`; `cleanText("   ",10)` null; cắt 2000.
  - `isSafeLink("/careers")` true, `("//evil.com")` false, `("javascript:alert(1)")` false, `("http://x")` false.
- [ ] **Step 2:** `node --test src/lib/chat.test.ts` → FAIL (module chưa có).
- [ ] **Step 3:** Viết `src/lib/chat.ts` (thuần, chỉ import `node:crypto`) + migration SQL + 3 quyền trong `hr-permissions.ts`.
- [ ] **Step 4:** `node --test src/lib/chat.test.ts src/lib/hr-permissions.test.ts` → PASS; `npx tsc --noEmit` 0 lỗi.
- [ ] **Step 5:** Áp migration lên prod qua `mcp__supabase__apply_migration` (chỉ CREATE/INSERT), verify `select count(*) from chat_threads` = 0.
- [ ] **Step 6:** Commit `feat(chat): schema + luật thuần + quyền chat.*`.

### Task 2: `src/lib/chat-server.ts` — thao tác DB + push + email

**Files:** Create `src/lib/chat-server.ts`, `src/lib/chat-email.ts`, `src/lib/chat-email.test.ts`

**Interfaces — Consumes:** Task 1. `sendHrPush(payload,{userIds})`, `sendViaResend(cfg,msg)`, `getHrEmailConfig(process.env)`, `resolveRecipient`, `fromFor`, `textToHtml`, `isValidEmail`, `getSupabaseAdmin()`.
**Produces:**
- `type ChatThreadRow` (cột DB, camelCase không cần — dùng snake_case như DB), `type ChatMessageRow`
- `threadForToken(token: string): Promise<ChatThreadRow | null>` (theo hash, bỏ luồng đã `merged_into` → trả luồng gốc? **chốt: trả chính luồng của token**, gộp chỉ phía app)
- `createThread(args: { page: string|null; userAgent: string|null; country: string|null; audience: ChatAudience }): Promise<{ thread: ChatThreadRow; token: string }>`
- `addVisitorMessage(thread, args: { kind: ChatKind; body: string; quickReplyId?: string; event: "visitor_text"|"talk_to_person"|"quick_reply"; page?: string|null }): Promise<ChatMessageRow[]>` — ghi tin (quick reply: ghi 2 tin `quick_reply` + `canned_answer` sender system), cập nhật state qua `nextThreadState`, `pages` (giữ 5 trang gần nhất), `last_visitor_seen_at`, rồi `maybePush`
- `listMessages(threadId: string, after?: string): Promise<ChatMessageRow[]>` (theo created_at > after)
- `touchVisitor(threadId)`
- `setContact(thread, name: string|null, email: string): Promise<void>` (+ ghi tin `contact_form` system "Visitor left email …")
- `addStaffReply(threadId, staff: { id: string|null; displayName: string }, body: string): Promise<ChatMessageRow>` — state `staff_reply`; nếu `shouldEmail` → gửi ngay, không thì nếu có email set `email_pending=true`
- `flushPendingEmails(now = new Date()): Promise<number>` — luồng `email_pending` thoả `shouldEmail` → gửi gộp các tin staff sau `last_email_at`
- `purgeOld(now = new Date()): Promise<number>` — xoá luồng `last_message_at < now - 24 tháng`
- `resumeFromEmailToken(token: string): Promise<{ thread: ChatThreadRow; token: string } | null>` — token còn hạn → cấp visitor token mới (ghi đè hash) trả về
- `chatRecipients(audience): Promise<string[]>` — user id có quyền `chat.clients`/`chat.candidates` và `push.receive` (boss luôn có); đọc `hr_users` + `hr_role_permissions` qua `effectivePermissions`, bỏ user disabled
- `chat-email.ts` (thuần): `buildChatReplyEmail(args: { audience; visitorName: string|null; staffName: string; replies: string[]; resumeUrl: string }): { subject: string; text: string }` — subject "Re: your message to TD Games", text gồm các reply, link "Continue the conversation: <url>", footer cố định ở Global Constraints. `chatFrom(cfg, audience, staffName): string`.

- [ ] **Step 1:** Test `chat-email.test.ts`: subject đúng; text chứa mọi reply theo thứ tự, chứa resumeUrl, chứa footer nguyên văn; `chatFrom(cfg,"client","Tony")` = `"Tony · TD Games" <info@tdgamestudio.com>`; `chatFrom(cfg,"candidate","Phương")` = `fromFor(cfg,"Phương")`; tên có `"<>` bị làm sạch.
- [ ] **Step 2:** Chạy → FAIL. **Step 3:** Viết `chat-email.ts` + `chat-server.ts`. **Step 4:** test PASS, tsc 0 lỗi.
- [ ] **Step 5:** Commit `feat(chat): server lib (DB, push, email)`.

### Task 3: API công khai `/api/chat/*`

**Files:** Create `src/app/api/chat/route.ts` (GET config), `src/app/api/chat/thread/route.ts`, `src/app/api/chat/message/route.ts`, `src/app/api/chat/contact/route.ts`, `src/app/api/chat/resume/route.ts`

**Interfaces — Consumes:** Task 1–2, `createLimiter`, `clientIp`.
**Produces (contract widget dùng):** token gửi qua header `x-chat-token`.
- `GET /api/chat` → `{ enabled: boolean, online: boolean, quickReplies: { id, label, audience, answer, linkLabel, linkUrl }[] }` (chỉ active, theo sort_order; cache 60s)
- `POST /api/chat/thread` body `{ page }` → không có/ sai token: tạo mới `{ token, thread: PublicThread, messages: [] }`; token đúng: `{ thread, messages }`. `PublicThread = { status, audience, hasEmail, name, needsHuman }`
- `GET /api/chat/thread?after=<iso>` (header token) → `{ thread, messages: PublicMessage[], online }`; cập nhật `last_visitor_seen_at`. `PublicMessage = { id, sender, kind, body, staffName: string|null, createdAt }` (KHÔNG trả staff_user_id, email)
- `POST /api/chat/message` body `{ kind: "text"|"talk_to_person"|"quick_reply", body?, quickReplyId?, page? }` → `{ messages }`; text/talk_to_person khi `requiresEmail` → 400 `{ error: "email_required" }`
- `POST /api/chat/contact` body `{ name?, email }` → 200 / 400 `invalid_email`
- `POST /api/chat/resume` body `{ t }` → `{ token, thread, messages }` / 404
- Mọi route: widget tắt (`chat_widget_enabled=false`) → 503; rate limit → 429; token sai → 404 `not_found`.

- [ ] **Step 1:** Viết route. **Step 2:** `npx tsc --noEmit` 0 lỗi. **Step 3:** Dev server + curl: tạo luồng (token), gửi quick reply (needsHuman false), gửi text trong giờ (needsHuman true), GET với token khác → 404, gửi text ngoài giờ không email → 400 (giả lập bằng `CHAT_FORCE_OFFLINE=1` env chỉ dev — **chốt:** `isWithinHours` đọc `process.env.CHAT_FORCE_HOURS=offline|online` ở chat-server khi NODE_ENV≠production). **Step 4:** Commit.

### Task 4: API app `/api/hr/chat/*` + cron

**Files:** Create `src/app/api/hr/chat/threads/route.ts`, `.../threads/[id]/route.ts`, `.../threads/[id]/messages/route.ts`, `.../threads/[id]/lead/route.ts`, `src/app/api/hr/chat/quick-replies/route.ts`, `.../quick-replies/[id]/route.ts`, `src/app/api/hr/chat/cron/route.ts`, `.github/workflows/chat-cron.yml`

**Interfaces:** auth `requireHrUser(req)` rồi lọc `canSeeAudience(ctx.perms, …)`; không thấy → 404.
- `GET /api/hr/chat/threads?filter=needs|answered|closed&audience=all|client|candidate` → `{ threads: [{ id, audience, status, needsHuman, name, email, country, lastPage, lastMessage: {body,sender,createdAt}, lastMessageAt, leadId, sameEmailThreadIds: string[] }], counts: { needs: number } }` (limit 100, mới nhất trước; `counts.needs` dùng cho badge)
- `GET /api/hr/chat/threads/[id]` → `{ thread (đủ: pages, userAgent, firstPage…), messages (kèm staffName), applicationId: string|null (trùng email, chỉ khi `apps` trong scope qua `loadScopedApplication`) }`
- `PATCH /api/hr/chat/threads/[id]` body `{ action: "close"|"reopen"|"set_audience"|"merge"|"delete", audience?, intoId? }` — set_audience đổi nhãn (phải thấy cả audience mới); merge: luồng này `merged_into=intoId`, cả hai phải cùng email & thấy được; delete: xoá luồng + tin.
- `POST /api/hr/chat/threads/[id]/messages` body `{ body }` → `{ message }` (`addStaffReply`)
- `POST /api/hr/chat/threads/[id]/lead` → audience client & có email; tạo `leads` (`source:'chat'`, `service:'Chat inquiry'`, name, email, message = tin visitor kind text nối `\n\n`), set `lead_id`; đã có → 409
- Quick replies: GET (cần `chat.manage` hoặc 1 trong chat.*), POST/PATCH/DELETE cần `chat.manage`; validate `isSafeLink`, label ≤ 60, answer ≤ 1500.
- `GET /api/hr/chat/cron` header `x-hr-cron-key` (dùng lại `cronKeyMatches` — export nó từ hr-session) → `{ emailed, purged }`. Workflow `*/10 * * * *`.

- [ ] Steps: viết route → tsc → curl với cookie tài khoản Sếp tạm (theo memory hr-admin-ops-no-shared-key) → commit.

### Task 5: Widget trên website

**Files:** Create `src/components/chat-widget/ChatWidget.tsx` (client), `src/components/chat-widget/chat-launcher.tsx` (nút nhỏ, tải lười panel), `src/components/chat-widget/chat-api.ts` (fetch + localStorage `tdg_chat_token`, cookie dự phòng), Modify `src/app/layout.tsx` (render `<ChatLauncher />` cuối body), `src/app/privacy-policy/page.tsx` (đoạn "Website chat").

- Theo mockup A1–A3 (bỏ chữ AI): header "TD Games Support", trạng thái online "Usually replies in minutes" / offline "We're offline (8:00–22:00 Vietnam time) — leave your email and we'll reply by email".
- Launcher chỉ JS nhỏ; panel `dynamic(() => import("./ChatWidget"))` khi bấm hoặc khi có token sẵn (để hiện chấm đỏ tin mới: poll nhẹ 60s chỉ khi đã có token).
- Bong bóng chào sau 8s, 1 lần/7 ngày (`localStorage tdg_chat_greet_at`).
- Ẩn theo `usePathname()` + `body[data-deck]`/print CSS.
- Quick reply: bấm → POST, hiện câu trả lời + nút link (Link nội bộ hoặc `<a target=_blank rel=noopener>`).
- Gửi text: nếu 400 `email_required` → hiện form email (bắt buộc), gửi xong tự gửi lại tin. Trong giờ sau tin đầu hiện form tên+email tuỳ chọn (ẩn nếu đã có email).
- Mở với `?chat=<t>` → POST resume, xoá query.
- Poll 4s khi mở & tab visible, 20s khi ẩn.
- Mobile ≤ 640px: full màn; desktop 380×600.
- [ ] Steps: viết → tsc/lint → dev + Playwright 1280/390 (mở, quick reply, gửi tin, reload giữ lịch sử) → commit.

### Task 6: View "Chat" trong /hr

**Files:** Create `src/app/hr/_components/ChatView.tsx`, `src/app/hr/_components/ChatThread.tsx`, `src/app/hr/_components/QuickRepliesPanel.tsx`; Modify `src/app/hr/_components/HRDashboard.tsx` (View `"chat"`, nhãn "Chat", badge `counts.needs` poll 30s, hiện view khi user có 1 trong `chat.*`).
- Theo mockup B1/B2 (bỏ AI, bỏ "Tiếp nhận"): bộ lọc Cần người/Đã trả lời/Đã đóng + Tất cả/Khách/Ứng viên; dòng: tên/email hoặc "Visitor #"+4 ký tự cuối id, nhãn, tin cuối, thời gian VN, trang, cờ (emoji từ country), chấm.
- Mở luồng: tin nhắn (quick reply hiện "Khách bấm: …"), thông tin khách, nút Gửi/Đóng/Mở lại/Đổi nhãn/Tạo lead CRM (mờ khi chưa email)/Gộp (khi `sameEmailThreadIds`)/Xoá (confirm)/Mở hồ sơ. Poll 4s khi mở.
- Mobile-first (390px) đúng styleguide /hr hiện có (dùng lại class/tokens trong HRDashboard).
- QuickRepliesPanel (chỉ `chat.manage`): list, thêm/sửa/xoá/lên-xuống, bật/tắt.
- [ ] Steps: viết → tsc/lint → dev + Playwright tài khoản Sếp tạm → commit.

### Task 7: Bộ câu hỏi mẫu + bật

- Seed `chat_quick_replies` (execute_sql INSERT) 5 câu: "Our services & pricing" (client), "Get a free quote" (client, link /contact? — dùng đường dẫn form quote thật trên site), "Timeline & process" (client), "Jobs & how to apply" (candidate, link /careers), "Talk to a person" KHÔNG phải quick reply — là nút cố định của widget. Nội dung lấy từ site.json/services hiện có, không bịa số giá cụ thể ("pricing depends on scope — get a free quote").
- [ ] Commit (nếu có file seed) .

### Task 8: E2E + deploy

- [ ] Dev local (DB prod, `HR_EMAIL_MODE` local = test): khách mở chat → quick reply → text (push thử nếu VAPID local có) → app Sếp tạm thấy "Cần người" → trả lời → widget thấy → set `last_visitor_seen_at` cũ → cron → mail test về tony@. Kiểm Review Focus 1, 2, 4. Xoá dữ liệu test + tài khoản tạm.
- [ ] `npx tsc --noEmit`, lint các file mới, `node --test src/lib/chat*.test.ts`.
- [ ] Cập nhật LOG/TASKS/SCHEMA/API.md, merge main, push, theo dõi deploy, smoke prod (`GET /api/chat` 200, widget hiện trên /, không hiện /hr).
