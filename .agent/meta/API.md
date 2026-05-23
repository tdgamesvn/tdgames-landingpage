# API.md — API Routes

_Cập nhật: 2026-05-23_

Base URL dev: `http://localhost:3000`

---

## Auth

Tất cả admin routes yêu cầu header:
```
x-admin-key: <ADMIN_SECRET>
```
`ADMIN_SECRET` = env var. Local test đã dùng: `tdg-test-secret` (**phải rotate trước production**)

---

## Projects API

### `GET /api/projects`
Lấy danh sách projects từ Supabase.

### `POST /api/projects`
Tạo project mới.
```json
{ "title": "...", "subtitle": "...", "image": "...", "slug": "...", "category": "..." }
```

### `PATCH /api/projects`
Cập nhật project (theo `id` hoặc `slug`).

### `DELETE /api/projects`
Xóa project.

---

## Media — Upload

### `POST /api/admin/upload`
Upload file lên Cloudflare R2.
- Header: `x-admin-key`
- Body: `multipart/form-data` với field `file`
- Response: `{ url, r2Key, ... }`

---

## Media — Management

### `GET /api/admin/media`
Lấy danh sách media assets từ Supabase.

### `POST /api/admin/media/external-scan`
Scan tất cả files tìm URLs external (không phải R2/local).
```bash
curl -X POST http://localhost:3000/api/admin/media/external-scan \
  -H "x-admin-key: $ADMIN_KEY"
```

### `POST /api/admin/media/migrate`
Migrate assets `local_public` → R2.
```bash
curl -X POST http://localhost:3000/api/admin/media/migrate \
  -H "x-admin-key: $ADMIN_KEY"
```

### `POST /api/admin/media/promote-r2`
Promote: set `current_url = r2_url` cho các assets đã upload R2.
```bash
curl -X POST http://localhost:3000/api/admin/media/promote-r2 \
  -H "x-admin-key: $ADMIN_KEY"
```

### `GET|POST /api/admin/media/mapping`
Xem/cập nhật mapping giữa old URL và new URL.

### `POST /api/admin/media/cleanup-external`
Xóa/archive external assets không còn dùng.
```bash
curl -X POST http://localhost:3000/api/admin/media/cleanup-external \
  -H "x-admin-key: $ADMIN_KEY"
```

### `POST /api/admin/media/replace-run`
Chạy bulk replace script (dry-run / apply / rollback) qua API.
```bash
# Dry run
curl -X POST http://localhost:3000/api/admin/media/replace-run \
  -H "content-type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d '{"mode":"dry-run"}'

# Apply
curl -X POST http://localhost:3000/api/admin/media/replace-run \
  -H "content-type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d '{"mode":"apply"}'

# Rollback
curl -X POST http://localhost:3000/api/admin/media/replace-run \
  -H "content-type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d '{"mode":"rollback"}'
```

---

## List Images

### `GET /api/list-images`
Lấy danh sách ảnh (public).

---

## Bulk Replace Script (CLI)

```bash
# Dry run (default)
ADMIN_KEY="..." node scripts/replace-media-urls.mjs

# Apply changes (tạo .media-replace-backup.json)
ADMIN_KEY="..." node scripts/replace-media-urls.mjs --apply

# Rollback từ backup
ADMIN_KEY="..." node scripts/replace-media-urls.mjs --rollback
```

Kết quả gần nhất: changedFiles=22, changedRefs=178
