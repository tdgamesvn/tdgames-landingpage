# RECENT — 5 sessions gần nhất

_Auto-generated từ LOG.md. Không sửa tay._

---

## 2026-07-29 (session — dọn page_slots workflow-step của services-2d-art)
### Task
Sau khi gộp workflow 7→5 bước, slot ảnh `workflow-step` của trang 2D Art vẫn
còn 7 row → ảnh lệch bậc từ step 3 và 2 row mồ côi. Sếp bảo "dọn luôn".

### Work Done
`slotUrlByIndex(slots, i, fallback)` map thuần theo vị trí (`items[index]`),
nên chỉ cần xoá 2 row và đánh lại `sort_order` — không đụng code.

SQL trên Supabase: xoá id 34 (ảnh "3") + id 37 (ảnh "6"), renumber
`sort_order` 32→0, 33→1, 35→2, 36→3, 38→4.

Chọn ảnh nào để giữ theo đúng fallback trong preset: step gộp
"Concept & design approval" giữ ảnh 2 (preset dùng `Casual_character`),
step gộp "Delivery & integration" giữ ảnh 7 (preset dùng `summoners.png`).

### Result
5 row còn lại: ảnh 1, 2, 4, 5, 7 → sort_order 0–4, khớp 5 step mới.
Chỉ đổi DB, không có code change → không cần build/deploy.

### Ghi chú
`src/components/home-page-lower.tsx` VẪN dirty (5 testimonial trang chủ đổi
từ session trước). Chưa commit — vẫn chờ sếp chốt đây là nội dung thật hay nháp.

### Next Step
Chốt số phận testimonial trong `home-page-lower.tsx`.

---

## 2026-07-29 (session — workflow 3 trang service: 7 bước → 5 bước)
### Task
Sếp yêu cầu rút workflow của cả 3 trang service từ 7 bước xuống 5 bước.
Đề xuất bảng gộp trước, sếp duyệt rồi mới sửa.

### Work Done
Chỉ sửa data trong `src/components/service-workflow-presets.ts` — KHÔNG đụng
layout, vì `service-workflow-section.tsx` render động theo `steps.length`
(arrow giữa card, "Step X of N", strip flex-1 đều tự co).

Gộp bước:
- 2D Art: (2 Concept + 3 Design approval) → "Concept & design approval";
  (6 Production export + 7 Delivery) → "Delivery & integration"
- 2D Animation: (4 Polish + 5 Client review) → "Polish & review";
  (6 Export & integration + 7 Final delivery) → "Export & delivery"
- 2D VFX: (1 Brief + 2 Style exploration) → "VFX brief & style";
  (6 Unity/Spine integration + 7 Final delivery) → "Integration & delivery"

Kèm theo: `stepsSubtitle` "7 steps" → "5 steps" (cả 3), description Art
"7-step" → "5-step", `defaultStepIndex` 3→2 (Art, VFX) để trỏ bước giữa.

### Result
- `npx tsc --noEmit` sạch, mỗi config đúng 5 steps
- Không có chỗ nào khác trong repo hardcode số 7 (đã grep `7[- ]step`)

### Lưu ý còn tồn
Trang **2D Art** lấy ảnh step từ Supabase `page_slots` (slot `workflow-step`,
7 rows, map theo `sort_order` = index). Sau khi gộp: ảnh 1–2 vẫn đúng, ảnh
3–5 lệch một bậc (ảnh cũ của "Design approval" giờ nằm ở "Final rendering"),
ảnh 6–7 thành mồ côi. Cần sếp chỉnh lại trong `/admin` → PageSlots.
Animation + VFX dùng ảnh trong preset → không ảnh hưởng.

### Next Step
- Sếp review UI dev rồi deploy (git push + build trên VPS)
- Dọn 2 slot thừa của services-2d-art nếu sếp xác nhận

---

## 2026-07-29 (session — rút gọn hero copy 3 trang service)
### Task
Sếp gửi screenshot `/services/2d-vfx`: title + description + button đều quá dài
trên cả 3 trang service. Yêu cầu đề xuất phương án trước, rồi mới sửa.

### Đo được (lý do sửa)
Hero title box `max-w-[606px]` @ Changa One 92px → ~8 ký tự/dòng.
Description box `max-w-[547px]` @18px → ~60 ký tự/dòng.
- 2D Art: titleTop 23 ký tự = 3 dòng + "SERVICES"; description 85 từ ≈ 10 dòng
- 2D VFX: titleTop 23 ký tự = 3 dòng; description 72 từ ≈ 9 dòng
- 2D Animation: titleTop 17 ký tự = 2 dòng; description 72 từ ≈ 8 dòng
Chuẩn hero landing: title ≤ 2 dòng, description 35–45 từ.

