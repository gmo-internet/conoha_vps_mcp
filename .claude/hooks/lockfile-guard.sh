#!/bin/bash
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path')

if [[ "$file_path" == */package-lock.json ]]; then
  echo "package-lock.json は直接編集できません。npm install を使用してください。" >&2
  exit 2
fi
exit 0
