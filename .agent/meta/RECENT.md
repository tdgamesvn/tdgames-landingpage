# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-11-05 — Dọn việc treo: company-profile WIP, build tự thử lại, file meta
- Sếp "cho bạn tự quyết". (1) `company-profile/page.tsx` WIP không rõ nguồn (xoá Selected work + case study ORCA, thay media 4 thẻ service bằng minh hoạ CSS chưa gắn, lỗi tsc từ 03/11 → mọi push phải --no-verify): backup `.superpowers/wip/company-profile-2026-11-wip.patch` + `company-profile-page.wip.tsx`, `git restore` về bản prod. Chỉ sửa lưới Selected work: bỏ Axie/Summoner Era/Reaper/Animation Contest (founder ở công ty cũ) → 8 dự án studio (Monster Legends, Yomi 2, Epic Card, Horse Racing, Mytheria, Boss, Stickman, Kayn), chip = mảng công việc (khách phần lớn không nêu tên), ảnh = ảnh bìa DB. Giữ ORCA + media service như cũ (ORCA vẫn nền summonerDetail.png).
- `src/lib/project-covers.ts` (projectCovers(slugs)) dùng chung cho trang chủ + company-profile.
- `.github/workflows/deploy.yml`: `npm run build` lỗi → chờ 15s build lại 1 lần (lỗi next/font Google trên VPS lặp 3 lần) — thay vì tự host font (đụng nhiều file).
- Commit luôn 5 file meta tồn từ phiên trước (DECISIONS/SCHEMA mục ứng viên trùng 03/11 — SCHEMA sửa "CHƯA áp prod" → đã áp; AGENTS/CLAUDE số liệu GitNexus; RECENT).
- Result: tsc TOÀN dự án 0 lỗi (hết phải --no-verify); dev: /company-profile 8 ảnh bìa DB, trang chủ 8 ảnh bìa như cũ.
- 2026-11-05 (sếp chọn 1): ORCA đang làm, NDA → mục case study /company-profile ẩn tên: "Case study — Unannounced mobile RPG (under NDA)", tiêu đề "Hero roster, art and animation", giữ mô tả + 3 số liệu; bỏ ảnh nền summonerDetail.png → gradient. HTML không còn chữ ORCA. (Memory orca-nda.)

## 2026-11-05 — Thiết kế chat trên website (brainstorming)
- Sếp muốn chat trên web cho khách (hỏi dịch vụ → sếp trả lời) + ứng viên (hỏi job → HR trả lời), trả lời trên điện thoại qua PWA.
- Chốt: tab "Chat" riêng trong /hr (không lẫn pipeline), mỗi người 1 luồng (mã khách lưu trình duyệt, link email để quay lại), nút câu hỏi có sẵn kiểu Facebook, AI tự trả lời để SAU CÙNG (giai đoạn 1 tắt hẳn, chừa chỗ bật 24/7), giờ trực 8–22h VN mọi ngày, ngoài giờ bắt buộc email, trong giờ email tuỳ chọn, trả lời lúc khách đã rời → gửi email.
- Mockup `.superpowers/mockups/chat-widget.png` + `chat-inbox.png` (đã gửi Telegram). Spec `docs/superpowers/specs/2026-11-05-website-chat-design.md`, builder check xong (4 câu tự trả lời theo quyết định cũ: mail ứng viên từ hiring@, theo HR_EMAIL_MODE; lead CRM chỉ khi có email; giữ dữ liệu 24 tháng + dòng Privacy).
- Next: chờ sếp duyệt spec → writing-plans → làm.
