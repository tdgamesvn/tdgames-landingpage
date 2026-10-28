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

## HR — mail ứng viên (2026-10-26), header `x-hr-key`

- `GET /api/hr/applications/[id]/emails/draft?kind=&interview_id=&prev_scheduled_at=` → `{ mode, test_to, to, subject, text, last_sent_at }` hoặc `{ mode, test_to, error: no_email|no_test|no_schedule, message }`. `test_assignment` tạo `test_token` nếu chưa có.
- `POST /api/hr/applications/[id]/emails` `{ kind, interview_id?, subject, text, sent_by? }` → gửi qua Resend + ghi `candidate_emails`. Người nhận lấy từ DB; `HR_EMAIL_MODE` ≠ `live` ⇒ gửi về `HR_EMAIL_TEST_TO` với tiêu đề `[TEST → <email>]`.
- `GET /api/hr/applications/[id]/emails` → `{ emails }` mới nhất trước.
- Env: `RESEND_API_KEY` (bắt buộc), `HR_EMAIL_MODE`, `HR_EMAIL_TEST_TO`, `HR_EMAIL_FROM`, `HR_EMAIL_REPLY_TO`.

## HR — tài khoản & phân quyền (2026-10-27)
Auth: cookie httpOnly `hr_session` (đăng nhập tài khoản). `x-hr-key` (mật khẩu chung) vẫn nhận như vai Sếp **trong giai đoạn chuyển** — sẽ gỡ.
Mọi request ghi (POST/PATCH/PUT/DELETE) phải cùng nguồn: header `Origin` = https://tdgamestudio.com (chặn CSRF từ cdn.*).
- `POST /api/hr/auth/login {email,password}` · `POST /api/hr/auth/logout` · `GET /api/hr/auth/me` → `{user,role,roleLabel,perms,legacy}`
- `POST /api/hr/auth/forgot {email}` (luôn 200) · `GET|POST /api/hr/auth/set-password` (`?token=` / `{token,password}`)
- Chỉ Sếp: `GET|POST /api/hr/users`, `PATCH /api/hr/users/[id] {display_name?,role?,disabled?,resend_invite?,discord_user_id?,phone?}` (POST cũng nhận discord_user_id; nhận cả dạng <@id>), `PUT /api/hr/permissions {role,permission,allowed}`
- `GET /api/hr/permissions` (mọi user) · `GET /api/hr/users/leaders` (quyền jobs.assign_leader)
- Cron: `GET /api/hr/remind`, `/api/hr/interviews/remind` header `x-hr-cron-key: $HR_CRON_SECRET` (GitHub secret + VPS .env.local).
- Quyền theo vai: `src/lib/hr-permissions.ts`; phạm vi + ẩn field: `src/lib/hr-scope.ts` (Leader: job có `leader_user_id` = mình; Kế toán: status từ Interview trở đi hoặc có `offer_status`).
- Tạo tài khoản Sếp đầu tiên: `node --env-file=.env.local scripts/hr-create-boss.mjs --email … --name …` (in link đặt mật khẩu).
- Mẫu mail ứng viên (quyền `emails.templates`): `GET /api/hr/email-templates` → `{templates[{kind,label,subject,body,isDefault,updated_by,updated_at}], defaults, vars, varHelp}` · `PUT {kind,subject,body}` (400 tiếng Việt nêu tên biến sai) · `DELETE ?kind=` (về mặc định = xoá dòng). `GET /api/hr/applications/[id]/emails/draft` dùng mẫu này (lỗi đọc DB → mặc định).

### Comment @tag (2026-10-27)
- `GET /api/hr/applications/:id/mentionable` (perm `apps.comment`, 404 ngoài phạm vi) → `{ members: [{ id, display_name, role, roleLabel }] }` — tài khoản chưa khoá xem được hồ sơ, bỏ chính mình, không email.
- `POST /api/hr/applications/:id/comments` body `{ content, mentions?: uuid[] }` — server chỉ giữ id thuộc mentionable (≤20).
- `GET .../comments` mỗi comment thêm `mentions: uuid[]`, `author_role`.

### Thư mời nhận việc PDF (2026-10-28, migration `20261028010000_offer_letters` đã áp prod)
- Giới hạn chung: body > 200KB → 413 (kiểm Content-Length trước khi đọc); mỗi danh sách ≤ 15 mục, mỗi mục / trường ngắn ≤ 300 ký tự, đoạn văn ≤ 1500; số tiền 0…1e10. Tạo PDF: tối đa 2 bản cùng lúc toàn server. Xem trước (offer-letter/preview, offer-letter-defaults/preview): thêm 1 bản/người, hết slot → **429** ngay. Gửi mail offer + tải lại file đính kèm: xếp hàng chờ slot tối đa 15s; trần cứng → **429** cùng câu “Đang tạo PDF khác, thử lại sau giây lát”: 2 việc chờ/người (đang chờ + đang chạy), hàng chờ toàn server 10, hết 15s mà đã có ≥ 4 bản chạy. Render quá 20s → **503** “Tạo PDF quá lâu, thử lại”. Hạn xác nhận tự tính luôn ≤ ngày bắt đầu (ngày bắt đầu sớm → ngày bắt đầu − 1, không trước hôm nay).
- `GET /api/hr/applications/:id/offer-letter` (perm `emails.send_offer`, 404 ngoài phạm vi) → `{ data: OfferLetterData (mẫu công ty + đã lưu), saved, updated_by, updated_at, total, expected_salary }` — `expected_salary` chỉ có giá trị khi có `apps.view_salary` (tham khảo, không tự điền). `confirmBy` mặc định "" (tính lúc soạn mail).
- `PUT` cùng route, body OfferLetterData → sanitize + validate (400 tiếng Việt: thiếu tên/chức danh/ngày bắt đầu/lương cơ bản; hạn xác nhận sau ngày bắt đầu; giới hạn) → upsert.
- `POST /api/hr/applications/:id/offer-letter/preview` body OfferLetterData (chưa lưu; chỉ kiểm giới hạn) → `application/pdf` inline. Không ghi gì.
- `GET /api/hr/offer-letter-defaults` (`emails.send_offer` hoặc `emails.templates`) → `{ defaults, saved, builtin }` · `PUT` (`emails.templates`) body OfferLetterDefaults.
- `POST /api/hr/offer-letter-defaults/preview` (`emails.templates`) body OfferLetterData (thư mẫu dựng từ mẫu công ty đang sửa) → PDF inline. Không gắn hồ sơ, không ghi gì.
- `GET /api/hr/emails/:emailId/attachment?i=0` (`emails.send_offer` + phạm vi hồ sơ của mail; emailId không phải UUID → 404) → PDF sinh lại từ snapshot lúc gửi.
- Mail offer: `GET .../emails/draft?kind=offer` bắt buộc đã lưu thư (chưa → 400 `{error:"Chưa soạn thư mời…", code:"no_offer_letter"}`; thiếu trường → 400 `code:"offer_letter_invalid"`), trả thêm `attachment: { filename }` và `notice` khi hạn xác nhận đã lưu đã qua (“Hạn xác nhận đã qua — đã tự đổi thành …”, tính lại = hôm nay giờ VN + 3 ngày làm việc). `{muc_luong}` luôn “…”. `POST .../emails` kind offer: đọc lại thư đã lưu → render PDF → Resend `attachments` (base64) → ghi `candidate_emails.attachments`. `GET .../emails` trả `attachments: [{filename, kind}]` (không snapshot).
