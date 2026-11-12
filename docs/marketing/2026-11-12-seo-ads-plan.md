# TD Games — Kế hoạch SEO + Quảng cáo (bắt đầu 2026-11-12)

Sếp chốt: làm cả SEO tự nhiên + quảng cáo, bắt đầu bằng đo lường; thị trường: tất cả nhưng
ưu tiên nước ngoài tiềm năng; ngân sách quảng cáo **$500/tháng**.

---

## 0. Hiện trạng đã kiểm (2026-11-12)

| Hạng mục | Trạng thái |
|---|---|
| GA4 (`G-2M5ZNY433F`) | ✅ đang chạy trên production |
| Google Ads tag (`AW-18473620402`) | ✅ đang chạy |
| Chuyển đổi lead | ✅ form báo giá (`contact-showcase-section.tsx`) bắn `generate_lead` → GA4 + Ads conversion (`NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION`) |
| Search Console | ✅ đã xác minh qua DNS TXT (2 mã google-site-verification) |
| robots.txt / sitemap.xml | ✅ 72 URL (5 dịch vụ, 21 portfolio, ~33 blog, careers) |
| Title / meta / JSON-LD | ✅ có |
| Bot AI | Cloudflare chặn bot **huấn luyện** (GPTBot, ClaudeBot, Google-Extended…). Bot **tìm kiếm** (OAI-SearchBot, ChatGPT-User, PerplexityBot, Googlebot) KHÔNG bị chặn → ChatGPT/Perplexity/AI Overviews vẫn trích được. Không cần sửa. |
| Đa ngôn ngữ | ❌ chỉ tiếng Anh, không có hreflang |
| Trang riêng Spine | ❌ đang gộp trong `/services/2d-animation` |

**Kết luận:** nền đo lường đã đủ để chạy quảng cáo. Việc còn lại phía tài khoản (sếp làm, 15 phút):
1. GA4 → Admin → Events: đánh dấu `generate_lead` là **Key event**.
2. GA4 → Admin → Product links: **liên kết Google Ads** và **Search Console**.
3. Google Ads → Goals → Conversions: chuyển đổi lead đặt **Primary**, count = **One**.

---

## 1. Thị trường ưu tiên

| Tầng | Nước | Lý do | Cách làm |
|---|---|---|---|
| **1** | Mỹ, Canada, Anh, Đức, Hà Lan, Bắc Âu (Phần Lan, Thuỵ Điển, Đan Mạch, Na Uy), Israel, Thổ Nhĩ Kỳ, Singapore, Úc | Nhiều studio mobile/casual, quen outsource sang châu Á, làm việc bằng tiếng Anh | Quảng cáo tiếng Anh + SEO tiếng Anh hiện có |
| **2** | Nhật, Hàn | Thị trường lớn, trả cao, nhưng cần trang tiếng bản địa + người bản xứ duyệt | Làm trang `/ja`, `/ko` sau khi tầng 1 có số liệu (tháng 3–4) |
| **3** | Việt Nam | Publisher nội địa (casual/hypercasual) | SEO + quan hệ trực tiếp, chưa chi quảng cáo |

Trung Quốc: robots đang chặn Baiduspider và thị trường khó tiếp cận → bỏ qua.

---

## 2. Quảng cáo — $500/tháng

| Khoản | Tiền/tháng | Ghi chú |
|---|---|---|
| Google Search (tầng 1, tiếng Anh) | **$400** (~$13/ngày) | Người đang chủ động tìm studio → ý định thuê cao nhất |
| Remarketing (Display + YouTube showreel) | **$100** | Chỉ bật khi danh sách người vào site ≥ 100 người/30 ngày; chưa đủ thì dồn vào Search |

LinkedIn Ads: CPC thường $6–12 → $500 chỉ được ~50 click, chưa đáng. Dùng LinkedIn bằng bài đăng miễn phí.

### 2.1 Cấu trúc chiến dịch Google Search

- **Chiến dịch:** `Search – 2D Outsourcing – T1`
- **Vị trí:** các nước tầng 1 · tuỳ chọn "Presence: người ở hoặc thường ở" (KHÔNG chọn "quan tâm đến")
- **Ngôn ngữ:** English · **Mạng:** chỉ Google Search (tắt Search Partners + Display)
- **Giá thầu:** Maximize Clicks, giới hạn CPC tối đa **$4** trong 3–4 tuần đầu → khi có ≥ 15 lead/30 ngày mới đổi sang Maximize Conversions
- **Từ khoá:** chỉ Phrase + Exact (không dùng Broad khi ngân sách nhỏ)

