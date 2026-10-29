# DECISIONS

## 2026-09-06 — Kiến trúc trang /tools: chia tool theo nơi chạy, không theo chức năng
Decision:
- Mỗi tool khai báo `runsOn: "browser" | "server"` trong `src/app/tools/tools.ts`.
  Đây là trục phân loại quan trọng nhất, không phải tag Image/Spine/VFX.
  - `browser` → chạy trên máy user, 0đ, **không thể** đếm lượt dùng ⇒ free vô hạn.
  - `server` → tốn CPU/GPU ⇒ **bắt buộc** qua `/api/tools/<slug>`, và chỉ lớp này
    mới cần login + quota.
- **Mọi trang tool là server component.** Widget tương tác tách thành client
  component con. Không được `"use client"` cả trang.
- Registry = một mảng literal. Không plugin loader, không DB, không config-driven.

Why:
- Quota/login là yêu cầu của sếp, nhưng nó **vật lý không áp được** lên tool chạy
  client-side. Nếu không phân loại từ đầu thì sẽ hứa quota cho tool không đếm được.
- Trang tool tồn tại để hút SEO. `"use client"` toàn trang = Google đọc trang rỗng
  = mất luôn lý do làm trang này.
- Gom mọi tool server vào một prefix `/api/tools/` ⇒ sau này gắn auth + rate limit
  sửa đúng một chỗ, không đụng tool nào.

Alternatives rejected:
- **Bảng `tools` trong Supabase + admin tab**: thêm CRUD + migration cho thứ mỗi
  vài tháng đổi một lần. Sửa 1 dòng trong mảng nhanh hơn. Cân nhắc lại khi >5 tool live.
- **Làm login/quota ngay từ giờ**: chưa có tool server nào tồn tại. Xây quota cho
  0 tool là đoán mò yêu cầu.
- **Component `<ToolLayout>` dùng chung**: chưa có tool nào để biết chúng giống nhau
  ở đâu. Trừu tượng hoá khi có tool thứ 3, không phải tool thứ 0.

Note: login sau này dùng **Supabase Auth + Google provider** (repo đã có Supabase,
không thêm dependency; hiện `/admin` + `/hr` chỉ dùng header `ADMIN_SECRET`, chưa
có auth user nào). Compute nặng dự kiến chạy trên Mac mini riêng 24/7, **không**
đặt trên VPS 6core — VPS đang chạy 11 app, tool nặng sẽ kéo sập cả tdgamestudio.com.

## 2026-08-17 — Đa dạng cover blog ép bằng CODE, không nhờ AI tự nhớ
Decision:
- `COVER_RULES` (const) → `coverRules()` (function) trong `src/lib/blog-ai.ts`.
  Mỗi lần gọi bốc ngẫu nhiên 1/7 archetype bố cục + 1/6 accent palette, đưa vào
  prompt dưới dạng "MANDATORY FOR THIS POST", không phải gợi ý.
- Gỡ luật "prefer a living hero subject, large and centred" — chính nó ép ra
  chân dung nhân vật cho mọi bài.

Reason:
- 8/8 cover trên /blog giống hệt nhau. Luật cũ mô tả một bố cục cụ thể (nhân vật
  cartoon giữa khung + rim light amber + nền tối) rồi bảo AI "hãy đa dạng" —
  mâu thuẫn, và AI luôn nghe cái cụ thể.
- Không có state giữa các bài: mỗi bài là một AI call độc lập, không thấy cover
  bài trước → mọi lời khuyên "vary between posts" là vô nghĩa. Ràng buộc đa dạng
  phải nằm ở tầng code, nơi duy nhất có thể tạo khác biệt.

Impact:
- Không đảo ngược quyết định 2026-08-03 (AI vẫn tự do chọn NỘI DUNG ảnh); chỉ
  ép trục BỐ CỤC + MÀU, là hai trục đang bị kẹt.
- Random không nhớ lịch sử → ~1/7 khả năng trùng archetype hai bài liên tiếp.
  Muốn triệt để: query `cover_prompt` N bài gần nhất từ `blog_posts` rồi loại
  archetype đã dùng (`ponytail:` comment đã ghi đường nâng cấp tại chỗ).
- Ảnh trong bài (`IMAGE_RULES`) không đổi.

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

## 2026-08-29 — Một URL policy chung cho tất cả game, không tách per-game

**Quyết định:** `/privacy-policy` + `/terms-of-use` phục vụ cả website lẫn mọi
game/app TD Games publish. KHÔNG tạo `/games/<slug>/privacy-policy`.

**Lý do:** Google Play và App Store chỉ yêu cầu một URL policy công khai mô tả
đúng dữ liệu app thu thập — không yêu cầu mỗi app một trang riêng. Tách route
theo game là speculative: mỗi game mới đẻ 2 file, trong khi các game cùng bộ
SDK có nội dung policy giống hệt nhau.

