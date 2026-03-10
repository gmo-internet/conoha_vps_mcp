---
id: 2
title: クライアントモジュールパターン
last-reviewed: 2026-03-10
enforcement-level: L2
related-rules: [B-1, B-2, B-3, B-4, B-5, B-6]
checked-by: [coding-pattern-check]
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
