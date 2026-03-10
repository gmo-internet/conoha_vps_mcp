---
name: coding-pattern-check
description: コーディングパターン準拠チェックを実行するスキル。
  「パターンチェック」「コーディング規約」「coding pattern」「パターン準拠」
  「コード規約チェック」「規約違反」「パターン違反」などのキーワードで発動する。
---

# コーディングパターン準拠チェック

## 概要

`CODING_PATTERN.md` に定義されたコーディングパターンへの準拠状況をチェックし、違反箇所を報告する。

## 入力

- **対象**: ファイルパスまたはglobパターン（デフォルト: `src/**/*.ts`、テスト除外）
- **`--include-tests`**: テストファイル（`*.test.ts`）も対象に含める

## 実行フロー

### Step 1: CODING_PATTERN.md 読み込み

プロジェクトルートの `CODING_PATTERN.md` を読み込む。

### Step 2: チェックリスト読み込み

`skills/coding-pattern-check/references/checklist.md` を読み込み、チェック項目を把握する。

### Step 3: 対象ファイルの特定

引数で指定されたパスまたはglobパターンに基づいて対象ファイルを特定する。
指定がない場合は `src/**/*.ts` を対象とし、テストファイル（`*.test.ts`）を除外する。

`--include-tests` オプションが指定された場合はテストファイルも対象に含める。

### Step 4: ファイル種別の判定

各ファイルを以下の種別に分類し、適用するチェックカテゴリを決定する:

| ファイル種別 | 判定条件 | 適用カテゴリ |
|------------|----------|------------|
| クライアント（標準） | `*-client.ts`（storage除外） | A, B(1-5), F, G(1-3), H |
| クライアント（storage） | `storage/storage-client.ts` | A, B(1-4,6), F, G(1-3), H |
| スキーマ | `*-schema.ts` | A, C, G(1-3), H |
| レスポンスフォーマッター | `*-response-formatter.ts` | A, D, F, G(1-3), H |
| テストファイル | `*.test.ts` | A, E, G(4), H(1) |
| 共通型定義 | `src/types.ts` | F, G(1-3), H |
| ルーティングテーブル | `src/tool-routing-tables.ts` | F, G(1-3), H |
| エントリポイント | `src/index.ts` | F, G(1-3), H |
| その他ソース | `src/**/*.ts` | F, G(1-3), H |

### Step 5: パターン準拠チェック

各ファイルに対して、割り当てられたチェックカテゴリのルールを適用する。

**チェックカテゴリ:**

- **A: ファイル構成** — feature modules構造、ファイル命名
- **B: クライアントモジュール** — `@packageDocumentation`、`import type`、`.js`拡張子、命名、呼び出しチェーン
- **C: スキーマ** — `.strict()`、`.describe()`、命名
- **D: レスポンスフォーマッター** — interface定義、`JSON.stringify`返却、try/catch
- **E: テストファイル** — `vi.mock`/`vi.mocked`構造、`clearAllMocks`、日本語テスト名
- **F: JSDoc** — `@packageDocumentation`、`@param`/`@returns`
- **G: インポート** — `.js`拡張子、`import type`、`node:`プレフィックス
- **H: 命名規則** — kebab-case(ファイル)、camelCase(関数)、PascalCase(型)、UPPER_SNAKE_CASE(定数)

チェックはセマンティック（コード読解ベース）で行う。正規表現リントではなく、コードの文脈を理解した上で柔軟に判定する。

### Step 6: 結果出力

以下の形式でファイル別に結果を出力する:

```markdown
## チェック結果

### src/features/openstack/compute/compute-client.ts
- OK: すべてのパターンに準拠

### src/features/openstack/example/example-client.ts
- [ERROR] L1: B-1: @packageDocumentationが見つかりません
- [WARN]  L10: G-1: 相対インポートに.js拡張子がありません: "./helper"
- [ERROR] L25: B-5: executeOpenstackApi→formatResponseの呼び出しチェーンが確認できません

### src/features/openstack/compute/compute-schema.ts
- [WARN]  L15: C-2: .describe()がありません: フィールド "name"
- OK: その他のパターンに準拠

## サマリ
- チェック対象: 15ファイル
- 違反あり: 2ファイル
- ERROR: 3件, WARN: 2件
```

## 重要度

| レベル | 意味 | 対応 |
|--------|------|------|
| ERROR | 必須修正。パターンから明確に逸脱している | 修正必須 |
| WARN | 推奨修正。パターンに完全には合致しないが動作に影響なし | 修正推奨 |

## 注意事項

- `src/index.ts` はカバレッジ対象外だがパターンチェック対象
- storageモジュールはB-5（executeOpenstackApiチェーン）の対象外、代わりにB-6を適用
- テストファイルはF（JSDoc）カテゴリのチェック対象外
- チェックはコード読解ベースで柔軟に判定する。明らかにパターンの意図に沿っていれば厳密な形式不一致はWARNとする
