# TD Games Work — Styleguide (v4, đã duyệt 2026-10-16)

Nguồn chuẩn để dựng UI. Mockup tham chiếu: `docs/design/mockups-v4/` (`public-home.html`, `board.html`, `freelancer-mobile.html`); token gốc: `docs/design/mockups-v4/tokens.css`. Lý do và nghiên cứu: `docs/design/mockups-v4/PRINCIPLES.md`. Các bản v1–v3 chỉ để lưu lịch sử, không dùng.

---

## 1. Nguyên tắc

1. **Kiềm chế màu.** ~95% giao diện là trung tính. Cam chỉ dùng cho: nút hành động chính, mục đang chọn, con số tiền quan trọng, badge cần chú ý.
2. **Chữ là xương sống.** Phân cấp bằng cỡ và độ đậm, không bằng màu hay khung.
3. **Khoảng trắng trước, đường kẻ sau, bóng đổ cuối cùng.**
4. **Chiều sâu bằng tông nền**, không bằng bóng nặng.
5. **Lớp điều khiển là kính nổi** (nav, toolbar, tab bar, inspector) đặt trên nội dung.
6. **Góc bo đồng tâm:** góc trong = góc ngoài − padding.
7. **Cho thấy sản phẩm thật** (UI app, tranh studio) thay vì hình trang trí.
8. **Mỗi màn chỉ một điểm nhấn.**

Hai bối cảnh, chung một hệ:
- **Khu công khai** (trang chủ, chợ việc, đăng nhập): nền đen, ánh cam, chữ rất lớn.
- **Khu làm việc** (app nội bộ / freelancer): nền sáng mặc định, có chế độ tối; gọn, dày thông tin vừa phải.

---

## 2. Màu

### Thương hiệu
| Token | Giá trị | Dùng cho |
|---|---|---|
| `--orange` | `#FF9500` | Nút chính, viền chọn, badge, vòng tiến độ nổi bật |
| `--orange-hi` | `#FFAD33` | Hover của nút cam |
| `--orange-ink` | `#A35400` | Chữ cam trên nền sáng (đạt tương phản ≥4.5:1) |
| `--orange-soft` | `rgba(255,149,0,.12)` | Nền nhấn nhẹ |

### Trung tính — sáng (app)
| Token | Giá trị | Dùng cho |
|---|---|---|
| `--canvas` | `#F5F5F7` | Nền app, nền làn cột Board, nền sidebar |
| `--raised` | `#FFFFFF` | Bề mặt nội dung, thẻ task |
| `--ink` | `#1D1D1F` | Chữ chính |
| `--ink-2` | `#6E6E73` | Chữ phụ, metadata |
| `--ink-3` | `#A1A1A6` | Chỉ cho placeholder, chữ vô hiệu hóa và chữ trang trí |
| `--hair` | `rgba(0,0,0,.08)` | Đường kẻ mảnh |
| `--fill` | `rgba(0,0,0,.04)` | Hover hàng, nền nút phụ |

> `--ink-3` chỉ dùng cho placeholder, chữ vô hiệu hóa và chữ trang trí; mọi chữ mang thông tin (số đếm, gợi ý, metadata) dùng `--ink-2` để đạt ≥4.5:1 (§11).

### Trung tính — tối (app dark mode, mobile freelancer, khu công khai)
| Token | Giá trị | Dùng cho |
|---|---|---|
| `--canvas` | `#000000` | Nền |
| `--raised` | `#1C1C1E` | Thẻ, nhóm danh sách |
| `--raised-2` | `#232325` | Lớp lồng bên trong thẻ |
| `--ink` | `#F5F5F7` | Chữ chính |
| `--ink-2` | `#A1A1A6` | Chữ phụ |
| `--ink-3` | `#86868B` | Chỉ cho placeholder, chữ vô hiệu hóa và chữ trang trí |
| `--hair` | `rgba(84,84,88,.6)` | Đường kẻ |
| `--orange-ink` | `#FFA733` | Chữ cam trên nền tối |

### Trạng thái (4 nhóm cố định, theo spec)
| Nhóm | Màu | Ghi chú |
|---|---|---|
| Chưa làm | `#98989D` | |
| Đang làm | `#0A84FF` | |
| Chờ nghiệm thu | `#BF5AF2` | |
| Xong | `#30D158` | |
| Trễ hạn / lỗi | `#FF453A` | Chấm, viền (không dùng làm màu chữ) |
| Chữ lỗi / trễ hạn (`--danger-ink`) | sáng `#D70015` · tối `#FF6961` | Chỉ dùng cho chữ cảnh báo (đạt ≥4.5:1) |

Trạng thái hiển thị bằng **chấm 7px + chữ**, không tô nền cả thẻ. Không dùng màu làm tín hiệu duy nhất.

---

## 3. Chữ

- **Font:** Inter (Google Fonts, có `opsz`, đủ tiếng Việt). Fallback: `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`. Bật `font-optical-sizing: auto`.
- **Độ đậm:** 400 (thường), 500 (nhấn nhẹ, nút), 600 (tiêu đề nhỏ), 700 (tiêu đề lớn). Không dùng 300, 800+.
- **Số tiền / số đếm:** `font-variant-numeric: tabular-nums`.
- Tiêu đề dùng `text-wrap: balance` để tránh chữ mồ côi.

