# CODING_PATTERN.md

本プロジェクト（ConoHa VPS MCPサーバー）のコーディングパターンを定義する。
新機能追加・リファクタリング時は本ドキュメントに準拠すること。

---

## 1. ファイル構成パターン

### Feature Modules構造

```
src/
├── index.ts                    # エントリポイント（ツール登録）
├── types.ts                    # 共通型定義
├── tool-routing-tables.ts      # ルーティングテーブル
├── tool-descriptions.ts        # ツール説明文
└── features/openstack/
    ├── constants.ts             # API定数（ベースURL等）
    ├── common/                  # 共通モジュール
    │   ├── openstack-client.ts      # APIクライアント
    │   ├── generate-api-token.ts    # トークン生成
    │   ├── response-formatter.ts    # レスポンスフォーマッター
    │   └── error-handler.ts         # エラーハンドラー
    ├── compute/                 # Compute (Nova) API
    │   ├── compute-client.ts
    │   ├── compute-client.test.ts
    │   ├── compute-schema.ts
    │   └── get-flavor-response-formatter.ts
    ├── volume/                  # Block Storage (Cinder) API
    ├── image/                   # Image (Glance) API
    ├── network/                 # Networking (Neutron) API
    └── storage/                 # Object Storage (Swift) API
```

### 規則

- 1つのOpenStackサービスにつき1つのfeatureディレクトリ
- テストファイルはソースファイルと同じディレクトリに配置（`*.test.ts`）
- `common/` にはサービス横断で使われるユーティリティを配置
- ファイル名はkebab-caseのみ

---

## 2. クライアントモジュールパターン

### 標準パターン（compute / volume / network / image）

`executeOpenstackApi()` → `formatResponse()` の呼び出しチェーンで構成する。

```typescript
// src/features/openstack/compute/compute-client.ts
/**
 * OpenStack Compute (Nova) APIクライアント
 *
 * @remarks
 * サーバー（仮想マシン）の作成、取得、削除、操作を行うAPIクライアントです。
 *
 * @packageDocumentation
 */

import type { JsonObject } from "../../../types.js";
import { executeOpenstackApi } from "../common/openstack-client.js";
import { formatResponse } from "../common/response-formatter.js";
import { OPENSTACK_COMPUTE_BASE_URL } from "../constants.js";

export async function getCompute(path: string) {
	const response = await executeOpenstackApi(
		"GET",
		OPENSTACK_COMPUTE_BASE_URL,
		path,
	);
	return await formatResponse(response);
}

export async function createCompute(path: string, requestBody: JsonObject) {
	const response = await executeOpenstackApi(
		"POST",
		OPENSTACK_COMPUTE_BASE_URL,
		path,
		requestBody,
	);
	return await formatResponse(response);
}
```

### 関数命名規則

| 操作 | 命名パターン | 例 |
|------|-------------|-----|
| 一覧取得 | `get{Service}` | `getCompute`, `getVolume`, `getNetwork` |
| パラメータ付き取得 | `get{Service}ByParam` | `getComputeByParam`, `getNetworkByParam` |
| 作成 | `create{Service}` | `createCompute`, `createVolume`, `createNetwork` |
| パラメータ付き作成/更新 | `create{Service}ByParam` / `update{Service}ByParam` | `createComputeByParam`, `updateNetworkByParam` |
| 削除 | `delete{Service}ByParam` | `deleteComputeByParam`, `deleteVolumeByParam` |
| カスタム取得 | `get{Resource}` | `getFlavor`, `getSecurityGroup`, `getImage` |

### Storage例外パターン

storageモジュールは `executeOpenstackApi()` を使わず `generateApiToken()` を直接使用する。
これはストレージAPIが独自のヘッダー操作（メタデータ設定、バイナリアップロード）を必要とするため。

```typescript
// src/features/openstack/storage/storage-client.ts（例外パターン）
import { generateApiToken } from "../common/generate-api-token.js";

export async function getStorageContainerList(path: string) {
	const apiToken = await generateApiToken();
	const url = `${OPENSTACK_OBJECT_STORAGE_BASE_URL}${path}`;
	const headers: Record<string, string> = {
		Accept: "application/json",
		"X-Auth-Token": apiToken,
	};
	const response = await fetch(url, { method: "GET", headers });
	return await formatResponse(response);
}
```

---

## 3. スキーマパターン

### Zod v4 スキーマ定義

- `.strict()` 必須（全オブジェクトに付与）
- `.describe()` で日本語の説明を付与
- 命名: `{Action}{Resource}RequestSchema`

