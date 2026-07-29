# TASKS

## Doing

_(empty)_

## To do

- [ ] Chốt testimonial trang chủ: `src/components/home-page-lower.tsx` đang dirty
  (5 quote + tên đổi mới, chưa commit). Nội dung chốt hay nháp? Sếp xác nhận rồi
  commit hoặc revert.

## Done

- [x] Rút gọn hero copy 3 trang service (2026-07-29): title bỏ "OUTSOURCING"
  (3 dòng → 2), description 85/72/72 từ → 29/31/25, CTA "Consult with our experts"
  → "Get a quote". Chỉ đổi chuỗi, không đụng layout; keyword SEO giữ ở metadata.

- [x] Dọn doc stale (2026-07-27): CLAUDE.md ghi Careers/jobs/applications "sắp tạo"
  trong khi đã production từ 2026-05-24; admin 6 tab → thực tế 13; thiếu mục /hr.
  Task "test AI Eval + set env VPS" cũng đã xong từ LOG 2026-07-09 (verified 200).

- [x] Dọn dead data blog (2026-07-27): `blog` trong site.json không render ở đâu
  (blog thật ở Supabase `blog_posts`) → xoá 184 dòng + type `BlogPost`;
  sitemap thêm blog routes đọc từ DB (34 URL); sửa CLAUDE.md đang chỉ sai nguồn
