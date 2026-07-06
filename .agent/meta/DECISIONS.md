# DECISIONS

## 2026-07-06 — Pre-push type-check hook (chặn build fail lên prod)
Decision:
- Thêm `npm run typecheck` (`tsc --noEmit`) + git hook `.githooks/pre-push`, bật qua
  `git config core.hooksPath .githooks`.

Reason:
- Prod 500 ngày 2026-07-06: commit thiếu 1 field trong `STATUS_COLORS` khiến `npm run build`
  fail type-check giữa chừng → deploy trên VPS build lỗi, `.next/static` bị ghi đè dở dang.
- `.github/workflows/deploy.yml` đã có `npm run build` + `set -e` (chặn deploy nếu build lỗi),
  nhưng không chặn được nếu ai đó SSH build tay trên VPS (đúng thứ đã gây ra bug này).
- Chặn sớm nhất có thể (trước khi push) rẻ hơn debug prod.

Impact:
- `core.hooksPath` là git config **local** (không nằm trong repo) → máy mới clone phải tự chạy
  lại `git config core.hooksPath .githooks` một lần (không có gì tự động enforce).
- Bypass: `git push --no-verify`.

---

## 2026-05-22 — Next.js thay vì Astro
Decision:
- Dùng Next.js 16 (App Router) thay vì Astro như kế hoạch ban đầu.

Reason:
- Cần API routes (admin, media management, Supabase)
- Admin UI cần React interactivity (Framer Motion, tab, upload)
- Team đã quen React/Next.js hơn Astro

Impact:
- Dev server port 3000 (không phải 4321)
- Deploy cần Node.js runtime (không phải pure static)
- Cần giữ Cloudflare Workers / VPS (không chỉ Pages static)

---

## 2026-05-22 — Tailwind CSS v4
Decision:
- Dùng Tailwind v4 (`@tailwindcss/postcss`) thay vì v3.

Reason:
- Latest; `@import "tailwindcss"` syntax mới, không cần `tailwind.config.js` phức tạp
- CSS variables first (`@theme inline`)

Impact:
- Config qua CSS variables trong `globals.css` thay vì `tailwind.config.mjs`
- Một số plugin v3 không tương thích

---

## 2026-05-22 — Cloudflare R2 cho media
Decision:
- Dùng Cloudflare R2 (S3-compatible) làm object storage cho media.

Reason:
- Free egress (không tốn bandwidth fee)
- CDN gần VN tốt
- Tích hợp với Cloudflare DNS/proxy hiện có

Impact:
- AWS SDK client (`@aws-sdk/client-s3`) để connect R2
- Public URL bucket: `pub-97eae399068b4753bb314896c009c27e.r2.dev`
- next.config.ts phải whitelist hostname này

---

## 2026-05-22 — Supabase cho DB
Decision:
- Dùng Supabase (PostgreSQL) cho `media_assets` và `projects` tables.

Reason:
- Đã dùng trong tdgames-platforms, không cần setup mới
- Admin key auth đơn giản qua `x-admin-key` header

Impact:
- Cần env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Migrations phải apply trước khi chạy app

---

## 2026-05-22 — Content còn hardcode trong component (tạm thời)
Decision:
- Chấp nhận mock data hardcode trong components trong giai đoạn đầu.

Reason:
- Nhanh hơn để build UI trước, tách content sau
- Team nhỏ (2 người), Git workflow đủ dùng

Impact:
- Cần task "Tách content → content/site.json" sau khi UI ổn định
- Xem plan.md để biết schema dự kiến
