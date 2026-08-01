# RECENT — 5 sessions gần nhất

_Auto-generated từ LOG.md. Không sửa tay._

---

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

## 2026-08-01 (session — nén ảnh AI sang WebP)
### Task
Sếp hỏi xác nhận CliproxyApi gọi qua Mac bằng tailscale, rồi yêu cầu nén ảnh AI.

### Xác nhận hạ tầng AI
- VPS `/opt/tdgames-landingpage/.env.local`: `AI_BASE_URL=http://100.126.162.96:8317/v1`
  → tailscale IP của `mac-mini-ca-tdgames-mac01` (Mac dev). Mac sleep = HR evaluate,
  blog topics, generate-image chết theo.
- Local `.env.local`: `http://localhost:8317/v1` (không qua tailscale).

### Work Done
- `npm i sharp` (0.35.3) — trước đó chỉ là transitive dep của Next, không khai báo.
- `POST /api/admin/generate-image` — b64 PNG từ gpt-image-2 → `sharp().webp({quality:82})`
  → R2 với key `.webp` + `content-type: image/webp`. Bỏ biến `format`/`output_format`.
- Không dùng service nén nào trên Mac: quét thấy Mac chỉ có CLI `cwebp`/`sips`/`ffmpeg`,
  không có endpoint HTTP. sharp trong app lazy hơn — không thêm hop tailscale,
  không phụ thuộc Mac bật/tắt.

### Verify
- `npx tsc --noEmit` sạch ✓
- sharp native binding chạy: PNG 1536x1024 23KB → WebP 2.8KB (ảnh test phẳng;
  ảnh AI thật ~2MB → kỳ vọng ~200KB) ✓

### Next Step
- Chạy thử 1 lần trên dev/prod với prompt thật để chốt con số nén.
- `POST /api/admin/upload` (upload tay) vẫn CHƯA nén — nếu sếp muốn thì thêm
  nhánh `isImage` gọi sharp y hệt.

---

## 2026-08-01 (session — ImagePicker 3 tab + ảnh AI gpt-image-2)
### Task
Sếp muốn chọn ảnh cover blog từ 3 nguồn: kho media, upload, và AI generate
(gpt-image-2 qua cliproxyapi).

### Work Done
- Migration `20260801000000_media_ai_prompt.sql` — thêm cột `ai_prompt` vào
  `media_assets`. `ai_prompt not null` = ảnh AI → truy vết được prompt gốc.
- `POST /api/admin/generate-image` — gọi `AI_BASE_URL/images/generations`
  (model `gpt-image-2`, override qua `AI_IMAGE_MODEL`), nhận `b64_json` →
  `uploadToR2` → insert `media_assets` row → trả `{url, key}`. Ảnh AI đi đúng
  đường R2 như upload thường, KHÔNG nhúng base64, KHÔNG hotlink provider.
- `ImagePicker.tsx` (mới) — 3 tab Kho / Upload / AI dùng chung. Tab AI chỉ là
  "tab Upload với nguồn file khác" → code thêm mỏng.
- `BlogTab.tsx` — thay khối cover image cũ (input + nút Upload + `uploadCover`
  + `fileRef`) bằng `<ImagePicker>`. Net -30 dòng.
- `_lib/api.ts` — thêm `generateImage()`.

### Guard thương hiệu (theo DECISIONS 2026-07-31)
Route chặn prompt chứa từ khoá character (`character|nhân vật|portrait|mascot|
anime|chibi|hero|girl|face|...`) → 400. Prompt hợp lệ bị append
`", abstract background artwork, no characters, no people, no creatures, no faces"`.

### Verify (dev server thật, không phải mock)
- Guard: prompt "nhân vật chibi cầm kiếm" → 400 đúng thông điệp ✓
- Happy path: 200 → `https://cdn.tdgamestudio.com/ai/2026/08/5328bb33-….png`
- CDN: `HTTP/2 200`, `content-type: image/png` ✓
- DB: row `035df3ee-…` có `ai_prompt` + `r2_key` khớp ✓
- `tsc --noEmit` sạch; lint không phát sinh lỗi mới (91 problems là baseline cũ).

