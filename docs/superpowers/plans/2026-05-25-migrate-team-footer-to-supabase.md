# Migrate Team + Footer to Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `team[]` và `footer` data từ `src/content/site.json` (git-tracked file) sang Supabase database để tránh bị reset mỗi lần deploy.

**Architecture:** Tạo 2 tables mới (`team_members`, `site_config`) trong Supabase. Cập nhật 3 API routes để đọc/ghi DB thay vì `fs`. Cập nhật `about/page.tsx` để fetch qua API thay vì đọc file trực tiếp. Admin UI components (TeamTab, FooterTab) và SiteFooter không cần thay đổi vì contract API giữ nguyên.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + MCP), TypeScript, `src/lib/supabase-admin.ts` (service role client)

---

## File Map

| File | Action | Mục đích |
|------|--------|---------|
| Supabase migration | CREATE | Tạo `team_members` + `site_config` tables, seed data |
| `src/app/api/admin/team/route.ts` | MODIFY | GET/PUT đọc/ghi `team_members` table thay vì fs |
| `src/app/api/admin/footer/route.ts` | MODIFY | GET/PUT đọc/ghi `site_config` table thay vì fs |
| `src/app/api/footer/route.ts` | MODIFY | GET đọc `site_config` table thay vì fs |
| `src/app/about/page.tsx` | MODIFY | Fetch team qua `/api/team` thay vì fs.readFile |
| `src/app/api/team/route.ts` | CREATE | Public GET endpoint trả về team members |

---

## Task 1: Tạo Supabase tables + seed data

**Files:**
- Supabase migration (via MCP `apply_migration`)

- [ ] **Step 1: Tạo migration tạo 2 tables và seed data từ site.json hiện tại**

Chạy migration qua Supabase MCP:

```sql
-- Table: team_members
CREATE TABLE IF NOT EXISTS public.team_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  title       text NOT NULL DEFAULT '',
  photo       text NOT NULL DEFAULT '',
  sort_order  int  NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "team_members_public_read"
  ON public.team_members FOR SELECT
  USING (active = true);

-- Table: site_config
CREATE TABLE IF NOT EXISTS public.site_config (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Public read cho footer (key = 'footer')
CREATE POLICY "site_config_public_read"
  ON public.site_config FOR SELECT
  USING (true);

-- Seed team_members từ site.json hiện tại
INSERT INTO public.team_members (name, title, photo, sort_order) VALUES
  ('Nguyen Thi Lan',  'Art Director',     'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', 1),
  ('Tran Minh Duc',   '2D Animator',      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80', 2),
  ('Le Van Hung',     'VFX Artist',       'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', 3),
  ('Pham Thu Ha',     'Character Artist', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80', 4);

-- Seed site_config footer từ site.json hiện tại
INSERT INTO public.site_config (key, value) VALUES (
  'footer',
  '{
    "description1": "Founded in 2019, TD Games emerged from a shared passion for creating visually stunning game experiences. What started as a small team of artists has grown into a full-service game art studio trusted by developers worldwide.",
    "description2": "We believe that great art is the foundation of memorable games. Our mission is to help developers bring their creative visions to life with professional-grade assets that enhance gameplay and captivate players.",
    "socials": {
      "linkedin": "",
      "facebook": "",
      "instagram": "",
      "behance": "",
      "artstation": ""
    },
    "contacts": {
      "address": "505 Minh Khai, Hanoi, Vietnam",
      "discord": "https://discord.com",
      "email": "contact@tdgames.vn"
    }
  }'::jsonb
);
```

- [ ] **Step 2: Verify migration thành công**

```sql
SELECT id, name, title, sort_order FROM team_members ORDER BY sort_order;
SELECT key, value FROM site_config WHERE key = 'footer';
```

Expected: 4 team members + 1 footer config row.

---

## Task 2: Tạo public API `/api/team`

**Files:**
- Create: `src/app/api/team/route.ts`

- [ ] **Step 1: Tạo file route**

```typescript
// src/app/api/team/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, title, photo, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ team: data ?? [] });
}
```

- [ ] **Step 2: Test thủ công**

```bash
curl http://localhost:3000/api/team
```

Expected: `{"team":[{"id":"...","name":"Nguyen Thi Lan","title":"Art Director",...},...]}`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/team/route.ts
git commit -m "feat: public GET /api/team from Supabase team_members"
```

---

## Task 3: Cập nhật Admin API Team

**Files:**
- Modify: `src/app/api/admin/team/route.ts`

- [ ] **Step 1: Thay toàn bộ nội dung file**

```typescript
// src/app/api/admin/team/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

// GET /api/admin/team — trả về toàn bộ team (bao gồm inactive)
export async function GET(req: Request) {
  const err = requireAdmin(req);
  if (err) return err;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, title, photo, sort_order, active")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ team: data ?? [] });
}

// PUT /api/admin/team — replace toàn bộ team array
// Body: { team: Array<{ id?: string; name: string; title: string; photo: string; sort_order?: number; active?: boolean }> }
export async function PUT(req: Request) {
  const err = requireAdmin(req);
  if (err) return err;

  const body = await req.json();
  if (!Array.isArray(body.team))
    return NextResponse.json({ error: "body.team must be an array" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Xoá tất cả rows cũ rồi insert lại (simple replace strategy)
  const { error: delErr } = await supabase
    .from("team_members")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (body.team.length === 0)
    return NextResponse.json({ ok: true, count: 0 });

  const rows = body.team.map((m: { name: string; title: string; photo: string; sort_order?: number; active?: boolean }, idx: number) => ({
    name: m.name,
    title: m.title ?? "",
    photo: m.photo ?? "",
    sort_order: m.sort_order ?? idx,
    active: m.active ?? true,
  }));

  const { error: insErr } = await supabase
    .from("team_members")
    .insert(rows);

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: rows.length });
}
```

- [ ] **Step 2: Test thủ công GET**

```bash
curl -H "x-admin-key: $(grep ADMIN_SECRET .env.local | cut -d= -f2)" \
  http://localhost:3000/api/admin/team
