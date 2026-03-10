---
id: 7
title: テストパターン
last-reviewed: 2026-03-10
enforcement-level: L2/L4
related-rules: [E-1, E-2, E-3, E-4, E-5, E-6, G-4]
checked-by: [architecture.test.ts, coding-pattern-check]
---

## 7. テストパターン

### テスト構成

```typescript
// src/features/openstack/compute/compute-client.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCompute, createCompute } from "./compute-client";

// 1. vi.mockで依存モジュールをモック（.js拡張子なし）
vi.mock("../common/response-formatter", () => ({
	formatResponse: vi.fn(),
}));

vi.mock("../common/openstack-client", () => ({
	executeOpenstackApi: vi.fn(),
}));

// 2. vi.mockedでモック関数の型付きリファレンスを取得
const mockExecuteOpenstackApi = vi.mocked(
	await import("../common/openstack-client"),
).executeOpenstackApi;

const mockFormatResponse = vi.mocked(
	await import("../common/response-formatter"),
).formatResponse;

// 3. describeでグルーピング
describe("compute-client", () => {
	// 4. beforeEachでモックをクリア
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// 5. 定数定義
	const expectedBaseUrl = "https://compute.c3j1.conoha.io/v2.1";

	describe("getCompute", () => {
		const mockResponse = JSON.stringify({ /* ... */ });

		beforeEach(() => {
			mockFormatResponse.mockResolvedValue(mockResponse);
		});

		// 6. itは日本語の詳細な1文で記述
		it("Compute API（/servers/detail）へのGETリクエストで...を返すことができる", async () => {
			const path = "/servers/detail";
			const result = await getCompute(path);
			expect(result).toBe(mockResponse);
			expect(mockExecuteOpenstackApi).toHaveBeenCalledWith(
				"GET",
				expectedBaseUrl,
				"/servers/detail",
			);
		});
	});
});
```

### テスト命名規則

`it` の記述は以下のパターンに従う:

```
{API名}（{パス} - {操作概要}）への{条件}で{期待結果}を返すことができる
```

### Zodスキーマテスト

```typescript
describe("CreateServerRequestSchema", () => {
	it("有効なサーバー作成リクエストボディでsafeParseが成功する", () => {
		const validBody = { server: { /* ... */ } };
		const result = CreateServerRequestSchema.safeParse(validBody);
		expect(result.success).toBe(true);
	});

	it("不正なパスワードでsafeParseが失敗する", () => {
		const invalidBody = { server: { adminPass: "weak" } };
		const result = CreateServerRequestSchema.safeParse(invalidBody);
		expect(result.success).toBe(false);
	});
});
```

### モックのインポート

テストファイルでは `.js` 拡張子を付けない:

```typescript
// テストファイル: .js拡張子なし
import { getCompute } from "./compute-client";
vi.mock("../common/openstack-client", () => ({ /* ... */ }));

// ソースファイル: .js拡張子必須
import { executeOpenstackApi } from "../common/openstack-client.js";
```
