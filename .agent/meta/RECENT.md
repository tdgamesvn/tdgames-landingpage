# RECENT — 5 sessions gần nhất

_Auto-generated từ LOG.md. Không sửa tay._

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

## 2026-08-03 (session — glow cho logo header)
### Task
Sếp: "Logo tdgames này cho glow nhẹ cho nổi bật và đẹp hơn chút".

### Work Done
- `src/components/site-header.tsx` — thêm `[filter:drop-shadow(...)]` 2 lớp màu
  amber `rgba(245,158,11,…)` cho `<Image>` logo (6px/0.35 + 20px/0.18), hover
  đậm hơn (8px/0.55 + 26px/0.28), `transition-[filter] duration-300`.
  Dùng drop-shadow thay box-shadow để glow ôm hình dạng PNG.

### Result
Chỉ đổi className, impact LOW (0 caller). Logo tách khỏi nền hero video tối.
Logo footer chưa đụng.

### Next Step
Không có.

---

## 2026-08-03 (session — fix flash media cũ ở hero trang chủ)
### Task
Sếp: "load mới vẫn hiện video nền + card cũ ~1s rồi mới đổi sang cái mới".

### Nguyên nhân (không phải cache browser)
`useMediaListListener` khởi tạo state bằng `site.json → hero.media` (dữ liệu cũ),
rồi `useEffect` mới fetch `/api/page-slots?page=home&slot=hero-carousel` sau khi
hydrate → HTML đầu + first paint luôn là media cũ. `src/app/page.tsx` là
`"use client"` nên không fetch server-side được.

### Work Done
- `src/app/page.tsx` → **server component** (`async`), gọi `resolveSlots("home",
  "hero-carousel")` và truyền `initialMedia` xuống `<HomeHero>`. Thêm
  `export const dynamic = "force-dynamic"` để không prerender stale (route `/`
  từ ○ → ƒ).
- `src/components/home-page-lower-client.tsx` (mới) — giữ `dynamic(ssr:false)`
  cho HomePageLower, thứ duy nhất buộc page.tsx phải là client.
- `src/components/home-hero.tsx` — nhận prop `initialMedia?: MediaItem[]`.
- `src/components/hero-layout-state.tsx` — **xoá hẳn** effect fetch page-slots
  (server lo rồi); hook nhận `initial`, rỗng → rơi về site.json. CustomEvent
  live-preview của admin giữ nguyên.

### Result
`npm run build` pass; `curl localhost:3111/` → HTML đầu tiên đã chứa URL media
từ DB (`/projects/2026/...`), không còn `landing/video/CutScene_SE/*` của
site.json. Hết flash.

### Next Step
Sếp review dev rồi commit + push (CI tự deploy). CHƯA commit.

## 2026-08-01 (session — nén qua bot tdgames-discord, cả video)
### Task
Sếp: "nén cả video nữa, đi qua tdgames-discord channel compressor-ai".

### Quyết định
KHÔNG đi vòng qua channel Discord: limit 10MB cả 2 chiều (upload + bot reply gửi
file về) → video studio không lọt, lại phải poll message. Thay vào đó gọi HTTP
thẳng tới bot qua tailscale — cùng pattern `AI_BASE_URL` đã dùng.

### Work Done (repo landingpage)
- `src/lib/r2.ts` + `compressViaBot()`: POST raw body → `COMPRESSOR_URL/compress`,
  match `image/(?!svg)|video/` và >400KB, timeout 300s. Trả null khi chưa cấu hình
  / bot chết / kết quả không nhỏ hơn → KHÔNG BAO GIỜ throw.
- `uploadToR2()`: bot trước, sharp là đường lùi. Bot chết + là ảnh → sharp q90 như cũ;
  bot chết + là video → upload thô (không mất file). `skipCompress` (spine) chặn cả hai.