**Khi nào phải xét lại:** một game lệch data profile so với phần còn lại —
(a) game nhắm trẻ dưới 13 → COPPA + Google Play Families Policy, luật khác hẳn,
ads bắt buộc non-personalized; (b) game có đăng nhập tài khoản / thu dữ liệu
mà game khác không có. Lúc đó tách riêng CHỈ game đó, phần còn lại giữ URL chung.

**Ràng buộc kèm theo:** nội dung policy phải khớp Data Safety form (Play) và
Privacy Nutrition Label (App Store). Thêm/bớt SDK trong game → sửa policy ngay,
khai lệch là lý do bị từ chối phổ biến nhất.

## 2026-09-16 — Upload ghi âm PV qua server, KHÔNG presigned PUT thẳng R2

**Quyết định:** file ghi âm phỏng vấn (tới 100MB) đi qua `POST /api/hr/upload/audio`
trên server Next, server mới `PutObject` lên R2. Không phát presigned URL cho browser
PUT thẳng.

**Lý do:** presigned PUT bắt buộc bucket R2 phải có CORS cho phép `PUT` từ
`tdgamestudio.com`. Cấu hình đó nằm ở Cloudflare dashboard/API — agent không có quyền
(MCP cloudflare-* chưa auth), và khi thiếu CORS thì lỗi xảy ra **trong browser**, hỏng
âm thầm, khó lần. Đường qua server đánh đổi RAM/bandwidth VPS lấy việc không phụ thuộc
hạ tầng cấu hình ngoài tầm với.

**Ràng buộc kèm theo:** nginx `client_max_body_size` phải ≥ trần app + overhead
multipart (app 100MB → nginx 120M), và route upload/analyze cần
`proxy_read_timeout` dài (900s) vì gỡ băng file dài mất vài phút.

**Khi nào phải xét lại:** ghi âm vượt ~200MB, hoặc HR upload đủ nhiều để VPS nghẽn
RAM/băng thông. Lúc đó chuyển sang presigned và cấu hình CORS bucket một lần.

## 2026-09-16 — Gỡ băng dùng nhà cung cấp riêng, tách khỏi AI_BASE_URL

**Quyết định:** `src/lib/transcribe.ts` chọn provider theo key có sẵn:
`GEMINI_API_KEY` → Gemini, rồi `OPENAI_API_KEY` → Whisper, không có key thì trả lỗi
501 và HR dán transcript tay. Phần chấm điểm vẫn dùng `AI_BASE_URL` như cũ.

**Lý do:** đã test và xác nhận cliproxyapi (`AI_BASE_URL`) KHÔNG nhận audio —
`/v1/audio/transcriptions` trả 404, chat/completions trả "Audio input is not available."
Không tái dùng được, buộc phải tách.

**Ưu tiên Gemini trước Whisper:** Whisper trần 25MB/file, ghi âm 45 phút thường
40-60MB → vượt. Gemini có Files API nuốt được file lớn. Nếu chỉ có key OpenAI thì HR
phải nén mp3 (~48kbps mono) trước khi upload.

**Ràng buộc:** ô transcript sửa tay luôn phải giữ — nó là đường thoát khi provider
lỗi/hết quota, và là cách feature chạy được ngay cả khi chưa cắm key nào.

---

## 2026-09-17 — Ghim model Gemini gỡ băng: `gemini-3.6-flash`, không hạ về 2.5

**Quyết định:** mặc định `GEMINI_TRANSCRIBE_MODEL` là `gemini-3.6-flash`. Không được
"sửa cho an toàn" bằng cách hạ về `gemini-2.5-flash`.

**Lý do:** Google đã khoá `gemini-2.5-flash` với key tạo mới — gọi vào trả **404
"This model is no longer available to new users"**. Đã xác minh bằng key production
ngày 2026-09-17.

**Bài học chung:** model vẫn xuất hiện trong `GET /v1beta/models` nhưng gọi vẫn 404.
**Danh sách models KHÔNG phải bằng chứng model dùng được** — muốn chắc thì gọi thử
một request text rẻ tiền.

## 2026-09-25 — HR pipeline status cấu hình qua DB
- Status ứng viên nằm ở bảng `application_statuses`, không còn enum Postgres / hằng số trong code.
  `applications.status` = text FK → `application_statuses.key`.
- `new` và `rejected` là `is_system` (form ứng tuyển ghi `new`, luồng reject + rejection_reason dùng `rejected`)
  → không xoá, không đổi kind. Key không bao giờ đổi qua API, chỉ đổi label.
