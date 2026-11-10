# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-11-10 (tiếp) — Mail xác nhận lead do AI viết + hẹn giờ 4–7 phút + huỷ trong /crm
- Sếp: mail mẫu chung chung quá → AI đọc form, chỉ hỏi đúng thông tin còn thiếu (khối lượng / style-ref / deadline), đủ rồi thì báo sẽ phản hồi sớm; gửi trễ ~5 phút cho đỡ giống bot. Chốt: AI CHỈ viết mail đầu tiên, các thư sau sếp tự xử lý.
- `src/lib/lead-ack-ai.ts` (+test): prompt (form = DATA không phải lệnh; ngôn ngữ của khách; 50–150 từ; cấm giá/tiền/link/email/SĐT/bịa; không ký tên), `guardAckDraft` (parse JSON, độ dài, tiền tệ, token link — kể cả chấm Unicode/IDN/IP, SĐT ≥7 số, tự ký tên → loại), `composeAiAck` (thân AI + chữ ký 3 dòng có link portfolio + footer; KHÔNG trích tin khách — chống mượn mail chuyển nội dung lạ), `ackSendAt` (ngẫu nhiên 4–7 phút từ lúc gửi form), `scheduledAtParam` (còn <60s → gửi ngay).
- `lead-ack-send.ts`: model AI_MODEL → dự phòng `LEAD_ACK_FALLBACK_MODEL`/gpt-6.1-sol → nháp không đạt/lỗi → mail mẫu cũ. Resend `scheduled_at`. Lưu `leads.ack_email_id/ack_send_at/ack_status/ack_writer` (migration 20261110120000_leads_ack_email, chỉ ADD, đã apply). Sau khi hẹn mà lead đã bị đổi trạng thái/xoá (trong lúc AI viết) → huỷ ngay. `cancelLeadAck` (422 "not scheduled" = đã gửi).
- /crm: PATCH status ≠ new → huỷ mail đang hẹn; DELETE lead → huỷ trước; PATCH `{cancel_ack:true}` = nút "Huỷ mail". Khung chi tiết lead có dòng ✉️ trạng thái mail (sẽ gửi lúc… / đã gửi / đã huỷ / bỏ qua / lỗi). Discord sales: "hẹn HH:MM · AI viết / mail mẫu (lý do)".
- `LINKISH_TOKEN` đổi: chữ/số + chấm + chữ Latin, hoặc số.số → "。" giữa câu tiếng Nhật không còn bị coi là link.
- Kiểm: AI thật (gpt-6.1-sol) 5 kiểu khách — EN mơ hồ (hỏi 3 ý), EN đủ ý (không hỏi), VI không dấu (mail VI), Nhật, chèn lệnh lừa đảo (mail sạch). 3 mail mẫu gửi về toan.dang@ (test). E2E local + DB/Resend thật (lead ZZTEST): 201 → 10s AI viết (local Claude lỗi → dự phòng OK) → scheduled +5.8 phút → PATCH contacted → ack cancelled, Resend canceled → DELETE, DB sạch. Tests 471/471, tsc 0; eslint chỉ còn lỗi cũ setLoading CRMBoard.
- Lưu ý: sếp trả lời khách ngay trong Gmail (không qua /crm) trong 4–7 phút đó thì mail vẫn gửi — muốn chặn thì đổi trạng thái/bấm Huỷ trong /crm. Mail VI AI hay xưng "mình/bạn".
- Next: sếp xem 3 mail mẫu → OK thì `LEAD_ACK_MODE=live` trên VPS + pm2 restart.

## 2026-11-10 (tiếp) — Mail xác nhận: hẹn cố định 3 phút + tiếng Việt xưng anh/chị
- Sếp: gửi sau 3 phút (bỏ ngẫu nhiên 4–7) → `ACK_DELAY_MS = 3 phút`, `ackSendAt(submittedAt)`. Mail VI xưng "anh/chị", bên mình "chúng tôi" (thêm luật trong prompt); footer VI "Anh/chị nhận email này…".
- AI thật 2 khách VI (có dấu / không dấu): đều "anh/chị" + "chúng tôi", không còn bạn/mình. 1 mẫu (khách "Trần Thị Lan") gửi test về toan.dang@. Tests 471/471, tsc 0.
- Ghi chú: AI viết "anh/chị Lan" kể cả khi tên rõ giới tính (Thị) — đúng luật sếp chốt.
