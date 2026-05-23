# SCHEMA.md — Database Schema

_Cập nhật: 2026-05-23 (verified từ Supabase MCP)_

---

## Supabase Project

- **URL:** `https://zjunfcyymesfpeikspzf.supabase.co`
- **Region:** (default)
- **Migrations applied:** 2

---

## Table: `public.media_assets`

**Rows:** 210 | **RLS:** ✅ Enabled

| Column | Type | Nullable | Default | Ghi chú |
|--------|------|----------|---------|---------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `kind` | text | NO | — | CHECK: `image`, `video`, `gif`, `other` |
| `source_type` | text | NO | — | CHECK: `local_public`, `external` |
| `original_url` | text | NO | — | UNIQUE |
| `current_url` | text | NO | — | URL đang được dùng |
| `r2_key` | text | YES | — | Key trong R2 bucket |
| `r2_url` | text | YES | — | Public CDN URL từ R2 |
| `status` | text | NO | `'active'` | CHECK: `active`, `archived` |
| `used_by` | jsonb | NO | `'[]'` | Danh sách files/components dùng asset |
| `created_at` | timestamptz | NO | `now()` | |
| `updated_at` | timestamptz | NO | `now()` | Auto-update qua trigger |

**Trigger:** `set_media_assets_updated_at` — auto update `updated_at`
⚠️ Warning: `search_path` chưa được set (security lint)

**Data snapshot (2026-05-23):**
- `local_public` active: 108
- `external` active: 102
- Total: 210

---

## Table: `public.projects`

**Rows:** 1 | **RLS:** ✅ Enabled

| Column | Type | Nullable | Default | Ghi chú |
|--------|------|----------|---------|---------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `title` | text | NO | — | Tên project |
| `subtitle` | text | NO | `''` | Phụ đề |
| `image` | text | NO | — | Cover URL |
| `slug` | text | NO | — | UNIQUE — dùng cho URL |
| `category` | text | NO | — | Ví dụ: "2D Art" |
| `created_at` | timestamptz | NO | `timezone('utc', now())` | |
| `updated_at` | timestamptz | NO | `timezone('utc', now())` | Auto-update qua trigger |

**Trigger:** `set_updated_at_projects` — auto update `updated_at`
⚠️ Warning: `search_path` chưa được set (security lint)

**Data hiện có:**
- `admin-flow-test` — "Admin Flow Test" — 2D Art (test record, tạo 2026-05-22)

---

## Migrations

| Version | Tên | Ngày |
|---------|-----|------|
| 20260522072615 | media_assets_schema | 2026-05-22 |
| 20260522164000 | projects_schema | 2026-05-22 |

Files: `supabase/migrations/`

---

## Security Issues cần fix

### 1. `public.set_media_assets_updated_at` — search_path mutable
### 2. `public.set_updated_at_projects` — search_path mutable

**Fix:** Thêm `SET search_path = public` vào function definition.

```sql
-- Template fix cho mỗi function
CREATE OR REPLACE FUNCTION public.set_media_assets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

Ref: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

---

## API Access

```typescript
// Client-side (anon)
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side (service role)
// Xem: src/lib/supabase-admin.ts
```
