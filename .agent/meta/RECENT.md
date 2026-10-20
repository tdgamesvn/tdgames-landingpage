# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-10-20 — HR: dọn ứng viên test "ZZ ETA Test (temp)"
- Task: sếp hỏi card "ZZ ETA Test (temp)" trên /hr từ đâu ra, lỗi hay chủ đích.
- Chẩn đoán: dữ liệu test do agent tạo trong phiên 2026-10-14 làm tính năng "ứng viên hẹn giờ nộp bài test" (row tạo 15:17, chọn ETA 15:20, commit 362fae5 lúc 15:29) — phiên đó không dọn, LOG cũng không ghi. Không phải lỗi hệ thống; không có comment/vòng PV/bài nộp/file R2 đi kèm.
- Work Done: xoá qua DELETE /api/hr/applications/[id] trên prod (200, DB không còn row). Quét applications/jobs/interview_sessions/blog_posts/comments tìm dữ liệu test khác: không còn.
- Bài học: test trên prod DB thì phải dọn ngay trong phiên + ghi LOG.

## 2026-10-20 — HR: MBTI + AI đọc Note/comment/bài test + Leader chấm bài test
- Task: sếp hỏi AI đang đánh giá dựa trên gì; muốn thêm link test MBTI (HR tự điền), AI đọc cả MBTI + Note + comment; thêm luồng Leader chấm bài test (Leader vào thẳng /hr, chỉ 1 người, không cần tag Discord).
- Trước đó AI chỉ đọc: JD + text CV (PDF ≤12k ký tự) + field form. Link portfolio/LinkedIn chỉ là chuỗi URL, AI không mở. Không đọc Note/comment/bài test.
- Work Done: migration `application_mbti_test_review` (apply prod): applications + mbti_type, mbti_url, test_review jsonb {verdict pass|consider|fail, score 1-10, comment, reviewer, reviewed_at}. PATCH /api/hr/applications/[id] nhận 3 field (validate link http(s), verdict, điểm 1–10; reviewer = tên đang comment). `hrSignals()` + `HR_SIGNALS_RULES` trong src/lib/interview-ai.ts: MBTI (+ bóc chữ trang kết quả, JS-only thì null), Note, ≤50 comment, test_submissions, leader_review → đưa vào evaluate + questions + analyze. Rule: Note/comment = ý kiến nội bộ (chỉ dữ kiện, ưu tiên bằng chứng khách quan), leader_review = tín hiệu tay nghề nặng ký, MBTI chỉ tham khảo — cấm cộng/trừ điểm. UI: dòng MBTI (badge + link, Sửa) trong modal; khối "Leader chấm bài" trong mục Bài test (hiện khi có bài nộp); card kanban badge "📝 Chờ chấm" / "📝 Test x/10" (list API join test_submissions(count)).
- Local `.env.local` AI_MODEL cũng còn gpt-5.5 → đổi gpt-5.6-sol.
- Result: tsc sạch, eslint không thêm lỗi. Test local với ứng viên tạm (comment + bài nộp): validate 400 đúng; evaluate 200 9s — AI dẫn đúng Leader 6/10 "cân nhắc" + comment (giao tiếp, start 1/11), không nhắc MBTI. Playwright: badge card 6/10 → 9/10 sau khi Leader sửa, 0 lỗi trang. Ứng viên tạm đã xoá qua API (applications/comments/submissions = 0).