- Bot nén được gif động (gif2webp) và video (libx264 crf20) — sharp không làm được.
- `COMPRESSOR_URL` chưa set ⇒ hành vi y hệt trước khi sửa.

### Việc CHƯA làm (repo tdgames-discord — session này không được ghi ngoài repo)
- Thêm `src/features/compressor/http.ts` (code đã đưa sếp) + gọi trong `index.ts`.
- Env VPS: `COMPRESSOR_URL=http://100.126.162.96:8318`.

### Nối bot THẬT (2026-08-01, cuối session)
Bot tdgames-discord đã live: `http://100.126.162.96:8787` (host tailscale
`mac-mini-ca-tdgames-mac01`), chạy bằng **launchd** label `com.tdgames.discord-bot`
(KHÔNG phải PM2). Restart: `launchctl kickstart -k gui/$(id -u)/com.tdgames.discord-bot`.
Bot trả 415 mime lạ / 501 thiếu binary / 413 body >500MB.

⚠ `COMPRESSOR_URL` phải là **base**, KHÔNG kèm `/compress` — code tự nối.

E2E qua bot thật (dev):
- PNG 15.6MB → **517KB** `.webp` (sharp fallback cùng ảnh chỉ được 1.05MB ⇒ đúng là đi qua bot)
- MP4 1.28MB → **94KB** `.mp4` ⇒ nhánh video chạy, thứ sharp không làm được
- 7 file test đã xoá khỏi R2.

VPS: đã set `COMPRESSOR_URL` vào `/opt/tdgames-landingpage/.env.local` + `pm2 restart --update-env`.
VPS curl tới bot OK (415). NHƯNG production vẫn trả file nguyên 15.6MB vì **code nén
chưa commit/push** — env đã sẵn, thiếu đúng bước deploy.

### Backfill nén toàn bộ media cũ trên R2 (`scripts/backfill-compress.mjs`)
Sếp: "nén lại toàn bộ ảnh/video đang có, nhưng backup trước".

**Quyết định then chốt — GIỮ NGUYÊN key, chỉ thay bytes + content-type.**
`foo.gif` giờ chứa WebP là CỐ Ý: browser đọc `Content-Type`, không đọc đuôi file.
Đổi tên `.gif`→`.webp` sẽ buộc phải sửa URL ở site.json + project-data.ts + 4 bảng
DB — sót một chỗ là ảnh vỡ. Đã check `information_schema`: DB KHÔNG có cột nào lưu
size/mime ⇒ ghi đè cùng key thì không phải đụng DB dòng nào.

Hiện trạng R2 lúc bắt đầu: 771 file / 2034.9 MB. Cần nén: 496 file / 1957.6 MB.
GIF 199 file (1211 MB) — nặng nhất; MP4 276 (583 MB); PNG 205 (185 MB).

Script: dry-run mặc định, `--apply`, `--limit N`, `--rollback`.
- Backup server-side CopyObject sang `backup/pre-compress/<key>` TRƯỚC khi đụng bản
  gốc (không tải về, không tốn egress). Backup lỗi → không ghi đè.
- Chốt chặn "lỗi bim bim": bytes mới phải DECODE ĐƯỢC (sharp cho ảnh, ffprobe cho
  video) mới cho ghi đè. Bot trả 200 với file cụt vẫn là file cụt — chỉ so size là chưa đủ.
- Manifest `scripts/.backfill-manifest.jsonl` để rollback/audit.
- Không tin content-type lưu trên R2 (nhiều object là octet-stream) — suy từ đuôi file.

Đã kiểm chứng end-to-end trên 3 GIF nặng nhất rồi ROLLBACK:
- 31.24MB → 26.18MB, CDN trả `content-type: image/webp`, decode ra 700x393 **300
  frames còn nguyên** ⇒ animation không mất.
- `--rollback` trả về `image/gif` đúng 32,753,492 byte = khớp size gốc ✓

