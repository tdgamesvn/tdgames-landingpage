# RECENT — 5 sessions gần nhất

_Auto-generated từ LOG.md. Không sửa tay._

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

## 2026-09-06 (session — Trang /tools: hub + khung, tất cả Coming soon)
### Task
Sếp muốn một trang Tools để sau này đổ các tool cho user dùng. Tool cụ thể chưa
có, sếp sẽ gửi sau (ví dụ: nén ảnh, AI upscale, Spine auto rig+mesh, export VFX).
Mục tiêu: SEO/lead + tiện ích thật cho artist + nội bộ dùng. Public trước, login
sau vì nhiều tool sẽ phải giới hạn lượt dùng/user.

### Phát hiện quan trọng khi brainstorm
4 tool ví dụ của sếp thuộc 2 lớp khác hẳn nhau:
- **browser** (nén ảnh, crop, convert): chạy trên máy user → 0đ, và **không đếm
  được lượt dùng**. Cứ để free vô hạn, đúng mục tiêu SEO.
- **server** (AI upscale, Spine auto rig, export VFX): tốn CPU/GPU → **bắt buộc**
  login + quota.
⇒ Quota chỉ áp được cho lớp server. Chi tiết ở DECISIONS.md.

### Work Done
- `src/app/tools/tools.ts` — mảng literal 4 tool, mỗi tool có `status`
  (live|coming-soon) và `runsOn` (browser|server). Đây là toàn bộ "registry".
- `src/app/tools/page.tsx` — hub, **server component** (bắt buộc, nếu "use client"
  cả trang thì Google không đọc được → mất mục tiêu SEO). Grid card + CTA
  `/contact`. Card coming-soon là `<div>` không click được.
- `site-header.tsx` — thêm `{ label: "TOOLS", href: "/tools" }` (1 dòng).
- `sitemap.ts` — thêm `/tools`. **Chưa** thêm URL từng tool vì chưa có trang thật.

### Result
`npx tsc --noEmit` sạch. Lint: 94 vấn đề nhưng **không cái nào** ở file vừa sửa
(toàn bộ là nợ cũ). `npm run build` pass, `/tools` là `○ (Static)` — prerender,
tốt cho SEO. Screenshot localhost xác nhận layout đúng theme amber/#0a0a0a.
⚠ Build/dev cần `dangerouslyDisableSandbox: true` — sandbox chặn Google Fonts.

### Next Step
Chờ sếp gửi tool đầu tiên. Thêm tool = 1 thư mục `src/app/tools/<slug>/` +
1 object vào mảng. Tool loại server phải gọi qua `/api/tools/<slug>` (chỗ nối để
sau gắn auth+quota một lần cho tất cả) — route này **chưa tạo**, tạo khi có tool
server thật đầu tiên.

## 2026-08-29 (session — Privacy Policy + Terms of Use mở rộng cho game mobile)
### Task
Sếp cần 2 trang policy để publish game lên Google Play + App Store. Bản viết
trước đó (28/08) chỉ bao website studio — store đòi policy mô tả đúng dữ liệu
app thu thập.

### Quyết định kiến trúc
KHÔNG tách `/games/<slug>/privacy-policy`. Một URL chung cho cả studio là hợp
lệ với cả 2 store — họ chỉ đòi policy công khai mô tả đúng thực tế thu thập,
không đòi mỗi app một trang. Giữ nguyên `/privacy-policy` + `/terms-of-use`,
viết theo hướng "website AND all our games". Ra game mới → không đẻ route.
Chỉ tách khi một game lệch data profile (game trẻ <13 → COPPA/Families, hoặc
game có đăng nhập tài khoản).

### Giả định đã dùng (sếp chốt "mặc định")
ads + IAP + Firebase Analytics/Crashlytics, KHÔNG có tài khoản đăng nhập,
13+, publish cả Google Play lẫn App Store.

