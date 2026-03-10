#!/bin/bash
input=$(cat)
cmd=$(echo "$input" | jq -r '.tool_input.command')

# 危険パターン検出
if echo "$cmd" | grep -qE '(rm\s+-rf\s+/|git\s+push\s+--force|git\s+reset\s+--hard|git\s+clean\s+-fd)'; then
  echo "危険なコマンドが検出されました: $cmd" >&2
  exit 2
fi
exit 0