⚠ GIF chỉ giảm ~16% vì bot dùng `gif2webp` LOSSLESS. Muốn ăn đậm (1.2GB → ~250MB)
thì bot phải thêm `-lossy`. CHƯA làm: đây là studio art, giữ chất lượng ưu tiên hơn.
Nếu sếp đổi ý → sửa bên repo tdgames-discord rồi chạy lại script này.

### SẾP BẮT LỖI: "GIF có dùng đâu mà nén" — ĐÚNG
Em đã nén 11 GIF rồi mới bị chặn. Kiểm chứng lại: 199 GIF (1.17GB) KHÔNG được
tham chiếu ở đâu — không có trong projects/blog_posts/page_slots, không có trong
source. Chúng chỉ nằm trong `media_assets`, mà bảng đó là **bảng TRACK**, không
phải nơi hiển thị. Đã `--rollback` cả 11 file về nguyên trạng.

**Bài học chung, không riêng GIF:** "có mặt trên R2" ≠ "đang được dùng".
Sửa gốc bằng bộ lọc `collectUsedKeys()`: tập URL đang dùng = grep `cdn.tdgamestudio.com/*`
trong `src/**` + JSON các API public (`/api/projects|blog|team|footer|jobs`) +
bảng `page_slots` đọc thẳng REST (route `/api/page-slots` bắt buộc `?page=&slot=`
nên không liệt kê được — thiếu nguồn này là hụt 46 file).
Cờ `--all` để nén tất nếu cần.

Kết quả lọc: **222 file / 400 MB thật sự dùng** — thay vì 496 file / 1958 MB.
**274 file mồ côi / 1557 MB (79% khối lượng) là công toi.**

**KẾT QUẢ: 222/222 nén, 0 lỗi, tiết kiệm 283 MB** (400.56 → 117.5 MB, giảm 71%).
60 ảnh + 162 video. Bản gốc còn nguyên ở `backup/pre-compress/`.

Kiểm tra thẳng R2 (bỏ qua CDN): `landing/images/summonerDetail.png` → ContentType
`image/webp`, bytes ĐÚNG là webp 2400x1600, 368,468 B (gốc 9,457,725 B PNG 3072x2048).

### ⚠ VIỆC CÒN LẠI: PHẢI PURGE CACHE CLOUDFLARE
R2 đã đúng nhưng CDN vẫn phát bản CŨ:
```
cf-cache-status: HIT | age: 204390 | cache-control: max-age=604800
GET .../summonerDetail.png        → 9,457,725 B (PNG cũ)
GET .../summonerDetail.png?v=123  → 368,468 B (webp mới, cache MISS)
```
Cache 7 ngày ⇒ KHÔNG purge thì người dùng không hưởng gì, mà `Content-Type` header
lại đã là webp trong khi body là png — lệch nhau.

Bẫy đo đạc: `curl -I` (HEAD) trả 368468 (bản mới) còn `curl` (GET) trả 9457725
(bản cũ) — HEAD và GET đi khác đường cache. **Luôn đo bằng GET thật + đọc
`cf-cache-status`**, đừng tin mỗi HEAD.

Cách purge (chưa làm — .env.local KHÔNG có Cloudflare API token):
1. Dashboard Cloudflare → Caching → Purge Everything (1 click, nhanh nhất)
2. Hoặc cấp `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID` → viết script purge theo
   danh sách key trong manifest (API tối đa 30 URL/lần)
3. Hoặc chờ 7 ngày cache tự hết
Xong nhớ kiểm tra rồi mới xoá `backup/pre-compress/` (≈2GB, ~$0.03/tháng).

### ĐÃ DEPLOY PRODUCTION ✓ (commit 4632ca3)
Sếp giao quyền quyết → tách nhánh `feat/media-compression`, commit RIÊNG cụm nén
(r2.ts + 2 upload route + package/lock + memory), `git stash -u` cụm blog-AI rồi
`npm run build` + `tsc` trên ĐÚNG cây sẽ deploy (sạch cả hai) → ff-merge main → push.
CI xanh 1m29s. Stash đã pop lại, nhánh đã xoá.

