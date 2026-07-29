# RECENT — 5 sessions gần nhất

_Auto-generated từ LOG.md. Không sửa tay._

---

## 2026-07-29 (session — copy hero /about + deploy)
### Task
Sếp gửi screenshot hero `/about` kèm copy mới, bảo thay 2 đoạn body.

### Work Done
`src/app/about/page.tsx:107-113` — thay nội dung 2 `<p>`, giữ nguyên markup
(vẫn 2 đoạn để giữ nhịp layout):
- đoạn 1: "Founded in 2023, TD Games is a Vietnam based game outsourcing
  studio dedicated to delivering high quality Game Art, Animation, VFX, and
  Game Development services."
- đoạn 2: creativity/professionalism + long-term partnerships.

Deploy kèm luôn 2 thay đổi hero tồn từ 2 session trước (layout-width + Changa
One cho `/about`, eyebrow HIRING `/careers`).

### Result
`npx tsc --noEmit` sạch, `npm run build` pass.

### Ghi chú
- Copy mới nhắc "Game Development services" nhưng site chỉ có 3 trang service
  (2D Art / Animation / VFX) — đã hỏi sếp, chưa chốt.
- `src/components/home-page-lower.tsx` VẪN dirty (5 testimonial trang chủ) —
  session thứ 7 chưa chốt, KHÔNG commit lần này.

### Next Step
Chốt testimonial `home-page-lower.tsx` + có thêm trang Game Development không.

---

## 2026-07-29 (session — eyebrow HIRING hero /careers)
### Task
Sếp gửi screenshot hero `/careers`: "HIRING" to lên 1 chút + mép trái khớp
text bên dưới.

### Nguyên nhân lệch
Box của cả 4 phần tử trong hero đều bắt đầu ở x=159.52 (đo bằng Playwright).
Lệch là do **side-bearing của font**: Changa One ở 72px đẩy nét chữ "B" vào
trong 3.6px, còn Nunito Sans 16px chỉ 1.2px → mắt thấy HIRING thò ra trái ~2.4px.

### Work Done
`careers-client.tsx:340` — `text-sm md:text-base` → `text-base md:text-lg`
(16→18px) + `ml-[2px]` bù bearing. Kèm comment giải thích con số 2px.

### Result
Đo lại trên dev: ink-left HIRING 162.91 vs BUILD 163.12 (lệch 0.2px). Chỉ đổi
className, không đụng logic.

### Ghi chú
`src/components/home-page-lower.tsx` VẪN dirty (5 testimonial trang chủ) —
session thứ 6 chưa chốt.

### Next Step
Sếp review dev → commit chung với thay đổi hero `/about` chưa deploy.

---

## 2026-07-29 (session — đồng bộ hero /about với Portfolio + Careers)
### Task
Sếp gửi screenshot `/about`, hỏi bố cục lệch so với tab Portfolio/Careers là
lỗi hay chủ đích. → Lỗi. Sếp chọn phương án C (lề + font + eyebrow).

### Nguyên nhân
Hero `/about` là hero DUY NHẤT không dùng biến layout chung:
`width: min(90%, 1280px); margin: 0 auto` thay vì `var(--layout-width, 75%)`
(`--layout-width: 76%` khai báo global ở `globals.css`). Màn >1422px bị chốt
1280px rồi auto-center → khối chữ đẩy vào giữa, lệch phải so với logo/nav.
Màn hẹp trùng khớp ngẫu nhiên nên trước giờ không lộ.
Font H1 cũng lệch: Rajdhani vs Changa One dùng ở mọi hero khác.

### Work Done
`src/app/about/page.tsx` (chỉ hero, không đụng section dưới):
- container `min(90%,1280px)` → `mx-auto` + `var(--layout-width, 75%)`
- H1 `var(--font-rajdhani)` → `changaOne.className` (import `Changa_One`)
- ~~thêm eyebrow gạch amber + "2D game art studio · Hanoi"~~ → sếp bảo bỏ,
  đã gỡ lại. Hero chỉ còn H1 + 2 đoạn + CTA (mt-8 như cũ).

