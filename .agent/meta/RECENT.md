# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-09-30 — "Blog radar hỏng": thật ra auto-blog, TimeoutError khi đọc body ảnh
- **Task:** Run 36677580825 (06:18 UTC) đỏ.
- **Chẩn đoán:** Radar chạy đúng (32 tin → lưu 4 chủ đề → Discord). Hỏng ở `blog-auto.mjs`: POST `/api/admin/blog/topics` trả **500 body rỗng** sau ~173s (≈53s viết draft + 120s ảnh). PM2 error log: `⨯ Error [TimeoutError]` không bắt. Bài bốc 4 ảnh → 5 call gen ảnh song song; `AbortSignal.timeout(120s)` phủ cả lúc stream body b64, mà `res.json()` trong `generateAiImage` nằm NGOÀI try → reject xuyên `Promise.all` → route crash. Lỗi này đã xuất hiện 3 lần trong log trước đó. Vì 500 (không phải 502) nên blog-auto cũng không thử lại.
- **Work Done:** `src/lib/ai-image.ts` — bọc `res.text()/res.json()` trong try → trả `{error, 502}` (route bỏ ảnh đó, giữ bài). `topics/route.ts` — bọc `res.json()` của call viết draft → 502 (blog-auto sẽ retry).
- **Result:** tsc + eslint sạch. Chưa commit/deploy (chờ sếp). Chủ đề hôm nay vẫn `pending` → lần chạy sau sẽ dựng lại.
- **Next Step:** push main → CI deploy; có thể chạy lại workflow 📡 Blog Radar để lấy bài hôm nay.
- **Follow-up:** Commit 20d0a89 → CI deploy success. Chạy lại 📡 Blog Radar (run 36679035416): success, radar lưu 5 chủ đề, auto-blog đăng https://tdgamestudio.com/blog/quote-2d-art-by-gameplay-lock-not-only-by-asset-count

## 2026-10-01 — GA4 bật trên production
- **Work Done:** Sếp gửi Measurement ID `G-2M5ZNY433F`. Thêm `NEXT_PUBLIC_GA_ID` vào `/opt/tdgames-landingpage/.env.local` trên VPS (backup `.env.local.bak-*`), `npm run build` + `pm2 restart --update-env`.
- **Result:** Trang chủ prod có `gtag/js?id=G-2M5ZNY433F`. Ads + Search Console verification chưa set.
- **Next Step:** Sếp gửi `AW-...` + `AW-.../label` → set env + rebuild. Đánh dấu `generate_lead` là Key event sau khi có lead đầu tiên; submit sitemap.

## 2026-10-05 — Google Ads conversion bật trên production
- Set `NEXT_PUBLIC_GOOGLE_ADS_ID=AW-18473620402` + `..._LEAD_CONVERSION=AW-18473620402/N9ABCOPk0pEdELKn9OhE` trên VPS, rebuild. Verified prod. Chờ sếp chốt GA `G-2M5ZNY433F` vs `G-84PCN1R6HE`.