```typescript
// src/features/openstack/compute/compute-schema.ts
import { z } from "zod";

export const CreateServerRequestSchema = z
	.object({
		server: z
			.object({
				flavorRef: z.string().describe("Flavor ID"),
				adminPass: z
					.string()
					.regex(/^...$/）
					.describe("サーバーの管理者/rootパスワード: ..."),
				block_device_mapping_v2: z
					.array(
						z
							.object({
								uuid: z.string().describe("起動元となるボリュームのUUID"),
							})
							.strict(),
					)
					.describe("1つ以上のボリュームマッピング"),
			})
			.strict(),
	})
	.strict();
```

### 命名パターン

| 操作 | 命名 | 例 |
|------|------|-----|
| 作成 | `Create{Resource}RequestSchema` | `CreateServerRequestSchema`, `CreateVolumeRequestSchema` |
| 更新 | `Update{Resource}RequestSchema` | `UpdateVolumeRequestSchema`, `UpdatePortRequestSchema` |
| 操作 | `{Action}{Resource}RequestSchema` | `OperateServerRequestSchema`, `AttachVolumeRequestSchema` |

### バリデーションメッセージ

enumフィールドには `message` オプションで日本語のエラーメッセージを付与する。

```typescript
direction: z
	.enum(["ingress", "egress"], {
		message: "通信の向きは 'ingress' または 'egress' を指定してください",
	})
	.describe("ルールの方向 (ingressまたはegress)"),
```

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

---

## 8. 命名規則

| 対象 | ケース | 例 |
|------|--------|-----|
| ファイル名 | kebab-case | `compute-client.ts`, `get-flavor-response-formatter.ts` |
| 関数名 | camelCase | `getCompute`, `formatResponse`, `generateApiToken` |
| 型名/インターフェース | PascalCase | `HttpMethod`, `ConoHaGetPaths`, `FlavorData` |
| 定数 | UPPER_SNAKE_CASE | `OPENSTACK_COMPUTE_BASE_URL`, `USER_AGENT` |
| スキーマ | PascalCase + `Schema`サフィックス | `CreateServerRequestSchema` |
| エクスポート定数（テーブル） | camelCase | `conohaGetHandlers`, `conohaPostHandlers` |

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

---

## 13. インポートルール

### ソースファイル（`src/**/*.ts`、テスト除外）

| ルール | 例 |
|--------|-----|
| 相対インポートに `.js` 拡張子必須 | `import { foo } from "./bar.js"` |
| 型インポートは `import type` を使用 | `import type { JsonObject } from "../../../types.js"` |
| Node.js組み込みモジュールは `node:` プレフィックス使用 | `import { Buffer } from "node:buffer"` |

### テストファイル（`*.test.ts`）

| ルール | 例 |
|--------|-----|
| `.js` 拡張子不要 | `import { getCompute } from "./compute-client"` |
| `vi.mock()` のパスも `.js` 拡張子不要 | `vi.mock("../common/openstack-client", () => ({ ... }))` |
| vitest関数は名前付きインポート | `import { beforeEach, describe, expect, it, vi } from "vitest"` |

### 外部パッケージ

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
```

---

## 14. Biome / フォーマッティングルール

### biome.json 設定

| 項目 | 設定 |
|------|------|
| インデント | タブ（幅2） |
| クォート | ダブルクォート |
| インポート整理 | 有効（`organizeImports: "on"`） |
| リンター | `recommended: true` |
| `noExplicitAny` | off |
| テストファイルのリンティング | 除外（`!**/src/**/*.test.ts`） |

### テストファイル除外

`biome.json` の `linter.includes` でテストファイルをリンティング対象から除外:

```json
{
	"linter": {
		"includes": ["**", "!**/src/**/*.test.ts"]
	}
}
```

### スタイルルール

以下のスタイルルールがerrorレベルで有効:

- `noParameterAssign` — パラメータへの再代入禁止
- `useAsConstAssertion` — `as const` の使用
- `useDefaultParameterLast` — デフォルトパラメータは末尾
- `useEnumInitializers` — enum初期化子の明示
- `useSelfClosingElements` — 自己閉じ要素の使用
- `useSingleVarDeclarator` — 変数宣言は1つずつ
- `noUnusedTemplateLiteral` — 不要なテンプレートリテラル禁止
- `useNumberNamespace` — Number名前空間の使用
- `noInferrableTypes` — 推論可能な型注釈の禁止
- `noUselessElse` — 不要なelse禁止
