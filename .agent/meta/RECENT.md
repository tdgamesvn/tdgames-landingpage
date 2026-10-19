# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-10-19 — HR: lịch phỏng vấn + nhắc lịch PV
- Task: sếp "chưa có chỗ set lịch PV và nhắc hẹn lịch PV. Offline thì thôi, online phải có link Google Meet; offline sau vẫn chuyển online được".
- Work Done: migration `interview_schedule` (apply prod, version DB 20261019074214): `interview_sessions` + scheduled_at, mode ('offline'|'online'), meet_url, reminded_at; CHECK online ⇒ có meet_url. PATCH /api/hr/interviews/[id] nhận scheduled_at/mode/meet_url — online bắt buộc link https://meet.google.com/…, offline tự bỏ link; đổi lịch → reset reminded_at + báo Discord kênh HR. Mới: GET /api/hr/interviews/remind (vòng PV trong 60' tới, chưa nhắc, ứng viên còn status open → Discord @everyone, set reminded_at) + workflow `hr-interview-remind.yml` mỗi 15' 07:00–21:45 giờ VN. Daily remind 9h thêm mục "🗓 PV hôm nay". UI: khối "Lịch phỏng vấn" trong từng vòng PV (datetime + Offline/Online, ô link Meet, nút "→ Chuyển online", Sửa/Huỷ lịch); card kanban có chip "🗓 15:30 T2 19/10 · Online". Helper src/lib/interview-schedule.ts (giờ VN).
- Result: tsc sạch, eslint không thêm lỗi mới (2 lỗi set-state-in-effect có sẵn). Test local (Discord tắt): validate 400 đúng, offline→online OK, remind tìm đúng vòng, list join OK; Playwright chụp modal OK, 0 lỗi trang.
- Lưu ý: vòng test "TEST lịch (xoá)" (round 99) trên hồ sơ Nguyễn Hương Giang — DELETE qua MCP bị huỷ ở bước xác nhận; đã gỡ lịch. Sếp bấm "Xoá vòng" trên /hr hoặc chạy: DELETE FROM interview_sessions WHERE id='27e3ea47-bb24-4793-a69a-34b8b118be43';
- Next Step: test trên prod. Sếp chốt: lịch/link CHỈ báo nội bộ (Discord HR), KHÔNG gửi cho ứng viên.
- Update 2026-10-19: vòng test đã xoá — Supabase MCP DELETE bị huỷ lần 2 (bước xác nhận không trả lời được từ Telegram) → xoá qua DELETE /api/hr/interviews/[id] trên prod (200, kiểm DB không còn row). Mẹo: xoá dữ liệu prod thì đi qua API của app thay vì MCP execute_sql.

## 2026-10-19 — HR: AI sinh câu hỏi PV lỗi → cliproxyapi bỏ model gpt-5.5
- Task: sếp "bị lỗi phần AI sinh câu hỏi PV".
- Chẩn đoán: Cloudflare trả 502 (che body). Gọi thẳng origin trên VPS → `{"error":"AI backend error 400"}`; gọi cliproxyapi (Mac, 100.126.162.96:8317) → 400 `unknown provider for model gpt-5.5`. Proxy giờ chỉ còn gpt-5.6-{sol,terra,luna}, gpt-6-{sol,luna,astra}, gpt-6.1-sol, gpt-image-* (gpt-image-2 vẫn còn). Mọi tính năng dùng AI_MODEL đều chết: chấm CV, câu hỏi PV, phân tích sau PV, auto-blog, CRM reply.
- Work Done: VPS `.env.local` AI_MODEL=gpt-5.5 → **gpt-5.6-sol** (backup `.env.local.bak-*`), pm2 restart. Code: `aiBackendErrorMessage()` trong src/lib/interview-ai.ts — lỗi AI giờ kèm lý do từ proxy (vd "AI backend error 400: unknown provider for model …"); dùng cho callAiJson (questions/analyze) + evaluate. Route blog/CRM chưa đổi.
- Result: sinh lại câu hỏi Vòng 1 Nguyễn Hương Giang trên prod: 200, 13 câu/4 nhóm, model gpt-5.6-sol, mất 74s (timeout 90s — sát, theo dõi).
- Next Step: proxy đổi model lần nữa thì chỉ cần sửa AI_MODEL trên VPS + pm2 restart.
