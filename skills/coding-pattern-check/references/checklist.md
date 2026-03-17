# コーディングパターン チェックリスト

Skillがチェック実行時に参照する構造化された一覧表。

---

## カテゴリ A: ファイル構成

| ID | ルール | 検出方法 | 重要度 | 適用対象 | 執行レベル |
|----|--------|----------|--------|----------|-----------|
| A-1 | featureディレクトリは `src/features/openstack/{service}/` 配下に配置 | ファイルパスが `src/features/openstack/` で始まることを確認 | ERROR | 全ソースファイル（common/除く） | L2 |
| A-2 | テストファイルはソースファイルと同じディレクトリに `*.test.ts` として配置 | テストファイルの存在確認、配置ディレクトリの確認 | WARN | テストファイル | L4 |
| A-3 | ファイル名はkebab-caseのみ | ファイル名に大文字やアンダースコアが含まれていないことを確認 | ERROR | 全ファイル | L4 |

---

## カテゴリ B: クライアントモジュール

| ID | ルール | 検出方法 | 重要度 | 適用対象 | 執行レベル |
|----|--------|----------|--------|----------|-----------|
| B-1 | ファイル先頭に `@packageDocumentation` を含むJSDocブロック | ファイル先頭行が `/**` で始まり、ブロック内に `@packageDocumentation` を含む | ERROR | `*-client.ts` | L2 |
| B-2 | `import type` を型のインポートに使用 | 型のみのインポートが `import type` を使っているか確認 | ERROR | `*-client.ts` | L2 |
| B-3 | 相対インポートに `.js` 拡張子 | `from "./` または `from "../` のインポートに `.js` 拡張子があるか | ERROR | `*-client.ts` | L2 |
| B-4 | 関数命名が `get{Service}` / `create{Service}` / `delete{Service}ByParam` / `update{Service}ByParam` パターンに従う | 関数名を正規表現でチェック | WARN | `*-client.ts` | L2 |
| B-5 | 標準パターン: `executeOpenstackApi()` → `formatResponse()` or カスタムフォーマッターの呼び出しチェーン | 関数内で `executeOpenstackApi` を呼び、その結果を `formatResponse` 系関数に渡しているか | ERROR | `*-client.ts`（storage除外） | L2 |
| B-6 | Storage例外: `generateApiToken()` を直接使用 | storageモジュールが `executeOpenstackApi` を使わず `generateApiToken` を直接呼び出しているか | WARN | `storage/storage-client.ts` | L2 |

---

## カテゴリ C: スキーマ

| ID | ルール | 検出方法 | 重要度 | 適用対象 | 執行レベル |
|----|--------|----------|--------|----------|-----------|
| C-1 | 全オブジェクトスキーマに `.strict()` を付与 | `z.object({...})` の後に `.strict()` が呼ばれているか | ERROR | `*-schema.ts` | L4 |
| C-2 | フィールドに `.describe()` で日本語説明を付与 | 各フィールドに `.describe("...")` があるか | WARN | `*-schema.ts` | L2 |
| C-3 | スキーマ命名: `{Action}{Resource}RequestSchema` | export名が `(Create|Update|Operate|Attach|RemoteConsole){Resource}RequestSchema` パターンか | ERROR | `*-schema.ts` | L2 |
| C-4 | enumフィールドに `message` オプションで日本語エラーメッセージ | `z.enum([...], { message: "..." })` 形式か | WARN | `*-schema.ts` | L2 |

---

## カテゴリ D: レスポンスフォーマッター

| ID | ルール | 検出方法 | 重要度 | 適用対象 | 執行レベル |
|----|--------|----------|--------|----------|-----------|
| D-1 | interface定義でAPIレスポンス型を定義 | ファイル内に `interface` 定義があるか | WARN | `*-response-formatter.ts` | L2 |
| D-2 | `JSON.stringify` で返却 | 関数の返り値が `JSON.stringify(...)` であるか | ERROR | `*-response-formatter.ts` | L2 |
| D-3 | try/catchでエラー処理 | 関数内にtry/catchブロックがあるか | ERROR | `*-response-formatter.ts`（カスタムフォーマッター） | L2 |
| D-4 | `satisfies` で型安全性を確保 | slimmedオブジェクトに `satisfies` が使われているか | WARN | `*-response-formatter.ts`（カスタムフォーマッター） | L2 |
| D-5 | エラー時の返却形式: `JSON.stringify({ status, statusText, body: "<error>" })` | catchブロック内の返却が統一形式か | WARN | `*-response-formatter.ts` | L2 |

---

## カテゴリ E: テストファイル

