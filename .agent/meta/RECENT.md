# RECENT — 5 sessions gần nhất

_Auto-generated từ LOG.md. Không sửa tay._

---

## 2026-09-08 (session 5 — fix mascot spine đè nút CTA trên iPad)

Sếp báo lỗi trên iPad: con cá `contact-mascot` đè lên nút GET A FREE QUOTE ở card `//08 CONTACT`
(`home-page-lower.tsx`). Root cause: `spine_characters.contact-mascot.offset_x = -200` (px cứng,
tune cho desktop) được truyền thẳng vào `SpineCharacter` → CSS transform, không chiếm layout,
không co theo bề rộng card. Desktop rộng thì lọt chỗ trống; iPad card hẹp → chồng lên CTA.

Fix ở call site (không đụng component dùng chung): `offsetX={0}`, wrapper div nhận
`--mascot-x` từ DB và chỉ áp `xl:[transform:translateX(var(--mascot-x))]`. Lưu ý Tailwind v4:
`xl:translate-x-[var(--mascot-x)]` KHÔNG sinh CSS (đo được `transform: none`) — phải dùng
arbitrary property `[transform:...]`.

Verify bằng playwright đo computed transform: 768 → none, 1024 → none, 1280 → matrix(...).
`tsc --noEmit` sạch (lỗi `.next/dev/types/routes.d.ts` là rác do dev server đang chạy).

Sếp vẫn chỉnh offset desktop qua admin Spine tab như cũ; giá trị chỉ còn tác dụng từ 1280px.

---

## 2026-09-08 (session 4 — self-review pass responsive header/hero + fix 5 findings)

Chạy `/code-review` lên diff responsive chưa commit (site-header + home-hero), ra 5 finding,
fix hết:

1. **Card stack mất ở 1024–1279px** (`home-hero.tsx`): diff đổi `lg:block` → `xl:block`,
   mà `switchVideo` chỉ nằm trong `DraggableStack` và không có auto-advance → iPad Pro dọc
   chỉ xem được media đầu. Fix: trả lại `lg:block`, thêm wrapper `scale-[0.65] xl:scale-100
   origin-bottom-right` để vừa chỗ. Verify bằng screenshot 1024 + 1280: không đè text.
2. **Gạch chân nav ăn vào chữ** (`globals.css`): `.nav-link::after` hardcode `left/right:14px`
   trong khi padding đã thành `clamp(8px,0.75vw,14px)`. Fix: dùng đúng clamp đó cho ::after.
3. **`md:pt-0` bị xoá** → `pt-24` áp mọi desktop, đẩy hero xuống 96px đúng ở màn thấp.
   Fix: trả lại `md:pt-0`.
4. Comment cap `10.5vh` sai (nói ">=1000px không bind", thực ra bind dưới ~950px cao). Sửa comment.
5. Script `responsive-audit.mjs` / `responsive-shots.mjs` import playwright-core bằng path
   npx cache của máy local → gitignore cả 2 + `careers-after.png`; thêm default cho `argv[2]`.

Verify: `tsc --noEmit` sạch, lint không thêm lỗi mới (91 lỗi còn lại đều pre-existing,
không nằm ở dòng đã sửa). Chưa commit — chờ sếp duyệt.

Note sandbox: `next dev` bị chặn `listen 0.0.0.0:3000` → phải chạy `dangerouslyDisableSandbox`.

---

## 2026-09-08 (session 3 — deploy fix cdn-proxy; lộ ra thủ phạm THỨ HAI: Cloudflare)

Commit `f5d0e97` + push → CI deploy 1m10s OK. Spine careers-hero lành: sếp đã
replace asset, DB trỏ `landing/spine/careers-hero/awakened-ancestor-fire-akira-karioka_3.{json,atlas,png}`
— cả 3 file **200** (path `devil-lord/` trong manifest mồ côi là rác, bỏ qua).

**Nhưng verify production lộ ra fix chưa đủ.** Origin VPS trả đúng
(`404 + cache-control: no-store`, curl thẳng `127.0.0.1:3000` trên vps6core),
Cloudflare **ghi đè** header thành `max-age=604800` cho cả 404 (`cf-cache-status: MISS`
— không cache ở edge nhưng vẫn bơm Browser Cache TTL 7 ngày xuống browser khách).
File 200 cũng bị đổi `max-age=300` → `604800, must-revalidate`.

→ Zone `tdgamestudio.com` đang set **Browser Cache TTL = 1 week**, không phải
"Respect Existing Headers". Code không sửa được chuyện này.

**Việc còn lại (sếp làm trên dashboard, 1 click):** Cloudflare → tdgamestudio.com →
Caching → Configuration → Browser Cache TTL → **Respect Existing Headers**.
Hoặc hẹp hơn: Cache Rules, match `URI Path starts with /api/cdn-proxy/`,
Browser TTL = Respect origin. Chưa có CF zone API token trong `.env.local` và
MCP `cloudflare-api` chưa auth nên không tự làm được.

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