### Work Done
- `src/app/privacy-policy/page.tsx` — thêm section: Information Our Apps
  Collect, Analytics in Our Apps (Firebase), Advertising (opt-out Android Ads
  ID + iOS ATT), In-App Purchases. Mở rộng Definitions (Apps, Device
  Identifiers), Use of Data, Service Providers, Data Retention (14 tháng
  analytics), Your Rights (cách xoá data khi không có account).
  **Children's Privacy: 18 → 13** (game 13+, không phải site 18+).
- `src/app/terms-of-use/page.tsx` — thêm section: Eligibility (13+), Licence
  to Play Our Games (cấm cheat/mod/reverse-engineer, cho phép làm video
  gameplay), In-App Purchases and Virtual Items (virtual currency không có giá
  trị thật, refund qua store), Advertising in Free Games, App Store Terms
  (Apple là third-party beneficiary — điều khoản Apple bắt buộc),
  Updates/Discontinuation, Termination. Mở rộng IP sang asset trong game.
- Cả 2 file: bump `updated` → 29 August 2026.
- Không đụng `src/components/legal-page.tsx` — component sẵn có đủ dùng.

### Result
`tsc --noEmit` + `eslint` sạch. `detect_changes` → risk LOW, 0 execution flow
bị ảnh hưởng (chỉ sửa const array trong 2 page leaf).

### Next Step
- CHƯA commit/deploy — chờ sếp xác nhận giả định SDK.
- Khi khai Data Safety (Play) / Privacy Nutrition Label (App Store) phải khớp
  đúng danh sách này: Device/Advertising ID, gameplay usage, crash logs,
  purchase confirmation, approximate location (IP-level). Khai lệch = lý do
  bị từ chối phổ biến nhất.
- Nếu game thật KHÔNG có ads hoặc KHÔNG có IAP → phải cắt section tương ứng,
  đừng để policy khai thừa.


### Bổ sung (cùng ngày)
- Email liên hệ 2 trang legal: `tdgames.vn@gmail.com` → `privacy@tdgamestudio.com`
  (alias Google Workspace trên tài khoản toan.dang@, đã bật "Send mail as" +
  "Reply from the same address"). Contact section marketing giữ gmail cũ.
- `src/components/legal-page.tsx` — thêm `linkifyEmails()`: split string theo
  capture group của regex email, index lẻ = email → render `<a href="mailto:">`
  màu amber-400. Không đổi kiểu `LegalSection`, data vẫn là string thuần.
- Pháp nhân đã chốt: Developer account mở bằng **TD GAMES COMPANY LIMITED**
  → policy giữ nguyên tên + địa chỉ. TD Consulting chỉ là reseller bán
  Workspace, không liên quan store.
- Gotcha: Cloudflare Email Obfuscation viết lại `href` thành
  `/cdn-cgi/l/email-protection#...` trong HTML thô → `curl | grep mailto` ra
  rỗng, tưởng hỏng. Verify bằng Playwright: DOM thật có `mailto:` + màu đúng.
  Muốn tắt: Cloudflare → Scrape Shield → Email Address Obfuscation.

## 2026-08-17 (session — phá thế "cover blog nào cũng giống nhau")
### Task
Sếp gửi screenshot /blog: 8/8 cover là cùng một ảnh — một anh cartoon râu-kính
đứng chính giữa, cầm vật phát sáng, một vòng icon lơ lửng quanh, nền xanh-đen.

### Nguyên nhân
Không phải AI lười — `COVER_RULES` (`src/lib/blog-ai.ts`) ép đúng cái đó:
"Prefer a living hero subject… large and centred" + "One clear focal subject…
simple uncluttered background" + "One dramatic light source — warm amber rim
light". Generator giải yêu cầu "depth" bằng cách rắc icon quanh nhân vật.
Dòng khuyên mềm "VARY IT BETWEEN POSTS" vô hiệu vì mỗi bài dựng trong một AI
call độc lập — AI không hề thấy cover của bài trước để mà tránh.

