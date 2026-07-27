# RECENT — 5 sessions gần nhất

_Auto-generated từ LOG.md. Không sửa tay._

---

## 2026-07-27 (session — USP & CTA audit)
### Task
Rà soát USP + CTA toàn site, đề xuất và áp dụng nhóm ưu tiên 1–2.

### Work Done
- Audit: hero → services → why-us → careers → contact → header/footer
- **P1** `home-services-section.tsx`: paragraph dưới "OUR SERVICES" là ghi chú
  thiết kế nội bộ đang chạy production → thay bằng copy thật (Spine / frame-by-frame /
  Unity-ready)
- **P2** `home-hero.tsx`: bỏ định vị "3D" (studio là 2D-only, không có trang 3D nào)
  → title "2D ART & ANIMATION / OUTSOURCING STUDIO"; desc bỏ "specifically for mobile
  games" → "mobile, PC and web titles"
- **P2** Hero CTA: "Get in touch" → "Get a Free Quote" + thêm secondary "View Our Work"
  → /portfolio + micro-copy "Reply within 24h · NDA on request"
- `site-header.tsx`: đồng bộ 5 nhãn "Get a Quote" → "Get a Free Quote"
- `npx tsc --noEmit` clean

### Result
Định vị nhất quán 2D, hết text nội bộ lộ ra ngoài, CTA có 1 nhãn primary chuẩn +
đường thoát low-commitment cho lead chưa sẵn sàng.

### P3 (làm tiếp cùng session)
- `home-page-lower.tsx` WHY CHOOSE: 2 item generic → differentiator thật
  - "REASONABLE PRICES" → **PAID TRIAL BATCH** (căn cứ: blog site.json:184,197)
  - "STREAMLINED WORKFLOW" → **ENGINE-READY DELIVERY** (căn cứ: services/2d-vfx
    "Unity & Spine Integration", services/2d-animation "Spine Animation")
- Careers band: bỏ nút "Contact us" cạnh "View vacancies" (lẫn audience)
- LET'S TALK: bỏ nút "Contact" trùng (2 nút cùng trỏ /contact) + "Get a quote"
  → "Get a Free Quote"
- `site-footer.tsx`: bỏ "Developer" / "Game Design" (lệch định vị 2D art),
  giữ "Game UI" → /contact (có comment `ponytail:` giải thích)
- `npx tsc --noEmit` clean

### Số liệu — sếp chốt "ít thôi, đúng tầm công ty mới"
- `site.json` service cards: 50+/50+/50+ → **Animation 30+ · Art 25+ · VFX 15+** (tổng 70)
- Stats band `home-page-lower.tsx`: 150+ → **70+** PROJECTS · 50+ → **12+** CLIENTS ·
  3700+ → **1200+** ASSETS (khớp tổng service cards; 16 case study trên portfolio
  = phần hiển thị của 70)
- Bonus: `CountUp` đang là if-chain hardcode `=== "150+"` → `parseInt(stat.value, 10)`,
  đổi số không còn phải sửa 2 chỗ
- Giữ nguyên `service-2d-art-featured-showcase.tsx` (45+ environments, 200+ assets —
  nằm gọn trong 1200+)
- `npx tsc --noEmit` clean

