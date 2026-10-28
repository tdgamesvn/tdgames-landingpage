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

## `candidate_emails` (2026-10-26)

Mail HR gửi ứng viên từ /hr (Resend, `hr@tdgamestudio.com`). RLS bật, chỉ service role.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid pk | |
| `application_id` | uuid fk applications, cascade | |
| `interview_id` | uuid fk interview_sessions, set null | vòng PV liên quan |
| `kind` | text | `interview_invite`, `interview_reschedule`, `interview_cancel`, `test_assignment`, `rejection` |
| `to_email` | text | email ứng viên |
| `sent_to` | text | địa chỉ thực gửi (test mode → hộp nội bộ) |
| `test_mode` | bool | |
| `subject`, `body_text`, `body_html` | text | nội dung đã gửi |
| `resend_id` | text null | id Resend |
| `sent_by` | text null | tên HR (localStorage `tdg.hr.comment.author`) |
| `created_at` | timestamptz | |

## Tài khoản HR (2026-10-27, migration `20261027000000_hr_accounts`, đã áp prod)
- `hr_users` (email lower-case unique, display_name, role boss|hr|leader|accountant, password_hash scrypt, disabled, last_login_at, discord_user_id (17–20 số, để tag <@id> — migration 20261027010000), phone (9–13 số, migration 20261028000000))
- `hr_sessions` (token_hash sha256 PK, user_id, expires_at 30 ngày) · `hr_user_tokens` (invite 7 ngày | reset 1 giờ, used_at)
- `hr_role_permissions` (role hr|leader|accountant, permission, allowed) — chỉ lưu ô khác mặc định
- Cột mới: `jobs.leader_user_id`, `applications.offer_status` (pending|accepted|declined) + `offer_status_at`, `application_comments.author_user_id`, `candidate_emails.cc_emails` + `sent_by_user_id` + kind `offer`, `hr_push_subscriptions.user_id`

## Mẫu mail ứng viên (2026-10-27, migration `20261027020000_hr_email_templates` — chưa áp prod)
- `hr_email_templates` (kind PK ∈ 6 loại mail ứng viên, subject, body, updated_by text, updated_by_user_id → hr_users ON DELETE SET NULL, updated_at). RLS bật, không policy. Không có dòng = mẫu mặc định trong `src/lib/hr-email-templates.ts`.

- `application_comments.mentions uuid[] not null default '{}'` — id hr_users được @tag (migration 20261027030000, chưa áp prod).

## Thư mời nhận việc (2026-10-28, migration `20261028010000_offer_letters` — ĐÃ ÁP prod 2026-10-28)
- `offer_letters` (application_id PK → applications ON DELETE CASCADE, data jsonb = `OfferLetterData` (`src/lib/offer-letter.ts`), updated_by text, updated_by_user_id → hr_users ON DELETE SET NULL, updated_at). RLS bật, không policy (có lương).
- `candidate_emails.attachments jsonb not null default '[]'` — `[{ filename, kind: "offer_letter", snapshot: OfferLetterData }]`; PDF không lưu đâu cả, sinh lại từ snapshot. API lịch sử mail luôn chỉ trả `{filename, kind}` (snapshot có lương không bao giờ ra client).
- `app_settings` key `offer_letter_defaults` = JSON `OfferLetterDefaults` (mẫu công ty); thiếu → `DEFAULT_OFFER_LETTER_DEFAULTS`.

## Người phụ trách + mã ref (2026-10-28, migration `20261028020000_assignee_ref_codes` — CHƯA áp prod)
- `hr_users.ref_codes text[] not null default '{}'` — mã giới thiệu đã chuẩn hoá (`normalizeRefCode`, `src/lib/hr-ref-codes.ts`: bỏ dấu, đ→d, lowercase, [a-z0-9-]); phần tử đầu = mã chính. ≤10 mã × ≤40 ký tự; 1 mã chỉ thuộc 1 tài khoản (kiểm ở API → 409, không có ràng buộc DB).
- `applications.assignee_user_id uuid → hr_users(id) ON DELETE SET NULL` + index `applications_assignee_user_id_idx` — người phụ trách (nhận mọi thông báo của hồ sơ). Hồ sơ mới có `?ref=` khớp mã tài khoản (chưa khoá) → `referred_by` = mã chính + `assignee_user_id` = chủ mã.
- Backfill: `scripts/hr-backfill-ref.mjs` (dry-run mặc định, `--apply` ghi) — đặt ref_codes cho Phương/Dung/Toàn + chuẩn hoá referred_by + giao người phụ trách.