Verify production thật: PNG 15.6MB → **517412B** `.webp`, MP4 1.28MB → **94292B**
— khớp ĐÚNG từng byte với số đo trên dev ⇒ cùng một bot. File test đã xoá khỏi R2.

Bẫy đã gặp khi commit lẻ cụm:
- `sharp` là dep MỚI → package.json + lock BẮT BUỘC đi cùng. Lock có sẵn
  `@img/sharp-linux-x64` và CI dùng `npm install` (không phải `npm ci`) nên VPS
  Linux tải đúng binary. next/react không bị bump.
- `npx tsc --noEmit` báo lỗi ma trỏ route vừa stash — đó là `.next/types/validator.ts`
  CŨ. Build lại rồi tsc mới sạch. Đừng hoảng.

### Badge SEO trong panel admin (9e8f655) + chạy radar thật lần đầu có chấm điểm
Panel `/admin` tab Blog giờ hiện `[BOFU 10/10]` + keyword tiếng Anh, sắp theo điểm
giảm dần. Màu badge phân tầng phễu: BOFU xanh lá, MOFU xanh dương, TOFU xám.

Chạy radar thật, DB lưu đúng: BOFU 8–10 kèm keyword
(`game art outsourcing cost / pricing / rates`, `outsourcing game art vs in-house team`,
`how to choose a game art outsourcing partner`).

⚠ Bẫy PostgREST: `order=score.desc` xếp **NULL LÊN ĐẦU** → query kiểm tra tưởng
radar không lưu được score, hoá ra là 9 topic CŨ (chưa có cột này) chen lên trước.
Phải `order=created_at.desc` mới thấy đúng. UI sort ở client `(b.score ?? 0)` nên
không dính lỗi này.

### Radar chọn chủ đề theo SEO + tỉ lệ chuyển đổi (góc nhìn marketing)
Sếp: "làm sao AI chọn được chủ đề SEO tốt và chuyển đổi cao".

**Sai lầm gốc: radar 100% chạy bằng TIN TỨC — sai kênh cho SEO.** Tin hết thời sự
sau một tuần, lại phải đọ với báo lớn, và người sắp thuê studio KHÔNG search tin tức.
Bằng chứng ngay trong nhà: bài đang chạy tốt nhất của blog là
"Outsourcing Game Art: A Complete Guide for Developers" — evergreen, KHÔNG đến từ tin nào.

Sửa thành 3 tầng:
1. **`SEED_QUERIES`** — danh sách truy vấn TIẾNG ANH khách thật gõ, chia BOFU
   (2d game art outsourcing studio, cost/pricing, vs in-house, how to choose partner,
   studio in vietnam) và MOFU (how to brief, style guide, QA checklist, engine-ready
   asset, spine rig handoff, NDA/IP, timezone). Đây mới là xương sống SEO.
2. **Tỉ lệ bắt buộc: ≥3 evergreen / ≤2 newsjacking.** Chủ đề evergreen KHÔNG cần bám
   tin — `source` để rỗng. Radar không còn bị tin trong tuần trói tay.
3. **AI tự chấm `score` 1-10** theo "vừa lên top vừa ra khách", script bỏ mọi topic
   dưới 6 và sắp xếp giảm dần. Prompt nói thẳng: một bài BOFU ra một khách hơn bài
   TOFU nghìn view vô ích; ưu tiên thứ đối thủ không copy được (con số thật, sự cố thật).

Migration `blog_topics_seo_fields`: thêm `keyword` (truy vấn tiếng Anh — blog xuất bản
tiếng Anh), `intent` (BOFU/MOFU/TOFU), `score`. Discord + dry-run hiện `[BOFU · 9/10]`
kèm keyword.

