# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`~/Work/control/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

## 2026-09-18 — Sửa JD Trợ Lý Dự Án (Project Assistant)

**Task:** Sếp: "Không nhất thiết Background là Artist hay Animator mà chỉ là điểm cộng
thôi. Yêu cầu bắt buộc là phải có kinh nghiệm về quản lý dự án và làm việc với khách hàng."

**Work Done:** Sửa trực tiếp DB Supabase, bảng `jobs`, slug `project-assistant`:
- `description` — bỏ câu "Vị trí dành cho ứng viên có background Artist / Animator";
  thay bằng "đã có kinh nghiệm quản lý dự án và làm việc trực tiếp với khách hàng…
  Background Artist / Animator là điểm cộng, không bắt buộc."
- `requirements` — 2 dòng đầu prefix **BẮT BUỘC**: (1) 1–2 năm quản lý/điều phối dự án
  (PA/PC/BA/Junior PM/Account Project), (2) kinh nghiệm làm việc trực tiếp với khách hàng
  (nhận yêu cầu → tổng hợp feedback → follow-up tới nghiệm thu). Gỡ dòng "Điểm cộng lớn
  nếu từng làm Game/App/IT Outsourcing" khỏi requirements (sai chỗ) → chuyển xuống nice_to_have.
- `nice_to_have` — thêm "Background Artist / Animator, hoặc hiểu quy trình sản xuất
  Art / Animation" + "Từng làm Game / App / IT Outsourcing / Creative Production".
- `skills` — `Art Pipeline` + `Animation Pipeline` gộp thành 1 tag `Art & Animation Pipeline`,
  thêm `Client Communication` (tự quyết, cho khớp trọng tâm mới — báo sếp rồi).
- `responsibilities` **giữ nguyên** (mô tả việc, không phải yêu cầu đầu vào).

**Result:** Verify `GET https://tdgamestudio.com/api/jobs` → trả đúng bản mới. JD nằm ở DB,
không ở git → không cần deploy.

**Next Step:** Chờ sếp duyệt wording; nếu muốn siết/nới thêm mức kinh nghiệm thì sửa tiếp.

## 2026-09-23 — Vá chống-mất-context bằng hook + chốt việc blog dở

**Task:** Sếp hỏi "sao blog radar vẫn gọi được cliproxyapi", rồi "sửa thế nào để
không quên context khi đang làm". Phiên này trả lời cả hai.

**Chẩn đoán.** Radar gọi được vì workflow ssh vào VPS chạy node ở đó (VPS trong
tailnet, tới được cliproxyapi trên Mac sếp); GitHub runner thì không. Radar chỉ
chọn chủ đề — bài do `blog-auto.mjs` dựng. Chuyện mất context có 3 gốc rễ:
repo KHÔNG có `.claude/settings.json` nên chưa từng có hook nào (dù `~/Work/CLAUDE.md`
mô tả là có Stop hook); LOG.md phình 318 KB nên chỉ đọc nổi cái đuôi; và phiên
trước kết thúc không commit, để 3 file blog treo lơ lửng không ai biết.

**Work Done — 4 hook, script ở `.agent/bin/` (không để `.claude/hooks/`, thư mục đó bị chặn ghi):**
- `ctx-session-start.sh` — đầu phiên in 2 entry cuối LOG + `git status` + Doing.
  Ghim hash LOG.md làm mốc. Sinh luôn `RECENT.md` như bản dẫn xuất — file đó
  trước là chép tay và đã đứng im 09/09→18/09, giờ không ai chép tay nữa.
- `ctx-stop.sh` — CHẶN kết phiên nếu code đổi mà LOG.md không đổi (so hash với
  mốc đầu phiên, không so HEAD: LOG có thể bẩn sẵn từ phiên trước). Cờ
  `stop_hook_active` chống lặp vô hạn, chặn đúng một lần.
- `ctx-precompact.sh` / `ctx-postcompact.sh` — đổ trạng thái ra đĩa trước khi nén
  context rồi nạp lại sau. Đây là chỗ "quên khi đang làm" mà 2 hook kia không đỡ.
- Cả 4 pipe-test bằng payload giả, 3 nhánh logic của Stop đều đúng.

**Cũng trong commit này:** việc blog dở của phiên 23/09 trước đó — `studio-facts.md`
(kho sự thật cho AI trích, chống bài auto nhạt) + radar đọc 80 tiêu đề đã đăng +
route nạp 60 tiêu đề/excerpt chống trùng góc bài.

**Result:** Đã commit, CHƯA push. Hook chỉ sống sau khi Claude Code nạp lại config
(mở `/hooks` hoặc khởi động lại phiên).

**Next Step:** Sếp đọc `src/content/studio-facts.md` trước khi push — sai một con
số ở đó là sai hàng loạt bài blog về sau. Duyệt xong thì `git push origin main`.