### Work Done
- `src/lib/blog-ai.ts` — `COVER_RULES` (const) → `coverRules()` (function).
  Mỗi lần gọi bốc ngẫu nhiên 1 trong 7 **archetype** (hero character /
  establishing environment / prop still life / process strip / isometric
  diorama / split composition / macro close-up) + 1 trong 6 **accent palette**,
  nhét vào prompt như yêu cầu BẮT BUỘC, không phải gợi ý.
- Thay dòng "prefer a living hero subject" bằng luật trung tính: cần MỘT hình
  khối trội đọc được ở 200px, không nhất thiết phải là nhân vật.
- Thêm lệnh cấm rõ ràng: không rắc vòng icon/tia sáng lơ lửng quanh chủ thể —
  đòi depth bằng staging (gần/xa/che nhau).
- 2 call site đổi `${COVER_RULES}` → `${coverRules()}`:
  `api/admin/blog/topics/route.ts`, `api/admin/blog/reimage/route.ts`.

### Result
`npx tsc --noEmit` sạch. Chạy `coverRules()` 15 lần → trúng 6 archetype khác
nhau, palette đổi theo. Impact LOW (const string, chỉ 2 nơi import).

### Deploy + render lại cover cũ (cùng session)
- Commit `c20f699` → push main → CI deploy VPS OK (1m18s).
- Thêm `scripts/recover-blog-covers.mjs` — chỉ render lại COVER, không đụng ảnh
  in-post (nút "Render lại ảnh" trong /admin làm cả bài, ~3 ảnh, thừa và tốn).
  Dry-run mặc định; `--apply` mới ghi; `--slug=<slug>` để thử một bài.
- Blog thực tế có **26 bài** (screenshot chỉ là trang đầu), không phải 8.
- Verify 1 bài trước khi chạy hàng loạt (`the-quote-is-not-the-final-art-budget`):
  ra isometric diorama đảo nổi, palette lime/cyan trên forest green, KHÔNG có
  nhân vật đứng giữa khung. Dry-run 26 bài cho thấy prompt trải đều các
  archetype: split, process strip, diorama, environment, macro close-up.
- Sau đó chạy `--apply` cho toàn bộ 26 bài.

### Lưu ý vận hành (mất thời gian mới ra)
`ADMIN_SECRET` trong `.env.local` KHÔNG phải secret đang chạy prod.
`requireAdmin` (`src/lib/admin-auth.ts`) ưu tiên row `admin_secret` trong bảng
`app_settings` rồi mới đến env. Muốn gọi admin API của prod thì lấy từ DB, không
phải từ `.env.local` hay `.env.local` trên VPS.

### Next Step
Sếp xem lại /blog. Nếu vẫn thấy trùng: bơm `cover_prompt` của N bài gần nhất vào
prompt để loại archetype đã dùng (random hiện chưa nhớ lịch sử, ~1/7 trùng
liên tiếp).

---

## 2026-08-03 (session — fix hero title tràn khung trên mobile)
### Task
Sếp gửi ảnh mobile: title "2D ART & ANIMATION OUTSOURCING STUDIO" bị cắt chữ
("ANIMAT|", "OUTSOU") và đè lên logo header.

### Nguyên nhân
`--hero-title-size` mặc định **100px cố định** (không responsive) trong
`home-hero.tsx`; container hero `width: var(--layout-width, 75%)` → trên màn
~390px khung chữ chỉ ~290px, chữ 100px tràn ra và bị `overflow-hidden` cắt.
Hero căn `items-center` không chừa chỗ cho header fixed → chữ đè logo.

### Work Done
- `src/components/home-hero.tsx` — 2 dòng title:
  `fontSize: min(var(--hero-title-size, 100px), 8vw)` → desktop (>1250px) vẫn
  ăn giá trị admin set, mobile tự co.
- Container hero thêm `pt-24 md:pt-0` để không chui dưới header fixed.

### Result
Playwright viewport 393×852: title fit 2 dòng, không cắt, không đè logo;
`scrollWidth == clientWidth` (không có overflow ngang). Impact LOW (0 caller).

### Next Step
Sếp duyệt → commit + push main (CI tự deploy).

---

