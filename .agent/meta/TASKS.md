# TASKS

## Doing
_(empty)_

## To do

- [ ] Team — thay ảnh/tên placeholder bằng thật
  - Vào `/admin` → tab "6. Team" → upload ảnh + sửa tên/chức danh

- [ ] About page — ảnh studio workspace thật (section "Our Workspace")
  - Hiện đang dùng Unsplash placeholder

## Done

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
