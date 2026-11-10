# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

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

## 2026-11-10 (tiếp) — Luồng AI hỏng: tài khoản Claude trong cliproxy mất auth
- Sếp báo "luồng AI đang hỏng". Gọi thẳng proxy (Mac mini, `AI_BASE_URL` 100.126.162.96:8317) từ VPS: `claude-sonnet-5-5` 503 "auth_unavailable … invalid x-api-key", `claude-opus-5-5` 401 invalid x-api-key; `gpt-5.6-sol` / `gpt-6.1-sol` 200 (~2s). `/models` OK → proxy sống, chỉ credential Claude bên trong hỏng.
- VPS `AI_MODEL` đổi sang `claude-sonnet-5-5` từ 2026-11-02 → hỏng mọi chỗ dùng AI_MODEL không fallback: chấm CV /hr (evaluate), Phân tích PV (interview-ai — chính là lỗi 401 "local" ghi ở entry ghi âm), blog topics/reimage /admin, nháp trả lời /crm. Chat website vẫn chạy nhờ CHAT_AI_FALLBACK (gpt-6.1-sol).
- Sếp OK → VPS `.env.local` AI_MODEL=gpt-6.1-sol (backup `.env.local.bak-20261110-ai-model`), pm2 restart. Kiểm bằng @next/env loader: app thấy "gpt-6.1-sol", gọi AI 200 ra JSON đúng.
- Chờ sếp: đăng nhập lại Claude trong cliproxyapi trên Mac mini (credential của sếp, em không đụng) → muốn thì đổi lại Claude.
- Next: mail xác nhận lead viết bằng AI (sếp chốt: chỉ mail đầu tiên; trả lời tiếp sếp tự lo), hẹn giờ ~4–7 phút qua Resend scheduled_at, kiểm nội dung (không link lạ/giá/hứa), AI lỗi → model dự phòng → mail mẫu.