### Chưa làm (cố ý)
- Ảnh gpt-image-2 ra ~2.4MB PNG, chưa nén/convert webp. Thêm sharp khi nào
  thấy nặng thật.
- `ImagePicker` mới cắm ở BlogTab. Portfolio/Team/PageSlots vẫn dùng UI cũ —
  cắm thêm khi cần, props đã sẵn sàng.
- Chưa commit/deploy — chờ sếp review dev.


## 2026-07-29 (session — logo client vào Page Slots)
### Task
Sếp gửi screenshot tab Page Slots (`/admin`, page `home`), hỏi tại sao không
thấy phần logo client. Sếp muốn quản lý logo client từ admin.

### Nguyên nhân
`home-page-lower.tsx:415` đọc slot `home/client-logos`, rỗng → rơi về mảng
hardcode `FALLBACK_CLIENT_LOGOS` (5 logo CDN). Trong DB `page_slots` không có
row `client-logos` nào → tab admin không render nhóm nào (chỉ render nhóm có
row). Thêm nữa, cả 2 dropdown slot trong `PageSlotsTab.tsx` đều thiếu option
`client-logos` → không có đường thêm từ UI.

### Work Done
- `PageSlotsTab.tsx`: thêm `<option value="client-logos">` vào form "Add Slot
  Manually" (dòng ~461) + thêm `"client-logos"` vào `QUICK_SLOTS.home`.
- Seed 5 logo fallback vào `page_slots` (id 44-48, page `home`, slot
  `client-logos`, sort_order 0-4, display_name Client 1-5) qua Supabase MCP.

### Result
Trang chủ giờ đọc logo từ DB; `FALLBACK_CLIENT_LOGOS` giữ lại làm lưới an toàn
khi API lỗi. Chưa commit/deploy — chờ sếp review dev.

### Bổ sung — deploy: hoá ra đã tự động từ lâu
Sếp hỏi có cách deploy nhanh hơn không. Kiểm tra: `.github/workflows/deploy.yml`
**đã có auto-deploy on push từ 2026-05-23** (ssh-action → pull → npm i → build →
pm2 restart, ~1m30s). Doc `CLAUDE.md` ghi "Deploy (manual, trên VPS)" → agent
các session trước cứ ssh build tay sau khi push.

Đó cũng chính là nguyên nhân 4/5 run gần nhất fail sau ~26s: build tay chạy
song song với CI → `⨯ Another next build process is already running`. Prod vẫn
đúng vì build tay hoàn tất, nhưng CI đỏ.

Fix: `deploy.yml` thêm `concurrency: {group: deploy-vps, cancel-in-progress: false}`
(không cancel — kill giữa chừng để lại lock) + `workflow_dispatch` để chạy lại
tay. `CLAUDE.md` viết lại mục Deploy: push xong là xong, KHÔNG ssh build tay.

Commit `445b88c` → CI xanh, deploy 1m30s không cần thao tác gì.

### Bổ sung 2 — prod 500 toàn site (đã fix)
Sau deploy `445b88c`, `https://tdgamestudio.com/` trả **500** (API `/api/*` vẫn
200 nên dễ tưởng lành). PM2 err log:
`InvariantError: The client reference manifest for route "/" does not exist`.

Nguyên nhân: `.next` trên VPS là artifact **lai giữa 2 lần build đè lên nhau**
(build tay + build CI cùng ngày). Next build không xoá `.next` cũ → manifest cũ
sót lại, không khớp chunk mới.

Fix ngay: ssh VPS → `rm -rf .next && npm run build && pm2 restart`. Prod 200 lại
(home / admin / careers).

Chặn tái diễn — `deploy.yml` trước bước build:
`find .next -mindepth 1 -maxdepth 1 ! -name cache -exec rm -rf {} +`
(xoá sạch build cũ, giữ `.next/cache` để build vẫn nhanh). Commit `4f...` CI xanh.

**Bài học:** sau deploy phải curl trang HTML, không chỉ curl API.

