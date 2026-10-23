# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-10-23 — HR: đồng bộ styleguide TD Games Work v4 (Mức 2)
- Task: sếp muốn /hr theo style guide của tdgames-project-manager (sếp copy STYLEGUIDE.md + PRINCIPLES.md vào `.agent/ref/` vì bot không đọc được ngoài repo). Chọn Mức 2 (phần nhìn + thành phần).
- Work Done: hr-theme.css viết lại theo token guide (canvas/raised/ink-2/ink-3/hair/fill, cam + orange-ink, kính sáng/tối, bóng surface/card, focus cam 3px, bo đồng tâm, nút viên thuốc, nút phụ nền fill, cỡ chữ nhỏ nâng lên). Inter (next/font, opsz, vietnamese) qua biến --hr-font trong page.tsx. Mặc định Sáng. Trạng thái + điểm AI/PV = chấm 7px + chữ (status-palette.ts, scoreColor ×2); mọi chip tô nền → chữ màu không nền (rule CSS chung `span.rounded*[class*="-500/1"]`). ~60 emoji → icon `lucide-react` (dep mới) ở 6 component. Pipeline: cột = làn (`hr-lane`), thẻ = `hr-card` trắng bo 12 + hover nhấc. Chữ cam trên nền sáng ép --orange-ink cho đủ tương phản.
- Result: tsc sạch, eslint chỉ còn 2 lỗi cũ, `npm run build` OK. Playwright dev + DB prod: Pipeline/Data/KPI/Jobs + Xếp hạng/modal/đăng nhập, Sáng + Tối, mobile 390px.
- detect-changes: "critical" vì chạm 24 flow — nhưng toàn bộ trong src/app/hr, thay đổi chỉ là trình bày (không đổi logic/API).
- Lưu ý: AGENTS.md / CLAUDE.md đang modified do gitnexus analyze cập nhật số symbol, không phải em sửa tay.
- Next: sếp duyệt ảnh → commit + push.

## 2026-10-23 — HR: làm lại popup hồ sơ ứng viên + status thành dropdown
- Task: sếp gửi ảnh popup, muốn bố cục đẹp/dễ nhìn hơn, gom status thành 1 dropdown.
- Work Done (CandidateModal trong HRDashboard.tsx, kiểu Inspector của styleguide): header = avatar chữ cái + tên 21/700 + job · ngày nộp · via; hàng hành động = `StatusMenu` (nút "Trạng thái ● New ▾", menu chấm+chữ, ✓ mục hiện tại, cuối menu Reject…/Mở lại) + nút cam "Chuyển sang <bước kế>" + Reject + `MoreMenu` ⋯ (Xoá hồ sơ). Thân nền canvas, nhóm thẻ trắng: số liệu chính (kinh nghiệm/lương/hình thức/bắt đầu…), lý do reject, Đánh giá AI (điểm lớn, ưu ✓ / lo ⚠ chữ thường thay vì cả khối chữ xanh/đỏ), Ghi chú (Lưu/Huỷ), Bài test, Phỏng vấn, Liên hệ & hồ sơ (hàng 42px kẻ thụt), Lời nhắn. Cột phải: bình luận bong bóng + ô nhập viên thuốc + nút gửi tròn cam. CommentThread đổi luôn (cũng dùng ở hàng mở rộng tab Data).
- Lưu ý: comment cũ ghi dropdown status từng bị HR tưởng là nhãn tĩnh → nút mới có chữ "Trạng thái", mũi tên, nền nút.
- Result: tsc sạch, eslint không thêm lỗi; Playwright: popup Sáng/Tối, menu status, mobile 390px.
- Next: sếp xem trên local → commit + push.
