# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

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

## 2026-10-22 — Ranking v2: sếp báo xếp hạng sai (feedback tệ vẫn cao, người nước ngoài #1)
- Nguyên nhân (lỗi prompt của em): RANK_RULES bảo "không xét reject, ý kiến nội bộ chỉ bổ sung, ưu tiên khách quan" → AI tin CV tự khai hơn kết luận của team; digest còn tự thêm "chưa có dữ liệu khách quan" làm nhẹ đi; không có khái niệm tiêu chí loại cứng; hồ sơ AI không có nơi ở/quốc tịch.
- Sửa (sếp OK): tiêu chí loại cứng ở app_settings `hr_ranking_rules` (mặc định: không người nước ngoài; phải ở/làm onsite Hà Nội), sửa được qua nút "⛔ Tiêu chí loại" (PUT /api/hr/ranking/rules), vào jobHash → đổi là cần chấm lại; entries thêm `blocked/block_reason` (migration 20261022010000), bị block xếp cuối bảng. Kết luận team > CV: skill_negative → tối đa 55; withdrawn/unreachable không trừ; lương vượt trừ 5-15. Digest d2 phân loại `verdicts` (skill_negative/positive, salary, location, nationality, withdrawn, unreachable, attitude), giữ nguyên mức độ. Profile p2 thêm location/nationality. UI hiện lý do reject từng dòng, ⛔ lý do block, chi tiết có nơi ở + verdicts.
- Chạy lại prod: 113 hồ sơ đọc lại + 7 job. 10 người bị block đúng (Nacho, Bobrov, Karol ×2, Diego, Rosana — nước ngoài; Lê Nhựt Ái Linh, Lê Thị Kim Chi, Trần Công Đại, Tran Van Linh — TP.HCM). Ca feedback xấu: Thùy Linh 73→41, Phan Trần Đức 81→54, Nguyễn Đình Nghĩa ~35-41, Lực Lưu ~37.
- Bẫy: Cloudflare cắt request >100s (524) → profiles 1 hồ sơ/request, 3 song song.
