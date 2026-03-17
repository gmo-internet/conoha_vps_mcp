---
id: 10
title: エラーハンドリングパターン
last-reviewed: 2026-03-10
enforcement-level: L2
related-rules: []
checked-by: [coding-pattern-check]
---

## 10. エラーハンドリングパターン

### formatErrorMessage()

```typescript
// src/features/openstack/common/error-handler.ts
export function formatErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return `API Error: ${error.message}`;
	}
	return "Unexpected error occurred.";
}
```

### ツールハンドラのtry/catch

すべてのツールハンドラで同一パターンのtry/catchを使用する。
エラー時は `isError: true` を返却する。

```typescript
async ({ path }) => {
	try {
		const handler = conohaGetHandlers[path];
		const response = await handler();
		const output = { response };
		return {
			content: [{ type: "text", text: JSON.stringify(output) }],
			structuredContent: output,
		};
	} catch (error) {
		const errorMessage = formatErrorMessage(error);
		return {
			content: [{ type: "text", text: errorMessage }],
			isError: true,
		};
	}
},
```
