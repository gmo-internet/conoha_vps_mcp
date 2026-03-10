# 開発者ガイド — ハーネスエンジニアリング施策

本プロジェクトでは **ハーネスエンジニアリング** の考え方を採用し、AIコーディングエージェントの出力品質を構造的に担保している。
ドキュメント → AIスキル → CI → テストの4段階で段階的にルールを執行し、品質の「手綱（harness）」を握る。

---

## 1. エスカレーションラダー（4段階モデル）

違反の頻度・検出可能性に応じて執行レベルを段階的に引き上げる。

- **L1 — ドキュメント**: パターン定義のみ。すべてのルールの出発点
  - `harness/patterns/*.md`（14ファイル）に記述
- **L2 — AIセマンティックチェック**: 機械的チェック不可のセマンティックルール（8ルール）
  - `CLAUDE.md` に明記 → 開発時にClaude Codeが自動的に遵守（予防）
  - `claude-code-review.yml` → PR時にClaudeが自動検知（検知）
  - `coding-pattern-check` スキル → 手動でも実行可能
- **L3 — CIルール**: 3回以上検出され自動検出可能なルールを昇格
  - Biome（`useImportType`, `useNodejsImportProtocol` 含む） / dependency-cruiser / knip / jscpd / npm audit / actionlint / Stryker
- **L4 — 構造テスト**: アーキテクチャ不変条件を自動テストで保証
  - `src/architecture.test.ts`（Vitest）で22ルールを検証

**ルール体系**: 12カテゴリ・44ルール

| カテゴリ | 内容 | ルール数 |
|---------|------|---------|
| A | ファイル構造 | 3 |
| B | クライアントモジュール | 6 |
| C | スキーマ | 4 |
| D | レスポンスフォーマッター | 5 |
| E | テストファイル | 6 |
| F | JSDoc | 3 |
| G | インポートルール | 4 |
| H | 命名規約 | 4 |
| I | アーキテクチャ境界 | 3 |
| J | コード衛生 | 2 |
| K | セキュリティ・品質 | 3 |

詳細: `harness/ESCALATION.md`

---

## 2. パターンドキュメント

### harness/patterns/（14ファイル）

各ファイルは YAML frontmatter（`id`, `title`, `enforcement-level`, `related-rules`, `checked-by`）で管理。

- `file-structure.md` — ディレクトリ構成、テストファイル配置ルール
- `client-module.md` — `executeOpenstackApi()` → `formatResponse()` チェーンパターン
- `schema.md` — Zod v4 スキーマ定義（`.strict()` 必須、`.describe()` 日本語）
- `response-formatter.md` — レスポンスフォーマッター実装パターン
- `type-definitions.md` — パス型・共通型の定義規約
- `routing-tables.md` — `Record<PathType, Handler>` 構造のルーティング定義
- `test-patterns.md` — Vitest テスト構造（vi.mock / vi.mocked / beforeEach）
- `naming-conventions.md` — kebab-case（ファイル）、camelCase（関数）、PascalCase（型）
- `jsdoc.md` — `@packageDocumentation` 必須、日本語 JSDoc
- `error-handling.md` — `formatErrorMessage()` による統一エラーフォーマット
- `tool-registration.md` — `server.registerTool()` パターン
- `path-addition.md` — 新パス追加時の3ファイル同時更新手順
- `import-rules.md` — ソース `.js` 拡張子あり / テスト `.js` なし
- `biome-rules.md` — Biome 設定と適用ルール

### harness/decisions/（KDR: 知見決定記録）

- `KDR-0001` — エスカレーションラダー導入の経緯と設計
- `KDR-0002` — L4テストスコープの選定基準
- `KDR-0003` — CODING_PATTERN.md（681行）を14ファイルへ分割した理由
- `KDR-0004` — L3ツールスイート導入（blocking/advisory分類、エントロピー管理）

---

## 3. Claude Code Skills

### conoha-vps-mcp（操作ガイド）

- MCPツール10種の使い方を体系的にガイド
- パス一覧・リクエストボディスキーマ・ワークフローレシピを参照ドキュメントとして提供

### conoha-vps-mcp-test（E2Eテスト）

- ConoHa VPS APIの全機能37項目を一括テスト
- Group A〜S の順序付き実行（リソース作成→操作→削除の依存関係を考慮）
- GitHub Actions（`e2e-test.yaml`）で Claude Code action 経由で自動実行
- テスト結果を Markdown レポートとして出力

### coding-pattern-check（パターン準拠チェック）

- `harness/patterns/*.md` のルールに基づきソースコードをセマンティックにチェック
- 対象ファイルを4グループに分類し、Sub-Agent を並列起動して効率的に検証
- ERROR（必須修正）/ WARN（推奨修正）の2段階で報告
- L4ルールは `architecture.test.ts` で検証済みのためスキップ可能

---

## 4. GitHub Actions CI/CD

### PR時に実行（ci.yaml）

- **build**: esbuild によるプロダクションビルド検証
- **biome**: `npm run biome:ci` でフォーマット・リンティングチェック
- **test**: Vitest 実行 → カバレッジ・テスト結果を PR にコメント → CSV/Markdown レポートをアーティファクト保存
- **knip**: 未使用ファイル・エクスポート・依存関係の検出
- **depcruise**: dependency-cruiser による循環依存・アーキテクチャ境界違反の検出
- **audit**: `npm audit --audit-level=high` による高リスク脆弱性検出
- **docker-build**: Docker イメージのビルド検証（push なし）

