#!/bin/bash
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path')

# ハーネスファイルへの編集を検出して警告（ブロックはしない）
case "$file_path" in
  */harness/ESCALATION.md|*/harness/patterns/*|*/harness/decisions/*)
    echo '{"systemMessage":"[Harness Guard] ハーネスファイルを編集中です。KDR作成が必要な場合があります。"}'
    ;;
  */src/architecture.test.ts)
    echo '{"systemMessage":"[Harness Guard] L4構造テストを編集中です。ESCALATION.mdの対応表も確認してください。"}'
    ;;
esac
exit 0
