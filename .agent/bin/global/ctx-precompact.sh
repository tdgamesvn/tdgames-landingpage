#!/usr/bin/env bash
# Hook PreCompact — chụp lại trạng thái làm việc NGAY TRƯỚC khi context bị nén.
#
# Sếp 2026-09-23: "làm sao bạn không bị quên context KHI ĐANG LÀM". Hai hook kia
# vá chỗ nối giữa các phiên; chỗ này là lỗ hổng GIỮA phiên: khi context đầy,
# Claude Code nén hội thoại thành bản tóm tắt, và mọi chi tiết không lọt vào bản
# tóm tắt đó thì biến mất — đúng lúc đang làm dở.
#
# Cách vá: đổ trạng thái ra ĐĨA (git không quên), rồi ctx-postcompact.sh nạp lại
# ngay sau khi nén xong. Đĩa không bị nén.
set -uo pipefail

REPO="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$REPO" 2>/dev/null || exit 0
[ -d .agent/meta ] || exit 0   # dự án chưa có memory → im lặng, không phiền

STATE="${TMPDIR:-/tmp}/claude-ctx-state"
mkdir -p "$STATE"
SID="$(cat | jq -r '.session_id // "nosid"' 2>/dev/null || echo nosid)"
SNAP="$STATE/$SID.precompact.md"

{
  echo "# Ảnh chụp trước khi nén context — $(date '+%Y-%m-%d %H:%M')"
  echo
  echo "## Nhánh"
  git rev-parse --abbrev-ref HEAD 2>/dev/null
  echo
  echo "## File đang sửa dở"
  git status --porcelain 2>/dev/null | head -40
  echo
  echo "## Quy mô thay đổi"
  git diff --stat 2>/dev/null | tail -25
  echo
  echo "## Commit gần nhất"
  git log --oneline -5 2>/dev/null
} > "$SNAP"

jq -n --arg p "$SNAP" \
  '{systemMessage:("📌 Đã chụp trạng thái làm việc vào " + $p + " trước khi nén context.")}'
