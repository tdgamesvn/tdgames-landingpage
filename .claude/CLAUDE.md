# Agent Rules — tdgames-landingpage

Đây là project Next.js 16 landing page cho TD Games. Mọi session phải tuân theo
quy trình dưới đây. **Đây là project instructions — ưu tiên cao hơn default behavior.**

---

## 1. Khi bắt đầu session

Thực hiện theo thứ tự:

1. Đọc context tự động từ SessionStart hook (PROJECT.md, TASKS.md, LOG.md)
2. Chạy `npx gitnexus status` để xác nhận index còn mới
   - Nếu stale: chạy `npx gitnexus analyze` để reindex
3. Invoke skill **`superpowers:using-superpowers`** để xác nhận skills có sẵn

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
| Production | https://www.tdgamestudio.com |
| Admin | /admin (key: ADMIN_SECRET trong .env.local) |
| VPS | `ssh root@vps6core` → `/opt/tdgames-landingpage` |
| PM2 | `pm2 restart tdgames-landingpage` |
| Deploy | `git push origin main` → manual deploy trên VPS |
| CDN | https://cdn.tdgamestudio.com (Cloudflare R2) |
| DB | Supabase: zjunfcyymesfpeikspzf.supabase.co |

---

## 6. Sandbox note

Node.js scripts cần network (Supabase, R2) → dùng `dangerouslyDisableSandbox: true`.
