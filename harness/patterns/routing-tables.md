---
id: 6
title: ルーティングテーブルパターン
last-reviewed: 2026-03-10
enforcement-level: L2
related-rules: []
checked-by: [coding-pattern-check]
---

## 6. ルーティングテーブルパターン

HTTPメソッド別に `Record<PathType, Handler>` 形式で定義する。

```typescript
// src/tool-routing-tables.ts
export const conohaGetHandlers: Record<
	ConoHaGetPaths,
	(path?: string) => Promise<string>
> = {
	"/servers/detail": () => getCompute("/servers/detail"),
	"/flavors/detail": () => getFlavor("/flavors/detail"),
	"/os-keypairs": () => getCompute("/os-keypairs"),
};

export const conohaPostHandlers: Record<
	ConoHaPostPaths,
	(requestBody: any) => Promise<string>
> = {
	"/servers": (requestBody) => createCompute("/servers", requestBody),
	"/os-keypairs": (requestBody) => createCompute("/os-keypairs", requestBody),
};
```

### テーブル種別

| テーブル名 | HTTPメソッド | ハンドラー引数 |
|-----------|------------|--------------|
| `conohaGetHandlers` | GET | `(path?: string)` |
| `conohaGetByParamHandlers` | GET | `(param: string)` |
| `conohaPostHandlers` | POST | `(requestBody: any)` |
| `conohaPostPutHandlers` | PUT | `(path: string, content?, contentType?)` |
| `conohaPostPutByParamHandlers` | POST/PUT | `(param: string, requestBody: any)` |
| `conohaPostPutByHeaderparamHandlers` | POST | `(path: string, headerparam: any)` |
| `conohaDeleteByParamHandlers` | DELETE | `(param: string)` |
| `conohaHeadHandlers` | HEAD | `(path: string)` |