### Bổ sung 3 — rà QUICK_SLOTS thiếu slot
Grep toàn bộ `resolveSlot` / `usePageSlots` để đối chiếu với `QUICK_SLOTS` trong
`PageSlotsTab.tsx` → thiếu: `home/hero-carousel`, `about/hero`, `careers/hero`,
`services-2d-*/hero`. Đã bổ sung (commit `58839d1`) kèm comment: slot nào code
đọc thì phải có ở đây, không thì không có đường upload từ UI.

### Bổ sung 4 — healthcheck sau deploy (+ phát hiện port sai)
`deploy.yml` sau `pm2 restart`: curl `http://127.0.0.1:3000/` tối đa 10 lần
(3s/lần), không 200 → in `pm2 logs --err` rồi `exit 1`. Curl trang **HTML**,
không phải `/api` — `/api` vẫn 200 khi `.next` hỏng.

Lần chạy đầu fail: healthcheck curl port **3001** (lấy từ `ecosystem.config.js`)
→ HTTP 307 về `/login`. Hoá ra **3001 là app khác** (platforms); landing page
chạy trên **3000** và nginx cũng proxy về 3000. `ecosystem.config.js` ghi 3001
là bẫy: nếu PM2 rơi vào nhánh fallback `pm2 start ecosystem.config.js` thì app
bind nhầm port → site chết. Đã sửa cả hai về 3000 (commit `1ae...`).

Run sau xanh, log: `thử 1: HTTP 000` → `✅ trang chủ HTTP 200` (retry loop đúng
là cần, app mất ~3s boot).

### Next Step
Sếp thay 5 logo tạm bằng logo khách thật ngay trong tab Page Slots.

---

## 2026-07-29 (session — viết lại Our Values `/careers`)
### Task
Sếp gửi screenshot section "Our Values" trang `/careers`, hỏi sửa sao cho ứng
viên đọc thấy hấp dẫn để apply. Sếp bảo làm theo đề xuất của agent.

### Vấn đề của bản cũ
5 value toàn nói về *không khí* (trung thực, ấm áp, "big family", quan tâm) —
paste sang studio nào cũng đúng, không trả lời câu ứng viên artist thực sự
scan tìm: dự án gì, học được gì, có crunch không. "Big family" trong ngành
outsource còn bị đọc thành "OT không tính lương" → phản tác dụng.

### Work Done
`src/app/careers/careers-client.tsx`:
- Viết lại toàn bộ `BENEFITS` (5 item, dòng 92-124): Work that ships /
  Feedback, not silence / Level up on the clock / Planned, not panicked /
  Say it straight. Mỗi desc ép về ~22-26 từ để 5 card cao bằng nhau; mỗi
  value kèm 1 chi tiết kiểm chứng được thay vì tính từ.
- Gán lại field `icon` cho khớp nghĩa mới — KHÔNG viết SVG mới, tái dùng 5
  icon sẵn có trong `BenefitIcon`.
- Grid: bỏ `xl:grid-cols-5` → dừng ở `lg:grid-cols-3` (5 cột làm mỗi card
  chỉ ~150px, title card 1 xuống 2 dòng gây lệch chiều cao).
- Subtitle section đổi sang "Not slogans — what you can actually expect from
  your first week here."

### Result
`npx tsc --noEmit` sạch. Chưa commit/deploy — chờ sếp review dev.

### Bổ sung trong cùng session — dải hard benefits
Sếp cấp policy thật → thêm mảng `PERKS` (9 chip) + render dải chip bo tròn
dưới 5 card. Fact sếp xác nhận: remote 1 ngày/tuần, T2-T6 8h nghỉ T7-CN,
không OT (có OT thì trả lương), thử việc 100% lương; lương 13 / bảo hiểm /
thiết bị / phép / review lương "đều có" (không có con số cụ thể → viết
không kèm số: "Full social insurance", "Paid annual leave", "Regular salary
reviews").

Kèm 2 claim treo đã xử:
- Bỏ "artists who have shipped 50+ projects" → "senior artists across 2D art,
  animation and VFX" (sếp không xác nhận con số gán cho người).
- Card "Planned, not panicked" giờ viết được "when overtime happens, it is
  paid" vì sếp đã confirm.

### Next Step
Sếp review dev → commit + deploy. Vẫn treo: testimonial thật cho
home-page-lower, có làm trang Game Development riêng không.

---

