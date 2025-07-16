# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code)への指針を提供します。

## 必須コマンド

### 開発
- `npm run dev` - tsxを使用して開発サーバーを起動
- `npm run build` - esbuildを使用してプロダクションバンドルをビルド
- `npm run build:types` - TypeScript宣言ファイルを生成
- `npm start` - ビルドされたアプリケーションを実行

### 品質保証
- `npm run typecheck` - ファイルを出力せずに型チェックを実行
- `npm run biome:ci` - BiomeのCIチェック（フォーマット/リンティング）を実行
- `npm run biome:fix` - Biomeの問題を自動修正
- `npm test` - Vitestを使用してカバレッジ付きでテストを実行

### MCP開発
- `npm run dev:inspector` - デバッグ用のMCPインスペクターを起動（エイリアス: `npm run inspector`）
- `npm run start:inspector` - ビルドされたコードでMCPインスペクターを起動

### その他のコマンド
- `npm run commit` - commitizenを使用してconventional commitsを作成
- `npm test -- <filename>` - 特定のテストファイルを実行（例: `npm test -- compute-client.test.ts`）

## アーキテクチャ概要

これは、AIアシスタントにConoHa VPS OpenStack APIへのアクセスを提供する**Model Context Protocol (MCP)サーバー**です。サーバーは機能ベースの組織化によるクリーンアーキテクチャに従っています。

### コア構造
- **MCPサーバー**: `@modelcontextprotocol/sdk`を使用して構築、`src/index.ts`でツールとプロンプトを登録
- **OpenStack統合**: 異なるOpenStackサービス用のモジュラークライアント
- **機能別組織化**: 各OpenStackサービスは`src/features/openstack/`下に独自のディレクトリを持つ

### 主要コンポーネント

#### MCPツール (src/index.ts)
- `conoha_get` - OpenStack APIへのGETリクエスト
- `conoha_get_by_param` - パスパラメータ付きGETリクエスト
- `conoha_post` - リソース作成用のPOSTリクエスト
- `conoha_post_put_by_param` - パラメータ付きPOST/PUTリクエスト
- `conoha_delete_by_param` - パラメータ付きDELETEリクエスト

#### ツールルーティングパターン
- ツールは`tool-routing-tables.ts`を介してハンドラーにマッピングされる
- 各ツールパスは特定のハンドラー関数に対応
- すべてのツール説明は日本語（`tool-descriptions.ts`を参照）

#### OpenStackサービス (src/features/openstack/)
- **compute/** - サーバー管理（作成、削除、起動、停止、リサイズ）
- **volume/** - ボリューム管理（作成、削除、更新）
- **image/** - イメージ一覧
- **network/** - セキュリティグループ、ポート、ネットワーキング
- **common/** - 共有ユーティリティ（APIクライアント、トークン生成、レスポンスフォーマット）

#### 認証
- OpenStackトークンベース認証を使用
- トークンは`common/generate-api-token.ts`の`generateApiToken()`で生成
- 必要な環境変数: ConoHa API認証情報

### 設定
- **TypeScript**: 厳密な型チェックが有効
- **Biome**: タブ、ダブルクォートでのコードフォーマット
- **Vitest**: カバレッジレポート付きテストフレームワーク
- **esbuild**: プロダクション用の高速バンドリング

### 環境変数
API認証に必要:
- `OPENSTACK_TENANT_ID` - ConoHaテナントID
- `OPENSTACK_USER_ID` - ConoHaユーザーID  
- `OPENSTACK_PASSWORD` - ConoHa APIパスワード

### APIスキーマ検証
- 各サービスでのリクエスト/レスポンス検証用Zodスキーマ
- 異なるリクエストタイプ用の判別共用体
- コードベース全体での強い型付け

## 開発ノート

### 環境セットアップ
環境変数として設定されたConoHa VPS API認証情報が必要です。詳細は`docs/`のセットアップドキュメントを参照してください。

### テスト
- ソースファイルと同じ場所にあるユニットテスト (*.test.ts)
- `reports/coverage/`に生成されるカバレッジレポート
- カスタムレポーターで生成されるCSVテストレポート
- テストには日本語と英語の両方の説明を含めるべき
- メインインデックスファイルにはモックテストを使用

### コードスタイル
- 一貫したフォーマットとリンティングのためにBiomeを使用
- タブインデント、文字列にはダブルクォート
- インポート整理が有効
- テストファイルに対するいくつかの例外を除く厳格なリンティングルール

### 実装ノート
- **パスワード要件**: サーバーパスワードは9-70文字で、大文字、小文字、数字、記号を含む必要がある
- **APIリージョン**: すべてのエンドポイントは`constants.ts`でConoHaのc3j1リージョンにハードコードされている
- **レスポンスフォーマット**: すべてのAPIレスポンスは`format-response.ts`を通じて一貫してフォーマットされる
- **エラーハンドリング**: エラーは適切なステータスコードとメッセージでキャッチされフォーマットされる

## ツール使用例

### GET操作
```
conoha_get with path "/servers" - すべてのサーバーを一覧表示
conoha_get_by_param with path "/servers/{id}" - 特定のサーバーの詳細を取得
```

### CREATE操作
```
conoha_post with path "/servers" - 新しいサーバーを作成
conoha_post with path "/volumes" - 新しいボリュームを作成
```

### UPDATE/ACTION操作
```
conoha_post_put_by_param with path "/servers/{id}/action" - サーバーの起動/停止/リサイズ
conoha_post_put_by_param with path "/volumes/{id}" - ボリュームプロパティの更新
```

### DELETE操作
```
conoha_delete_by_param with path "/servers/{id}" - サーバーを削除
conoha_delete_by_param with path "/volumes/{id}" - ボリュームを削除
```
