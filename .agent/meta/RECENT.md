# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-11-10 (tiếp) — Ghi âm PV: dọn việc tồn
- Sếp: "tiếp tục thế nào tốt thì làm" → làm 4 việc tồn có ảnh hưởng dữ liệu/riêng tư:
  - Xoá hồ sơ ứng viên → xoá luôn ghi âm PV mọi vòng trên R2 (trước đây cascade xoá vòng nhưng file nằm lại CDN công khai — lỗi có từ trước). `allSessionsAudioKeys` + test. E2E dev (boss tạm + ZZTEST, đã xoá): CDN 200 trước → DELETE hồ sơ → 404.
  - Phân tích: gỡ băng xong mà ghi âm của vòng đã đổi (có đoạn mới gắn trong lúc chạy) → không lưu transcript thiếu, báo "bấm Phân tích lại". `sameAudio` + test.
  - upload-audio postJson (init/complete multipart) timeout 120s — mạng treo không làm hàng đợi đứng mãi.
  - Bắt đầu ghi → `navigator.storage.persist()` (Safari không tự xoá bản ghi chờ).
- Quét R2 (chỉ đọc): `interviews/` có 9 file, 3 đang dùng, **6 file mồ côi 194MB, đều 2026-10-26** (ngày làm upload ghi âm, nhiều lần thử lại) — CHƯA xoá, chờ sếp quyết.
- Tests 448/448, tsc/eslint 0.
- Sếp OK xoá → đối chiếu LOG 2026-10-26: 6 file mồ côi đều là file THỬ của em hôm đó (t.wav, t.mp3, big.mp3 x2, pv-test.m4a 42MB, pv-test-linh.m4a 12MB) — đã xoá khỏi R2 (404). 3 bản ghi thật của sếp (ba-n-ghi-mo--i-22/24/32) vẫn 200. `interviews/` trên R2 giờ chỉ còn file đang dùng.

## 2026-11-10 (tiếp) — Mail xác nhận tự động cho khách báo giá (/api/leads)
- Sếp hỏi form báo giá chỉ lưu /crm, chưa mail khách → chốt: gửi mail xác nhận ngay khi khách gửi form, From + Reply-To = toan.dang@tdgamestudio.com, BCC toan.dang@ để có luồng thư trong Gmail; khách Reply / sếp trả lời đều trong Gmail toan.dang@. Nội dung (sếp OK bản nháp): thư tay chỉ text, hứa phản hồi 1 ngày làm việc (GMT+7), gợi ý 3 thông tin (ref art / khối lượng / deadline), link portfolio, ký "Toan Dang", trích lại tin khách; khách viết tiếng Việt có dấu → bản tiếng Việt.
- `src/lib/lead-ack-email.ts` (thuần, +test 9/9): config (`LEAD_ACK_MODE=live` mới gửi khách, mặc định test → về toan.dang@ tiêu đề `[TEST → email]`, không BCC), dựng mail EN/VI, trích tin bỏ mọi link/tên miền (chống mượn form gửi link lừa đảo), escape ILIKE. `LEAD_OWNER_EMAIL` + `gmailComposeUrl`/`gmailThreadUrl` ở `leads.ts`. `safeGreetingName` (chat-email) export dùng chung.
- `src/lib/lead-ack-send.ts`: Resend REST riêng (KHÔNG sửa `sendViaResend` — impact CRITICAL, cần BCC + chỉ text). Mỗi email tối đa 1 mail/24h (đếm lead form khác cùng email, bỏ chat/waitlist) + 30 mail/giờ toàn site (in-memory). Không throw.
- `/api/leads`: fire-and-forget gửi mail trước rồi Discord sales có field "Mail xác nhận" (test/đã gửi/bỏ qua/lỗi).
- /crm: "Trả lời" + "Mở mail đã điền sẵn" (nháp AI) → Gmail compose đúng tài khoản toan.dang@ (tab mới) thay `mailto:`; thêm "Xem thư trong Gmail" (search email khách); email ở header cũng mở Gmail search.
- Kiểm: gửi thật 2 mail mẫu (EN + VI) chế độ test → toan.dang@, Resend `delivered`, From đúng. Câu dedupe chạy read-only trên prod: khớp không phân biệt hoa thường, loại chính lead. tsc 0, tests 457/457. eslint: 1 lỗi có từ trước `CRMBoard.tsx:190` (setState trong effect) — không phải phần sửa.
- Mail qua lại trong Gmail KHÔNG về /crm (chấp nhận giai đoạn này).
- Next: deploy (VPS chưa set LEAD_ACK_MODE → test). Sếp xem 2 mail mẫu + mail [TEST] từ lead thật → OK thì set `LEAD_ACK_MODE=live` trên VPS + pm2 restart.
- Sau deploy, security review tự động báo 3 điểm → đã sửa: (1) trích tin khách chuẩn hoá NFKC + bỏ mọi token có dấu chấm (kể cả chấm Unicode/full-width, IP), "://" hoặc "@"; chấm cuối câu giữ. (2) chống gửi trùng thêm giới hạn RAM theo hộp thư chuẩn hoá (`canonicalEmail`: bỏ +tag, chấm Gmail, googlemail) 1/24h + mỗi IP 3 mail/giờ (`clientIp`). (3) form công khai không được tự đặt source "chat"/"tool-waitlist" (ép về contact-form); dedupe DB đếm MỌI nguồn. Tests 459/459, tsc/eslint 0.
