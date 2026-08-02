# TASKS

## Doing

_(empty)_

## To do

- [ ] Smoke test "Dựng bài" ở /admin tab Blog: giờ tự sinh cover + 2 ảnh trong bài
      (2026-08-02). Xem chất lượng ảnh + thời gian chạy. Ảnh xấu → chỉnh
      `STYLE_SUFFIX` trong `src/lib/ai-image.ts`.

- [x] ~~Badge intent/score/keyword trong panel radar~~ (2026-08-01, 9e8f655):
      hiện `[BOFU 9/10]` + keyword, sắp theo điểm giảm dần. Production verify OK.
- [ ] 9 topic cũ (trước khi có chấm điểm) đang `score = null` nên trôi xuống cuối
      panel. Không xoá — để `expireOld` tự dọn sau 7 ngày.

- [x] ~~Cron cho radar~~ (2026-08-01): crontab VPS ĐÃ có sẵn entry 8:00 nhưng chết im
      vì thư mục `logs/` không tồn tại → redirect `>> logs/blog-radar.log` fail.
      `mkdir -p logs` là xong. Chạy tay verify: quét 34 tin, lưu 5 chủ đề, ping Discord ✓
- [x] ~~`HR_SECRET` trên GitHub~~ (2026-08-01): sếp bảo "bạn chạy cho tôi được không"
      → đã set từ `app_settings.hr_secret`, không in giá trị ra đâu cả.
      Chạy thử `gh workflow run hr-remind.yml` → **HTTP 200 success**, trả
      `{"sent":true,"staleCount":3,"needsReview":3}` ⇒ nhắc HR sống lại sau 5+ ngày chết.
- [x] ~~274 file mồ côi~~ (2026-08-01): sếp duyệt dọn → chuyển sang `trash/2026-08-01/`
      (KHÔNG xoá thẳng — "mồ côi" là kết luận heuristic). Manifest
      `scripts/.orphan-manifest.jsonl`. Row `media_assets` vẫn còn.
- [ ] Sau vài ngày: xoá hẳn `trash/2026-08-01/` (1.56 GB) nếu web không thiếu ảnh nào.
- [ ] Sau vài ngày web chạy ổn: xoá `backup/pre-compress/` trên R2 (~2 GB).
- [x] ~~GIF lossless bên bot~~ — sếp chốt KHÔNG cần `-lossy`, giữ chất lượng.


- [x] ~~Bot `tdgames-discord`: `POST /compress`~~ (2026-08-01) — bot live tại
  `http://100.126.162.96:8787` (launchd `com.tdgames.discord-bot`, KHÔNG phải PM2).
  `COMPRESSOR_URL` đã set trên VPS. Production verify: PNG 15.6MB → 517KB,
  MP4 1.28MB → 94KB. ⚠ env là BASE, không kèm `/compress`.
- [x] ~~Điều tra `POST /api/admin/upload` trả 400~~ (2026-08-01): KHÔNG phải bug app.
  `.env.local` là CRLF → key lấy bằng grep dính `\r` → header không hợp lệ, Node HTTP
  parser vứt request trước khi vào Next. Body JSON cũng 400 y hệt ⇒ không liên quan
  multipart. Ngoài ra secret thật ở DB `app_settings.admin_secret`, không phải env.
  Curl test: `-H 'x-admin-key: <value trong app_settings>'`.

## Done (mới)

- [x] **Nén ảnh mọi đường upload** (2026-08-01): nén trong `uploadToR2()` —
  image/(jpeg|png|webp|avif|tiff) + >400KB → webp q90, max 2400px, key đổi .webp.
  `spine/upload` skipCompress. `generate-image` bỏ sharp riêng. Verify: tsc sạch,
  PNG 3.47MB → 226KB. Khảo sát cũ:
  nén trong `src/lib/r2.ts` → `uploadToR2()` — cổng duy nhất của 6 route
  (admin/upload, hr/upload, applications/upload-cv, admin/spine/upload,
  admin/media/migrate, admin/generate-image). Nén ở 1 chỗ, route mới tự hưởng.
  - Tham số chốt từ `tdgames-discord` (sếp đã tune thực tế): **quality 90**,
    ngưỡng ~400KB, max width ~2400px. `sharp` đã có sẵn (0.35.3), không thêm dep.
  - ⚠️ `admin/spine/upload` PHẢI `skipCompress: true` — file `.png` là atlas,
    tên bị `.atlas` tham chiếu cứng, đổi sang `.webp` là vỡ runtime Spine.
  - ⚠️ gif/svg bỏ qua (mất animation / vector). PDF (CV) tự động không match.
  - `admin/upload` trả `size: file.size` → đổi thành `body.length` sau nén.
