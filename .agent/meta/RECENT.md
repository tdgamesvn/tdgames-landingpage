# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-10-19 — HR: AI sinh câu hỏi PV lỗi → cliproxyapi bỏ model gpt-5.5
- Task: sếp "bị lỗi phần AI sinh câu hỏi PV".
- Chẩn đoán: Cloudflare trả 502 (che body). Gọi thẳng origin trên VPS → `{"error":"AI backend error 400"}`; gọi cliproxyapi (Mac, 100.126.162.96:8317) → 400 `unknown provider for model gpt-5.5`. Proxy giờ chỉ còn gpt-5.6-{sol,terra,luna}, gpt-6-{sol,luna,astra}, gpt-6.1-sol, gpt-image-* (gpt-image-2 vẫn còn). Mọi tính năng dùng AI_MODEL đều chết: chấm CV, câu hỏi PV, phân tích sau PV, auto-blog, CRM reply.
- Work Done: VPS `.env.local` AI_MODEL=gpt-5.5 → **gpt-5.6-sol** (backup `.env.local.bak-*`), pm2 restart. Code: `aiBackendErrorMessage()` trong src/lib/interview-ai.ts — lỗi AI giờ kèm lý do từ proxy (vd "AI backend error 400: unknown provider for model …"); dùng cho callAiJson (questions/analyze) + evaluate. Route blog/CRM chưa đổi.
- Result: sinh lại câu hỏi Vòng 1 Nguyễn Hương Giang trên prod: 200, 13 câu/4 nhóm, model gpt-5.6-sol, mất 74s (timeout 90s — sát, theo dõi).
- Next Step: proxy đổi model lần nữa thì chỉ cần sửa AI_MODEL trên VPS + pm2 restart.
- Update 2026-10-19 (sếp: radar blog hỏng): 📡 Blog Radar đỏ 5 ngày liền (15→19/10), cùng nguyên nhân — 15–18/10 Codex báo "gpt-5.5 not supported with a ChatGPT account" (503), 19/10 proxy đã bỏ hẳn model (400). Script đọc AI_MODEL từ .env.local VPS nên fix env ở trên là đủ, không đổi code. Chạy lại workflow (run 39225771908): success — radar lưu 5 chủ đề + Discord, auto-blog đăng https://tdgamestudio.com/blog/hiring-a-vietnamese-art-studio-tax-usd-invoices-and-transfer-fees (200, 6.6k ký tự, có cover). Bài của 15–18/10 bị lỡ, không bù.
- Update 2026-10-19 (sếp: đổi model ảnh sang image 2.5 sunburst): mặc định `AI_IMAGE_MODEL || "gpt-image-2"` → **"gpt-image-2.5-sunburst"** ở src/lib/ai-image.ts (blog draft/reimage/admin generate-image) + 3 script gen-portfolio-covers / gen-monster-legends-splash / gen-monster-legends-bg. Không set env (VPS + local đều không có AI_IMAGE_MODEL) → đổi default trong code là đủ. Test trực tiếp từ VPS qua proxy: 200, PNG 1536×1024, 37s, chất lượng tốt.

## 2026-10-20 — HR: dọn ứng viên test "ZZ ETA Test (temp)"
- Task: sếp hỏi card "ZZ ETA Test (temp)" trên /hr từ đâu ra, lỗi hay chủ đích.
- Chẩn đoán: dữ liệu test do agent tạo trong phiên 2026-10-14 làm tính năng "ứng viên hẹn giờ nộp bài test" (row tạo 15:17, chọn ETA 15:20, commit 362fae5 lúc 15:29) — phiên đó không dọn, LOG cũng không ghi. Không phải lỗi hệ thống; không có comment/vòng PV/bài nộp/file R2 đi kèm.
- Work Done: xoá qua DELETE /api/hr/applications/[id] trên prod (200, DB không còn row). Quét applications/jobs/interview_sessions/blog_posts/comments tìm dữ liệu test khác: không còn.
- Bài học: test trên prod DB thì phải dọn ngay trong phiên + ghi LOG.
