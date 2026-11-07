# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-11-06 — AI chat tự trả lời 24/7 (Phase C)
- Sếp thử chat, điền email xong không thấy ai trả lời (Phase A chỉ nháp) → chọn bật AI tự trả lời 24/7.
- `chat-ai.ts`: mode `auto` + `autoSend` (đọc lại luồng sau gọi model; staff trả lời trong 2h → AI im; nháp sạch → gửi tin sender `ai`, giành nháp pending→sent; nháp có cảnh báo → câu chờ cố định EN/VI, không lặp). `chat-server.ts` thêm `addAiReply` (resolved → answered; không thì giữ needs_human). PUT /api/hr/chat/kb nhận `auto`; AiKnowledgePanel thêm nút "Tự trả lời 24/7". /api/chat trả `aiAuto`; widget: bong bóng "AI assistant" + 3 chấm ≤60s (trừ "Talk to a person"); /hr: tin AI nền xanh "🤖 AI tự trả lời", preview "🤖 AI:".
- `guardDraft`: số kiểu Việt "1.000" khớp "1,000" (lỗi thật gặp khi E2E: AI viết 1.000 USD → bị nghi bịa) + test.
- E2E dev 3011 (DB prod, push/Discord/Resend tắt): PayPal/deposit → AI gửi, luồng answered; câu test $100 tiếng Việt → trả lời tiếng Việt, luồng vẫn cần người. Test 25+1 pass, tsc/eslint 0. Đã xoá 3 luồng ZZTEST. Dev trang chủ lỗi tải Google font (môi trường) → kiểm UI trên prod sau deploy.
- app_settings chat_ai_mode = auto (đặt 2026-11-06 ~14:40 VN).
- Kiểm prod sau deploy cfe1b32: /api/chat aiAuto=true; widget hiện 3 chấm → ~20s ra bong bóng "AI assistant · TD Games" trả lời đúng thẻ Tools & engines. Luồng thử ZZTEST đã xoá.
- 2026-11-06 (sếp: trả lời tự nhiên, ngắn gọn, chuyên nghiệp, vào thẳng vấn đề): SYSTEM prompt `chat-ai-core.ts` — bỏ "staff reviews your draft", thêm STYLE: câu đầu trả lời luôn, không chào/lặp câu hỏi, 1–3 câu ≤~60 chữ, chỉ fact cần cho câu hỏi, tối đa 1 bước tiếp. Eval: trung bình 37 chữ (max 59, trước ~90–100), 26/26 sau khi đổi kỳ vọng 2 câu thực tập/remote (kho đã có thẻ → AI trả lời được).
- 2026-11-06 (sếp OK): chế độ auto → bỏ bắt buộc email ngoài giờ. /api/chat/message chỉ trả email_required khi offline + chưa email + mode ≠ auto; widget không bật form bắt buộc khi aiAuto, header ngoài giờ "AI assistant 24/7 · team replies by email" (chấm xanh). Mời để email vẫn hiện (Skip được). E2E dev CHAT_FORCE_HOURS=offline: gửi không email → AI trả lời. Luồng ZZTEST đã xoá. Tắt AI → tự quay về bắt buộc email như cũ.
- 2026-11-06 (sếp gửi ảnh: AI ghi /careers/2d-game-artist nhưng không bấm được): widget `Linkified` — đường dẫn /…, https://…, email trong tin AI / staff / câu có sẵn → link bấm được (nội bộ dùng next/link, email mailto, ngoài tab mới; bỏ dấu câu cuối; "24/7", "and/or" không thành link). Điện thoại (<640px, khung chat phủ màn hình) bấm link nội bộ → đóng khung chat để thấy trang (áp cả nút link của câu có sẵn).
  Kiểm prod (390px): AI trả lời có link /careers/2d-game-artist bấm được → sang trang job, khung chat tự đóng. Sửa ngắt dòng link (break-all → break-words). Luồng ZZTEST đã xoá.

## 2026-11-07 — Mail từ chối sau bài test
- Sếp hỏi mail từ chối sau test có khác không → trước đây 1 mẫu chung. Sếp: "Triển khai đi".
- Không thêm loại mail mới (sẽ phải DROP CONSTRAINT kind trên candidate_emails/hr_email_templates — MCP không chạy được DROP từ Telegram). Thay vào đó: mẫu `rejection` thêm biến `{doan_bai_test}` (giữa câu cảm ơn ứng tuyển và câu báo kết quả) = đoạn "cảm ơn đầu tư thời gian & công sức cho bài test… kết quả lần này chưa đáp ứng yêu cầu vị trí" khi hồ sơ đã có dòng `test_submissions`; chưa nộp → rỗng, mail y như cũ. Route draft đếm test_submissions khi kind=rejection. Xem trước tab Mẫu mail hiện đoạn này. hr_email_templates chưa có bản sửa của rejection → dùng mặc định mới ngay.
- Freelancer: route draft đang chặn mail tay cho hồ sơ freelancer (freelanceManualMailError) → không áp dụng, chưa làm biến thể "phí test được thanh toán".
- GitNexus impact templateVars = CRITICAL (dùng cho mọi mail) — thay đổi chỉ THÊM biến; 264/264 test HR pass (sửa đếm biến 22→23 + test mới), tsc/eslint 0.