### Thang chữ — khu công khai
| Vai trò | Cỡ / dòng | Tracking | Đậm |
|---|---|---|---|
| Display (hero) | 48–88px / 1.03 | −0.035em | 700 |
| H2 section | 36–56px / 1.07 | −0.03em | 700 |
| H3 panel | 28px / 1.14 | −0.022em | 700 |
| Lead | 21px / 1.43 | −0.012em | 400 |
| Body | 17px / 1.47 | −0.011em | 400 |
| Caption | 13px / 1.4 | 0 | 400 |

### Thang chữ — khu làm việc (desktop)
| Vai trò | Cỡ / dòng | Tracking | Đậm |
|---|---|---|---|
| Tiêu đề trang | 26px / 1.2 | −0.025em | 700 |
| Lead (câu giải thích dưới tiêu đề trang, `--ink-2`) | 15px / 1.45 | 0 | 400 |
| Tiêu đề inspector | 21px / 1.24 | −0.022em | 700 |
| Tên task | 14px / 1.4 | −0.01em | 500 |
| Body / nhãn | 13px / 1.45 | −0.003em | 400 |
| Metadata | 12px | 0 | 400 |
| Nhóm sidebar | 11.5px | 0 | 500 |

### Thang chữ — mobile
| Vai trò | Cỡ | Đậm |
|---|---|---|
| Large title | 34px, −0.03em | 700 |
| Số tiền chính | 52px, −0.045em | 700 |
| Section | 22px, −0.025em | 700 |
| Body / hàng danh sách | 17px | 400–500 |
| Phụ | 14–15px | 400 |
| Nhãn tab bar | 10.5px | 600 |

Không dùng: chữ IN HOA cho nhãn, nhãn nhỏ phía trên mọi tiêu đề, tô màu riêng một từ trong tiêu đề.

---

## 4. Khoảng cách & bố cục

- **Nhịp 4/8:** 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 64 · 88 · 120 · 160.
- **Khu công khai:** container 1120px; hero padding trên 176px; giữa các section 160px; panel padding 40px (mini panel 32px).
- **Khu làm việc:** sidebar 228px; bề mặt nội dung cách mép 8px, bo 16px; padding nội dung 32px; inspector rộng 380px. Hai độ rộng trang: form / chi tiết tối đa 760px, danh sách / báo cáo dùng hết chiều ngang (`PageHeader` + `pageClasses`). Bảng danh sách đặt trên bề mặt nổi (`--raised`, bo 16, bóng surface), hàng kẻ mảnh, hover `--fill`; hàng tổng kẻ `--hair` trên.
- **Mobile:** lề 20px; giữa các khối 36px; chiều cao hàng danh sách ≥ 72px.
- Căn trái mọi thứ trong app. Chỉ hero và lời kêu gọi cuối trang công khai được căn giữa.

---

## 5. Góc bo (đồng tâm)

| Thành phần | Bo |
|---|---|
| Nút, chip, thanh tab, nav, ô nhập bình luận | `999px` (viên thuốc) |
| Panel công khai, khung ảnh sản phẩm | 28px → lớp trong 16–18px |
| Inspector (padding 10) | 24px → nhóm bên trong 14px |
| Làn cột Board (padding 6) | 18px → thẻ task 12px |
| Bề mặt nội dung app | 16px |
| Nhóm danh sách mobile | 22px |
| Hàng sidebar, nút icon vuông | 8px |

Quy tắc: **bo trong = bo ngoài − padding**.

---

## 6. Bóng & vật liệu

```css
/* Thẻ task */
box-shadow: 0 0 0 .5px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05), 0 2px 8px -4px rgba(0,0,0,.06);
/* Thẻ hover */
box-shadow: 0 0 0 .5px rgba(0,0,0,.09), 0 6px 18px -8px rgba(0,0,0,.18); transform: translateY(-1px);
/* Thẻ đang chọn */
box-shadow: 0 0 0 2px #FF9500, 0 6px 18px -8px rgba(255,149,0,.45);
```

**Kính sáng (`.glass`)** — toolbar, inspector:
```css
background: rgba(255,255,255,.66);
backdrop-filter: blur(24px) saturate(180%);
box-shadow: inset 0 1px 0 rgba(255,255,255,.9), inset 0 0 0 .5px rgba(0,0,0,.06), 0 8px 32px -12px rgba(0,0,0,.18);
```

**Kính tối (`.glass-d`)** — nav công khai, tab bar mobile, nút tròn:
```css
background: rgba(28,28,30,.55);   /* tab bar: .8 để chữ bên dưới không lem */
backdrop-filter: blur(28px) saturate(170%);
box-shadow: inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 .5px rgba(255,255,255,.10), 0 12px 40px -12px rgba(0,0,0,.6);
```

