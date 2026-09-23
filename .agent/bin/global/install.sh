#!/usr/bin/env bash
# Cài 4 hook chống-mất-context ở mức GLOBAL — áp cho mọi dự án trong ~/Work/apps
# có thư mục .agent/meta. Dự án không có .agent/meta thì hook tự im lặng.
#
# Vì sao cần bản global: hook đặt trong .claude/settings.json của một repo chỉ
# bảo vệ đúng repo đó. Sếp có 15 dự án.
#
# Việc script này làm, theo thứ tự:
#   1. Backup ~/.claude/settings.json
#   2. Chép ctx-*.sh vào ~/Work/control/bin/
#   3. Ghi đè mục .hooks trong ~/.claude/settings.json thành 4 hook mới
#      (thay luôn project-context.sh + project-stop-reminder.sh cũ)
#   4. Gỡ .claude/settings.json của repo landingpage — nếu để lại, repo đó sẽ
#      chạy cả hai bộ và in context ra hai lần.
#
# Chạy lại nhiều lần được, không hỏng thêm.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN="${HOME}/Work/control/bin"
SETTINGS="${HOME}/.claude/settings.json"
REPO_SETTINGS="${HOME}/Work/apps/tdgames-landingpage/.claude/settings.json"

command -v jq >/dev/null || { echo "✗ cần jq. Cài: brew install jq" >&2; exit 1; }
[ -d "$BIN" ] || { echo "✗ không thấy $BIN" >&2; exit 1; }

# --- 1. Backup -------------------------------------------------------------
if [ -f "$SETTINGS" ]; then
  BAK="${SETTINGS}.bak.$(date +%Y%m%d-%H%M%S)"
  cp "$SETTINGS" "$BAK"
  echo "✓ Đã backup settings cũ → $BAK"
else
  mkdir -p "$(dirname "$SETTINGS")"
  echo '{}' > "$SETTINGS"
  echo "✓ Chưa có settings.json, tạo mới"
fi

# --- 2. Chép script --------------------------------------------------------
for f in ctx-session-start ctx-stop ctx-precompact ctx-postcompact; do
  cp "$SRC/$f.sh" "$BIN/$f.sh"
  chmod +x "$BIN/$f.sh"
  echo "✓ $BIN/$f.sh"
done

# --- 3. Vá settings.json ---------------------------------------------------
# Chỉ đụng khoá .hooks, mọi cấu hình khác của sếp giữ nguyên.
tmp="$(mktemp)"
jq '.hooks = {
  "SessionStart": [{"hooks":[{"type":"command","command":"$HOME/Work/control/bin/ctx-session-start.sh","timeout":15,"statusMessage":"Nạp context phiên trước..."}]}],
  "Stop":         [{"hooks":[{"type":"command","command":"$HOME/Work/control/bin/ctx-stop.sh","timeout":15}]}],
  "PreCompact":   [{"hooks":[{"type":"command","command":"$HOME/Work/control/bin/ctx-precompact.sh","timeout":15}]}],
  "PostCompact":  [{"hooks":[{"type":"command","command":"$HOME/Work/control/bin/ctx-postcompact.sh","timeout":15}]}]
}' "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"
echo "✓ Đã vá .hooks trong $SETTINGS (4 hook)"

# --- 4. Gỡ hook repo để khỏi chạy đôi --------------------------------------
if [ -f "$REPO_SETTINGS" ]; then
  rm "$REPO_SETTINGS"
  echo "✓ Đã gỡ hook riêng của tdgames-landingpage (nếu giữ lại sẽ in context 2 lần)"
  echo "  → nhớ commit: git -C ~/Work/apps/tdgames-landingpage commit -am 'chore: chuyển hook sang global'"
fi

cat <<'DONE'

────────────────────────────────────────────────────────────
Xong. Hook chỉ có hiệu lực ở PHIÊN MỚI — terminal nào đang mở
sẵn thì khởi động lại, hoặc gõ /hooks để nạp lại cấu hình.

Kiểm chứng: mở phiên mới trong bất kỳ dự án nào có .agent/meta,
sếp sẽ thấy block context tự in ra ở đầu phiên.

Muốn quay lại như cũ: cp <file .bak vừa in ở trên> ~/.claude/settings.json
────────────────────────────────────────────────────────────
DONE
