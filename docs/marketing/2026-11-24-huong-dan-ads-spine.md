# Hướng dẫn bấm Google Ads — tách nhóm Spine (2026-11-24)

Tài khoản 620-246-9844 · Chiến dịch `Search – Animation – T1` (đang TẠM DỪNG).
Em đã xếp 32 lệnh tự chạy (8 phủ định, 5 từ khoá exact cho nhóm chung, dừng 19 từ khoá phrase cũ) —
file `2026-11-24-ads-restructure.json`. Phần dưới là việc sếp bấm trong giao diện, làm theo thứ tự.

## 1. GA4 — đánh dấu lead là Sự kiện chính (1 phút)
GA4 → Quản trị (bánh răng) → Hiển thị dữ liệu → **Sự kiện** → dòng `generate_lead` → bật công tắc
**Đánh dấu là sự kiện chính**.

## 2. Tạo nhóm quảng cáo "Spine"
Google Ads → Chiến dịch `Search – Animation – T1` → **Nhóm quảng cáo** → nút **+** → Tên: `Spine`.

**Từ khoá** — dán nguyên khối (dấu ngoặc vuông = khớp chính xác):
```
[spine animation services]
[spine animation studio]
[spine animation outsourcing]
[outsource spine animation]
[spine animator for hire]
[hire spine animator]
[spine animation company]
[spine 2d animation services]
```

**Quảng cáo đáp ứng tìm kiếm** của nhóm Spine:
- URL cuối cùng: `https://tdgamestudio.com/services/spine-animation`
- Đường dẫn hiển thị: `spine` / `animation`
- Tiêu đề (≤ 30 ký tự, đã đếm):
  1. Spine Animation for Games
  2. Hero Kit in 3–5 Days
  3. 10–20 Characters a Month
  4. Free or Paid Test Character
  5. Engine-Ready Spine Files
  6. Unity & Cocos Pipelines
  7. Quote and Date in 24 Hours
  8. 50+ Game Projects Delivered
  9. RPG & Gacha Hero Animation
  10. Outsource Spine Animation
  11. Spine Rigs for Mobile RPGs
  12. Bosses, Heroes and Monsters
- Ghim tiêu đề 1 vào **Vị trí 1** (để luôn có chữ "Spine Animation").
- Mô tả (≤ 90 ký tự):
  1. Heroes, monsters and bosses rigged in Spine. Hero kit in 3–5 days, 10–20 a month.
  2. Send one character for a test. Price and delivery date within 24 hours.
  3. Spine project, skeleton and atlas for your runtime. Hit frames keyed as events.
  4. 50+ game projects, 12+ studios came back. Watch our live Spine rigs on the site.
- KHÔNG ghi tên Monster Legends / Social Point trong quảng cáo (dễ bị chặn vì thương hiệu bên khác).

## 3. Giá thầu → CPC thủ công
Chiến dịch → **Cài đặt** → **Đặt giá thầu** → **Thay đổi chiến lược giá thầu** → **CPC thủ công** → Lưu.
Rồi đặt giá thầu mặc định từng nhóm (Nhóm quảng cáo → cột "Giá thầu CPC tối đa mặc định"):
- `Spine`: **70.000 ₫**
- `Nhóm quảng cáo 1` (nhóm chung, trỏ /services/2d-animation): **45.000 ₫**

Nếu Google gợi ý "Tối đa hoá lượt chuyển đổi" / "Áp dụng tất cả đề xuất": **bỏ qua** (chưa có lead để máy học).

## 4. Vị trí → bỏ Thổ Nhĩ Kỳ
Chiến dịch → **Cài đặt** → **Vị trí** → xoá **Turkey / Thổ Nhĩ Kỳ**. Giữ 12 nước còn lại và tuỳ chọn
"Sự hiện diện: người ở hoặc thường xuyên ở".

## 5. Ngân sách
Giữ **100.000 ₫/ngày**. Kiểm tài khoản trả trước còn đủ ~1,5 triệu cho 14 ngày.

## 6. (Tuỳ chọn) Đổi tên nhóm chung
Đổi `Nhóm quảng cáo 1` → `Game animation` — **chỉ làm sau khi em báo 32 lệnh đã DONE** (lệnh đang gọi
tên nhóm cũ).

## 7. Bật chiến dịch
Bật lại `Search – Animation – T1` sau khi xong bước 2–4.

## Theo dõi (em làm)
- Mỗi ngày đọc Sheet: cụm từ tìm kiếm, click, chi phí; thêm phủ định khi có rác.
- Mốc **14 ngày** sau khi bật: nếu ≥ 25 click mà 0 lead và cụm từ vẫn là người tìm phần mềm →
  đề xuất dừng hẳn Ads, dồn sang SEO trang Spine + tìm khách chủ động.
