# TDG LandingPage — Implementation Summary (Latest)

## 1) Trạng thái tổng quan
- Backend landing page đã dùng Supabase (không còn mock cho API `projects`).
- Media pipeline đã chạy qua Cloudflare R2.
- Admin UI đã refactor thành wizard 3 bước dễ dùng.
- Đã có hardening cho external scan + cleanup + bulk replace rollback.

---

## 2) Admin UI hiện tại (điểm quan trọng nhất)
File: `src/app/admin/page.tsx`

UI được tổ chức theo 3 tab:
1. **Upload Asset**
   - Upload file mới.
   - Replace file cho media đã có.
   - Hiển thị URL mới + nút Copy URL.
   - Có preview ảnh/video.
   - Có **Media Preview List**: preview từng asset + `used_by` + nút `Pick for replace`.

2. **Attach to Project**
   - Chọn project.
   - Dán/chọn cover URL.
   - Save để cập nhật cover cho project.
   - Có phần Create Project ngay trong tab này.

3. **Bulk Replace**
   - Chạy `Dry run` / `Apply` / `Rollback`.
   - Có confirm trước `Apply`.
   - Hiển thị JSON output sau khi chạy.

---

## 3) Admin key là gì
- Admin routes validate header `x-admin-key` với env `ADMIN_SECRET`.
- Bạn phải nhập trong UI giá trị trùng `ADMIN_SECRET` của process đang chạy.
- Trong phiên local gần nhất đã test bằng: `tdg-test-secret`.

---

## 4) API/Script quan trọng

### Projects
- `src/app/api/projects/route.ts`
  - `GET/POST/PATCH/DELETE`

### Media admin
- `src/app/api/admin/upload/route.ts`
- `src/app/api/admin/media/route.ts`
- `src/app/api/admin/media/migrate/route.ts`
- `src/app/api/admin/media/external-scan/route.ts`
- `src/app/api/admin/media/promote-r2/route.ts`
- `src/app/api/admin/media/mapping/route.ts`
- `src/app/api/admin/media/cleanup-external/route.ts`
- `src/app/api/admin/media/replace-run/route.ts` (**mới**) — wrapper chạy bulk replace script từ UI

### Bulk replace script
- `scripts/replace-media-urls.mjs`
  - mặc định dry-run
  - `--apply`
  - `--rollback`
  - khi apply tạo `.media-replace-backup.json`
  - yêu cầu `ADMIN_KEY` env (đã bỏ fallback hardcode)

---

## 5) Migration đã áp dụng

### Media table
- `supabase/migrations/20260522072615_media_assets_schema.sql`

### Projects table (đã fix lỗi thiếu bảng)
- `supabase/migrations/20260522164000_projects_schema.sql` (**mới**)
  - tạo `public.projects`
  - unique `slug`
  - index `category`, `created_at`
  - trigger auto update `updated_at`

---

## 6) Kết quả đã verify
- Build pass (`npm run build`).
- `/api/admin/media/replace-run` dry-run hoạt động.
- `/api/admin/media` hoạt động.
- `/api/projects` đã hoạt động sau khi tạo migration `projects`.
- Đã tạo test project thành công qua API.

Media inventory (sau cleanup/hardening):
- total: **210**
- local_public: **108**
- external: **102**

Bulk replace run gần nhất:
- changedFiles: **22**
- changedRefs: **178**

---

## 7) Runbook nhanh

Start app:
```bash
npm run dev
```

External scan:
```bash
curl -X POST http://localhost:3000/api/admin/media/external-scan -H "x-admin-key: $ADMIN_KEY"
```

Migrate local -> R2:
```bash
curl -X POST http://localhost:3000/api/admin/media/migrate -H "x-admin-key: $ADMIN_KEY"
```

Promote current_url -> r2_url:
```bash
curl -X POST http://localhost:3000/api/admin/media/promote-r2 -H "x-admin-key: $ADMIN_KEY"
```

Cleanup external noise:
```bash
curl -X POST http://localhost:3000/api/admin/media/cleanup-external -H "x-admin-key: $ADMIN_KEY"
```

Bulk replace script trực tiếp:
```bash
ADMIN_KEY="$ADMIN_KEY" node scripts/replace-media-urls.mjs
ADMIN_KEY="$ADMIN_KEY" node scripts/replace-media-urls.mjs --apply
ADMIN_KEY="$ADMIN_KEY" node scripts/replace-media-urls.mjs --rollback
```

Bulk replace qua API (UI dùng route này):
```bash
curl -X POST http://localhost:3000/api/admin/media/replace-run \
  -H "content-type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d '{"mode":"dry-run"}'
```

---

## 8) Ghi chú khi mở lại phiên sau
- Nếu preview PNG nào vẫn không hiện, kiểm tra `current_url` của item đó trong Media Preview List.
- Nếu `/api/projects` lỗi lại, kiểm tra Supabase project đã nhận migration `20260522164000_projects_schema.sql` chưa.
- Nên rotate secret/test key trước khi deploy production.

Last updated: 2026-05-22
