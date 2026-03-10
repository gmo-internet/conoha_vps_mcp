---
id: 5
title: 型定義パターン
last-reviewed: 2026-03-10
enforcement-level: L2
related-rules: []
checked-by: [coding-pattern-check]
---

## 5. 型定義パターン

### パス型（string literal union）

APIパスをstring literalのunion型で定義する。ツールごとに型を分ける。

```typescript
// src/types.ts
export type ConoHaGetPaths =
	| "/servers/detail"
	| "/flavors/detail"
	| "/os-keypairs"
	| "/types"
	| "/volumes/detail";

export type ConoHaPostPaths =
	| "/servers"
	| "/os-keypairs"
	| "/volumes";
```

### 共通型

```typescript
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = {
	[key: string]: JsonPrimitive | JsonObject | JsonObject[] | string[];
};
```
