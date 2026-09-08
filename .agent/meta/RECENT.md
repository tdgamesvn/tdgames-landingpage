# RECENT — 5 sessions gần nhất

_Auto-generated từ LOG.md. Không sửa tay._

---

## 2026-09-08 (session 7 — footer: địa chỉ vỡ 7 dòng)

Sếp chê khối địa chỉ trong footer xấu. Nguyên nhân: cột CONTACTS là 1 trong 4 cột chia đều
(`lg:grid-cols-4`) bên trong khối phải chỉ chiếm `2fr` → rộng ~150px, địa chỉ 69 ký tự vỡ 7 dòng.

Fix (`site-footer.tsx`, 2 class): grid cha `lg:grid-cols-[1.3fr_2fr]` → `[1fr_2.5fr]`;
grid link `lg:grid-cols-4` → `[2fr_1fr_1fr_1fr]` + siết gap (`lg:gap-x-8 xl:gap-x-10`).
Kết quả 7 → 4 dòng. Không đụng nội dung (địa chỉ lấy từ `/api/footer`, sếp sửa ở admin).

Muốn còn 2 dòng thì rút text trong admin Footer, bỏ "Phường Vĩnh Tuy" — đã báo sếp.

---

## 2026-09-08 (session 6 — hero đè logo khi xoay ngang iPad)

Sếp gửi ảnh iPad landscape: dòng "2D ART &" trồi lên chồng vào logo TD GAMES.

Root cause: hero container `flex min-h-screen items-center pt-24 md:pt-0` — từ md trở lên
KHÔNG chừa chỗ cho header fixed (cao 104px = h-80 + py-3). Màn cao thì thừa chỗ nên không
lộ; iPad ngang trong Safari chỉ còn ~700px cao, nội dung (~640px) căn giữa → mép trên rơi
vào vùng header → đè logo.

Fix (`home-hero.tsx`, 2 chỗ):
- `md:pt-0` → `md:pt-[104px] md:pb-[104px]` — padding đối xứng nên màn cao vẫn căn giữa
  y như cũ, màn thấp thì nội dung bị đẩy khỏi vùng header. Không dùng `pt` một phía vì
  sẽ lệch tâm trên desktop.
- Cap title `10.5vh` → `9vh`: sau khi trừ 208px padding, title 4 dòng ở 700px cao vẫn
  đẩy CTA khỏi màn (section `overflow-hidden` nên tràn là mất luôn, không scroll được).

Verify screenshot: 1180×700 (iPad ngang + Safari chrome), 1194×834, 1280×1024 — logo không
bị đè, CTA + dòng "Reply within 24h" đều trong màn. Cap 9vh không bind ở màn cao
(1366px → 123px > var 100px) nên desktop/iPad dọc không đổi.

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

