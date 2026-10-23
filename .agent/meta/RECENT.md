# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-10-23 — Commit + push đợt giao diện HR mới
- Task: sếp duyệt trên local → commit + push.
- Work Done: commit `cfbf769` (styleguide v4 + Sáng/Tối + popup hồ sơ + status dropdown + lucide-react + .agent/ref). Build local OK trước khi push.
- Result: CI deploy success; prod /hr 200, HTML có `--hr-font` Inter (bản mới đã live); trang chủ 200.
- Chưa xong / để lại: AGENTS.md + CLAUDE.md modified chỉ do gitnexus analyze cập nhật số symbol — cố ý KHÔNG commit. Dev server local (localhost:3000, chạy detached) vẫn bật — tắt bằng `pkill -f "next dev"`. HR key đã lộ trong log Playwright → khuyên sếp đổi.
- Next: chờ feedback team HR về giao diện mới.

## 2026-10-23 — HR: Pipeline/Data/KPI dùng hết chiều ngang màn rộng
- Task: sếp báo màn desktop rộng bị cắt 2 bên (Pipeline phải cuộn ngang dù 2 bên trống).
- Nguyên nhân: header + main bị `max-w-screen-2xl` (1536px).
- Work Done: HRDashboard `pageWidth` — Pipeline/Data/KPI `max-w-none`, Jobs giữ 1536px (dòng chữ không quá dài). Màn < 1536px (laptop, mobile) không đổi.
- Result: tsc sạch; Playwright 2560px: đủ 8 cột + cột Rejected thu gọn, không cuộn ngang; 390px mobile y như cũ.
- Sếp: 2 bên sát mép quá → lề ngang header + main: mobile giữ nguyên (12–16px), sm 24px, lg 40px.
- Sếp: tab Jobs hẹp hơn các tab khác (header nhảy khi đổi tab) → bỏ ngoại lệ, mọi tab full width.
- Next: chờ sếp OK → commit + push (chưa push).