### E2Eテスト（e2e-test.yaml）

- PR時 + 手動トリガー（テストグループ選択可）
- Claude Code action でMCPサーバーを起動し実APIに対してテスト
- タイムアウト120分、テスト結果をアーティファクト保存（90日保持）

### コードレビュー（claude.yml / claude-code-review.yml）

- Claude Code による自動コードレビュー（品質・バグ・パフォーマンス・セキュリティ・カバレッジ）
- **claude-code-review.yml**: `src/**/*.ts` 変更時にPRで自動実行（advisory: CIブロックなし）
  - L2セマンティックルール8件（B-4, B-5, B-6, D-5, E-1, E-2, F-3, H-4）を重点チェック
- **claude.yml**: `@claude` メンションで手動トリガー

### リリース

- **publish-to-private.yaml**: staging ブランチマージ時に GitHub Packages へ RC 版公開（自動バージョニング）
- **publish-to-public.yaml**: main プッシュ時に npm 公開 + GitHub Release 作成（`.mcpb` バンドル付き）
- **push-to-public.yaml**: 公開リポジトリへのミラー同期

### エントロピースキャン（entropy-scan.yaml）

- 週次スケジュール（毎週月曜 9:00 UTC）+ 手動トリガー
- `npm audit` / `knip` / `dependency-cruiser` を実行し、PR間のドリフトを検出
- 違反検出時に GitHub Issue を自動作成

### GitHub Actions Lint（github-actions-lint.yaml）

- `.github/workflows/**` 変更時に actionlint を実行
- reviewdog 経由で PR レビューコメントとして報告

### コード重複検出（jscpd.yaml）

- PR時に jscpd を実行し、コード重複率を検出
- 結果を PR コメントで報告（advisory: CI ブロックなし）

### ミューテーションテスト（mutation.yaml）

- PR時に `src/**/*.ts`（テスト除く）変更があれば Stryker を実行
- ミューテーションスコアを PR コメントで報告（advisory: CI ブロックなし）
- レポートをアーティファクト保存（30日保持）

### その他

- **renovate-config-validator.yaml**: Renovate 設定ファイル変更時にバリデーション実行

---

## 5. 品質ツール

- **Vitest** — ユニットテスト + カバレッジ（v8プロバイダー、text/json/html/lcov レポート）
  - カバレッジ出力: `reports/coverage/`
  - カスタム CSV Reporter でテスト結果をカテゴリ・優先度付きで出力（`reports/test-result.csv`）
- **Biome** — フォーマット（タブ・ダブルクォート）+ リンティング（12カスタムルール、`useImportType` / `useNodejsImportProtocol` 含む）
  - L3 エスカレーションレベルとして CI で強制
- **TypeScript strict mode** — `npm run typecheck` で型チェック
- **architecture.test.ts** — L4 構造テスト（22ルール）
  - A: ファイル名kebab-case、featureディレクトリ配置、テストファイル同一ディレクトリ
  - C: `z.object()` に `.strict()`、`.describe()` 付与、スキーマ命名パターン、`z.enum()` に `message`
  - D: カスタムレスポンスフォーマッターに interface / JSON.stringify / try-catch / satisfies
  - E: テストインポートに `.js` なし、`vi.mock()` 使用時に `clearAllMocks`、`it()` 日本語記述
  - F: `@packageDocumentation` 必須、`@param`/`@returns` JSDoc
  - G: ソースインポートに `.js` 拡張子
  - H: エクスポート関数名 camelCase、型名 PascalCase
- **NOTICE Generator** — `npm run generate:notice` でライセンスコンプライアンスファイル生成
- **TypeDoc** — `npm run docs:build` で API ドキュメント生成（`reports/docs/`）
- **dependency-cruiser** — 循環依存・クロスフィーチャーインポート検出（3ルール）
  - `.dependency-cruiser.cjs` で設定、`npm run depcruise` で実行
- **knip** — 未使用ファイル・エクスポート・依存関係検出
  - `knip.json` で設定、`npm run knip` で実行
- **jscpd** — コード重複検出（閾値10%、`reports/jscpd/` に出力）
  - `.jscpd.json` で設定、`npm run jscpd` で実行
- **Stryker** — ミューテーションテスト（break=40%, low=60%, high=80%、`reports/mutation/` に出力）
  - `stryker.config.js` で設定、`npm run mutation` で実行

---

## 6. 全体像

```
コード変更
  │
  ├─ L1: harness/patterns/*.md（ドキュメント参照）
  │
  ├─ L2: CLAUDE.md（開発時予防）+ Claude Code Review CI（PR時検知）
  │   └─ セマンティック8ルール: B-4, B-5, B-6, D-5, E-1, E-2, F-3, H-4
  │
  ├─ L3: CI ツールスイート
  │   ├─ blocking: Biome（+useImportType, +useNodejsImportProtocol） / knip / dependency-cruiser / npm audit / actionlint
  │   └─ advisory: jscpd / Stryker（PRコメントで報告）
  │
  ├─ L4: npm test（architecture.test.ts 22ルール + ユニットテスト）
  │
  ├─ CI: GitHub Actions（ビルド・テスト・カバレッジ・Docker）
  │
  ├─ E2E: Claude Code action（実API 37項目テスト）
  │
  ├─ エントロピースキャン: 週次（audit + knip + depcruise → Issue自動作成）
  │
  └─ リリース: npm / GitHub Packages / GitHub Release
```