| Nhóm quảng cáo | Từ khoá mẫu | Trang đích |
|---|---|---|
| Game Art | "game art outsourcing", "2d game art outsourcing", "outsource game art", "mobile game art studio", "2d game art studio" | `/services/2d-art` |
| Spine / Animation | "spine animation outsourcing", "spine animation studio", "game animation outsourcing", "2d game animation studio", "spine animator for hire" | `/services/2d-animation` |
| VFX | "game vfx outsourcing", "2d vfx for games", "mobile game vfx studio" | `/services/2d-vfx` |
| Full production | "2d game art and animation studio", "game art outsourcing vietnam" | `/services/full-game-production` |

**Từ khoá phủ định (cấp tài khoản):** job, jobs, career, hiring, salary, intern, course, tutorial,
learn, free, download, asset store, template, how to, software, tool, reddit, fiverr, upwork, nft.

**Mẫu quảng cáo (RSA):** dùng tiêu đề gồm: "2D Game Art & Spine Animation", "Vietnam-Based Game Art Studio",
"Paid Test Sprint Before You Commit", "NDA & IP Transfer Included", "Mobile Game Art Since 20xx" (⚠️ sếp điền năm),
"Get a Quote in 24h" (⚠️ chỉ dùng nếu đúng cam kết). Không đưa giá cụ thể khi sếp chưa duyệt.

### 2.2 Kỳ vọng thực tế

CPC ngách này thường $2–6 → $400 ≈ 70–200 click/tháng. Tỷ lệ chuyển đổi B2B 2–4% →
**khoảng 2–6 lead/tháng** khi chạy ổn định. Tháng đầu là tháng học: xem báo cáo Search terms
hàng tuần, thêm từ khoá phủ định.

---

## 3. SEO tự nhiên — lộ trình

### Tháng 1 (tháng 11–12/2026)
**Em (code):**
- [ ] Trang riêng `/services/spine-animation` — "spine animation outsourcing" là từ khoá ngách mạnh nhất của mình; hiện đang gộp. Giữ `/services/2d-animation` cho frame-by-frame + liên kết chéo để hai trang không tranh từ khoá với nhau.
- [ ] Audit kỹ thuật + nội dung toàn site (`seo-audit`) → danh sách lỗi cần sửa có chấm điểm.
- [ ] Liên kết nội bộ: mỗi bài blog liên kết về đúng trang dịch vụ + 1 case study liên quan.

**Sếp (ngoài site):**
- [ ] Đăng hồ sơ Clutch + GoodFirms (đã có bộ soạn sẵn: `docs/marketing/clutch-goodfirms-profile.md`) và xin 3 review thật từ khách cũ.
- [ ] LinkedIn company page: 2 bài/tuần (cắt từ case study/showreel), link về site.
- [ ] ArtStation + Behance studio: mỗi project để link về case study trên site.

### Tháng 2–3
- [ ] 4 bài blog/tháng, nhắm từ khoá có ý định thuê (so sánh, giá, cách chọn studio, theo thể loại game).
- [ ] Bổ sung số liệu thật vào case study (số asset, thời gian, kết quả game).
- [ ] Backlink: guest post (80.lv, blog Game Developer…), danh bạ outsource game, profile ở các sự kiện.
- [ ] Sự kiện B2B (Pocket Gamer Connects, Gamescom Asia, Tokyo Game Show business matching) — ra lead nhanh hơn SEO.

### Tháng 4–6
- [ ] Trang tiếng Nhật `/ja` + tiếng Hàn `/ko` (home + dịch vụ + contact, có hreflang) — chỉ làm khi có người bản xứ duyệt bản dịch.
- [ ] Mở thêm Google Ads cho Nhật/Hàn nếu tầng 1 đạt chi phí/lead chấp nhận được.

---

## 4. KPI theo dõi hàng tháng

| Chỉ số | Nguồn | Mục tiêu 3 tháng | 6 tháng |
|---|---|---|---|
| Lead từ form | GA4 `generate_lead` + /crm | 5/tháng | 10/tháng |
| Chi phí / lead (Ads) | Google Ads | < $150 | < $100 |
| Click tự nhiên | Search Console | ghi baseline tháng 11 | ×2 |
| Từ khoá top 10 | Search Console | ghi baseline | +20 từ khoá |
| Review Clutch | Clutch | 3 | 6 |

Baseline (số click, hiển thị, vị trí trung bình tháng 11) cần lấy từ Search Console. Em chưa có
quyền truy cập API GSC/GA4: sếp cấp service account hoặc gửi ảnh chụp màn hình.