| ID | ルール | 検出方法 | 重要度 | 適用対象 | 執行レベル |
|----|--------|----------|--------|----------|-----------|
| E-1 | `vi.mock()` でモジュールをモック | テストファイル内に `vi.mock(...)` 呼び出しがあるか | WARN | `*.test.ts` | L2 |
| E-2 | `vi.mocked()` + `await import()` でモック関数の型付きリファレンスを取得 | `vi.mocked(await import(...))` パターンを使用しているか | WARN | `*.test.ts` | L2 |
| E-3 | `beforeEach(() => { vi.clearAllMocks(); })` | 最上位のdescribe内に `clearAllMocks` の `beforeEach` があるか | ERROR | `*.test.ts` | L2 |
| E-4 | `it` の記述が日本語の詳細な1文 | `it("...")` 内の文字列が日本語を含む詳細な説明か | ERROR | `*.test.ts` | L2 |
| E-5 | テストファイルでのインポートに `.js` 拡張子なし | `from "./` のインポートに `.js` が付いていないか | ERROR | `*.test.ts` | L4 |
| E-6 | `vi.mock()` のパスに `.js` 拡張子なし | `vi.mock("../...")` のパスに `.js` が付いていないか | ERROR | `*.test.ts` | L4 |

---

## カテゴリ F: JSDoc

| ID | ルール | 検出方法 | 重要度 | 適用対象 | 執行レベル |
|----|--------|----------|--------|----------|-----------|
| F-1 | ファイル先頭に `@packageDocumentation` | ファイル先頭のJSDocブロックに `@packageDocumentation` タグがあるか | ERROR | 全ソースファイル（テスト除外） | L4 |
| F-2 | エクスポート関数に `@param` / `@returns` | `export` 関数の直前にJSDocブロックがあり、`@param` と `@returns` を含むか | WARN | 全ソースファイル（テスト除外） | L2 |
| F-3 | JSDocの説明文は日本語 | JSDoc内の説明テキストが日本語であるか | WARN | 全ソースファイル（テスト除外） | L2 |

---

## カテゴリ G: インポート

| ID | ルール | 検出方法 | 重要度 | 適用対象 | 執行レベル |
|----|--------|----------|--------|----------|-----------|
| G-1 | 相対インポートに `.js` 拡張子必須 | `from "./` または `from "../` のパスが `.js` で終わるか | ERROR | 全ソースファイル（テスト除外） | L4 |
| G-2 | 型のみのインポートに `import type` 使用 | 型のみをインポートする場合に `import type` を使っているか | ERROR | 全ソースファイル（テスト除外） | L2 |
| G-3 | Node.js組み込みモジュールに `node:` プレフィックス | `buffer`, `fs/promises`, `module` 等のインポートに `node:` プレフィックスがあるか | ERROR | 全ソースファイル（テスト除外） | L2 |
| G-4 | テストファイルのインポートに `.js` 拡張子なし | テストファイルの相対インポートに `.js` が付いていないか | ERROR | テストファイル | L4 |

---

## カテゴリ H: 命名規則

| ID | ルール | 検出方法 | 重要度 | 適用対象 | 執行レベル |
|----|--------|----------|--------|----------|-----------|
| H-1 | ファイル名: kebab-case | ファイル名が `/^[a-z0-9]+(-[a-z0-9]+)*\.(ts\|test\.ts)$/` にマッチするか | ERROR | 全ファイル | L4 |
| H-2 | 関数名: camelCase | `export (async )?function` の後の識別子がcamelCaseか | WARN | 全ソースファイル | L4 |
| H-3 | 型/インターフェース名: PascalCase | `type` / `interface` / `export const ...Schema` の識別子がPascalCaseか | WARN | 全ソースファイル | L2 |
| H-4 | 定数: UPPER_SNAKE_CASE | `export const` の識別子がUPPER_SNAKE_CASEか（ただしHandlersテーブルやSchema除く） | WARN | 定数定義 | L2 |

---

## チェック適用マトリクス

| ファイル種別 | 適用カテゴリ |
|------------|------------|
| `*-client.ts`（storage除外） | A, B(1-5), F, G(1-3), H |
| `storage/storage-client.ts` | A, B(1-4,6), F, G(1-3), H |
| `*-schema.ts` | A, C, G(1-3), H |
| `*-response-formatter.ts` | A, D, F, G(1-3), H |
| `*.test.ts` | A, E, G(4), H(1) |
| `src/types.ts` | F, G(1-3), H |
| `src/tool-routing-tables.ts` | F, G(1-3), H |
| `src/index.ts` | F, G(1-3), H |
| その他 `src/**/*.ts` | F, G(1-3), H |