Chỉnh dedup cho hợp: topic evergreen không có `source` → chỉ so tiêu đề, đừng để
`undefined` khớp nhau.

Đo kết quả thật (dry-run): **4 BOFU + 1 MOFU**, điểm 8–10.
- TRƯỚC: "Dựng sương thể tích điện ảnh trong Blender" (TOFU, không ai mua)
- SAU: "Báo giá outsource art game: studio thường tính phí thế nào?" (BOFU 10/10,
  kw `game art outsourcing cost`), "Thuê ngoài hay in-house…" (BOFU 9/10)
Câu "Kể nghe" cũng đổi chất: giờ hỏi con số ("đã báo giá bao nhiêu", "giảm rework
bao nhiêu lần") thay vì hỏi cảm nhận chung.

CHƯA làm: badge intent/score trong panel `/admin` (dữ liệu đã có trong DB).

### Radar: nhắm lại nguồn + prompt theo tệp khách outsource
Sếp: "muốn tập trung visual art/animation/VFX for game + game developer, target
đúng tệp khách tìm đối tác outsource".

Đo trước khi sửa — 11 topic đầu đến từ: **80 Level 10, Game Developer 1,
GamesIndustry.biz 0**. Test feed ứng viên bằng curl thật (ArtStation 403,
Polycount 403, Reddit chặn, Unity/Unreal RSS nghèo 1–3 item, CGPress 200/10 item ✓).

3 thay đổi:
1. **Nguồn**: bỏ GamesIndustry.biz (đóng góp ĐÚNG 0 — báo thương mại), thêm
   CGPress, cho 80 Level hạn ngạch gấp đôi (24 vs 12) vì nó đẻ 10/11 topic.
2. **Prefilter `ART_WORDS`** trước khi gọi AI: tin không có chữ nào về
   art/animation/vfx/pipeline thì không đưa vào. Đo thật: 32 tin → 12 tin liên quan.
   AI đọc ít rác thì chọn trúng hơn, lại đỡ token.
3. **Prompt viết lại theo BUYER INTENT**, không còn là "chủ đề hay để viết":
   nêu rõ 2 tệp đọc (art director/producer đang tìm đối tác outsource; game dev
   tự làm art đang mắc khâu sản xuất), ưu tiên chủ đề về bàn giao/QA/engine-ready
   asset — thứ người sắp thuê lo nhất. Loại thẳng 3D nặng, gameplay code, engine
   internals (không phải cái TD Games bán) và tin review game.
   `why` giờ phải trả lời "vì sao bài này kéo được đúng người đang cân nhắc thuê".

Khác biệt thấy ngay ở dry-run: trước là "Dựng sương thể tích trong Blender",
giờ là "Bàn giao asset theo engine: vì sao đẹp chưa đủ, phải chạy đúng trong build"
và "Asset store bão hòa: vì sao tự mua asset không giải quyết bài toán sản xuất".

### Radar: chống trùng + tự hết hạn (sếp hỏi "có cộng dồn theo ngày không?")
CÓ — radar `INSERT` thẳng, không dedup, không dọn. Mỗi sáng +5, panel admin phình
vô hạn. Sếp duyệt làm cả 2 việc.

**Dedup theo tiêu đề KHÔNG ĂN THUA — đo mới biết.** Làm xong bản so tiêu đề đã
chuẩn hoá, chạy lại 2 lần: 0 lần bắt trùng, DB lên 19 topic trong 5 phút. Query DB
mới lòi ra: cùng 1 bài `80.lv/...volumetric-fog...` đẻ ra **3 tiêu đề khác chữ
nhưng cùng ý** ("Quy trình làm sương volumetric…" / "Quy trình dựng volumetric
fog…" / "Dựng sương thể tích…"). AI diễn đạt lại mỗi lần → so chuỗi vô dụng.
⇒ Khoá đúng là **`source` (URL bài gốc)**, ổn định. Giữ thêm tập tiêu đề chuẩn hoá
để chặn trùng ý khác nguồn.

Verify thật cả 2 nhánh (không mock):
- Lùi `created_at` 1 topic về 10 ngày → chạy → "dọn 1 chủ đề quá 7 ngày → skipped" ✓
- Chạy lại lần nữa cùng 34 tin → "bỏ 5 chủ đề đã gợi ý trong 30 ngày" +
  "không có chủ đề mới nào — không làm phiền sếp" ✓ (không spam Discord khi rỗng)

Dọn 9 topic trùng source do 3 lần chạy test sinh ra.

### Preview bài nháp (commit ec8a1c4)
Nút Preview trong tab Blog → `/api/admin/blog/preview` check admin secret → bật
**Draft Mode của Next** (cookie) → ném sang `/blog/[slug]` thật.
ponytail: KHÔNG dựng renderer markdown thứ hai trong admin — preview lệch giao diện
thật thì vô nghĩa. Trang chỉ bỏ lọc `published` khi draftMode bật; preview không
cộng views. Banner cam sticky + nút thoát.
Verify production 4/4: draft không cookie → 404 (không lộ), sai secret → 401,
đúng secret → 307 + cookie, có cookie → 200 + banner.

### Dọn 274 file mồ côi — VÀ CÁI BẪY REGEX SUÝT XOÁ NHẦM
Sếp duyệt dọn. Thêm `--delete-orphans`: chuyển sang `trash/2026-08-01/` chứ KHÔNG
xoá thẳng, vì "mồ côi" chỉ là kết luận từ heuristic dò tham chiếu.

**Quyết định đó cứu bàn thua.** Chạy được 251/274 thì phát hiện `CDN_RE` cũ là
`[^\s"'`)\\]+` — **dừng ở khoảng trắng**. Tên file thật CÓ dấu cách:
`landing/images/Screenshot 2026-05-13 232709.png` bị cắt thành
`landing/images/Screenshot` → không khớp key nào → **file đang dùng bị coi là mồ côi**.
Dừng script, sửa regex thành `[^"'`)\\\n<>]+` (nuốt tới dấu đóng chuỗi/ngoặc/
xuống dòng, KHÔNG dừng ở space), khôi phục **3 file bị oan** từ trash → cả 3 trả 200 ✓
- `landing/images/Screenshot 2026-05-13 232709.png`
- `landing/images/Screenshot 2026-05-07 233917.png`
- `landing/video/Super_Move/BIGBY-Long Arm of the Law_Closed.mp4`

