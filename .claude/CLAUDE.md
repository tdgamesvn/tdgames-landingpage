# Agent Rules — tdgames-landingpage

Next.js 16 App Router landing page cho TD Games Studio. Production: https://tdgamestudio.com

**Stack:** Next.js 16, Tailwind v4 (CSS variables, không có tailwind.config.js), TypeScript, Supabase (PostgreSQL), Cloudflare R2 CDN (`cdn.tdgamestudio.com`), Framer Motion, PM2 trên VPS.

---

## Task hiện tại (đọc `.agent/meta/TASKS.md` để biết chi tiết)

**Next priority — Careers feature:**
- DB: `jobs` + `applications` tables (Supabase migration chưa tạo)
- Public API: `GET /api/jobs`, `POST /api/applications`
- Admin API: `CRUD /api/admin/jobs`, `GET+PATCH /api/admin/applications`
- Careers page: đọc DB, job detail panel + apply form inline
- Admin tab "7. Careers"
- Telegram notification khi có ứng viên mới

**Tasks nhỏ còn lại:** Blog content thật, Team ảnh/tên thật, About workspace ảnh thật.

---

## 1. Khi bắt đầu session

Thực hiện theo thứ tự:

1. Đọc `.agent/meta/LOG.md` (entry cuối = context session trước)
2. Đọc `.agent/meta/TASKS.md` (xem Doing trước, rồi To do)
3. Chạy `npx gitnexus status` để xác nhận index còn mới
   - Nếu stale: chạy `npx gitnexus analyze` để reindex
4. Invoke skill **`superpowers:using-superpowers`** để xác nhận skills có sẵn

---

## 2. Trước khi làm bất kỳ việc gì

### Mọi request đều phải:
- Kiểm tra xem có skill nào phù hợp không → **invoke skill ngay, không do dự**
- Nếu 1% khả năng skill liên quan → vẫn invoke

### Skill mapping chuẩn:

| Tình huống | Skill |
|-----------|-------|
| Thêm feature / component mới | `superpowers:brainstorming` trước |
| Gặp bug / lỗi bất ngờ | `superpowers:systematic-debugging` |
| Sắp implement plan | `superpowers:executing-plans` |
| Cần plan trước | `superpowers:writing-plans` |
| Claim xong / sắp commit | `superpowers:verification-before-completion` |
| Nhận code review | `superpowers:receiving-code-review` |
| Cần isolate feature | `superpowers:using-git-worktrees` |
| Cần chạy nhiều agent song song | `superpowers:dispatching-parallel-agents` |
| Cần xây frontend | `frontend-design:frontend-design` |

---

## 3. Trong khi làm việc (GitNexus workflow)

Trước khi sửa bất kỳ function / class / component nào:

```bash
npx gitnexus impact <tên-function-hoặc-file>
```

Điều này cho thấy những file nào bị ảnh hưởng và tránh phá vỡ dependencies.

**Quy tắc:**
- Di chuyển task sang **Doing** trong `TASKS.md` TRƯỚC khi bắt đầu
- Giữ thay đổi nhỏ, có thể revert, dễ review
- Ưu tiên edit file có sẵn, không tạo file mới nếu không cần

---

## 4. Cuối session — BẮT BUỘC cập nhật memory

Sau mỗi lần làm việc có code thay đổi:

```bash
# Kiểm tra scope thay đổi
npx gitnexus detect-changes
```

Sau đó cập nhật ngay:
- **`.agent/meta/LOG.md`** — append entry mới: Task / Work Done / Result / Next Step
- **`.agent/meta/TASKS.md`** — chuyển task Done, thêm task mới nếu phát sinh
- **`.agent/meta/DECISIONS.md`** — chỉ khi có quyết định kỹ thuật mới, lâu dài

**Không commit code nếu chưa cập nhật memory.**

---

## 5. Thông tin project nhanh

| Item | Giá trị |
|------|---------|
| Dev URL | http://localhost:3000 |
| Production | https://tdgamestudio.com |
| Admin | /admin (key: ADMIN_SECRET trong .env.local) |
| VPS | `ssh root@vps6core` → `/opt/tdgames-landingpage` |
| PM2 | `pm2 restart tdgames-landingpage` |
| Deploy | `git push origin main` → manual deploy trên VPS |
| CDN | https://cdn.tdgamestudio.com (Cloudflare R2) |
| DB | Supabase: zjunfcyymesfpeikspzf.supabase.co |

---

## 6. Sandbox note

Node.js scripts cần network (Supabase, R2) → dùng `dangerouslyDisableSandbox: true`.
