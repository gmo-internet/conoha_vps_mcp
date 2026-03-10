---
id: 4
title: レスポンスフォーマッターパターン
last-reviewed: 2026-03-10
enforcement-level: L2/L4
related-rules: [D-1, D-2, D-3, D-4, D-5]
checked-by: [architecture.test.ts, coding-pattern-check]
---

## 4. レスポンスフォーマッターパターン

### カスタムフォーマッター構成

1. interface定義でAPIレスポンスの型を定義
2. slim化（不要フィールドの除外）
3. `satisfies` で型安全性を確保
4. `JSON.stringify` で返却
5. try/catchでエラー処理

```typescript
// src/features/openstack/compute/get-flavor-response-formatter.ts
interface FlavorData {
	id?: string;
	name?: string;
	ram?: number;
	vcpus?: number;
	disk?: number;
}

interface ApiResponse {
	flavors: FlavorData[];
}

export async function formatGetFlavorResponse(response: Response) {
	const status = response.status;
	const statusText = response.statusText;
	try {
		const body = (await response.json()) as ApiResponse;

		if (!body?.flavors || !Array.isArray(body.flavors)) {
			return JSON.stringify({ status, statusText, body });
		}

		const slimmed = {
			flavors: body.flavors.map((flavor: FlavorData) => {
				const slim = {
					id: flavor?.id,
					name: flavor?.name,
					ram: flavor?.ram,
					vcpus: flavor?.vcpus,
					disk: flavor?.disk,
				};
				return slim;
			}),
		} satisfies ApiResponse;
		return JSON.stringify({ status, statusText, body: slimmed });
	} catch (error) {
		console.error("Error formatting response:", error);
		return JSON.stringify({ status, statusText, body: "<error>" });
	}
}
```

### 共通フォーマッター（response-formatter.ts）

```typescript
export async function formatResponse(response: Response) {
	const raw = await response.text();
	try {
		return JSON.stringify({
			status: response.status,
			statusText: response.statusText,
			body: JSON.parse(raw),
		});
	} catch (error) {
		console.error("Failed to parse response body as JSON:", error);
		return JSON.stringify({
			status: response.status,
			statusText: response.statusText,
			body: raw,
		});
	}
}
```

### ファイル命名

- `get-{resource}-response-formatter.ts`（例: `get-flavor-response-formatter.ts`）
- storageの場合: `response-formatter.ts`（複数フォーマッター関数を1ファイルにまとめる）
