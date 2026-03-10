---
name: conoha-vps-mcp-test
description: ConoHa VPS MCPサーバーの動作確認テストを自動実行するスキル。
  「ConoHa テスト」「MCP動作確認」「動作検証」「conoha-test」「MCPテスト」
  「VPSテスト」「検証項目」などのキーワードで発動する。
---

# ConoHa VPS MCP 動作確認テストスキル

## 概要

ConoHa VPS MCPサーバーの全機能（37項目）を一括テストし、結果をMarkdownレポートとして出力する。

## 前提条件

- ConoHa VPS MCP サーバーが接続済みであること
- MCP ツール（`conoha_get`, `conoha_post`, `conoha_post_put`, `conoha_post_put_by_param`, `conoha_post_by_header_param`, `conoha_get_by_param`, `conoha_delete_by_param`, `conoha_head`, `encode_base64`, `fetch_url`）が利用可能であること

## テスト用リソース準備

テスト開始前に以下を実行する:

1. **SSHキー生成**（Group M, N で使用）:
   ```bash
   ssh-keygen -t ed25519 -f /tmp/test_ssh_key -N ""
   ```

2. **テスト用HTMLファイル作成**（Group S で使用）:
   ```bash
   cat > /tmp/test_index.html << 'EOF'
   <!DOCTYPE html>
   <html><head><title>Test</title></head>
   <body><h1>ConoHa MCP Test Page</h1></body></html>
   EOF
   ```

## 実行ルール

### グループ実行順序

Group A → B → C → D → E → F → G → H → I → J → K → L → M → N → O → P → Q → R → S の順に実行する。

### 共通パラメータ

- **パスワード**: `vG7#kLp9zX!q`
- **ネームタグ**: `test`
- **セキュリティグループ**: `default`（基本）

### 状態遷移の待機

サーバーの状態遷移が必要な場合（起動/停止/リサイズ等）は、`conoha_get` で `path="/servers/detail"` を呼び出してステータスを確認し、目的の状態になるまで待機する。

- ACTIVE: 起動完了
- SHUTOFF: 停止完了
- VERIFY_RESIZE: リサイズ確認待ち
- BUILD: 構築中（待機が必要）

### クリーンアップ

各グループ完了後、作成したリソースを必ず削除する:
- サーバー削除 → ボリューム削除 の順序で実行
- セキュリティグループは最後に削除
- SSHキーペアは使用後に削除

### 異常系テストの確認方法

異常系テスト（No.24〜No.30）では、MCPツール呼び出し**前**にバリデーションで拒否されることを確認する。実際にAPIが呼ばれてエラーになるのではなく、ツール側でバリデーションエラーとなることが期待される。

### Prompt実行テスト（No.21, No.30）— スキップ禁止

`create_server` はMCPプロンプトであり、MCPツールとして直接呼び出すことはできない。
しかし、プロンプトの実質的な動作はMCPツールで代替検証できるため、**これらのテストをスキップしてはならない**。

- **No.21（正常系）**: `create_server` プロンプトはサーバー作成をMCPツールで行うよう指示するものである。
  そのため、No.1と同じ手順（`conoha_get` でフレーバー・イメージ・ボリュームタイプ取得 → `conoha_post` でボリューム作成 → `conoha_post` path=`/servers` でサーバー作成）を
  `adminPass=vG7#kLp9zX!q`、Ubuntu 24.04、メモリ1GB、サーバー名 `test` で実行し、サーバーがACTIVEになることを確認する。
- **No.30（異常系）**: `create_server` プロンプトの `rootPassword` バリデーションは `conoha_post` path=`/servers` の `adminPass` バリデーションと同一の正規表現を使用している。
  そのため、`conoha_post` path=`/servers` でサーバー作成を試み、`adminPass=aaa` を指定してバリデーションエラーになることを確認する。
  No.24と同様にMCPツール呼び出し前のバリデーション拒否を確認すればよい。

## 結果記録

各テスト実行後、`references/report-template.md` のフォーマットに基づき結果を記録する。

## 実行ログ記録

各MCPツール呼び出しの後、以下の情報をログに記録する:

- **ツール名**: 呼び出したMCPツール（例: `conoha_get`）
- **パラメータ**: ツールに渡した全パラメータ（path, param, bodyなど）
- **レスポンス**: ツールから返されたレスポンス内容（JSON）

ログは `references/report-log-template.md` のフォーマットに基づき、グループ・テストNo.・ステップごとに時系列で記録する。

## 出力

テスト結果は以下のパスに出力する:

- 結果レポート: `./test-results/YYYY-MM-DD_HH-MM.md`
- 実行ログ: `./test-results/YYYY-MM-DD_HH-MM_log.md`

（YYYY-MM-DD_HH-MM はテスト実行開始時の日時）

## リファレンス

- [テストケース詳細](references/test-cases.md) - 全37テストケースの定義
- [グループ定義](references/test-groups.md) - 19グループの実行順序・依存関係
- [レポートテンプレート](references/report-template.md) - 結果レポートのフォーマット
- [実行ログテンプレート](references/report-log-template.md) - 実行ログのフォーマット
