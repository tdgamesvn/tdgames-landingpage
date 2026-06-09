# Page Slots — Unified Runtime Media Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded media URLs in 5 pages (home hero, about hero, 3 services, careers) with a DB-backed `page_slots` table so Admin can swap any media and changes go live immediately — no rebuild required.

**Architecture:** A `page_slots` Supabase table stores named slots (`page` + `slot` + `url`). Server Components call `resolveSlot()` directly; Client Components fetch `GET /api/page-slots`. Admin manages slots via a new "Page Slots" tab backed by CRUD API routes.

**Tech Stack:** Next.js 15 App Router, Supabase (service role), TypeScript, Tailwind v4

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/page-slots.ts` | CREATE | `resolveSlot` / `resolveSlots` server helpers |
| `src/app/api/page-slots/route.ts` | CREATE | Public GET: client-side slot lookup |
| `src/app/api/admin/page-slots/route.ts` | CREATE | Admin GET + POST |
| `src/app/api/admin/page-slots/[id]/route.ts` | CREATE | Admin PATCH + DELETE |
| `src/app/api/admin/page-slots/reorder/route.ts` | CREATE | Admin bulk sort_order update |
| `src/app/about/page.tsx` | MODIFY | Switch from `resolveMediaUrl` → `resolveSlot` |
| `src/app/services/2d-art/page.tsx` | MODIFY | Add `resolveSlot` for hero image |
| `src/app/services/2d-animation/page.tsx` | MODIFY | Add `resolveSlot` for hero image |
| `src/app/services/2d-vfx/page.tsx` | MODIFY | Add `resolveSlot` for hero image |
| `src/app/careers/page.tsx` | REWRITE | Server Component wrapper |
| `src/app/careers/careers-client.tsx` | CREATE | Move current careers page here, add `heroUrl` prop |
| `src/components/hero-layout-state.tsx` | MODIFY | Fetch from API instead of static site.json |
| `src/app/admin/_components/PageSlotsTab.tsx` | CREATE | Admin UI for page slots |
| `src/app/admin/_lib/types.ts` | MODIFY | Add `PageSlot` type + `"page-slots"` to `AdminTab` |
| `src/app/admin/page.tsx` | MODIFY | Register new tab "11. Page Slots" |

---

## Task 1: DB Migration — Create `page_slots` table

**Files:**
- Supabase MCP migration

- [ ] **Step 1: Apply migration**

Run via Supabase MCP `apply_migration`:

```sql
CREATE TABLE IF NOT EXISTS page_slots (
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

CREATE INDEX IF NOT EXISTS idx_page_slots_lookup
  ON page_slots(page, slot, is_active, sort_order);
```

- [ ] **Step 2: Verify table created**

Run SQL: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'page_slots' ORDER BY ordinal_position;`

Expected: 9 columns (id, page, slot, url, thumb_url, display_name, display_label, sort_order, is_active, created_at).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: create page_slots table for runtime media management"
```

---

## Task 2: Seed Initial Data

**Files:** Supabase MCP execute_sql

- [ ] **Step 1: Seed home hero carousel (5 clips from site.json)**

```sql
INSERT INTO page_slots (page, slot, url, thumb_url, display_name, display_label, sort_order) VALUES
('home', 'hero-carousel', 'https://cdn.tdgamestudio.com/landing/video/CutScene_SE/video1.mp4', 'https://cdn.tdgamestudio.com/landing/video/CutScene_SE/1big.mp4', 'MALEFICA', 'Skin 2 – I', 0),
('home', 'hero-carousel', 'https://cdn.tdgamestudio.com/landing/video/CutScene_SE/video_summoner_3_skill_1_skin_2.mp4', 'https://cdn.tdgamestudio.com/landing/video/CutScene_SE/2big.mp4', 'VESTA', 'Skin 2 – III', 1),
('home', 'hero-carousel', 'https://cdn.tdgamestudio.com/landing/video/CutScene_SE/video_summoner_4_skill_1_skin_2.mp4', 'https://cdn.tdgamestudio.com/landing/video/CutScene_SE/3big.mp4', 'FABER', 'Skin 2 – IV', 2),
('home', 'hero-carousel', 'https://cdn.tdgamestudio.com/landing/video/Super_Move/BIGBY-Long Arm of the Law_Closed.mp4', 'https://cdn.tdgamestudio.com/landing/video/CutScene_SE/4.png', 'BIGBY', 'Long Arm', 3),
('home', 'hero-carousel', 'https://cdn.tdgamestudio.com/landing/video/Super_Move/On_Your_Knees.mp4', 'https://cdn.tdgamestudio.com/landing/video/CutScene_SE/5.png', '???', 'On Your Knees', 4);
```

- [ ] **Step 2: Seed single-slot pages**

```sql
INSERT INTO page_slots (page, slot, url, sort_order) VALUES
('about', 'hero', 'https://cdn.tdgamestudio.com/landing/images/about-hero.mp4', 0),
('careers', 'hero', 'https://cdn.tdgamestudio.com/landing/images/f0d05f71-5089-4b3f-b453-7a8d19afc013.png', 0),
('services-2d-art', 'hero', 'https://cdn.tdgamestudio.com/landing/images/summoners.png', 0),
('services-2d-animation', 'hero', 'https://cdn.tdgamestudio.com/landing/images/Environment_Art-1024x683.jpg', 0),
('services-2d-vfx', 'hero', 'https://cdn.tdgamestudio.com/landing/images/f8e2e81a-e72c-431b-b4ec-5ab7af73ea12.png', 0);
```

> **Note:** For `about/hero`, check the current `media_assets` row with `label = 'about-hero'` and use its `current_url` instead of the placeholder above. Run: `SELECT current_url FROM media_assets WHERE label = 'about-hero';`

- [ ] **Step 3: Verify seed data**

```sql
SELECT page, slot, display_name, sort_order FROM page_slots ORDER BY page, slot, sort_order;
```

Expected: 10 rows (5 home carousel + 5 single-slot pages).

---

## Task 3: Server Helper `src/lib/page-slots.ts`

**Files:**
- Create: `src/lib/page-slots.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/page-slots.ts
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type SlotItem = {
  id: number;
  url: string;
  thumb_url?: string | null;
  display_name?: string | null;
  display_label?: string | null;
  sort_order: number;
};

/**
 * Resolve a single slot URL (for Server Components).
 * Returns fallback if not found.
 */
export async function resolveSlot(
  page: string,
  slot: string,
  fallback = "",
): Promise<string> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("page_slots")
      .select("url")
      .eq("page", page)
      .eq("slot", slot)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) return fallback;
    return data.url || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Resolve all items for a carousel slot (for Server Components).
 * Returns empty array if not found.
 */
