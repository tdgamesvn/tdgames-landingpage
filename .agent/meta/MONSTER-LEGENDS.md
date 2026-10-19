# Monster Legends (Social Point) — quy chuẩn trang từng hệ

Sếp chốt 2026-10-18 sau khi duyệt Fire + Water. Hệ mới (Dark, Light, Nature, …) làm
**đúng y quy trình này**; thay đổi gì khác chuẩn thì hỏi sếp trước.

Trang mẫu: `/portfolio/monster-legends-fire`, `/portfolio/monster-legends-water`.
Code: `src/components/portfolio/spine-stage.tsx` (sân khấu), `src/app/portfolio/_monster-legends/shared.ts`
(phần chung), `src/app/portfolio/monster-legends-<hệ>/{page.tsx,project-data.ts}`.

## Nội dung (đã chốt — không đổi)

- **Chỉ show nhân vật**. Bỏ `fx_ultimate` + `avatar` trong source.
- **Bậc**: `_1` = **Baby**, `_3` = **Adult**, thư mục bắt đầu `awakened` = **Awakened** (cao nhất,
  màu accentSoft). Mặc định mở bậc cao nhất.
- **Mỗi quái 1 sân khấu xếp dọc** (khách lướt là xem), không có dãy chọn quái.
- Con có Awakened **và** Baby/Adult → **tách 2 sân khấu liền nhau**: Baby/Adult, rồi Awakened riêng
  (sếp chốt 2026-10-19). Tự động qua `splitAwakened(...)` bọc ROSTER trong project-data.
- Nhãn mục: `"<Hệ> monsters · Animation Spine"`.
- Summary: `summaryFor("<Hệ>")` — vai trò studio = Spine 2D animation các dạng baby/adult/awakened +
  hướng dẫn bấm dạng/animation. **Không nêu số lượng nhân vật.**
- Logo Monster Legends to (300/420px), **không** có dòng chữ dưới logo.
- Thứ tự roster: Awakened/Ancestor/Architect lên đầu, Mythic sau.

## Sân khấu (đã chốt — đang là mặc định trong code, KHÔNG chỉnh lại)

- Showreel: **Idle xen giữa mọi animation**, **Walk ×2**, bỏ Knocked out (prone); lặp từ Idle.
- Mix giữa animation **0.25s** (cùng tên nối nhau = 0).
- Cỡ quái **đồng bộ tự động**: đo "thân đặc" ở idle (90% diện tích ÷ 0.82, trộn độ đầy ±15%),
  bỏ slot additive / attachment `fx/` / slot alpha≈0. Cỡ = min(57% cao, 60% rộng) chung cả khung.
- **Camera tự lùi** khi animation vượt khung, tối đa **×1.5**; vượt hơn thì chấp nhận cắt.
  Nền thu nhỏ cùng camera quanh chân.
- **Bóng đổ theo dáng** (không phải elip): sáng từ trước-trái → bóng ra sau-phải, ép 0.3, xiên 0.75,
  blur 3px, opacity .42. FX additive không đổ bóng.
- Mobile: khung vuông, quái cân giữa + nền dời để tâm sàn trùng chân. Desktop 16:9.
- Atlas lên web: **WebP lossless** (lossy làm vỡ viền texture PMA). Additive dùng
  `pmaAdditiveBatching` (đã bật trong `SpineCharacter`).

## Các bước làm 1 hệ mới (vd `Dark`)

1. **Kiểm source** `media-inbox/Monster Legend/<Hệ>/`: liệt kê quái + bậc, Spine version (runtime
   4.2), atlas 1 trang + `pma:true`, skin `basic`, tên attachment `basic/…` + `fx/…`. Khác chuẩn →
   báo sếp trước.
2. **Upload Spine**: `node --env-file=.env.local scripts/upload-monster-legends.mjs <Hệ> --apply`
   → `landing/portfolio/monster-legends-<hệ>/spine-v2/<id>/<bậc>.{json,atlas,webp}` + logo, splash.
   In manifest (id → bậc → animations) để dựng roster.
