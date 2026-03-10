---
id: 11
title: ツール登録パターン
last-reviewed: 2026-03-10
enforcement-level: L2
related-rules: []
checked-by: [coding-pattern-check]
---

## 11. ツール登録パターン

### registerTool

```typescript
server.registerTool(
	"tool_name",                    // ツール名（snake_case）
	{
		title: "ツールタイトル",       // 日本語
		description: description.trim(),
		inputSchema: {
			// Zodスキーマ
		},
		outputSchema: {
			// 出力スキーマ
		},
	},
	async (params) => {
		try {
			// 処理
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
);
```

### 返却形式

- 正常時: `content` + `structuredContent` の両方を返す
- エラー時: `content` + `isError: true` を返す
- `structuredContent` は `outputSchema` に対応するオブジェクト