- `kind`: open (đang xử lý, có thể nhắc), won (tính Won % trong KPI), lost (cuối board, không tính active).
- Màu lưu key palette (`status-palette.ts`), không lưu class Tailwind (Tailwind cần class tĩnh).

## 2026-10-15 — Không dùng ảnh AI-gen cho case study UI/UX
Pawtrol Tactics (UI gen 100% bằng image model) bị sếp chê lộ AI. Case study UI/UX phải có UI vector thật (Figma/code), design system nhất quán, breakdown + motion. Image model chỉ được dùng cho art nhân vật/nền.

## 2026-10-18 — Spine chạy trực tiếp trong case study (SpineStage)
- Show nhân vật Spine thật bằng spine-player trên trang, không render video. 1 WebGL context mỗi trang (đổi quái = remount), chỉ dựng khi vào viewport.
- Atlas lên R2 dạng WebP q90 + alpha lossless (texture PMA); nếu thấy viền sáng ở mép mờ → chuyển lossless.
- Khung camera theo idle (FILL ~58% khung), không theo bounds mọi animation (FX level-up/special làm quái bé tí).
- Nền AI chỉ là môi trường trống; nhân vật luôn là Spine của khách.
- (2026-10-18, sửa) Atlas Spine lên web: WebP LOSSLESS (exact), KHÔNG lossy — lossy làm viền sáng + răng cưa trên texture PMA. Slot additive cần pmaAdditiveBatching (đã bật trong SpineCharacter). Khung camera đo theo thân, bỏ slot additive.

## 2026-10-18 — Monster Legends: quy chuẩn trang từng hệ
Sếp duyệt Fire + Water và yêu cầu lưu thành chuẩn cho các hệ sau → `.agent/meta/MONSTER-LEGENDS.md`
(nội dung, sân khấu, các bước upload / nền / splash / kiểm / deploy). Hệ mới làm đúng chuẩn đó.

## 2026-10-20 — AI tuyển dụng: MBTI không được ảnh hưởng điểm; ý kiến nội bộ chỉ là dữ kiện
- AI (evaluate/questions/analyze) đọc thêm MBTI, Note, comment, bài test + Leader review qua `hrSignals()`.
- MBTI chỉ tham khảo phong cách làm việc — prompt cấm cộng/trừ điểm năng lực theo MBTI (không có giá trị dự đoán năng lực).
- Note/comment là ý kiến nội bộ: dùng như dữ kiện, không lặp cảm tính; mâu thuẫn với bằng chứng khách quan thì ưu tiên bằng chứng.
- Leader review = một bản duy nhất trên applications.test_review (hiện 1 Leader); cần nhiều người chấm thì tách bảng riêng.

## 2026-10-20 — AI chỉ xem sơ bộ portfolio; mọi URL người ngoài nhập phải qua safeFetch
- Sếp chốt: portfolio có ảnh/video chỉ check sơ bộ (≤4 ảnh, 768px, detail low; video chỉ đếm) — tránh lâu + tốn token. Không mở LinkedIn (chặn bot/ToS).
- Mọi fetch tới URL do ứng viên/HR nhập dùng `src/lib/safe-fetch.ts` (chặn SSRF vào Tailscale/localhost/metadata, cap byte). Không dùng fetch() trần cho URL bên ngoài.

## 2026-10-22 — Xếp hạng ứng viên: cache 2 tầng, client điều phối
- Hồ sơ AI mỗi application chia 2 phần, cache theo hash: `ai_profile` (CV + portfolio ảnh + form — đắt, chỉ làm lại khi CV/link/form đổi) và `ai_digest` (Note/comment/test/PV/lý do reject — rải rác theo thời gian, chỉ text, rẻ). Chấm theo job dùng bản tóm tắt (~15 người/lượt) + 1 lượt chốt so sánh top 15. Đổi prompt → tăng `*_VERSION` trong `src/lib/candidate-ranking.ts`.
- Có dữ liệu mới chỉ đánh dấu 🔄, KHÔNG tự tính lại — HR bấm Tính lại (sếp chốt).
- Client điều phối từng bước (mỗi request ≤ 1 lượt AI) để khỏi timeout proxy và tiến độ lưu dần.
- Bẫy PostgREST: bảng nối có FK tới CẢ `applications` và `jobs` làm mọi embed `jobs(...)` từ applications lỗi "more than one relationship". `job_ranking_entries.job_id` cố ý KHÔNG có FK. Bảng mới kiểu này phải bỏ 1 FK hoặc dùng `jobs!applications_job_id_fkey(...)`.
- (2026-10-22, v2) Khi chấm phù hợp: kết luận của team (lý do reject, comment, Leader chấm, PV) NẶNG HƠN CV tự khai — đừng viết prompt kiểu "ý kiến nội bộ chỉ tham khảo". Tiêu chí loại cứng (app_settings `hr_ranking_rules`) → blocked, không chỉ trừ điểm.
- (2026-10-22) Theme /hr: KHÔNG sửa từng class màu trong component. `hr-theme.css` đổi nghĩa biến Tailwind (`--color-white`, `--color-amber-*`…) dưới `html[data-hr-theme]`. Component mới trong /hr cứ viết `text-white/50`, `bg-white/5`, `border-amber-500/30` như cũ là tự đúng ở cả Sáng/Tối. Không hardcode hex nền (dùng `hr-sheet` / `var(--hr-*)`); nút nền màu đặc chỉ dùng các class đã có rule chữ trắng trong hr-theme.css.
- (2026-10-23) /hr theo styleguide TD Games Work v4 của tdgames-project-manager (bản chép `.agent/ref/STYLEGUIDE.md`) — 2 app nội bộ cùng một ngôn ngữ: cam #FF9500 (chữ cam = --hr-orange-ink), Inter, mặc định Sáng, nút viên thuốc, trạng thái = chấm 7px + chữ (`hr-tag--status`, `--tag`), tag không tô nền, icon `lucide-react` (class `hr-ico`/`hr-ico-solo`) — KHÔNG dùng emoji làm icon trong /hr. Styleguide gốc đổi thì cập nhật hr-theme.css theo.

