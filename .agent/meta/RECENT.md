# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-11-16 (tối) — /hr: lỗi phân tích ghi âm PV — Gemini hết tiền nạp (không phải lỗi code)
- Phiên PV Hà Tú Anh (40beed17, 11 đoạn m4a 15:35→16:29 đều upload 200) bấm Phân tích 20:23 → analysis_status=failed, "Gemini upload start lỗi 402".
- Gọi thử Gemini bằng key VPS (upload start + generateContent "say OK"): cả hai 402 RESOURCE_EXHAUSTED "Your prepayment credits are depleted" → tài khoản Gemini API (prepay) hết credit. VPS không có OPENAI_API_KEY → không có Whisper dự phòng.
- File ghi âm còn nguyên trên R2 (kiểm HEAD đoạn đầu 5,7MB + đoạn cuối 3,9MB = 200). Nạp tiền xong HR bấm Phân tích lại là chạy, không mất dữ liệu.
- Chờ sếp: nạp credit ở AI Studio (ai.studio/projects → Billing). Đề xuất nhỏ (chờ OK): 402 hiện câu dễ hiểu "Gemini hết tiền nạp — nạp ở AI Studio" thay vì "upload start lỗi 402".
- (tiếp) Sếp đã nạp credit → kiểm lại bằng key VPS: generateContent gemini-3.6-flash 200 ("OK"), upload start 200. Gemini chạy lại. Chờ HR bấm Phân tích lại phiên Hà Tú Anh.

## 2026-11-17 — /hr: tạo job "Game Vibe Coder (AI Game Developer)" (ẩn, chờ sếp bật)
- Sếp yêu cầu JD vị trí vibe code game bằng AI: full-time văn phòng HN, Fresher–Junior, 7–10tr, Leader Đặng Thế Toàn, không bài test (chỉ xem game ứng viên từng vibe code — yêu cầu bắt buộc gửi link/video/repo).
- Insert thẳng bảng `jobs` (id 6b1e82f7…, slug `game-vibe-coder`, category Development, accepts_freelance=false, is_active=false). Đã kiểm: /api/jobs không có, /careers/game-vibe-coder 404 khi ẩn.
- Chờ sếp: xem trên /hr → bật hiển thị; thêm ảnh cover (image_url đang trống) nếu muốn.
- (tiếp) Ảnh cover: tạo bằng gpt-image qua cliproxyapi local (endpoint prod /api/admin/generate-image trả 502 qua Cloudflare — chưa điều tra; local mất ~42s). Bản 1 có nhân vật giống Mario → bỏ, tạo lại bản nhân vật gốc (cáo cam, robot AI, Tháp Rùa). Upload R2 `ai/2026/11/b39386b2-….webp` (1536w, 238KB) + media_assets + jobs.image_url. CDN 200. Job vẫn ẩn.
- (tiếp) Sếp chê không đúng style web → tạo lại theo đúng prompt khung "Supercell-style mobile game key art…" của 6 card trang /services/full-game-production (prompt lưu ở media_assets.ai_prompt), nhân vật NOVA vibe coder + robot AI + laptop bung game platformer. Upload `ai/2026/11/98da8893-….webp` (160KB), jobs.image_url đổi sang ảnh này. Ảnh cũ b39386b2 còn trên R2 (mồ côi, chưa xoá).
- (tiếp) Sếp OK xoá ảnh cũ: R2 `ai/2026/11/b39386b2-….webp` đã xoá (CDN 404) + 1 dòng media_assets. Ảnh đang dùng 98da8893 vẫn 200.
- (tiếp) Sếp bảo bật: jobs.is_active=true (update thẳng DB — PATCH /api/hr/jobs không có side effect gì thêm). Kiểm: /api/jobs có job, /careers/game-vibe-coder 200 (lần đầu 404 do cache unstable_cache 300s, request sau đã 200), có ảnh cover + JobPosting như job khác. Job XONG.
- (tiếp) Sếp sửa: lương 5–10tr; quyền lợi cấp full tài khoản Claude AI + làm/học từ sản phẩm game chất lượng. Bảng jobs không có cột quyền lợi riêng (BENEFITS ở careers-client là chung cả công ty) → ghi vào `salary` ("5–10 triệu/tháng (theo năng lực) + Được cấp full tài khoản Claude AI" — parse JobPosting vẫn ra 5–10tr) + đoạn "Quyền lợi:" cuối `description` + summary EN. Trang live đã cập nhật sau cache ~3 phút (JobPosting min 5.000.000 / max 10.000.000).
- (tiếp) Sếp gửi ảnh chụp list /careers: cover vibe coder lệch style + bị cắt. Gốc: cover JOB dùng biến thể prompt riêng (khác card services): "stands centred… one clear hero subject centred in the frame at half height, generous empty gradient margin… cropped both to a narrow vertical thumbnail and to a wide short banner" (xem media_assets.ai_prompt của cover Marketing/2D Artist/Graphic/Spine). Thẻ list = object-cover 176px rộng (sm:w-44), banner chi tiết h-56. Tạo lại theo đúng template (robot bay trên đầu, bố cục cột gọn) → 1536x1024, mô phỏng crop thẻ + banner khớp cover Marketing. Upload `ai/2026/11/805fe029-….webp` (92KB, ai_prompt = prompt thật), jobs.image_url đổi; xoá ảnh thay thế 98da8893 (R2 404 + media row). Trang live đã lên ảnh mới.
- Ghi chú: cover job mới sau này → copy prompt cover Marketing, chỉ thay đoạn mô tả nhân vật + hành động + màu nền. Backend ảnh hay trả 1672x941 thay vì 1536x1024 → kiểm kích thước, lệch thì tạo lại.