Kèm theo (sếp phát hiện qua screenshot `/careers`): eyebrow "HIRING" chỉ
`text-xs` (12px) trong khi H1 72px → tỉ lệ 1:6, nhìn hụt. Sửa
`careers-client.tsx:340` → `text-sm md:text-base` + `tracking-[0.3em]`
cho khớp subtitle hero Portfolio (16px).

### Result
`npx tsc --noEmit` sạch, `npm run build` pass. Chưa commit/deploy.

### Ghi chú
Các section dưới của `/about` vẫn dùng container riêng — chưa rà, sếp bảo mới làm.
`src/components/home-page-lower.tsx` VẪN dirty (5 testimonial trang chủ) —
session thứ 5 chưa chốt.

### Next Step
Sếp review dev rồi commit + deploy. Vẫn nợ: chốt testimonial home-page-lower.

---

## 2026-07-29 (session — sửa fact About: năm thành lập 2023)
### Task
Sếp gửi screenshot hero `/about`, chốt: studio hoạt động từ **2023**, và rà
lại các thông tin khác + CTA.

### Phát hiện: 3 nguồn nói 3 năm khác nhau
- `src/app/about/page.tsx` — "Founded in 2019"
- Footer (Supabase `site_config.footer.description1`) — "Founded in 2022"
- Sếp — 2023

### Work Done
`src/app/about/page.tsx`:
- 2019 → 2023, viết lại 2 đoạn hero (bỏ giọng "kể lể lâu năm", studio 3 năm
  nên bán tốc độ + chất lượng)
- Stats: `5+` → `3+` YEARS OF EXPERIENCE, `50+` → `30+` PROJECTS DELIVERED
  (7 CREATIVE TEAM giữ nguyên — sếp xác nhận)
- CTA "Get in touch" giữ nguyên (đề xuất "Get a quote" cho đồng bộ 3 trang
  service, sếp chọn giữ)

DB: `UPDATE site_config` key `footer` → description1 2022 → 2023.
Code default `site-footer.tsx` + placeholder `FooterTab.tsx` cũng sửa 2019 →
2023 (chỉ là fallback/UI hint, không phải nguồn thật).

### Result
`npx tsc --noEmit` sạch, `npm run build` pass. DB + code đi cùng một deploy
(theo đúng bài học session trước).

### Ghi chú
`src/components/home-page-lower.tsx` VẪN dirty (5 testimonial trang chủ) —
session thứ 4 chưa chốt. Không commit lần này.

### Next Step
Chốt số phận testimonial `home-page-lower.tsx` → commit hoặc `git checkout`.

---

## 2026-07-29 (session — deploy workflow 5 bước)
### Task
Sếp hỏi "commit deploy chưa? sao lâu vậy". Đúng — workflow 5 bước làm xong từ
sáng nhưng em để nằm chờ chung với testimonial (đang chờ sếp chốt).

### Sai lầm cần nhớ
2 thay đổi độc lập bị gom chung một chuyến chờ. `home-page-lower.tsx` chờ sếp
duyệt nội dung KHÔNG phải lý do giữ `service-workflow-presets.ts` lại. Hậu quả:
production chạy lệch nửa ngày — code render 7 step nhưng `page_slots` đã dọn
còn 5 ảnh (session trước đổi DB mà không deploy code đi kèm).
**Quy tắc rút ra: đổi DB và code phụ thuộc nhau thì phải đi cùng một deploy.**

### Work Done
`npx tsc --noEmit` sạch → commit `e3e2f1c` (chỉ workflow presets + memory,
KHÔNG kèm testimonial) → push → VPS: pull + build + `pm2 restart`.

### Result
Verified production cả 3 trang: `curl /services/2d-{art,animation,vfx}` đều trả
"5 steps". 3 route prerender static OK. PM2 restart #99, online.

### Còn tồn
`src/components/home-page-lower.tsx` vẫn dirty (5 testimonial trang chủ) — sang
session thứ 3 chưa chốt. Hỏi sếp dứt điểm: nội dung thật hay nháp?

### Next Step
Chốt testimonial `home-page-lower.tsx` → commit hoặc `git checkout` bỏ.

---

