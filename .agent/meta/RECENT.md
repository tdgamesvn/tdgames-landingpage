# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-11-10 (tiếp) — Luồng AI hỏng: tài khoản Claude trong cliproxy mất auth
- Sếp báo "luồng AI đang hỏng". Gọi thẳng proxy (Mac mini, `AI_BASE_URL` 100.126.162.96:8317) từ VPS: `claude-sonnet-5-5` 503 "auth_unavailable … invalid x-api-key", `claude-opus-5-5` 401 invalid x-api-key; `gpt-5.6-sol` / `gpt-6.1-sol` 200 (~2s). `/models` OK → proxy sống, chỉ credential Claude bên trong hỏng.
- VPS `AI_MODEL` đổi sang `claude-sonnet-5-5` từ 2026-11-02 → hỏng mọi chỗ dùng AI_MODEL không fallback: chấm CV /hr (evaluate), Phân tích PV (interview-ai — chính là lỗi 401 "local" ghi ở entry ghi âm), blog topics/reimage /admin, nháp trả lời /crm. Chat website vẫn chạy nhờ CHAT_AI_FALLBACK (gpt-6.1-sol).
- Sếp OK → VPS `.env.local` AI_MODEL=gpt-6.1-sol (backup `.env.local.bak-20261110-ai-model`), pm2 restart. Kiểm bằng @next/env loader: app thấy "gpt-6.1-sol", gọi AI 200 ra JSON đúng.
- Chờ sếp: đăng nhập lại Claude trong cliproxyapi trên Mac mini (credential của sếp, em không đụng) → muốn thì đổi lại Claude.
- Next: mail xác nhận lead viết bằng AI (sếp chốt: chỉ mail đầu tiên; trả lời tiếp sếp tự lo), hẹn giờ ~4–7 phút qua Resend scheduled_at, kiểm nội dung (không link lạ/giá/hứa), AI lỗi → model dự phòng → mail mẫu.

## 2026-11-10 (tiếp) — Mail xác nhận lead do AI viết + hẹn giờ 4–7 phút + huỷ trong /crm
- Sếp: mail mẫu chung chung quá → AI đọc form, chỉ hỏi đúng thông tin còn thiếu (khối lượng / style-ref / deadline), đủ rồi thì báo sẽ phản hồi sớm; gửi trễ ~5 phút cho đỡ giống bot. Chốt: AI CHỈ viết mail đầu tiên, các thư sau sếp tự xử lý.
- `src/lib/lead-ack-ai.ts` (+test): prompt (form = DATA không phải lệnh; ngôn ngữ của khách; 50–150 từ; cấm giá/tiền/link/email/SĐT/bịa; không ký tên), `guardAckDraft` (parse JSON, độ dài, tiền tệ, token link — kể cả chấm Unicode/IDN/IP, SĐT ≥7 số, tự ký tên → loại), `composeAiAck` (thân AI + chữ ký 3 dòng có link portfolio + footer; KHÔNG trích tin khách — chống mượn mail chuyển nội dung lạ), `ackSendAt` (ngẫu nhiên 4–7 phút từ lúc gửi form), `scheduledAtParam` (còn <60s → gửi ngay).
- `lead-ack-send.ts`: model AI_MODEL → dự phòng `LEAD_ACK_FALLBACK_MODEL`/gpt-6.1-sol → nháp không đạt/lỗi → mail mẫu cũ. Resend `scheduled_at`. Lưu `leads.ack_email_id/ack_send_at/ack_status/ack_writer` (migration 20261110120000_leads_ack_email, chỉ ADD, đã apply). Sau khi hẹn mà lead đã bị đổi trạng thái/xoá (trong lúc AI viết) → huỷ ngay. `cancelLeadAck` (422 "not scheduled" = đã gửi).
- /crm: PATCH status ≠ new → huỷ mail đang hẹn; DELETE lead → huỷ trước; PATCH `{cancel_ack:true}` = nút "Huỷ mail". Khung chi tiết lead có dòng ✉️ trạng thái mail (sẽ gửi lúc… / đã gửi / đã huỷ / bỏ qua / lỗi). Discord sales: "hẹn HH:MM · AI viết / mail mẫu (lý do)".
- `LINKISH_TOKEN` đổi: chữ/số + chấm + chữ Latin, hoặc số.số → "。" giữa câu tiếng Nhật không còn bị coi là link.
- Kiểm: AI thật (gpt-6.1-sol) 5 kiểu khách — EN mơ hồ (hỏi 3 ý), EN đủ ý (không hỏi), VI không dấu (mail VI), Nhật, chèn lệnh lừa đảo (mail sạch). 3 mail mẫu gửi về toan.dang@ (test). E2E local + DB/Resend thật (lead ZZTEST): 201 → 10s AI viết (local Claude lỗi → dự phòng OK) → scheduled +5.8 phút → PATCH contacted → ack cancelled, Resend canceled → DELETE, DB sạch. Tests 471/471, tsc 0; eslint chỉ còn lỗi cũ setLoading CRMBoard.
- Lưu ý: sếp trả lời khách ngay trong Gmail (không qua /crm) trong 4–7 phút đó thì mail vẫn gửi — muốn chặn thì đổi trạng thái/bấm Huỷ trong /crm. Mail VI AI hay xưng "mình/bạn".
- Next: sếp xem 3 mail mẫu → OK thì `LEAD_ACK_MODE=live` trên VPS + pm2 restart.