Phát hiện được là nhờ spot-check URL từ `/api/projects` thấy một cái 404 — cái 404
đó chính là URL bị grep của tôi cắt cụt, tức là **cùng một lỗi biểu hiện ở hai chỗ**.

Chạy nốt 23 file còn lại với regex mới. Tổng: **271 file trong `trash/2026-08-01/`**.
Audit toàn diện sau khi dọn: **454 URL đang dùng, 0 ảnh vỡ** (đối chiếu từng key
với danh sách object thật trên R2, không phải spot-check).

**Bài học:** khi heuristic quyết định xoá dữ liệu, luôn cho nó đi qua thùng rác
trung gian. Ở đây heuristic sai thật, và lưới an toàn là thứ duy nhất giữ lại 3 file.

### Cron radar + hr-remind: CẢ HAI ĐANG HỎNG NGẦM, đã sửa
Sếp bảo "làm cron cho radar". Hoá ra **crontab VPS đã có sẵn** entry 8:00 hằng ngày
— task trong memory là stale. Nhưng nó **chưa bao giờ chạy được**: lệnh cron
redirect `>> logs/blog-radar.log` mà **thư mục `logs/` không tồn tại** → redirect
fail → cron chết im, không log, không ai biết.
Fix: `mkdir -p /opt/tdgames-landingpage/logs`. Chạy tay verify: "quét 34 tin,
lưu 5 chủ đề, đã gửi 5 chủ đề vào Discord" ✓

