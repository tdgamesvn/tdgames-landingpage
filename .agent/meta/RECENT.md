# RECENT — 5 sessions gần nhất

_Auto-generated từ LOG.md. Không sửa tay._

---

## 2026-09-08 (session 2 — cache 404 ghim 1 tuần: `/cdn-proxy` rewrite là thủ phạm)

Sếp upload lại `wolf-aquatic.png` (session trước) nhưng site vẫn "Couldn't load
image". Hard refresh + tab ẩn danh đều vô dụng.

**Bẫy chẩn đoán:** `curl -I` (HEAD) trả 200 nên tưởng đã lành. `curl` GET mới lộ
`404 + cf-cache-status: HIT + age: 11981`. **HEAD không trúng cache entry — luôn
dùng GET khi soi cache.**

**Root cause:** site gọi `/cdn-proxy/...` → rewrite ở `next.config.ts` proxy
THẲNG ra R2 → response giữ nguyên `Cache-Control: max-age=604800` của R2, áp cho
cả 404. Browser ghim lỗi 1 tuần; purge Cloudflare chỉ dọn edge nên không cứu
được. `Cmd+Shift+R` cũng vô dụng vì SpinePlayer nạp texture bằng XHR lúc runtime,
hard reload không bypass cache cho request do JS bắn ra sau khi trang đã load.

Route handler `/api/cdn-proxy/[...path]` từ đầu đã xử lý đúng (no-store cho lỗi)
nhưng **không ai gọi** — code đúng nằm chết, site đi đường rewrite sai.

**Đã sửa (4 file):** `proxyCdnUrl()` → `/api/cdn-proxy/`; xoá hẳn rewrite trong
`next.config.ts` (kèm comment cảnh báo đừng thêm lại); route `max-age` 3600→300
vì Spine asset bị thay tại chỗ nên max-age chính là độ trễ khách thấy bản mới;
sửa docstring `spine-character.tsx`.

**Verify:** file thật→200+max-age=300; file thiếu→**404+no-store**; `/cdn-proxy/`
cũ→404 không còn proxy; `.html`→403. `npm run build` pass. 91 lint problem là nợ
có sẵn (home-page-lower:217,258), không do thay đổi này.

**Giải thích được bug cũ:** LOG:4543 "upload xong không tự động reload" — cùng
root cause, giờ đã đóng.

**Next:** deploy chưa chạy (chờ sếp). `devil-lord/...evil-lord_3.png` VẪN 404 trên
R2 — sếp mới upload `wolf-aquatic`, chưa upload cái này. Lưu ý slug `careers-hero`
trong `spine_characters` trỏ tới `awakened-ancestor-fire-akira-karioka_3` (file này
200, lành) — KHÔNG phải `devil-lord/` như manifest mồ côi ghi.

---

## 2026-09-08 (session — Spine careers vỡ: texture bị chính script orphan xoá)

Sếp báo section CAREERS in "Error: Assets could not be loaded" cho
`awakened-ancestor-special-nebotus-evil-lord_3.png`.

**Nguyên nhân (không phải bug code):** `.png` texture đã bị xoá khỏi R2.
`scripts/.orphan-manifest.jsonl` có đúng 2 dòng:
`landing/spine/devil-lord/...evil-lord_3.png` (4.29 MB) và
`landing/spine/contact-mascot/wolf-aquatic.png` (1.42 MB). Chúng bị
`backfill-compress.mjs --delete-orphans` (01/08) chuyển sang `trash/2026-08-01/`
rồi `rclone purge` xoá hẳn ngày 10/08 (LOG session 2 hôm đó). Lý do heuristic sai:
texture spine CHỈ được tham chiếu từ trong file `.atlas` nằm trên R2, không có
trong `src/`, `media_assets` hay `page_slots` → luôn bị coi là mồ côi.
R2 giờ chỉ còn `.json` + `.atlas` cho cả 2 nhân vật; `backup/pre-compress` cũng đã
purge nên KHÔNG khôi phục được, phải xin lại file gốc từ artist.

**Đã sửa:** `backfill-compress.mjs` — thêm filter loại `landing/spine/` khỏi danh
sách mồ côi. Dry-run lại: 37 file (37.55 MB), không còn file spine nào.
`/cdn-proxy` rewrite + `/api/admin/spine/upload` đều bình thường, không đụng.

**Next:** sếp gửi 2 file PNG gốc → upload lại qua /admin tab Spine (hoặc đẩy thẳng
vào key cũ để khỏi đổi `json_url`/`atlas_url` trong `spine_characters`).
Cảnh báo phụ: 37 "mồ côi" còn lại phần lớn là video `projects/2026/08/*` — nghi
false positive tương tự, ĐỪNG chạy `--apply` cho tới khi soát tay.

---

## 2026-09-06 (session — /tools đồng bộ style với /blog)

