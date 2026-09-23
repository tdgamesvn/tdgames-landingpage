#!/usr/bin/env bash
# Hook SessionStart — nạp context phiên trước vào đầu mỗi phiên Claude.
#
# Lý do tồn tại (2026-09-23): LOG.md đã phình 318 KB / 5500 dòng. Agent chỉ
# `tail` được cái đuôi, và nếu phiên trước quên ghi thì phiên sau mù hoàn toàn.
# Ngày 23/09 sếp phải tự nhắc "blog radar" thì agent mới biết có 3 file đang sửa
# dở trong working tree.
#
# Hook này in ra 3 thứ, không phụ thuộc vào việc ai đó có nhớ ghi hay không:
#   1. 2 entry cuối của LOG.md   (trích thẳng, không qua file trung gian)
#   2. working tree đang dở gì   (git status — nguồn sự thật, không nói dối)
#   3. task đang Doing            (TASKS.md)
#
# Đồng thời ghi RECENT.md như bản dẫn xuất để người đọc được bằng mắt. RECENT.md
# CŨ là file chép tay và đã đứng im từ 09/09 trong khi LOG chạy tới 18/09 —
# nên giờ nó được sinh tự động, không ai chép tay nữa.
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO" || exit 0

LOG=".agent/meta/LOG.md"
TASKS=".agent/meta/TASKS.md"
RECENT=".agent/meta/RECENT.md"
STATE=".agent/.state"
mkdir -p "$STATE"

# Ghim hash LOG.md lúc mở phiên. Hook Stop so lại hash này để biết phiên VỪA RỒI
# có ghi log hay không. Không dùng `git status` cho việc đó được: LOG.md có thể
# đã bẩn sẵn từ phiên trước, so với HEAD sẽ ra kết quả sai.
SID="$(cat | jq -r '.session_id // "nosid"' 2>/dev/null || echo nosid)"
[ -f "$LOG" ] && shasum -a 1 "$LOG" | cut -d' ' -f1 > "$STATE/$SID.loghash"

out=""
add() { out+="$1"$'\n'; }

# ---- 1. Hai entry cuối của LOG -------------------------------------------
recent=""
if [ -f "$LOG" ]; then
  start="$(grep -n '^## ' "$LOG" | tail -2 | head -1 | cut -d: -f1)"
  [ -n "$start" ] && recent="$(tail -n "+$start" "$LOG" | head -180)"
fi
if [ -n "$recent" ]; then
  add "=== 2 ENTRY CUỐI CỦA LOG.md ==="
  add "$recent"
  printf '# RECENT.md — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY\n\nBản trích 2 entry cuối của LOG.md, ghi lại mỗi lần mở phiên bởi\n`.agent/bin/ctx-session-start.sh`. Muốn sửa nội dung thì sửa LOG.md.\n\n---\n\n%s\n' "$recent" > "$RECENT"
fi

# ---- 2. Việc còn dở (nguồn sự thật, không phụ thuộc trí nhớ ai) ----------
dirty="$(git status --porcelain 2>/dev/null | head -30)"
if [ -n "$dirty" ]; then
  add ""
  add "=== ⚠️ WORKING TREE CÒN DỞ — ĐỌC TRƯỚC KHI LÀM VIỆC MỚI ==="
  add "$dirty"
  add ""
  add "Đây gần như luôn là việc phiên trước làm dở. TRƯỚC KHI nhận việc mới:"
  add "chạy \`git diff\` trên mấy file này để biết phiên trước đang làm gì,"
  add "rồi báo sếp. Đừng bỏ qua rồi để sếp phải tự nhắc."
fi

# ---- 3. Task đang Doing ---------------------------------------------------
if [ -f "$TASKS" ]; then
  doing="$(grep -n -A 12 -i '^#\+ *Doing' "$TASKS" | head -14)"
  if [ -n "$doing" ]; then
    add ""
    add "=== TASKS.md — mục Doing ==="
    add "$doing"
  fi
fi

[ -z "$out" ] && exit 0
jq -n --arg c "$out" \
  '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$c}}'
