# Spec: Page Slots — Unified Runtime Media Management

_Date: 2026-05-27_
_Status: Approved by user_

---

## Problem

Media URLs across the site are hardcoded in source files (`site.json`, `project-data.ts`, service page `.tsx`). Swapping a hero video or image requires:
1. Bulk replace script (currently broken)
2. Rebuild + redeploy

Goal: Admin replaces asset → change takes effect immediately on production, no rebuild needed.

---

## Solution: `page_slots` Table

A single DB table acting as a "named slot registry" for all runtime-managed media across the site.

### DB Schema

```sql
CREATE TABLE page_slots (
  id SERIAL PRIMARY KEY,
  page TEXT NOT NULL,
  slot TEXT NOT NULL,
  url TEXT NOT NULL,
  thumb_url TEXT,
  display_name TEXT,
  display_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_page_slots_lookup ON page_slots(page, slot, is_active, sort_order);
```

### Slot naming convention

```
page/slot
────────────────────────────────────
home/hero-carousel        → multiple rows (sort_order 0..N)
about/hero                → single row
careers/hero              → single row
services-2d-art/hero      → single row
services-2d-animation/hero→ single row
services-2d-vfx/hero      → single row
```

Future slots can be added without code changes to the DB layer:
```
portfolio-sparky/gallery  → multiple rows
home/services-bg          → single row
```

---

## Server-side Helpers

`src/lib/page-slots.ts`:

```typescript
// Single slot (Server Component)
resolveSlot(page, slot, fallback?) → Promise<string>

// Carousel (Server Component)
resolveSlots(page, slot) → Promise<SlotItem[]>

// Client-side API (for Client Components)
GET /api/page-slots?page=home&slot=hero-carousel → SlotItem[]
GET /api/page-slots?page=careers&slot=hero → { url: string }
```

`SlotItem` type:
```typescript
type SlotItem = {
  id: number;
  url: string;
  thumb_url?: string;
  display_name?: string;
  display_label?: string;
  sort_order: number;
}
```

---

## Pages Affected

### 1. Homepage Hero (carousel)

**Current:** `hero-layout-state.tsx` loads `siteContent.hero.media` (static import)
**New:** fetch `GET /api/page-slots?page=home&slot=hero-carousel` on mount; fallback to site.json while loading

`page.tsx` remains `"use client"` — no architecture change needed.

Seed data: 5 clips from `site.json → hero.media[]` into `page_slots`.

### 2. About page hero

**Current:** `resolveMediaUrl("about-hero")` via `media_assets.label`
**New:** `resolveSlot("about", "hero", fallback)` via `page_slots`

Migration: seed 1 row. Remove label from `media_assets`.

### 3. Services pages (Server Components)

**Current:** hero image hardcoded in each page's `hero={{ image: "https://cdn..." }}`
**New:**
```typescript
const heroUrl = await resolveSlot("services-2d-art", "hero", FALLBACK)
// pass to ServicePageTemplate
```

Pages: `2d-art/page.tsx`, `2d-animation/page.tsx`, `2d-vfx/page.tsx`

### 4. Careers page (Client Component)

**Pattern:** Server wrapper + Client component split

```
careers/
  page.tsx           ← NEW Server Component: fetches heroUrl, renders <CareersClient>
  careers-client.tsx ← RENAMED from page.tsx: accepts heroUrl prop
```

---

## Admin UI: "Media Slots" Tab

New tab in `/admin` — tab number **10** (or replace "Bulk Replace" tab which is broken).

### Features
- **Page selector**: dropdown to pick page (`home`, `about`, `careers`, `services-2d-art`, ...)
- **Slot list**: shows all slots for selected page
- For **single slots**: current thumbnail + "Replace URL" button → pick from Media Library or paste URL
- For **carousel**: ordered list of items, each with thumbnail preview; drag-up/drag-down reorder; add/remove item; edit name/label

### Admin API routes

```
GET    /api/admin/page-slots?page=X         → all slots for page X
POST   /api/admin/page-slots                → create slot row
PATCH  /api/admin/page-slots/:id            → update url/name/label/sort_order
DELETE /api/admin/page-slots/:id            → delete row
POST   /api/admin/page-slots/reorder        → bulk update sort_order
```

---

## Migration Plan

1. DB migration: create `page_slots` table + index
2. Seed existing data:
   - 5 home hero clips from `site.json`
   - 1 about hero (currently `media_assets.label = "about-hero"`)
   - 3 services hero images (hardcoded URLs)
   - 1 careers hero image (hardcoded URL)
3. Update `src/lib/page-slots.ts` (new helper)
4. Update `GET /api/page-slots` (public read route)
5. Update Admin API routes
6. Update pages (homepage, about, services, careers)
7. Update Admin UI (new "Media Slots" tab)
8. Remove `media_assets.label` usage from about page (or keep as legacy)

---

## What Does NOT Change

- `media_assets` table: still used for upload pipeline, R2 migration, usage tracking
- `media_assets.label`: can stay for backwards compat, just no longer primary mechanism
- Portfolio case studies: not in scope for this spec (separate effort)
- Bulk replace script: deprecated once page_slots covers all key slots

---

## Success Criteria

- Admin swaps hero video for any of 5 pages → live on production within seconds (no rebuild)
- Homepage hero carousel order/content fully managed from Admin
- Zero hardcoded media URLs in the 5 target pages
- `page_slots` extensible to any future page/slot without schema changes

---

## Out of Scope

- Portfolio case study images (future spec)
- Blog post images (managed via blog_posts table already)
- Team images (managed via site.json team[] + Admin Team tab)
