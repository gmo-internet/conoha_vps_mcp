#!/bin/bash
# L2セマンティックルール違反検知フック（PostToolUse: Edit|Write）
# Advisory のみ — systemMessage を返却し、ブロックしない（常に exit 0）

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path')

# .ts ファイル以外は対象外
[[ "$file_path" != *.ts ]] && exit 0

violations=()

# --- ファイルカテゴリ判定 ---
is_storage_client=false
is_client=false
is_test=false
is_source=false

case "$file_path" in
	*/features/openstack/storage/*-client.ts)
		is_storage_client=true
		is_client=true
		;;
	*/features/openstack/common/*)
		# common モジュール — B-5/B-6 対象外
		;;
	*/features/openstack/*/*-client.ts)
		is_client=true
		;;
esac

[[ "$file_path" == *.test.ts ]] && is_test=true
[[ "$file_path" != *.test.ts ]] && is_source=true

# --- B-5: 非storageクライアントは executeOpenstackApi を使用すること ---
if $is_client && ! $is_storage_client; then
	if ! grep -q 'executeOpenstackApi' "$file_path"; then
		violations+=("[B-5] executeOpenstackApi() が使用されていません。非storageクライアントは executeOpenstackApi() → formatResponse() チェーンを使用してください。(harness/patterns/client-module.md)")
	fi
	if grep -q 'generateApiToken' "$file_path"; then
		violations+=("[B-5] generateApiToken() が直接使用されています。非storageクライアントは executeOpenstackApi() を使用してください。(harness/patterns/client-module.md)")
	fi
fi

# --- B-6: storageクライアントは generateApiToken を直接使用すること ---
if $is_storage_client; then
	if grep -q 'executeOpenstackApi' "$file_path"; then
		violations+=("[B-6] executeOpenstackApi() がstorageクライアントで使用されています。storageは generateApiToken() を直接使用してください。(harness/patterns/client-module.md)")
	fi
	if ! grep -q 'generateApiToken' "$file_path"; then
		violations+=("[B-6] generateApiToken() が使用されていません。storageクライアントは generateApiToken() を直接使用してください。(harness/patterns/client-module.md)")
	fi
fi

# --- E-2: モック変数は vi.mocked(await import(...)) で取得すること ---
if $is_test; then
	if grep -q 'vi\.mock(' "$file_path"; then
		if grep -qP '^const mock\w+\s*=\s*vi\.fn\(' "$file_path"; then
			violations+=("[E-2] vi.fn() がモック変数に直接代入されています。vi.mocked(await import(...)) パターンを使用してください。(harness/patterns/test-patterns.md)")
		fi
	fi
fi

# --- F-3: JSDoc は日本語で記述すること ---
if $is_source; then
	jsdoc_lines=$(grep -cP '^\s*\*\s+[^@\s]' "$file_path" 2>/dev/null || true)
	if [ "${jsdoc_lines:-0}" -gt 0 ]; then
		japanese_lines=$(grep -cP '^\s*\*.*[\p{Han}\p{Hiragana}\p{Katakana}]' "$file_path" 2>/dev/null || true)
		if [ "$japanese_lines" -eq 0 ]; then
			violations+=("[F-3] JSDocコメントに日本語が含まれていません。JSDocは日本語で記述してください。(harness/patterns/jsdoc.md)")
		fi
	fi
fi

# --- 出力 ---
if [ ${#violations[@]} -gt 0 ]; then
	warning="[L2 Semantic Check]"
	for v in "${violations[@]}"; do
		warning="$warning\n$v"
	done
	escaped=$(echo -e "$warning" | jq -Rs .)
	echo "{\"systemMessage\": ${escaped}}"
fi

exit 0
