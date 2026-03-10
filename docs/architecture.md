# アーキテクチャ詳細

ConoHa VPS OpenStack APIへのアクセスをAIアシスタントに提供するMCPサーバー。`@modelcontextprotocol/sdk` + Zod v4 + stdio トランスポート。

## リクエストフロー

```
ツール呼び出し → src/index.ts → src/tool-routing-tables.ts → feature client → openstack-client.ts → API
※ storageのみ openstack-client.ts を経由せず generateApiToken() を直接使用
```

## MCPツール一覧（10ツール + 1プロンプト）

| ツール名 | 種別 | 概要 |
|---|---|---|
| `fetch_url` | ユーティリティ | URL取得 |
| `encode_base64` | ユーティリティ | Base64エンコード |
| `conoha_get` | ConoHa API | リソース一覧取得（GET） |
| `conoha_get_by_param` | ConoHa API | パラメータ指定で個別取得（GET） |
| `conoha_post` | ConoHa API | リソース作成（POST） |
| `conoha_post_put` | ConoHa API | ストレージ コンテナ作成・オブジェクトアップロード（PUT） |
| `conoha_post_put_by_param` | ConoHa API | リソース更新・操作（POST/PUT + パラメータ） |
| `conoha_post_by_header_param` | ConoHa API | ストレージ メタデータ設定（POST + ヘッダー） |
| `conoha_delete_by_param` | ConoHa API | リソース削除（DELETE + パラメータ） |
| `conoha_head` | ConoHa API | アカウント情報・コンテナ詳細取得（HEAD） |
| `create_server`（プロンプト） | プロンプト | サーバー作成ウィザード |

ツール説明の詳細は `src/tool-descriptions.ts` を参照。

## パス型の更新手順

新しいAPIパスを追加する場合、以下の3箇所を同時に更新する:
1. `src/types.ts` — パス型（`ConoHaGetPaths` 等）にリテラルを追加
2. `src/tool-routing-tables.ts` — ハンドラーマッピングにエントリを追加
3. `src/index.ts` — ツールの `inputSchema` にあるZodスキーマにパスを追加

## 機能モジュール（src/features/openstack/）

| モジュール | 内容 |
|---|---|
| `common/` | APIクライアント（`openstack-client.ts`）、トークン生成（`generate-api-token.ts`）、レスポンスフォーマット（`response-formatter.ts`）、エラーハンドラー |
| `compute/` | サーバー管理（作成、削除、起動、停止、リサイズ）、SSHキーペア、フレーバー |
| `volume/` | ボリューム管理（作成、削除、更新）、ボリュームタイプ |
| `image/` | イメージ一覧 |
| `network/` | セキュリティグループ、セキュリティグループルール、ポート |
| `storage/` | オブジェクトストレージ（コンテナ・オブジェクトのCRUD、メタデータ） |

## 環境変数

API認証に必要（すべて必須）:
- `OPENSTACK_TENANT_ID` - ConoHaテナントID
- `OPENSTACK_USER_ID` - ConoHaユーザーID
- `OPENSTACK_PASSWORD` - ConoHa APIパスワード

## 実装上の注意

- **認証トークン**: リクエストごとに `generateApiToken()` で取得（キャッシュなし）
- **APIリージョン**: c3j1固定（`src/features/openstack/constants.ts`）
- **パスワード要件**: 9-70文字、大小英字+数字+記号を含むこと
- **レスポンスフォーマット**: すべてのAPIレスポンスは `response-formatter.ts` で統一的にフォーマット
- **エラーハンドリング**: エラーは `error-handler.ts` でステータスコードとメッセージ付きでフォーマット
