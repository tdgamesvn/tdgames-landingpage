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

Follow-up phát hiện thêm (cùng ngày):
- `.github/workflows/deploy.yml` đã tự deploy khi push lên `main` (SSH → `npm run build` →
  `pm2 restart`), KHÔNG cần build tay trên VPS.
- 2 lần auto-deploy sau đó fail với lỗi `⨯ Another next build process is already running` —
  do tôi (agent) đã SSH build tay trên VPS trong lúc debug, để lại lock file build dở dang,
  làm nghẽn lần build kế tiếp của workflow.
- **Quy tắc rút ra: KHÔNG SSH build tay trên VPS nữa.** Chỉ `git push` và để
  `.github/workflows/deploy.yml` tự chạy; dùng `gh run list/watch --workflow=deploy.yml` để
  theo dõi thay vì SSH vào build thủ công.

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

## 2026-07-31 — Blog AI: radar tự động, KHÔNG tự đăng
Sếp muốn AI tự tìm tin viral → viết bài → sinh ảnh → đăng. Chốt lại kiến trúc lai:
AI làm radar + thợ dựng bài, CEO chốt đề tài và góp góc nhìn thật.

Lý do từ chối full-auto:
1. **Ảnh AI phản chủ** — TD Games bán dịch vụ artist vẽ tay. Blog minh hoạ bằng
   ảnh generate = tự tuyên bố thay artist bằng máy, mất cả khách lẫn ứng viên.
   Dùng artwork sẵn có trong `media_assets` thay thế.
2. **Viết lại tin viral không mang giá trị** — người quan tâm đã đọc nguồn gốc.
3. **Google phạt scaled content abuse ở cấp domain** — kéo theo `/services/*`.

Kênh: dùng Discord (đã có bot `tdgames-discord` chạy 24/7 + 2 webhook + AI env),
KHÔNG dựng app mới, KHÔNG thêm bot Telegram. Chat để chọn đề tài; `/admin` tab
Blog vẫn là nơi soạn/duyệt/đăng — không nhét editor vào chat.

## 2026-08-01 — Phụ lục 07-31: ảnh AI được mở hẹp, chỉ nền/trừu tượng
Sếp chốt nới lệnh cấm ảnh AI ở entry 2026-07-31, nhưng chỉ nới một phần:

- **Được:** nền, texture, gradient, sơ đồ khái niệm minh hoạ blog.
- **Cấm:** character, mascot, portrait, art asset — phải do artist vẽ.

Lý do giữ ranh giới: lập luận thương hiệu ở 07-31 (TD Games bán artist vẽ tay,
minh hoạ bằng character AI = tự tuyên bố thay artist bằng máy) chỉ đúng với
character. Ảnh nền trừu tượng không cạnh tranh với thứ studio đang bán.

Cưỡng chế bằng code, không bằng niềm tin: `src/app/api/admin/generate-image/route.ts`
có regex `BANNED` chặn prompt character → 400, và append `STYLE_SUFFIX` vào mọi
prompt hợp lệ. Muốn đổi phạm vi thì sửa 2 hằng số đó, và sửa entry này.

Ảnh AI lưu như media_assets row bình thường (`source_type: external`, host R2),
phân biệt bằng `ai_prompt not null` → luôn biết ảnh nào là máy vẽ.

## 2026-08-02 — Ảnh AI tự sinh thẳng trong bài blog (nới tiếp 08-01)
Sếp: "tự render ảnh AI trong bài viết, tôi sẽ replace lại nếu cần". Ranh giới
nội dung ảnh KHÔNG đổi (vẫn cấm character — regex `BANNED`), chỉ đổi ai bấm nút:
trước là sếp tự gọi `/api/admin/generate-image`, giờ luồng dựng bài tự sinh
**1 cover + tối đa 3 ảnh trong bài**.

Cưỡng chế: prompt `DRAFT_PROMPT` bắt AI xuất placeholder `![alt](ai:prompt)`;
route resolve qua `generateAiImage()` — cùng regex `BANNED` + `STYLE_SUFFIX`, nên
AI không có đường lách. Prompt dính từ cấm ⇒ ảnh đó bị bỏ, không phải cả bài.

Fail-soft là bắt buộc: ảnh lỗi (AI backend chết / timeout 120s / prompt cấm) →
bỏ ảnh, bài vẫn lưu draft, trả `imageErrors[]` cho UI báo. Không bao giờ vứt
bài đã viết vì hỏng ảnh. (Sếp không trả lời 2 câu hỏi hướng đi → chọn mặc định
an toàn; muốn cover để trống như cũ thì bỏ `cover_prompt` trong prompt.)

Tách `src/lib/ai-image.ts` khỏi route để dùng chung — route generate-image giờ
chỉ là vỏ auth + map status.

## 2026-08-03 — Ảnh AI blog: bỏ hết giới hạn nội dung
Đảo ngược ranh giới ở entry 2026-07-31 và phụ lục 2026-08-01. Sếp chốt: **AI tự
quyết ảnh, bất kỳ nội dung gì miễn hợp bài viết** — kể cả character.

Đã xoá khỏi code:
- `BANNED` / `BANNED_UI` regex trong `src/lib/blog-ai.ts` (chặn character, art
  asset, UI/bảng giá) — xoá hẳn, không còn ai import.
- `STYLE_SUFFIX` trong `src/lib/ai-image.ts` (ép palette near-black + cấm
  character/chữ/UI) — prompt giờ đi thẳng tới generator, nguyên văn.
- Khối test `BANNED_UI` trong `scripts/test-blog-ai.mjs`.

Định hướng còn lại nằm ở `DRAFT_PROMPT` (`api/admin/blog/topics/route.ts`), dạng
**mềm** — AI đè được: ưu tiên ảnh cụ thể thay vì ẩn dụ, giữ một style xuyên bài,
nền tối hợp layout, và một cảnh báo (không phải lệnh cấm) rằng generator render
chữ rất tốt nên sẽ bịa giá/nhãn sai nếu prompt đòi chữ.

Lý do chấp nhận rủi ro thương hiệu ở 07-31 ("bán artist vẽ tay mà minh hoạ bằng
character AI = tự nói máy thay được artist"): sếp cân nhắc và chọn đổi. Chốt chặn
còn lại là con người — route luôn insert `published: false`, mọi bài phải qua tay
sếp duyệt ở /admin trước khi lên production.
