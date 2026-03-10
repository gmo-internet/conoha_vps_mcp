# パターン執行エスカレーションラダー

コーディングパターンの執行を4段階に分類し、段階的に自動化する。

---

## レベル定義

| レベル | メカニズム | 昇格基準 |
|--------|-----------|---------|
| **L1: ドキュメント** | `CODING_PATTERN.md` / `harness/patterns/` | 初期状態 |
| **L2: AIスキルチェック** | `CLAUDE.md`（開発時予防）+ Claude Code Review CI（PR時検知） | PRレビューで1回以上違反検出 + セマンティック |
| **L3: CIルール** | Biome / dependency-cruiser / knip / jscpd / npm audit / actionlint / Stryker | スキルチェックで3回以上検出 + 自動検出手段あり |
| **L4: 構造テスト** | `src/architecture.test.ts` | アーキテクチャ不変条件 |

### 昇格フロー

```
L1 (ドキュメント)
  ↓ PRレビューで違反検出
L2 (AIスキルチェック)
  ↓ 3回以上検出 + 自動検出可能
L3 (CIルール)
  ↓ アーキテクチャ不変条件
L4 (構造テスト)
```

---

## ルール→レベル対応表

### カテゴリ A: ファイル構成

| ID | ルール | レベル |
|----|--------|--------|
| A-1 | featureディレクトリ配置 | L4 |
| A-2 | テストファイル同一ディレクトリ配置 | L4 |
| A-3 | ファイル名kebab-case | L4 |

### カテゴリ B: クライアントモジュール

| ID | ルール | レベル |
|----|--------|--------|
| B-1 | `@packageDocumentation` JSDocブロック | L4（F-1と統合） |
| B-2 | `import type` 使用 | L3（Biome `useImportType`） |
| B-3 | 相対インポートに `.js` 拡張子 | L4（G-1と統合） |
| B-4 | 関数命名パターン | L2（CLAUDE.md + Claude Code Review CI） |
| B-5 | `executeOpenstackApi()` → `formatResponse()` チェーン | L2（CLAUDE.md + Claude Code Review CI） |
| B-6 | Storage例外パターン | L2（CLAUDE.md + Claude Code Review CI） |

### カテゴリ C: スキーマ

| ID | ルール | レベル |
|----|--------|--------|
| C-1 | `.strict()` 付与 | L4 |
| C-2 | `.describe()` 日本語説明 | L4 |
| C-3 | スキーマ命名パターン | L4 |
| C-4 | enum `message` オプション | L4 |

### カテゴリ D: レスポンスフォーマッター

| ID | ルール | レベル |
|----|--------|--------|
| D-1 | interface定義 | L4 |
| D-2 | `JSON.stringify` 返却 | L4 |
| D-3 | try/catchエラー処理 | L4 |
| D-4 | `satisfies` 型安全性 | L4 |
| D-5 | エラー時返却形式 | L2（CLAUDE.md + Claude Code Review CI） |

### カテゴリ E: テストファイル

| ID | ルール | レベル |
|----|--------|--------|
| E-1 | `vi.mock()` 使用 | L2（CLAUDE.md + Claude Code Review CI） |
| E-2 | `vi.mocked()` + `await import()` | L2（CLAUDE.md + Claude Code Review CI） |
| E-3 | `beforeEach` で `clearAllMocks` | L4 |
| E-4 | `it` 日本語記述 | L4 |
| E-5 | テストインポートに `.js` なし | L4 |
| E-6 | `vi.mock()` パスに `.js` なし | L4 |

### カテゴリ F: JSDoc

| ID | ルール | レベル |
|----|--------|--------|
| F-1 | `@packageDocumentation` 必須 | L4 |
| F-2 | `@param` / `@returns` | L4 |
| F-3 | JSDoc日本語 | L2（CLAUDE.md + Claude Code Review CI） |

### カテゴリ G: インポート

| ID | ルール | レベル |
|----|--------|--------|
| G-1 | 相対インポートに `.js` 拡張子 | L4 |
| G-2 | `import type` 使用 | L3（Biome `useImportType`、B-2と統合） |
| G-3 | `node:` プレフィックス | L3（Biome `useNodejsImportProtocol`） |
| G-4 | テストインポートに `.js` なし | L4 |

### カテゴリ H: 命名規則

| ID | ルール | レベル |
|----|--------|--------|
| H-1 | ファイル名kebab-case | L4 |
| H-2 | 関数名camelCase | L4 |
| H-3 | 型/インターフェース名PascalCase | L4 |
| H-4 | 定数UPPER_SNAKE_CASE | L2（CLAUDE.md + Claude Code Review CI） |

### カテゴリ Biome

| ID | ルール | レベル |
|----|--------|--------|
| — | セクション14全体 | L3 |

### カテゴリ I: アーキテクチャ境界

| ID | ルール | レベル | ツール |
|----|--------|--------|--------|
| I-1 | 循環依存禁止 | L3 | dependency-cruiser |
| I-2 | feature間直接インポート禁止 | L3 | dependency-cruiser |
| I-3 | featureからrootファイルへのインポート警告 | L3 | dependency-cruiser |

### カテゴリ J: コード衛生

| ID | ルール | レベル | ツール |
|----|--------|--------|--------|
| J-1 | 未使用ファイル・エクスポート検出 | L3 | knip |
| J-2 | コード重複 < 10% | L3 (advisory) | jscpd |

### カテゴリ K: セキュリティ・品質

| ID | ルール | レベル | ツール |
|----|--------|--------|--------|
| K-1 | 高リスク脆弱性なし | L3 | npm audit |
| K-2 | GitHub Actionsワークフロー構文検証 | L3 | actionlint |
| K-3 | ミューテーションスコア ≥ 50% | L3 (advisory) | Stryker |

---

## エントロピー管理

週次スケジュールで `.github/workflows/entropy-scan.yaml` が以下を自動実行:
- `npm audit --audit-level=high` — 新規CVE検出
- `npm run knip` — 未使用コードドリフト検出
- `npm run depcruise` — 依存関係違反検出

違反時はGitHub Issueを自動作成する。

---

## 運用ルール

1. 新しいパターンはまずL1（ドキュメント）として追加する
2. レベル昇格時は `harness/decisions/` にKDRを作成する
3. L4ルールの追加・変更は `src/architecture.test.ts` のテストケース更新を伴う
4. L3ルールの追加・変更は `biome.json` 等のCI設定更新を伴う