Nhân tiện soi `hr-remind.yml`: **fail 5 ngày liên tiếp** (ít nhất). Nguyên nhân
KHÔNG phải secret như tưởng — log cho thấy **HTTP 301**: workflow gọi
`https://www.tdgamestudio.com/...`, Cloudflare redirect www → apex, `curl` không
có `-L` nên nhận 301 rồi exit 1. Đã bỏ `www.`.
Lỗi thứ hai: `gh secret list` chỉ có `VPS_*` — **secret `HR_SECRET` không tồn tại**,
nên sửa URL xong vẫn 401. Em KHÔNG tự set (đưa credential sang hệ thống khác là
quyết định của sếp), chỉ báo. Sếp bảo "bạn chạy cho tôi được không" → mới làm:
đọc `app_settings.hr_secret` rồi pipe thẳng vào `gh secret set HR_SECRET`, không
in giá trị ra output/log.
Chạy thử ngay `gh workflow run hr-remind.yml`: **HTTP 200 success**, body
`{"sent":true,"staleCount":3,"needsReview":3,"stuckReview":0,"postInterview":0}`
⇒ workflow sống lại VÀ có việc thật: **3 ứng viên đang bị bỏ quên chưa ai xem**.
Bẫy nhỏ: `gh workflow run` lần đầu lỗi mạng (`connection refused`) nhưng
`gh run list --limit 1` vẫn trả run CŨ đang fail → suýt kết luận sai là "vẫn hỏng".
Luôn đối chiếu `createdAt` của run trước khi đọc kết quả.

Cache Cloudflare: sếp đã purge. Verify: `summonerDetail.png` CDN trả 368KB
(trước 9.4MB), `bgcontact.png` 114KB (trước 6.6MB) ✓ — 283MB nén đã tới tay khách.

**Bài học chọn kiến trúc:** radar chạy bằng cron VPS chứ KHÔNG phải GitHub Actions
— script cần 6 env (AI_*, SUPABASE_*, DISCORD_*) mà VPS đã có đủ; đi đường Actions
là phải nhân bản 6 secret, đúng cái bẫy vừa làm hr-remind chết.

### Cụm blog-AI: ĐÃ DEPLOY (commit 0c62953, CI 1m26s)
Sếp duyệt "cứ tiếp tục". Nghịch lý trước đó: DB đã sẵn sàng (cột `ai_prompt` có,
bảng `blog_topics` 4 topic chờ) nhưng code UI/API kẹt ở máy → production không có
đường nào duyệt topic.

Verify dev trước khi push: 401 no-key ✓, 400 guard prompt nhân vật ✓, 400 note
<40 ký tự ✓, GET topics trả đủ ✓.
**Nhánh chưa ai từng chạy thật — ảnh AI qua đường nén MỚI** (route đã bỏ sharp
riêng): gpt-image-2 → `.webp` **21KB** (trước là PNG 2.4MB, giảm 99%).
Verify production sau deploy: 5 topic, guard 400, no-auth 401 ✓.

Soi thêm: `GET /blog/topics` KHÔNG lọc status (trả cả `drafted`), nhưng
`BlogTab.tsx:255` lọc client `new|picked` → topic đã dựng không hiện lại,
không có lỗi dựng trùng bài. Không cần sửa.

Dọn: xoá ảnh AI test (R2 + row media_assets). **KHÔNG xoá bài draft**
`how-we-make-weapons-look-cool...` — nó có 7164 ký tự nội dung thật, không phải
rác rỗng; `published: false` nên không lộ ra ngoài. Sếp tự quyết trong /admin.

### CÒN LẠI
Cụm blog-AI: `BlogTab.tsx`, `_lib/api.ts`, `ImagePicker.tsx`, `blog-ai.ts`,
`api/admin/generate-image/`, `api/admin/blog/topics/`, `scripts/test-blog-ai.mjs`,
migration `20260801000000_media_ai_prompt.sql`. Chưa verify trong session này.