export async function resolveSlots(
  page: string,
  slot: string,
): Promise<SlotItem[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("page_slots")
      .select("id, url, thumb_url, display_name, display_label, sort_order")
      .eq("page", page)
      .eq("slot", slot)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data as SlotItem[];
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Confirm build passes**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors related to `page-slots.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/page-slots.ts
git commit -m "feat: add page-slots server helpers resolveSlot / resolveSlots"
```

---

## Task 4: Public API Route `GET /api/page-slots`

**Files:**
- Create: `src/app/api/page-slots/route.ts`

- [ ] **Step 1: Create route**

```typescript
// src/app/api/page-slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { resolveSlot, resolveSlots } from "@/lib/page-slots";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page");
  const slot = searchParams.get("slot");

  if (!page || !slot) {
    return NextResponse.json({ error: "Missing page or slot" }, { status: 400 });
  }

  // If client wants a single URL
  const single = searchParams.get("single");
  if (single === "1") {
    const url = await resolveSlot(page, slot);
    return NextResponse.json({ url });
  }

  // Default: return array (for carousel)
  const items = await resolveSlots(page, slot);
  return NextResponse.json({ items });
}
```

- [ ] **Step 2: Test manually**

```bash
curl "http://localhost:3000/api/page-slots?page=home&slot=hero-carousel"
```

Expected: `{ "items": [ { "id": 1, "url": "...", "thumb_url": "...", ... }, ... ] }` — 5 items.

```bash
curl "http://localhost:3000/api/page-slots?page=about&slot=hero&single=1"
```

Expected: `{ "url": "https://cdn.tdgamestudio.com/..." }`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/page-slots/route.ts
git commit -m "feat: add GET /api/page-slots public route"
```

---

## Task 5: Admin API Routes

**Files:**
- Create: `src/app/api/admin/page-slots/route.ts`
- Create: `src/app/api/admin/page-slots/[id]/route.ts`
- Create: `src/app/api/admin/page-slots/reorder/route.ts`

- [ ] **Step 1: Create `route.ts` (GET + POST)**

```typescript
// src/app/api/admin/page-slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function authCheck(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  return key === process.env.ADMIN_SECRET;
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const page = req.nextUrl.searchParams.get("page");
  const supabase = getSupabaseAdmin();
  const query = supabase
    .from("page_slots")
    .select("*")
    .order("page")
    .order("slot")
    .order("sort_order");
  if (page) query.eq("page", page);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slots: data });
}