### Deploy
- Commit `67dc61f` → push main (pre-push typecheck pass)
- VPS: `git pull` → `npm run build` → `pm2 restart tdgames-landingpage` (restart #87, online)
- Verify prod: `curl -sL https://www.tdgamestudio.com` → "Get a Free Quote" ×2,
  "View Our Work" ×1, "2D ART &amp; ANIMATION" ✅
  (WHY CHOOSE / stats không có trong HTML đầu — section dưới không SSR, verify bằng mắt)
- Lưu ý: build local phải `dangerouslyDisableSandbox` vì next/font fetch Google Fonts

### P4 hoá ra là TASK MA — `site.json → blog.posts` là dead data
- Định làm "viết lại 6/12 bài blog về 3D", đã viết xong 5 bài mới vào `site.json`…
  rồi mới phát hiện `blog.posts` **không được render ở đâu cả**.
- Blog thật đọc từ Supabase `blog_posts` qua `GET /api/blog` (`src/app/blog/page.tsx`
  fetch client-side). Production đang có **8 bài, tất cả đúng định vị 2D**
  (`why-2d-animation-still-rules-game-art`, `from-sketch-to-sprite-our-2d-art-pipeline`,
  `frame-by-frame-principles-of-game-animation`, `vfx-on-a-budget…`, …) — không bài 3D nào.
- → Revert 5 bài vừa viết, **xoá hẳn key `blog` khỏi `site.json`** (184 dòng dead data)
  + xoá `BlogPost` khỏi `src/types/site-content.ts`. Chính nó là thứ khiến audit tin
  nhầm là blog còn placeholder/3D.
- **Sitemap**: phát hiện blog detail pages chưa từng có trong sitemap → thêm, đọc
  `blog_posts` từ Supabase (try/catch, DB lỗi thì bỏ blog routes chứ không fail cả
  sitemap). `sitemap()` chuyển thành async. Build ra 34 URL (10 static + 16 portfolio
  + 8 blog).
- Sửa `CLAUDE.md`: dòng "site.json là nguồn `blog.posts[]`" đã sai từ lâu → ghi rõ
  blog nằm ở Supabase.

### Deploy đợt 2
- Commit `0a8bf76` → push → VPS pull + build + `pm2 restart` (restart #89)
- Verify: `curl https://tdgamestudio.com/sitemap.xml` → 34 `<url>`, có đủ 8 blog route ✅
- Canonical domain là **non-www** (`www.` 301 → `tdgamestudio.com`). Docs đang ghi
  `https://www.tdgamestudio.com` → sửa lại non-www ở CLAUDE.md ×2 + PROJECT.md
  (curl vào www trả 301 làm verify hụt 2 lần trong session này)

### Bài học
- CLAUDE.md stale dẫn tới cả một task ma. Trước khi "sửa nội dung", verify xem
  file đó có thực sự được render không (`grep` chỗ dùng, hoặc curl API production).

---

## 2026-07-09 (session — HR AI Evaluation)
### Task
Feature 2: AI evaluation ứng viên qua cliproxyapi (OpenAI-compatible, port 8317 trên Mac).

### Work Done
- Migration `add_ai_evaluation_to_applications`: `ai_score` int + `ai_evaluation` jsonb
- Route mới `POST /api/hr/applications/[id]/evaluate`: requireHR → fetch app + JD →
  gọi `${AI_BASE_URL}/chat/completions` (env: AI_BASE_URL/AI_API_KEY/AI_MODEL,
  default gpt-5.4-mini) → parse JSON `{score, verdict, strengths, concerns}` → lưu DB
- `types.ts`: type `AiEvaluation` + 2 field trên `Application`
- `HRDashboard.tsx`: badge `🤖 {score}` trên AppCard (xanh ≥75 / vàng ≥50 / đỏ);
  panel AI Evaluation trong CandidateModal (nút Evaluate/Re-evaluate, verdict,
  strengths/concerns); prop `onPatch` để sync state
- `.env.local`: thêm AI_BASE_URL=http://localhost:8317/v1, AI_API_KEY, AI_MODEL

### Result
- `tsc --noEmit` pass ✅
- Test end-to-end pass ✅: POST evaluate trên ứng viên thật → score 78, verdict "yes",
  strengths/concerns tiếng Việt hợp lý, lưu DB đúng (~vài giây với gpt-5.4-mini)

### Nâng cấp: đọc CV PDF
- `extractCvText()` trong evaluate route: fetch CV từ CDN → extract text bằng `unpdf`
  (dep mới, serverless-friendly) → nhét `cv_text` (cap 12k chars) vào prompt.
  PDF only; fail thì fallback chấm theo form data. Thêm `today` vào prompt
  (trước đó AI phán sai "ngày available khá xa"). Verified: score 72→82 sau khi đọc CV thật.

### Hardening CV pipeline
- Guard content-length > 20MB → skip tải CV
- CV không đọc được (thuần ảnh / quá nặng / không phải PDF) → tự động chèn concern
  "⚠️ Không đọc được nội dung CV..." vào đầu list để HR biết điểm chỉ dựa trên form data

### Bugfix kèm theo
- Không chuyển được status "test": enum `application_status` trong DB thiếu giá trị
  (UI/types có từ session trước nhưng chưa migrate). Migration
  `add_test_to_application_status`: `alter type ... add value 'test' before 'interview'`.
  Verified: PATCH status=test → 200 ✅

### Deploy production
- Đã thêm AI_BASE_URL/AI_API_KEY/AI_MODEL vào `/opt/tdgames-landingpage/.env.local`
  trên VPS + pm2 restart. VPS reach cliproxyapi trên Mac qua Tailscale OK (200).
  Verified evaluate trên https://www.tdgamestudio.com → 200 ✅
- Lưu ý vận hành: Mac tắt/ngủ → nút Evaluate trên prod báo lỗi 502, HR bấm lại sau

---

## 2026-07-09 (session — HR Candidate Modal)
### Task
Feature 1 của cặp feature HR: Candidate Modal kiểu ClickUp — click tên ứng viên
mở popup lớn, info bên trái + comments bên phải. (Feature 2 — AI evaluation —
đã design, chưa làm.)

### Work Done
Tất cả trong `src/app/hr/_components/HRDashboard.tsx`:
- `CandidateModal` mới: overlay z-50, max-w-4xl h-[88vh], header (tên/job/status/
  timeAgo/✕), grid `md:grid-cols-[1fr_340px]` — trái: action buttons (move/reject/
  reopen/delete) + `AppDetail comments={false}` + note editor; phải: `CommentThread`.
  Đóng bằng Esc / click overlay. RejectModal render trong container stopPropagation.
- `AppDetail`: thêm prop `comments?: boolean` (default true — DataView giữ nguyên behavior)
- `CommentThread`: thêm prop `listMaxH` (default "max-h-60", modal dùng "max-h-[52vh]")
- `AppCard`: tên ứng viên → button mở modal (hover amber); bỏ nút `▼ Detail` +
  state `showDetail` + inline AppDetail; `saveNote(newNote)` nhận param để modal tái dùng

### Result
- `npx tsc --noEmit` pass; lint errors trong file là pre-existing (không phải code mới)
- Chưa test UI trên dev server

### Next Step
- Feature 2 — AI Evaluation (design đã chốt): `POST /api/hr/applications/[id]/evaluate`
  gọi Claude API, input = form data + JD, output `{score, verdict, strengths, concerns}`,
  lưu `ai_score` + `ai_evaluation` (jsonb) trên `applications`, badge trên card + panel trong modal

---

## 2026-07-07 (session — HR dashboard fixes)
### Task
2 fix nhỏ trên `/hr`: (1) cột Rejected bị rớt xuống hàng dưới trong Pipeline view,
(2) Discord notify khi comment ứng viên thiếu tag `@everyone`

### Work Done
- `HRDashboard.tsx` (`PipelineView`): grid `xl:grid-cols-5` → `xl:grid-cols-6`
  (6 status: new/reviewing/test/interview/offer/rejected, 5 cột làm cột thứ 6 rớt hàng)
- `hr-notify.ts` (`notifyNewComment`): thêm `@everyone` vào content, đồng nhất với
  `notifyApplicationUpdate` (status change / note đã có sẵn tag này)

### Result
- Pipeline hiển thị đủ 6 cột trên 1 hàng ở màn hình ≥1280px
- Comment mới trên ứng viên giờ tag @everyone trên Discord giống status/note update

### Next Step
- Không có, 2 fix độc lập, không tồn đọng

## 2026-07-06 (session — pre-push type-check gate)
### Task
Triển khai gợi ý từ session hotfix trước: thêm gate chặn commit lỗi type lên main

### Work Done
- `package.json`: thêm script `typecheck` = `tsc --noEmit`
- `.githooks/pre-push`: chạy `npm run typecheck`, block push nếu fail (bypass: `--no-verify`)
- Bật bằng `git config core.hooksPath .githooks` (local, xem DECISIONS.md để biết cách bật lại
  nếu clone máy mới)
- Verify: `npm run typecheck` chạy sạch trên code hiện tại

### Result
- Từ giờ `git push` sẽ tự chặn nếu có lỗi TypeScript, tránh lặp lại lỗi 500 ngày 2026-07-06
- Phát hiện thêm khi verify deploy: `.github/workflows/deploy.yml` đã auto-deploy on push, nhưng
  2 lần chạy gần nhất (`0a6cb1c`, `d23ecd3`) đều FAIL với lỗi
  `⨯ Another next build process is already running` — do build tay qua SSH (session hotfix
  trước) để lại lock file dở dang, nghẽn build tiếp theo của workflow
- Đã push lại (`72a93a6`) không SSH build tay lần này → `gh run watch` xác nhận deploy
  **success**, VPS git HEAD = `72a93a6`, pm2 restart 53, uptime fresh, site 200 OK

### Next Step
- Không SSH build tay trên VPS nữa — xem DECISIONS.md, chỉ push và để workflow tự deploy

## 2026-07-06 (session — production 500 hotfix)
### Task
Landing page báo lỗi 500 khi load CSS/JS chunks (screenshot Console DevTools từ sếp)

### Work Done
- Root cause: commit `d23ecd3` (add "test" stage) thêm `"test"` vào type `ApplicationStatus` nhưng
  không update `STATUS_COLORS`/`APPLICATION_STATUSES` trong `src/app/admin/_components/CareersTab.tsx`
  → `npm run build` fail ở bước type-check
- Turbopack ghi đè `.next/static` (chunks mới) TRƯỚC khi type-check chạy, nên build fail giữa chừng
  để lại `.next` ở trạng thái nửa vời: HTML/manifest cũ trỏ tới chunk đã bị xoá/ghi đè → 500 ngẫu nhiên
  trên các file `_next/static/chunks/*.css`/`.js` (pm2 restart count 51 trong 6h là dấu hiệu)
- Fix: thêm key `test` vào `STATUS_COLORS` và `APPLICATION_STATUSES` trong `CareersTab.tsx`
  (HRDashboard.tsx đã có sẵn, chỉ thiếu ở admin CareersTab)
- Commit `0a6cb1c`, push, `git pull && npm run build` (pass) → `pm2 restart` trên VPS
- Verify: tất cả CSS chunk trên homepage trả 200

### Result
- Production https://www.tdgamestudio.com hết lỗi 500

### Next Step
- Cân nhắc thêm CI type-check (`npm run build` hoặc `tsc --noEmit`) chạy trước khi cho phép merge/deploy,
  để tránh lặp lại kiểu lỗi "build fail giữa chừng làm hỏng .next đang chạy"

## 2026-06-27 (session — HR Comments feature)
### Task
Add comment thread on applications in HR Dashboard with Discord notifications

### Work Done
- DB: `application_comments` table already created (uuid PK, application_id FK, author_name, content, created_at)
- Type: `ApplicationComment` added to `src/app/admin/_lib/types.ts`
- API: `GET/POST /api/hr/applications/[id]/comments/route.ts` — list & create, `x-hr-key` auth
- Discord: `notifyNewComment()` in `hr-notify.ts` — purple embed, fire-and-forget
- UI: `CommentThread` component in `HRDashboard.tsx` — inline chat, author name persisted via localStorage
- Integration: `AppDetail` renders `<CommentThread>` in both Pipeline view and Data view
- `npm run build` pass ✅
- Commit `27e8ea7`, pushed & deployed to VPS ✅

### Result
- HR team can leave comments on any application, visible to all HR users
- Each comment triggers a purple Discord notification with applicant name, author, position, content
- Production live at https://www.tdgamestudio.com/hr

### Next Step
- Update memory files (SCHEMA.md, API.md) with new table/endpoint

## 2026-06-25 (session 2 — Discord HR notifications)
### Task
Add Discord webhook notifications when application status changes or admin notes updated

### Work Done
- Created `src/lib/hr-notify.ts` — shared helper `notifyApplicationUpdate()` for Discord embeds
- Updated `src/app/api/hr/applications/[id]/route.ts` — snapshots old app, fire-and-forget notification
- Updated `src/app/api/admin/applications/[id]/route.ts` — same pattern, uses shared helper
- Notification types:
  - 📋 Status change (blue embed) with old → new status
  - 🎉 Offer (green embed)
  - ❌ Rejection (red embed) with reason
  - 💬 Note updated (amber embed) with note content (truncated 500 chars)
- `npm run build` pass ✅

### Result
- Both HR and Admin PATCH routes now send Discord notifications on status/note changes
- Fire-and-forget pattern — no impact on API response time

### Next Step
- Commit & push, deploy VPS

## 2026-06-25 (session — Rejection Reason feature)
### Task
Complete Rejection Reason feature — DB migration, KPI stats UI

### Work Done
- DB migration: `ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT` (Supabase MCP)
- KPIView: added Rejection Reasons Breakdown section — bar chart with % per reason, coverage stat (X/Y rejected with reason)
- Verified: RejectModal, AppCard reject flow, QuickAction reject modal, AppDetail display, API PATCH — all already implemented from prior session
- `npm run build` pass ✅

### Result
- Full Rejection Reason feature complete: DB → Type → API → Modal UI → KPI stats
- HR Dashboard `/hr` KPI tab now shows rejection reason breakdown with visual bars

### Next Step
- Commit & push
- Deploy VPS: `git pull && npm run build && pm2 restart tdgames-landingpage`

## 2026-06-09 (session — HR Dashboard)
### Task
Build standalone HR dashboard tại /hr — pipeline, KPI, Discord reminders

### Work Done
- `src/app/hr/page.tsx` — server page, force-dynamic
- `src/app/hr/_components/HRDashboard.tsx` — client app với password gate (HR_SECRET)
  - Pipeline view: 5-column kanban, AppCard với status transition buttons + inline notes
  - KPI view: bảng per-referrer (total, by stage, offer rate %)
  - Header: view toggle (Pipeline / KPI) + manual Remind button + Refresh
- `src/app/api/hr/applications/route.ts` — GET all apps (x-hr-key auth)
- `src/app/api/hr/applications/[id]/route.ts` — PATCH status/notes
- `src/app/api/hr/remind/route.ts` — quét stale: new>2d, reviewing>7d, interview>14d → Discord embed @everyone
- `.github/workflows/hr-remind.yml` — cron 9h sáng UTC+7 Mon-Fri, gọi /api/hr/remind
- Fix TypeScript: Supabase trả `jobs` dạng array, fix formatApp type + KPI row type
- `npm run build` pass ✅, commit `9568846`, push ✅

### Result
- `/hr` live — truy cập bằng HR_SECRET
- Pipeline board + KPI table hoạt động
- Auto remind Discord mỗi ngày nếu có ứng viên bị stuck

### Next Step
- Thêm `HR_SECRET` vào GitHub Secrets (Settings → Secrets → Actions → New: `HR_SECRET`)
- Thêm `HR_SECRET` vào `.env.local` trên VPS rồi restart
- Deploy: git pull && npm run build && pm2 restart tdgames-landingpage

## 2026-06-09 (session — referral tracking)
### Task
Implement referral tracking via ?ref= param để tính KPI cho HR team

### Work Done
- DB migration: thêm `referred_by TEXT` vào `applications` table (Supabase)
- `Application` type: thêm `referred_by: string | null`
- `apply/_client.tsx`: đọc `?ref=` bằng `useSearchParams`, gửi `referred_by` trong POST body
- `apply/page.tsx`: bọc trong `<Suspense>` (bắt buộc khi dùng `useSearchParams`)
- `api/applications/route.ts`: Telegram + Discord notification đều hiện "Referred by"
- `CareersTab.tsx`: hiện amber badge "via <name>" trên mỗi đơn apply trong Admin
- `npm run build` pass ✅, commit `11fec9b`, push ✅

### Result
- HR share link: `/apply/<slug>?ref=nam` → đơn apply tự tag `referred_by = "nam"`
- Admin thấy ngay ai refer trong danh sách Applications
- Discord/Telegram noti cũng hiện trường Referred by

### Next Step
- Deploy VPS: `git pull && npm run build && pm2 restart tdgames-landingpage`
- Không còn task nào

## 2026-06-09 (session — fix Bulk Replace)
### Task
Debug và fix lỗi "replace-media-urls command failed" trong Admin Bulk Replace tab

### Root Cause
Script `replace-media-urls.mjs` được spawn như child process và cần fetch URL mapping qua HTTP (`http://localhost:{PORT}/api/admin/media/mapping`). Trên VPS, self-HTTP call này bị fail do: PATH/NVM không resolve được `node` binary, hoặc port sai.

### Work Done
- `replace-run/route.ts`:
  - Thêm `getSupabaseAdmin` import
  - Query Supabase trực tiếp lấy `media_assets` mapping (bỏ self-HTTP call)
  - Inject mapping dưới dạng `MAPPING_JSON` env var vào child process
  - Đổi `"node"` → `process.execPath` (dùng chính xác binary đang chạy server)
- `scripts/replace-media-urls.mjs`:
  - Đọc `MAPPING_JSON` nếu có (từ route), bỏ qua HTTP fetch
  - Giữ HTTP fallback cho khi chạy script trực tiếp từ CLI
- `npm run build` pass ✅
- Commit `6f309ca`, push origin/main ✅

### Result
- Bulk Replace không còn phụ thuộc self-HTTP call
- Node binary được resolve chính xác dù VPS dùng NVM

### Next Step
- Không còn task nào trong To do
- Cân nhắc: noindex meta cho `/apply/[slug]` để tránh Google index URL apply form

## 2026-06-09 (session — /apply/[slug] page + CV upload)
### Task
Hoàn thiện feature: dedicated apply page với CV upload (tiếp tục session bị ngắt)

### Work Done
- Tạo `src/app/apply/[slug]/page.tsx` — server wrapper, fetch job by slug, 404 nếu inactive
- Tạo `src/app/apply/[slug]/_client.tsx` — full apply form: personal info, CV upload (R2), portfolio/LinkedIn, compensation fields, success screen
- Tạo `src/app/api/applications/upload-cv/route.ts` — validate MIME (PDF/DOC/DOCX), max 10 MB, upload to R2 `applications/cv/YYYY/MM/<uuid>-<name>`
- `careers-client.tsx`: wire up `useRouter`, "Apply Now" → `router.push('/apply/${role.slug}')`, remove dead inline `ApplyForm` component
- `npm run build` pass ✅
- Commit `25e0792`, push origin/main ✅

### Result
- `/apply/[slug]` live as dynamic route
- Candidates get full-page apply experience with CV attachment
- Careers panel stays as job detail view only — clean separation

### Next Step
- Remaining open task: debug Bulk Replace "replace-media-urls command failed"
- Consider: `/apply/[slug]` sitemap exclusion (noindex meta tag) — don't want job apps indexed

## 2026-05-28 (session — Task cleanup)
### Task
Cập nhật trạng thái các task đã hoàn thành

### Work Done
- Xác nhận với user: 5 task "To do" đã xong từ trước
- Update TASKS.md: dời About hero, Team, About workspace, Footer social links, Spine premultipliedAlpha → Done
- Update TASKS.md: Task 7 Runtime Media URL Resolution → Done
- Update TASKS.md: Nginx + SSL + Cache → Done

### Result
- To do còn đúng 1 task: **Bulk Replace** debug
- Tất cả task nội dung, vận hành đã xong ✅

### Next Step
- Debug Bulk Replace: chạy Dry run trên Admin → xem stderr/stdout

## 2026-05-28 (session — Nginx + SSL fix)
### Task
Fix nginx config trên VPS: Cache-Control headers, Cloudflare real IP, 526 SSL error

### Work Done
- Phát hiện nginx config thiếu Cache-Control headers và không restore real IP từ Cloudflare
- Session trước: thêm `set_real_ip_from` (15 Cloudflare IP ranges) + `real_ip_header CF-Connecting-IP`
- Session trước: thêm Cache-Control headers theo location block (`/_next/static/` immutable, `/api|admin/` no-store, `/` s-maxage=60)
- Phát hiện `https://tdgamestudio.com/` trả về HTTP 526 — Cloudflare "Full Strict" không trust self-signed cert
- Root cause: cert cũ chỉ có `CN=www.tdgamestudio.com`, không có SAN cho apex `tdgamestudio.com`
- Thử generate self-signed cert mới với SAN nhưng vẫn 526 (CF đang Full Strict, cần CA trust)
- Dùng `certbot certonly --nginx -d tdgamestudio.com -d www.tdgamestudio.com` → Let's Encrypt cert thành công (expires 2026-08-26)
- Rewrite nginx config: tách thành 3 server blocks (HTTP redirect, www redirect, main HTTPS)
- Dùng cert mới `/etc/letsencrypt/live/tdgamestudio.com/fullchain.pem`
- `nginx -t && systemctl reload nginx` → OK

### Result
- `https://tdgamestudio.com/` → HTTP 200 ✅ (từ 526)
- `https://www.tdgamestudio.com/` → 301 → apex ✅
- Cache-Control: `public, max-age=30, s-maxage=60` đang hoạt động ✅
- Let's Encrypt cert auto-renew đã được certbot cấu hình

### Next Step
- Certbot auto-renew cần kiểm tra: `certbot renew --dry-run` để verify cron job OK
- Xem xét thêm `billing.tdgamestudio.com` vào cert (hiện là domain riêng)
- Tiếp tục các task còn lại: Bulk Replace debug, Team placeholder, Footer links

## 2026-05-27 (session — Page Slots plan Tasks 7–12)
### Task
Hoàn thành plan Page Slots: tasks 7–12 (services pages, careers split, hero carousel, admin UI)

### Work Done
- Task 7: 3 services pages (2d-art, 2d-animation, 2d-vfx) → `resolveSlot` + `force-dynamic` (commit 2439e53)
- Task 8: `careers/page.tsx` → Server wrapper + `careers-client.tsx` Client split (commit c7c85ae)
- Task 9: `hero-layout-state.tsx` `useMediaListListener` → fetch `/api/page-slots?page=home&slot=hero-carousel` on mount, fallback site.json (commit f7f224b)
- Task 10: Tạo `src/app/admin/_components/PageSlotsTab.tsx` — CRUD UI, preview, reorder ↑↓ (commit 9ff8eed)
- Task 11: `AdminTab` type + import + register "11. Page Slots" trong admin/page.tsx (commit a88970e)
- Task 12: `npm run build` pass ✅, push origin/main ✅

### Result
- Page Slots plan hoàn chỉnh 12/12 tasks ✅
- Admin tab "11. Page Slots" sẵn sàng để swap hero media cho 6 trang không cần rebuild
- Home hero carousel, About, Careers, 3 Services pages đều đọc từ `page_slots` DB

## 2026-05-27 (session — Runtime Media URL Resolution, Task 6)
### Task
Implement Task 6: inline label editor trên Media Library asset cards

### Work Done
- `MediaTab.tsx`: thêm import `patchMediaAsset` từ `../_lib/api`
- Thêm state: `editingLabelId` + `labelDraft`
- Thêm handler: `handleSaveLabel(assetId)` → gọi `patchMediaAsset` → update local state
- Thêm UI label trên mỗi asset card: click "+ label" → input inline → Enter/blur để save
- Label amber nếu đã set (`🏷 about-hero`), trắng mờ nếu chưa (+ label)
- `npm run build` pass ✅ (sandbox disable để fetch Google Fonts)
- Commit `893ed6f`, push origin/main ✅

### Result
- Tasks 1–6 của plan Runtime Media URL Resolution đều done
- Task 7 còn lại: user vào Admin → Media Library → tìm asset hero About → bấm "+ label" → gõ `about-hero` → Enter → verify https://www.tdgamestudio.com/about

### Next Step
- User thực hiện Task 7 (thủ công trong Admin)
- Deploy VPS sẽ chạy tự động qua GitHub Actions

## 2026-05-27 (session — Admin Media Library improvements)
### Task
Fix Media Library page filter, Scan Usage feature, BulkTab error details

### Work Done
- `about/page.tsx`: hero section auto-detect mp4/webm/mov → render `<video>` thay `<Image>`
- `MediaTab.tsx`: thêm filter "Page" dropdown (lọc media theo page đang dùng)
- Fix page filter: match strings sai (URL path) → đổi sang file path prefix (`src/app/about/` v.v.)
- `POST /api/admin/media/scan-usage`: route mới quét toàn bộ source files, update `used_by[]` song song cho 431 assets
- `MediaTab.tsx`: thêm nút "Scan Usage" (amber) + feedback message
- Perf fix: đổi 431 sequential PATCH → Promise.all song song (giảm từ ~60s → ~2s)
- `BulkTab.tsx`: fix hiển thị stderr/stdout khi bulk replace fail (trước chỉ show generic error)

### Result
- Filter theo Page hoạt động đúng sau khi bấm Scan Usage
- Scan Usage: DB đã update used_by cho ~431 assets ✅
- Bulk Replace vẫn đang lỗi "replace-media-urls command failed" — nguyên nhân chưa rõ, đã fix UI để show stderr/stdout để debug lần sau
- about.heroImage vẫn là PNG trong site.json (chưa bulk replace được)

### Next Step
- Chạy Dry run trên admin → xem stderr/stdout chi tiết → fix bulk replace
- Sau khi bulk replace OK → about heroImage sẽ tự update thành video URL
- Xem xét thêm site.json vào page filter (hiện các asset trong site.json không bị catch bởi page filter)

## 2026-05-26 (session — Butler fix + itch.io publish working)
### Task
Fix publish-itch route: switch từ itch.io direct API sang Butler CLI, xử lý auth đúng

### Work Done
- Xác nhận Butler v15.27.0 đã có trên VPS (`/usr/local/bin/butler`)
- Xác nhận `ITCHIO_API_KEY` load được từ `.env.local` (Next.js tự load tại runtime)
- Phát hiện code cũ (commit 4da30f6) dùng `fflate` + itch.io REST upload API → lỗi "invalid api endpoint"
- Commit `c1f3d65`: replace fflate/direct-API bằng `butler push` CLI
- Phát hiện butler v15+ bỏ flag `--api-key` → dùng env var `BUTLER_API_KEY` thay thế
- Commit `e5f85dd`: switch sang `BUTLER_API_KEY` env var
- Improve error capture: `err.stderr` + check stderr pattern khi exit 0 nhưng có lỗi
- Commit `ef42154`: better stderr capture
- Fix git ref lock trên VPS: `git remote prune origin && git fetch && git reset --hard origin/main`
- User verify itch.io email → publish thành công

### Result
- Wolf_Aquatic publish lên `tdgamesvn/tdgames-spine-character:html5` ✅
- `itchio_embed_url = https://itch.io/embed/4614158` đã lưu vào DB ✅
- Embed URL sẵn sàng paste vào Behance iframe

### Next Step
- ⚠️ Regenerate `ITCHIO_API_KEY` trên itch.io (key cũ đã lộ trong chat nhiều lần)
- Test embed URL thật trên Behance: `<iframe src="https://itch.io/embed/4614158" ...>`
- Publish Devil_Lord (careers-hero): cần set `itchio_game_id` trong Admin → Spine → Edit

## 2026-05-26 (session — Itch.io auto-publish)
### Task
Auto-publish Spine characters lên itch.io từ admin panel (phương án B) để embed vào Behance

### Work Done
- Install `fflate` (ZIP library)
- DB migration: thêm `itchio_game_id TEXT` + `itchio_embed_url TEXT` vào `spine_characters`
- Tạo `POST /api/admin/spine/[id]/publish-itch/route.ts`:
  - Xác thực admin key + ITCHIO_API_KEY env
  - Fetch character từ DB, validate itchio_game_id
  - Generate standalone HTML (Spine runtime từ unpkg CDN, animation loop)
  - Tạo ZIP với fflate, upload lên itch.io API (`/game/{id}/upload`)
  - Lưu `itchio_embed_url` về DB
- Update PATCH API: thêm `itchio_game_id` + `itchio_embed_url` vào PATCHABLE
- Update `types.ts`: thêm 2 fields mới vào `SpineCharacter`
- Update `api.ts`: thêm `publishToItch()` client helper
- Update `SpineTab.tsx`:
  - FormState + BLANK + openEdit: thêm `itchio_game_id`
  - Thêm `handlePublishItch()` async handler
  - Edit modal: section "Itch.io Game ID" với hướng dẫn
  - Character list row: nút 🎮 Publish Itch.io + status message + Copy URL
- Commit: `4da30f6 feat(spine): auto-publish to itch.io from admin panel`

### Result
- Admin → Spine → Edit character → nhập Game ID → Lưu → Publish → URL tự lưu vào DB
- Workflow cho Behance: Publish → copy URL từ admin → paste vào Behance embed
- Không cần switch platform sau khi setup game ID 1 lần

### Next Step
- Thêm `ITCHIO_API_KEY` vào VPS environment (deploy sẽ cần)
- User tạo itch.io account + game → nhập Game ID → test Publish
- Regenerate itch.io API key (key cũ đã lộ trong chat)

## 2026-05-26 (session — Spine Demo embed + bug fix)
### Task
Build `/spine-demo/[slug]` embed page + Embed URL Builder trong admin SpineTab

### Work Done
- Tạo `src/app/spine-demo/layout.tsx` — bare layout cho iframe embed
- Tạo `src/app/spine-demo/[slug]/page.tsx` — server component: fetch character từ DB theo slug, đọc URL params (bg, c, img, scale, x, y)
- Tạo `src/app/spine-demo/[slug]/_client.tsx` — client render SpineCharacter + background layer
- Cập nhật `SpineTab.tsx` — thêm section "Embed URL Builder": chọn character, chọn bg (transparent/color/image), override scale/offset, generate URL + copy + preview + iframe code
- Fix bug: `spine-demo/layout.tsx` có `<html><body>` sai — nested layout không được có root HTML tags → đổi thành `<>{children}</>`
- Commit: `26d8eeb feat(spine): add /spine-demo embed page + admin Embed URL Builder`

### Result
- `/spine-demo/<slug>?bg=color&c=141414&scale=1.2` hoạt động như embed page
- Admin tab Spine → Embed URL Builder: generate URL + iframe code sẵn paste vào Behance
- layout.tsx bug fixed, build sẽ pass

### Next Step
- Test thực tế: upload Spine file thật → dùng Embed Builder tạo URL → nhúng vào Behance iframe
- Quyết định feature tiếp theo (hỏi user)

## 2026-05-25 (session — audit Spine Animation & Skin Picker spec)
### Task
Kiểm tra xem spec `docs/superpowers/specs/2026-05-25-spine-animation-skin-picker-design.md` đã được implement chưa

### Work Done
- Đọc spec + kiểm tra từng file liên quan
- Xác nhận: toàn bộ spec đã được implement đầy đủ trong các session trước
- DB: `animations JSONB` column tồn tại trong `spine_characters` (default `'["idle"]'`)
- Code: `types.ts`, `spine-character.tsx`, API routes, `SpineTab.tsx`, `home-page-lower.tsx` đều dùng `animations`
- Cập nhật TASKS.md: thêm task vào Done

### Result
- Không cần làm thêm gì — feature đã complete
- Spec chỉ thiếu entry trong TASKS.md

### Next Step
- Verify trên browser: upload file Spine JSON thật → kiểm tra skin dropdown + animation picker hoạt động
- Test premultipliedAlpha toggle nếu còn viền đen

## 2026-05-25 (session — migrate team + footer to Supabase)
### Task
Migrate `team[]` và `footer` từ `site.json` (git-tracked) sang Supabase để tránh bị reset mỗi lần deploy

### Work Done
- Supabase migration: tạo `team_members` + `site_config` tables, seed data từ site.json
- Tạo `GET /api/team` public endpoint từ Supabase
- Sửa `GET/PUT /api/admin/team` dùng Supabase thay fs
- Sửa `GET/PUT /api/admin/footer` dùng Supabase thay fs
- Sửa `GET /api/footer` public dùng Supabase thay fs
- Sửa `about/page.tsx` `getTeam()` dùng Supabase thay fs.readFile
- Cleanup: xoá `team[]` + `footer` khỏi `site.json`
- Push all commits lên GitHub (auto-deploy)

### Result
- Team và Footer data không còn bị reset khi deploy
- Admin UI → tab Team/Footer: save là persistent, không bị mất
- Build pass, 5 commits đã push

### Next Step
- Verify production sau khi deploy xong: https://www.tdgamestudio.com

## 2026-05-25 (session — Spine visual controls)
### Task
Thêm admin controls cho SpineCharacter: scale, offsetX/Y, premultipliedAlpha — fix viền đen

### Work Done
- DB migration: thêm 4 cột vào `spine_characters` (`scale`, `offset_x`, `offset_y`, `premultiplied_alpha`)
- `/api/spine/route.ts`: cập nhật SELECT include 4 cột mới
- `/api/admin/spine/[id]/route.ts`: thêm 4 fields vào `PATCHABLE`
- `/api/admin/spine/route.ts`: thêm 4 fields vào POST insert
- `_lib/types.ts`: cập nhật `SpineCharacter` type
- `_lib/api.ts`: cập nhật `createSpineCharacter` payload type
- `SpineTab.tsx`: thêm section "Visual Controls" — slider + number input cho scale (0.3–3.0), offsetX/Y (±400px), toggle premultiplied_alpha; badge trong list row
- `home-page-lower.tsx`: cập nhật `SpineCharacterData` type + truyền giá trị từ DB vào `<SpineCharacter>`; default `premultiplied_alpha` = `false` (fix viền đen cho straight-alpha textures)

### Result
- Admin `/spine` tab: có thể kéo slider điều chỉnh scale/vị trí nhân vật và save → site apply ngay
- Default premultipliedAlpha đổi thành `false` (fix viền đen nếu texture export straight alpha)
- Nếu texture dùng premultiplied alpha → bật lại toggle trong admin

### Next Step
- Test trên browser: kéo slider scale/offset → Lưu → xem site có apply đúng không
- Kiểm tra viền đen: nếu hết → premultipliedAlpha=false đúng; nếu có viền sáng → bật lại toggle

## 2026-05-25 (session — Spine integration)
### Task
Tích hợp Spine 4.2 Web Player vào landing page (Careers section)

### Work Done
- Tư vấn phương án: mix-blend-mode / WebM alpha / Spine Web Player / PNG
- Xác nhận: user có file .json/.skel + .atlas + texture PNG, Spine 4.2 + physics
- Cài `@esotericsoftware/spine-player@~4.2` (latest: 4.2.119)
- Tạo `src/components/spine-character.tsx` — reusable, SSR-safe, transparent background, physics auto
- Cập nhật `src/components/home-page-lower.tsx` Careers section: thay AutoLoopMedia (mp4) → SpineCharacter
- Build pass, không có lỗi

### Result
- Component SpineCharacter sẵn sàng dùng ở mọi section
- URL placeholder: `cdn.tdgamestudio.com/landing/spine/careers/character.json` (cần thay bằng URL thật)

### Next Step
- User upload file Spine lên R2 CDN (spine/careers/ và các character khác)
- Thay URL placeholder trong SpineCharacter props
- Xác nhận tên animation đúng (hiện đang dùng "idle")
- Test physics trên browser

## 2026-05-25 (session 12–17)
### Task
Footer editable qua Admin + Social links + Blog section homepage

### Work Done
- **Blog homepage section**: `BlogPreviewGrid` component fetch `/api/blog` trả 3 bài mới nhất; fallback posts; cards link `/blog/[slug]`; fix JSX structure bug (closing `</div>` sai chỗ). Commit `e839e20`
- **Footer editable (Admin tab 9)**:
  - `site.json`: thêm `footer` section (description1/2, socials, contacts)
  - `GET /api/footer`: public endpoint đọc site.json
  - `GET/PUT /api/admin/footer`: admin-auth CRUD
  - `FooterTab.tsx`: form edit đầy đủ — descriptions, social URLs, contacts
  - `admin/page.tsx`: thêm tab "9. Footer"
  - `site-footer.tsx`: fetch `/api/footer` on mount, tất cả text/link dynamic. Commit `969b71f`
- **ArtStation social link**: thêm icon + URL field vào footer và FooterTab. Commit `4c788b1`

### Validation
- `npm run build` ✅ (43 pages, 0 TypeScript errors) — mỗi commit
- Pushed origin/main → GitHub Actions deployed VPS

### Result
- Homepage blog section hiển thị bài thật từ DB
- Footer: địa chỉ, email, Discord, LinkedIn/Facebook/Instagram/Behance/ArtStation đều edit được qua `/admin` → "9. Footer"

---

## 2026-05-24 (session 11)
### Task
Blog feature — deploy và fix build error

### Work Done
- Phát hiện: Blog API routes (`/api/blog`, `/api/admin/blog`) chưa được commit từ session trước → production không có blog
- Committed toàn bộ blog feature: API routes, BlogTab admin, updated blog pages, migration file (commit 1fed8d5)
- Build fail do 4 files dùng `createSupabaseAdmin` (không tồn tại) thay vì `getSupabaseAdmin`
- Fix import trong 4 files, commit + push (commit 8ba7635)
- Deploy VPS: build 43 pages ✅, PM2 online ✅
- Seeded 8 bài blog thật vào Supabase `blog_posts` (published=true)

### Result
- `GET /api/blog` trả về 8 posts ✅ (verified production)
- `/blog` page hiển thị 8 bài với filter tags: Animation, Art Pipeline, VFX, Case Study, Studio Life, Art Direction, Guide
- Admin tab "8. Blog" live tại /admin

### Next Step
- Team: thay ảnh/tên placeholder qua `/admin` tab "6. Team"
- About: ảnh studio workspace thật

---