### Work Done (chỉ đổi chuỗi copy, KHÔNG đụng layout)
`src/app/services/{2d-art,2d-animation,2d-vfx}/page.tsx`:
- titleTop bỏ "OUTSOURCING" → "2D GAME ART/VFX" (2D ANIMATION giữ nguyên)
- subheading gánh lại keyword "outsourcing" đã bỏ khỏi H1
- description: 85/72/72 từ → 29/31/25 từ
- ctaLabel: "Consult with our experts" → "Get a quote" (đồng bộ cả 3)
Keyword SEO vẫn giữ nguyên trong `layout.tsx` metadata của từng trang.

### Result
`npm run build` pass, 3 route service prerender static OK.

### Ghi chú
- `src/components/home-page-lower.tsx` đang dirty từ session trước (thay 5
  testimonial trang chủ: Jens Weinberg → Sophia Martinez...). KHÔNG commit lần
  này — chưa rõ đây là nội dung chốt hay bản nháp. Hỏi sếp trước khi đẩy.
- Build cần network (Google Fonts) → phải `dangerouslyDisableSandbox: true`.

### Next Step
- Chốt số phận testimonial trong `home-page-lower.tsx`
- Phần copy dài bị cắt khỏi hero (uy tín studio) có thể đưa xuống section dưới nếu cần

---

## 2026-07-28 (session — email signature generator: HUỶ)
### Task
Sếp hỏi có làm được app tạo chữ ký email cho nhân viên không (tham chiếu HubSpot).

### Kết quả: HUỶ, đã xoá sạch code
Sếp quyết tạm gác. `src/app/signature/` đã xoá. Không commit, không deploy,
production chưa bao giờ có route này.

### Bài học (quan trọng hơn code)
- **Sếp hỏi "có làm được không?" — em code luôn. SAI.** Đó là câu hỏi khả thi,
  không phải lệnh. Em còn hỏi 3 câu, sếp chưa trả lời, em tự diễn giải thành
  "không chọn = default" rồi làm. Lần sau: hỏi xong thì ĐỢI.
- Scope thật lớn hơn em tưởng nhiều. Sếp gửi ảnh mẫu ở cuối: 2 cột, avatar tròn,
  logo, 4 icon social, 4 icon contact, tagline = **10 ảnh**, không phải 1 logo.

### Ghi chú kỹ thuật (nếu sau này làm lại)
- `border-radius` KHÔNG chạy trên Outlook desktop → avatar phải crop tròn sẵn thành PNG
- SVG không render trong Gmail/Outlook → icon phải PNG host trên CDN
- Chữ ký nhiều ảnh = lần đầu người nhận thấy toàn ô trống (client chặn ảnh mặc định)
- Bảng `team_members` đã có sẵn `name` / `title` / `photo` — đúng 3 field cần dùng
- Copy phải ghi clipboard dạng rich text (`ClipboardItem` với `text/html`),
  không phải chép chuỗi HTML thô

---

## 2026-07-28 (session — viết lại FAQ 3 service page)
### Task
BD gửi bộ FAQ mới cho 2D Art / 2D Animation / 2D VFX. Review và áp vào code.

### Work Done
- `service-faq-presets.ts`: 6 câu/service → 11 câu/service, viết lại toàn bộ
- Tách `sharedClosingFaqItems` (NDA + get started) dùng chung cả 3 — bản BD viết
  3 kiểu khác nhau cho cùng một ý. "What files" / "How much" giữ riêng (khác thật)
- Sửa claim SAI của BD: "GMT+7 overlap with US Pacific" — lệch 15h, gần như không
  overlap. Đổi thành "overnight turnaround for North America" (lợi thế thật)
- Thêm số thật vào câu "why TD Games" (70+/12+/1200+ lấy từ `home-page-lower.tsx`,
  VFX dùng 70+/40+/50+ từ `service-2d-vfx-featured-showcase.tsx`) — bản BD toàn tính từ
- Dùng đúng chữ "paid trial batch" khớp `home-page-lower.tsx:562`; BD viết lệch 3 kiểu
- VFX thiếu hẳn câu NDA → thêm
- Cắt mệnh đề tự tham chiếu thừa ("following the same review gates used for the rest
  of the pipeline") — tic lặp ở cả 3 bản BD

### Result
`npx tsc --noEmit` pass. Blast radius nhỏ: mỗi const 1 consumer (`service-2d-*-faq.tsx`).

### Blockers
- Sếp không cho số ngày cụ thể cho câu timeline → viết "delivery date committed with
  the quote" thay vì bịa số. Có số thật thì siết lại được.
- Sếp tưởng FAQ sửa được trong `/admin` — KHÔNG. Đang hardcode trong
  `service-faq-presets.ts`, không có tab/API nào đọc.

### Quyết định
- NDA wording: **giữ hero "on request", sửa FAQ**. Cam kết tuyệt đối kiểu "We sign an
  NDA before any brief changes hands" là sai thực tế (khách hỏi giá không ký giấy) và
  tạo ma sát đầu phễu. FAQ đổi sang "ask and we will have one signed the same day,
  from your template or ours" — giữ sức nặng, bỏ tính tuyệt đối, thêm 2 cam kết
  cụ thể (same-day, ký theo template khách).

### Next Step
- Chờ sếp chốt: có làm FAQ editable qua admin không (cần table + tab + API)

---

