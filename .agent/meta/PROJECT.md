# PROJECT.md — tdgames-landingpage

_Cập nhật: 2026-05-23_

---

## Tổng quan

**tdgames-landingpage** là landing page marketing / portfolio cho TD Games — studio 2D Art, Animation, VFX outsourcing tại Việt Nam.

- **Công ty:** TD GAMES COMPANY LIMITED
- **Địa chỉ:** Xom Ngoai, Dong Anh Commune, Hanoi City, Vietnam
- **Email:** tdgames.vn@gmail.com
- **GitHub:** https://github.com/tdgamesvn/tdgames-landingpage
- **Brand color:** `#f59e0b` (amber — Tailwind amber-400)
- **Background:** `#0a0a0a` (near-black dark)
- **URL dev:** http://localhost:3000
- **Domain (kế hoạch):** tdgames.vn

---

## Tech Stack

| Layer | Công nghệ | Version |
|-------|-----------|---------|
| Framework | Next.js App Router + TypeScript | 16.2.4 |
| Styling | Tailwind CSS | v4 |
| Animation | Framer Motion + Swiper | 12.x / 12.x |
| Database | Supabase (PostgreSQL) | — |
| Media CDN | Cloudflare R2 (S3-compatible) | — |
| Fonts | Geist, Rajdhani, Orbitron, Barlow Condensed, Nunito Sans | Google Fonts |

---

## Supabase

- **Project URL:** `https://zjunfcyymesfpeikspzf.supabase.co`
- **Publishable key:** `sb_publishable_QwWaWEnksvAieKzavS59iw_5lVDLccn`
- **Tables:** `media_assets` (210 rows), `projects` (1 row test)
- Chi tiết: xem `SCHEMA.md`

---

## Cloudflare R2

- **Public CDN:** `https://pub-97eae399068b4753bb314896c009c27e.r2.dev`
- **Media inventory:** 210 assets (108 local_public, 102 external chưa migrate)

---

## Design System

| Token | Giá trị |
|-------|---------|
| Primary/Accent | `#f59e0b` (amber-400) |
| Accent light | `#fbbf24` (amber-300) |
| Nav hover | `#f7a31c` + glow effect |
| Background | `#0a0a0a` |
| Text | `#f5f5f5` |
| Scrollbar thumb | amber trên dark track |

**Animations:** glitch, lightning, shatter, marquee, floating particles, border-glow

---

## Cấu trúc thư mục

```
src/
├── app/
│   ├── page.tsx                  # Trang chủ
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── careers/page.tsx
│   ├── blog/page.tsx + [slug]/page.tsx
│   ├── portfolio/page.tsx + [project]/
│   │   └── (10+ case studies)
│   ├── services/
│   │   ├── page.tsx
│   │   ├── 2d-art/page.tsx
│   │   ├── 2d-animation/page.tsx
│   │   └── 2d-vfx/page.tsx
│   ├── admin/page.tsx            # Admin UI — 3 tab wizard
│   └── api/                      # Xem API.md
├── components/                   # ~30 components
│   ├── site-header.tsx / site-footer.tsx
│   ├── home-hero.tsx
│   ├── home-projects-section.tsx
│   ├── home-services-section.tsx
│   ├── portfolio-grid.tsx
│   ├── portfolio/case-study-layout.tsx
│   └── service-page-template.tsx
├── lib/
│   ├── r2.ts
│   └── supabase-admin.ts
scripts/
└── replace-media-urls.mjs        # Bulk replace media URLs
supabase/migrations/
├── 20260522072615_media_assets_schema.sql
└── 20260522164000_projects_schema.sql
```

---

## Admin UI

URL: `/admin` — key: `x-admin-key: <ADMIN_SECRET>`

| Tab | Chức năng |
|-----|-----------|
| 1. Projects | Edit cover, title, category 16 portfolio projects |
| 2. Project Content | Thay từng ảnh/video trong case study |
| 3. Media Library | Upload, search/filter, replace asset |
| 4. Create Project | Tạo project mới + cover trong 1 luồng |
| 5. Bulk Replace | Script replace URL hàng loạt |
| 6. Team | Quản lý thành viên: ảnh, tên, chức danh tại /about |

---

## Cloudflare R2

- **Public CDN:** `https://cdn.tdgamestudio.com` (custom domain)
- **Fallback:** `https://pub-97eae399068b4753bb314896c009c27e.r2.dev`
- **Media:** 299 assets migrated (toàn bộ Behance → R2, zero external Behance còn lại)

---

## Trạng thái (2026-05-23 — cập nhật session 8)

| Hạng mục | Trạng thái |
|----------|-----------|
| Build | ✅ Pass |
| Production deploy | ✅ Live: https://tdgamestudio.com |
| PM2 + Nginx + SSL | ✅ Online, auto-restart |
| Supabase migrations | ✅ Applied |
| Media pipeline R2 | ✅ 100% Behance migrated → cdn.tdgamestudio.com |
| Admin UI (6 tabs) | ✅ Hoàn chỉnh |
| Portfolio (15+ case studies) | ✅ Xong |
| Services pages | ✅ Xong (2D Art, Animation, VFX) |
| SEO | ✅ sitemap.xml, robots.txt, OG/Twitter metadata |
| GIF → MP4 conversion | ✅ Xong |
| Team section /about | ✅ Có tên/chức danh, quản lý qua admin |
| GitNexus index | ✅ 1,899 nodes / 2,821 edges |
| Blog content thật | ⏳ Chưa có — placeholder |
| Team ảnh/tên thật | ⏳ Cần thay qua Admin tab 6 |
| About workspace photos | ⏳ Vẫn dùng Unsplash placeholder |
