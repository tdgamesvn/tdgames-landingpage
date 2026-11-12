# Hướng dẫn từng bước: GA4 + Google Ads cho tdgamestudio.com (2026-11-12)

Viết cho người chưa từng chạy quảng cáo. Tên nút ghi bằng **tiếng Anh**: giao diện Google hay đổi chữ
tiếng Việt, nên sếp đổi giao diện sang English cho dễ theo (Google Ads: Admin → Preferences → Display
language → English). Nếu màn hình không giống mô tả → chụp màn hình gửi em.

Đã có sẵn (em kiểm 2026-11-12): GA4 `G-2M5ZNY433F`, Google Ads `AW-18473620402`, chuyển đổi form báo giá,
Search Console đã xác minh. Sếp KHÔNG cần gắn code gì nữa.

---

## PHẦN A — Google Analytics (10 phút, làm 1 lần)

### A1. Đánh dấu "khách gửi form" là sự kiện quan trọng
1. Vào https://analytics.google.com → góc trên trái chọn property **tdgamestudio.com**.
2. Góc dưới bên trái bấm **⚙ Admin**.
3. Cột *Property settings* → **Data display** → **Events**.
4. Tìm dòng **generate_lead** → bấm **ngôi sao ☆** ở cột *Mark as key event* (sao chuyển xanh là xong).
   - Không thấy dòng `generate_lead` (chưa có khách gửi form gần đây): vào **Data display → Key events**
     → **New key event** → gõ đúng `generate_lead` → **Save**.

### A2. Liên kết GA4 với Google Ads
1. Vẫn trong **⚙ Admin** → mục *Product links* → **Google Ads links**.
2. Bấm **Link** → **Choose Google Ads accounts** → tick tài khoản Google Ads của công ty (dạng số xxx-xxx-xxxx, xem ở góc trên phải trang ads.google.com) → **Confirm** → **Next**.
3. Để **bật** *Enable Personalized Advertising* (cần cho quảng cáo nhắc lại sau này) → **Next** → **Submit**.

### A3. Liên kết GA4 với Search Console
1. **⚙ Admin** → *Product links* → **Search Console links** → **Link**.
2. **Choose accounts** → chọn **tdgamestudio.com** → **Confirm** → **Next**.
3. Chọn web stream của site → **Next** → **Submit**.

---

## PHẦN B — Chuẩn bị tài khoản Google Ads (10 phút)

Vào https://ads.google.com, đăng nhập đúng tài khoản Google đã tạo AW-18473620402.

### B1. Kiểm tra đang ở chế độ Expert
Nếu màn hình rất đơn giản, chỉ có "Smart campaign" → bấm biểu tượng **⚙ / Settings** → **Switch to Expert Mode**.
Giao diện chuẩn có menu dọc bên trái: *Create, Campaigns, Goals, Tools, Billing, Admin*.

### B2. Thanh toán
**Billing** (menu trái) → **Settings** → kiểm tra đã có thẻ/phương thức thanh toán. Chưa có → **Add payment method** → nhập thẻ Visa/Master công ty.

### B3. Kiểm tra chuyển đổi "khách gửi form"
1. **Goals** (biểu tượng cúp 🏆) → **Conversions** → **Summary**.
2. Tìm chuyển đổi của form báo giá (website, nguồn *Google Ads tag*). Bấm vào tên nó → **Edit settings**:
   - *Count*: chọn **One** (một khách gửi nhiều lần chỉ tính 1).
   - *Action optimization*: chọn **Primary action**.
   - **Save** → **Done**.
3. Sau khi liên kết GA4 ở A2, có thể xuất hiện thêm chuyển đổi **generate_lead (GA4)**. Nếu thấy → mở nó → đặt
   **Secondary action** (không thì một lead bị đếm 2 lần).

---

## PHẦN C — Tạo chiến dịch quảng cáo tìm kiếm (30–40 phút)

### C1. Mở trình tạo
**Campaigns** → nút xanh **+** → **New campaign**.

### C2. Mục tiêu và loại
1. *Objective*: chọn **Leads**.
2. *Conversion goals*: để mục có chuyển đổi form báo giá (Submit lead form) — bỏ các mục khác nếu có.
3. *Campaign type*: **Search**.
4. *Ways to reach your goal*: tick **Website visits**, nhập `https://tdgamestudio.com`.
5. *Campaign name*: `Search – 2D Outsourcing – T1` → **Continue**.

### C3. Đặt giá (Bidding)
1. *What do you want to focus on?* → đổi từ *Conversions* sang **Clicks**.
2. Tick **Set a maximum cost per click bid limit** → nhập **4** (USD).
3. **Next**.

### C4. Cài đặt chiến dịch (Campaign settings)
1. *Networks*: **BỎ tick cả hai** — *Include Google search partners* và *Include Google Display Network*.
2. *Locations*: chọn **Enter another location** → gõ lần lượt và bấm **Target** từng nước:
   United States, Canada, United Kingdom, Germany, Netherlands, Finland, Sweden, Denmark, Norway,
   Israel, Türkiye, Singapore, Australia.
3. Bấm **Location options** (mũi tên mở rộng) → *Include*: chọn **Presence: People in or regularly in your included locations**.
4. *Languages*: xoá mặc định, chọn **English**.
5. *Audience segments*: bỏ qua.
6. *Broad match keywords*: **Off**. Nếu có *AI Max for Search campaigns*: **Off**.
7. *More settings*: để nguyên → **Next**.

