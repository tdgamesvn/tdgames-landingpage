<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **tdgames-landingpage** (2014 symbols, 3795 relationships, 157 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/tdgames-landingpage/context` | Codebase overview, check index freshness |
| `gitnexus://repo/tdgames-landingpage/clusters` | All functional areas |
| `gitnexus://repo/tdgames-landingpage/processes` | All execution flows |
| `gitnexus://repo/tdgames-landingpage/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TD Games Studio** landing page — Next.js 16 (App Router), Tailwind CSS v4, TypeScript, Supabase (PostgreSQL), Cloudflare R2 CDN.

- **Production:** https://www.tdgamestudio.com
- **Dev server:** `npm run dev` → http://localhost:3000
- **Admin UI:** `/admin` (requires `ADMIN_SECRET` from `.env.local` as `x-admin-key` header)
- **GitHub:** https://github.com/tdgamesvn/tdgames-landingpage
- **VPS:** `tailscale ssh root@vps6core` → `/opt/tdgames-landingpage`, PM2: `pm2 restart tdgames-landingpage`

## Commands

```bash
npm run dev          # Dev server → http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint

# Deploy (manual, trên VPS)
git push origin main
# ssh vps6core → cd /opt/tdgames-landingpage → git pull && npm run build && pm2 restart tdgames-landingpage

# Supabase migrations
supabase link --project-ref zjunfcyymesfpeikspzf
supabase migration new <ten_migration>
supabase db push

# Media pipeline scripts (cần network → dangerouslyDisableSandbox: true)
node --env-file=.env.local scripts/replace-media-urls.mjs          # dry-run
node --env-file=.env.local scripts/replace-media-urls.mjs --apply  # apply
```

## Architecture

### Content & Data Flow

- **`src/content/site.json`** — nguồn dữ liệu chính: `hero.media[]`, `home.featuredProjects[]`, `services.cards[]`, `about`. Types ở `src/types/site-content.ts`.
- **Blog KHÔNG nằm ở site.json** — đã migrate sang Supabase table `blog_posts`, đọc qua `GET /api/blog` + `GET /api/blog/[slug]`, sửa qua `/api/admin/blog`. (Key `blog` cũ trong site.json là dead data, đã xoá 2026-07-27.)
- **Portfolio case studies** — mỗi project có thư mục riêng `src/app/portfolio/<slug>/`, bên trong có `project-data.ts` (export `CaseStudyProps`) và `page.tsx` (gọi `<CaseStudyLayout>`). Types ở `src/components/portfolio/case-study-types.ts`.
- **Services pages** — dùng `<ServicePageTemplate>` tại `src/components/service-page-template.tsx`, nhận props cấu hình (FAQ, workflow, showcase). Các presets: `service-faq-presets.ts`, `service-workflow-presets.ts`.

### Admin System (`/admin`)

Hiện có **6 tabs** (`src/app/admin/_components/`):
1. **Projects** — CRUD projects (Supabase `projects` table)
2. **Project Content** — upload/replace ảnh trong case study files
3. **Media Library** — quản lý `media_assets` table
4. **Create** — tạo media entry mới
5. **Bulk Replace** — chạy `replace-media-urls.mjs` qua API
6. **Team** — quản lý `team[]` trong `site.json`

Admin API routes: `src/app/api/admin/*`, tất cả yêu cầu header `x-admin-key: <ADMIN_SECRET>`.

### Media Pipeline

Media đi qua 3 trạng thái trong `media_assets` table:
1. `source_type: local_public` — file trong `/public`
2. Upload lên R2 → `r2_key` + `r2_url` điền vào
3. Promote → `current_url = r2_url` (CDN: `https://cdn.tdgamestudio.com`)

Script bulk replace: quét toàn bộ source files, thay URL cũ → `current_url` từ DB.

### Tailwind v4

**Không có `tailwind.config.js`**. Config hoàn toàn qua CSS variables trong `src/app/globals.css` với `@theme inline`. Syntax import: `@import "tailwindcss"`.

### Next.js Image

`next.config.ts` whitelist hostnames: `*.tdgamestudio.com`, `*.r2.dev`, `*.r2.cloudflarestorage.com`, Behance, Unsplash. Khi thêm nguồn ảnh mới phải thêm vào đây.

## Database (Supabase)

Project ref: `zjunfcyymesfpeikspzf`

| Table | Mục đích |
|-------|---------|
| `media_assets` | Track tất cả media (ảnh/video), trạng thái R2 migration |
| `projects` | Portfolio projects hiển thị qua API |
| `jobs` *(sắp tạo)* | Danh sách việc làm cho Careers page |
| `applications` *(sắp tạo)* | Đơn ứng tuyển từ Careers form |

Server-side Supabase client: `src/lib/supabase-admin.ts` (dùng `SUPABASE_SERVICE_ROLE_KEY`).

## Current Task Priority

**Next big feature: Careers** (spec đã thiết kế đầy đủ, session 10):
1. DB: tạo `jobs` + `applications` tables (Supabase migration)
2. API public: `GET /api/jobs`, `POST /api/applications`
3. API admin: `CRUD /api/admin/jobs`, `GET+PATCH /api/admin/applications`
4. Careers page: đọc từ DB, job detail panel + apply form inline
5. Admin tab "7. Careers": sub-tab Jobs + Applications
6. Telegram notification khi có ứng viên mới

**Các task nhỏ còn lại:**
- ~~Blog placeholder~~ — đã xong từ trước, 8 bài thật trong Supabase `blog_posts`, đúng định vị 2D
- Team: thay ảnh/tên placeholder → qua `/admin` tab "6. Team"
- About: ảnh workspace thật (section "Our Workspace", hiện Unsplash)

## Memory Files

Đọc trước khi làm việc:
- `.agent/meta/TASKS.md` — Doing → To do → Done
- `.agent/meta/LOG.md` — entry cuối = context session trước
- `.agent/meta/DECISIONS.md` — quyết định kỹ thuật dài hạn
- `.agent/meta/SCHEMA.md` — DB schema chi tiết
- `.agent/meta/API.md` — API routes + curl examples
- `.agent/meta/RUNBOOK.md` — checklist deploy production

Cập nhật sau mỗi session: `LOG.md` (bắt buộc), `TASKS.md`, `DECISIONS.md` (khi có quyết định mới).