```

Expected: JSON với `team` array 4 members.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/team/route.ts
git commit -m "feat: admin team API reads/writes Supabase instead of site.json"
```

---

## Task 4: Cập nhật Admin API Footer

**Files:**
- Modify: `src/app/api/admin/footer/route.ts`

- [ ] **Step 1: Thay toàn bộ nội dung file**

```typescript
// src/app/api/admin/footer/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

// GET /api/admin/footer
export async function GET(req: Request) {
  const err = requireAdmin(req);
  if (err) return err;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "footer")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ footer: data?.value ?? {} });
}

// PUT /api/admin/footer
export async function PUT(req: Request) {
  const err = requireAdmin(req);
  if (err) return err;

  const body = await req.json();
  if (!body.footer || typeof body.footer !== "object")
    return NextResponse.json({ error: "body.footer must be an object" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("site_config")
    .upsert({ key: "footer", value: body.footer, updated_at: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Test GET**

```bash
curl -H "x-admin-key: $(grep ADMIN_SECRET .env.local | cut -d= -f2)" \
  http://localhost:3000/api/admin/footer
```

Expected: JSON với `footer` object.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/footer/route.ts
git commit -m "feat: admin footer API reads/writes Supabase instead of site.json"
```

---

## Task 5: Cập nhật Public API Footer

**Files:**
- Modify: `src/app/api/footer/route.ts`

- [ ] **Step 1: Thay toàn bộ nội dung file**

```typescript
// src/app/api/footer/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "footer")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ footer: data?.value ?? {} });
}
```

- [ ] **Step 2: Test**

```bash
curl http://localhost:3000/api/footer
```

Expected: `{"footer":{"description1":"...","socials":{...},"contacts":{...}}}`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/footer/route.ts
git commit -m "feat: public footer API reads from Supabase site_config"
```

---

## Task 6: Cập nhật About Page

**Files:**
- Modify: `src/app/about/page.tsx` (chỉ phần `getTeam()`)

About page hiện đọc team từ `fs.readFile(site.json)` trực tiếp (SSR). Cần chuyển sang fetch qua `/api/team`.

- [ ] **Step 1: Đọc file about/page.tsx, tìm function `getTeam()`**

Hiện tại (lines 24–29):
```typescript
async function getTeam(): Promise<TeamMember[]> {
  const filePath = path.join(process.cwd(), "src", "content", "site.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  return data.team ?? [];
}
```

- [ ] **Step 2: Thay `getTeam()` và xoá import `fs`/`path` không còn dùng**

Tìm và thay hàm `getTeam`:

```typescript
async function getTeam(): Promise<TeamMember[]> {
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase-admin");
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("team_members")
      .select("id, name, title, photo")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}
```

Đồng thời xoá 2 import ở đầu file nếu không còn dùng ở chỗ khác:
```typescript
import fs from "node:fs/promises";   // xoá nếu chỉ dùng trong getTeam
import path from "node:path";         // xoá nếu chỉ dùng trong getTeam
```

Kiểm tra xem `getAbout()` có còn dùng `fs`/`path` không — nếu có thì **giữ lại** import, chỉ xoá phần trong `getTeam`.

- [ ] **Step 3: Build kiểm tra**

```bash
npm run build 2>&1 | tail -30
```

Expected: build pass, không có lỗi TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat: about page reads team from Supabase via API"
```

---

## Task 7: Push và verify production

- [ ] **Step 1: Push lên GitHub (auto-deploy)**

```bash
git push origin main
```

- [ ] **Step 2: Verify trên production sau khi deploy xong**

Mở https://www.tdgamestudio.com — kiểm tra:
- Footer hiển thị đúng contact/socials
- About page hiển thị team members
- Admin UI → tab Team: load đúng, save không bị mất sau deploy

- [ ] **Step 3: Cleanup — xoá `team[]` và `footer` khỏi site.json** *(optional, sau khi xác nhận production OK)*

```bash
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/content/site.json', 'utf8'));
delete data.team;
delete data.footer;
fs.writeFileSync('src/content/site.json', JSON.stringify(data, null, 2) + '\n');
console.log('Cleaned up site.json');
"
git add src/content/site.json
git commit -m "chore: remove team and footer from site.json (now in Supabase)"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ Team data → Supabase `team_members`
- ✅ Footer data → Supabase `site_config`
- ✅ Admin APIs cập nhật (Team + Footer)
- ✅ Public APIs cập nhật (Footer + Team)
- ✅ About page cập nhật
- ✅ Deploy không còn xoá data

**Placeholder scan:** Không có TBD/TODO — tất cả code đầy đủ.

**Type consistency:**
- `TeamMember` type dùng `{ id, name, title, photo }` nhất quán xuyên suốt
- `site_config.value` là `jsonb` → trả về trực tiếp cho footer consumer

**Lưu ý quan trọng:** `getAbout()` trong `about/page.tsx` vẫn đọc từ `site.json` (về `heroImage`, `workspace`) — đây là chủ định, chỉ migrate `team` thôi. Nếu cần migrate `about` thì tạo plan riêng.
