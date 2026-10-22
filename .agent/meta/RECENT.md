# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-10-22 — HR: Leader chấm bài test → báo Discord
- Task: sếp "Leader chấm điểm xong không có thông báo về discord à".
- Nguyên nhân: `notifyApplicationUpdate` (src/lib/hr-notify.ts) chỉ báo khi đổi status / admin_notes; `test_review` lưu được nhưng bị bỏ qua.
- Work Done: thêm nhánh `test_review` (khác null) → Discord kênh hr: @everyone + embed Kết luận (✅ Đạt / 🤔 Cân nhắc / ❌ Không đạt, màu tương ứng), Điểm x/10, Người chấm, Position, Nhận xét (≤1000 ký tự). Xoá đánh giá (null) thì không báo. `onReview` → `updateApp` chỉ là state local → không gửi trùng.
- Result: tsc + eslint sạch. Impact LOW (2 PATCH route hr/admin). Đã commit + push (deploy CI).
- Update 2026-10-22: gửi tay thông báo đánh giá của Leader cho Đỗ Danh Huy (Toan Dang, ❌ Không đạt 4/10, 2D Game Artist) lên Discord HR — webhook 204.

## 2026-10-22 — Careers: link riêng cho từng job
- Task: sếp "các job chưa có url riêng nên gửi link job cho UV apply khó". Chốt hướng A: link mở trang Careers với panel job bật sẵn.
- Hiện trạng: `/apply/<slug>` đã có từ trước (mô tả + form), HR tab Jobs đã có "📋 Copy Link" (+ ?ref=) trỏ /apply; nhưng preview link (Zalo/FB/LinkedIn) chỉ hiện tiêu đề chung của site, panel /careers không đổi URL.
- Work Done:
  - `careers-client.tsx`: mở/đóng panel → `history.replaceState` ?job=<slug> (giữ ?ref=); vào `/careers?job=<slug>` → panel tự mở sau khi load jobs; nút "Copy link" ở header panel; Apply Now chuyển tiếp ?ref= sang /apply.
  - `src/lib/job-metadata.ts` (mới): title/description (lương · tóm tắt)/og:image = image_url của job; dùng ở `generateMetadata` của `/careers` (khi có ?job) và `/apply/[slug]`. Slug sai/job đóng → metadata mặc định.
  - HR `JobsView.copyLink` → `/careers?job=<slug>[&ref=]`.
- Lưu ý: /careers giờ render động (generateMetadata đọc searchParams) — `revalidate = 60` không còn tác dụng; mỗi request thêm 1 query jobs khi có ?job.
- Result: tsc sạch, eslint không thêm lỗi (7 lỗi có sẵn). Dev + Playwright: ?job= mở đúng panel, Copy link ra đúng URL kèm ref, đóng panel bỏ job giữ ref, Apply → /apply/<slug>?ref=. Metadata OK cho /careers?job, /apply, /careers, slug sai. Đã commit + push (deploy CI).