## 2026-10-26 — Mail ứng viên từ /hr: công tắc gửi thật là env, không phải UI
- `HR_EMAIL_MODE` chỉ đúng `live` mới gửi tới ứng viên; thiếu/sai ⇒ test, mọi mail về `HR_EMAIL_TEST_TO` (mặc định tony@) với tiêu đề `[TEST → email]`. Lý do: HR không lỡ tay bật; người nhận luôn do server quyết.
- Không bao giờ tự gửi: mọi mail qua hộp thoại xác nhận, HR sửa được nội dung (plain text → server dựng HTML có escape).
- Gửi qua Resend REST (`fetch`, không SDK), From `TD Games HR <hr@tdgamestudio.com>`. Lịch sử ở bảng `candidate_emails`.

## 2026-10-26 — Nhắc lịch PV qua PWA: Web Push VAPID, SW không cache
- /hr là PWA riêng (scope /hr), SW chỉ làm push — không cache để dữ liệu HR luôn mới.
- Mọi thiết bị đã bật đều nhận (HR dùng chung key, không có user riêng). Nhắc cùng lúc Discord (~60' trước).
- Endpoint push bắt buộc thuộc dịch vụ push chính thức (allowlist host) để server không POST tới địa chỉ tuỳ ý.

## 2026-10-27 — /hr: tài khoản tự quản (không dùng Supabase Auth), quyền theo vai, lọc ở server
- Mật khẩu scrypt + phiên trong `hr_sessions` (cookie httpOnly) + token mời/đặt lại tự quản: link mời được 7 ngày (Supabase OTP tối đa 24h), khoá tài khoản có hiệu lực ngay, không đụng cấu hình signup Supabase.
- Không có trang đăng ký; chỉ Sếp tạo/khoá tài khoản và sửa bảng quyền. Vai Sếp luôn toàn quyền.
- Bảng quyền = 1 danh sách trong code (`hr-permissions.ts`), DB chỉ lưu ô khác mặc định. Thêm chức năng = thêm 1 dòng quyền.
- Phạm vi dữ liệu + ẩn field ép ở server (allowlist: cột mới mặc định bị ẩn với Leader/Kế toán). Ngoài phạm vi trả 404.
- Ghi chống CSRF bằng kiểm Origin/Sec-Fetch-Site (cookie SameSite=Lax không chặn được subdomain cdn.*). File bài test: content-type theo đuôi, cấm svg/html, lưu attachment.
- Rate limit đăng nhập/quên mật khẩu trong bộ nhớ (PM2 1 process).
- Push nhắc PV chỉ tới thiết bị gắn tài khoản có quyền (Leader chỉ job mình).

## 2026-10-29 — Luồng offer chỉ Kế toán + Sếp
Thư mời nhận việc, duyệt thư, mail offer (lịch sử + mẫu) và phản hồi của ứng viên cho mail offer chỉ
Kế toán + Sếp thấy. Cổng là quyền `emails.send_offer` (HR mặc định tắt). Mail offer không CC/Reply-To người
support; Reply-To = Kế toán + hiring@. Discord: kênh riêng `DISCORD_WEBHOOK_OFFER` nếu có, không @everyone.
Vị trí "Offer" trong pipeline + kết quả offer vẫn hiện cho HR (trạng thái hồ sơ, không có nội dung thư).
