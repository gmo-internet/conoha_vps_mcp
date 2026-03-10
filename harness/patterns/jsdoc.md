---
id: 9
title: JSDocパターン
last-reviewed: 2026-03-10
enforcement-level: L2/L4
related-rules: [F-1, F-2, F-3]
checked-by: [architecture.test.ts, coding-pattern-check]
---

## 9. JSDocパターン

### ファイルレベル

すべてのソースファイル（テストファイルを除く）に `@packageDocumentation` を含むJSDocブロックを配置する。

```typescript
/**
 * OpenStack Compute (Nova) APIクライアント
 *
 * @remarks
 * サーバー（仮想マシン）の作成、取得、削除、操作を行うAPIクライアントです。
 *
 * @packageDocumentation
 */
```

### 関数レベル

`@param`、`@returns` を必須とし、必要に応じて `@remarks`、`@example`、`@throws` を追加する。

```typescript
/**
 * Compute APIからリソース一覧を取得
 *
 * @param path - APIパス（例: "/servers/detail"）
 * @returns フォーマット済みJSONレスポンス
 */
export async function getCompute(path: string) { /* ... */ }
```

### 複雑な関数

```typescript
/**
 * OpenStack APIトークンを生成
 *
 * @remarks
 * 環境変数 `OPENSTACK_USER_ID`、`OPENSTACK_PASSWORD`、`OPENSTACK_TENANT_ID` が必要です。
 *
 * @returns APIトークン文字列
 * @throws 環境変数が未設定の場合
 *
 * @example
 * ```typescript
 * const token = await generateApiToken();
 * // token: "gAAAAABl..."
 * ```
 */
```
