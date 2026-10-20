# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-10-20 — HR: MBTI + AI đọc Note/comment/bài test + Leader chấm bài test
- Task: sếp hỏi AI đang đánh giá dựa trên gì; muốn thêm link test MBTI (HR tự điền), AI đọc cả MBTI + Note + comment; thêm luồng Leader chấm bài test (Leader vào thẳng /hr, chỉ 1 người, không cần tag Discord).
- Trước đó AI chỉ đọc: JD + text CV (PDF ≤12k ký tự) + field form. Link portfolio/LinkedIn chỉ là chuỗi URL, AI không mở. Không đọc Note/comment/bài test.
- Work Done: migration `application_mbti_test_review` (apply prod): applications + mbti_type, mbti_url, test_review jsonb {verdict pass|consider|fail, score 1-10, comment, reviewer, reviewed_at}. PATCH /api/hr/applications/[id] nhận 3 field (validate link http(s), verdict, điểm 1–10; reviewer = tên đang comment). `hrSignals()` + `HR_SIGNALS_RULES` trong src/lib/interview-ai.ts: MBTI (+ bóc chữ trang kết quả, JS-only thì null), Note, ≤50 comment, test_submissions, leader_review → đưa vào evaluate + questions + analyze. Rule: Note/comment = ý kiến nội bộ (chỉ dữ kiện, ưu tiên bằng chứng khách quan), leader_review = tín hiệu tay nghề nặng ký, MBTI chỉ tham khảo — cấm cộng/trừ điểm. UI: dòng MBTI (badge + link, Sửa) trong modal; khối "Leader chấm bài" trong mục Bài test (hiện khi có bài nộp); card kanban badge "📝 Chờ chấm" / "📝 Test x/10" (list API join test_submissions(count)).
- Local `.env.local` AI_MODEL cũng còn gpt-5.5 → đổi gpt-5.6-sol.
- Result: tsc sạch, eslint không thêm lỗi. Test local với ứng viên tạm (comment + bài nộp): validate 400 đúng; evaluate 200 9s — AI dẫn đúng Leader 6/10 "cân nhắc" + comment (giao tiếp, start 1/11), không nhắc MBTI. Playwright: badge card 6/10 → 9/10 sau khi Leader sửa, 0 lỗi trang. Ứng viên tạm đã xoá qua API (applications/comments/submissions = 0).

## 2026-10-20 — Khảo sát: AI mở link portfolio/LinkedIn để chấm được không (chưa code)
- Dữ liệu thật (95 hồ sơ): LinkedIn 34, Google Drive 34, Behance 32, còn lại linktr.ee, Canva, Wix, Framer, myportfolio, Figma, Netlify (lẻ tẻ).
- Fetch thường từ VPS: Behance 200, bóc được ~150 URL ảnh dự án (mir-s3-cdn-cf.behance.net). Site cá nhân (Netlify/Framer) 200, có ảnh. LinkedIn 999 — chặn bot, KHÔNG làm (vi phạm ToS). myportfolio có mật khẩu → không. Drive folder public: bóc được ID file từ HTML; thumbnail `drive.google.com/thumbnail?id=…&sz=w1200` ra ảnh với file ảnh (1/4), 404 với thư mục con/file khác → muốn chắc phải dùng Drive API key.
- Vision: gpt-5.6-sol (và gpt-6-sol) nhận image_url qua cliproxyapi, mô tả đúng ảnh Behance, ~4s/ảnh.
- Kết luận: làm được cho Behance + site cá nhân + Drive (một phần, đủ khi có API key). Chờ sếp quyết.
