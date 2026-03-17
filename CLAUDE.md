# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

- `npm run build` - プロダクションビルド
- `npm run typecheck` - 型チェック
- `npm run biome:ci` - フォーマット/リンティング
- `npm run biome:fix` - Biome自動修正
- `npm test` - テスト実行（カバレッジ付き）
- `npm test -- <filename>` - 特定テスト実行

その他: `npm run dev`（開発サーバー）, `npm run inspector`（MCPインスペクター）, `npm run generate:notice`（NOTICE生成）, `npm run docs:build`（APIドキュメント生成）

## アーキテクチャ

ConoHa VPS OpenStack APIへのアクセスをAIアシスタントに提供するMCPサーバー。

```
ツール呼び出し → src/index.ts → src/tool-routing-tables.ts → feature client → openstack-client.ts → API
※ storageのみ openstack-client.ts を経由せず generateApiToken() を直接使用
```

詳細（ツール一覧・モジュール構成・環境変数・実装注意事項）は `docs/architecture.md` を参照。

### ハーネスフレームワーク
- `harness/ESCALATION.md` — パターン執行の4段階モデル（L1〜L4）
- `harness/patterns/` — 16のパターンファイル（taste-invariants.md 含む）
- `harness/decisions/` — 知見決定記録（KDR）
- `src/architecture.test.ts` — L4構造テスト（`npm test` で実行）

## 規約

### コミット・PR
- Conventional Commits 必須（例: `feat:`, `fix:`, `docs:`, `test:`, `chore:`）
- PRチェックリスト: CI通過、NOTICE更新（`npm run generate:notice`）、リリース時はバージョン更新（`package.json` + `manifest.json`）

### コードスタイル
- Biome: タブインデント、ダブルクォート、インポート整理有効（詳細: `harness/patterns/biome-rules.md`）
- ESM only、Node.js >= 22.0.0

### テスト
- ソースファイルと同じディレクトリに配置（`*.test.ts`）
- テスト記述（`describe` / `it`）は日本語の詳細な1文で記述
- 詳細: `harness/patterns/test-patterns.md`

### パス型の更新手順
詳細: `harness/patterns/path-addition.md`

### コーディングパターン（必須）
以下のL2セマンティックルールはCLAUDE.mdとClaude Code Review CIで執行。コード生成時に必ず従うこと。
詳細は各パターンファイルを参照:

| ID | ルール概要 | 参照 |
|----|-----------|------|
| B-5 | 非storageクライアントは `executeOpenstackApi()` → `formatResponse()` チェーン | `harness/patterns/client-module.md` |
| B-6 | storageクライアントは `generateApiToken()` を直接使用 | `harness/patterns/client-module.md` |
| E-2 | モック戻り値設定は `vi.mocked(await import(...))` パターン | `harness/patterns/test-patterns.md` |
| F-3 | JSDocコメントは日本語で記述 | `harness/patterns/jsdoc.md` |
