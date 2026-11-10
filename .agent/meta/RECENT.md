# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-11-07 — Mail từ chối sau bài test
- Sếp hỏi mail từ chối sau test có khác không → trước đây 1 mẫu chung. Sếp: "Triển khai đi".
- Không thêm loại mail mới (sẽ phải DROP CONSTRAINT kind trên candidate_emails/hr_email_templates — MCP không chạy được DROP từ Telegram). Thay vào đó: mẫu `rejection` thêm biến `{doan_bai_test}` (giữa câu cảm ơn ứng tuyển và câu báo kết quả) = đoạn "cảm ơn đầu tư thời gian & công sức cho bài test… kết quả lần này chưa đáp ứng yêu cầu vị trí" khi hồ sơ đã có dòng `test_submissions`; chưa nộp → rỗng, mail y như cũ. Route draft đếm test_submissions khi kind=rejection. Xem trước tab Mẫu mail hiện đoạn này. hr_email_templates chưa có bản sửa của rejection → dùng mặc định mới ngay.
- Freelancer: route draft đang chặn mail tay cho hồ sơ freelancer (freelanceManualMailError) → không áp dụng, chưa làm biến thể "phí test được thanh toán".
- GitNexus impact templateVars = CRITICAL (dùng cho mọi mail) — thay đổi chỉ THÊM biến; 264/264 test HR pass (sửa đếm biến 22→23 + test mới), tsc/eslint 0.

## 2026-11-08 — /hr Copy Link job → /apply/<slug>
- Sếp hỏi sao Copy Link ở tab Jobs ra /careers?job= thay vì /apply/ → đổi có chủ đích từ 66ece81 (2026-10-22, link chia sẻ có preview riêng). Sếp chọn quay lại /apply/<slug>: ứng viên vào thẳng form, ít một bước.
- `JobsView.copyLink` → `/apply/<slug>[?ref=]`. /apply đọc ?ref= (referred_by), preview (og:title/description/image theo job) đã có từ trước — kiểm prod OK. Link chung người giới thiệu (CommissionReferrers, /careers?ref=) giữ nguyên.
- Impact copyLink LOW; tsc/eslint 0.
