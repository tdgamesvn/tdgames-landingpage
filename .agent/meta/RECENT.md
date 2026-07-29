# RECENT — 5 sessions gần nhất

_Auto-generated từ LOG.md. Không sửa tay._

---

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

## 2026-07-29 (session — chốt số liệu 50+ & testimonial, deploy)
### Task
Sếp chốt: số liệu đúng, testimonial để sếp sửa nội dung sau → commit + deploy
toàn bộ phần đang dirty.

### Work Done
Đồng bộ con số "projects" về **50+** ở cả 4 nơi (trước đó 3 nơi nói 3 số khác nhau:
home 70+, about 30+, FAQ 70+):
- `src/app/about/page.tsx` — stat PROJECTS DELIVERED 30+ → 50+
- `src/components/home-page-lower.tsx` — stat 70+ PROJECTS COMPLETED → 50+
  PROJECTS DELIVERED; viết lại description "Why choose TD Games" + 4 card
  (SHIP-READY QUALITY / LOW-RISK START / ENGINE-READY DELIVERY / NDA & IP
  PROTECTION); thay 5 testimonial (1 typing + 4 card) sang bản nội dung mới
- `src/components/service-faq-presets.ts` — 70+ → 50+ ở FAQ 2D Art, 2D Animation
  và VFX ("50+ shipped projects"). Thêm comment: đổi số ở đây phải đổi kèm
  home-page-lower + about.

Giữ nguyên `service-2d-vfx-featured-showcase.tsx` statValue "70+" — đó là **VFX
effects created**, không phải projects.

### Result
`npx tsc --noEmit` sạch, `npm run build` pass. Commit + push + deploy VPS.

### Ghi chú
- `npm run build` fail trong sandbox (không fetch được Google Fonts) → phải chạy
  với `dangerouslyDisableSandbox: true`.
- Testimonial hiện tại là bản tạm, sếp sẽ thay nội dung thật sau.

### Next Step
Sếp gửi testimonial thật. Vẫn treo: có làm trang Game Development riêng không.

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

