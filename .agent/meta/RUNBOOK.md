# RUNBOOK.md — Operational Commands

_Cập nhật: 2026-05-23_

---

## Dev

```bash
# Install dependencies
npm install

# Dev server → http://localhost:3000
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

---

## Supabase CLI

```bash
# Xem trạng thái local
supabase status

# Áp dụng migration mới
supabase db push

# Tạo migration mới
supabase migration new <ten_migration>

# Link project
supabase link --project-ref zjunfcyymesfpeikspzf
```

---

## Media Pipeline — Thứ tự thực hiện

```bash
# 1. Scan external URLs trong codebase
curl -X POST http://localhost:3000/api/admin/media/external-scan \
  -H "x-admin-key: $ADMIN_KEY"

# 2. Migrate local_public assets lên R2
curl -X POST http://localhost:3000/api/admin/media/migrate \
  -H "x-admin-key: $ADMIN_KEY"

# 3. Promote r2_url → current_url
curl -X POST http://localhost:3000/api/admin/media/promote-r2 \
  -H "x-admin-key: $ADMIN_KEY"

# 4. Cleanup external URLs cũ
curl -X POST http://localhost:3000/api/admin/media/cleanup-external \
  -H "x-admin-key: $ADMIN_KEY"

# 5. Bulk replace URLs trong source code (dry-run trước)
ADMIN_KEY="..." node scripts/replace-media-urls.mjs
ADMIN_KEY="..." node scripts/replace-media-urls.mjs --apply
```

---

## Admin UI

URL: http://localhost:3000/admin
Key cần nhập: giá trị của `ADMIN_SECRET` trong `.env.local`

---

## Git

```bash
# Check status
git status
git log --oneline -10

# Push lên GitHub
git push origin main
```

---

## Environment Variables

File: `.env.local` (không commit)

```env
ADMIN_SECRET=<rotate-before-production>

NEXT_PUBLIC_SUPABASE_URL=https://zjunfcyymesfpeikspzf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret>
R2_BUCKET_NAME=<bucket-name>
R2_PUBLIC_URL=https://pub-97eae399068b4753bb314896c009c27e.r2.dev
```

---

## Checklist trước khi Deploy Production

- [ ] Rotate `ADMIN_SECRET` (bỏ `tdg-test-secret`)
- [ ] Fix security warnings — `search_path` trong 2 trigger functions (xem SCHEMA.md)
- [ ] Migrate nốt 102 external assets lên R2
- [ ] Set env vars production trên VPS/Cloudflare Pages
- [ ] Trỏ domain `tdgames.vn` → Cloudflare DNS
- [ ] Enable Cloudflare SSL Full (strict)
- [ ] Test build: `npm run build` pass
- [ ] Lighthouse score ≥ 90