- [x] USP & CTA audit + fix P1-P3 (2026-07-27): gỡ text nội bộ ở services section,
  bỏ định vị "3D" khỏi hero, gộp CTA hero ("Get a Free Quote" + "View Our Work"
  + micro-copy), đồng bộ 5 nhãn CTA header; WHY CHOOSE → PAID TRIAL BATCH +
  ENGINE-READY DELIVERY, bỏ 2 CTA trùng (careers band + LET'S TALK),
  footer bỏ "Developer"/"Game Design"; hạ số liệu về đúng tầm studio mới
  (cards 30+/25+/15+, band 70+ projects · 12+ clients · 1200+ assets)

- [x] HR Feature 2 — AI Evaluation (2026-07-09): migration ai_score/ai_evaluation,
  `POST /api/hr/applications/[id]/evaluate` qua cliproxyapi (gpt-5.4-mini),
  badge trên AppCard + panel trong CandidateModal

- [x] HR Candidate Modal kiểu ClickUp (2026-07-09): click tên ứng viên → modal lớn,
  info + actions trái / comments phải; bỏ nút ▼ Detail inline (`HRDashboard.tsx`)
- [x] HR Dashboard fixes (2026-07-07): Pipeline grid `xl:grid-cols-6` (cột Rejected không rớt
  hàng nữa) + Discord notify comment ứng viên thêm tag `@everyone`
- [x] Pre-push type-check gate (2026-07-06): `npm run typecheck` + `.githooks/pre-push`,
  chặn push nếu lỗi TypeScript, tránh lặp lại hotfix 500 ✅
- [x] Hotfix production 500 (2026-07-06): CareersTab.tsx thiếu status "test" gây build fail
  giữa chừng, làm hỏng `.next` đang chạy → fix + rebuild + pm2 restart, verified ✅
- [x] Page Slots feature (plan 2026-05-27-page-slots):
  - [x] Task 1–2: DB migration + seed 10 rows (home carousel + 5 single-slot pages)
  - [x] Task 3: `src/lib/page-slots.ts` — `resolveSlot` / `resolveSlots` helpers
  - [x] Task 4: Public API `GET /api/page-slots`
  - [x] Task 5: Admin API CRUD `/api/admin/page-slots` (GET/POST/PATCH/DELETE/reorder)
  - [x] Task 6: About page → `resolveSlot("about", "hero")`
  - [x] Task 7: 3 services pages → `resolveSlot` + `force-dynamic` (commit 2439e53)
  - [x] Task 8: Careers → Server wrapper + `careers-client.tsx` (commit c7c85ae)
  - [x] Task 9: Home hero carousel fetches from `page_slots` API (commit f7f224b)
  - [x] Task 10: `PageSlotsTab` admin UI component (commit 9ff8eed)
  - [x] Task 11: Register tab "11. Page Slots" (commit a88970e)

- [x] Runtime Media URL Resolution (plan 2026-05-27):
  - [x] Task 1: DB migration — thêm cột `label` vào `media_assets`
  - [x] Task 2: Helper `resolveMediaUrl` / `resolveMediaUrls` (`src/lib/resolve-media.ts`)
  - [x] Task 3: About page dùng `resolveMediaUrl("about-hero")`
  - [x] Task 4: API PATCH cho phép update `label`
  - [x] Task 5: `MediaAsset.label` type + `patchMediaAsset` helper
  - [x] Task 6: Admin UI — inline label editor trên asset card (commit 893ed6f)
  - [x] Task 7: Gán label "about-hero" thủ công trong Admin → verified ✅
- [x] About page hero — swap sang video URL ✅
- [x] Team — ảnh/tên thật đã cập nhật qua Admin tab "6. Team" ✅
- [x] About page workspace — ảnh studio thật thay Unsplash ✅
- [x] Footer social links — điền URL thật (LinkedIn, Facebook, Instagram, Behance, ArtStation) ✅
- [x] Careers Spine hero — premultipliedAlpha đã ổn ✅
- [x] Nginx + SSL + Cache — Let's Encrypt cert, Cache-Control headers, Cloudflare real IP ✅
- [x] Bootstrap project + agent memory
- [x] Scaffold Next.js 16 + Tailwind v4
- [x] Layout cơ bản (header, footer, fonts)
- [x] Trang chủ (hero, services, projects sections)
- [x] Portfolio pages (10+ case studies)
- [x] Services pages (2D Art, 2D Animation, 2D VFX)
- [x] About, Contact, Careers pages
- [x] Admin UI — 6 tabs: Projects, Project Content, Media Library, Create, Bulk Replace, **Team**
- [x] Supabase integration (`projects` + `media_assets` tables)
- [x] Cloudflare R2 media pipeline
- [x] Bulk replace script (`scripts/replace-media-urls.mjs`)
- [x] Tạo bộ nhớ agent (.agent/meta/) đầy đủ từ repo thực tế
- [x] Fix security warnings (`search_path` trigger functions)
- [x] SEO hoàn chỉnh (sitemap.xml, robots.txt, OG/Twitter metadata)
- [x] CI/CD pipeline (GitHub Actions deploy workflow)
- [x] Production deploy — site live tại https://www.tdgamestudio.com (PM2 + Nginx + Cloudflare SSL)
- [x] Rotate ADMIN_SECRET
- [x] Tách content hardcode → `src/content/site.json`
- [x] Portfolio grid chuyển sang Supabase (commit 75e0c99)
- [x] Migrate 78 Behance images lên R2 (commit e636b8a)
- [x] Migrate toàn bộ Behance template-literal URLs → R2 (commit a467c0c) — 92 replaced
- [x] Migrate 30 hardcoded Behance URLs + replace 135 URLs trong 6 files (commit 6112732)
- [x] CDN subdomain: R2_PUBLIC_BASE_URL → https://cdn.tdgamestudio.com (commit d755af6)
- [x] Convert GIFs to MP4, admin Project Content tab, fix DB URLs (commit 4a7fc7c)
- [x] Team feature: site.json team[], about/page.tsx overlay, Admin tab "6. Team", API route (commit 9e14234)
- [x] Careers feature — DB (jobs + applications tables), public API (GET /api/jobs, POST /api/applications + Telegram notify), admin API (CRUD jobs, GET+PATCH applications), Careers page UI (listing, filter, detail panel, apply form), Admin tab "7. Careers" (commit c4565b2)
- [x] Blog feature — DB (blog_posts table), public API (GET /api/blog, GET /api/blog/[slug] + view increment), admin API (CRUD /api/admin/blog), Admin tab "8. Blog", seeded 8 real posts (commit 8ba7635)
- [x] Spine visual controls — DB (scale/offset_x/offset_y/premultiplied_alpha), API, SpineTab sliders, home-page-lower reads from DB
- [x] Spine Animation & Skin Picker — DB `animations JSONB`, SpineCharacter sequence loop, Admin skin dropdown + animation multi-select + reorder UI
- [x] Spine Demo embed page — `/spine-demo/[slug]` bare iframe page, URL params (bg/color/image/scale/x/y), Admin Embed URL Builder + iframe code generator (commit 26d8eeb)
- [x] `/apply/[slug]` dedicated apply page with CV upload (R2), `upload-cv` API route, careers panel now navigates there (commit 25e0792)
- [x] Bulk Replace fix — eliminate self-HTTP call, inject MAPPING_JSON from Supabase, use process.execPath (commit 6f309ca)
- [x] Discord notification khi có ứng viên mới apply (commit f1bfa36)
- [x] Referral tracking `?ref=` param — DB col + apply page + admin badge + notifications (commit 11fec9b)
- [x] HR Dashboard `/hr` — pipeline kanban, KPI table, Discord remind, GitHub Actions cron (commit 9568846)
- [x] Rejection Reason feature — DB col `rejection_reason`, RejectModal with presets, AppCard/QuickAction reject flow, AppDetail display, KPI rejection stats breakdown