Sếp: "/tools không đồng bộ với các tab khác, tham khảo tab Blog".
Khác biệt thật: bg `#050508` (blog `#0a0a0a`), container `max-w-6xl px-6` thay vì
`min(var(--layout-width,85%),1280px)` → lệch hàng với header/footer, font heading
Orbitron thay vì Rajdhani, không có font body Nunito Sans, hero trơ trụi (không
watermark / glow / eyebrow / divider), grid 3 cột card nhỏ.

Sửa `src/app/tools/page.tsx` + `waitlist-form.tsx` theo đúng khuôn /blog: hero có
watermark "TOOLS" + glow amber + eyebrow `// Toolbox` + count + `<AccentHighlight>`
+ divider gradient đáy; grid 2 cột card `rounded-xl bg-white/[0.03]`; màu chốt lại
`#f59e0b`. Nunito Sans thêm subset `vietnamese` (blog chỉ latin, /tools có dấu).
Vẫn là server component — SEO không đổi.

**Ngôn ngữ site = TIẾNG ANH** (sếp chốt). Đã dịch toàn bộ text hiển thị của /tools
(page + tools.ts blurb + waitlist form) sang tiếng Anh, bỏ subset `vietnamese` khỏi
Nunito Sans. Comment trong code vẫn tiếng Việt (team đọc, không hiển thị).
Quét cả src: chỉ còn 2 chỗ public sai → đã sửa: meta description `/showreel` (viết
tiếng Việt) và mũi tên "Back to Portfolio" ở 2 case study bị mojibake `â†` → `&larr;`.
Chuỗi tiếng Việt còn lại đều nằm trong /admin, /crm, /hr, banner preview draft —
nội bộ, giữ nguyên.

## 2026-09-06 (session — AI gợi ý email trả lời lead ở /crm)

### Work Done
- `src/app/api/crm/leads/[id]/reply/route.ts` (mới) — POST, `requireCRM`, đọc lead từ
  DB, gọi cliproxyapi `/chat/completions` y hệt route evaluate bên /hr (cùng env
  `AI_BASE_URL`/`AI_API_KEY`/`AI_MODEL`), trả `{subject, body}`. Prompt: trả lời đúng
  ngôn ngữ khách viết, 120-180 chữ, cấm bịa giá/deadline, tối đa 2 câu hỏi chốt scope.
- `CRMBoard.tsx` — component `ReplyDraft` trong panel chi tiết: nút "✨ Soạn bằng AI"
  → subject + body sửa được → "Copy nội dung" / "Mở mail đã điền sẵn" (mailto prefill).
  `key={selected.id}` để đổi lead là draft tự reset (không cần effect).
- Prompt KHÔNG được ký tên / "Best regards" cuối mail (sếp bắt lỗi bản đầu tự ký
  "Tuan — TD Games Studio") — mail client đã có chữ ký sẵn.
- ponytail: draft KHÔNG lưu DB → 0 migration. Muốn lịch sử draft thì thêm cột sau.

### Result
tsc sạch; lint chỉ còn lỗi `set-state-in-effect` có sẵn. Test thật qua Playwright trên
lead Ryan Fillingame: 10s ra email tiếng Anh đúng bối cảnh (pilot trước, hỏi sample +
volume), subject "Re: Wrestling Masters 2D Card Illustration Project".

### Env: gpt-5.4-mini → gpt-5.5 (ĐÃ SỬA)
`AI_MODEL=gpt-5.4-mini` chết trên cliproxyapi (502 "unknown provider") — cả local
LẪN VPS đều đang trỏ model này ⇒ AI eval bên /hr trên production cũng đang hỏng
âm thầm. Đã đổi `AI_MODEL=gpt-5.5` ở `.env.local` local + `/opt/tdgames-landingpage/
.env.local` trên VPS (`pm2 restart --update-env`), và đổi 5 chỗ fallback hardcode
trong src (reply, hr/evaluate, blog/reimage, blog/topics, blog/topics/interview).
Model proxy đang phục vụ: gpt-5.5, gpt-5.6-sol/luna/terra, gpt-6-astra, gpt-image-*.

---

## 2026-09-06 (session — Redesign /crm: list + panel chi tiết)

### Task
Sếp: "/crm khó nhìn và theo dõi quá, design lại" → sau đó "dễ nhìn, dễ hiểu,
dễ filter hơn".

### Vấn đề gốc
Không phải màu sắc — là mật độ thông tin. Mỗi lead là 1 card in **full message**,
5 lead = 3 màn hình cuộn, mắt không có mốc để quét. Status là `<select>` nên phải
đọc chữ mới biết lead đang ở đâu.

### Work Done — chỉ `src/app/crm/_components/CRMBoard.tsx`, 0 đụng API/DB
- **List row thay card**: 1 lead = 1 dòng (avatar chữ cái · tên · email · dịch vụ ·
  ngân sách · preview message 1 dòng · pill trạng thái · "7 ngày"). 5 lead gọn
  trong ~250px thay vì 3 màn hình.