3. **Nền sân khấu (cartoon)**: thêm 1 dòng `SCENES.<Hệ>` trong `scripts/gen-monster-legends-bg.mjs`
   (mô tả môi trường trống, sàn tròn phẳng ở giữa, tông dịu) → chạy gen → **xem ảnh** (phải cartoon
   như SplashArt game, không "real") → `--upload` (arena-v3.webp).
   - Đo tâm vùng sàn sáng trên ảnh = `gy` (tỉ lệ chiều cao). Trong project-data đặt
     `groundY: (gy − 1/6) × 1.5` và `backgroundRoom: 1.5`.
4. **Splash hero (AI)** — mỗi hệ một `shot` (bố cục/góc máy) RIÊNG trong `SPLASH.<Hệ>`, không dùng
   lại bố cục hệ khác (sếp 2026-10-19: các banner na ná pose). Prompt đã ép vùng an toàn (mọi nhân
   vật trong 15–85% cao, 8–92% rộng) vì desktop cắt trên/dưới; mobile/tablet dùng
   `coverAspectMobile: 16 / 9` để không cắt hai bên. Bản hiện tại: splash-ai-v3.jpg.
    chụp render Spine nền trong suốt của ~5 con (Playwright, dáng idle) →
   `scripts/.out/monster-legends/ref-<hệ>-0..4.png`; thêm cấu hình `SPLASH.<Hệ>` (cast theo đúng thứ
   tự file, `hero` = con trung tâm, `scene`) trong `scripts/gen-monster-legends-splash.mjs` → gen
   → **soát từng con giữ đúng thiết kế** + style cartoon như SplashArt gốc → `--upload`.
   Server ảnh có thể mất >5 phút/ảnh (script đã chờ tới 15 phút).
5. **Trang**: copy `src/app/portfolio/monster-legends-water/` → `monster-legends-<hệ>/`, sửa:
   `cdnFor`/`monsterFactory("<hệ>")`, ROSTER, `summaryFor("<Hệ>")`, nhãn mục, theme (accent theo
   hệ, accentSoft cho Awakened), `coverImage: splash-ai-v2.jpg` (theo version đã upload),
   `groundY`, `backgroundRoom`, `metadata` slug.
6. **Kiểm** (dev `npx next dev -p 3100`; proxy 404 lạ → `rm -rf .next/dev`): chụp mọi sân khấu
   desktop 1280 + mobile 390 ở Idle → cỡ đều, chân trên sàn sáng; vài animation mạnh (Attack,
   Skill, Special) → không cắt người, nền lùi theo, bóng đúng; 0 lỗi trang.
   Con nào trông lệch cỡ bằng mắt → `scale` riêng bậc đó (vd Kennix Awakened 1.2, Torog 1.1).
7. **Deploy**: tsc + eslint + `detect_changes` → commit → push (CI ~1m30) → curl 200.
   Trang để **ẨN** (chưa row `projects`, chưa sitemap) tới khi sếp duyệt.

## Sửa asset sau khi đã upload

- CDN cache 1 ngày: **không ghi đè cùng key**. Upload lại riêng 1 quái vào thư mục mới:
  `upload-monster-legends.mjs <Hệ> --only=<id> --dir=spine-v3 --apply`, rồi trong project-data
  truyền `dir` cho quái đó (tham số thứ 6 của `monster(...)`, vd Iceblood).
- Ảnh nền / splash mới: tăng VERSION trong script (key mới), đổi URL trong project-data.

## Trạng thái

- Fire, Water: live (row `projects` + sitemap, 2026-10-18). R2 asset cũ đã chuyển trash/2026-10-18/.
- Dark: dựng xong, ẩn — chờ sếp duyệt rồi thêm row `projects` (Character Animation, subtitle
  "Spine 2D Animation", image = splash-ai-v2.jpg) + slug vào `src/app/sitemap.ts`.
- Light, Earth, Magic, Metal, Nature, Thunder, Special: dựng xong 2026-10-19, ẩn chờ duyệt (cùng Dark).
  Đủ 10 hệ.
- Lệch chuẩn source đã gặp (code đã tự xử lý): thư mục `avatar_awakened` / `fx_ultimate_awakend`
  (bỏ theo tiền tố); attachment FX tên `VFX/…`; hạng `rare`, `common`; quái thiếu bậc giữa (Tyr: Baby + Awakened). Gặp kiểu lệch mới → sửa script/stage
  rồi ghi thêm vào đây. Bước kiểm bắt buộc: đối chiếu roster trong project-data với manifest upload.

- 2026-10-19: sếp duyệt → publish đủ 10 hệ (row `projects` + sitemap).
