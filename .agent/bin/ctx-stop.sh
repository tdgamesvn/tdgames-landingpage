#!/usr/bin/env bash
# Hook Stop — CHẶN kết phiên nếu có code đổi mà LOG.md không được ghi.
#
# `~/Work/CLAUDE.md` từ lâu đã viết "Stop hook sẽ nhắc nếu code đổi mà memory
# không đổi". Thực tế repo này CHƯA HỀ CÓ hook nào — không có cả .claude/settings.json.
# Và nhắc suông thì cũng vô dụng: agent đọc xong rồi vẫn dừng. Nên hook này CHẶN.
#
# Cách nhận biết "có ghi log chưa": so hash LOG.md bây giờ với hash lúc mở phiên
# (do ctx-session-start.sh ghim). Không so với git HEAD — LOG.md có thể đã bẩn
# sẵn từ phiên trước, so với HEAD sẽ báo "đã ghi" trong khi phiên này chưa ghi gì.
#
# Chống lặp vô hạn: Claude Code đưa `stop_hook_active: true` khi nó đang chạy
# tiếp VÌ hook này vừa chặn. Thấy cờ đó thì cho qua — chặn đúng một lần.
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO" || exit 0

LOG=".agent/meta/LOG.md"
STATE=".agent/.state"

input="$(cat)"
[ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0
SID="$(printf '%s' "$input" | jq -r '.session_id // "nosid"')"

# Code có đổi không? Bỏ qua chính thư mục memory — sửa LOG không tính là "làm việc".
code="$(git status --porcelain -- . ':(exclude).agent/meta' ':(exclude).agent/.state' 2>/dev/null)"
[ -z "$code" ] && exit 0

# Phiên này có ghi LOG không?
before="$(cat "$STATE/$SID.loghash" 2>/dev/null || true)"
now="$(shasum -a 1 "$LOG" 2>/dev/null | cut -d' ' -f1)"
# Không có mốc đầu phiên (hook mới bật giữa chừng) → không chặn, tránh báo oan.
[ -z "$before" ] && exit 0
[ "$before" != "$now" ] && exit 0

files="$(printf '%s' "$code" | head -12)"
reason="CHƯA GHI LOG — không được dừng ở đây.

Phiên này có thay đổi code nhưng .agent/meta/LOG.md không hề được sửa:

$files

Đây đúng là lỗi đã làm mất context ngày 19–22/09 và khiến sếp phải tự nhắc
lại việc blog radar. Làm nốt trước khi dừng:

1. Append vào .agent/meta/LOG.md một entry '## <ngày> — <việc>' gồm:
   Task / Work Done / Result / Next Step. Ghi cả thứ CHƯA xong và lý do.
2. Cập nhật .agent/meta/TASKS.md nếu task đổi trạng thái.
3. Có quyết định kỹ thuật lâu dài thì ghi .agent/meta/DECISIONS.md.

Ghi xong thì dừng bình thường — hook chỉ chặn một lần, không lặp."

jq -n --arg r "$reason" '{decision:"block", reason:$r}'
