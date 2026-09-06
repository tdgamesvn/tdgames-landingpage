<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **tdgames-landingpage** (2499 symbols, 4849 relationships, 198 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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

- **Production:** https://tdgamestudio.com
- **Dev server:** `npm run dev` → http://localhost:3000
- **Admin UI:** `/admin` (requires `ADMIN_SECRET` from `.env.local` as `x-admin-key` header)
- **GitHub:** https://github.com/tdgamesvn/tdgames-landingpage
- **VPS:** `tailscale ssh root@vps6core` → `/opt/tdgames-landingpage`, PM2: `pm2 restart tdgames-landingpage`

## Commands

```bash
npm run dev          # Dev server → http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint

# Deploy — TỰ ĐỘNG qua GitHub Actions (.github/workflows/deploy.yml)
git push origin main        # xong. CI ssh vào VPS: pull → npm i → build → pm2 restart (~1m30s)
gh run watch                # xem tiến độ nếu cần

# KHÔNG ssh build tay khi vừa push — build tay chạy song song với CI sẽ đụng
# lock của Next ("Another next build process is already running") → CI fail.
# Chỉ deploy tay khi CI hỏng: gh workflow run deploy.yml (chạy lại), hoặc
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

**13 tabs** trong `src/app/admin/_components/`: Projects, ProjectContent, Media, Create,
Bulk, Team, Blog, Careers, Footer, PageSlots, Settings, Spine (+ UploadZone/MediaPreview/
SlotHint là component dùng chung). Đọc thư mục để biết danh sách hiện tại — đừng tin con
số trong doc này.

Admin API routes: `src/app/api/admin/*` (applications, blog, footer, jobs, media,
page-slots, project-content, settings, spine, spine-json, team, upload) — tất cả yêu cầu
header `x-admin-key: <ADMIN_SECRET>`.

### HR Dashboard (`/hr`)

Trang tuyển dụng nội bộ, tách khỏi `/admin`: pipeline ứng viên kiểu ClickUp, candidate
modal, comment, Discord notify, AI evaluation (`POST /api/hr/applications/[id]/evaluate`
qua cliproxyapi — env `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL`, đã set trên VPS).
API: `src/app/api/hr/*` (applications, jobs, remind, upload).

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
| `blog_posts` | Bài blog (nguồn duy nhất — KHÔNG phải site.json) |
| `jobs` | Việc làm cho Careers page |
| `applications` | Đơn ứng tuyển (+ `ai_score`, `ai_evaluation` cho AI eval) |
| `page_slots` | Ảnh/media theo slot từng trang (`src/lib/page-slots.ts`) |

Migrations trong `supabase/migrations/`. Chạy `npx supabase migration list` để xem
trạng thái thật thay vì tin bảng này.

Server-side Supabase client: `src/lib/supabase-admin.ts` (dùng `SUPABASE_SERVICE_ROLE_KEY`).

## Current Task Priority

> ⚠️ Mục này từng stale rất nặng (2026-07-27: liệt kê Careers/Blog là "sắp làm"
> trong khi cả hai đã chạy production nhiều tháng, gây ra 2 task ma). **Verify trước
> khi tin**: `curl https://tdgamestudio.com/api/<route>`, `ls src/app/<route>`.

Đã xong và đang chạy production: Careers (`/careers` + `/api/jobs` + `/api/applications`),
HR dashboard (`/hr` + AI evaluation), Blog (Supabase, 8 bài), Page Slots, Admin 13 tabs.

**Không còn task tồn đọng.** Mọi mục từng liệt kê ở đây (Careers, Blog, HR + AI eval,
Team, About workspace) đều đã xong và verified trên production. Nếu cần việc mới,
hỏi sếp — đừng bới doc cũ ra làm.

## Memory Files

Đọc trước khi làm việc:
- `.agent/meta/TASKS.md` — Doing → To do → Done
- `.agent/meta/LOG.md` — entry cuối = context session trước
- `.agent/meta/DECISIONS.md` — quyết định kỹ thuật dài hạn
- `.agent/meta/SCHEMA.md` — DB schema chi tiết
- `.agent/meta/API.md` — API routes + curl examples
- `.agent/meta/RUNBOOK.md` — checklist deploy production

Cập nhật sau mỗi session: `LOG.md` (bắt buộc), `TASKS.md`, `DECISIONS.md` (khi có quyết định mới).
