# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY

Bản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi
`.agent/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.

---

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

## 2026-09-23 (bổ sung) — Đính chính chẩn đoán + bản vá global cho 15 dự án

**Đính chính entry ngay trên.** Tôi viết "repo chưa từng có hook nào" — SAI.
`~/.claude/settings.json` đã có `SessionStart` + `Stop` ở mức global từ trước,
trỏ vào `~/Work/control/bin/`. Lý do sếp vẫn mất context còn tệ hơn là thiếu hook:

`project-stop-reminder.sh` in bản nhắc nhở ra **stdout rồi `exit 0`**. Với Stop
hook, exit 0 nghĩa là "cho phép dừng" và stdout bị bỏ qua hoàn toàn — nhiều tháng
qua nó nhắc vào hư không. Muốn chặn thật phải trả `{"decision":"block"}` hoặc
exit 2. Nó còn dò bằng `find -newer` không loại `.next/`, nên `.next/dev/trace`
cũng bị tính là "code đã đổi" → kêu oan mỗi phiên.

Bài học: **một hook chạy mà không có hiệu lực thì tệ hơn không có hook** — nó tạo
cảm giác an toàn giả. Kiểm hook phải xem exit code và kênh output, không chỉ xem
nó có chạy không.

**Work Done.** `.agent/bin/global/` — 4 script tổng quát hoá (lấy dự án từ
`CLAUDE_PROJECT_DIR`, không có `.agent/meta` thì im lặng), state chuyển sang
`$TMPDIR/claude-ctx-state` để không phải sửa `.gitignore` của 14 repo. Kèm
`install.sh`: backup settings, chép script, vá đúng khoá `.hooks` bằng jq (giữ
nguyên cấu hình khác), rồi gỡ `.claude/settings.json` của landingpage — nếu để cả
hai bộ thì repo này in context hai lần.

**Validation.** bash -n cả 5 file; chạy thật: landingpage in context, tdgames-crm
im lặng đúng như thiết kế, Stop trả `block`, state không bẩn git.

**Result.** CHƯA CÀI. `~/.claude/settings.json` và `~/Work/control/bin/` nằm ngoài
repo nên sandbox chặn ghi — cố ý để sếp tự chạy `install.sh`, toàn quyền kiểm soát
file global. Hiện landingpage vẫn được bảo vệ bằng hook repo (commit 9094b9c);
14 dự án còn lại thì chưa.

**Next Step.** (1) Sếp chạy `bash .agent/bin/global/install.sh` nếu muốn phủ 15 dự
án. (2) Câu hỏi còn treo: sếp nói "sau khi /new thì reset và quên cũng được" —
chưa rõ /new là lệnh tạo dự án mới, `/clear`, hay ý "chốt việc cũ sang việc mới".
Nếu là ý thứ ba thì cần thêm lệnh đóng việc; chưa làm vì chưa hỏi được.
(3) `studio-facts.md` vẫn chờ sếp duyệt trước khi push.
