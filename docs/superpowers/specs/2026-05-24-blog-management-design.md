# Blog Management — Design Spec

_Date: 2026-05-24_

## Goal

Replace hardcoded blog posts in `/blog/page.tsx` with a Supabase-backed system. Add admin tab "8. Blog" to create, edit, delete, and publish posts with markdown content and R2 cover images.

## Architecture

**Storage:** Supabase `blog_posts` table. Server-side reads use service role key (bypasses RLS). Public reads via API routes return only `published = true` posts.

**Markdown rendering:** `marked` library (~6kB, already common in ecosystem). Rendered server-side in `/blog/[slug]/page.tsx` → output as `dangerouslySetInnerHTML` (acceptable since content is admin-controlled).

**Images:** Cover image stored as URL string. Admin can paste an existing R2/CDN URL or upload a new file via existing `/api/admin/upload` route (same as Team tab).

---

## Database Schema

Table: `public.blog_posts`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `slug` | text | NO | — | UNIQUE, URL-safe |
| `title` | text | NO | — | |
| `excerpt` | text | NO | `''` | Short summary for listing card |
| `tag` | text | NO | `'Blog'` | Free-form: "Blog", "Pipeline", "VFX", "2D Art", etc. |
| `cover_image` | text | NO | `''` | CDN URL |
| `content_md` | text | NO | `''` | Full markdown body |
| `published` | boolean | NO | `false` | true = visible on /blog |
| `views` | integer | NO | `0` | Incremented on each GET /api/blog/[slug] |
| `author` | text | NO | `'TD Games'` | |
| `created_at` | timestamptz | NO | `now()` | |
| `updated_at` | timestamptz | NO | `now()` | Auto-updated via trigger |

**Constraints:**
- `blog_posts_slug_key` UNIQUE on `slug`

**RLS:**
- Enabled
- Policy `blog_public_read`: `FOR SELECT USING (published = true)`
- Admin writes go through service role (bypasses RLS)

**Trigger:** `set_blog_posts_updated_at` — auto-updates `updated_at` on UPDATE, with `SET search_path = public` (no security lint).

**Indexes:**
- `blog_posts_published_idx` on `(published)`
- `blog_posts_created_at_idx` on `(created_at DESC)`
- `blog_posts_slug_idx` on `(slug)`

---

## API Routes

### Public

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/blog` | GET | none | List published posts, newest first |
| `/api/blog/[slug]` | GET | none | Single post + increment views |

`GET /api/blog` response:
```json
{ "posts": [...], "total": 12 }
```

`GET /api/blog/[slug]` response:
```json
{ "post": { ...allFields } }
```
Returns 404 if not found or not published.

### Admin (header: `x-admin-key`)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/blog` | GET | List ALL posts (including drafts), newest first |
| `/api/admin/blog` | POST | Create new post |
| `/api/admin/blog/[id]` | PATCH | Update any fields |
| `/api/admin/blog/[id]` | DELETE | Delete post |

Required fields for POST: `slug`, `title`. All others optional with DB defaults.

---

## Frontend Changes

### `/blog/page.tsx`
- Convert from `"use client"` static to: client component that `fetch("/api/blog")` on mount
- Filter tags derived dynamically from fetched data (unique tags + "All")
- Show loading skeleton while fetching
- Keep existing UI/layout unchanged (dark theme, 2-col grid, pagination)

### `/blog/[slug]/page.tsx`
- Fetch from `/api/blog/[slug]` (server component, `cache: 'no-store'`)
- Render `content_md` via `marked` → inject as `dangerouslySetInnerHTML`
- Add prose styles in `<style>` tag or Tailwind prose classes for markdown output
- Show: cover image hero, title, tag, author, date, views, then body
- Return `notFound()` if API returns 404

### `src/app/admin/_components/BlogTab.tsx` (new)
Two views: **List** and **Form**.

**List view:**
- Table of all posts (title, tag, published badge, views, date)
- Actions per row: Edit, Delete, Toggle Published
- Button "+ New Post" → opens Form view

**Form view (create / edit):**
- Fields: Title, Slug (auto-generated from title, editable), Tag (text input), Author, Excerpt (textarea ~2 lines)
- Cover Image: URL text input + "Upload" button → calls `/api/admin/upload`, fills URL on success
- Content (textarea, tall, monospace font, placeholder shows markdown syntax hints)
- Preview tab: renders markdown via `marked` on client for live preview
- Published checkbox
- Save / Cancel buttons

### `src/app/admin/page.tsx`
- Import `BlogTab`
- Add `{ id: "blog", label: "8. Blog", description: "..." }` to TABS array
- Render `{tab === "blog" ? <BlogTab adminKey={adminKey} /> : null}`

### `src/app/admin/_lib/types.ts`
- Add `BlogPost` type
- Add `"blog"` to `AdminTab` union

---

## Dependencies

- `marked` — markdown → HTML. Install: `npm install marked @types/marked`
- No other new dependencies.

---

## Out of Scope

- SEO metadata per post (can add later via `generateMetadata` + API call)
- Image upload inline in markdown body (paste URL instead)
- Author profile pages
- Comments
- RSS feed
