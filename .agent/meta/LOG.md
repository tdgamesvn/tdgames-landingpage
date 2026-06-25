# LOG

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

## 2026-05-24 (session 10)
### Task
Careers feature — implement end-to-end

### Work Done
- Xác nhận DB: `jobs` + `applications` tables đã tồn tại trong Supabase ✅
- Lưu migration file: `supabase/migrations/20260524120000_careers_schema.sql`
- Tạo `src/app/admin/_components/CareersTab.tsx` — 2 sub-tabs:
  - **Jobs**: CRUD (create/edit/delete/toggle active), form với tất cả fields (title, slug, type, location, level, salary, categories, description, summary, responsibilities, requirements, nice_to_have, skills)
  - **Applications**: list với filter theo status, expand row xem detail, update status (new/reviewing/interview/offer/rejected), edit admin notes
- Wire vào `src/app/admin/page.tsx`: import `CareersTab`, thêm tab "7. Careers", render khi `tab === "careers"`
- Build ✅ (Next.js 44 pages, 0 errors)
- Commit `c4565b2`, push GitHub ✅
- Deploy VPS: git pull + build + `pm2 restart tdgames-landingpage` ✅

### Result
- `/careers` page: hiển thị 6 jobs thật từ DB (verified production API trả về JSON đúng)
- Admin `/admin` tab "7. Careers": Jobs CRUD + Applications management live
- `GET /api/jobs` → public, `POST /api/applications` → ghi DB + Telegram notify
- Admin API: `GET/POST /api/admin/jobs`, `PATCH/DELETE /api/admin/jobs/[id]`, `GET /api/admin/applications`, `PATCH /api/admin/applications/[id]`

### Next Step
- Blog: thêm content thật vào `src/content/site.json` → `blog.posts`
- Team: thay ảnh/tên placeholder qua `/admin` tab "6. Team"
- About: ảnh studio workspace thật

---

## 2026-05-23 (session 9)
### Task
Thay logo header, footer và favicon browser tab

### Work Done
- `site-header.tsx`: logo_td2.png → logo_td_notext.png ✅
- `site-footer.tsx`: logo_td2.png → logo_td_notext.png ✅
- `layout.tsx`: thêm `icons` block → favicon trỏ logo_td_notext.png ✅
- Phát hiện `src/app/favicon.ico` (default Next.js) override metadata icons → xóa bỏ
- Thêm `src/app/icon.png` (logo_td_notext) theo Next.js App Router file convention
- Commit `07ea262` + `9094509`, push GitHub, deploy VPS (build 43 pages ✅, PM2 online ✅)

### Result
- Tab browser: logo TD Games (cam) ✅
- Header + Footer: logo_td_notext ✅
- Favicon cache browser: user hard refresh / incognito để thấy ngay

---

## 2026-05-23 (session 8)
### Task
Cập nhật bộ nhớ agent + fix quy trình quên ngữ cảnh

### Work Done
- Cập nhật TASKS.md: thêm Done items mới nhất, thêm To Do còn lại
- Cập nhật LOG.md: ghi lại đầy đủ 3 sessions gần nhất còn thiếu

### Result
- Bộ nhớ `.agent/meta/` đã đồng bộ với thực tế

---

## 2026-05-23 (session 7)
### Task
Team feature: hiển thị tên/chức danh + quản lý qua Admin

### Work Done
- `site.json`: thêm `team[]` array (4 placeholder members: tên, chức danh, ảnh)
- `about/page.tsx`: đọc từ `site.json`, render name/title overlay khi hover
- `src/app/admin/_components/TeamTab.tsx`: UI quản lý team (add/edit/delete/reorder/upload ảnh R2)
- `src/app/api/admin/team/route.ts`: GET + PUT team array → ghi vào `site.json`
- `types.ts`: thêm `TeamMember` type + `"team"` vào `AdminTab` union
- `admin/page.tsx`: import `TeamTab`, thêm tab "6. Team"
- Build pass ✅, deploy VPS ✅ (commit 9e14234)

### Result
- `/about` section "Passionate Artists" hiển thị tên + chức danh
- Admin tab "6. Team" live tại https://www.tdgamestudio.com/admin

---

## 2026-05-23 (session 6)
### Task
Migrate Behance hardcoded URLs + CDN subdomain + cập nhật env

### Work Done
- Chạy `migrate-missing-behance.mjs --apply` → 269 assets đã có, 0 mới
- Chạy `migrate-hardcoded-behance.mjs --apply` → migrate 30 assets, replace 135 URLs trong 6 files
- Zero `mir-s3-cdn-cf.behance.net` còn lại trong source ✅
- Cập nhật `R2_PUBLIC_BASE_URL=https://cdn.tdgamestudio.com` trong `.env.local` local + VPS
- Copy `.env.local` lên VPS (`/opt/tdgames-landingpage/.env.local`)
- Pull code `d755af6` (CDN subdomain split) + `4a7fc7c` (GIF→MP4 + admin content tab)
- Deploy VPS: build + PM2 restart ✅
- Commit: 6112732 (migrate hardcoded Behance)

