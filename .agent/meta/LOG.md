# LOG

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
