# CODING_PATTERN.md

本プロジェクト（ConoHa VPS MCPサーバー）のコーディングパターンを定義する。
新機能追加・リファクタリング時は本ドキュメントに準拠すること。

各パターンの詳細は `harness/patterns/` 配下のファイルを参照。

---

## パターン一覧

| # | パターン | ファイル | 執行レベル | 関連ルール |
|---|---------|---------|-----------|-----------|
| 1 | [ファイル構成パターン](harness/patterns/file-structure.md) | `file-structure.md` | L4 | A-2, A-3, H-1 |
| 2 | [クライアントモジュールパターン](harness/patterns/client-module.md) | `client-module.md` | L2 | B-1〜B-6 |
| 3 | [スキーマパターン](harness/patterns/schema.md) | `schema.md` | L4 | C-1〜C-4 |
| 4 | [レスポンスフォーマッターパターン](harness/patterns/response-formatter.md) | `response-formatter.md` | L2 | D-1〜D-5 |
| 5 | [型定義パターン](harness/patterns/type-definitions.md) | `type-definitions.md` | L2 | — |
| 6 | [ルーティングテーブルパターン](harness/patterns/routing-tables.md) | `routing-tables.md` | L2 | — |
| 7 | [テストパターン](harness/patterns/test-patterns.md) | `test-patterns.md` | L4 | E-1〜E-6, G-4 |
| 8 | [命名規則](harness/patterns/naming-conventions.md) | `naming-conventions.md` | L4 | H-1〜H-4 |
| 9 | [JSDocパターン](harness/patterns/jsdoc.md) | `jsdoc.md` | L4 | F-1〜F-3 |
| 10 | [エラーハンドリングパターン](harness/patterns/error-handling.md) | `error-handling.md` | L2 | — |
| 11 | [ツール登録パターン](harness/patterns/tool-registration.md) | `tool-registration.md` | L2 | — |
| 12 | [パス追加手順](harness/patterns/path-addition.md) | `path-addition.md` | L2 | — |
| 13 | [インポートルール](harness/patterns/import-rules.md) | `import-rules.md` | L4 | G-1〜G-4 |
| 14 | [Biome / フォーマッティングルール](harness/patterns/biome-rules.md) | `biome-rules.md` | L3 | — |

---

## 執行レベル

| レベル | メカニズム | 詳細 |
|--------|-----------|------|
| L1 | ドキュメント | `harness/patterns/` に記述のみ |
| L2 | AIスキルチェック | `coding-pattern-check` スキルで検出 |
| L3 | CIルール | Biome等で自動検出 |
| L4 | 構造テスト | `src/architecture.test.ts` で検証 |

詳細は [harness/ESCALATION.md](harness/ESCALATION.md) を参照。

---

## 関連ドキュメント

- [エスカレーションラダー](harness/ESCALATION.md) — パターン執行の4段階モデル
- [知見決定記録 (KDR)](harness/decisions/) — パターン導入・変更の経緯
- [チェックリスト](skills/coding-pattern-check/references/checklist.md) — スキルチェック用の構造化一覧