### C5. Từ khoá và quảng cáo — Nhóm 1: Game Art
1. *Ad group name*: `Game Art`.
2. Ô *Keywords* — dán nguyên (dấu ngoặc là bắt buộc):
```
"game art outsourcing"
"2d game art outsourcing"
"outsource game art"
"mobile game art studio"
"2d game art studio"
[game art outsourcing company]
```
3. Phần *Ads*:
   - *Final URL*: `https://tdgamestudio.com/services/2d-art`
   - *Display path*: `2d-art` / `outsourcing`
   - *Headlines* (dán từng dòng vào từng ô, tối đa 15):
```
2D Game Art Outsourcing
Vietnam-Based 2D Game Studio
50+ Game Projects Delivered
1200+ Game Assets Shipped
Get a Quote Within 24 Hours
Start With a Paid Trial Batch
Mobile Game Art & Animation
Characters, UI, VFX & Spine
12+ Studios Came Back for More
See Our Game Art Portfolio
We Sign Your NDA
Full 2D Game Art Production
```
   - *Descriptions* (4 ô):
```
Vietnam-based studio for 2D game art, Spine animation and VFX. Scoped quote within 24h.
50+ projects, 1200+ assets shipped. Start small with a paid trial batch before you commit.
Send your brief and style references. We match your style and deliver production files.
Characters, backgrounds, UI, Spine rigs and VFX for mobile games. We sign your NDA.
```
4. Bấm **New ad group** để thêm nhóm tiếp theo.

### C6. Nhóm 2: Spine / Animation
- Từ khoá:
```
"spine animation outsourcing"
"spine animation studio"
"game animation outsourcing"
"2d game animation studio"
"spine animator for hire"
```
- *Final URL*: `https://tdgamestudio.com/services/2d-animation` · *Display path*: `spine` / `animation`
- Headlines: dùng bộ ở C5, nhưng thay dòng đầu `2D Game Art Outsourcing` bằng `Spine Animation Outsourcing` và thêm `Game Animation Studio`.
- Descriptions: giống C5.

### C7. Nhóm 3: VFX
- Từ khoá:
```
"game vfx outsourcing"
"2d vfx for games"
"mobile game vfx studio"
```
- *Final URL*: `https://tdgamestudio.com/services/2d-vfx` · *Display path*: `vfx` / `games`
- Headlines: bộ C5, thay dòng đầu bằng `2D Game VFX Outsourcing`. Descriptions giống C5.

### C8. Nhóm 4: Full production
- Từ khoá:
```
"2d game art and animation studio"
"game art outsourcing vietnam"
"vietnam game art studio"
```
- *Final URL*: `https://tdgamestudio.com/services/full-game-production`
- Headlines/Descriptions: bộ C5. → **Next**.

### C9. Ngân sách
*Set custom budget* → **13** USD/ngày (≈ $400/tháng; có ngày Google tiêu tới gấp đôi nhưng cả tháng không vượt ~30,4 × 13 = $395) → **Next**.

### C10. Xem lại và chạy
Trang *Review*: sửa các cảnh báo màu đỏ nếu có (vàng thì bỏ qua được) → **Publish campaign**.
Google duyệt quảng cáo trong vài giờ đến 1–2 ngày.

### C11. Thêm từ khoá loại trừ (ngay sau khi Publish)
1. **Campaigns** → bấm tên chiến dịch vừa tạo.
2. Menu trái: **Audiences, keywords, and content** → **Search keywords** → tab **Negative search keywords**.
3. Nút **+** → *Add negative keywords or negative keyword list* → chọn **Campaign** → dán:
```
job
jobs
career
careers
hiring
salary
intern
internship
course
tutorial
learn
free
download
asset store
template
how to
software
reddit
fiverr
upwork
nft
```
4. **Save**.

### C12. Thêm đường dẫn phụ (sitelinks) — không bắt buộc nhưng tăng tỉ lệ bấm
Trong chiến dịch → **Assets** → **+** → **Sitelink** → thêm 4 cái:

| Sitelink text | URL |
|---|---|
| Portfolio | https://tdgamestudio.com/portfolio |
| Watch Our Showreel | https://tdgamestudio.com/showreel |
| Spine Animation | https://tdgamestudio.com/services/2d-animation |
| Get a Quote | https://tdgamestudio.com/contact |

---

## PHẦN D — Việc hàng tuần (15 phút, thứ Hai)

1. Chiến dịch → **Insights and reports** → **Search terms**: xem khách đã gõ gì.
   Từ nào không liên quan (vd "free game art", "game art jobs") → tick → **Add as negative keyword**.
2. Xem cột **Conversions**: có lead chưa. Đối chiếu với /crm.
3. Trong 3–4 tuần đầu đừng đổi ngân sách/giá liên tục — Google cần thời gian học.
4. Sau 1 tháng gửi em ảnh chụp tab *Campaigns* + *Search terms* → em đề xuất chỉnh.

## Sau này (chưa làm bây giờ)
- Quảng cáo nhắc lại ($100): khi GA4 có ≥100 người vào site/30 ngày — em hướng dẫn riêng.
- Hồ sơ Clutch/GoodFirms: làm theo `docs/marketing/clutch-goodfirms-profile.md`.
