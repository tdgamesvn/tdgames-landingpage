#!/usr/bin/env bash
# Hook PostCompact — nạp lại ảnh chụp mà ctx-precompact.sh vừa ghi ra đĩa.
#
# Bản tóm tắt sau khi nén hay giữ lại "đang bàn gì" nhưng đánh rơi "đang sửa
# file nào, dở tới đâu". Đó chính là thứ làm mất việc: agent viết tiếp như thể
# working tree sạch. Ở đây nhét thẳng danh sách file dở trở lại context.
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO" || exit 0

SID="$(cat | jq -r '.session_id // "nosid"' 2>/dev/null || echo nosid)"
SNAP=".agent/.state/$SID.precompact.md"

# Không có ảnh chụp (nén xảy ra trước khi hook kịp chạy) → dựng lại từ git,
# vẫn tốt hơn là không có gì.
if [ -f "$SNAP" ]; then
  body="$(cat "$SNAP")"
else
  body="# Trạng thái làm việc (dựng lại từ git sau khi nén)"$'\n\n'"$(git status --porcelain 2>/dev/null | head -40)"
fi

jq -n --arg c "=== TRẠNG THÁI TRƯỚC KHI NÉN CONTEXT — việc đang làm dở ===
$body

Context vừa bị nén. Trước khi viết tiếp: đối chiếu danh sách file trên với việc
sếp đang giao. File nào lạ thì \`git diff\` xem, đừng ghi đè việc đang dở." \
  '{hookSpecificOutput:{hookEventName:"PostCompact",additionalContext:$c}}'
