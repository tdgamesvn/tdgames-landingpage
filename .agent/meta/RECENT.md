# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-10-22 — Careers: link riêng cho từng job
- Task: sếp "các job chưa có url riêng nên gửi link job cho UV apply khó". Chốt hướng A: link mở trang Careers với panel job bật sẵn.
- Hiện trạng: `/apply/<slug>` đã có từ trước (mô tả + form), HR tab Jobs đã có "📋 Copy Link" (+ ?ref=) trỏ /apply; nhưng preview link (Zalo/FB/LinkedIn) chỉ hiện tiêu đề chung của site, panel /careers không đổi URL.
- Work Done:
  - `careers-client.tsx`: mở/đóng panel → `history.replaceState` ?job=<slug> (giữ ?ref=); vào `/careers?job=<slug>` → panel tự mở sau khi load jobs; nút "Copy link" ở header panel; Apply Now chuyển tiếp ?ref= sang /apply.
  - `src/lib/job-metadata.ts` (mới): title/description (lương · tóm tắt)/og:image = image_url của job; dùng ở `generateMetadata` của `/careers` (khi có ?job) và `/apply/[slug]`. Slug sai/job đóng → metadata mặc định.
  - HR `JobsView.copyLink` → `/careers?job=<slug>[&ref=]`.
- Lưu ý: /careers giờ render động (generateMetadata đọc searchParams) — `revalidate = 60` không còn tác dụng; mỗi request thêm 1 query jobs khi có ?job.
- Result: tsc sạch, eslint không thêm lỗi (7 lỗi có sẵn). Dev + Playwright: ?job= mở đúng panel, Copy link ra đúng URL kèm ref, đóng panel bỏ job giữ ref, Apply → /apply/<slug>?ref=. Metadata OK cho /careers?job, /apply, /careers, slug sai. Đã commit + push (deploy CI).

## 2026-10-22 — HR: AI xếp hạng ứng viên phù hợp theo job
- Task: sếp muốn vào Job thấy bảng xếp hạng ứng viên phù hợp nhất (toàn bộ DB, kể cả reject), bấm tính lại được, tiết kiệm token. Chốt: xếp cả người nộp job khác, có xem ảnh portfolio, dữ liệu mới chỉ đánh dấu 🔄 chờ bấm.
- Work Done:
  - Migration `20261022000000_candidate_ranking`: applications + `ai_profile/_hash`, `ai_digest/_hash`; bảng `job_rankings` (meta) + `job_ranking_entries` (điểm, lý do, fingerprint, counts). Đã apply prod.
  - `src/lib/candidate-ranking.ts`: hồ sơ AI 2 phần (CV+portfolio / dữ liệu HR), hash để biết phần nào cũ; mỗi application 1 dòng (KHÔNG gộp theo email — email chưa xác minh, người lạ có thể dùng để che ứng viên thật; security review bắt); chấm 15 người/lượt + lượt chốt top 15; basis 📄 CV / 📝 Test / 🎤 PV; "+2 comment, +1 PV…" so với lúc chấm.
  - API: `GET/POST /api/hr/jobs/[id]/ranking` (step score|final), `POST /api/hr/ranking/profiles` (≤3 id). `callAiJson` thêm opts.images.
  - UI: `RankingPanel.tsx` — nút 🏆 Xếp hạng ở mỗi job (tab Jobs): Tính lại (chỉ phần mới) / Tính lại toàn bộ, thanh tiến độ, Ẩn Rejected, Chi tiết (tóm tắt hồ sơ + HR), bấm tên mở CandidateModal (`CandidateModalHost` mới).
- Sự cố: migration đầu có FK job_id→jobs ở bảng entries → PostgREST báo "more than one relationship" cho mọi embed `jobs(...)` (cả prod) ~3 phút; đã drop FK + reload schema, /api/jobs prod 200.
- Result: tsc sạch, eslint file mới sạch. Dev test thật 3 ứng viên Spine: hồ sơ 27s (3 song song), chấm 9s, chốt 9s; điểm 81/67/54 lý do hợp lý. UI Playwright OK.
- Token ước tính: lần đầu ~106 hồ sơ × ~5k; sau đó mỗi job ~6 lượt × ~7k + chốt ~6k; dữ liệu mới chỉ tốn phần digest (text) của người đó.
- Next: chạy lần đầu trên prod (từ VPS — Behance chặn IP Mac nên KHÔNG chạy hồ sơ từ local).
- Update 2026-10-22: chạy lần đầu trên prod qua API (server VPS tải portfolio): 108 hồ sơ AI mới, 0 lỗi, ~10 phút (2 request × 3 hồ sơ song song); chấm cả 7 job (111 người/job), mỗi job ~2,5 phút. Lưu ý: chạy lại lượt chốt làm điểm top dao động vài điểm (VFX 82→80).