- **Panel chi tiết** (slide phải, Esc/click nền đóng): full message cuộn riêng,
  5 nút đổi trạng thái thay dropdown, textarea ghi chú, nút "Trả lời" mailto.
- **Dễ hiểu**: hàng tiêu đề cột; nhãn tiếng Việt (Mới / Đã liên hệ / Đã báo giá /
  Chốt / Trượt) thay `new/contacted/...`.
- **Dễ nhìn**: vạch dọc màu theo trạng thái đầu mỗi dòng + avatar cùng tông màu →
  quét trạng thái bằng màu, không phải bằng chữ. Lead `new` chưa có notes thì tên
  đậm; đã ghi chú thì cột preview đổi thành `✎ <ghi chú>` (biết ngay xử lý tới đâu).
- **Dễ filter**: click tiêu đề cột để sort (tên / trạng thái / thời gian, toggle
  chiều); select "Mọi dịch vụ" (options derive từ data, không hardcode nên waitlist
  tool cũng lọc được); badge "N chưa xử lý" bấm được thành filter; ô tìm kiếm
  (tên/email/nội dung/notes); nút "Xoá lọc (N)".
- `COL` object giữ width cột — header và row dùng chung nên luôn thẳng hàng.
- `sortHead()` là hàm trả JSX, KHÔNG phải component trong render (lint
  `set-state-in-effect`/component-in-render bắt được lần đầu, đã sửa).

### Result
`tsc --noEmit` sạch. Lint chỉ còn 1 lỗi `set-state-in-effect` ở effect auto-login
CÓ TỪ TRƯỚC (cả repo đang 64 lỗi cùng loại) — không đụng.
Verify bằng Playwright trên dev server với data production thật: list render đúng,
panel mở đúng lead, sort A→Z + filter "2D Art" ra đúng 2 lead, "Xoá lọc (2)" hiện đúng.

### Next Step
Chưa commit — chờ sếp duyệt. Chưa làm (chờ khi lead nhiều lên): kanban kéo-thả,
bulk action, phân trang. Ngưỡng gợi ý: >50 lead/tháng.

---

## 2026-09-06 (session — Waitlist email trên card /tools coming-soon)

### Task
Card coming-soon ở /tools không click được → đổi khoảng chết đó thành ô nhập email
"báo tôi khi mở" để thu lead ngay giai đoạn này.

### Quyết định: lưu vào `leads` sẵn có, KHÔNG dựng bảng riêng
Đã định làm `tool_waitlist` riêng, rồi bỏ khi thấy chỗ hiển thị bắt buộc là `/crm`
(không phải /admin — quản lý nội dung, không phải /hr — ứng viên). Bảng riêng nghĩa
là CRMBoard phải fetch 2 nguồn + merge 2 kiểu dữ liệu cho thứ chỉ có mỗi cột email.
→ Dùng `leads` với `source = "tool-waitlist"` (hằng `WAITLIST_SOURCE` ở lib/leads.ts),
`service = <tên tool>`, `name = phần trước @`. 0 migration.

### Work Done
- `src/lib/leads.ts` — thêm `WAITLIST_SOURCE`, dùng chung route + CRMBoard.
- `src/app/api/tools/waitlist/route.ts` (mới) — POST {email, tool}; validate email,
  slug phải có trong `TOOLS`; select trước insert để bấm 2 lần không đẻ row rác;
  Discord notify kênh sales fire-and-forget. Không đụng `/api/leads` (giữ nguyên
  trust boundary của form contact).
- `src/app/tools/waitlist-form.tsx` (mới) — client component duy nhất của trang,
  phần còn lại vẫn server-render cho SEO.
- `src/app/tools/page.tsx` — nhánh coming-soon render form, `mt-auto` cho form
  thẳng hàng đáy card.
- `src/app/crm/_components/CRMBoard.tsx` — tách `waitlist` / `pipeline` theo `source`;
  chip "all" + các chip status chỉ đếm pipeline → cột "new" không bị waitlist làm
  loãng; thêm chip `waitlist`; badge `source` trên card.

### Result
`npx tsc --noEmit` sạch. Dev server: /tools 200, screenshot 3 card có ô email
thẳng hàng. Endpoint: valid → 201, gửi lại → 200 cùng id (dedupe), email xấu → 400,
tool bịa → 400. Row trong DB đúng format (`service="Image Compressor"`), đã xoá row test.

### Next Step
Chưa commit/push. Chưa xem `/crm` bằng mắt (CRM_SECRET nằm trong `app_settings`,
không có ở .env.local) — logic filter chỉ mới verify qua tsc, nên mở /crm xem chip
`waitlist` một lần khi có key. Chưa có mail xác nhận cho người đăng ký; hiện chỉ
Discord báo nội bộ.

---