- [x] **Video: nén qua bot, không dựng ffmpeg trên VPS** (2026-08-01). Landing page
  POST thẳng tới bot qua tailscale (`COMPRESSOR_URL`), KHÔNG đi vòng channel Discord
  (limit 10MB cả 2 chiều). Bot chết → video upload thô, ảnh lùi về sharp. Lý do cũ:
  ffmpeg trên vps6core (6 core, 11 app) =
  30–90s ăn hết CPU/clip + route timeout. Dùng bot `tdgames-discord` đã deploy
  trên Mac: thả video vào channel `compressor-ai` → nhận file nén
  (`libx264 -crf 20 -preset slow`) → upload `/admin`. Chỉ dựng pipeline thật khi
  có box nén 24/7 (Mac ngủ = chết, xem LOG 2026-07-31 bot im lặng 19 ngày).

- [ ] Set `DISCORD_WEBHOOK_SALES` trên VPS (chưa set → lead notify rơi về
  `DISCORD_WEBHOOK_URL` chung). Không set thì vẫn lưu lead, chỉ mất ping.
- [ ] `/crm` chưa link từ đâu cả (giống `/hr`) — sếp muốn nút trong `/admin` thì nói.

## Done

- [x] ImagePicker 3 tab + ảnh AI (2026-08-01): cột `media_assets.ai_prompt`,
  `POST /api/admin/generate-image` (gpt-image-2 → R2 → media_assets row),
  component `ImagePicker` (Kho/Upload/AI) cắm vào BlogTab cover. Guard chặn
  prompt character theo DECISIONS 07-31. Verify end-to-end trên dev: CDN 200 +
  DB row đúng. ĐÃ DEPLOY 2026-08-01 (0c62953); ảnh AI giờ đi đường nén → .webp 21KB.

- [x] CRM pass riêng (2026-07-30): `app_settings.crm_secret` = pass CRM riêng,
  `crm-auth.ts` bỏ fallback sang `getHRSecret()` → CRM không bao giờ dùng chung
  pass với HR nữa (rỗng → 500 chứ không âm thầm mượn pass HR).

- [x] CRM leads (2026-07-30): table `leads` + trigger updated_at + RLS,
  `POST /api/leads` (validate whitelist service/budget, Discord `sales` notify
  fire-and-forget), `GET /api/crm/leads` + `PATCH/DELETE /api/crm/leads/[id]`
  (x-admin-key), board `/crm`. Form contact chuyển từ `mailto:` → POST thật,
  thêm 2 select Service/Budget. Smoke test 201/400/401/200 + build OK.

- [x] Testimonial trang chủ (2026-07-29): đã commit ở a6a3e64, không còn dirty.

- [x] Card "What we do" 3 trang service vào Page Slots (2026-07-29):
  `resolveServiceCards()`, seed 18 row id 65-82, admin quick slot `service-card`.

- [x] ART SHOWCASE trang chủ còn 3 tag Art/Animation/VFX (2026-07-29): bỏ nhóm
  Environment, đổi nhãn Character Art → Art (giữ id `character-art`).

- [x] Logo header/footer vào Page Slots (2026-07-29): hook `useSlotUrl()` dùng chung,
  header + footer đọc slot `global/brand-logo`, fallback `BRAND_LOGO_FALLBACK`.
  Admin thêm page "Global (header + footer)". Seed row id 49.

- [x] Logo client trang chủ đọc từ Page Slots (2026-07-29): hook `useClientLogos()`
  fetch slot `home/client-logos`, fallback về 5 URL cũ. Không cần migration.

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