Kính chỉ dùng cho **lớp điều khiển nổi**, không dùng cho thẻ nội dung. Không đặt lớp kính chồng lên nút cam (sẽ lem màu).

**Ánh cam (khu công khai):** radial gradient `rgba(255,149,0,.42)` → trong suốt, đặt phía sau ảnh sản phẩm / số tiền. Mỗi màn tối đa một vùng ánh.

---

## 7. Thành phần

### Nút
| Loại | Kiểu |
|---|---|
| Chính | Viên thuốc cam, chữ `#1F1300` 500 (đạt tương phản); cao 44px (công khai) / 32px (toolbar) / 36px (mobile inline) |
| Phụ trên nền tối | Viên thuốc kính tối, chữ `#F5F5F7` |
| Link | Chữ `--orange-ink`, không gạch chân, gạch khi hover |
| Icon | 32×32 tròn, nền trong suốt, hover `--fill` |

Nhấn: `transform: scale(.97)` trong 200ms. Vùng chạm tối thiểu 44×44 trên mobile.

### Segmented control
Nền `rgba(0,0,0,.05)` viên thuốc, padding 2px; mục chọn nền trắng + bóng `0 1px 2px rgba(0,0,0,.1)`.

### Board
- Mỗi cột là **làn** nền `--canvas`, bo 18, padding 6. Đầu cột: chấm trạng thái + tên (600) + số đếm (`--ink-2`).
- **Thẻ task:** nền trắng, bo 12, padding 12×14, bóng thẻ ở mục 6. Dòng 1: tên task 14/500. Dòng 2: metadata 12px `--ink-2` (cha › con, hạn, tiến độ, "Freelancer"), avatar 20px đẩy sang phải; các mục không được gãy chữ (`white-space: nowrap`, cả dòng được phép xuống hàng).
- Nhãn "Đang tuyển" = chữ `--orange-ink` 600; "Trễ x ngày" = chữ đỏ 500. Không dùng nền màu cho tag.
- "+ Thêm" cuối làn, chữ `--ink-3`.

### Inspector (chi tiết task)
Tấm kính nổi bên phải, bo 24, padding 10. Trên cùng: breadcrumb + nút ⋯ và ✕ (30px tròn). Trạng thái (chấm + chữ màu) → tiêu đề 21/700. Thông tin chia **nhóm** nền trắng 72% bo 14, hàng cao 42px, đường kẻ thụt trái 14px. Giá trị tiền có ghi chú "chỉ quản lý thấy". Ô bình luận dạng viên thuốc, nút gửi tròn cam.

### Sidebar
Nền trùng `--canvas` (lùi về sau), chữ `#48484A`, icon `--ink-3` 16px. Mục chọn nền `rgba(0,0,0,.06)` chữ 600. Số đếm cần chú ý màu `--orange-ink`. Dự án: ô vuông màu 10px bo 3.

### Danh sách mobile
Nhóm nền `--raised` bo 22; hàng ≥ 72px; đường kẻ thụt trái 18px; số tiền căn phải 600; tiến độ bằng vòng 30px.

### Tab bar mobile
Viên thuốc kính tối nổi, cách đáy 26px, cao 64px, tối đa 4 mục; mục chọn chữ cam + nền `rgba(255,255,255,.1)`.

### Avatar
Tròn, chữ cái đầu 600 trắng; 20px (thẻ), 24–26px (danh sách), 40px (mobile top).

---

## 8. Icon

Bộ nét mảnh kiểu Lucide, `stroke-width` 1.6 (app) / 2.0–2.4 cho icon nhỏ trên nút đặc. Cỡ 16 (sidebar), 18 (mặc định), 23 (tab bar). Không dùng emoji làm icon. Không đặt icon trong ô màu hàng loạt; icon trang trí có `aria-hidden`.

---

## 9. Chuyển động

- Easing: `cubic-bezier(.32,.72,0,1)`; thời lượng 150–250ms cho hover/nhấn, 300–400ms cho panel mở.
- Chỉ dùng chuyển động để cho thấy điều vừa thay đổi (panel trượt ra, thẻ được chọn, nút nhún). Không hiệu ứng xuất hiện hàng loạt khi cuộn.
- Tôn trọng `prefers-reduced-motion`.

---

## 10. Nội dung chữ

- Câu ngắn, động từ rõ, viết hoa đầu câu. Nút nói đúng việc sẽ xảy ra ("Xem việc đang tuyển", "Task mới").
- Ngày trong app: `05/11` (thẻ), `5 thg 11` (inspector/mobile). Tiền: `7.000.000đ`, `450 USD`.
- Lỗi nói rõ chuyện gì và cách sửa, không xin lỗi chung chung. Màn trống mời hành động.

---

## 11. Tiếp cận (bắt buộc)

- Tương phản chữ ≥ 4.5:1 (chữ cam trên nền sáng dùng `--orange-ink`).
- Viền focus `3px solid rgba(255,149,0,.5)`, offset 3px, cho mọi phần tử tương tác.
- Nút chỉ có icon phải có `aria-label`.
- Mọi chuỗi giao diện qua `next-intl` (vi/en).
