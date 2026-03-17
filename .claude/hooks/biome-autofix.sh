#!/bin/bash
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path')

# .ts/.json ファイルのみ対象
if [[ "$file_path" == *.ts ]] || [[ "$file_path" == *.json ]]; then
  cd "$CLAUDE_PROJECT_DIR" || exit 0
  npx biome check --fix --unsafe "$file_path" 2>/dev/null || true
fi
