---
id: 12
title: パス追加手順
last-reviewed: 2026-03-10
enforcement-level: L2
related-rules: []
checked-by: [coding-pattern-check]
---

## 12. パス追加手順

新しいAPIパスを追加する場合、以下の3ファイルを同時に更新する:

1. **`src/types.ts`** — パス型にリテラルを追加
2. **`src/tool-routing-tables.ts`** — ハンドラーマッピングにエントリを追加
3. **`src/index.ts`** — ツールの `inputSchema` にあるZodスキーマにパスを追加

### 例: 新しいGETパス `/new-resource` を追加

```typescript
// 1. src/types.ts
export type ConoHaGetPaths =
	| "/servers/detail"
	| "/new-resource";  // 追加

// 2. src/tool-routing-tables.ts
export const conohaGetHandlers: Record<ConoHaGetPaths, ...> = {
	"/servers/detail": () => getCompute("/servers/detail"),
	"/new-resource": () => getNewResource("/new-resource"),  // 追加
};

// 3. src/index.ts — inputSchemaのz.enumに追加
path: z.enum([
	"/servers/detail",
	"/new-resource",  // 追加
]),
```
