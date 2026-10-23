# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-10-23 — HR: Pipeline/Data/KPI dùng hết chiều ngang màn rộng
- Task: sếp báo màn desktop rộng bị cắt 2 bên (Pipeline phải cuộn ngang dù 2 bên trống).
- Nguyên nhân: header + main bị `max-w-screen-2xl` (1536px).
- Work Done: HRDashboard `pageWidth` — Pipeline/Data/KPI `max-w-none`, Jobs giữ 1536px (dòng chữ không quá dài). Màn < 1536px (laptop, mobile) không đổi.
- Result: tsc sạch; Playwright 2560px: đủ 8 cột + cột Rejected thu gọn, không cuộn ngang; 390px mobile y như cũ.
- Sếp: 2 bên sát mép quá → lề ngang header + main: mobile giữ nguyên (12–16px), sm 24px, lg 40px.
- Sếp: tab Jobs hẹp hơn các tab khác (header nhảy khi đổi tab) → bỏ ngoại lệ, mọi tab full width.
- Sếp OK → commit + push 2026-10-23.
- Deploy `0fb746d`: lần 1 CI fail — Turbopack trên VPS không tải được Google Fonts (Nunito Sans của site, "next/font/google queries have exactly one entry"), không liên quan code; prod vẫn chạy bản cũ (200). `gh run rerun` → attempt 2 success, prod /hr có `max-w-none`. Bẫy: lỗi font Google trên VPS là chập chờn mạng → cứ rerun trước khi sửa code.

## 2026-10-23 — HR: tách "đặt lịch PV" (HR) khỏi "câu hỏi PV" (Lead, tuỳ chọn)
- Task: sếp muốn HR chỉ setup lịch PV; câu hỏi PV không phải lúc nào cũng cần — Lead cần thì bấm.
- Thực trạng: backend vốn đã tách (POST interviews chỉ tạo vòng, câu hỏi ở POST /interviews/[id]/questions khi bấm). Rối là do UI: nút "+ Thêm vòng PV để AI soạn câu hỏi", mỗi vòng bày sẵn lịch + câu hỏi + ghi âm + phân tích.
- Work Done (InterviewPanel.tsx): nút đầu tiên "+ Đặt lịch PV" (vòng sau "+ Thêm vòng PV"), form lịch mở sẵn; empty state nói về lịch + Discord. Mỗi vòng: Lịch phỏng vấn hiện sẵn; `Fold` gập "Câu hỏi PV cho Lead" (gợi ý "Tuỳ chọn, chỉ soạn khi Lead cần" / "N câu đã soạn", nút "Soạn câu hỏi bằng AI"); `Fold` "Sau buổi PV" (ghi âm, transcript, phân tích) — tự mở nếu đã có dữ liệu. Bỏ [color-scheme:dark] ở ô ngày (sai ở chế độ Sáng).
- Result: tsc sạch; Playwright: ứng viên có vòng (Nguyen Thao Nguyen, 13 câu đã soạn → gập), ứng viên chưa có (nút Đặt lịch PV). KHÔNG bấm tạo vòng (DB prod).
- Next: sếp xem local → commit + push (chưa push).
