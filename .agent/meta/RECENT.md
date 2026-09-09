# RECENT — 5 sessions gần nhất

_Auto-generated từ LOG.md. Không sửa tay._

---

## 2026-09-09 (session 11 — bỏ section showreel, đổi vai section //05)

`/services/full-game-production`: sếp bảo showreel chưa có thì ẩn tạm, và chê tiêu đề
"FEATURED Games we've shipped" của `//05` không khớp nội dung (3 card đều là case
outsource visual: Summoner Era / Puzzle Wonderland / Axie).

- Xoá hẳn section `// 03 Game production showreel` (kèm `resolveSlot(PAGE,"showreel")`,
  helper `isVideo`, import `Link` — chỉ dùng ở đó). Để lại comment `ponytail:` chỉ cách
  khôi phục: `git log -S showreel-full-game-production`. Slot `showreel` trong DB không
  đụng, còn nguyên chờ video thật.
- `//05` KHÔNG bỏ (mất chỗ sửa ảnh qua admin Page Slots) mà đổi vai cho khỏi trùng
  `//04`: title "FEATURED client titles", railLabel "Client work", description nói rõ
  là game của studio khác, TD chạy pipeline art/animation/VFX. Giờ `//04` = game tự làm
  end-to-end, `//05→//04` = việc làm cho khách.
- Đánh lại số section: shipped 04→03, featured 05→04, faq 06→05, contact 07→06.

Hỏi sếp chọn "đổi tiêu đề" vs "ẩn luôn" → ban đầu sếp không trả lời nên mặc định đổi
tiêu đề, sau đó sếp gửi screenshot chốt **ẩn luôn** (không phải game production).
Đã xoá `<ServiceFeaturedShowcaseSection>` + `DEFAULT_PRODUCTS` + `resolveFeaturedCards`
+ import. 3 card đó vẫn còn ở /portfolio và 3 trang service 2D nên không mất nội dung.

Trang giờ còn 5 section: 01 What we do → 02 Workflow → 03 Games we shipped end to end
→ 04 FAQ → 05 Contact. Slot `featured-card` của page `services-full-game-production`
trong DB thành mồ côi (không ai đọc) — để nguyên, xoá sau nếu vướng.

Verify: `tsc --noEmit` + `eslint` file này sạch. Chưa xem bằng mắt, chưa commit.

## 2026-09-09 (session 10 — section //04 chứa 3 game thay vì 1, mockup)

Sếp hỏi trang `/services/full-game-production` sẽ show sao khi có nhiều game (trước mắt 3),
và chốt KHÔNG phân biệt game tự làm vs làm cho khách.

Design chốt: `//04` từ spotlight-1-game thành list `SHIPPED_GAMES` — 1 section header chung
("Games we shipped end to end"), mỗi game là 1 `<article>`: tên (3xl, không 5xl) + 1 dòng
blurb + nút store/badge cùng hàng, dưới là rail ảnh riêng. Block cao ~380px thay ~560px,
3 game = section 2035px. Rail tách thành `GameShotRail` trong cùng file (không đẻ file mới):
duration = `shots.length × 4.5s`, `animationDelay: -i*6s` để 3 rail lệch pha, `< 5 ảnh` thì
render lưới tĩnh vì rail 2 ảnh lặp trông giả. `dim: true` phủ `bg-black/80` lên ảnh.

MOCKUP (sếp sẽ replace): game 2 "Tidy Mart Sort Puzzle" và game 3 "Coming Soon" đang mượn
ảnh + link store của Shake It!. Đã ghi comment `ponytail:` ngay trên `SHIPPED_GAMES`.

Section `//05 ServiceFeaturedShowcaseSection` GIỮ NGUYÊN — đã đề xuất gộp (giờ trùng vai)
nhưng sếp chưa chốt, và data của nó sửa được từ admin Page Slots nên gộp là mất chỗ đó.

Verify: `tsc --noEmit` + eslint file này sạch; screenshot 1440px: 3 article, 3 rail, lệch pha đúng.
gitnexus impact `ServiceFullGameProductionPage`: LOW, 0 caller.

## 2026-09-09 (session 9 — rail Shake It!: sửa giật khi lặp marquee)

Sếp gửi screenshot section `// 04 Shipped title` (`/services/full-game-production`) xin cho
ảnh chạy ngang liên tục + gradient mờ 2 mép. Screenshot là bản CŨ — marquee + `mask-image`
đã có sẵn trong `page.tsx` (sửa 09:55 cùng ngày), sếp chỉ cần reload.

Nhưng có bug thật: track dùng `gap-4`, gap chỉ chèn GIỮA các item nên với 3 bộ ×8 ảnh,
track = 24 item + 23 gap, mà keyframe `marquee` dịch `-33.333%` → 1/3 track = 8 item +
7.67 gap → mỗi vòng lặp nhảy ~5px. Fix: bỏ `gap-4`, thêm `mr-4` lên từng item → 1 bộ =
8×(w+16), chia hết cho 3. `tsc --noEmit` sạch.

Chưa xem bằng mắt (dev server không chạy) — cần `npm run dev` để verify chuyển động.

## 2026-09-08 (session 8 — mobile: title bé, body to, tương phản cỡ chữ yếu)

Sếp chê hero trên mobile: title nhỏ mà đoạn mô tả to, nhìn không có phân cấp.

Đo lại ở 390px: title `min(100px, 9vw, 9vh)` = 35px, body `var(--hero-desc-size, 18px)`
là px CỨNG không co → tỉ lệ title/body chỉ 1:1.9, trong khi desktop là 100/18 = 1:5.5.
Body 18px trên màn 390 còn ăn 8 dòng, nuốt hết fold.

Fix (`home-hero.tsx`, 3 chỗ): cap title `9vw` → `11vw` (390 → 43px, 360 → 40px);
body `18px` → `min(var(--hero-desc-size, 18px), 4.2vw)` (390 → 16.4px, desktop giữ 18px
vì 4.2vw đã > 18px từ ~430px rộng). Tỉ lệ mới ~2.6:1.

Thử 11.5vw trước nhưng ở 360×800 dòng "Reply within 24h" chạm sát đáy — hero
`overflow-hidden` nên tràn là mất, hạ về 11vw cho chừa chỗ thanh URL trình duyệt.

Verify screenshot 390×844 + 360×800: CTA + dòng note đều trong màn.
Thêm preset `mobile` / `mobile-sm` vào `scripts/responsive-shots.mjs` (file gitignored).

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