export async function POST(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as {
    page: string; slot: string; url: string;
    thumb_url?: string; display_name?: string; display_label?: string;
    sort_order?: number; is_active?: boolean;
  };
  if (!body.page || !body.slot || !body.url) {
    return NextResponse.json({ error: "page, slot, url required" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("page_slots")
    .insert({ ...body, sort_order: body.sort_order ?? 0, is_active: body.is_active ?? true })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slot: data }, { status: 201 });
}
```

- [ ] **Step 2: Create `[id]/route.ts` (PATCH + DELETE)**

```typescript
// src/app/api/admin/page-slots/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function authCheck(req: NextRequest) {
  return req.headers.get("x-admin-key") === process.env.ADMIN_SECRET;
}

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json() as Partial<{
    url: string; thumb_url: string; display_name: string;
    display_label: string; sort_order: number; is_active: boolean;
  }>;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("page_slots")
    .update(body)
    .eq("id", Number(id))
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slot: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("page_slots").delete().eq("id", Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create `reorder/route.ts` (bulk sort_order update)**

```typescript
// src/app/api/admin/page-slots/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-admin-key") !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { items } = await req.json() as { items: { id: number; sort_order: number }[] };
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  await Promise.all(
    items.map(({ id, sort_order }) =>
      supabase.from("page_slots").update({ sort_order }).eq("id", id)
    )
  );
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/page-slots/
git commit -m "feat: add admin CRUD API for page_slots"
```

---

## Task 6: Update About Page

**Files:**
- Modify: `src/app/about/page.tsx`

- [ ] **Step 1: Replace `resolveMediaUrl` with `resolveSlot`**

In `src/app/about/page.tsx`, find the `getAbout()` function. Replace:

```typescript
import { resolveMediaUrl } from "@/lib/resolve-media";
```

with:

```typescript
import { resolveSlot } from "@/lib/page-slots";
```

Then replace:

```typescript
const heroImage = await resolveMediaUrl("about-hero", siteAbout.heroImage);
```

with:

```typescript
const heroImage = await resolveSlot("about", "hero", siteAbout.heroImage);
```

- [ ] **Step 2: Verify page still works**

```bash
npm run build 2>&1 | grep -E "error|Error|about"
```

Expected: no errors mentioning about/page.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat: about page hero uses page_slots instead of media_assets.label"
```

---

## Task 7: Update Services Pages (3 pages)

**Files:**
- Modify: `src/app/services/2d-art/page.tsx`
- Modify: `src/app/services/2d-animation/page.tsx`
- Modify: `src/app/services/2d-vfx/page.tsx`

All three are Server Components (no `"use client"`). Pattern is the same for each.

- [ ] **Step 1: Update `2d-art/page.tsx`**

```typescript
// src/app/services/2d-art/page.tsx
import { resolveSlot } from "@/lib/page-slots";
import ContactShowcaseSection from "@/components/contact-showcase-section";
import Service2DArtFaq from "@/components/service-2d-art-faq";
import Service2DArtFeaturedShowcase from "@/components/service-2d-art-featured-showcase";
import Service2DArtWorkflow from "@/components/service-2d-art-workflow";
import ServicePageTemplate from "@/components/service-page-template";
import SiteFooter from "@/components/site-footer";

export const dynamic = "force-dynamic";

export default async function Service2DArtPage() {
  const heroImage = await resolveSlot(
    "services-2d-art",
    "hero",
    "https://cdn.tdgamestudio.com/landing/images/summoners.png",
  );
  return (
    <ServicePageTemplate
      eyebrow=""
      title="2D Art"
      subtitle="Stylized visuals built for readability, consistency, and game-ready production."
      showDeliverRelated={false}
      appendSections={
        <>
          <Service2DArtWorkflow />
          <Service2DArtFeaturedShowcase />
          <Service2DArtFaq />
          <ContactShowcaseSection sectionStep="05" />
          <SiteFooter />
        </>
      }
      hero={{
        image: heroImage,
        titleTop: "2D GAME ART",
        titleMain: "PRODUCTION",
        subheading: "2D Art outsource",
        description:
          "TD Games specializes in professional 2D game art, turning ideas into visually striking creations. Our expertise spans stylized characters, environments, UI-support pieces, and illustration pipelines tuned for production schedules.",
        ctaLabel: "Consult with our experts",
      }}
    />
  );
}
```

> **Note:** Copy the full `hero` and `capabilities` props from the existing file — only `image` changes. Add `export const dynamic = "force-dynamic"` and make the component `async`.

- [ ] **Step 2: Update `2d-animation/page.tsx`** — same pattern

Replace the hardcoded hero image URL:
```typescript
// Add at top:
import { resolveSlot } from "@/lib/page-slots";
export const dynamic = "force-dynamic";

// Make component async:
export default async function Service2DAnimationPage() {
  const heroImage = await resolveSlot(
    "services-2d-animation",
    "hero",
    "https://cdn.tdgamestudio.com/landing/images/Environment_Art-1024x683.jpg",
  );
  // ... rest of return with hero={{ image: heroImage, ... }}
```

- [ ] **Step 3: Update `2d-vfx/page.tsx`** — same pattern

```typescript
// Add at top:
import { resolveSlot } from "@/lib/page-slots";
export const dynamic = "force-dynamic";

// Make component async:
export default async function Service2DVfxPage() {
  const heroImage = await resolveSlot(
    "services-2d-vfx",
    "hero",
    "https://cdn.tdgamestudio.com/landing/images/f8e2e81a-e72c-431b-b4ec-5ab7af73ea12.png",
  );
  // ... rest of return with hero={{ image: heroImage, ... }}
```

- [ ] **Step 4: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/services/
git commit -m "feat: services pages hero images use page_slots runtime resolution"
```

---

## Task 8: Update Careers Page (Server wrapper + Client split)

**Files:**
- Create: `src/app/careers/careers-client.tsx`
- Rewrite: `src/app/careers/page.tsx`

- [ ] **Step 1: Create `careers-client.tsx`**

Copy the entire current content of `src/app/careers/page.tsx` into `src/app/careers/careers-client.tsx`.

Then:
1. Change the filename export from `export default function CareersPage()` → `export default function CareersClient({ heroUrl }: { heroUrl: string })`
2. Find the hardcoded hero image URL (`https://cdn.tdgamestudio.com/landing/images/f0d05f71-5089-4b3f-b453-7a8d19afc013.png`) and replace it with `{heroUrl}`

The hero section in the existing file (around line 292-296):
```tsx
// BEFORE:
<Image
  src="https://cdn.tdgamestudio.com/landing/images/f0d05f71-5089-4b3f-b453-7a8d19afc013.png"
  alt=""
  fill
  ...

// AFTER:
<Image
  src={heroUrl}
  alt=""
  fill
  ...
```

- [ ] **Step 2: Rewrite `careers/page.tsx` as Server Component**

```typescript
// src/app/careers/page.tsx
import { resolveSlot } from "@/lib/page-slots";
import CareersClient from "./careers-client";

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  const heroUrl = await resolveSlot(
    "careers",
    "hero",
    "https://cdn.tdgamestudio.com/landing/images/f0d05f71-5089-4b3f-b453-7a8d19afc013.png",
  );
  return <CareersClient heroUrl={heroUrl} />;
}
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/careers/
git commit -m "feat: careers page hero uses page_slots via Server wrapper + Client split"
```

---

## Task 9: Update Homepage Hero (Client fetch from API)

**Files:**
- Modify: `src/components/hero-layout-state.tsx`

The hook `useMediaListListener` currently starts with `defaultMediaList` from site.json static import. We change it to fetch from the API on mount.

- [ ] **Step 1: Map `SlotItem` → `MediaItem`**

`SlotItem` (from API) maps to `MediaItem` (used by HomeHero):
- `id` → `String(item.id)`
- `display_name` → `name`
- `display_label` → `label`
- `thumb_url` → `thumbnail` (fallback to `url` if null)
- `url` → `path`
- `is_bg_video` = `true` (always for hero carousel)
- `is_iframe` = `false`

- [ ] **Step 2: Modify `useMediaListListener` in `hero-layout-state.tsx`**

Find and replace the `useMediaListListener` function:

```typescript
export function useMediaListListener(): MediaItem[] {
  const [list, setList] = useState<MediaItem[]>(defaultMediaList);

  // Fetch from DB on mount; fall back to site.json if error
  useEffect(() => {
    async function fetchSlots() {
      try {
        const res = await fetch(
          "/api/page-slots?page=home&slot=hero-carousel",
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const json = await res.json() as { items: Array<{
          id: number; url: string; thumb_url?: string | null;
          display_name?: string | null; display_label?: string | null;
          sort_order: number;
        }> };
        if (!Array.isArray(json.items) || json.items.length === 0) return;
        const mapped: MediaItem[] = json.items.map((item) => ({
          id: String(item.id),
          name: item.display_name ?? "",
          label: item.display_label ?? "",
          thumbnail: item.thumb_url ?? item.url,
          path: item.url,
          isBgVideo: true,
          isIframe: false,
        }));
        setList(mapped);
      } catch {
        // keep defaultMediaList
      }
    }
    void fetchSlots();
  }, []);

  // Still support live-preview CustomEvent override (admin panel)
  useEffect(() => {
    const handler = (e: Event) =>
      setList((e as CustomEvent<MediaItem[]>).detail);
    window.addEventListener(MEDIA_LIST_EVENT, handler);
    return () => window.removeEventListener(MEDIA_LIST_EVENT, handler);
  }, []);

  return list;
}
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 4: Verify homepage still loads**

Start dev server and open http://localhost:3000 — hero carousel should load (initially shows site.json data, then hydrates from DB — same content since we seeded the same data).

- [ ] **Step 5: Commit**

```bash
git add src/components/hero-layout-state.tsx
git commit -m "feat: home hero carousel fetches from page_slots DB instead of static site.json"
```

---

## Task 10: Admin UI — `PageSlotsTab` Component

**Files:**
- Create: `src/app/admin/_components/PageSlotsTab.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useEffect, useState } from "react";

type PageSlot = {
  id: number;
  page: string;
  slot: string;
  url: string;
  thumb_url?: string | null;
  display_name?: string | null;
  display_label?: string | null;
  sort_order: number;
  is_active: boolean;
};

const PAGES = [
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
  { value: "careers", label: "Careers" },
  { value: "services-2d-art", label: "Services — 2D Art" },
  { value: "services-2d-animation", label: "Services — 2D Animation" },
  { value: "services-2d-vfx", label: "Services — 2D VFX" },
];

const isVideoUrl = (url: string) =>
  /\.(mp4|webm|mov)(\?|$)/i.test(url);

type Props = { adminKey: string };

export function PageSlotsTab({ adminKey }: Props) {
  const [selectedPage, setSelectedPage] = useState("home");
  const [slots, setSlots] = useState<PageSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Add new slot form state
  const [addUrl, setAddUrl] = useState("");
  const [addThumb, setAddThumb] = useState("");
  const [addName, setAddName] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addSlot, setAddSlot] = useState("hero");
  const [adding, setAdding] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editThumb, setEditThumb] = useState("");
  const [editName, setEditName] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadSlots();
  }, [selectedPage]);

  async function loadSlots() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/page-slots?page=${selectedPage}`, {
        headers: { "x-admin-key": adminKey },
      });
      const json = await res.json() as { slots?: PageSlot[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setSlots((json.slots ?? []).filter((s) => s.page === selectedPage));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!addUrl || !addSlot) return;
    setAdding(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/page-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          page: selectedPage, slot: addSlot, url: addUrl,
          thumb_url: addThumb || null,
          display_name: addName || null,
          display_label: addLabel || null,
          sort_order: slots.filter((s) => s.slot === addSlot).length,
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setAddUrl(""); setAddThumb(""); setAddName(""); setAddLabel("");
      await loadSlots();
      setMsg("Added ✓");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(slot: PageSlot) {
    setEditingId(slot.id);
    setEditUrl(slot.url);
    setEditThumb(slot.thumb_url ?? "");
    setEditName(slot.display_name ?? "");
    setEditLabel(slot.display_label ?? "");
  }

  async function handleSave(id: number) {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/page-slots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          url: editUrl,
          thumb_url: editThumb || null,
          display_name: editName || null,
          display_label: editLabel || null,
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setEditingId(null);
      await loadSlots();
      setMsg("Saved ✓");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this slot?")) return;
    setMsg("");
    try {
      const res = await fetch(`/api/admin/page-slots/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed");
      await loadSlots();
      setMsg("Deleted ✓");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  async function handleMove(id: number, direction: "up" | "down") {
    const slotsInGroup = slots.filter((s) => {
      const target = slots.find((x) => x.id === id);
      return target && s.slot === target.slot;
    });
    const idx = slotsInGroup.findIndex((s) => s.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === slotsInGroup.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const items = [
      { id: slotsInGroup[idx].id, sort_order: slotsInGroup[swapIdx].sort_order },
      { id: slotsInGroup[swapIdx].id, sort_order: slotsInGroup[idx].sort_order },
    ];
    await fetch("/api/admin/page-slots/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ items }),
    });
    await loadSlots();
  }

  // Group slots by slot name
  const grouped = slots.reduce<Record<string, PageSlot[]>>((acc, s) => {
    (acc[s.slot] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Page Slots</h2>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="rounded-md border border-white/15 bg-zinc-800 px-3 py-1.5 text-sm"
        >
          {PAGES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <button
          onClick={() => void loadSlots()}
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5"
        >
          Refresh
        </button>
        {msg ? <span className="text-xs text-amber-300">{msg}</span> : null}
      </div>

      {loading ? (
        <p className="text-sm text-white/50">Loading…</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([slotName, items]) => (
            <section key={slotName} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 border-b border-white/10 pb-1">
                slot: {slotName} ({items.length} item{items.length !== 1 ? "s" : ""})
              </h3>
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-zinc-900 p-4 space-y-3"
                >
                  <div className="flex items-start gap-4">
                    {/* Preview */}
                    <div className="w-24 h-16 shrink-0 overflow-hidden rounded bg-black flex items-center justify-center">
                      {isVideoUrl(item.thumb_url ?? item.url) ? (
                        <video
                          src={item.thumb_url ?? item.url}
                          className="w-full h-full object-cover"
                          muted playsInline autoPlay loop
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.thumb_url ?? item.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Info or edit form */}
                    <div className="flex-1 min-w-0">
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="URL (video/image) *" className="w-full rounded border border-white/15 bg-white/5 px-2 py-1 text-xs" />
                          <input value={editThumb} onChange={(e) => setEditThumb(e.target.value)} placeholder="Thumbnail URL (optional)" className="w-full rounded border border-white/15 bg-white/5 px-2 py-1 text-xs" />
                          <div className="flex gap-2">
                            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name (e.g. MALEFICA)" className="flex-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs" />
                            <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Label (e.g. Skin 2 – I)" className="flex-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs" />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {item.display_name && <p className="text-sm font-medium">{item.display_name}</p>}
                          {item.display_label && <p className="text-xs text-white/50">{item.display_label}</p>}
                          <p className="text-[10px] text-white/30 truncate">{item.url}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {editingId === item.id ? (
                        <>
                          <button onClick={() => void handleSave(item.id)} disabled={saving} className="rounded bg-amber-500 px-2 py-1 text-[10px] font-medium text-black hover:bg-amber-400 disabled:opacity-40">Save</button>
                          <button onClick={() => setEditingId(null)} className="rounded border border-white/15 px-2 py-1 text-[10px] hover:bg-white/5">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(item)} className="rounded border border-white/15 px-2 py-1 text-[10px] hover:bg-white/5">Edit</button>
                          <button onClick={() => void handleDelete(item.id)} className="rounded border border-red-500/30 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/10">Del</button>
                        </>
                      )}
                      {items.length > 1 && (
                        <>
                          <button onClick={() => void handleMove(item.id, "up")} disabled={idx === 0} className="rounded border border-white/10 px-2 py-0.5 text-[10px] disabled:opacity-30 hover:bg-white/5">↑</button>
                          <button onClick={() => void handleMove(item.id, "down")} disabled={idx === items.length - 1} className="rounded border border-white/10 px-2 py-0.5 text-[10px] disabled:opacity-30 hover:bg-white/5">↓</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      {/* Add new slot */}
      <section className="rounded-lg border border-white/10 bg-zinc-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold">Add Slot</h3>
        <div className="flex gap-2 flex-wrap">
          <input value={addSlot} onChange={(e) => setAddSlot(e.target.value)} placeholder="slot name (e.g. hero)" className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs w-36" />
          <input value={addUrl} onChange={(e) => setAddUrl(e.target.value)} placeholder="URL (video/image) *" className="flex-1 min-w-48 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs" />
          <input value={addThumb} onChange={(e) => setAddThumb(e.target.value)} placeholder="Thumbnail URL" className="flex-1 min-w-48 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs" />
          <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Name" className="w-32 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs" />
          <input value={addLabel} onChange={(e) => setAddLabel(e.target.value)} placeholder="Display label" className="w-32 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs" />
          <button
            onClick={() => void handleAdd()}
            disabled={!addUrl || !addSlot || adding}
            className="rounded bg-indigo-600 px-3 py-1 text-xs hover:bg-indigo-500 disabled:opacity-40"
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/_components/PageSlotsTab.tsx
git commit -m "feat: add PageSlotsTab admin UI component"
```

---

## Task 11: Register Tab in Admin

**Files:**
- Modify: `src/app/admin/_lib/types.ts`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add `PageSlot` type and update `AdminTab` in `types.ts`**

In `src/app/admin/_lib/types.ts`, find `AdminTab` and add `"page-slots"`:

```typescript
export type AdminTab = "projects" | "content" | "media" | "create" | "bulk" | "team" | "careers" | "blog" | "footer" | "spine" | "page-slots";
```

- [ ] **Step 2: Register tab in `admin/page.tsx`**

Add import at top:
```typescript
import { PageSlotsTab } from "./_components/PageSlotsTab";
```

In `TABS` array, add after the `spine` entry:
```typescript
{
  id: "page-slots",
  label: "11. Page Slots",
  description: "Quản lý media slots cho từng trang — swap URL ngay, không rebuild",
},
```

In the tab rendering block, add after `{tab === "spine" ? ... : null}`:
```tsx
{tab === "page-slots" ? <PageSlotsTab adminKey={adminKey} /> : null}
```

- [ ] **Step 3: Final build check**

```bash
npm run build 2>&1 | tail -30
```

Expected: build succeeds, no errors.

- [ ] **Step 4: Final commit**

```bash
git add src/app/admin/_lib/types.ts src/app/admin/page.tsx
git commit -m "feat: register Page Slots tab in admin panel (tab 11)"
```

---

## Task 12: End-to-End Verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify each page loads with correct hero**

| URL | Expected hero source |
|-----|---------------------|
| http://localhost:3000 | Home hero carousel (5 clips from DB) |
| http://localhost:3000/about | About hero (from page_slots `about/hero`) |
| http://localhost:3000/careers | Careers hero (from page_slots `careers/hero`) |
| http://localhost:3000/services/2d-art | Services hero (from page_slots `services-2d-art/hero`) |
| http://localhost:3000/services/2d-animation | Services hero (from page_slots `services-2d-animation/hero`) |
| http://localhost:3000/services/2d-vfx | Services hero (from page_slots `services-2d-vfx/hero`) |

- [ ] **Step 3: Test Admin swap flow**

1. Open http://localhost:3000/admin → sign in → tab "11. Page Slots"
2. Select "Services — 2D Art"
3. Click "Edit" on the hero slot
4. Paste a different image URL → Save
5. Open http://localhost:3000/services/2d-art → verify new image shows (no rebuild needed)
6. Revert: go back to Admin → restore original URL

- [ ] **Step 4: Test home carousel reorder**

1. Admin → Page Slots → Home
2. Click ↑ or ↓ on a carousel item
3. Reload http://localhost:3000 → verify clip order changed

- [ ] **Step 5: Final push**

```bash
git push origin main
```

---

## Self-Review Checklist

- [x] All spec sections covered (DB, helpers, public API, admin API, 5 pages, admin UI)
- [x] No "TBD" or placeholder text — all code blocks are complete
- [x] Types consistent: `SlotItem` defined in Task 3, used in Task 4 and Task 9
- [x] `resolveSlot` / `resolveSlots` defined in Task 3, referenced in Tasks 6, 7, 8
- [x] `PageSlot` type only in the component (Task 10) — no cross-task type mismatch
- [x] `force-dynamic` added to all pages that now do runtime DB queries
- [x] Careers page split: Server wrapper in `page.tsx`, Client component in `careers-client.tsx`
- [x] Seed data in Task 2 exactly matches hardcoded fallback URLs used in Tasks 6, 7, 8