### Verify (e2e thật trên dev, fake compressor ở :8318)
- `npx tsc --noEmit` + `npm run build` sạch.
- Bot sống (fake nén q20): PNG 15.6MB → **198KB**, key `.webp`, size khớp ĐÚNG byte
  output của fake ⇒ bytes thật sự đi qua bot.
- Bot chết (connection refused): rơi về sharp → 1.05MB, không throw, upload vẫn 200 ✓
- Ảnh nhiễu ngẫu nhiên 1.27MB: webp KHÔNG nhỏ hơn → giữ nguyên PNG ✓ (đúng logic).

### Bug "400 multipart trên dev" — ĐÃ ĐÓNG, chẩn đoán cũ SAI
Route hoàn toàn bình thường. `.env.local` là **CRLF** → `$(grep ADMIN_SECRET ...)`
kéo theo `\r` → header `x-admin-key: ...=\r` là header không hợp lệ → Node HTTP
parser vứt request (400 + `Connection: close`, KHÔNG có log Next). Không liên quan
multipart: body JSON cũng 400 y hệt.
Thêm một tầng nữa: secret thật nằm ở DB `app_settings.admin_secret` (`getAdminSecret()`
ưu tiên DB > env), nên key trong `.env.local` có sạch `\r` cũng vẫn 401.
⇒ curl test admin: `-H 'x-admin-key: <value trong app_settings>'`, đừng lấy từ .env.local.

### Next Step
- Dựng endpoint bot rồi test thật 1 ảnh + 1 video.
- Mac ngủ = mất nén (im lặng, chỉ console.warn). Muốn cảnh báo thì nói.

---

## 2026-08-01 (session — nén ảnh tại cổng uploadToR2)
### Task
To-do "Nén ảnh mọi đường upload" — nén ở 1 chỗ duy nhất là `src/lib/r2.ts`.

### Work Done
- `uploadToR2()` nén nội bộ: contentType khớp `image/(jpeg|png|webp|avif|tiff)`
  VÀ body > 400KB → sharp `.rotate().resize({width:2400,withoutEnlargement})
  .webp({quality:90})`. Chỉ thay khi webp NHỎ HƠN bản gốc. Key đổi đuôi → `.webp`.
  gif/svg/pdf/video không match regex → đi thẳng, không đụng.
- Thêm `skipCompress?: boolean` + return thêm `size`/`contentType`.
- `admin/spine/upload` → `skipCompress: true` (atlas .png bị .atlas tham chiếu cứng tên).
- `admin/upload` trả `size`/`contentType` từ uploaded (trước trả `file.size`/`file.type` — sai sau nén).
- `admin/generate-image` XOÁ sharp riêng (q82) → truyền PNG thô + key `.png`,
  để uploadToR2 lo. Bớt 1 chỗ trùng logic.
- `media/migrate` truyền `application/octet-stream` → không match → giữ nguyên
  (đúng ý: key phải khớp `original_url` mapping).

### Verify
- `npx tsc --noEmit` sạch ✓
- Pipeline thật: PNG 3.47MB → WebP 226KB (q90, 2400px) ✓
- E2E qua `POST /api/admin/upload` trên dev KHÔNG chạy được: mọi multipart upload
  (kể cả file 653 byte, không đi nhánh nén) đều trả `400` body rỗng +
  `Connection: close`. Không auth → 401 đúng ⇒ lỗi tầng dev server/multipart,
  CÓ TỪ TRƯỚC, không phải do thay đổi này. Cần điều tra riêng.

### Next Step
- Điều tra 400 multipart trên dev (`/api/admin/upload`) — nghi Next dev body limit.
- Chưa commit. Vẫn còn cụm ImagePicker/generate-image/blog-ai dirty từ session trước.

---