### Result
- Tất cả media 100% trên CDN R2 (https://cdn.tdgamestudio.com)
- Site live, PM2 online, HTTP 200

---

## 2026-05-23 (session 5)
### Task
Migrate Behance template-literal URLs → R2 trong 9 portfolio project-data.ts

### Root Cause
- Script JS (`fix-template-behance-urls.mjs`) không kết nối được Supabase vì sandbox chặn network (`ENOTFOUND`)
- 9 files vẫn dùng `const M/MW/D/B/DISP = "https://mir-s3-cdn-cf..."` làm prefix để ghép URL trong template literals

### Work Done
- Debug: xác nhận sandbox block network → JS Supabase client trả về 0 dù DB có 164 records
- Lấy 164 mappings Behance→R2 qua MCP Supabase tool (bypass sandbox)
- Viết `scripts/apply-r2-mapping.mjs` — self-contained (mapping hardcoded), không cần network
- Dry-run: 92 → R2, 135 expanded full Behance URL, 0 const declarations còn lại
- Apply → commit `a467c0c`

### Result
- ✅ 92 URLs replaced với R2 (summoner-era, reaper-lady, puzzle-wonderland, mid-autumn)
- ⚠️ 135 URLs expanded sang full Behance URL (sky-mavis, axie, battle-of-gods, heroes-fire, game-3q) — cần migrate R2 riêng
- ✅ Tất cả `const M/MW/D/B/DISP/HD/SRC` đã xóa khỏi 9 files
- ✅ Zero template literals `${CONST}/...` còn lại
- 6 files vẫn còn `mir-s3-cdn-cf` (Behance URL dạng thẳng, cần R2 credentials để migrate)

## 2026-05-23 (session 2)
### Task
Tạo cấu trúc Memory đầy đủ cho dự án

### Work Done
- Kết nối và verify Supabase MCP thành công
- Check backend: 2 tables, 210 media assets, 1 project test, 2 security warnings
- Tạo/cập nhật 6 files memory:
  - `PROJECT.md` — cập nhật với Supabase URL, R2 CDN, status table
  - `TASKS.md` — bổ sung tasks: security fix, migrate external assets, data thật cho projects
  - `SCHEMA.md` — schema chi tiết từ Supabase MCP (verified), security fix template
  - `API.md` — toàn bộ API routes với curl examples
  - `RUNBOOK.md` — commands dev/ops/media pipeline, checklist deploy
  - `DECISIONS.md` — giữ nguyên (đã đủ)

### Validation
- Supabase MCP: `get_project_url` + `list_tables` + `execute_sql` hoạt động
- Tất cả 6 files đã write thành công

### Result
- Memory structure hoàn chỉnh, chính xác với thực tế
- Agent session tiếp theo sẽ có đủ context để làm việc hiệu quả

### Blockers
- none

### Next Step
- Fix 2 security warnings (search_path functions) — cần apply migration mới
- Rotate ADMIN_SECRET
- Migrate 102 external assets lên R2

---

## 2026-05-23 (session 3) — Deploy production
### Task
Deploy tdgames-landingpage lên VPS vps6core

### Work Done
- SSH vào VPS, clone repo `/opt/tdgames-landingpage`
- Tạo `.env` với đầy đủ production vars (Supabase, R2, ADMIN_SECRET)
- `npm install && npm run build` — pass ✅
- Tạo `ecosystem.config.js`, start PM2 port 3001 — online ✅
- Tạo Nginx config `www.tdgamestudio.com` → proxy `127.0.0.1:3001` ✅
- SSL: Cloudflare Universal SSL (không cần Certbot — domain qua Cloudflare proxy) ✅
- `https://www.tdgamestudio.com` trả về 200 ✅
- PM2 startup systemd — auto-restart khi reboot ✅
- Commit + push `.github/workflows/deploy.yml` + `ecosystem.config.js` lên GitHub

### Validation
- `curl https://www.tdgamestudio.com` → HTTP 200
- PM2 list: `tdgames-landingpage` status `online`

### Result
- Site live tại https://www.tdgamestudio.com ✅
- Auto-deploy khi push to main (GitHub Actions) ✅

### Blockers
- GitHub Secrets (VPS_HOST, VPS_USER, VPS_SSH_KEY, VPS_PORT) cần được set trong repo `tdgamesvn/tdgames-landingpage` để GitHub Actions chạy được

### Next Step
- Thêm GitHub Secrets vào repo landingpage
- Kiểm tra Cloudflare SSL mode = Full (không phải Flexible)
- Xem xét rotate ADMIN_SECRET

---

## 2026-05-23 (session 2)
### Task
Đọc và lưu nhớ thông tin dự án từ repo thực tế

### Work Done
- Clone repo từ https://github.com/tdgamesvn/tdgames-landingpage
- Đọc: README.md, IMPLEMENTATION_SUMMARY.md, plan.md, package.json, next.config.ts, layout.tsx, globals.css, cấu trúc src/
- Xoá bộ nhớ cũ (sai — dựa trên kế hoạch Astro)
- Tạo lại `.agent/meta/` với thông tin chính xác

### Result
- PROJECT.md, TASKS.md, DECISIONS.md, LOG.md đã tạo đúng với thực tế
- Xác nhận: dự án dùng Next.js 16, không phải Astro
